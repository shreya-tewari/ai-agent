import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from graph import graph
from llm_client import llm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# NOTE: allow_origins=["*"] cannot be combined with allow_credentials=True —
# browsers reject that combination per the CORS spec. Set allow_credentials=True
# only once allow_origins lists your actual frontend origin(s) explicitly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestBody(BaseModel):
    query: str
    tone: str = "Professional"
    length: str = "Medium"
    language: str = "English"
    image_size: str = "Square"


class FollowupRequest(BaseModel):
    content: str
    question: str


class RefineRequest(BaseModel):
    content: str
    action: str


@app.post("/generate")
async def generate(body: RequestBody):
    # graph.invoke is a blocking sync call -- run it off the event loop so
    # one slow generation doesn't stall every other request FastAPI is serving.
    result = await asyncio.to_thread(
        graph.invoke,
        {
            "request": body.query,
            "tone": body.tone,
            "length": body.length,
            "language": body.language,
            "image_size": body.image_size,
        },
    )

    if result.get("error"):
        return {"type": "error", "error": result["error"]}

    content_type = result.get("content_type")

    if content_type == "IMAGE":
        return {
            "type": "image",
            "image_base64": result.get("image_base64"),
        }

    if content_type == "CAPTION":
        return {
            "type": "caption",
            "caption": result.get("caption", ""),
            "hashtags": result.get("hashtags", []),
        }

    content = result.get("content") or "No content generated"

    async def stream():
        # Stream in small chunks; preserves markdown formatting on the client.
        for i in range(0, len(content), 4):
            yield content[i:i + 4]
            await asyncio.sleep(0.05)

    return StreamingResponse(stream(), media_type="text/plain")


@app.post("/followup")
async def followup(body: FollowupRequest):
    prompt = f"""
Generated Content:
{body.content}

User Question:
{body.question}

Answer the user's question based on the generated content.
"""
    try:
        response = await asyncio.to_thread(llm.invoke, prompt)
        return {"output": response.content}
    except Exception as e:
        logger.error(f"Followup failed: {e}")
        return {"error": str(e)}


@app.post("/refine")
async def refine(body: RefineRequest):
    prompt = f"""
Existing Content:
{body.content}

Task:
{body.action}

Improve the content according to the task.
Return only the updated content.
"""
    try:
        response = await asyncio.to_thread(llm.invoke, prompt)
        return {"output": response.content}
    except Exception as e:
        logger.error(f"Refine failed: {e}")
        return {"error": str(e)}
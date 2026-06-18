from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import asyncio

from graph import graph
from agents.content import llm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestBody(BaseModel):
    query: str
    tone: str
    length: str
    language: str

class FollowupRequest(BaseModel):
    content: str
    question: str


class RefineRequest(BaseModel):
    content: str
    action: str

@app.post("/generate")
async def generate(body: RequestBody):

    async def stream():

        result = graph.invoke({
            "request": body.query,
            "tone": body.tone,
            "length": body.length,
            "language": body.language,
        })

        content = (
            result.get("content")
            or "No content generated"
        )

        # Stream character-by-character
        # Preserves markdown formatting
        for i in range(0, len(content), 4):
            yield content[i:i+4]
            await asyncio.sleep(0.05)

    return StreamingResponse(
        stream(),
        media_type="text/plain"
    )
@app.post("/followup")
async def followup(body: FollowupRequest):

    prompt = f"""
Generated Content:

{body.content}

User Question:

{body.question}

Answer the user's question based on the generated content.
"""

    response = llm.invoke(prompt)

    return {
        "output": response.content
    }
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

    response = llm.invoke(prompt)

    return {
        "output": response.content
    }
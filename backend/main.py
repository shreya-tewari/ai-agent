from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import asyncio

from graph import graph

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
            await asyncio.sleep(0.01)

    return StreamingResponse(
        stream(),
        media_type="text/plain"
    )
from typing import TypedDict

class AgentState(TypedDict):

    request: str

    content_type: str

    content: str

    tone: str

    length: str

    language: str
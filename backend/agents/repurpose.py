from dotenv import load_dotenv
from langchain_groq import ChatGroq
import json

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile"
)


def repurpose_agent(state):

    content = state["draft"]

    prompt = f"""
    Repurpose the following content into:

    1. LinkedIn Post
    2. Caption
    3. 10 Hashtags
    4. Video Script
    5. Presentation Outline

    Return JSON ONLY.

    Content:

    {content}
    """

    response = llm.invoke(prompt)

    try:
        state["repurposed_content"] = json.loads(response.content)

    except Exception:

        state["repurposed_content"] = {
            "output": response.content
        }

    return state
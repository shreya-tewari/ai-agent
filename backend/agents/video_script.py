from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile"
)


def video_script_agent(state):

    content_type = state["content_type"]

    if content_type not in ["BLOG", "VIDEO_SCRIPT"]:
        state["video_script"] = None
        return state

    content = state["content"]

    prompt = f"""
    Create a video script from this content.

    Include:

    Scene 1
    Scene 2
    Scene 3

    Content:
    {content}
    """

    response = llm.invoke(prompt)

    state["video_script"] = response.content

    return state
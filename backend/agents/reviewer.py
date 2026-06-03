from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile"
)

def reviewer(state):

    content = state["content"]

    prompt = f"""
    Improve the following content.

    Requirements:

    - Professional tone
    - Better readability
    - Better grammar
    - Better formatting
    - Keep markdown headings

    Content:

    {content}

    Return only final improved content.
    """

    response = llm.invoke(prompt)

    state["final_output"] = response.content

    return state
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7
)


def content_agent(state):

    content_type = state["content_type"]
    request = state["request"]

    tone = state.get("tone", "Professional")
    length = state.get("length", "Medium")
    language = state.get("language", "English")

    print("CONTENT TYPE:", content_type)

    # ==========================
    # BLOG
    # ==========================
    if content_type == "BLOG":
        prompt = f"""
Write a blog in {language}.

Topic:
{request}

IMPORTANT:

The first line MUST start with #

Example:

# Blog Title

## Introduction

Paragraph

## Main Section 1

Paragraph

## Main Section 2

Paragraph

## Key Benefits

- Point 1
- Point 2
- Point 3

## Conclusion

Paragraph

Return ONLY markdown.
"""

    # ==========================
    # HASHTAGS
    # ==========================
    elif content_type == "HASHTAGS":

        prompt = f"""
Generate EXACTLY 15 social media hashtags about:

{request}

Language: {language}

VERY IMPORTANT:

Return ONLY hashtags.

Example:

#AI
#MachineLearning
#ArtificialIntelligence

Rules:
- No title
- No introduction
- No explanation
- No numbering
- No bullets
- No extra text
- One hashtag per line
"""

    # ==========================
    # CAPTION
    # ==========================
    elif content_type == "CAPTION":

        prompt = f"""
Generate ONE social media caption.

Topic:
{request}

Tone:
{tone}

Language:
{language}

Rules:
- Return ONLY caption
- No explanation
- No title
- No introduction
- No quotation marks
- Maximum 2-3 lines
- Add relevant emojis if suitable
"""

    # ==========================
    # VIDEO SCRIPT
    # ==========================
    elif content_type == "VIDEO_SCRIPT":

        prompt = f"""
Create a short video script.

Topic:
{request}

Language:
{language}

Tone:
{tone}

Return ONLY script.

Format:

HOOK:

MAIN CONTENT:

CTA:
"""

    # ==========================
    # PRESENTATION
    # ==========================
    elif content_type == "PRESENTATION":

        prompt = f"""
Create presentation slides.

Topic:
{request}

Language:
{language}

Return ONLY slides.

Format:

# Slide 1: Title

- Point 1
- Point 2

# Slide 2

- Point 1
- Point 2

# Slide 3

- Point 1
- Point 2
"""

    # ==========================
    # REPURPOSE CONTENT
    # ==========================
    elif content_type == "REPURPOSING":

        prompt = f"""
Repurpose the following content.

Content:
{request}

Language:
{language}

Return ONLY:

# LinkedIn Post

(content)

# Instagram Caption

(content)

# Twitter/X Post

(content)

No explanation.
"""

    # ==========================
    # DEFAULT
    # ==========================
    else:

        prompt = f"""
Generate content in {language}.

Topic:
{request}

Return ONLY final content.
"""

    response = llm.invoke(prompt)

    final_output = response.content.strip()

    # Remove accidental markdown fences
    final_output = (
        final_output
        .replace("```markdown", "")
        .replace("```", "")
        .strip()
    )

    state["content"] = final_output

    return state
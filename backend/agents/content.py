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
Length:
{length}
If Length = Short:
500-700 words

If Length = Medium:
800-1200 words

If Length = Long:
1500-2500 words

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
 

    # ==========================
    # CAPTION
    # ==========================
    elif content_type == "CAPTION":

        prompt = f"""
Generate:

1. A social media caption
2. 10 relevant hashtags

Topic:
{request}

Tone:
{tone}

Language:
{language}

Content Length:
{length}

Rules:

If Length = Short:
- 2-3 lines

If Length = Medium:
- 5-8 lines

If Length = Long:
- 10-15 lines

Include CTA.

Return only final output.
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
Length:
{length}
If Length = Short:
5 slides

If Length = Medium:
8 slides

If Length = Long:
12-15 slides

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
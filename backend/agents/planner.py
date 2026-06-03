def planner(state):

    query = (
        state["request"]
        .lower()
        .strip()
    )

    # HASHTAGS
    if (
        "hashtag" in query
        or "hashtags" in query
        or "#" in query
    ):

        state["content_type"] = "HASHTAGS"

    # CAPTION
    elif (
        "caption" in query
        or "instagram caption" in query
    ):

        state["content_type"] = "CAPTION"

    # VIDEO SCRIPT
    elif (
        "script" in query
        or "video" in query
        or "reel" in query
    ):

        state["content_type"] = "VIDEO_SCRIPT"

    # PRESENTATION
    elif (
        "presentation" in query
        or "ppt" in query
        or "slides" in query
    ):

        state["content_type"] = "PRESENTATION"

    # REPURPOSING
    elif (
        "repurpose" in query
        or "repurposing" in query
    ):

        state["content_type"] = "REPURPOSING"

    # BLOG
    else:

        state["content_type"] = "BLOG"

    return state
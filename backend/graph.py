from langgraph.graph import StateGraph

from state import AgentState
from agents.planner import planner
from agents.content import content_agent
from agents.reviewer import reviewer

workflow = StateGraph(AgentState)

workflow.add_node("planner", planner)
workflow.add_node("writer", content_agent)
workflow.add_node("reviewer", reviewer)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "writer")
workflow.add_edge("writer", "reviewer")
workflow.set_finish_point("reviewer")

graph = workflow.compile()
from langgraph.graph import StateGraph

from state import AgentState

from agents.planner import planner
from agents.content import content_agent

workflow = StateGraph(AgentState)

workflow.add_node(
    "planner",
    planner
)

workflow.add_node(
    "writer",
    content_agent
)

workflow.set_entry_point(
    "planner"
)

workflow.add_edge(
    "planner",
    "writer"
)

workflow.set_finish_point(
    "writer"
)

graph = workflow.compile()
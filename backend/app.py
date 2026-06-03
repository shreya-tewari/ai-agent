from graph import graph

query = input("Enter request: ")

result = graph.invoke(
    {
        "request": query
    }
)

print(result["final_output"])
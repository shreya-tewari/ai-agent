import { useState } from "react";

function Generator() {

  const [query,setQuery] = useState("");
  const [result,setResult] = useState("");
  const [loading,setLoading] = useState(false);

  const generateContent = async () => {

    try{

      setLoading(true);

      const res = await fetch(
        "http://127.0.0.1:8000/generate",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
          },
          body:JSON.stringify({
            query,
          }),
        }
      );

      const data = await res.json();

      setResult(
        data.final_output ||
        data.content ||
        "No content generated"
      );

    }catch(error){

      setResult(
        "Backend connection failed"
      );

      console.log(error);

    }finally{
      setLoading(false);
    }
  };

  return (
    <section className="generator">

      <h2>Generate Content</h2>

      <textarea
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        placeholder="Write a blog about AI hiring"
      />

      <button onClick={generateContent}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <pre>{result}</pre>

    </section>
  );
}

export default Generator;
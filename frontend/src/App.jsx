import { useState, useRef, useEffect } from "react";

import ReactMarkdown from "react-markdown";

import {
  PenSquare,
  Captions,
  Hash,
  Video,
  Presentation,
  RefreshCcw,
  Copy,
  Sparkles,
} from "lucide-react";

import "./App.css";

const API_BASE = "https://ai-agent-d7x5.onrender.com";

export default function App() {

  const [followup, setFollowup] =
    useState("");
  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
  useState("");

  // IMAGE and CAPTION responses aren't plain streamed text, so they get
  // their own state instead of being force-fit into `result`.
  const [imageBase64, setImageBase64] =
  useState(null);

  const [caption, setCaption] =
  useState(null);

  const [hashtags, setHashtags] =
  useState([]);

  const [messages, setMessages] =
  useState([]);

  const [history, setHistory] = useState(() => {
     const saved = localStorage.getItem("chatHistory");
     return saved ? JSON.parse(saved) : [];
});

  const [tone, setTone] =
    useState("Professional");

  const [length, setLength] =
    useState("Medium");

  const [language, setLanguage] =
    useState("English");

  const [sidebarOpen, setSidebarOpen] =
  useState(true);

  const [searchTerm, setSearchTerm] =
  useState("");

  const [sidebarWidth, setSidebarWidth] =
  useState(260);

  const [followupLoading, setFollowupLoading] =
  useState(false);

  const [refineLoading, setRefineLoading] =
  useState(false);

  // Auto-scrolls the output panel whenever new content lands -- covers
  // initial generation, follow-up answers, and refine actions, since all
  // three end up updating `result` (or image/caption state).
  const outputEndRef = useRef(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [result, caption, imageBase64]);

  const generateContent = async () => {

    if (!query.trim()) return;

    setLoading(true);

    setResult("");
    setImageBase64(null);
    setCaption(null);
    setHashtags([]);

    try {

      const response = await fetch(
        `${API_BASE}/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            query,
            tone,
            length,
            language,
          }),
        }
      );

      // The backend returns plain JSON for IMAGE and CAPTION types, and a
      // streamed text/plain body for everything else. Content-Type tells
      // us which one we got, so we don't try to stream-decode an image.
      const contentType =
        response.headers.get("content-type") || "";

      let newChat = null;

      if (contentType.includes("application/json")) {

        const data = await response.json();

        if (data.type === "error" || data.error) {
          alert(data.error || "Something went wrong.");
          setLoading(false);
          return;
        }

        if (data.type === "image") {

          setImageBase64(data.image_base64);

          newChat = {
            query,
            type: "image",
            imageBase64: data.image_base64,
            tone,
            length,
            language,
          };

        } else if (data.type === "caption") {

          setCaption(data.caption);
          setHashtags(data.hashtags || []);

          newChat = {
            query,
            type: "caption",
            caption: data.caption,
            hashtags: data.hashtags || [],
            tone,
            length,
            language,
          };

        }

      } else {

        const reader =
          response.body.getReader();

        const decoder =
          new TextDecoder();

        let fullText = "";

        while (true) {

          const {
            done,
            value
          } = await reader.read();

          if (done) break;

          const chunk =
            decoder.decode(value);

          fullText += chunk;

          setResult(fullText);

        }

        newChat = {
          query,
          type: "text",
          response: fullText,
          tone,
          length,
          language,
        };

      }

      if (newChat) {

        const updatedHistory = [
          newChat,
          ...history.filter(
            (item) => item.query !== query),
        ];

        setHistory(updatedHistory);

        localStorage.setItem(
          "chatHistory",
          JSON.stringify(updatedHistory)
        );

      }

    } catch (err) {

      console.error(err);

      alert(
        "Backend connection failed"
      );

    }

    setLoading(false);

  };
  const askFollowup = async () => {

  if (!followup.trim() || followupLoading) return;

  setFollowupLoading(true);

  try {

    const response = await fetch(
      `${API_BASE}/followup`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          content: result,
          question: followup,
        }),
      }
    );

    const data = await response.json();

    
  const updatedResult =
  result +
  "\n\n---\n\n" +
  "### Question\n" +
  followup +
  "\n\n" +
  "### Answer\n" +
  data.output;

setResult(updatedResult);
const updatedHistory = history.map((item) => {

  if (item.query === query) {

    return {
      ...item,
      response: updatedResult,
    };

  }

  return item;

});

setHistory(updatedHistory);

localStorage.setItem(
  "chatHistory",
  JSON.stringify(updatedHistory)
);

    setFollowup("");

  } catch (err) {

    console.error(err);

    alert("Failed to get an answer. Please try again.");

  }

  setFollowupLoading(false);

};


const refineContent = async (action) => {

  if (refineLoading) return;

  setRefineLoading(true);

  try {

    const response = await fetch(
      `${API_BASE}/refine`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          content: result,
          action,
        }),
      }
    );

    const data = await response.json();

    
  const updatedResult =
  result +
  "\n\n---\n\n" +
  "### Action: " +
  action +
  "\n\n" +
  data.output;

setResult(updatedResult);
const updatedHistory = history.map((item) => {

  if (item.query === query) {

    return {
      ...item,
      response: updatedResult,
    };

  }

  return item;

});

setHistory(updatedHistory);

localStorage.setItem(
  "chatHistory",
  JSON.stringify(updatedHistory)
);

  } catch (err) {

    console.error(err);

    alert("Failed to refine content. Please try again.");

  }

  setRefineLoading(false);

};
  const copyContent = () => {

    const textToCopy = caption
      ? `${caption}\n\n${hashtags.join(" ")}`
      : result;

    if (!textToCopy) return;

    navigator.clipboard.writeText(
      textToCopy
    );

  };
  const startResize = (e) => {

  const startX = e.clientX;

  const startWidth =
    sidebarWidth;

  const handleMouseMove = (e) => {

    const newWidth =
      startWidth +
      (e.clientX - startX);

    if (
      newWidth >= 180 &&
      newWidth <= 450
    ) {
      setSidebarWidth(
        newWidth
      );
    }
  };

  const handleMouseUp = () => {

    document.removeEventListener(
      "mousemove",
      handleMouseMove
    );

    document.removeEventListener(
      "mouseup",
      handleMouseUp
    );
  };

  document.addEventListener(
    "mousemove",
    handleMouseMove
  );

  document.addEventListener(
    "mouseup",
    handleMouseUp
  );
};

  return (

    <div className="app">

      {/* SIDEBAR */}

 <div
  className={`sidebar ${
    sidebarOpen ? "open" : "closed"
  }`}
  style={{
    width: sidebarOpen
      ? `${sidebarWidth}px`
      : "0px"
  }}
>


        <div className="sidebar-top">

  <div className="logo">

    <div className="logo-icon">
      <Sparkles size={18} />
    </div>

    {sidebarOpen && (
      <h1>AI Studio</h1>
    )}

  </div>

</div>
<button
  className="new-chat-btn"
  onClick={() => {

    setQuery("");
    setResult("");
    setImageBase64(null);
    setCaption(null);
    setHashtags([]);

  }}
>
  {sidebarOpen
    ? "New Chat"
    : "+"}
</button>

          {sidebarOpen && (

<input
  className="search-chat"
  placeholder="Search chats..."
  value={searchTerm}
  onChange={(e) =>
    setSearchTerm(e.target.value)
  }
/>

)}
        {/* HISTORY */}

        <div className="history">

          <h3>
            RECENT CHATS
          </h3>

          {
            history.length === 0 ? (

              <div className="empty-history">

                No recent chats

              </div>

            ) : (

              history
.filter((item) =>
  item.query
    .toLowerCase()
    .includes(
      searchTerm.toLowerCase()
    )
)
.map((item, index) => (

                  <div
  key={index}
  className="history-card"
  onClick={() => {
    setQuery(item.query);
    setTone(item.tone);
    setLength(item.length);
    setLanguage(item.language);

    // Restore whichever output type this history item was.
    setResult(item.type === "text" ? item.response : "");
    setImageBase64(item.type === "image" ? item.imageBase64 : null);
    setCaption(item.type === "caption" ? item.caption : null);
    setHashtags(item.type === "caption" ? item.hashtags || [] : []);
  }}
>

  <div className="history-content">

    <div className="dot"></div>

    <div>
      <p>{item.query}</p>
    </div>

  </div>

  <div
    className="delete-btn"
    onClick={(e) => {
      e.stopPropagation();

      const updated = history.filter(
        (_, i) => i !== index
      );

      setHistory(updated);

      localStorage.setItem(
        "chatHistory",
        JSON.stringify(updated)
      );
    }}
  >
    ✕
  </div>

</div>
              ))
            )
          }

        </div>
           <div
  className="sidebar-resizer"
  onMouseDown={startResize}
/>
      </div>

      {/* MAIN */}

      <div className="main">
        <button
  className="mobile-menu-btn"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  ☰
</button>

        {/* HERO */}

        <div className="hero">

          <h1>

            One AI Agent

            <br />

            <span>
              For All Content
            </span>

          </h1>

          <p>

            Generate blogs,
            captions, hashtags,
            presentations and
            repurposed content
            instantly.

          </p>

        </div>

        {/* WORKSPACE */}

        <div className="workspace">

          {/* INPUT */}

          <div className="input-panel">

            <div className="panel-title">

              <div className="panel-icon">

                ✦

              </div>

              <h2>
                Your Input
              </h2>

            </div>

            <textarea
              placeholder="Write your prompt here..."
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
            />

            {/* OPTIONS */}

            <div className="chips">

              <select
                className="chip-select"
                value={tone}
                onChange={(e) =>
                  setTone(
                    e.target.value
                  )
                }
              >

                <option>
                  Professional
                </option>

                <option>
                  Creative
                </option>

                <option>
                  Casual
                </option>

              </select>

              <select
                className="chip-select"
                value={length}
                onChange={(e) =>
                  setLength(
                    e.target.value
                  )
                }
              >

                <option>
                  Short
                </option>

                <option>
                  Medium
                </option>

                <option>
                  Long
                </option>

              </select>

              <select
                className="chip-select"
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value
                  )
                }
              >

                <option>
                  English
                </option>

                <option>
                  Hindi
                </option>

                <option>
                  Spanish
                </option>

              </select>

            </div>

            {/* BUTTON */}

            <button
              className="generate-btn"
              onClick={generateContent}
            >

              {
                loading
                  ? "Generating..."
                  : "Generate Content"
              }

            </button>

          </div>

          {/* OUTPUT */}

          <div className="output-panel">

            <div className="output-top">

              <div className="panel-title">

                <div className="panel-icon">

                  ✦

                </div>

                <h2>
                  Generated Output
                </h2>

              </div>

              <div className="output-actions">

                <button
                  onClick={
                    copyContent
                  }
                >

                  <Copy size={16} />

                </button>

              </div>

            </div>

            {/* OUTPUT CONTENT */}

            <div className="output-content">

              {
                imageBase64 ? (

                  <img
                    src={`data:image/png;base64,${imageBase64}`}
                    alt={query}
                    style={{ maxWidth: "100%", borderRadius: "8px" }}
                  />

                ) : caption ? (

                  <div className="caption-output">

                    <p>{caption}</p>

                    <p className="hashtags">
                      {hashtags.join(" ")}
                    </p>

                  </div>

                ) : result ? (

                  <ReactMarkdown>
                    {result}
                  </ReactMarkdown>

                ) : (

                  <div className="empty-output">

                    Generated content
                    will appear here...

                  </div>

                )
              }

              <div ref={outputEndRef} />

            </div>

            {(result || caption) && (

  <>
    <div className="refine-actions">

      <button
        disabled={refineLoading}
        onClick={() =>
          refineContent("Expand")
        }
      >
        {refineLoading ? "Working..." : "Expand"}
      </button>

      <button
        disabled={refineLoading}
        onClick={() =>
          refineContent("Rewrite")
        }
      >
        {refineLoading ? "Working..." : "Rewrite"}
      </button>

      <button
        disabled={refineLoading}
        onClick={() =>
          refineContent("Improve SEO")
        }
      >
        {refineLoading ? "Working..." : "Improve SEO"}
      </button>

    </div>

    <div className="followup-box">

      <input
        type="text"
        placeholder="Ask a follow-up question..."
        value={followup}
        disabled={followupLoading}
        onChange={(e) =>
          setFollowup(
            e.target.value
          )
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && !followupLoading) {
            askFollowup();
          }
        }}
      />

      <button
        onClick={askFollowup}
        disabled={followupLoading}
      >
        {followupLoading ? "Asking..." : "Ask"}
      </button>

    </div>

  </>

)}

          </div>

        </div>

      </div>

    </div>

  );

}
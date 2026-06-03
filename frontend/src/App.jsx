import { useState } from "react";

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

export default function App() {

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState("");

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

  const generateContent = async () => {

    if (!query.trim()) return;

    setLoading(true);

    setResult("");

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/generate",
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

      const newChat = {
         query,
         response: fullText,
         tone,
         length,
         language,
         time: new Date().toLocaleTimeString(),
      };

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

    } catch (err) {

      console.error(err);

      alert(
        "Backend connection failed"
      );

    }

    setLoading(false);

  };

  const copyContent = () => {

    navigator.clipboard.writeText(
      result
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
  className="sidebar"
  style={{
    width: `${sidebarWidth}px`
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
    setResult(item.response);
    setTone(item.tone);
    setLength(item.length);
    setLanguage(item.language);
  }}
>

  <div className="history-content">

    <div className="dot"></div>

    <div>
      <p>{item.query}</p>
      <span>{item.time}</span>
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
                result ? (

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

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
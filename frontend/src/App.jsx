import { useState, useRef, useEffect, useCallback } from "react";
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
import { Toast, ToastContainer } from "./Toast";
import { LoadingSkeleton, LoadingPulse } from "./LoadingSkeleton";
import "./App.css";

const API_BASE = "https://ai-agent-d7x5.onrender.com";

// Custom hook for toast notifications
function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export default function App() {
  // Toast management
  const { toasts, addToast, removeToast } = useToast();

  // Main state
  const [followup, setFollowup] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [caption, setCaption] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // Settings
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState("English");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);

  const outputEndRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [result, caption, imageBase64]);

  // Generate content with improved error handling
  const generateContent = async () => {
    if (!query.trim()) {
      addToast("Please enter a prompt", "info");
      return;
    }

    setLoading(true);
    setResult("");
    setImageBase64(null);
    setCaption(null);
    setHashtags([]);

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, tone, length, language }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let newChat = null;

      if (contentType.includes("application/json")) {
        const data = await response.json();

        if (data.type === "error" || data.error) {
          throw new Error(data.error || "Generation failed");
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
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
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
          ...history.filter((item) => item.query !== query),
        ];
        setHistory(updatedHistory);
        localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
        addToast("Content generated successfully!", "success");
      }
    } catch (error) {
      console.error("Generation error:", error);
      addToast(
        error.message || "Failed to generate content. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Improved copy function with feedback
  const copyContent = () => {
    const textToCopy = caption
      ? `${caption}\n\n${hashtags.join(" ")}`
      : result;

    if (!textToCopy) {
      addToast("No content to copy", "info");
      return;
    }

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        addToast("Copied to clipboard!", "success", 2000);
      })
      .catch(() => {
        addToast("Failed to copy. Please try again.", "error");
      });
  };

  // Improved followup with better error handling
  const askFollowup = async () => {
    if (!followup.trim() || followupLoading) return;

    setFollowupLoading(true);

    try {
      const response = await fetch(`${API_BASE}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result,
          question: followup,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

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
          return { ...item, response: updatedResult };
        }
        return item;
      });

      setHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
      setFollowup("");
      addToast("Follow-up answer added!", "success", 2000);
    } catch (error) {
      console.error("Followup error:", error);
      addToast(
        "Couldn't add follow-up. Please try again.",
        "error"
      );
    } finally {
      setFollowupLoading(false);
    }
  };

  // Improved refine with better error handling
  const refineContent = async (action) => {
    if (refineLoading) return;

    setRefineLoading(true);

    try {
      const response = await fetch(`${API_BASE}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error("Refinement failed");
      }

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
          return { ...item, response: updatedResult };
        }
        return item;
      });

      setHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
      addToast(`Content ${action.toLowerCase()}ed!`, "success", 2000);
    } catch (error) {
      console.error("Refine error:", error);
      addToast(
        `Failed to ${action.toLowerCase()} content. Please try again.`,
        "error"
      );
    } finally {
      setRefineLoading(false);
    }
  };

  // Sidebar resize handler
  const startResize = (e) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth >= 180 && newWidth <= 450) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // New chat handler
  const startNewChat = () => {
    setQuery("");
    setResult("");
    setImageBase64(null);
    setCaption(null);
    setHashtags([]);
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* SIDEBAR */}
      <div
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : "0px",
        }}
      >
        <div className="logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          {sidebarOpen && <h1>AI Studio</h1>}
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          {sidebarOpen ? "New Chat" : "+"}
        </button>

        {sidebarOpen && (
          <input
            className="search-chat"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}

        {/* HISTORY */}
        <div className="history">
          <h3>RECENT CHATS</h3>
          {history.length === 0 ? (
            <div className="empty-history">No recent chats</div>
          ) : (
            history
              .filter((item) =>
                item.query.toLowerCase().includes(searchTerm.toLowerCase())
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
                    setResult(item.type === "text" ? item.response : "");
                    setImageBase64(
                      item.type === "image" ? item.imageBase64 : null
                    );
                    setCaption(item.type === "caption" ? item.caption : null);
                    setHashtags(
                      item.type === "caption" ? item.hashtags || [] : []
                    );
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
                      const updated = history.filter((_, i) => i !== index);
                      setHistory(updated);
                      localStorage.setItem(
                        "chatHistory",
                        JSON.stringify(updated)
                      );
                      addToast("Chat deleted", "info", 2000);
                    }}
                  >
                    ✕
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="sidebar-resizer" onMouseDown={startResize} />
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
            <span>For All Content</span>
          </h1>
          <p>
            Generate blogs, captions, hashtags, presentations and repurposed
            content instantly.
          </p>
        </div>

        {/* WORKSPACE */}
        <div className="workspace">
          {/* INPUT */}
          <div className="input-panel">
            <div className="panel-title">
              <div className="panel-icon">✦</div>
              <h2>Your Input</h2>
            </div>

            <textarea
              placeholder="Write your prompt here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />

            {/* OPTIONS */}
            <div className="chips">
              <select
                className="chip-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option>Professional</option>
                <option>Creative</option>
                <option>Casual</option>
              </select>

              <select
                className="chip-select"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              >
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
              </select>

              <select
                className="chip-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Spanish</option>
              </select>
            </div>

            {/* BUTTON */}
            <button
              className="generate-btn"
              onClick={generateContent}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Content"}
            </button>
          </div>

          {/* OUTPUT */}
          <div className="output-panel">
            <div className="output-top">
              <div className="panel-title">
                <div className="panel-icon">✦</div>
                <h2>Generated Output</h2>
              </div>
              <div className="output-actions">
                <button onClick={copyContent} title="Copy to clipboard">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* OUTPUT CONTENT */}
            <div className="output-content">
              {loading ? (
                <LoadingSkeleton lines={5} />
              ) : imageBase64 ? (
                <img
                  src={`data:image/png;base64,${imageBase64}`}
                  alt={query}
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
              ) : caption ? (
                <div className="caption-output">
                  <p>{caption}</p>
                  <p className="hashtags">{hashtags.join(" ")}</p>
                </div>
              ) : result ? (
                <ReactMarkdown>{result}</ReactMarkdown>
              ) : (
                <div className="empty-output">
                  Generated content will appear here...
                </div>
              )}

              <div ref={outputEndRef} />
            </div>

            {(result || caption) && !loading && (
              <>
                <div className="refine-actions">
                  <button
                    disabled={refineLoading}
                    onClick={() => refineContent("Expand")}
                  >
                    {refineLoading ? "Working..." : "Expand"}
                  </button>

                  <button
                    disabled={refineLoading}
                    onClick={() => refineContent("Rewrite")}
                  >
                    {refineLoading ? "Working..." : "Rewrite"}
                  </button>

                  <button
                    disabled={refineLoading}
                    onClick={() => refineContent("Improve SEO")}
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
                    onChange={(e) => setFollowup(e.target.value)}
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
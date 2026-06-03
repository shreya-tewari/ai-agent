import "./Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-content">

        <h1>
          One AI Agent
          <br />
          For All Your Content
        </h1>

        <p>
          Generate blogs, captions, hashtags,
          presentations and repurposed content
          in seconds using AI.
        </p>

        <div className="buttons">
          <button>Generate Content</button>
          <button className="secondary">
            Explore Features
          </button>
        </div>

      </div>

      <div className="hero-card">

        <div className="glass-card">

          <h3>AI Workspace</h3>

          <div className="mock-card">
            Blog Generated ✓
          </div>

          <div className="mock-card">
            Caption Created ✓
          </div>

          <div className="mock-card">
            Hashtags Ready ✓
          </div>

          <div className="mock-card">
            Presentation Outline ✓
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;
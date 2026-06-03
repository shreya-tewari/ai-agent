const items = [
  "Blog Writer",
  "Hashtag Generator",
  "Caption Creator",
  "Presentation Builder",
  "Content Repurposer",
  "Viral Hook Generator",
];

function Features() {
  return (
    <section className="features">

      <h2>AI Tools</h2>

      <div className="grid">

        {items.map((item) => (
          <div className="feature-card" key={item}>
            {item}
          </div>
        ))}

      </div>

    </section>
  );
}

export default Features;
import "./LoadingSkeleton.css";

export function LoadingSkeleton({ lines = 4, type = "text" }) {
  if (type === "image") {
    return (
      <div className="skeleton-image">
        <div className="skeleton-shimmer"></div>
      </div>
    );
  }

  return (
    <div className="skeleton-container">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-line ${i === lines - 1 ? "skeleton-short" : ""}`}>
          <div className="skeleton-shimmer"></div>
        </div>
      ))}
    </div>
  );
}

export function LoadingPulse() {
  return (
    <div className="loading-pulse">
      <div className="pulse-dot"></div>
      <div className="pulse-dot"></div>
      <div className="pulse-dot"></div>
    </div>
  );
}
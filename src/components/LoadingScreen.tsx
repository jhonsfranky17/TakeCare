// Minimal loading state: the brand mark with a pulse traveling once along
// the heartbeat stroke, then fading and looping -- matches the static splash
// markup in index.html (kept in sync manually; that copy has to be plain
// inline SVG since it renders before any JS/CSS loads).
const HEARTBEAT_PATH = "M6 24h7.5l4-9.5L24 32l4-9h10";

export function LoadingScreen(): JSX.Element {
  return (
    <div
      style={{
        // A flex:1 wouldn't do anything here -- callers render this inside
        // App.tsx's route-content div, which isn't itself a flex container,
        // so this needs to size off the ancestor's definite height instead.
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "var(--tc-cta)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--lima-950)",
          boxShadow: "0 6px 18px rgba(149, 220, 6, 0.32)",
        }}
      >
        <svg width={38} height={38} viewBox="0 0 48 48" role="img" aria-label="Loading">
          <rect
            x={7}
            y={18}
            width={34}
            height={16}
            rx={8}
            transform="rotate(-38 24 26)"
            fill="currentColor"
            opacity={0.2}
          />
          <path
            d={HEARTBEAT_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle r={3} fill="currentColor">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={HEARTBEAT_PATH} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.9;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
  );
}

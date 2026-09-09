import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// The static #tc-splash in index.html covers the gap before this module ran
// at all; React's own LoadingScreen (identical look) takes over seamlessly
// from here, so it's safe to drop as soon as the first paint has happened.
requestAnimationFrame(() => {
  document.getElementById("tc-splash")?.remove();
});

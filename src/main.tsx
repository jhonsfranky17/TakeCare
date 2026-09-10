import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import { initTheme } from "./lib/theme";

// Before the first render, so a stored light/dark override applies from the
// very first paint -- index.html's inline script does the same for the
// static splash, which paints even earlier than this module runs at all.
initTheme();

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

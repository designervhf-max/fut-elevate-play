import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// ---- Diagnostic logging (temporary) ----
console.log("[boot] main.tsx loading");
console.log("[boot] React =", React, "version:", (React as any)?.version);
console.log("[boot] React.useEffect =", React?.useEffect);
console.log("[boot] HelmetProvider =", HelmetProvider);

function showOverlay(title: string, detail: string) {
  try {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#7f1d1d;color:#fff;padding:16px;font:12px/1.4 monospace;white-space:pre-wrap;overflow:auto";
    el.textContent = `${title}\n\n${detail}`;
    document.body.appendChild(el);
  } catch {}
}

window.addEventListener("error", (e) => {
  console.error("[global error]", e.error || e.message, e);
  showOverlay(
    "Runtime error",
    `${e.message}\n\n${(e.error && e.error.stack) || ""}`,
  );
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
  showOverlay(
    "Unhandled promise rejection",
    `${e.reason?.message || e.reason}\n\n${e.reason?.stack || ""}`,
  );
});

class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    showOverlay(
      "React render error",
      `${error.message}\n\nComponent stack:${info.componentStack}\n\nStack:\n${error.stack}`,
    );
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

console.log("[boot] mounting React tree");
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </Boundary>,
);
console.log("[boot] render() called");

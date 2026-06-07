import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { applyBranding } from "./lib/branding";

applyBranding();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(<App />);

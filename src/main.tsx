import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

console.log(
  '%c🚀 SPMB Registration Platform %cby @rizaa119 %chttps://www.tiktok.com/@rizaa119',
  'font-weight:bold;font-size:14px;color:#1A237E;',
  'color:#F9A825;',
  'color:#666;font-size:10px;'
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

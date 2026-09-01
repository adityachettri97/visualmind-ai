import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initDatasetSync } from "./sync/datasetSync";
import { initChatSync } from "./sync/chatSync";
import "./index.css";
import "./styles/glass.css";

initDatasetSync();
initChatSync();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

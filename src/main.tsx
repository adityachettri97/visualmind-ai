import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initDatasetSync } from "./sync/datasetSync";
import { initChatSync } from "./sync/chatSync";
import { useThemeStore } from "./store/themeStore";
import "./index.css";
import "./styles/glass.css";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

applyTheme(useThemeStore.getState().theme);
useThemeStore.subscribe((state) => applyTheme(state.theme));

initDatasetSync();
initChatSync();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

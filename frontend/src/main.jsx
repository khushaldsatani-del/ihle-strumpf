import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/manrope";
import "@fontsource-variable/plus-jakarta-sans";
import { i18nReady } from "./i18n/index.js";
import "./styles/global.css";
import App from "./App.jsx";

// Render once the remembered language file is loaded, so the page never flashes German first
i18nReady.then(() =>
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  ),
);

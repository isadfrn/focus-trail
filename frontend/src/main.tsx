import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./i18n";
import { AudioProvider } from "./providers/AudioProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { CharacterProvider } from "./providers/CharacterProvider";
import { TimerActivityProvider } from "./providers/TimerActivityProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { storage } from "./lib/platform";
import { applyTheme, resolveTheme, themeStorageKey } from "./lib/theme";
import "./styles/global.css";

applyTheme(resolveTheme(storage.get(themeStorageKey)));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <CharacterProvider>
            <TimerActivityProvider>
              <AudioProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </AudioProvider>
            </TimerActivityProvider>
          </CharacterProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

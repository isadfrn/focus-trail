import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Header } from "./components/Header/Header";
import { RequireAuth } from "./routes/RequireAuth";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { TimerPage } from "./pages/TimerPage/TimerPage";

export default function App() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="relative z-[1] mx-auto w-full max-w-[720px] flex-1 px-4 pt-6 pb-12 max-sm:px-3 max-sm:pt-4 max-sm:pb-9">
        {/* key por rota: remonta e re-dispara o fade a cada navegacao. */}
        <div key={location.pathname} className="animate-page-in">
          <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <TimerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <HistoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

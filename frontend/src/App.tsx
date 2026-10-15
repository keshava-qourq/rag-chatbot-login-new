import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import Signin from "@/screens/Signin";
import VerifyEmail from "@/screens/VerifyEmail";
import ResetPassword from "@/screens/ResetPassword";
import Chat from "@/screens/Chat";
import Library from "@/screens/Library";
import Account from "@/screens/Account";
import { ProtectedRoute } from "@/lib/session";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "block rounded-[var(--brand-radius)] px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-[var(--brand-hover)] text-[var(--brand-fg)]" : "text-[var(--brand-fg-muted)]",
  ].join(" ");

export default function App() {
  return (
    <div className="flex min-h-screen">
      <aside
        className="w-56 shrink-0 border-r p-4"
        style={{
          backgroundColor: "var(--brand-surface)",
          borderColor: "var(--brand-border)",
        }}
      >
        <p
          className="mb-4 px-3 text-sm font-semibold"
          style={{ fontFamily: "var(--brand-font-heading)" }}
        >
          {"RAG Chatbot Login"}
        </p>
        <nav className="flex flex-col gap-1">
          <NavLink to="/signin" className={navLinkClass}>
            {"Sign in or create account"}
          </NavLink>
          <NavLink to="/verify-email" className={navLinkClass}>
            {"Verify your email"}
          </NavLink>
          <NavLink to="/reset-password" className={navLinkClass}>
            {"Reset password"}
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            {"Chat"}
          </NavLink>
          <NavLink to="/library" className={navLinkClass}>
            {"Document library"}
          </NavLink>
          <NavLink to="/account" className={navLinkClass}>
            {"Account settings"}
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import NilaiPage from "./pages/NilaiPage";
import AdminsPage from "./pages/AdminsPage";

function ProtectedLayout({ admin, onLogout, children }) {
  if (!admin) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar admin={admin} onLogout={onLogout} />
      <main className="ml-64 p-8 min-h-screen">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    const token = localStorage.getItem("token");
    if (stored && token) {
      try { setAdmin(JSON.parse(stored)); } catch { setAdmin(null); }
    }
  }, []);

  const handleAuth = (adminData) => setAdmin(adminData);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setAdmin(null);
  };

  const isAuthPage = location.pathname === "/login";

  return (
    <>
      <Routes>
        <Route path="/login" element={admin ? <Navigate to="/dashboard" replace /> : <LoginPage onAuth={handleAuth} />} />
        <Route path="/dashboard" element={
          <ProtectedLayout admin={admin} onLogout={handleLogout}>
            <DashboardPage />
          </ProtectedLayout>
        } />
        <Route path="/users" element={
          <ProtectedLayout admin={admin} onLogout={handleLogout}>
            <UsersPage />
          </ProtectedLayout>
        } />
        <Route path="/nilai" element={
          <ProtectedLayout admin={admin} onLogout={handleLogout}>
            <NilaiPage />
          </ProtectedLayout>
        } />
        <Route path="/admins" element={
          <ProtectedLayout admin={admin} onLogout={handleLogout}>
            {admin?.role === "superadmin" ? <AdminsPage /> : <Navigate to="/dashboard" replace />}
          </ProtectedLayout>
        } />
        <Route path="*" element={<Navigate to={admin ? "/dashboard" : "/login"} replace />} />
      </Routes>

      {!isAuthPage && (
        <style>{`
          @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slide-up { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
          @keyframes slide-in { from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: translateX(0) } }
          .animate-fade-in { animation: fade-in 0.15s ease }
          .animate-slide-up { animation: slide-up 0.2s ease }
          .animate-slide-in { animation: slide-in 0.25s ease }
        `}</style>
      )}
    </>
  );
}

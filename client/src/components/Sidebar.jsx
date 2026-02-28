import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCog, GraduationCap, LogOut, Shield } from "lucide-react";

export default function Sidebar({ admin, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-dark-400 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-400">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-100">UserPanel</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <Users className="w-4 h-4" />
          Kelola User
        </NavLink>
        <NavLink to="/nilai" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <GraduationCap className="w-4 h-4" />
          Kelola Nilai
        </NavLink>
        {admin?.role === "superadmin" && (
          <NavLink to="/admins" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <UserCog className="w-4 h-4" />
            Kelola Admin
          </NavLink>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-dark-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase
              ${admin?.role === "superadmin" ? "bg-amber-500/20 text-amber-400" : "bg-accent/20 text-accent"}`}>
              {admin?.username?.[0] || "A"}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{admin?.username}</p>
              <p className="text-[10px] text-gray-500">
                {admin?.role === "superadmin" ? "Super Admin" : "Administrator"}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
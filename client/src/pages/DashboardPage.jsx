import { useState, useEffect } from "react";
import { Users, UserPlus, ShieldCheck, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDashboardStats } from "../api";

const actionColors = {
  LOGIN: "text-blue-400 bg-blue-500/10",
  REGISTER: "text-purple-400 bg-purple-500/10",
  CREATE: "text-emerald-400 bg-emerald-500/10",
  UPDATE: "text-amber-400 bg-amber-500/10",
  DELETE: "text-red-400 bg-red-500/10",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-accent">{payload[0].value} user</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total User", value: stats?.totalUsers || 0, icon: Users, color: "text-accent" },
    { label: "User Hari Ini", value: stats?.todayUsers || 0, icon: UserPlus, color: "text-emerald-400" },
    { label: "Total Admin", value: stats?.totalAdmins || 0, icon: ShieldCheck, color: "text-purple-400" },
  ];

  const chartData = (stats?.chartData || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    count: d.count,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview data dan aktivitas terbaru</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color} opacity-60`} />
            </div>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 bg-dark-700 border border-dark-400 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-accent opacity-60" />
            <h2 className="text-sm font-semibold text-gray-300">User Baru (7 Hari Terakhir)</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
                <XAxis dataKey="date" tick={{ fill: "#7a7a88", fontSize: 11 }} axisLine={{ stroke: "#2a2a32" }} />
                <YAxis tick={{ fill: "#7a7a88", fontSize: 11 }} axisLine={{ stroke: "#2a2a32" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6c63ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-600 text-sm">
              Belum ada data
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 bg-dark-700 border border-dark-400 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-accent opacity-60" />
            <h2 className="text-sm font-semibold text-gray-300">Aktivitas Terbaru</h2>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {(stats?.recentActivity || []).length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Belum ada aktivitas</p>
            ) : (
              stats.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${actionColors[a.action] || "text-gray-400 bg-dark-500"}`}>
                    {a.action}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{a.detail}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {a.admin_username} • {new Date(a.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

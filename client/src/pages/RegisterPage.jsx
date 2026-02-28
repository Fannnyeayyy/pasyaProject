import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { register } from "../api";

export default function RegisterPage({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password || !confirmPw) return setError("Semua field wajib diisi");
    if (password.length < 6) return setError("Password minimal 6 karakter");
    if (password !== confirmPw) return setError("Password tidak cocok");

    setLoading(true);
    setError("");
    try {
      const data = await register({ username: username.trim(), password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      onAuth(data.admin);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.08)_0%,transparent_70%)] -top-48 -left-48" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-100 to-accent bg-clip-text text-transparent">
            Daftar Akun
          </h1>
          <p className="text-gray-500 text-sm mt-1">Buat akun admin baru</p>
        </div>

        <div className="bg-dark-700 border border-dark-400 rounded-xl p-7">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="input-field" placeholder="Pilih username" autoFocus />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11" placeholder="Minimal 6 karakter" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mb-7">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Konfirmasi Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="input-field" placeholder="Ulangi password" />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-5">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

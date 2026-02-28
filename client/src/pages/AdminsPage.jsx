import { useState, useEffect } from "react";
import { Plus, Trash2, KeyRound, ShieldCheck, Crown } from "lucide-react";
import { getAdmins, createAdmin, deleteAdmin, resetAdminPassword } from "../api";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const fetchAdmins = async () => {
    try {
      setAdmins(await getAdmins());
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Kelola Admin</h1>
        <p className="text-gray-500 text-sm">Tambah dan hapus akun admin untuk login</p>
      </div>

      <div className="flex justify-end mb-6">
        <button onClick={() => setAddOpen(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        {admins.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 text-sm">Belum ada admin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">No</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Username</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Role</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Dibuat</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a, i) => (
                  <tr key={a.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold uppercase
                          ${a.role === "superadmin" ? "bg-amber-500/15 text-amber-400" : "bg-accent/15 text-accent"}`}>
                          {a.username[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-200">{a.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {a.role === "superadmin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Crown className="w-3 h-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setResetTarget(a)}
                          className="btn btn-ghost btn-sm opacity-60 group-hover:opacity-100">
                          <KeyRound className="w-3.5 h-3.5" /> Reset PW
                        </button>
                        {a.role !== "superadmin" && (
                          <button onClick={() => setDeleteTarget(a)}
                            className="btn btn-danger btn-sm opacity-60 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <AddAdminModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onSuccess={() => { fetchAdmins(); addToast("Admin berhasil ditambahkan"); }}
        onError={(msg) => addToast(msg, "error")} />

      {/* Reset Password Modal */}
      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)}
        onSuccess={() => { fetchAdmins(); addToast("Password berhasil direset"); }}
        onError={(msg) => addToast(msg, "error")} />

      {/* Delete Confirm Modal */}
      <DeleteAdminModal target={deleteTarget} onClose={() => setDeleteTarget(null)}
        onSuccess={() => { fetchAdmins(); addToast("Admin berhasil dihapus"); }}
        onError={(msg) => addToast(msg, "error")} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  );
}

// === Sub-components ===

function AddAdminModal({ isOpen, onClose, onSuccess, onError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOpen) { setUsername(""); setPassword(""); } }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return onError("Semua field wajib diisi");
    setLoading(true);
    try {
      await createAdmin({ username: username.trim(), password });
      onSuccess();
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Admin">
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="input-field" placeholder="Username baru" autoFocus />
        </div>
        <div className="mb-7">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="input-field" placeholder="Minimal 6 karakter" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ target, onClose, onSuccess, onError }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (target) setPassword(""); }, [target]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return onError("Password wajib diisi");
    setLoading(true);
    try {
      await resetAdminPassword(target.id, { password });
      onSuccess();
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!target} onClose={onClose} title="Reset Password">
      <p className="text-gray-400 text-sm mb-5">
        Reset password untuk <span className="text-gray-100 font-semibold">{target?.username}</span>
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-7">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Password Baru</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="input-field" placeholder="Minimal 6 karakter" autoFocus />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteAdminModal({ target, onClose, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAdmin(target.id);
      onSuccess();
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!target} onClose={onClose} title="Hapus Admin">
      <p className="text-gray-400 text-sm leading-relaxed mb-1">
        Yakin ingin menghapus admin <span className="text-gray-100 font-semibold">{target?.username}</span>?
      </p>
      <p className="text-gray-500 text-xs mb-7">Admin ini tidak akan bisa login lagi.</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-ghost">Batal</button>
        <button onClick={handleDelete} disabled={loading}
          className="btn bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 transition-all">
          {loading ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </Modal>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, Users as UsersIcon } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser } from "../api";
import UserForm from "../components/UserForm";
import DeleteConfirm from "../components/DeleteConfirm";
import Toast from "../components/Toast";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const fetchUsers = useCallback(async (q = "") => {
    try {
      setUsers(await getUsers(q));
    } catch {
      addToast("Gagal memuat data", "error");
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  const handleFormSubmit = async (data) => {
    if (editUser) {
      await updateUser(editUser.id, data);
      addToast("User berhasil diupdate");
    } else {
      await createUser(data);
      addToast("User berhasil ditambahkan");
    }
    fetchUsers(search);
  };

  const handleConfirmDelete = async () => {
    await deleteUser(deleteTarget.id);
    setDeleteTarget(null);
    addToast("User berhasil dihapus");
    fetchUsers(search);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Kelola User</h1>
        <p className="text-gray-500 text-sm">Tambah, edit, dan hapus data mahasiswa</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Cari NIM atau nama..." />
        </div>
        <button onClick={() => { setEditUser(null); setFormOpen(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 text-sm">Belum ada data user</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">No</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">NIM</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Nama</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-5 py-4 text-sm font-mono font-medium text-accent">{u.nim}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-200">{u.nama}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditUser(u); setFormOpen(true); }}
                          className="btn btn-ghost btn-sm opacity-60 group-hover:opacity-100">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget(u)}
                          className="btn btn-danger btn-sm opacity-60 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} editUser={editUser} />
      <DeleteConfirm isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} user={deleteTarget} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { getNilaiList, getUsers, createNilai, updateNilai, deleteNilai } from "../api";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

// Grade helper
function getGrade(nilai) {
  if (nilai >= 85) return { letter: "A", color: "text-emerald-400 bg-emerald-500/10" };
  if (nilai >= 70) return { letter: "B", color: "text-blue-400 bg-blue-500/10" };
  if (nilai >= 55) return { letter: "C", color: "text-amber-400 bg-amber-500/10" };
  if (nilai >= 40) return { letter: "D", color: "text-orange-400 bg-orange-500/10" };
  return { letter: "E", color: "text-red-400 bg-red-500/10" };
}

export default function NilaiPage() {
  const [nilaiList, setNilaiList] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const fetchNilai = useCallback(async (q = "") => {
    try {
      setNilaiList(await getNilaiList(q));
    } catch {
      addToast("Gagal memuat data nilai", "error");
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setUsers(await getUsers());
    } catch {}
  };

  useEffect(() => { fetchNilai(); fetchUsers(); }, [fetchNilai]);

  useEffect(() => {
    const t = setTimeout(() => fetchNilai(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchNilai]);

  const handleFormSubmit = async (data) => {
    if (editData) {
      await updateNilai(editData.id, data);
      addToast("Nilai berhasil diupdate");
    } else {
      await createNilai(data);
      addToast("Nilai berhasil ditambahkan");
    }
    fetchNilai(search);
  };

  const handleConfirmDelete = async () => {
    await deleteNilai(deleteTarget.id);
    setDeleteTarget(null);
    addToast("Nilai berhasil dihapus");
    fetchNilai(search);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Kelola Nilai</h1>
        <p className="text-gray-500 text-sm">Tambah, edit, dan hapus nilai mahasiswa</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Cari NIM, nama, atau notes..." />
        </div>
        <button onClick={() => { setEditData(null); setFormOpen(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Nilai
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        {nilaiList.length === 0 ? (
          <div className="py-16 text-center">
            <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 text-sm">Belum ada data nilai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">No</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">NIM</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Nama</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Nilai</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Grade</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Notes</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {nilaiList.map((n, i) => {
                  const grade = getGrade(n.nilai);
                  return (
                    <tr key={n.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-5 py-4 text-sm font-mono font-medium text-accent">{n.nim}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-200">{n.nama}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-mono font-semibold text-gray-100">{n.nilai}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${grade.color}`}>
                          {grade.letter}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400 max-w-[200px] truncate">
                        {n.notes || <span className="text-gray-600">-</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditData(n); setFormOpen(true); }}
                            className="btn btn-ghost btn-sm opacity-60 group-hover:opacity-100">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(n)}
                            className="btn btn-danger btn-sm opacity-60 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <NilaiFormModal isOpen={formOpen} onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit} editData={editData} users={users}
        onError={(msg) => addToast(msg, "error")} />

      {/* Delete Confirm */}
      <DeleteNilaiModal target={deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete} onError={(msg) => addToast(msg, "error")} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  );
}

// === Nilai Form Modal ===
function NilaiFormModal({ isOpen, onClose, onSubmit, editData, users, onError }) {
  const [userId, setUserId] = useState("");
  const [nilai, setNilai] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setUserId(editData.user_id);
        setNilai(String(editData.nilai));
        setNotes(editData.notes || "");
        setUserSearch(`${editData.nim} - ${editData.nama}`);
      } else {
        setUserId("");
        setNilai("");
        setNotes("");
        setUserSearch("");
      }
      setErrors({});
      setShowDropdown(false);
    }
  }, [isOpen, editData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.nim.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.nama.toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectUser = (user) => {
    setUserId(user.id);
    setUserSearch(`${user.nim} - ${user.nama}`);
    setShowDropdown(false);
    setErrors((p) => ({ ...p, userId: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!userId) errs.userId = "Pilih user terlebih dahulu";
    if (nilai === "" || nilai === undefined) errs.nilai = "Nilai wajib diisi";
    else if (isNaN(Number(nilai)) || Number(nilai) < 0 || Number(nilai) > 100) errs.nilai = "Nilai harus 0-100";
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await onSubmit({ user_id: userId, nilai: Number(nilai), notes: notes.trim() });
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "Edit Nilai" : "Tambah Nilai"}>
      <form onSubmit={handleSubmit}>
        {/* User Picker */}
        <div className="mb-5" ref={dropdownRef}>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mahasiswa</label>
          <div className="relative">
            <input type="text" value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setShowDropdown(true); setUserId(""); }}
              onFocus={() => setShowDropdown(true)}
              className={`input-field ${errors.userId ? "error" : ""}`}
              placeholder="Ketik NIM atau nama..." />
            {showDropdown && userSearch && (
              <div className="absolute z-10 mt-1 w-full bg-dark-800 border border-dark-400 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Tidak ada user ditemukan</div>
                ) : (
                  filteredUsers.map((u) => (
                    <button type="button" key={u.id} onClick={() => selectUser(u)}
                      className="w-full px-4 py-3 text-left hover:bg-dark-600 transition-colors flex items-center gap-3 border-b border-dark-400/50 last:border-0">
                      <span className="text-xs font-mono text-accent">{u.nim}</span>
                      <span className="text-sm text-gray-200">{u.nama}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.userId && <p className="text-red-400 text-xs mt-1.5">{errors.userId}</p>}
        </div>

        {/* Nilai */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nilai (0-100)</label>
          <input type="number" min="0" max="100" step="0.1" value={nilai}
            onChange={(e) => { setNilai(e.target.value); setErrors((p) => ({ ...p, nilai: undefined })); }}
            className={`input-field font-mono ${errors.nilai ? "error" : ""}`} placeholder="85" />
          {errors.nilai && <p className="text-red-400 text-xs mt-1.5">{errors.nilai}</p>}
        </div>

        {/* Notes */}
        <div className="mb-7">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes (opsional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            className="input-field resize-none h-20" placeholder="Catatan tambahan..." />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : editData ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// === Delete Nilai Modal ===
function DeleteNilaiModal({ target, onClose, onConfirm, onError }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try { await onConfirm(); } catch (err) { onError(err.message); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={!!target} onClose={onClose} title="Hapus Nilai">
      <p className="text-gray-400 text-sm leading-relaxed mb-1">
        Yakin ingin menghapus nilai <span className="text-gray-100 font-semibold">{target?.nilai}</span> milik{" "}
        <span className="text-gray-100 font-semibold">{target?.nama}</span>?
      </p>
      <p className="text-gray-500 text-xs mb-7">Tindakan ini tidak bisa dibatalkan.</p>
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

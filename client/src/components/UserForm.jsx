import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";

export default function UserForm({ isOpen, onClose, onSubmit, editUser }) {
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const nimRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNim(editUser?.nim || "");
      setNama(editUser?.nama || "");
      setErrors({});
      setTimeout(() => nimRef.current?.focus(), 100);
    }
  }, [isOpen, editUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!nim.trim()) errs.nim = "NIM wajib diisi";
    if (!nama.trim()) errs.nama = "Nama wajib diisi";
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await onSubmit({ nim: nim.trim(), nama: nama.trim() });
      onClose();
    } catch (err) {
      if (err.message.includes("NIM")) setErrors({ nim: err.message });
      else setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editUser ? "Edit User" : "Tambah User"}>
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{errors.general}</div>
        )}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">NIM</label>
          <input ref={nimRef} type="text" value={nim}
            onChange={(e) => { setNim(e.target.value); setErrors((p) => ({ ...p, nim: undefined })); }}
            className={`input-field font-mono ${errors.nim ? "error" : ""}`} placeholder="Contoh: 20250140169" />
          {errors.nim && <p className="text-red-400 text-xs mt-1.5">{errors.nim}</p>}
        </div>
        <div className="mb-7">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
          <input type="text" value={nama}
            onChange={(e) => { setNama(e.target.value); setErrors((p) => ({ ...p, nama: undefined })); }}
            className={`input-field ${errors.nama ? "error" : ""}`} placeholder="Contoh: Budi Santoso" />
          {errors.nama && <p className="text-red-400 text-xs mt-1.5">{errors.nama}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : editUser ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

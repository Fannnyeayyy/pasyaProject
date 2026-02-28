import { useState } from "react";
import Modal from "./Modal";

export default function DeleteConfirm({ isOpen, onClose, onConfirm, user }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hapus User">
      <p className="text-gray-400 text-sm leading-relaxed mb-1">
        Yakin ingin menghapus <span className="text-gray-100 font-semibold">{user?.nama}</span>?
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

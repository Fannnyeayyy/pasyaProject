import { useEffect, useRef } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-8 w-full max-w-md mx-5 animate-slide-up">
        <h2 className="text-xl font-semibold tracking-tight mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

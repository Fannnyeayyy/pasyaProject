import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const config = {
  success: { icon: CheckCircle, color: "text-emerald-400", border: "border-l-emerald-400" },
  error: { icon: XCircle, color: "text-red-400", border: "border-l-red-400" },
  warning: { icon: AlertTriangle, color: "text-amber-400", border: "border-l-amber-400" },
};

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const { icon: Icon, color, border } = config[type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 bg-dark-700 border border-dark-400 border-l-[3px] ${border} rounded-lg shadow-2xl shadow-black/50 text-sm animate-slide-in`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span>{message}</span>
    </div>
  );
}

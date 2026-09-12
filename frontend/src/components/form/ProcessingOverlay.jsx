import { Loader2 } from "lucide-react";

export default function ProcessingOverlay({ active, label = "Procesando…" }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
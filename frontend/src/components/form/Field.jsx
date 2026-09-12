import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Field({ label, hint, error, className, children }) {
  return (
    <div className={className}>
      <Label className={error ? "text-destructive" : ""}>
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      </Label>
      <div className={cn("mt-2", error && "field-invalid")}>{children}</div>
    </div>
  );
}
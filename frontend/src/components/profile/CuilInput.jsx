import { Input } from "@/components/ui/input";
import { formatCuil } from "@/lib/profileValidation";

export default function CuilInput({ value, onChange, ...props }) {
  return (
    <Input
      {...props}
      value={formatCuil(value)}
      onChange={(e) => onChange(formatCuil(e.target.value))}
      inputMode="numeric"
      placeholder="00-00.000.000-0"
    />
  );
}

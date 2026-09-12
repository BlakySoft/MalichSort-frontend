import { Input } from "@/components/ui/input";
import { onlyDigits } from "@/lib/profileValidation";

export default function CvuInput({ value, onChange, ...props }) {
  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => onChange(onlyDigits(e.target.value).slice(0, 22))}
      inputMode="numeric"
      placeholder="22 dígitos"
    />
  );
}
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ARGENTINA_AREA_CODES, ARGENTINA_COUNTRY_CODE, onlyDigits } from "@/lib/profileValidation";
import { cn } from "@/lib/utils";

export default function PhoneInput({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const v = value || { countryCode: ARGENTINA_COUNTRY_CODE, areaCode: "", number: "" };
  const update = (patch) => onChange({ ...v, ...patch });
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex h-11 w-32 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
        Argentina ({ARGENTINA_COUNTRY_CODE})
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="h-11 w-32 justify-between font-normal">
            {v.areaCode || "Área"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar área..." />
            <CommandList>
              <CommandEmpty>No se encontró el código.</CommandEmpty>
              {ARGENTINA_AREA_CODES.map((area) => (
                <CommandItem key={area.code} value={`${area.code} ${area.label}`} onSelect={() => { update({ countryCode: ARGENTINA_COUNTRY_CODE, areaCode: area.code }); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", v.areaCode === area.code ? "opacity-100" : "opacity-0")} />
                  {area.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        className="h-11 min-w-40 flex-1"
        placeholder="Número"
        inputMode="numeric"
        value={v.number}
        disabled={disabled}
        onChange={(e) => update({ number: onlyDigits(e.target.value).slice(0, 8) })}
      />
    </div>
  );
}
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import CuilInput from "@/components/profile/CuilInput";
import PhoneInput from "@/components/profile/PhoneInput";
import CvuInput from "@/components/profile/CvuInput";
import Field from "@/components/form/Field";
import FormErrors from "@/components/form/FormErrors";
import { validateProfileFields, buildPhoneString, MAX_PROFILE_TEXT_LENGTH } from "@/lib/profileValidation";
import { toast } from "@/components/ui/use-toast";

const initial = {
  first_name: "", last_name: "", cuil: "",
  phone: { countryCode: "+54", areaCode: "", number: "" },
  locality: "", cvu_cbu: ""
};

// Traduce los códigos de error del backend a un mensaje entendible para
// mostrar en el toast al llegar acá redirigido desde el registro.
const REASON_MESSAGES = {
  cuil_taken: "Ese CUIL ya está registrado con otra cuenta. Verificalo y probá de nuevo.",
};

export default function CompleteProfile() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("error");
    if (reason) {
      toast({
        title: "No pudimos completar tu registro",
        description: REASON_MESSAGES[reason] || reason,
        variant: "destructive",
      });
      // Limpiamos el query param para que no reaparezca el toast si recarga.
      window.history.replaceState({}, "", "/completar-registro");
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateProfileFields(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setError("");
    setLoading(true);
    try {
      await base44.functions.invoke("completeRegistration", {
        first_name: form.first_name, last_name: form.last_name, cuil: form.cuil,
        phone: buildPhoneString(form.phone), locality: form.locality, cvu_cbu: form.cvu_cbu
      });
      // Recarga completa a inicio: así el estado de auth arranca fresco
      // con profile_completed=true y no queda ninguna duda de que se guardó.
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.error || err.message || "No se pudo completar el registro");
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={UserCog} title="Completá tu registro" subtitle="Necesitamos estos datos para poder participar en los sorteos">
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.first_name}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Apellido" error={errors.last_name}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="CUIL" hint="00-00.000.000-0" error={errors.cuil}><CuilInput className="h-11" value={form.cuil} onChange={(v) => setForm({ ...form, cuil: v })} /></Field>
          <Field label="Localidad" error={errors.locality}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} /></Field>
          <Field label="Teléfono" hint="Código de país, área y número" error={errors.phone} className="sm:col-span-2"><PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /></Field>
          <Field label="CVU / CBU" hint="22 dígitos" error={errors.cvu_cbu} className="sm:col-span-2"><CvuInput className="h-11" value={form.cvu_cbu} onChange={(v) => setForm({ ...form, cvu_cbu: v })} /></Field>
        </div>
        <FormErrors errors={errors} />
        <Button className="h-12 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Completar registro"}
        </Button>
      </form>
    </AuthLayout>
  );
}

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CuilInput from "@/components/profile/CuilInput";
import PhoneInput from "@/components/profile/PhoneInput";
import CvuInput from "@/components/profile/CvuInput";
import Field from "@/components/form/Field";
import FormErrors from "@/components/form/FormErrors";
import { validateProfileFields, buildPhoneString, parsePhoneString, MAX_PROFILE_TEXT_LENGTH } from "@/lib/profileValidation";
import { Pencil } from "lucide-react";

export default function Profile() {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await base44.functions.invoke("accountStatus", {});
    setStatus(data);
    setForm({
      first_name: data.user.first_name || "",
      last_name: data.user.last_name || "",
      cuil: data.user.cuil || "",
      phone: parsePhoneString(data.user.phone),
      locality: data.user.locality || "",
      cvu_cbu: data.user.cvu_cbu || ""
    });
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const fieldErrors = validateProfileFields(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setSaving(true);
    setMessage("");
    try {
      // Nombre, apellido y CUIL no se envían: una vez completado el registro
      // quedan fijos, el backend los ignora igual si llegaran.
      await base44.functions.invoke("updateProfile", {
        phone: buildPhoneString(form.phone), locality: form.locality, cvu_cbu: form.cvu_cbu
      });
      setMessage("Perfil actualizado.");
      setEditing(false);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error || "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
    setMessage("");
    // Descarta cambios sin guardar, recargando los valores actuales.
    load();
  };

  const accept = async () => {
    setSaving(true);
    try { await base44.functions.invoke("acceptTerms", {}); await load(); } finally { setSaving(false); }
  };

  if (!status) return <div className="p-10 text-center text-slate-500">Cargando tu cuenta…</div>;

  // Nombre, apellido y CUIL son permanentes desde que se completa el registro.
  const locked = true;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={save} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mi perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">{status.user.email} · Rol {status.user.role.toUpperCase()}</p>
          </div>
          {!editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.first_name}><Input value={form.first_name || ""} disabled title="No se puede modificar una vez registrado" /></Field>
          <Field label="Apellido" error={errors.last_name}><Input value={form.last_name || ""} disabled title="No se puede modificar una vez registrado" /></Field>
          <Field label="CUIL" hint="00-00.000.000-0" error={errors.cuil}><CuilInput value={form.cuil || ""} disabled title="No se puede modificar una vez registrado" /></Field>
          <Field label="Localidad" error={errors.locality}><Input maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.locality || ""} disabled={!editing} onChange={(e) => setForm({ ...form, locality: e.target.value })} /></Field>
          <Field label="Teléfono" hint="Código de país, área y número" error={errors.phone} className="sm:col-span-2"><PhoneInput value={form.phone || {}} disabled={!editing} onChange={(v) => setForm({ ...form, phone: v })} /></Field>
          <Field label="CVU / CBU" hint="22 dígitos" error={errors.cvu_cbu} className="sm:col-span-2"><CvuInput value={form.cvu_cbu || ""} disabled={!editing} onChange={(v) => setForm({ ...form, cvu_cbu: v })} /></Field>
        </div>
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        <FormErrors errors={errors} />
        {editing && (
          <div className="mt-6 flex gap-2">
            <Button type="submit" disabled={saving}>Guardar datos</Button>
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
          </div>
        )}
      </form>
      <aside className="space-y-4">
        <StatusCard title="Verificación de email" ok={status.user.is_verified !== false} text={status.user.is_verified !== false ? "Correo verificado" : "Verificación pendiente"} />
        <StatusCard title="Términos vigentes" ok={status.acceptedCurrentTerms} text={status.activeTerms ? `Versión ${status.activeTerms.version}` : "Sin versión publicada"} />
        {status.activeTerms && !status.acceptedCurrentTerms && <Button className="w-full" onClick={accept} disabled={saving}>Aceptar términos vigentes</Button>}
      </aside>
    </section>
  );
}

function StatusCard({ title, ok, text }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{title}</p><p className={`mt-2 font-semibold ${ok ? "text-emerald-300" : "text-amber-300"}`}>{text}</p></div>;
}

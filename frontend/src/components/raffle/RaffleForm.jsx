import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/raffle/ImageUpload";
import Field from "@/components/form/Field";
import FormErrors from "@/components/form/FormErrors";
import ProcessingOverlay from "@/components/form/ProcessingOverlay";
import { validateRafflePublish, validateRaffleSave, validateRaffleUpdate } from "@/lib/raffleValidation";
import { STATUS_LABELS } from "@/lib/raffleStatus";
import { Lock, Trash2 } from "lucide-react";
import DrawPanel from "@/components/raffle/DrawPanel";

const EDITABLE = {
  DRAFT: ["name", "short_description", "description", "prize_title", "prize_description", "prize_image", "additional_images", "start_date", "end_date", "rules", "winner_count"],
  UPCOMING: ["short_description", "description", "prize_title", "prize_description", "prize_image", "additional_images", "start_date", "end_date", "rules"],
  ACTIVE: ["short_description", "description", "additional_images", "rules"],
  CLOSED: [], DRAWN: [], CANCELLED: []
};

function toLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function toIso(local) {
  if (!local) return "";
  return new Date(local).toISOString();
}

export default function RaffleForm({ raffle, onClose, onSaved }) {
  const [form, setForm] = useState({ additional_images: [] });
  const [saving, setSaving] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!raffle) return;
    setErrors({});
    setConfirmDelete(false);
    setConfirmCancel(false);
    setConfirmFinalize(false);
    setForm({
      name: raffle.name || "",
      short_description: raffle.short_description || "",
      description: raffle.description || "",
      prize_title: raffle.prize_title || "",
      prize_description: raffle.prize_description || "",
      prize_image: raffle.prize_image || "",
      additional_images: Array.isArray(raffle.additional_images) ? raffle.additional_images : [],
      start_date: toLocal(raffle.start_date),
      end_date: toLocal(raffle.end_date),
      rules: raffle.rules || "",
      winner_count: raffle.winner_count || 1
    });
  }, [raffle]);

  if (!raffle) return null;
  const allowed = EDITABLE[raffle.status] || [];
  const editable = (f) => allowed.includes(f);
  const locked = !allowed.length;
  const set = (k, v) => { setForm((s) => ({ ...s, [k]: v })); setErrors((s) => { const n = { ...s }; delete n[k]; return n; }); };

  const saveUploadedImage = async (field, value) => {
    if (raffle.status !== "DRAFT") return;
    setSavingImages(true);
    try {
      await base44.functions.invoke("adminRaffles", { action: "update", id: raffle.id, [field]: value });
    } catch (e) {
      toast({ title: "No se pudo guardar la imagen", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSavingImages(false);
    }
  };

  const setUploadedPrizeImage = (value) => {
    set("prize_image", value);
    return saveUploadedImage("prize_image", value);
  };

  const setUploadedAdditionalImage = (index, value) => {
    const next = [...form.additional_images];
    next[index] = value;
    set("additional_images", next);
    return saveUploadedImage("additional_images", next);
  };

  const addUploadedAdditionalImage = (value) => {
    const next = [...form.additional_images, value];
    set("additional_images", next);
    return saveUploadedImage("additional_images", next);
  };

  const buildPayload = () => {
    const payload = { action: "update", id: raffle.id };
    for (const f of allowed) {
      payload[f] = (f === "start_date" || f === "end_date") ? toIso(form[f]) : form[f];
    }
    return payload;
  };

  // Una vez publicado (no DRAFT), los campos obligatorios no pueden quedar vacíos al guardar.
  const runSaveValidation = () => raffle.status === "DRAFT" ? validateRaffleSave(form) : validateRaffleUpdate(form, allowed);

  const save = async ({ silent = false } = {}) => {
    const fieldErrors = runSaveValidation();
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return false; }
    setErrors({});
    setSaving(true);
    try {
      await base44.functions.invoke("adminRaffles", buildPayload());
      if (!silent) toast({ title: "Sorteo actualizado" });
      // No cerramos el formulario: el usuario sigue viendo el toast y puede
      // seguir editando o pasar a publicar sin perder el contexto.
      await onSaved({ keepOpen: true });
      return true;
    } catch (e) {
      toast({ title: "No se pudo guardar", description: e.response?.data?.error || e.message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    const fieldErrors = validateRafflePublish(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setSaving(true);
    try {
      // Guardamos los cambios pendientes del borrador ANTES de publicar,
      // así el usuario no tiene que acordarse de tocar "Guardar" primero.
      await base44.functions.invoke("adminRaffles", buildPayload());
      await base44.functions.invoke("adminRaffles", { action: "publish", id: raffle.id });
      toast({ title: "Sorteo publicado" });
      await onSaved({ keepOpen: false });
    } catch (e) {
      toast({ title: "No se pudo publicar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("adminRaffles", { action: "cancel", id: raffle.id, reason: cancelReason.trim() });
      toast({ title: "Sorteo cancelado" });
      setCancelReason("");
      await onSaved({ keepOpen: false });
    } catch (e) {
      toast({ title: "No se pudo cancelar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmCancel(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("adminRaffles", { action: "delete", id: raffle.id });
      toast({ title: "Sorteo eliminado" });
      await onSaved({ keepOpen: false });
    } catch (e) {
      toast({ title: "No se pudo eliminar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("adminDraw", { action: "finalize", raffle_id: raffle.id });
      toast({ title: "Sorteo finalizado" });
      await onSaved({ keepOpen: false });
    } catch (e) {
      toast({ title: "No se pudo finalizar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmFinalize(false);
    }
  };

  return (
    <Dialog open={!!raffle} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!flex !gap-0 !p-0 max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <ProcessingOverlay active={saving || savingImages} />
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle>{raffle.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Estado: {STATUS_LABELS[raffle.status]} · /sorteos/{raffle.slug}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {locked ? (
            <div className="space-y-4">
              <p className="text-sm text-amber-300">Este sorteo está en estado {STATUS_LABELS[raffle.status]} y no puede modificarse.</p>
              {["CLOSED", "DRAWN"].includes(raffle.status) && (
                <DrawPanel raffle={raffle} onChanged={() => onSaved({ keepOpen: true })} />
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              <Field label="Nombre" error={errors.name}>
                <Input value={form.name} disabled={!editable("name")} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Descripción corta" error={errors.short_description}>
                <Input value={form.short_description} disabled={!editable("short_description")} onChange={(e) => set("short_description", e.target.value)} />
              </Field>
              <Field label="Descripción" error={errors.description}>
                <Textarea rows={4} value={form.description} disabled={!editable("description")} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Premio" error={errors.prize_title}>
                  <Input value={form.prize_title} disabled={!editable("prize_title")} onChange={(e) => set("prize_title", e.target.value)} />
                </Field>
                <Field label="Descripción del premio" error={errors.prize_description}>
                  <Textarea rows={3} value={form.prize_description} disabled={!editable("prize_description")} onChange={(e) => set("prize_description", e.target.value)} />
                </Field>
              </div>
              <Field label="Imagen principal del premio" error={errors.prize_image}>
                <ImageUpload
                  value={form.prize_image}
                  onChange={(v) => set("prize_image", v)}
                  onUploaded={setUploadedPrizeImage}
                  label="imagen principal"
                />
              </Field>
              <Field label="Imágenes adicionales (máx 5)" error={errors.additional_images}>
                <div className="flex flex-wrap gap-3">
                  {form.additional_images.map((img, i) => (
                    <ImageUpload key={i} value={img} label={`adicional ${i + 1}`} onChange={(v) => {
                      const next = [...form.additional_images];
                      if (v) next[i] = v; else next.splice(i, 1);
                      set("additional_images", next);
                    }} onUploaded={(v) => setUploadedAdditionalImage(i, v)} />
                  ))}
                  {editable("additional_images") && form.additional_images.length < 5 && (
                    <ImageUpload value="" label="agregar" onChange={(v) => v && set("additional_images", [...form.additional_images, v])} onUploaded={addUploadedAdditionalImage} />
                  )}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Inicio" error={errors.start_date}>
                  <Input type="datetime-local" value={form.start_date} disabled={!editable("start_date")} onChange={(e) => set("start_date", e.target.value)} />
                </Field>
                <Field label="Finalización" error={errors.end_date}>
                  <Input type="datetime-local" value={form.end_date} disabled={!editable("end_date")} onChange={(e) => set("end_date", e.target.value)} />
                </Field>
              </div>
              <Field label="Reglas" error={errors.rules}>
                <Textarea rows={5} value={form.rules} disabled={!editable("rules")} onChange={(e) => set("rules", e.target.value)} />
              </Field>
              <Field label="Cantidad de ganadores" error={errors.winner_count}>
                <Input type="number" min="1" max="100" value={form.winner_count} disabled={!editable("winner_count")} onChange={(e) => set("winner_count", e.target.value)} />
              </Field>
            </div>
          )}
          <FormErrors errors={errors} />
        </div>

        <DialogFooter className="!justify-between gap-2 border-t border-border bg-muted/40 p-6 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {raffle.status === "DRAFT" && (
              confirmDelete ? (
                <>
                  <span className="self-center text-sm text-destructive">¿Confirmar eliminación?</span>
                  <Button variant="destructive" size="sm" onClick={remove} disabled={saving}>Sí, eliminar</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={saving}>No</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setConfirmDelete(true)} disabled={saving}><Trash2 className="h-4 w-4" /> Eliminar</Button>
              )
            )}
            {["UPCOMING", "ACTIVE", "CLOSED"].includes(raffle.status) && (
              confirmCancel ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <span className="text-sm text-destructive">¿Seguro que querés cancelar este sorteo?</span>
                  <Input
                    placeholder="Motivo de la cancelación (obligatorio)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={saving}
                    className="sm:w-96"
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={cancel} disabled={saving}>Sí, cancelar</Button>
                    <Button variant="outline" size="sm" onClick={() => { setConfirmCancel(false); setCancelReason(""); }} disabled={saving}>No</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setConfirmCancel(true)} disabled={saving}>Cancelar sorteo</Button>
              )
            )}
          </div>
          <div className="flex gap-2">
            {raffle.status === "CLOSED" && (
              confirmFinalize ? (
                <>
                  <span className="self-center text-sm text-amber-200">¿Finalizar y publicar todos los puestos?</span>
                  <Button size="sm" onClick={finalize} disabled={saving}><Lock className="h-4 w-4" /> Sí, finalizar</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmFinalize(false)} disabled={saving}>Cancelar</Button>
                </>
              ) : <Button variant="secondary" onClick={() => setConfirmFinalize(true)} disabled={saving}>Finalizar sorteo</Button>
            )}
            {raffle.status === "DRAFT" && <Button variant="secondary" onClick={publish} disabled={saving}>Publicar</Button>}
            {!locked && <Button onClick={() => save()} disabled={saving}>Guardar</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

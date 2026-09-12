import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatCuil } from "@/lib/profileValidation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import ProcessingOverlay from "@/components/form/ProcessingOverlay";
import { PARTICIPATION_LABELS, PARTICIPATION_COLORS } from "@/lib/participationStatus";
import ChancesPanel from "@/components/raffle/ChancesPanel";

const REJECT_REASONS = ["Pago no verificado", "Comprobante inválido", "Datos incorrectos", "Solicitud duplicada", "Otra razón"];

export default function ParticipationReview({ participation, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // "approve" | "reject"
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { toast } = useToast();

  const load = async () => {
    if (!participation) return;
    const { data } = await base44.functions.invoke("adminParticipations", { action: "get", id: participation.id });
    setDetail(data);
    setPaymentReference(data.participation.payment_reference || "");
    setAdminNote(data.participation.admin_note || "");
    setReason(""); setCustomReason(""); setMode(null);
  };
  useEffect(() => { load(); }, [participation?.id]);

  if (!participation) return null;
  const p = detail?.participation;
  const u = detail?.user;
  const r = detail?.raffle;
  const t = detail?.terms;
  const isPending = p?.status === "PENDING";

  const approve = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminParticipations", { action: "approve", id: p.id, payment_reference: paymentReference, admin_note: adminNote });
      toast({ title: "Participación aprobada" });
      onSaved();
    } catch (e) {
      toast({ title: "No se pudo aprobar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const reject = async () => {
    const finalReason = reason === "Otra razón" ? customReason.trim() : reason;
    if (!finalReason) { toast({ title: "Indica el motivo de rechazo", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await base44.functions.invoke("adminParticipations", { action: "reject", id: p.id, rejection_reason: finalReason, admin_note: adminNote });
      toast({ title: "Participación rechazada" });
      onSaved();
    } catch (e) {
      toast({ title: "No se pudo rechazar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminParticipations", { action: "cancel", id: p.id });
      toast({ title: "Participación cancelada" });
      onSaved();
    } catch (e) {
      toast({ title: "No se pudo cancelar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!participation} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!flex !gap-0 !p-0 max-h-[90vh] max-w-xl flex-col overflow-hidden">
        <ProcessingOverlay active={busy} />
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle>Revisar participación</DialogTitle>
          <p className="text-sm text-muted-foreground">{r?.name || "Sorteo"} · {u ? `${u.first_name} ${u.last_name}` : ""}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {!detail && <p className="text-muted-foreground">Cargando…</p>}
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${PARTICIPATION_COLORS[p.status]}`}>{PARTICIPATION_LABELS[p.status]}</span>
              </div>
              <Row label="Nombre">{u ? `${u.first_name} ${u.last_name}` : "—"}</Row>
              <Row label="CUIL">{u?.cuil ? formatCuil(u.cuil) : "—"}</Row>
              <Row label="Email">{u?.email || "—"}</Row>
              <Row label="Teléfono">{u?.phone || "—"}</Row>
              <Row label="Localidad">{u?.locality || "—"}</Row>
              <Row label="Sorteo">{r?.name || "—"}</Row>
              <Row label="Fecha de solicitud">{new Date(p.requested_at).toLocaleString()}</Row>
              <Row label="Términos aceptados">{t ? `Versión ${t.version} — ${t.title}` : "—"}</Row>
              {p.payment_reference && <Row label="Referencia de pago">{p.payment_reference}</Row>}
              {p.rejection_reason && <Row label="Motivo de rechazo"><span className="text-red-600">{p.rejection_reason}</span></Row>}
              {p.admin_note && <Row label="Nota administrativa">{p.admin_note}</Row>}

              {p.status === "APPROVED" && <ChancesPanel participationId={p.id} />}

              {isPending && (
                <div className="border-t pt-4">
                  <p className="mb-2 font-medium">Verificación del pago (externo)</p>
                  <Input placeholder="Referencia de pago (opcional)" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} disabled={!!mode} />
                  <Textarea className="mt-2" rows={2} placeholder="Nota administrativa (opcional)" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} disabled={!!mode && mode !== "reject"} />

                  {mode === "reject" && (
                    <div className="mt-3 rounded-lg bg-muted/30 p-3">
                      <p className="mb-2 text-sm font-medium">Motivo de rechazo</p>
                      <div className="grid gap-2">
                        {REJECT_REASONS.map((rr) => (
                          <label key={rr} className="flex items-center gap-2 text-sm">
                            <input type="radio" name="reason" checked={reason === rr} onChange={() => setReason(rr)} />
                            {rr}
                          </label>
                        ))}
                      </div>
                      {reason === "Otra razón" && <Input className="mt-2" placeholder="Especifica el motivo" value={customReason} onChange={(e) => setCustomReason(e.target.value)} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isPending && (
          <DialogFooter className="!justify-between gap-2 border-t border-border bg-muted/40 p-6 pt-4">
            <div>
              <Button variant="outline" onClick={cancel} disabled={busy}>Cancelar solicitud</Button>
            </div>
            <div className="flex gap-2">
              {mode === "reject" ? (
                <>
                  <Button variant="ghost" onClick={() => setMode(null)} disabled={busy}>Volver</Button>
                  <Button variant="destructive" onClick={reject} disabled={busy}>Confirmar rechazo</Button>
                </>
              ) : mode === "approve" ? (
                <>
                  <Button variant="ghost" onClick={() => setMode(null)} disabled={busy}>Volver</Button>
                  <Button onClick={approve} disabled={busy}>Aprobar participación</Button>
                </>
              ) : (
                <>
                  <Button variant="destructive" onClick={() => setMode("reject")} disabled={busy}>Rechazar</Button>
                  <Button onClick={() => setMode("approve")} disabled={busy}>Aprobar</Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{children}</span></div>;
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PARTICIPATION_LABELS, PARTICIPATION_COLORS } from "@/lib/participationStatus";

export default function MyParticipations() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await base44.functions.invoke("requestParticipation", { action: "mine" });
    setItems(data.participations);
  };
  // Refresco suave cada 20s: acá el usuario solo está consultando el estado,
  // no hay ningún modal abierto que se pueda "cerrar de golpe" por el refresh.
  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await base44.functions.invoke("requestParticipation", { action: "cancel", id });
      await load();
      toast({ title: "Participación cancelada" });
    } catch (e) {
      toast({ title: "No se pudo cancelar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const confirmRefund = async (refundId) => {
    setBusyId(refundId);
    try {
      await base44.functions.invoke("requestParticipation", { action: "confirmRefund", refund_id: refundId });
      await load();
      toast({ title: "¡Gracias! Confirmamos la recepción del reembolso." });
    } catch (e) {
      toast({ title: "No se pudo confirmar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const filtered = (items || []).filter((p) => filter === "ALL" || p.status === filter);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Mis participaciones</h1>
      <p className="mt-2 text-muted-foreground">Estado de tus solicitudes de participación.</p>

      <div className="mt-6 flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {Object.keys(PARTICIPATION_LABELS).map((s) => <SelectItem key={s} value={s}>{PARTICIPATION_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-3">
        {items === null && <p className="text-muted-foreground">Cargando…</p>}
        {items !== null && !filtered.length && <p className="text-muted-foreground">No hay participaciones que coincidan.</p>}
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {p.raffle ? <Link className="font-semibold hover:underline" to={`/sorteos/${p.raffle.slug}`}>{p.raffle.name}</Link> : <span className="font-semibold">Sorteo eliminado</span>}
                {p.raffle?.prize_title && <p className="text-sm text-muted-foreground">{p.raffle.prize_title}</p>}
                <p className="mt-1 text-xs text-muted-foreground/70">Solicitud: {new Date(p.requested_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${PARTICIPATION_COLORS[p.status]}`}>{PARTICIPATION_LABELS[p.status]}</span>
                {p.status === "APPROVED" && p.raffle?.status !== "CANCELLED" && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    {p.chances_total} {p.chances_total === 1 ? "chance" : "chances"}
                  </span>
                )}
                {p.status === "PENDING" && <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => cancel(p.id)}>Cancelar</Button>}
                {p.status === "REJECTED" && p.rejection_reason && <span className="text-xs text-red-400">Motivo: {p.rejection_reason}</span>}
              </div>
            </div>

            {p.raffle?.status === "CANCELLED" && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-200">Este sorteo fue cancelado.</p>
                {p.raffle.cancellation_reason && <p className="mt-1 text-sm text-amber-200/80">{p.raffle.cancellation_reason}</p>}
                {p.refund && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {p.refund.status === "PENDING" && (
                      <span className="text-sm text-amber-200/80">Tu reembolso está en proceso, te avisaremos cuando esté disponible.</span>
                    )}
                    {p.refund.status === "MARKED_PAID" && (
                      <>
                        <span className="text-sm text-amber-200/80">Te enviamos el reembolso. ¿Ya lo recibiste?</span>
                        <Button size="sm" disabled={busyId === p.refund.id} onClick={() => confirmRefund(p.refund.id)}>Confirmar recepción</Button>
                      </>
                    )}
                    {p.refund.status === "CONFIRMED" && (
                      <span className="text-sm font-medium text-emerald-300">Reembolso confirmado. ¡Gracias!</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
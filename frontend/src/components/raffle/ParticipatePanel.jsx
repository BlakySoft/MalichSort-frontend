import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { PARTICIPATION_LABELS, PARTICIPATION_COLORS } from "@/lib/participationStatus";

export default function ParticipatePanel({ raffle }) {
  const [status, setStatus] = useState(null);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data: s } = await base44.functions.invoke("accountStatus", {});
      setStatus(s);
      const { data: m } = await base44.functions.invoke("requestParticipation", { action: "mine" });
      setMine((m.participations || []).find((p) => p.raffle_id === raffle.id) || null);
    } catch {
      setStatus(null);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [raffle.id]);

  if (raffle.status !== "ACTIVE") return null;

  if (loading) return <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Verificando tu estado…</div>;

  if (!status || !status.user) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">Para participar debes iniciar sesión.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild><Link to="/login">Iniciar sesión</Link></Button>
          <Button variant="outline" asChild><Link to="/register">Registrarse</Link></Button>
        </div>
      </div>
    );
  }

  if (mine && ["PENDING", "APPROVED"].includes(mine.status)) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Tu participación</p>
        <p className="mt-1 text-lg font-semibold">Ya estás participando</p>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${PARTICIPATION_COLORS[mine.status]}`}>{PARTICIPATION_LABELS[mine.status]}</span>
        <p className="mt-3 text-sm text-muted-foreground">Revisa el estado en <Link className="underline" to="/mis-participaciones">Mis participaciones</Link>.</p>
      </div>
    );
  }

  if (status.user.is_verified === false) {
    return <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">Debes verificar tu email para participar. Revisa tu correo para confirmar tu cuenta.</div>;
  }

  if (!status.acceptedCurrentTerms) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-lg font-semibold">Aceptar términos vigentes</p>
        <p className="mt-2 text-sm text-muted-foreground">Para participar debes aceptar la versión {status.activeTerms?.version} de los términos.</p>
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-muted/30 p-4 text-sm whitespace-pre-line text-foreground/80">{status.activeTerms?.content}</div>
        <Button className="mt-4" disabled={busy} onClick={async () => { setBusy(true); try { await base44.functions.invoke("acceptTerms", {}); await load(); } finally { setBusy(false); } }}>Aceptar términos</Button>
      </div>
    );
  }

  const participate = async () => {
    setBusy(true); setMsg("");
    try {
      await base44.functions.invoke("requestParticipation", { action: "request", raffle_id: raffle.id });
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || "No se pudo registrar la participación");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
      {msg && <p className="mb-3 text-sm text-destructive">{msg}</p>}
      <Button size="lg" disabled={busy} onClick={participate}>QUIERO PARTICIPAR</Button>
      <p className="mt-3 text-xs text-muted-foreground">El pago se realiza fuera de la plataforma. Un administrador verificará tu participación.</p>
    </div>
  );
}
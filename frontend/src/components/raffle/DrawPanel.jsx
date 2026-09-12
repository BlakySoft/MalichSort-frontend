import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Lock, RefreshCw, Trophy } from "lucide-react";

export default function DrawPanel({ raffle, onChanged }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const { data } = await base44.functions.invoke("adminDraw", { action: "get", raffle_id: raffle.id });
      setState(data);
    } catch (error) {
      toast({ title: "No se pudo cargar el sorteo", description: error.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [raffle.id, raffle.status]);

  const act = async (action, position) => {
    setBusy(`${action}-${position}`);
    try {
      const { data } = await base44.functions.invoke("adminDraw", { action, raffle_id: raffle.id, position });
      setState(data);
      setConfirming(null);
      await onChanged?.({ keepOpen: true });
    } catch (error) {
      toast({ title: "No se pudo actualizar el puesto", description: error.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando puestos...</p>;
  const winners = state?.winners || [];
  const count = Number(state?.raffle?.winner_count || raffle.winner_count || 1);
  const positions = Array.from({ length: count }, (_, index) => index + 1);

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      {raffle.status === "CLOSED" && <p className="mb-3 text-sm text-amber-200">Seleccioná y confirmá un ganador para cada puesto. Los chances quedan congelados al comenzar.</p>}
      <div className="space-y-2">
        {positions.map((position) => {
          const winner = winners.find((item) => item.position === position);
          const actionKey = `${confirming?.action}-${position}`;
          return (
            <div key={position} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-semibold">Puesto {position}</span>
                {winner ? <span className="flex items-center gap-2 text-sm"><Trophy className="h-4 w-4 text-primary" />{winner.user.first_name} {winner.user.last_name}</span> : <span className="text-sm text-muted-foreground">Sin ganador</span>}
              </div>
              {raffle.status === "CLOSED" && (
                <div className="flex items-center gap-2">
                  {winner?.confirmed ? <span className="flex items-center gap-1 text-xs text-emerald-300"><Lock className="h-3 w-3" /> Confirmado</span> : (
                    <>
                      {winner && <Button size="sm" variant="outline" onClick={() => setConfirming({ action: "reroll", position })} disabled={!!busy}><RefreshCw className="h-4 w-4" /> Reroll</Button>}
                      {winner ? <Button size="sm" onClick={() => setConfirming({ action: "confirm", position })} disabled={!!busy}><Lock className="h-4 w-4" /> Confirmar</Button> : <Button size="sm" onClick={() => act("run", position)} disabled={!!busy}>Sortear</Button>}
                    </>
                  )}
                </div>
              )}
              {confirming?.position === position && (
                <div className="flex w-full items-center justify-end gap-2 border-t border-border pt-2 text-sm">
                  <span>{confirming.action === "reroll" ? "¿Reemplazar este ganador?" : "¿Bloquear este puesto?"}</span>
                  <Button size="sm" onClick={() => act(confirming.action, position)} disabled={busy === actionKey}>Sí</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(null)} disabled={!!busy}>Cancelar</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {state?.total_chances_pool && <p className="mt-3 text-xs text-muted-foreground">Pool congelado: {state.total_chances_pool} chance(s)</p>}
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import { Trophy, Clock, Users, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";

export default function AdminWinners() {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [pickerWinner, setPickerWinner] = useState(null); // { raffleId, winnerId, photoUrl } | null

  useEffect(() => {
    base44.functions.invoke("adminDraw", { action: "list" }).then(({ data }) => setData(data));
  }, []);

  const toggleDetail = async (raffleId) => {
    if (expanded === raffleId) { setExpanded(null); return; }
    setExpanded(raffleId);
    if (!detail[raffleId]) {
      const { data } = await base44.functions.invoke("adminDraw", { action: "get", raffle_id: raffleId });
      setDetail((d) => ({ ...d, [raffleId]: data }));
    }
  };

  const handlePhotoAssigned = (raffleId, winnerId, updatedWinner) => {
    setData((prev) => ({
      ...prev,
      winners: prev.winners.map((w) =>
        w.raffle_id !== raffleId
          ? w
          : { ...w, winners: w.winners.map((winner) => (winner.id === winnerId ? { ...winner, photo_url: updatedWinner.photo_url } : winner)) }
      ),
    }));
  };

  return (
    <AdminPage title="Ganadores" description="Historial de sorteos realizados y sorteos cerrados pendientes de determinar ganador.">
      {data?.pending_draw?.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Clock className="h-4 w-4" /> Pendientes de sortear ({data.pending_draw.length})
          </h2>
          <div className="space-y-2">
            {data.pending_draw.map((r) => (
              <Link
                key={r.id}
                to={`/admin/sorteos?open=${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm transition hover:bg-amber-500/15"
              >
                <span className="font-medium text-amber-200">{r.name}</span>
                <div className="flex items-center gap-4 text-amber-300">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {r.participant_count} participante{r.participant_count === 1 ? "" : "s"}
                    {r.participant_count === 0 && " · sin elegibles, no se puede sortear"}
                  </span>
                  <span>Cerrado el {new Date(r.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Sorteos realizados</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Sorteo", "Ganador", "Foto", "Chances en juego", "Fecha", ""].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr>
          </thead>
          <tbody>
            {data?.winners.map((w) => (
              <>
                <tr key={w.raffle_id} className="border-t border-border">
                  <td className="px-4 py-4">
                    <Link className="font-medium underline text-primary" to={`/sorteos/${w.raffle_slug}`} target="_blank">{w.raffle_name}</Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {w.winners.map((winner) => <div key={winner.position} className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /><div><p className="font-medium">Puesto {winner.position}: {winner.winner_name}</p><p className="text-xs text-muted-foreground">{winner.winner_email}</p></div></div>)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {w.winners.map((winner) => (
                        <button
                          key={winner.position}
                          onClick={() => setPickerWinner({ raffleId: w.raffle_id, winnerId: winner.id, photoUrl: winner.photo_url })}
                          className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
                        >
                          {winner.photo_url ? (
                            <img src={winner.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <ImagePlus className="h-4 w-4" />
                            </span>
                          )}
                          {winner.photo_url ? "Cambiar" : "Asignar"}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">{w.total_chances_pool}</td>
                  <td className="px-4 py-4 text-muted-foreground">{new Date(w.drawn_at).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground underline"
                      onClick={() => toggleDetail(w.raffle_id)}
                    >
                      Datos analíticos {expanded === w.raffle_id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </td>
                </tr>
                {expanded === w.raffle_id && (
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={6} className="px-4 py-4">
                      {!detail[w.raffle_id] ? (
                        <p className="text-sm text-muted-foreground">Cargando snapshot del sorteo…</p>
                      ) : (
                        <div>
                          <p className="mb-2 text-xs text-muted-foreground">
                            {detail[w.raffle_id].winners.length} puesto(s) confirmados · snapshot congelado al iniciar el sorteo
                          </p>
                          <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background">
                            <table className="w-full text-left text-xs text-foreground">
                              <thead className="bg-muted/50 text-muted-foreground">
                                <tr><th className="px-3 py-2 font-medium">Participante</th><th className="px-3 py-2 font-medium text-right">Chances</th><th className="px-3 py-2 font-medium text-right">Probabilidad</th></tr>
                              </thead>
                              <tbody>
                                {(detail[w.raffle_id].eligibility_snapshot || detail[w.raffle_id].winners[0]?.eligibility_snapshot || []).map((participant) => {
                                  const winner = detail[w.raffle_id].winners.find((item) => item.participation_id === participant.participation_id);
                                  const pool = Number(detail[w.raffle_id].total_chances_pool || detail[w.raffle_id].winners[0]?.total_chances_pool || 0);
                                  const probability = pool > 0 ? ((Number(participant.chances) / pool) * 100).toFixed(1) : "0.0";
                                  return (
                                    <tr key={participant.participation_id} className="border-t border-border">
                                      <td className="px-3 py-2">
                                        {participant.name || "Participante"}
                                        {winner && <span className="ml-2 text-emerald-400">Puesto {winner.position}</span>}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium">{participant.chances}</td>
                                      <td className="px-3 py-2 text-right text-muted-foreground">{probability}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {data === null && <p className="p-6 text-muted-foreground">Cargando ganadores…</p>}
        {data?.winners.length === 0 && <p className="p-6 text-muted-foreground">Todavía no se realizó ningún sorteo.</p>}
      </div>

      {pickerWinner && (
        <PhotoPickerModal
          winnerId={pickerWinner.winnerId}
          currentPhotoUrl={pickerWinner.photoUrl}
          onClose={() => setPickerWinner(null)}
          onAssigned={(updatedWinner) => handlePhotoAssigned(pickerWinner.raffleId, pickerWinner.winnerId, updatedWinner)}
        />
      )}
    </AdminPage>
  );
}

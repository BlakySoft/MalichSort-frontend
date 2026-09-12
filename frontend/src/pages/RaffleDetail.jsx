import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/raffleStatus";
import ParticipatePanel from "@/components/raffle/ParticipatePanel";
import ImageLightbox from "@/components/raffle/ImageLightbox";
import { Expand, Trophy } from "lucide-react";

const STATUS_HEADING = {
  UPCOMING: "Próximamente",
  ACTIVE: "Sorteo activo",
  CLOSED: "Sorteo cerrado",
  DRAWN: "Sorteo sorteado",
  CANCELLED: "Sorteo cancelado"
};

export default function RaffleDetail() {
  const { slug } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    setRaffle(null);
    setError("");
    base44.functions.invoke("publicRaffles", { action: "getBySlug", slug })
      .then(({ data }) => setRaffle(data.raffle))
      .catch((e) => setError(e.response?.data?.error || "No encontrado"));
  }, [slug]);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Sorteo no encontrado</h1>
        <Link className="mt-4 inline-block underline" to="/sorteos">Volver a sorteos</Link>
      </section>
    );
  }
  if (!raffle) return <section className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Cargando sorteo…</section>;

  // Todas las imágenes del sorteo en un solo array, para poder navegar
  // entre ellas dentro del visor ampliado (lightbox).
  const allImages = [raffle.prize_image, ...(raffle.additional_images || [])].filter(Boolean);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Link className="text-sm text-muted-foreground hover:text-foreground transition" to="/sorteos">← Volver a sorteos</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          {raffle.prize_image && (
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-2xl border"
              onClick={() => setLightboxIndex(0)}
            >
              <Image src={raffle.prize_image} alt={raffle.prize_title} className="aspect-video w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <Expand className="h-8 w-8 text-white" />
              </span>
            </button>
          )}
          {raffle.additional_images?.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {raffle.additional_images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative block overflow-hidden rounded-lg border"
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  <Image src={img} alt="" className="aspect-video w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <Expand className="h-5 w-5 text-white" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[raffle.status]}`}>{STATUS_HEADING[raffle.status] || STATUS_LABELS[raffle.status]}</span>
          {raffle.status === "DRAWN" && raffle.winners?.length > 0 && (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              {raffle.winners.map((winner) => <div key={winner.position} className="flex items-center gap-2"><Trophy className="h-5 w-5" /><span className="font-semibold">Puesto {winner.position}: {winner.name}</span></div>)}
            </div>
          )}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{raffle.name}</h1>
          {raffle.short_description && <p className="mt-2 text-foreground/80">{raffle.short_description}</p>}
          <div className="mt-5 space-y-3 text-sm">
            <div><span className="text-muted-foreground">Premio: </span><b>{raffle.prize_title}</b></div>
            {raffle.prize_description && <p className="whitespace-pre-line text-foreground/80">{raffle.prize_description}</p>}
            <div className="flex flex-wrap gap-6">
              <div><span className="text-muted-foreground">Inicio: </span>{new Date(raffle.start_date).toLocaleString()}</div>
              <div><span className="text-muted-foreground">Fin: </span>{new Date(raffle.end_date).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
      {raffle.description && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Descripción</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/80">{raffle.description}</p>
        </div>
      )}
      {raffle.rules && (
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="text-lg font-semibold">Reglas</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/80">{raffle.rules}</p>
        </div>
      )}
      <ParticipatePanel raffle={raffle} />
      <ImageLightbox
        images={allImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
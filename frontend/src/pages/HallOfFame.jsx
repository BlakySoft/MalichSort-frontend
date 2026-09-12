import { useEffect, useState } from 'react';
import { Trophy, CalendarDays, Expand } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ImageLightbox from '@/components/raffle/ImageLightbox';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function HallOfFameEntry({ entry, isLast, onPhotoOpen }) {
  const { raffle, winner_name, winner_photo_url, drawn_at } = entry;

  return (
    <li className="relative pl-16">
      {/* Línea vertical de la timeline */}
      {!isLast && (
        <span
          className="absolute left-[23px] top-12 h-[calc(100%-1rem)] w-px bg-border"
          aria-hidden="true"
        />
      )}

      {/* Punto de la timeline */}
      <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-card text-primary">
        <Trophy className="h-5 w-5" strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-4 pb-12 sm:flex-row sm:items-start sm:gap-6">
        {winner_photo_url && (
          <button
            type="button"
            className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border"
            onClick={onPhotoOpen}
            aria-label={`Ampliar foto de ${winner_name}`}
          >
            <img
              src={winner_photo_url}
              alt={winner_name}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <Expand className="h-5 w-5 text-white" />
            </span>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
            <time dateTime={drawn_at}>{formatDate(drawn_at)}</time>
          </div>

          <h3 className="mt-1 font-sora text-xl font-semibold text-foreground">
            {raffle.name}
          </h3>

          {raffle.prize_title && (
            <p className="mt-1 text-sm text-muted-foreground">
              {raffle.prize_title}
            </p>
          )}

          <p className="mt-3 text-base">
            <span className="text-muted-foreground">Ganador: </span>
            <span className="font-medium text-primary">{winner_name}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

function HallOfFameSkeleton() {
  return (
    <ul className="space-y-12">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex animate-pulse gap-6 pl-16">
          <div className="h-28 w-28 shrink-0 rounded-lg bg-card" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-3 w-24 rounded bg-card" />
            <div className="h-5 w-56 rounded bg-card" />
            <div className="h-3 w-40 rounded bg-card" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function HallOfFame() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await base44.functions.invoke('publicRaffles', {
          action: 'hallOfFame',
        });
        if (!cancelled) setEntries(data.hall_of_fame);
      } catch (err) {
        if (!cancelled) setError(err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const photoEntries = entries?.filter((entry) => entry.winner_photo_url) ?? [];
  const lightboxImages = photoEntries.map((entry) => entry.winner_photo_url);
  const photoIndexByEntry = new Map(photoEntries.map((entry, index) => [entry, index]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <header className="mb-16">
          <h1 className="font-sora text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Salón de la fama
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Cada sorteo termina con una historia. Acá queda el registro de
            quién se llevó cada premio.
          </p>
        </header>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            No pudimos cargar el historial de ganadores. Probá recargar la página.
          </p>
        )}

        {!error && entries === null && <HallOfFameSkeleton />}

        {!error && entries !== null && entries.length === 0 && (
          <p className="rounded-lg border border-border bg-card px-6 py-10 text-center text-muted-foreground">
            Todavía no hay sorteos finalizados. El primer nombre en esta lista
            podría ser el tuyo.
          </p>
        )}

        {!error && entries && entries.length > 0 && (
          <ol className="space-y-0">
            {entries.map((entry, i) => (
              <HallOfFameEntry
                key={`${entry.raffle.id}-${entry.drawn_at}-${i}`}
                entry={entry}
                isLast={i === entries.length - 1}
                onPhotoOpen={entry.winner_photo_url
                  ? () => setLightboxIndex(photoIndexByEntry.get(entry))
                  : undefined}
              />
            ))}
          </ol>
        )}

        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      </div>
    </div>
  );
}

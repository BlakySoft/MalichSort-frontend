import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/raffleStatus";

export default function PublicRaffles() {
  const [raffles, setRaffles] = useState(null);
  useEffect(() => {
    base44.functions.invoke("publicRaffles", { action: "list" }).then(({ data }) => setRaffles(data.raffles));
  }, []);

  const groups = {
    "Próximos": (raffles || []).filter((r) => r.status === "UPCOMING"),
    "Activos": (raffles || []).filter((r) => r.status === "ACTIVE")
  };
  const finishedRaffles = (raffles || []).filter((r) => ["CLOSED", "DRAWN"].includes(r.status));
  const cancelledRaffles = (raffles || []).filter((r) => r.status === "CANCELLED");

  const renderRaffleGrid = (items) => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <Link key={r.id} to={`/sorteos/${r.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {r.prize_image && <Image src={r.prize_image} alt={r.prize_title} className="h-full w-full object-cover" />}
          </div>
          <div className="p-4">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            <h3 className="mt-2 font-semibold text-foreground">{r.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.prize_title}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              {r.start_date && `Desde ${new Date(r.start_date).toLocaleDateString()}`}
              {r.start_date && r.end_date && " · "}
              {r.end_date && `Hasta ${new Date(r.end_date).toLocaleDateString()}`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sorteos</h1>
      <p className="mt-2 text-muted-foreground">Sorteos disponibles y finalizados de Ivan Malich.</p>

      {raffles === null ? (
        <p className="mt-8 text-muted-foreground">Cargando sorteos…</p>
      ) : raffles.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No hay sorteos publicados.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {Object.entries(groups).map(([title, items]) => items.length > 0 && (
            <div key={title}>
              <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
              {renderRaffleGrid(items)}
            </div>
          ))}
          {(finishedRaffles.length > 0 || cancelledRaffles.length > 0) && (
            <Accordion type="multiple" defaultValue={["finished"]} className="w-full">
              {finishedRaffles.length > 0 && (
                <AccordionItem value="finished">
                  <AccordionTrigger className="text-xl font-semibold text-foreground hover:no-underline">
                    Finalizados
                  </AccordionTrigger>
                  <AccordionContent>{renderRaffleGrid(finishedRaffles)}</AccordionContent>
                </AccordionItem>
              )}
              {cancelledRaffles.length > 0 && (
                <AccordionItem value="cancelled">
                  <AccordionTrigger className="text-xl font-semibold text-foreground hover:no-underline">
                    Cancelados
                  </AccordionTrigger>
                  <AccordionContent>{renderRaffleGrid(cancelledRaffles)}</AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      )}
    </section>
  );
}
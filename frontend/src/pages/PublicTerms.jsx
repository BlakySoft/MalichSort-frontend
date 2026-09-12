import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function PublicTerms() {
  const [terms, setTerms] = useState(undefined);
  useEffect(() => { base44.entities.TermsVersion.filter({ active: true }).then((items) => setTerms(items[0] || null)).catch(() => setTerms(null)); }, []);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Términos y condiciones</h1>
      {terms === undefined ? (
        <p className="mt-6 text-muted-foreground">Cargando versión vigente…</p>
      ) : terms ? (
        <article className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-6 border-b border-border pb-5">
            <p className="text-sm font-medium text-emerald-300">Versión {terms.version}</p>
            <h2 className="mt-2 text-2xl font-semibold">{terms.title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Publicada: {new Date(terms.published_at).toLocaleString("es-AR")}</p>
          </div>
          <div className="whitespace-pre-wrap leading-7 text-foreground/80">{terms.content}</div>
        </article>
      ) : (
        <p className="mt-6 rounded-xl border border-border bg-card p-6 text-muted-foreground">Todavía no hay una versión vigente publicada.</p>
      )}
    </section>
  );
}
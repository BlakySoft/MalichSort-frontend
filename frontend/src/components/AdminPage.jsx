import AdminSidebar from "@/components/AdminSidebar";

export default function AdminPage({ title, description, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div className="min-w-0">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Administración segura</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

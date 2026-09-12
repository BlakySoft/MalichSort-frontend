import { Link } from "react-router-dom";
import { Facebook, ShieldCheck, Mail } from "lucide-react";

const footerSections = [
  {
    title: "Atención al consumidor",
    text: "Canales de atención disponibles próximamente.",
    links: [
      {
        label: "Soporte Técnico",
        href: "mailto:soporte@ivanmalichsorteos.com?subject=Consulta%20desde%20el%20sitio%20web",
        icon: Mail,
      },
    ],
  },
  {
    title: "Redes",
    links: [
      { label: "Facebook", href: "https://www.facebook.com/people/Ivan-Malich/61589249785409/",icon: Facebook },
    ],
  },
];

export default function AppFooter() {
  return <footer className="border-t border-border bg-card/40">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-4">
      <div>
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Ivan Malich Sorteos
        </Link>
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
          Sorteos digitales con transparencia, seguridad y premios reales.
        </p>
      </div>

      {footerSections.map(({ title, text, links }) => (
        <div key={title}>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>

          {links ? (
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {links.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-foreground"
                  >
                    {Icon && <Icon className="h-4 w-4 text-primary" />}
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
          )}
        </div>
      ))}

      <div>
        <h2 className="text-sm font-semibold text-foreground">Sobre nosotros</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li><Link className="hover:text-foreground" to="/terminos">Términos y condiciones</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} <Link className="hover:text-foreground text-primary" to="https://www.instagram.com/codigovivo2026/" target="_blank" rel="noreferrer">Código Vivo</Link> Todos los derechos reservados. Diseñado y desarrollado por <Link className="hover:text-foreground text-primary" to="https://github.com/BlakySoft" target="_blank" rel="noreferrer">BlakySoft</Link>
      </div>
    </div>
  </footer>;
}
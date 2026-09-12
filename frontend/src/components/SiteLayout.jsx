import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

function isPublicRoute(pathname) {
  return pathname === "/" || pathname === "/terminos" || pathname === "/sorteos" ||
    pathname.startsWith("/sorteos/") || pathname === "/salon-de-la-fama";
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  const showFooter = isPublicRoute(pathname);

  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <AppHeader />
    <main className="flex-1"><Outlet /></main>
    {showFooter && <AppFooter />}
  </div>;
}
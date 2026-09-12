import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireCompleteProfile from '@/components/RequireCompleteProfile';
import SiteLayout from '@/components/SiteLayout';
import AdminGuard from '@/components/AdminGuard';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CompleteProfile from '@/pages/CompleteProfile';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PublicTerms from '@/pages/PublicTerms';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminWinners from '@/pages/AdminWinners';
import AdminRefunds from '@/pages/AdminRefunds';
import AdminTerms from '@/pages/AdminTerms';
import AdminAudit from '@/pages/AdminAudit';
import AdminRaffles from '@/pages/AdminRaffles';
import AdminParticipations from '@/pages/AdminParticipations';
import PublicRaffles from '@/pages/PublicRaffles';
import RaffleDetail from '@/pages/RaffleDetail';
import HallOfFame from '@/pages/HallOfFame';
import AdminPhotos from '@/pages/AdminPhotos';
import MyParticipations from '@/pages/MyParticipations';

const isIncompleteProfile = (user) => (
  user && (user.profile_completed === false || user.profile_completed === 0 || user.profile_completed === '0')
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // IMPORTANTE: este chequeo tiene que vivir ACÁ, antes de <Routes>, y no
  // solo dentro de <RequireCompleteProfile /> (que envuelve nada más las
  // rutas protegidas: /perfil, /mis-participaciones, /admin/*). Las rutas
  // públicas (/, /sorteos, /sorteos/:slug, /salon-de-la-fama, /terminos)
  // son HERMANAS de esa rama en el árbol de rutas, no hijas — un usuario
  // logueado con profile_completed=false podía navegar a ellas y el guard
  // de más abajo nunca llegaba a ejecutarse ahí, dejándolo "escapar" del
  // flujo obligatorio de completar el registro. Poniendo el chequeo acá,
  // aplica sin importar a qué ruta intente ir.
  if (isIncompleteProfile(user) && location.pathname !== '/completar-registro') {
    return <Navigate to="/completar-registro" replace />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/terminos" element={<PublicTerms />} />
        <Route path="/sorteos" element={<PublicRaffles />} />
        <Route path="/sorteos/:slug" element={<RaffleDetail />} />
        <Route path="/salon-de-la-fama" element={<HallOfFame />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<RequireCompleteProfile />}>
            <Route path="/completar-registro" element={<CompleteProfile />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/mis-participaciones" element={<MyParticipations />} />
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/sorteos" element={<AdminRaffles />} />
              <Route path="/admin/participaciones" element={<AdminParticipations />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/ganadores" element={<AdminWinners />} />
              <Route path="/admin/fotos" element={<AdminPhotos />} />
              <Route path="/admin/reembolsos" element={<AdminRefunds />} />
              <Route path="/admin/terminos" element={<AdminTerms />} />
              <Route path="/admin/auditoria" element={<AdminAudit />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function AppRouterShell() {
  const location = useLocation();

  const routeMeta = {
    '/': {
      title: 'Ivan Malich Sorteos | Participa en rifas en vivo',
      description: 'Descubre sorteos activos, participa con seguridad y consulta tus premios y participaciones en Ivan Malich Sorteos.'
    },
    '/sorteos': {
      title: 'Sorteos disponibles | Ivan Malich Sorteos',
      description: 'Explora los sorteos activos y próximos de Ivan Malich Sorteos.'
    },
    '/terminos': {
      title: 'Términos y condiciones | Ivan Malich Sorteos',
      description: 'Consulta los términos y condiciones vigentes de Ivan Malich Sorteos.'
    },
    '/salon-de-la-fama': {
      title: 'Salón de la fama | Ivan Malich Sorteos',
      description: 'Conoce a los ganadores de los sorteos ya finalizados en Ivan Malich Sorteos.'
    },
    '/perfil': {
      title: 'Mi perfil | Ivan Malich Sorteos',
      description: 'Gestiona tu perfil, verificación de email, términos y datos de tu cuenta.'
    },
    '/mis-participaciones': {
      title: 'Mis participaciones | Ivan Malich Sorteos',
      description: 'Revisa el estado de tus participaciones, chances y reembolsos en Ivan Malich Sorteos.'
    },
    '/login': {
      title: 'Iniciar sesión | Ivan Malich Sorteos',
      description: 'Accede a tu cuenta de Ivan Malich Sorteos para participar en los sorteos.'
    },
    '/register': {
      title: 'Crear cuenta | Ivan Malich Sorteos',
      description: 'Regístrate en Ivan Malich Sorteos y empieza a participar en los sorteos.'
    },
    '/forgot-password': {
      title: 'Recuperar contraseña | Ivan Malich Sorteos',
      description: 'Recupera tu contraseña y vuelve a acceder a Ivan Malich Sorteos.'
    },
    '/admin': {
      title: 'Panel administrativo | Ivan Malich Sorteos',
      description: 'Administra sorteos, usuarios, participaciones y ganadores desde el panel administrativo.'
    },
    '/admin/fotos': {
      title: 'Gestor de fotos | Ivan Malich Sorteos',
      description: 'Administra la galería de fotos de ganadores usada en el Salón de la fama.'
    }
  };

  const meta = routeMeta[location.pathname] || {
    title: 'Ivan Malich Sorteos',
    description: 'Participa en sorteos digitales con transparencia, seguridad y premios reales.'
  };

  return (
    <>
      <Seo title={meta.title} description={meta.description} path={location.pathname} />
      <AuthenticatedApp />
    </>
  );
}

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRouterShell />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
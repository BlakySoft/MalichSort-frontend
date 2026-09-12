import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const isIncompleteProfile = (user) => (
  user && (user.profile_completed === false || user.profile_completed === 0 || user.profile_completed === '0')
);

/**
 * Si el usuario está autenticado pero no completó su registro
 * (verificó el email pero se quedó a mitad de camino, por ejemplo por un
 * CUIL duplicado), lo mandamos siempre a /completar-registro sin dejarlo
 * ver ninguna otra ruta protegida hasta que termine.
 */
export default function RequireCompleteProfile() {
  const { user } = useAuth();
  const location = useLocation();

  if (isIncompleteProfile(user) && location.pathname !== '/completar-registro') {
    return <Navigate to="/completar-registro" replace />;
  }

  return <Outlet />;
}

// Reemplazo de src/api/base44Client.js
// Mantiene una interfaz parecida (auth.*, functions.invoke) para minimizar
// los cambios en el resto del frontend, pero habla con nuestro backend propio.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const getToken = () => localStorage.getItem('auth_token');
const setToken = (token) => localStorage.setItem('auth_token', token);
const clearToken = () => localStorage.removeItem('auth_token');

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'request_failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const apiClient = {
  auth: {
    async register(payload) {
      return request('/auth/register', { method: 'POST', body: payload, auth: false });
    },
    async loginViaEmailPassword(email, password) {
      const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
      setToken(data.token);
      return data.user;
    },
    async me() {
      return request('/auth/me');
    },
    async verifyOtp({ email, otpCode } = {}) {
      return request('/auth/verify-otp', { method: 'POST', body: { email, otpCode }, auth: false });
    },
    async resendOtp(email) {
      return request('/auth/resend-otp', { method: 'POST', body: { email }, auth: false });
    },
    async resetPasswordRequest(email) {
      return request('/auth/reset-password-request', { method: 'POST', body: { email }, auth: false });
    },
    // ResetPassword.jsx llama con un solo objeto { resetToken, newPassword }
    async resetPassword({ resetToken, newPassword } = {}) {
      return request('/auth/reset-password', { method: 'POST', body: { token: resetToken, new_password: newPassword }, auth: false });
    },
    logout(redirectTo) {
      clearToken();
      // Forzamos una recarga completa: así se resetea todo el estado de
      // React (AuthContext, cachés, etc.) sin depender de que cada
      // componente que llama a logout() también actualice el estado global.
      window.location.href = redirectTo || '/';
    },
    setToken(token) {
      setToken(token);
    },
    isAuthenticated() {
      return Boolean(getToken());
    },
    redirectToLogin(returnTo) {
      window.location.href = `/login?return_to=${encodeURIComponent(returnTo || window.location.href)}`;
    },
  },

  // Reemplazo de base44.functions.invoke("nombreFuncion", payload)
  // Mapea cada "función" antigua a su endpoint REST equivalente.
  functions: {
    async invoke(name, payload = {}) {
      const action = payload.action;

      switch (name) {
        case 'accountStatus':
          return { data: await request('/profile/account-status') };

        case 'updateProfile':
          return { data: await request('/profile', { method: 'PATCH', body: payload }) };

        case 'acceptTerms':
          return { data: await request('/profile/accept-terms', { method: 'POST' }) };

        case 'completeRegistration':
          return { data: await request('/auth/complete-registration', { method: 'POST', body: payload }) };

        case 'publicRaffles':
          if (action === 'list') return { data: { raffles: (await request('/raffles')).raffles } };
          if (action === 'getBySlug') return { data: { raffle: (await request(`/raffles/${payload.slug}`)).raffle } };
          if (action === 'hallOfFame') return { data: { hall_of_fame: (await request('/raffles/hall-of-fame', { auth: false })).hall_of_fame } };
          break;

        case 'adminRaffles':
          if (action === 'list') return { data: await request('/admin/raffles') };
          if (action === 'create') return { data: await request('/admin/raffles', { method: 'POST', body: payload }) };
          if (action === 'update') return { data: await request(`/admin/raffles/${payload.id}`, { method: 'PATCH', body: payload }) };
          if (action === 'publish') return { data: await request(`/admin/raffles/${payload.id}/publish`, { method: 'POST' }) };
          if (action === 'cancel') return { data: await request(`/admin/raffles/${payload.id}/cancel`, { method: 'POST', body: payload }) };
          if (action === 'delete') return { data: await request(`/admin/raffles/${payload.id}`, { method: 'DELETE' }) };
          break;

        case 'requestParticipation':
          if (action === 'request') return { data: await request('/participations', { method: 'POST', body: payload }) };
          if (action === 'mine') return { data: await request('/participations/mine') };
          if (action === 'cancel') return { data: await request(`/participations/${payload.id}/cancel`, { method: 'POST' }) };
          if (action === 'confirmRefund') return { data: await request(`/participations/refunds/${payload.refund_id}/confirm`, { method: 'POST' }) };
          break;

        case 'adminParticipations':
          if (action === 'list') return { data: await request('/admin/participations') };
          if (action === 'get') return { data: await request(`/admin/participations/${payload.id}`) };
          if (action === 'approve') return { data: await request(`/admin/participations/${payload.id}/approve`, { method: 'POST', body: payload }) };
          if (action === 'reject') return { data: await request(`/admin/participations/${payload.id}/reject`, { method: 'POST', body: payload }) };
          if (action === 'cancel') return { data: await request(`/admin/participations/${payload.id}/cancel`, { method: 'POST' }) };
          break;

        case 'adminUsers':
          if (action === 'list') return { data: await request('/admin/users') };
          if (action === 'changeRole') return { data: await request(`/admin/users/${payload.user_id}/role`, { method: 'POST', body: { role: payload.role, master_password: payload.master_password } }) };
          break;

        case 'adminTerms':
          if (action === 'list') return { data: await request('/admin/terms') };
          if (action === 'create') return { data: await request('/admin/terms', { method: 'POST', body: payload }) };
          if (action === 'publish') return { data: await request(`/admin/terms/${payload.terms_version_id}/publish`, { method: 'POST' }) };
          break;

        case 'adminAudit':
          {
            const params = new URLSearchParams();
            for (const key of ['user_id', 'action', 'entity_type', 'entity_id', 'from', 'to', 'search']) {
              if (payload[key]) params.set(key, payload[key]);
            }
            const qs = params.toString();
            return { data: await request(`/admin/audit${qs ? `?${qs}` : ''}`) };
          }

        case 'adminRefunds':
          if (action === 'list') return { data: await request(`/admin/refunds${payload.status ? `?status=${payload.status}` : ''}`) };
          if (action === 'markPaid') return { data: await request(`/admin/refunds/${payload.id}/mark-paid`, { method: 'POST' }) };
          break;

        case 'adminAuditFilters':
          return { data: await request('/admin/audit/filters') };

        case 'adminChances':
          if (action === 'list') return { data: await request(`/admin/chances/${payload.participation_id}`) };
          if (action === 'assign') return { data: await request(`/admin/chances/${payload.participation_id}`, { method: 'POST', body: payload }) };
          break;

        case 'adminDraw':
          if (action === 'get') return { data: await request(`/admin/draw/${payload.raffle_id}`) };
          if (['run', 'reroll', 'confirm', 'finalize'].includes(action)) return { data: await request(`/admin/draw/${payload.raffle_id}`, { method: 'POST', body: { action, position: payload.position } }) };
          if (action === 'list') return { data: await request('/admin/draw') };
          break;

        case 'adminPhotos': {
          if (action === 'list') return { data: await request('/admin/photos') };

          if (action === 'upload') {
            const formData = new FormData();
            formData.append('file', payload.file);
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/admin/photos`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });
            const uploadData = await res.json().catch(() => ({}));
            if (!res.ok) {
              const error = new Error(uploadData.error || 'upload_failed');
              error.status = res.status;
              error.data = uploadData;
              throw error;
            }
            return { data: uploadData };
          }

          if (action === 'delete') return { data: await request(`/admin/photos/${payload.photo_id}`, { method: 'DELETE' }) };

          if (action === 'assignToWinner') {
            return {
              data: await request(`/admin/photos/winners/${payload.winner_id}/photo`, {
                method: 'PATCH',
                body: { photo_id: payload.photo_id },
              }),
            };
          }
          break;
        }

        default:
          throw new Error(`Función no mapeada: ${name}`);
      }
      throw new Error(`Acción no soportada para ${name}: ${action}`);
    },
  },

  // Único uso directo de "entities" en el frontend original: la vista
  // pública de términos (PublicTerms.jsx). Se mapea a un endpoint propio
  // de solo lectura en vez de exponer un CRUD genérico de entidades.
  entities: {
    TermsVersion: {
      async filter(criteria = {}) {
        if (criteria.active) {
          const { terms } = await request('/terms/active', { auth: false });
          return terms ? [terms] : [];
        }
        return [];
      },
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file } = {}) {
        if (!file) throw new Error('no_file_provided');
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/uploads`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error('upload_failed');
        return res.json(); // { file_url }
      },
    },
  },
};

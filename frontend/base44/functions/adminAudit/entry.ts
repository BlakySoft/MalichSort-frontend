import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isRole } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isRole(user, ['admin'])) return Response.json({ error: 'Prohibido' }, { status: 403 });
    const logs = await base44.asServiceRole.entities.AuditLog.list('-timestamp', 200);
    const users = await base44.asServiceRole.entities.User.list('+created_date', 500);
    const nameById: Record<string, string> = {};
    for (const u of users) nameById[u.id] = u.full_name || u.email || '';
    const enriched = logs.map((l: any) => ({
      ...l,
      user_name: (l.user_role === 'admin' || l.user_role === 'dev') ? (nameById[l.user_id] || '') : ''
    }));
    return Response.json({ logs: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
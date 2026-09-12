import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { writeAudit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin' && user.role !== 'dev') {
      return Response.json({ error: 'Prohibido' }, { status: 403 });
    }
    const auditUser = user || { id: 'system', role: 'system', email: 'system' };
    const now = Date.now();
    let transitions = 0;

    const upcoming = await base44.asServiceRole.entities.Raffle.filter({ status: 'UPCOMING' });
    for (const r of upcoming) {
      if (r.start_date && now >= new Date(r.start_date).getTime()) {
        await base44.asServiceRole.entities.Raffle.update(r.id, { status: 'ACTIVE' });
        await writeAudit(base44, req, auditUser, {
          action: 'RAFFLE_STATUS_CHANGED', entity_type: 'Raffle', entity_id: r.id,
          old_value: JSON.stringify({ status: 'UPCOMING' }),
          new_value: JSON.stringify({ status: 'ACTIVE' }),
          description: `Sorteo "${r.name}" iniciado automáticamente`
        });
        transitions++;
      }
    }

    const active = await base44.asServiceRole.entities.Raffle.filter({ status: 'ACTIVE' });
    for (const r of active) {
      if (r.end_date && now >= new Date(r.end_date).getTime()) {
        await base44.asServiceRole.entities.Raffle.update(r.id, { status: 'CLOSED' });
        await writeAudit(base44, req, auditUser, {
          action: 'RAFFLE_STATUS_CHANGED', entity_type: 'Raffle', entity_id: r.id,
          old_value: JSON.stringify({ status: 'ACTIVE' }),
          new_value: JSON.stringify({ status: 'CLOSED' }),
          description: `Sorteo "${r.name}" finalizado automáticamente`
        });
        transitions++;
      }
    }

    return Response.json({ ok: true, transitions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
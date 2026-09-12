import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isRole, writeAudit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isRole(user, ['admin'])) return Response.json({ error: 'Prohibido' }, { status: 403 });
    const data = await req.json();

    if (data.action === 'list') {
      const list = await base44.asServiceRole.entities.RaffleParticipation.list('-requested_at', 500);
      const userIds = [...new Set(list.map((p) => p.user_id))];
      const raffleIds = [...new Set(list.map((p) => p.raffle_id))];
      const users = await Promise.all(userIds.map((id) => base44.asServiceRole.entities.User.get(id).catch(() => null)));
      const raffles = await Promise.all(raffleIds.map((id) => base44.asServiceRole.entities.Raffle.get(id).catch(() => null)));
      const userMap: Record<string, any> = {};
      users.forEach((u) => { if (u) userMap[u.id] = u; });
      const raffleMap: Record<string, any> = {};
      raffles.forEach((r) => { if (r) raffleMap[r.id] = r; });
      return Response.json({
        participations: list.map((p) => ({
          ...p,
          user: userMap[p.user_id] ? {
            first_name: userMap[p.user_id].first_name,
            last_name: userMap[p.user_id].last_name,
            cuil: userMap[p.user_id].cuil,
            email: userMap[p.user_id].email,
            locality: userMap[p.user_id].locality
          } : null,
          raffle: raffleMap[p.raffle_id] ? {
            name: raffleMap[p.raffle_id].name,
            slug: raffleMap[p.raffle_id].slug,
            status: raffleMap[p.raffle_id].status
          } : null
        }))
      });
    }

    if (data.action === 'get') {
      const p = await base44.asServiceRole.entities.RaffleParticipation.get(data.id);
      const u = await base44.asServiceRole.entities.User.get(p.user_id).catch(() => null);
      const r = await base44.asServiceRole.entities.Raffle.get(p.raffle_id).catch(() => null);
      const terms = p.terms_version_id ? await base44.asServiceRole.entities.TermsVersion.get(p.terms_version_id).catch(() => null) : null;
      return Response.json({
        participation: p,
        user: u ? {
          first_name: u.first_name, last_name: u.last_name, cuil: u.cuil,
          email: u.email, phone: u.phone, locality: u.locality
        } : null,
        raffle: r ? { name: r.name, slug: r.slug, status: r.status, start_date: r.start_date, end_date: r.end_date } : null,
        terms: terms ? { version: terms.version, title: terms.title } : null
      });
    }

    if (data.action === 'approve') {
      const p = await base44.asServiceRole.entities.RaffleParticipation.get(data.id);
      if (!p) return Response.json({ error: 'Participación no encontrada' }, { status: 404 });
      if (p.status !== 'PENDING') return Response.json({ error: 'La participación no está pendiente' }, { status: 400 });
      const raffle = await base44.asServiceRole.entities.Raffle.get(p.raffle_id).catch(() => null);
      if (!raffle) return Response.json({ error: 'Sorteo no encontrado' }, { status: 400 });
      const now = new Date().toISOString();
      const payment_reference = String(data.payment_reference || '').trim();
      const admin_note = String(data.admin_note || '').trim();
      await base44.asServiceRole.entities.RaffleParticipation.update(p.id, {
        status: 'APPROVED',
        reviewed_at: now,
        reviewed_by: user.email,
        payment_verified_at: now,
        payment_verified_by: user.email,
        payment_reference,
        admin_note
      });
      await writeAudit(base44, req, user, {
        action: 'PARTICIPATION_APPROVED', entity_type: 'RaffleParticipation', entity_id: p.id,
        old_value: JSON.stringify({ status: 'PENDING' }),
        new_value: JSON.stringify({ status: 'APPROVED', raffle_id: raffle.id }),
        description: `Participación aprobada en "${raffle.name}"`
      });
      await writeAudit(base44, req, user, {
        action: 'PAYMENT_VERIFIED', entity_type: 'RaffleParticipation', entity_id: p.id,
        new_value: JSON.stringify({ payment_reference }),
        description: `Pago verificado para participación en "${raffle.name}"`
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'reject') {
      const reason = String(data.rejection_reason || '').trim();
      if (!reason) return Response.json({ error: 'El motivo de rechazo es obligatorio' }, { status: 400 });
      const p = await base44.asServiceRole.entities.RaffleParticipation.get(data.id);
      if (!p) return Response.json({ error: 'Participación no encontrada' }, { status: 404 });
      if (p.status !== 'PENDING') return Response.json({ error: 'La participación no está pendiente' }, { status: 400 });
      const raffle = await base44.asServiceRole.entities.Raffle.get(p.raffle_id).catch(() => null);
      const admin_note = String(data.admin_note || '').trim();
      await base44.asServiceRole.entities.RaffleParticipation.update(p.id, {
        status: 'REJECTED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email,
        rejection_reason: reason,
        admin_note
      });
      await writeAudit(base44, req, user, {
        action: 'PARTICIPATION_REJECTED', entity_type: 'RaffleParticipation', entity_id: p.id,
        old_value: JSON.stringify({ status: 'PENDING' }),
        new_value: JSON.stringify({ status: 'REJECTED', reason }),
        description: `Participación rechazada en "${raffle ? raffle.name : ''}": ${reason}`
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'cancel') {
      const p = await base44.asServiceRole.entities.RaffleParticipation.get(data.id);
      if (!p) return Response.json({ error: 'Participación no encontrada' }, { status: 404 });
      if (p.status !== 'PENDING') return Response.json({ error: 'Solo se pueden cancelar solicitudes pendientes' }, { status: 400 });
      const raffle = await base44.asServiceRole.entities.Raffle.get(p.raffle_id).catch(() => null);
      await base44.asServiceRole.entities.RaffleParticipation.update(p.id, {
        status: 'CANCELLED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email
      });
      await writeAudit(base44, req, user, {
        action: 'PARTICIPATION_CANCELLED', entity_type: 'RaffleParticipation', entity_id: p.id,
        old_value: JSON.stringify({ status: 'PENDING' }),
        new_value: JSON.stringify({ status: 'CANCELLED' }),
        description: `Participación cancelada por administrador en "${raffle ? raffle.name : ''}"`
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
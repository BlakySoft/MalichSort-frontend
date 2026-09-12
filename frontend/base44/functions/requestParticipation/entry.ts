import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { writeAudit } from '../../shared/security.ts';
import { isRaffleWindowOpen, findActiveParticipation } from '../../shared/participationUtils.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    const data = await req.json();

    if (data.action === 'request') {
      if (user.is_verified === false) return Response.json({ error: 'Debes verificar tu email para participar' }, { status: 403 });
      const active = await base44.asServiceRole.entities.TermsVersion.filter({ active: true });
      if (active.length !== 1) return Response.json({ error: 'No hay términos vigentes' }, { status: 409 });
      const terms = active[0];
      const acceptance = await base44.asServiceRole.entities.TermsAcceptance.filter({ user_id: user.id, terms_version_id: terms.id });
      if (!acceptance.length) return Response.json({ error: 'Debes aceptar los términos vigentes' }, { status: 403 });

      const raffle = await base44.asServiceRole.entities.Raffle.get(data.raffle_id);
      if (!isRaffleWindowOpen(raffle)) return Response.json({ error: 'El sorteo no admite participaciones en este momento' }, { status: 400 });

      const dup = await findActiveParticipation(base44, user.id, raffle.id);
      if (dup) return Response.json({ error: 'Ya tienes una participación activa en este sorteo' }, { status: 409 });

      const participation = await base44.asServiceRole.entities.RaffleParticipation.create({
        user_id: user.id,
        raffle_id: raffle.id,
        status: 'PENDING',
        requested_at: new Date().toISOString(),
        terms_version_id: terms.id,
        reviewed_at: '',
        reviewed_by: '',
        rejection_reason: '',
        payment_verified_at: '',
        payment_verified_by: '',
        payment_reference: '',
        admin_note: ''
      });
      await writeAudit(base44, req, user, {
        action: 'PARTICIPATION_CREATED', entity_type: 'RaffleParticipation', entity_id: participation.id,
        new_value: JSON.stringify({ raffle_id: raffle.id, raffle_name: raffle.name, status: 'PENDING' }),
        description: `Solicitud de participación en "${raffle.name}"`
      });
      return Response.json({ participation });
    }

    if (data.action === 'mine') {
      const list = await base44.asServiceRole.entities.RaffleParticipation.filter({ user_id: user.id }, '-requested_at', 200);
      const raffleIds = [...new Set(list.map((p) => p.raffle_id))];
      const raffles = await Promise.all(raffleIds.map((id) => base44.asServiceRole.entities.Raffle.get(id).catch(() => null)));
      const raffleMap: Record<string, any> = {};
      raffles.forEach((r) => { if (r) raffleMap[r.id] = r; });
      return Response.json({
        participations: list.map((p) => ({
          ...p,
          raffle: raffleMap[p.raffle_id] ? {
            name: raffleMap[p.raffle_id].name,
            prize_title: raffleMap[p.raffle_id].prize_title,
            status: raffleMap[p.raffle_id].status,
            slug: raffleMap[p.raffle_id].slug
          } : null
        }))
      });
    }

    if (data.action === 'cancel') {
      const p = await base44.asServiceRole.entities.RaffleParticipation.get(data.id);
      if (!p) return Response.json({ error: 'Participación no encontrada' }, { status: 404 });
      if (p.user_id !== user.id) return Response.json({ error: 'No autorizado' }, { status: 403 });
      if (p.status !== 'PENDING') return Response.json({ error: 'Solo se pueden cancelar solicitudes pendientes' }, { status: 400 });
      await base44.asServiceRole.entities.RaffleParticipation.update(p.id, {
        status: 'CANCELLED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email
      });
      await writeAudit(base44, req, user, {
        action: 'PARTICIPATION_CANCELLED', entity_type: 'RaffleParticipation', entity_id: p.id,
        old_value: JSON.stringify({ status: 'PENDING' }), new_value: JSON.stringify({ status: 'CANCELLED' }),
        description: 'Participación cancelada por el usuario'
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
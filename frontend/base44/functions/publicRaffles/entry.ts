import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sanitizePublic, PUBLISHED_STATUSES } from '../../shared/raffleUtils.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    if (data.action === 'list') {
      const raffles = await base44.asServiceRole.entities.Raffle.filter(
        { status: { $in: PUBLISHED_STATUSES } },
        '-start_date',
        100
      );
      return Response.json({ raffles: raffles.map(sanitizePublic) });
    }

    if (data.action === 'getBySlug') {
      const found = await base44.asServiceRole.entities.Raffle.filter({ slug: data.slug });
      if (!found.length || found[0].status === 'DRAFT') {
        return Response.json({ error: 'Sorteo no encontrado' }, { status: 404 });
      }
      return Response.json({ raffle: sanitizePublic(found[0]) });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
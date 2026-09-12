export const ACTIVE_PARTICIPATION_STATUSES = ["PENDING", "APPROVED"];

export function isRaffleWindowOpen(raffle: any, now: number = Date.now()): boolean {
  if (!raffle || raffle.status !== "ACTIVE") return false;
  const start = raffle.start_date ? new Date(raffle.start_date).getTime() : NaN;
  const end = raffle.end_date ? new Date(raffle.end_date).getTime() : NaN;
  if (isNaN(start) || isNaN(end)) return false;
  return start <= now && now < end;
}

export async function findActiveParticipation(base44: any, userId: string, raffleId: string): Promise<any | null> {
  const existing = await base44.asServiceRole.entities.RaffleParticipation.filter({
    user_id: userId,
    raffle_id: raffleId,
    status: { $in: ACTIVE_PARTICIPATION_STATUSES }
  });
  return existing[0] || null;
}
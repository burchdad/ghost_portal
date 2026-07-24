export function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

export function calculateShiftMinutes(input: { startedAt: Date; endedAt: Date; breakMinutes: number }) {
  const grossMinutes = minutesBetween(input.startedAt, input.endedAt);
  return {
    grossMinutes,
    breakMinutes: Math.max(0, input.breakMinutes),
    netMinutes: Math.max(0, grossMinutes - Math.max(0, input.breakMinutes))
  };
}

export function activeElapsedMinutes(startedAt: Date, now = new Date(), breakMinutes = 0, openBreakStartedAt?: Date | null) {
  const openBreakMinutes = openBreakStartedAt ? minutesBetween(openBreakStartedAt, now) : 0;
  return Math.max(0, minutesBetween(startedAt, now) - breakMinutes - openBreakMinutes);
}

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

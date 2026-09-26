/** Returns "Good morning", "Good afternoon" or "Good evening" based on the current time. */
export function getGreeting(date: Date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Formats an ISO date string like "Sep 26, 2026, 7:30 AM". */
export function formatDreamDate(isoDate: string) {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

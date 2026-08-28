const MILESTONES = [30, 60, 90, 180, 365, 365 * 2, 365 * 5, 365 * 10];

export function daysSober(sobrietyDate: string): number {
  const start = new Date(`${sobrietyDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function sobrietyMilestoneLabel(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'}`;
  return `${days} day${days === 1 ? '' : 's'}`;
}

// True only on the exact day a milestone is hit, for a little extra fanfare.
export function isMilestoneDay(days: number): boolean {
  return MILESTONES.includes(days);
}

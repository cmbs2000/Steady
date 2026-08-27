export type AssignmentStatus = 'pending' | 'done' | 'overdue';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// "Overdue" is never written to the database — it's derived here, every
// time assignment data is read, from whether a still-pending assignment's
// due date has passed. That keeps it always accurate (no daily job needed
// to flip a stored value) and avoids a stale reminder outliving a real
// due-date edit.
export function getEffectiveStatus(status: string, dueDate: string | null): AssignmentStatus {
  if (status === 'done') return 'done';
  if (dueDate && dueDate < todayDateString()) return 'overdue';
  return 'pending';
}

export const colors = {
  background: '#F6F7F5',
  surface: '#FFFFFF',
  border: '#E3E6E1',
  text: '#1D2420',
  textSecondary: '#5B665F',
  primary: '#2F6F5E',
  primaryLight: '#E4F0EB',
  done: '#2F8F5B',
  doneLight: '#E5F5EA',
  pending: '#B58A1E',
  pendingLight: '#FBF1DC',
  overdue: '#C1483B',
  overdueLight: '#FBE7E4',
  chipInactive: '#EEF0EC',
};

export const statusStyles: Record<'done' | 'pending' | 'overdue', { label: string; fg: string; bg: string }> = {
  done: { label: 'Done', fg: colors.done, bg: colors.doneLight },
  pending: { label: 'Pending', fg: colors.pending, bg: colors.pendingLight },
  overdue: { label: 'Overdue', fg: colors.overdue, bg: colors.overdueLight },
};

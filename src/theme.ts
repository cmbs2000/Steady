import { useColorScheme } from 'react-native';

const lightColors = {
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

const darkColors: typeof lightColors = {
  background: '#14181A',
  surface: '#1E2422',
  border: '#2D3532',
  text: '#EDF2EF',
  textSecondary: '#96A39D',
  primary: '#54AB8E',
  primaryLight: '#20332C',
  done: '#4FBD82',
  doneLight: '#1B3327',
  pending: '#DDB25A',
  pendingLight: '#332A16',
  overdue: '#E4776A',
  overdueLight: '#3B211D',
  chipInactive: '#242B29',
};

export type ThemeColors = typeof lightColors;

// Kept for the handful of non-component contexts (e.g. generated PDF HTML)
// that just want a fixed palette rather than the live theme.
export const colors = lightColors;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useStatusStyles(colors: ThemeColors): Record<'done' | 'pending' | 'overdue', { label: string; fg: string; bg: string }> {
  return {
    done: { label: 'Done', fg: colors.done, bg: colors.doneLight },
    pending: { label: 'Pending', fg: colors.pending, bg: colors.pendingLight },
    overdue: { label: 'Overdue', fg: colors.overdue, bg: colors.overdueLight },
  };
}

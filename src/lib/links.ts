export function getCheckinLink(sponseeId: string) {
  const base = process.env.EXPO_PUBLIC_CHECKIN_BASE_URL ?? 'http://localhost:8081';
  return `${base}/checkin/${sponseeId}`;
}

// PLACEHOLDER -- replace with the real Ko-fi page URL once it's created.
export const KOFI_URL = 'https://ko-fi.com/REPLACE_ME';

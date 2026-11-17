const COLOMBIA_TIME_ZONE = 'America/Bogota';

export const getTodayInColombia = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

export const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const startOfDayInColombia = (isoDate: string): Date =>
  new Date(`${isoDate}T00:00:00.000-05:00`);

export const endOfDayInColombia = (isoDate: string): Date =>
  new Date(`${isoDate}T23:59:59.999-05:00`);

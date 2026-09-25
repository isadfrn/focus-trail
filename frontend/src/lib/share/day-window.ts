export interface DayWindow {
  from: Date;
  to: Date;
}

export function localDayRange(date: Date): DayWindow {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return {
    from: new Date(year, month, day),
    to: new Date(year, month, day + 1),
  };
}

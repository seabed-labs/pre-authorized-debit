export function dateToUnixTimestamp(date: Date, floor: boolean = true): number {
  const timestampInSeconds = date.getTime() / 1e3;
  return floor ? Math.floor(timestampInSeconds) : Math.ceil(timestampInSeconds);
}

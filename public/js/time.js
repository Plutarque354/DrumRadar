export function iso(value) {
  if (typeof value !== 'string' || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const t = Date.parse(value); return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
export function inWindow(date, anchor, hours) {
  const d = iso(date), a = iso(anchor);
  return !!d && !!a && Date.parse(d) >= Date.parse(a)-hours*3600000 && Date.parse(d)<=Date.parse(a);
}
export function validZone(zone) { try { if (!zone) return false; new Intl.DateTimeFormat('en',{timeZone:zone}).format(); return true; } catch { return false; } }
export function formatTime(date, zone='UTC') {
  if (!iso(date)) return 'Unavailable';
  if (!validZone(zone)) return 'Creator timezone not configured';
  return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'short'}).format(new Date(date)) + ` · ${zone}`;
}


export function convertHRTime(hrtime) {
  const
    ns = (hrtime[0] * 1e9) + hrtime[1];
  const ms = ns / 1e6;
  const s = ns / 1e9;

  return {
    ns,
    ms,
    s,
  };
}

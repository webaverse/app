const alignN = n => index => {
  const r = index % n;
  return r === 0 ? index : (index + n - r);
};
const align4 = alignN(4);

export {
  alignN,
  align4,
};
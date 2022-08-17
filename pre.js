window.global = window.globalThis;

window.logNum = function(n) {
  const nStr = n.toFixed(2);
  return (n < 0 ? '' : '+') + nStr;
}

window.logVector3 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z);
}

window.logVector4 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z) + ' ' + window.logNum(v.w);
}
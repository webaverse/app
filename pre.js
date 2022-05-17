window.global = window.globalThis;

window.logNum = function(n) {
  n = parseFloat(n.toFixed(2));
  return (n < 0 ? '' : '+') + n;
}

window.logVector3 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z);
}

window.logVector4 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z) + ' ' + window.logNum(v.w);
}
window.global = window.globalThis;

window.logNum = function(n) {
  return (n < 0 ? '' : '+') + n.toFixed(2);
}

window.logVector3 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z);
}

window.logVector4 = function(v) {
  return window.logNum(v.x) + ' ' + window.logNum(v.y) + ' ' + window.logNum(v.z) + ' ' + window.logNum(v.w);
}
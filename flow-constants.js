const loadPromise = (async () => {
  const res = await fetch('https://contracts.webaverse.com/flow/flow-constants.js');
  let s = await res.text();
  s = s.replace(/^export default /, '');
  const j = eval(s);
  return j;
})();

export default {
	async load() {
	  return await loadPromise;
  },
};
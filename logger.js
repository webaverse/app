const logToConsole = true;
const warnToConsole = true;

export default {
  log: (...args) => {
    if (logToConsole) {
      console.log('*****', ...args);
    }
  },
  warn: (...args) => {
    if (warnToConsole) {
      console.warn('*****', ...args);
    }
  },
};

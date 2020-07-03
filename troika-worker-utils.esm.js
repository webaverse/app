/**
 * Lightweight thenable implementation that is entirely self-contained within a single
 * function with no external dependencies so it can be easily shipped across to a WorkerModule.
 *
 * This implementation conforms fully to the Promises/A+ spec so it can safely interoperate
 * with other thenable implementations. https://github.com/promises-aplus/promises-spec
 *
 * *However*, it is _not_ a full implementation of ES2015 Promises, e.g. it does not
 * have the same constructor signature and does not expose a `catch` method or the static
 * `resolve`/`reject`/`all`/`race` initializer methods. If you need to hand a Thenable
 * instance off to consuming code that may expect a true Promise, you'll want to wrap it
 * in a native-or-polyfilled Promise first.
 *
 * (Why yet another Promises/A+ implementation? Great question. We needed a polyfill-like
 * thing that was (a) wrapped in a single function for easy serialization across to a Worker,
 * and (b) was as small as possible -- at ~900B minified (~500B gzipped) this is the smallest
 * implementation I've found. And also, exercises like this are challenging and fun.)
 */
function BespokeThenable() {
  let state = 0; // 0=pending, 1=fulfilled, -1=rejected
  let queue = [];
  let value;
  let scheduled = 0;
  let completeCalled = 0;

  function then(onResolve, onReject) {
    const nextThenable = BespokeThenable();

    function handleNext() {
      const cb = state > 0 ? onResolve : onReject;
      if (isFn(cb)) {
        try {
          const result = cb(value);
          if (result === nextThenable) {
            recursiveError();
          }
          const resultThen = getThenableThen(result);
          if (resultThen) {
            resultThen.call(result, nextThenable.resolve, nextThenable.reject);
          } else {
            nextThenable.resolve(result);
          }
        } catch (err) {
          nextThenable.reject(err);
        }
      } else {
        nextThenable[state > 0 ? 'resolve' : 'reject'](value);
      }
    }

    queue.push(handleNext);
    if (state) {
      scheduleQueueFlush();
    }
    return nextThenable
  }

  const resolve = oneTime(val => {
    if (!completeCalled) {
      complete(1, val);
    }
  });

  const reject = oneTime(reason => {
    if (!completeCalled) {
      complete(-1, reason);
    }
  });

  function complete(st, val) {
    completeCalled++;
    let ignoreThrow = 0;
    try {
      if (val === thenableObj) {
        recursiveError();
      }
      const valThen = st > 0 && getThenableThen(val);
      if (valThen) {
        valThen.call(val, oneTime(v => {
          ignoreThrow++;
          complete(1, v);
        }), oneTime(v => {
          ignoreThrow++;
          complete(-1, v);
        }));
      } else {
        state = st;
        value = val;
        scheduleQueueFlush();
      }
    } catch(e) {
      if (!state && !ignoreThrow) {
        complete(-1, e);
      }
    }
  }

  function scheduleQueueFlush() {
    if (!scheduled) {
      setTimeout(flushQueue, 0); //TODO setImmediate or postMessage approach if available?
      scheduled = 1;
    }
  }

  function flushQueue() {
    const q = queue;
    scheduled = 0;
    queue = [];
    q.forEach(callIt);
  }

  function callIt(fn) {
    fn();
  }

  function getThenableThen(val) {
    const valThen = val && (isFn(val) || typeof val === 'object') && val.then;
    return isFn(valThen) && valThen
  }

  function oneTime(fn) {
    let called = 0;
    return function(...args) {
      if (!called++) {
        fn.apply(this, args);
      }
    }
  }

  function recursiveError() {
    throw new TypeError('Chaining cycle detected')
  }

  const isFn = v => typeof v === 'function';

  const thenableObj = {
    then,
    resolve,
    reject
  };
  return thenableObj
}


/**
 * Thenable implementation that uses a native Promise under the covers. This implementation
 * is preferred if Promise is available, for better performance and dev tools integration.
 * @constructor
 */
function NativePromiseThenable() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    then: promise.then.bind(promise),
    resolve,
    reject
  }
}

/**
 * Promise.all() impl:
 */
BespokeThenable.all = NativePromiseThenable.all = function(items) {
  let resultCount = 0;
  let results = [];
  let out = DefaultThenable();
  if (items.length === 0) {
    out.resolve([]);
  } else {
    items.forEach((item, i) => {
      let itemThenable = DefaultThenable();
      itemThenable.resolve(item);
      itemThenable.then(res => {
        resultCount++;
        results[i] = res;
        if (resultCount === items.length) {
          out.resolve(results);
        }
      }, out.reject);
    });
  }
  return out
};


/**
 * Choose the best Thenable implementation and export it as the default.
 */
const DefaultThenable = typeof Promise === 'function' ? NativePromiseThenable : BespokeThenable;

/**
 * Main content for the worker that handles the loading and execution of
 * modules within it.
 */
function workerBootstrap() {
  const modules = Object.create(null);

  // Handle messages for registering a module
  function registerModule({id, name, dependencies=[], init=function(){}, getTransferables=null}, callback) {
    // Only register once
    if (modules[id]) return

    try {
      // If any dependencies are modules, ensure they're registered and grab their value
      dependencies = dependencies.map(dep => {
        if (dep && dep.isWorkerModule) {
          registerModule(dep, depResult => {
            if (depResult instanceof Error) throw depResult
          });
          dep = modules[dep.id].value;
        }
        return dep
      });

      // Rehydrate functions
      init = rehydrate(`<${name}>.init`, init);
      if (getTransferables) {
        getTransferables = rehydrate(`<${name}>.getTransferables`, getTransferables);
      }

      // Initialize the module and store its value
      let value = null;
      if (typeof init === 'function') {
        value = init(...dependencies);
      } else {
        console.error('worker module init function failed to rehydrate');
      }
      modules[id] = {
        id,
        value,
        getTransferables
      };
      callback(value);
    } catch(err) {
      if (!(err && err.noLog)) {
        console.error(err);
      }
      callback(err);
    }
  }

  // Handle messages for calling a registered module's result function
  function callModule({id, args}, callback) {
    if (!modules[id] || typeof modules[id].value !== 'function') {
      callback(new Error(`Worker module ${id}: not found or its 'init' did not return a function`));
    }
    try {
      const result = modules[id].value(...args);
      if (result && typeof result.then === 'function') {
        result.then(handleResult, rej => callback(rej instanceof Error ? rej : new Error('' + rej)));
      } else {
        handleResult(result);
      }
    } catch(err) {
      callback(err);
    }
    function handleResult(result) {
      try {
        let tx = modules[id].getTransferables && modules[id].getTransferables(result);
        if (!tx || !Array.isArray(tx) || !tx.length) {
          tx = undefined; //postMessage is very picky about not passing null or empty transferables
        }
        callback(result, tx);
      } catch(err) {
        console.error(err);
        callback(err);
      }
    }
  }

  function rehydrate(name, str) {
    let result = void 0;
    self.troikaDefine = r => result = r;
    let url = URL.createObjectURL(
      new Blob(
        [`/** ${name.replace(/\*/g, '')} **/\n\ntroikaDefine(\n${str}\n)`],
        {type: 'application/javascript'}
      )
    );
    try {
      importScripts(url);
    } catch(err) {
      console.error(err);
    }
    URL.revokeObjectURL(url);
    delete self.troikaDefine;
    return result
  }

  // Handler for all messages within the worker
  self.addEventListener('message', e => {
    const {messageId, action, data} = e.data;
    try {
      // Module registration
      if (action === 'registerModule') {
        registerModule(data, result => {
          if (result instanceof Error) {
            postMessage({
              messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId,
              success: true,
              result: {isCallable: typeof result === 'function'}
            });
          }
        });
      }
      // Invocation
      if (action === 'callModule') {
        callModule(data, (result, transferables) => {
          if (result instanceof Error) {
            postMessage({
              messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId,
              success: true,
              result
            }, transferables || undefined);
          }
        });
      }
    } catch(err) {
      postMessage({
        messageId,
        success: false,
        error: err.stack
      });
    }
  });
}

/**
 * Fallback for `defineWorkerModule` that behaves identically but runs in the main
 * thread, for when the execution environment doesn't support web workers or they
 * are disallowed due to e.g. CSP security restrictions.
 */
function defineMainThreadModule(options) {
  let moduleFunc = function(...args) {
    return moduleFunc._getInitResult().then(initResult => {
      if (typeof initResult === 'function') {
        return initResult(...args)
      } else {
        throw new Error('Worker module function was called but `init` did not return a callable function')
      }
    })
  };
  moduleFunc._getInitResult = function() {
    // We can ignore getTransferables in main thread. TODO workerId?
    let {dependencies, init} = options;

    // Resolve dependencies
    dependencies = Array.isArray(dependencies) ? dependencies.map(dep =>
      dep && dep._getInitResult ? dep._getInitResult() : dep
    ) : [];

    // Invoke init with the resolved dependencies
    let initThenable = DefaultThenable.all(dependencies).then(deps => {
      return init.apply(null, deps)
    });

    // Cache the resolved promise for subsequent calls
    moduleFunc._getInitResult = () => initThenable;

    return initThenable
  };
  return moduleFunc
}

let supportsWorkers = () => {
  let supported = false;

  // Only attempt worker initialization in browsers; elsewhere it would just be
  // noise e.g. loading into a Node environment for SSR.
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    try {
      // TODO additional checks for things like importScripts within the worker?
      //  Would need to be an async check.
      let worker = new Worker(
        URL.createObjectURL(
          new Blob([''], { type: 'application/javascript' })
        )
      );
      worker.terminate();
      supported = true;
    } catch (err) {
      console.warn(`Troika createWorkerModule: web workers not allowed; falling back to main thread execution. Cause: [${err.message}]`);
    }
  }

  // Cached result
  supportsWorkers = () => supported;
  return supported
};

let _workerModuleId = 0;
let _messageId = 0;
let _allowInitAsString = false;
const workers = Object.create(null);
const openRequests = Object.create(null);
openRequests._count = 0;


/**
 * Define a module of code that will be executed with a web worker. This provides a simple
 * interface for moving chunks of logic off the main thread, and managing their dependencies
 * among one another.
 *
 * @param {object} options
 * @param {function} options.init - The main function that initializes the module. This will be run
 *        within the worker, and will be passed the resolved dependencies as arguments. Its
 *        return value becomes the module's content, which can then be used by other modules
 *        that depend on it. This function can perform any logic using those dependencies, but
 *        must not depend on anything from its parent closures.
 * @param {array} [options.dependencies] - Provides any dependencies required by the init function:
 *        - Primitives like strings, numbers, booleans
 *        - Raw functions; these will be stringified and rehydrated within the worker so they
 *          must not depend on anything from their parent closures
 *        - Other worker modules; these will be resolved within the worker, and therefore modules
 *          that provide functions can be called without having to cross the worker/main thread
 *          boundary.
 * @param {function} [options.getTransferables] - An optional function that will be run in the worker
 *        just before posting the response value from a module call back to the main thread.
 *        It will be passed that response value, and if it returns an array then that will be
 *        used as the "transferables" parameter to `postMessage`. Use this if there are values
 *        in the response that can/should be transfered rather than cloned.
 * @param {string} [options.name] - A descriptive name for this module; this can be useful for
 *        debugging but is not currently used for anything else.
 * @param {string} [options.workerId] - By default all modules will run in the same dedicated worker,
 *        but if you want to use multiple workers you can pass a `workerId` to indicate a specific
 *        worker to spawn. Note that each worker is completely standalone and no data or state will
 *        be shared between them. If a worker module is used as a dependency by worker modules
 *        using different `workerId`s, then that dependency will be re-registered in each worker.
 * @return {function(...[*]): {then}}
 */
function defineWorkerModule(options) {
  if ((!options || typeof options.init !== 'function') && !_allowInitAsString) {
    throw new Error('requires `options.init` function')
  }
  let {dependencies, init, getTransferables, workerId} = options;

  if (!supportsWorkers()) {
    return defineMainThreadModule(options)
  }

  if (workerId == null) {
    workerId = '#default';
  }
  const id = `workerModule${++_workerModuleId}`;
  const name = options.name || id;
  let registrationThenable = null;

  dependencies = dependencies && dependencies.map(dep => {
    // Wrap raw functions as worker modules with no dependencies
    if (typeof dep === 'function' && !dep.workerModuleData) {
      _allowInitAsString = true;
      dep = defineWorkerModule({
        workerId,
        name: `<${name}> function dependency: ${dep.name}`,
        init: `function(){return (\n${stringifyFunction(dep)}\n)}`
      });
      _allowInitAsString = false;
    }
    // Grab postable data for worker modules
    if (dep && dep.workerModuleData) {
      dep = dep.workerModuleData;
    }
    return dep
  });

  function moduleFunc(...args) {
    // Register this module if needed
    if (!registrationThenable) {
      registrationThenable = callWorker(workerId,'registerModule', moduleFunc.workerModuleData);
    }

    // Invoke the module, returning a thenable
    return registrationThenable.then(({isCallable}) => {
      if (isCallable) {
        return callWorker(workerId,'callModule', {id, args})
      } else {
        throw new Error('Worker module function was called but `init` did not return a callable function')
      }
    })
  }
  moduleFunc.workerModuleData = {
    isWorkerModule: true,
    id,
    name,
    dependencies,
    init: stringifyFunction(init),
    getTransferables: getTransferables && stringifyFunction(getTransferables)
  };
  return moduleFunc
}

/**
 * Stringifies a function into a form that can be deserialized in the worker
 * @param fn
 */
function stringifyFunction(fn) {
  let str = fn.toString();
  // If it was defined in object method/property format, it needs to be modified
  if (!/^function/.test(str) && /^\w+\s*\(/.test(str)) {
    str = 'function ' + str;
  }
  return str
}


function getWorker(workerId) {
  let worker = workers[workerId];
  if (!worker) {
    // Bootstrap the worker's content
    const bootstrap = stringifyFunction(workerBootstrap);

    // Create the worker from the bootstrap function content
    worker = workers[workerId] = new Worker(
      URL.createObjectURL(
        new Blob(
          [`/** Worker Module Bootstrap: ${workerId.replace(/\*/g, '')} **/\n\n;(${bootstrap})()`],
          {type: 'application/javascript'}
        )
      )
    );

    // Single handler for response messages from the worker
    worker.onmessage = e => {
      const response = e.data;
      const msgId = response.messageId;
      const callback = openRequests[msgId];
      if (!callback) {
        throw new Error('WorkerModule response with empty or unknown messageId')
      }
      delete openRequests[msgId];
      openRequests.count--;
      callback(response);
    };
  }
  return worker
}

// Issue a call to the worker with a callback to handle the response
function callWorker(workerId, action, data) {
  const thenable = DefaultThenable();
  const messageId = ++_messageId;
  openRequests[messageId] = response => {
    if (response.success) {
      thenable.resolve(response.result);
    } else {
      thenable.reject(new Error(`Error in worker ${action} call: ${response.error}`));
    }
  };
  openRequests._count++;
  if (openRequests.count > 1000) { //detect leaks
    console.warn('Large number of open WorkerModule requests, some may not be returning');
  }
  getWorker(workerId).postMessage({
    messageId,
    action,
    data
  });
  return thenable
}

/**
 * Just the {@link Thenable} function wrapped as a worker module. If another worker
 * module needs Thenable as a dependency, it's better to pass this module rather than
 * the raw function in its `dependencies` array so it only gets registered once.
 */
var ThenableWorkerModule = defineWorkerModule({
  name: 'Thenable',
  dependencies: [DefaultThenable],
  init: function(Thenable) {
    return Thenable
  }
});

export { DefaultThenable as Thenable, ThenableWorkerModule, defineWorkerModule, stringifyFunction };

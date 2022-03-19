import {getRenderer} from './renderer.js';
import debug from './debug.js';
import {waitForFrame} from './util.js';

const getGl = () => getRenderer().getContext();
let ext = null;
const getExt = () => {
  if (ext === null) {
    const gl = getGl();
    ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  }
  return ext;
}
const performanceTrackerFnSymbol = Symbol('performanceTrackerFn');

class PerformanceTracker extends EventTarget {
  constructor () {
    super();

    this.enabled = debug.enabled;
    this.queries = new Map();
    this.currentObject = null;
    this.results = new Map();
    this.prefix = '';

    debug.addEventListener('enabledchange', e => {
      this.enabled = e.data.enabled;
    });
  }
  startObject(name) {
    if (!this.enabled) return;
    
    if (this.prefix) {
      name = [this.prefix, name].join('.');
    }

    if (this.currentObject?.name !== name) {
      const gl = getGl();
      const ext = getExt();

      if (this.currentObject) {
        this.endObject();
      }

      const query = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    
      let currentObject = this.results.get(name);
      if (!currentObject) {
        currentObject = {
          name,
          time: 0,
        };
        this.results.set(name, currentObject);
      }
      this.currentObject = currentObject;

      let qs = this.queries.get(this.currentObject);
      if (!qs) {
        qs = [];
        this.queries.set(this.currentObject, qs);
      }
      qs.push(query);
    }
  }
  endObject() {
    if (!this.enabled) return;

    const gl = getGl();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    this.currentObject = null;
  }
  startFrame() {
    if (!this.enabled) return;

    this.dispatchEvent(new MessageEvent('startframe'));
  }
  setPrefix(prefix) {
    if (!this.enabled) return;

    this.prefix = prefix;
  }
  decorateApp(app) {
    const _makeOnBeforeRender = fn => {
      const resultFn = () => {
        this.startObject(app.name);
        fn && fn();
      };
      resultFn[performanceTrackerFnSymbol] = true;
      return resultFn;
    };
    /* const _makeOnAfterRender = fn => {
      const resultFn = () => {
        fn && fn();
        this.started && this.endObject();
      };
      resultFn[performanceTrackerFnSymbol] = true;
      return resultFn;
    }; */

    const _decorateObject = o => {
      if (o.isMesh) {
        if (!o.onBeforeRender?.[performanceTrackerFnSymbol]) {
          o.onBeforeRender = _makeOnBeforeRender(o.onBeforeRender);
        }
        /* if (!o.onAfterRender?.[performanceTrackerFnSymbol]) {
          o.onAfterRender = _makeOnAfterRender(o.onAfterRender);
        } */
      }
    }
    const _traverse = o => {
      _decorateObject(o);
      
      for (const child of o.children) {
        if (!child.isApp) {
          _traverse(child);
        }
      }
    }
    _traverse(app);
  }
  scheduleResults(results) {
    if (!this.enabled) return;

    (async () => {
      const renderer = getRenderer();
      const gl = renderer.getContext();

      for (const [name, object] of results) {
        const qs = this.queries.get(object);
        for (const query of qs) {
          // wait for query result
          for (;;) {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            if (available) {
              break;
            } else {
              await waitForFrame();
            }
          }

          // sum query result
          object.time += gl.getQueryParameter(query, gl.QUERY_RESULT);
          
          // cleanup
          // gl.deleteQuery(query);
        }

        // cleanup
        this.queries.delete(object);
      }

      // emit results
      this.dispatchEvent(new MessageEvent('results', {
        data: {
          results,
        },
      }));
    })();
  }
  endFrame() {
    if (!this.enabled) return;

    if (this.currentObject) {
      this.endObject();
    }
    this.scheduleResults(this.results);
    this.results = new Map();

    this.dispatchEvent(new MessageEvent('endframe'));
  }
}
const performanceTracker = new PerformanceTracker();
export default performanceTracker;
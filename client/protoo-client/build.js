const exports = {};
const module = {
    exports
};
var
    parcelRequire = function(e, r, t, n) {
        var i, o = "function" == typeof parcelRequire && parcelRequire,
            u = "function" == typeof require && require;

        function f(t, n) {
            if (!r[t]) {
                if (!e[t]) {
                    var i = "function" == typeof parcelRequire && parcelRequire;
                    if (!n && i) return i(t, !0);
                    if (o) return o(t, !0);
                    if (u && "string" == typeof t) return u(t);
                    var c = new Error("Cannot find module '" + t + "'");
                    throw c.code = "MODULE_NOT_FOUND", c
                }
                p.resolve = function(r) {
                    return e[t][1][r] || r
                }, p.cache = {};
                var l = r[t] = new f.Module(t);
                e[t][0].call(l.exports, p, l, l.exports, this)
            }
            return r[t].exports;

            function p(e) {
                return f(p.resolve(e))
            }
        }
        f.isParcelRequire = !0, f.Module = function(e) {
            this.id = e, this.bundle = f, this.exports = {}
        }, f.modules = e, f.cache = r, f.parent = o, f.register = function(r, t) {
            e[r] = [function(e, r) {
                r.exports = t
            }, {}]
        };
        for (var c = 0; c < t.length; c++) try {
            f(t[c])
        } catch (e) {
            i || (i = e)
        }
        if (t.length) {
            var l = f(t[t.length - 1]);
            "object" == typeof exports && "undefined" != typeof module ? module.exports = l : "function" == typeof define && define.amd ? define(function() {
                return l
            }) : n && (this[n] = l)
        }
        if (parcelRequire = f, i) throw i;
        return f
    }({
        "EHrm": [function(require, module, exports) {
            module.exports = {
                browserslist: ["last 1 Chrome version"],
                _from: "protoo-client@^4.0.4",
                _id: "protoo-client@4.0.4",
                _inBundle: !1,
                _integrity: "sha512-+WZUJJTlBSTWYeNu0Tv8SGI3kjettLvr2IUdBsAfioi0Szf8peeky79h6li7gThA3pIpNC+A+IuCUWaK7MlFfQ==",
                _location: "/protoo-client",
                _phantomChildren: {},
                _requested: {
                    type: "range",
                    registry: !0,
                    raw: "protoo-client@^4.0.4",
                    name: "protoo-client",
                    escapedName: "protoo-client",
                    rawSpec: "^4.0.4",
                    saveSpec: null,
                    fetchSpec: "^4.0.4"
                },
                _requiredBy: ["/"],
                _resolved: "https://registry.npmjs.org/protoo-client/-/protoo-client-4.0.4.tgz",
                _shasum: "597070eebe5dc13350d31260ea3c55c06031a0b8",
                _spec: "protoo-client@^4.0.4",
                _where: "/Users/k/Documents/GitHub/dialog",
                author: {
                    name: "Iñaki Baz Castillo",
                    email: "ibc@aliax.net"
                },
                bugs: {
                    url: "https://github.com/ibc/protoo/issues"
                },
                bundleDependencies: !1,
                dependencies: {
                    debug: "^4.1.1",
                    events: "^3.1.0",
                    retry: "^0.12.0",
                    websocket: "^1.0.31"
                },
                deprecated: !1,
                description: "protoo JavaScript client module",
                devDependencies: {
                    eslint: "^5.16.0"
                },
                engines: {
                    node: ">=8.0.0"
                },
                homepage: "https://protoojs.org",
                keywords: ["nodejs", "browser", "websocket"],
                license: "MIT",
                main: "lib/index.js",
                name: "protoo-client",
                optionalDependencies: {
                    websocket: "^1.0.31"
                },
                repository: {
                    type: "git",
                    url: "git+https://github.com/ibc/protoo.git"
                },
                scripts: {
                    lint: "eslint -c .eslintrc.js lib"
                },
                version: "4.0.4"
            };
        }, {}],
        "J3Y7": [function(require, module, exports) {
            var s = 1e3,
                e = 60 * s,
                r = 60 * e,
                a = 24 * r,
                n = 7 * a,
                c = 365.25 * a;

            function t(t) {
                if (!((t = String(t)).length > 100)) {
                    var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(t);
                    if (u) {
                        var i = parseFloat(u[1]);
                        switch ((u[2] || "ms").toLowerCase()) {
                            case "years":
                            case "year":
                            case "yrs":
                            case "yr":
                            case "y":
                                return i * c;
                            case "weeks":
                            case "week":
                            case "w":
                                return i * n;
                            case "days":
                            case "day":
                            case "d":
                                return i * a;
                            case "hours":
                            case "hour":
                            case "hrs":
                            case "hr":
                            case "h":
                                return i * r;
                            case "minutes":
                            case "minute":
                            case "mins":
                            case "min":
                            case "m":
                                return i * e;
                            case "seconds":
                            case "second":
                            case "secs":
                            case "sec":
                            case "s":
                                return i * s;
                            case "milliseconds":
                            case "millisecond":
                            case "msecs":
                            case "msec":
                            case "ms":
                                return i;
                            default:
                                return
                        }
                    }
                }
            }

            function u(n) {
                var c = Math.abs(n);
                return c >= a ? Math.round(n / a) + "d" : c >= r ? Math.round(n / r) + "h" : c >= e ? Math.round(n / e) + "m" : c >= s ? Math.round(n / s) + "s" : n + "ms"
            }

            function i(n) {
                var c = Math.abs(n);
                return c >= a ? o(n, c, a, "day") : c >= r ? o(n, c, r, "hour") : c >= e ? o(n, c, e, "minute") : c >= s ? o(n, c, s, "second") : n + " ms"
            }

            function o(s, e, r, a) {
                var n = e >= 1.5 * r;
                return Math.round(s / r) + " " + a + (n ? "s" : "")
            }
            module.exports = function(s, e) {
                e = e || {};
                var r = typeof s;
                if ("string" === r && s.length > 0) return t(s);
                if ("number" === r && isFinite(s)) return e.long ? i(s) : u(s);
                throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(s))
            };
        }, {}],
        "PId8": [function(require, module, exports) {
            function e(e) {
                function n(e) {
                    let n = 0;
                    for (let t = 0; t < e.length; t++) n = (n << 5) - n + e.charCodeAt(t), n |= 0;
                    return t.colors[Math.abs(n) % t.colors.length]
                }

                function t(e) {
                    let o;

                    function i(...e) {
                        if (!i.enabled) return;
                        const n = i,
                            s = Number(new Date),
                            r = s - (o || s);
                        n.diff = r, n.prev = o, n.curr = s, o = s, e[0] = t.coerce(e[0]), "string" != typeof e[0] && e.unshift("%O");
                        let a = 0;
                        e[0] = e[0].replace(/%([a-zA-Z%])/g, (s, r) => {
                            if ("%%" === s) return s;
                            a++;
                            const o = t.formatters[r];
                            if ("function" == typeof o) {
                                const t = e[a];
                                s = o.call(n, t), e.splice(a, 1), a--
                            }
                            return s
                        }), t.formatArgs.call(n, e), (n.log || t.log).apply(n, e)
                    }
                    return i.namespace = e, i.enabled = t.enabled(e), i.useColors = t.useColors(), i.color = n(e), i.destroy = s, i.extend = r, "function" == typeof t.init && t.init(i), t.instances.push(i), i
                }

                function s() {
                    const e = t.instances.indexOf(this);
                    return -1 !== e && (t.instances.splice(e, 1), !0)
                }

                function r(e, n) {
                    const s = t(this.namespace + (void 0 === n ? ":" : n) + e);
                    return s.log = this.log, s
                }

                function o(e) {
                    return e.toString().substring(2, e.toString().length - 2).replace(/\.\*\?$/, "*")
                }
                return t.debug = t, t.default = t, t.coerce = function(e) {
                    if (e instanceof Error) return e.stack || e.message;
                    return e
                }, t.disable = function() {
                    const e = [...t.names.map(o), ...t.skips.map(o).map(e => "-" + e)].join(",");
                    return t.enable(""), e
                }, t.enable = function(e) {
                    let n;
                    t.save(e), t.names = [], t.skips = [];
                    const s = ("string" == typeof e ? e : "").split(/[\s,]+/),
                        r = s.length;
                    for (n = 0; n < r; n++) s[n] && ("-" === (e = s[n].replace(/\*/g, ".*?"))[0] ? t.skips.push(new RegExp("^" + e.substr(1) + "$")) : t.names.push(new RegExp("^" + e + "$")));
                    for (n = 0; n < t.instances.length; n++) {
                        const e = t.instances[n];
                        e.enabled = t.enabled(e.namespace)
                    }
                }, t.enabled = function(e) {
                    if ("*" === e[e.length - 1]) return !0;
                    let n, s;
                    for (n = 0, s = t.skips.length; n < s; n++)
                        if (t.skips[n].test(e)) return !1;
                    for (n = 0, s = t.names.length; n < s; n++)
                        if (t.names[n].test(e)) return !0;
                    return !1
                }, t.humanize = require("ms"), Object.keys(e).forEach(n => {
                    t[n] = e[n]
                }), t.instances = [], t.names = [], t.skips = [], t.formatters = {}, t.selectColor = n, t.enable(t.load()), t
            }
            module.exports = e;
        }, {
            "ms": "J3Y7"
        }],
        "kfLt": [function(require, module, exports) {

            var t, e, n = module.exports = {};

            function r() {
                throw new Error("setTimeout has not been defined")
            }

            function o() {
                throw new Error("clearTimeout has not been defined")
            }

            function i(e) {
                if (t === setTimeout) return setTimeout(e, 0);
                if ((t === r || !t) && setTimeout) return t = setTimeout, setTimeout(e, 0);
                try {
                    return t(e, 0)
                } catch (n) {
                    try {
                        return t.call(null, e, 0)
                    } catch (n) {
                        return t.call(this, e, 0)
                    }
                }
            }

            function u(t) {
                if (e === clearTimeout) return clearTimeout(t);
                if ((e === o || !e) && clearTimeout) return e = clearTimeout, clearTimeout(t);
                try {
                    return e(t)
                } catch (n) {
                    try {
                        return e.call(null, t)
                    } catch (n) {
                        return e.call(this, t)
                    }
                }
            }! function() {
                try {
                    t = "function" == typeof setTimeout ? setTimeout : r
                } catch (n) {
                    t = r
                }
                try {
                    e = "function" == typeof clearTimeout ? clearTimeout : o
                } catch (n) {
                    e = o
                }
            }();
            var c, s = [],
                l = !1,
                a = -1;

            function f() {
                l && c && (l = !1, c.length ? s = c.concat(s) : a = -1, s.length && h())
            }

            function h() {
                if (!l) {
                    var t = i(f);
                    l = !0;
                    for (var e = s.length; e;) {
                        for (c = s, s = []; ++a < e;) c && c[a].run();
                        a = -1, e = s.length
                    }
                    c = null, l = !1, u(t)
                }
            }

            function m(t, e) {
                this.fun = t, this.array = e
            }

            function p() {}
            n.nextTick = function(t) {
                var e = new Array(arguments.length - 1);
                if (arguments.length > 1)
                    for (var n = 1; n < arguments.length; n++) e[n - 1] = arguments[n];
                s.push(new m(t, e)), 1 !== s.length || l || i(h)
            }, m.prototype.run = function() {
                this.fun.apply(null, this.array)
            }, n.title = "browser", n.env = {}, n.argv = [], n.version = "", n.versions = {}, n.on = p, n.addListener = p, n.once = p, n.off = p, n.removeListener = p, n.removeAllListeners = p, n.emit = p, n.prependListener = p, n.prependOnceListener = p, n.listeners = function(t) {
                return []
            }, n.binding = function(t) {
                throw new Error("process.binding is not supported")
            }, n.cwd = function() {
                return "/"
            }, n.chdir = function(t) {
                throw new Error("process.chdir is not supported")
            }, n.umask = function() {
                return 0
            };
        }, {}],
        "BYFN": [function(require, module, exports) {
            var process = require("process");
            var e = require("process");

            function o() {
                return !("undefined" == typeof window || !window.process || "renderer" !== window.process.type && !window.process.__nwjs) || ("undefined" == typeof navigator || !navigator.userAgent || !navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) && ("undefined" != typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "undefined" != typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
            }

            function C(e) {
                if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff), !this.useColors) return;
                const o = "color: " + this.color;
                e.splice(1, 0, o, "color: inherit");
                let C = 0,
                    t = 0;
                e[0].replace(/%[a-zA-Z%]/g, e => {
                    "%%" !== e && (C++, "%c" === e && (t = C))
                }), e.splice(t, 0, o)
            }

            function t(...e) {
                return "object" == typeof console && console.log && console.log(...e)
            }

            function r(e) {
                try {
                    e ? exports.storage.setItem("debug", e) : exports.storage.removeItem("debug")
                } catch (o) {}
            }

            function n() {
                let o;
                try {
                    o = exports.storage.getItem("debug")
                } catch (C) {}
                return !o && void 0 !== e && "env" in e && (o = void 0), o
            }

            function s() {
                try {
                    return localStorage
                } catch (e) {}
            }
            exports.log = t, exports.formatArgs = C, exports.save = r, exports.load = n, exports.useColors = o, exports.storage = s(), exports.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"], module.exports = require("./common")(exports);
            const {
                formatters: F
            } = module.exports;
            F.j = function(e) {
                try {
                    return JSON.stringify(e)
                } catch (o) {
                    return "[UnexpectedJSONParseError]: " + o.message
                }
            };
        }, {
            "./common": "PId8",
            "process": "kfLt"
        }],
        "p5bA": [function(require, module, exports) {
            const r = require("debug"),
                o = "protoo-client";
            class e {
                constructor(e) {
                    e ? (this._debug = r(`${o}:${e}`), this._warn = r(`${o}:WARN:${e}`), this._error = r(`${o}:ERROR:${e}`)) : (this._debug = r(o), this._warn = r(`${o}:WARN`), this._error = r(`${o}:ERROR`)), this._debug.log = console.info.bind(console), this._warn.log = console.warn.bind(console), this._error.log = console.error.bind(console)
                }
                get debug() {
                    return this._debug
                }
                get warn() {
                    return this._warn
                }
                get error() {
                    return this._error
                }
            }
            module.exports = e;
        }, {
            "debug": "BYFN"
        }],
        "vY5P": [function(require, module, exports) {
            "use strict";
            var e, t = "object" == typeof Reflect ? Reflect : null,
                n = t && "function" == typeof t.apply ? t.apply : function(e, t, n) {
                    return Function.prototype.apply.call(e, t, n)
                };

            function r(e) {
                console && console.warn && console.warn(e)
            }
            e = t && "function" == typeof t.ownKeys ? t.ownKeys : Object.getOwnPropertySymbols ? function(e) {
                return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))
            } : function(e) {
                return Object.getOwnPropertyNames(e)
            };
            var i = Number.isNaN || function(e) {
                return e != e
            };

            function o() {
                o.init.call(this)
            }
            module.exports = o, o.EventEmitter = o, o.prototype._events = void 0, o.prototype._eventsCount = 0, o.prototype._maxListeners = void 0;
            var s = 10;

            function u(e) {
                if ("function" != typeof e) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e)
            }

            function f(e) {
                return void 0 === e._maxListeners ? o.defaultMaxListeners : e._maxListeners
            }

            function v(e, t, n, i) {
                var o, s, v;
                if (u(n), void 0 === (s = e._events) ? (s = e._events = Object.create(null), e._eventsCount = 0) : (void 0 !== s.newListener && (e.emit("newListener", t, n.listener ? n.listener : n), s = e._events), v = s[t]), void 0 === v) v = s[t] = n, ++e._eventsCount;
                else if ("function" == typeof v ? v = s[t] = i ? [n, v] : [v, n] : i ? v.unshift(n) : v.push(n), (o = f(e)) > 0 && v.length > o && !v.warned) {
                    v.warned = !0;
                    var l = new Error("Possible EventEmitter memory leak detected. " + v.length + " " + String(t) + " listeners added. Use emitter.setMaxListeners() to increase limit");
                    l.name = "MaxListenersExceededWarning", l.emitter = e, l.type = t, l.count = v.length, r(l)
                }
                return e
            }

            function l() {
                if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, 0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments)
            }

            function a(e, t, n) {
                var r = {
                        fired: !1,
                        wrapFn: void 0,
                        target: e,
                        type: t,
                        listener: n
                    },
                    i = l.bind(r);
                return i.listener = n, r.wrapFn = i, i
            }

            function h(e, t, n) {
                var r = e._events;
                if (void 0 === r) return [];
                var i = r[t];
                return void 0 === i ? [] : "function" == typeof i ? n ? [i.listener || i] : [i] : n ? d(i) : c(i, i.length)
            }

            function p(e) {
                var t = this._events;
                if (void 0 !== t) {
                    var n = t[e];
                    if ("function" == typeof n) return 1;
                    if (void 0 !== n) return n.length
                }
                return 0
            }

            function c(e, t) {
                for (var n = new Array(t), r = 0; r < t; ++r) n[r] = e[r];
                return n
            }

            function y(e, t) {
                for (; t + 1 < e.length; t++) e[t] = e[t + 1];
                e.pop()
            }

            function d(e) {
                for (var t = new Array(e.length), n = 0; n < t.length; ++n) t[n] = e[n].listener || e[n];
                return t
            }
            Object.defineProperty(o, "defaultMaxListeners", {
                enumerable: !0,
                get: function() {
                    return s
                },
                set: function(e) {
                    if ("number" != typeof e || e < 0 || i(e)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e + ".");
                    s = e
                }
            }), o.init = function() {
                void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0
            }, o.prototype.setMaxListeners = function(e) {
                if ("number" != typeof e || e < 0 || i(e)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
                return this._maxListeners = e, this
            }, o.prototype.getMaxListeners = function() {
                return f(this)
            }, o.prototype.emit = function(e) {
                for (var t = [], r = 1; r < arguments.length; r++) t.push(arguments[r]);
                var i = "error" === e,
                    o = this._events;
                if (void 0 !== o) i = i && void 0 === o.error;
                else if (!i) return !1;
                if (i) {
                    var s;
                    if (t.length > 0 && (s = t[0]), s instanceof Error) throw s;
                    var u = new Error("Unhandled error." + (s ? " (" + s.message + ")" : ""));
                    throw u.context = s, u
                }
                var f = o[e];
                if (void 0 === f) return !1;
                if ("function" == typeof f) n(f, this, t);
                else {
                    var v = f.length,
                        l = c(f, v);
                    for (r = 0; r < v; ++r) n(l[r], this, t)
                }
                return !0
            }, o.prototype.addListener = function(e, t) {
                return v(this, e, t, !1)
            }, o.prototype.on = o.prototype.addListener, o.prototype.prependListener = function(e, t) {
                return v(this, e, t, !0)
            }, o.prototype.once = function(e, t) {
                return u(t), this.on(e, a(this, e, t)), this
            }, o.prototype.prependOnceListener = function(e, t) {
                return u(t), this.prependListener(e, a(this, e, t)), this
            }, o.prototype.removeListener = function(e, t) {
                var n, r, i, o, s;
                if (u(t), void 0 === (r = this._events)) return this;
                if (void 0 === (n = r[e])) return this;
                if (n === t || n.listener === t) 0 == --this._eventsCount ? this._events = Object.create(null) : (delete r[e], r.removeListener && this.emit("removeListener", e, n.listener || t));
                else if ("function" != typeof n) {
                    for (i = -1, o = n.length - 1; o >= 0; o--)
                        if (n[o] === t || n[o].listener === t) {
                            s = n[o].listener, i = o;
                            break
                        } if (i < 0) return this;
                    0 === i ? n.shift() : y(n, i), 1 === n.length && (r[e] = n[0]), void 0 !== r.removeListener && this.emit("removeListener", e, s || t)
                }
                return this
            }, o.prototype.off = o.prototype.removeListener, o.prototype.removeAllListeners = function(e) {
                var t, n, r;
                if (void 0 === (n = this._events)) return this;
                if (void 0 === n.removeListener) return 0 === arguments.length ? (this._events = Object.create(null), this._eventsCount = 0) : void 0 !== n[e] && (0 == --this._eventsCount ? this._events = Object.create(null) : delete n[e]), this;
                if (0 === arguments.length) {
                    var i, o = Object.keys(n);
                    for (r = 0; r < o.length; ++r) "removeListener" !== (i = o[r]) && this.removeAllListeners(i);
                    return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this
                }
                if ("function" == typeof(t = n[e])) this.removeListener(e, t);
                else if (void 0 !== t)
                    for (r = t.length - 1; r >= 0; r--) this.removeListener(e, t[r]);
                return this
            }, o.prototype.listeners = function(e) {
                return h(this, e, !0)
            }, o.prototype.rawListeners = function(e) {
                return h(this, e, !1)
            }, o.listenerCount = function(e, t) {
                return "function" == typeof e.listenerCount ? e.listenerCount(t) : p.call(e, t)
            }, o.prototype.listenerCount = p, o.prototype.eventNames = function() {
                return this._eventsCount > 0 ? e(this._events) : []
            };
        }, {}],
        "Oomd": [function(require, module, exports) {
            const {
                EventEmitter: e
            } = require("events"), t = require("./Logger");
            class r extends e {
                constructor(e) {
                    super(), this.setMaxListeners(1 / 0), this._logger = e || new t("EnhancedEventEmitter")
                }
                safeEmit(e, ...t) {
                    try {
                        this.emit(e, ...t)
                    } catch (r) {
                        this._logger.error("safeEmit() | event listener threw an error [event:%s]:%o", e, r)
                    }
                }
                async safeEmitAsPromise(e, ...t) {
                    return new Promise((r, s) => {
                        this.safeEmit(e, ...t, r, s)
                    })
                }
            }
            module.exports = r;
        }, {
            "events": "vY5P",
            "./Logger": "p5bA"
        }],
        "FOZT": [function(require, module, exports) {
            exports.generateRandomNumber = function() {
                return Math.round(1e7 * Math.random())
            };
        }, {}],
        "fyRg": [function(require, module, exports) {
            const e = require("./Logger"),
                {
                    generateRandomNumber: r
                } = require("./utils"),
                i = new e("Message");
            class t {
                static parse(e) {
                    let r;
                    const t = {};
                    try {
                        r = JSON.parse(e)
                    } catch (o) {
                        return void i.error("parse() | invalid JSON: %s", o)
                    }
                    if ("object" == typeof r && !Array.isArray(r)) {
                        if (r.request) {
                            if (t.request = !0, "string" != typeof r.method) return void i.error("parse() | missing/invalid method field");
                            if ("number" != typeof r.id) return void i.error("parse() | missing/invalid id field");
                            t.id = r.id, t.method = r.method, t.data = r.data || {}
                        } else if (r.response) {
                            if (t.response = !0, "number" != typeof r.id) return void i.error("parse() | missing/invalid id field");
                            t.id = r.id, r.ok ? (t.ok = !0, t.data = r.data || {}) : (t.ok = !1, t.errorCode = r.errorCode, t.errorReason = r.errorReason)
                        } else {
                            if (!r.notification) return void i.error("parse() | missing request/response field");
                            if (t.notification = !0, "string" != typeof r.method) return void i.error("parse() | missing/invalid method field");
                            t.method = r.method, t.data = r.data || {}
                        }
                        return t
                    }
                    i.error("parse() | not an object")
                }
                static createRequest(e, i) {
                    return {
                        request: !0,
                        id: r(),
                        method: e,
                        data: i || {}
                    }
                }
                static createSuccessResponse(e, r) {
                    return {
                        response: !0,
                        id: e.id,
                        ok: !0,
                        data: r || {}
                    }
                }
                static createErrorResponse(e, r, i) {
                    return {
                        response: !0,
                        id: e.id,
                        ok: !1,
                        errorCode: r,
                        errorReason: i
                    }
                }
                static createNotification(e, r) {
                    return {
                        notification: !0,
                        method: e,
                        data: r || {}
                    }
                }
            }
            module.exports = t;
        }, {
            "./Logger": "p5bA",
            "./utils": "FOZT"
        }],
        "VMrj": [function(require, module, exports) {
            const e = require("./Logger"),
                t = require("./EnhancedEventEmitter"),
                s = require("./Message"),
                o = new e("Peer");
            class i extends t {
                constructor(e) {
                    super(o), o.debug("constructor()"), this._closed = !1, this._transport = e, this._connected = !1, this._data = {}, this._sents = new Map, this._handleTransport()
                }
                get closed() {
                    return this._closed
                }
                get connected() {
                    return this._connected
                }
                get data() {
                    return this._data
                }
                set data(e) {
                    throw new Error("cannot override data object")
                }
                close() {
                    if (!this._closed) {
                        o.debug("close()"), this._closed = !0, this._connected = !1, this._transport.close();
                        for (const e of this._sents.values()) e.close();
                        this.safeEmit("close")
                    }
                }
                async request(e, t) {
                    const o = s.createRequest(e, t);
                    return this._logger.debug("request() [method:%s, id:%s]", e, o.id), await this._transport.send(o), new Promise((e, t) => {
                        const s = 1500 * (15 + .1 * this._sents.size),
                            i = {
                                id: o.id,
                                method: o.method,
                                resolve: t => {
                                    this._sents.delete(o.id) && (clearTimeout(i.timer), e(t))
                                },
                                reject: e => {
                                    this._sents.delete(o.id) && (clearTimeout(i.timer), t(e))
                                },
                                timer: setTimeout(() => {
                                    this._sents.delete(o.id) && t(new Error("request timeout"))
                                }, s),
                                close: () => {
                                    clearTimeout(i.timer), t(new Error("peer closed"))
                                }
                            };
                        this._sents.set(o.id, i)
                    })
                }
                async notify(e, t) {
                    const o = s.createNotification(e, t);
                    this._logger.debug("notify() [method:%s]", e), await this._transport.send(o)
                }
                _handleTransport() {
                    if (this._transport.closed) return this._closed = !0, void setTimeout(() => {
                        this._closed || (this._connected = !1, this.safeEmit("close"))
                    });
                    this._transport.on("open", () => {
                        this._closed || (o.debug('emit "open"'), this._connected = !0, this.safeEmit("open"))
                    }), this._transport.on("disconnected", () => {
                        this._closed || (o.debug('emit "disconnected"'), this._connected = !1, this.safeEmit("disconnected"))
                    }), this._transport.on("failed", e => {
                        this._closed || (o.debug('emit "failed" [currentAttempt:%s]', e), this._connected = !1, this.safeEmit("failed", e))
                    }), this._transport.on("close", () => {
                        this._closed || (this._closed = !0, o.debug('emit "close"'), this._connected = !1, this.safeEmit("close"))
                    }), this._transport.on("message", e => {
                        e.request ? this._handleRequest(e) : e.response ? this._handleResponse(e) : e.notification && this._handleNotification(e)
                    })
                }
                _handleRequest(e) {
                    try {
                        this.emit("request", e, t => {
                            const o = s.createSuccessResponse(e, t);
                            this._transport.send(o).catch(() => {})
                        }, (t, o) => {
                            t instanceof Error ? (t = 500, o = String(t)) : "number" == typeof t && o instanceof Error && (o = String(o));
                            const i = s.createErrorResponse(e, t, o);
                            this._transport.send(i).catch(() => {})
                        })
                    } catch (t) {
                        const o = s.createErrorResponse(e, 500, String(t));
                        this._transport.send(o).catch(() => {})
                    }
                }
                _handleResponse(e) {
                    const t = this._sents.get(e.id);
                    if (t)
                        if (e.ok) t.resolve(e.data);
                        else {
                            const s = new Error(e.errorReason);
                            s.code = e.errorCode, t.reject(s)
                        }
                    else o.error("received response does not match any sent request [id:%s]", e.id)
                }
                _handleNotification(e) {
                    this.safeEmit("notification", e)
                }
            }
            module.exports = i;
        }, {
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd",
            "./Message": "fyRg"
        }],
        "ML23": [function(require, module, exports) {
            var t = function() {
                if ("object" == typeof self && self) return self;
                if ("object" == typeof window && window) return window;
                throw new Error("Unable to resolve global `this`")
            };
            module.exports = function() {
                if (this) return this;
                if ("object" == typeof globalThis && globalThis) return globalThis;
                try {
                    Object.defineProperty(Object.prototype, "__global__", {
                        get: function() {
                            return this
                        },
                        configurable: !0
                    })
                } catch (e) {
                    return t()
                }
                try {
                    return __global__ || t()
                } finally {
                    delete Object.prototype.__global__
                }
            }();
        }, {}],
        "bR10": [function(require, module, exports) {
            module.exports = {
                _args: [
                    ["websocket@1.0.31", "/Users/k/Documents/GitHub/dialog"]
                ],
                _from: "websocket@1.0.31",
                _id: "websocket@1.0.31",
                _inBundle: !1,
                _integrity: "sha512-VAouplvGKPiKFDTeCCO65vYHsyay8DqoBSlzIO3fayrfOgU94lQN5a1uWVnFrMLceTJw/+fQXR5PGbUVRaHshQ==",
                _location: "/websocket",
                _phantomChildren: {
                    ms: "2.0.0"
                },
                _requested: {
                    type: "version",
                    registry: !0,
                    raw: "websocket@1.0.31",
                    name: "websocket",
                    escapedName: "websocket",
                    rawSpec: "1.0.31",
                    saveSpec: null,
                    fetchSpec: "1.0.31"
                },
                _requiredBy: ["/protoo-client", "/protoo-server"],
                _resolved: "https://registry.npmjs.org/websocket/-/websocket-1.0.31.tgz",
                _spec: "1.0.31",
                _where: "/Users/k/Documents/GitHub/dialog",
                author: {
                    name: "Brian McKelvey",
                    email: "theturtle32@gmail.com",
                    url: "https://github.com/theturtle32"
                },
                browser: "lib/browser.js",
                bugs: {
                    url: "https://github.com/theturtle32/WebSocket-Node/issues"
                },
                config: {
                    verbose: !1
                },
                contributors: [{
                    name: "Iñaki Baz Castillo",
                    email: "ibc@aliax.net",
                    url: "http://dev.sipdoc.net"
                }],
                dependencies: {
                    debug: "^2.2.0",
                    "es5-ext": "^0.10.50",
                    nan: "^2.14.0",
                    "typedarray-to-buffer": "^3.1.5",
                    yaeti: "^0.0.6"
                },
                description: "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
                devDependencies: {
                    "buffer-equal": "^1.0.0",
                    faucet: "^0.0.1",
                    gulp: "^4.0.2",
                    "gulp-jshint": "^2.0.4",
                    jshint: "^2.0.0",
                    "jshint-stylish": "^2.2.1",
                    tape: "^4.9.1"
                },
                directories: {
                    lib: "./lib"
                },
                engines: {
                    node: ">=0.10.0"
                },
                homepage: "https://github.com/theturtle32/WebSocket-Node",
                keywords: ["websocket", "websockets", "socket", "networking", "comet", "push", "RFC-6455", "realtime", "server", "client"],
                license: "Apache-2.0",
                main: "index",
                name: "websocket",
                repository: {
                    type: "git",
                    url: "git+https://github.com/theturtle32/WebSocket-Node.git"
                },
                scripts: {
                    gulp: "gulp",
                    install: "(node-gyp rebuild 2> builderror.log) || (exit 0)",
                    test: "faucet test/unit"
                },
                version: "1.0.31"
            };
        }, {}],
        "CGCI": [function(require, module, exports) {
            module.exports = require("../package.json").version;
        }, {
            "../package.json": "bR10"
        }],
        "eEKz": [function(require, module, exports) {
            var e;
            try {
                e = require("es5-ext/global")
            } catch (t) {} finally {
                if (e || "undefined" == typeof window || (e = window), !e) throw new Error("Could not determine global this")
            }
            var n = e.WebSocket || e.MozWebSocket,
                o = require("./version");

            function r(e, o) {
                return o ? new n(e, o) : new n(e)
            }
            n && ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function(e) {
                Object.defineProperty(r, e, {
                    get: function() {
                        return n[e]
                    }
                })
            }), module.exports = {
                w3cwebsocket: n ? r : null,
                version: o
            };
        }, {
            "es5-ext/global": "ML23",
            "./version": "CGCI"
        }],
        "dNUO": [function(require, module, exports) {
            function t(t, e) {
                "boolean" == typeof e && (e = {
                    forever: e
                }), this._originalTimeouts = JSON.parse(JSON.stringify(t)), this._timeouts = t, this._options = e || {}, this._maxRetryTime = e && e.maxRetryTime || 1 / 0, this._fn = null, this._errors = [], this._attempts = 1, this._operationTimeout = null, this._operationTimeoutCb = null, this._timeout = null, this._operationStart = null, this._options.forever && (this._cachedTimeouts = this._timeouts.slice(0))
            }
            module.exports = t, t.prototype.reset = function() {
                this._attempts = 1, this._timeouts = this._originalTimeouts
            }, t.prototype.stop = function() {
                this._timeout && clearTimeout(this._timeout), this._timeouts = [], this._cachedTimeouts = null
            }, t.prototype.retry = function(t) {
                if (this._timeout && clearTimeout(this._timeout), !t) return !1;
                var e = (new Date).getTime();
                if (t && e - this._operationStart >= this._maxRetryTime) return this._errors.unshift(new Error("RetryOperation timeout occurred")), !1;
                this._errors.push(t);
                var i = this._timeouts.shift();
                if (void 0 === i) {
                    if (!this._cachedTimeouts) return !1;
                    this._errors.splice(this._errors.length - 1, this._errors.length), this._timeouts = this._cachedTimeouts.slice(0), i = this._timeouts.shift()
                }
                var o = this,
                    r = setTimeout(function() {
                        o._attempts++, o._operationTimeoutCb && (o._timeout = setTimeout(function() {
                            o._operationTimeoutCb(o._attempts)
                        }, o._operationTimeout), o._options.unref && o._timeout.unref()), o._fn(o._attempts)
                    }, i);
                return this._options.unref && r.unref(), !0
            }, t.prototype.attempt = function(t, e) {
                this._fn = t, e && (e.timeout && (this._operationTimeout = e.timeout), e.cb && (this._operationTimeoutCb = e.cb));
                var i = this;
                this._operationTimeoutCb && (this._timeout = setTimeout(function() {
                    i._operationTimeoutCb()
                }, i._operationTimeout)), this._operationStart = (new Date).getTime(), this._fn(this._attempts)
            }, t.prototype.try = function(t) {
                console.log("Using RetryOperation.try() is deprecated"), this.attempt(t)
            }, t.prototype.start = function(t) {
                console.log("Using RetryOperation.start() is deprecated"), this.attempt(t)
            }, t.prototype.start = t.prototype.try, t.prototype.errors = function() {
                return this._errors
            }, t.prototype.attempts = function() {
                return this._attempts
            }, t.prototype.mainError = function() {
                if (0 === this._errors.length) return null;
                for (var t = {}, e = null, i = 0, o = 0; o < this._errors.length; o++) {
                    var r = this._errors[o],
                        s = r.message,
                        n = (t[s] || 0) + 1;
                    t[s] = n, n >= i && (e = r, i = n)
                }
                return e
            };
        }, {}],
        "rxeB": [function(require, module, exports) {
            var r = require("./retry_operation");
            exports.operation = function(t) {
                var e = exports.timeouts(t);
                return new r(e, {
                    forever: t && t.forever,
                    unref: t && t.unref,
                    maxRetryTime: t && t.maxRetryTime
                })
            }, exports.timeouts = function(r) {
                if (r instanceof Array) return [].concat(r);
                var t = {
                    retries: 10,
                    factor: 2,
                    minTimeout: 1e3,
                    maxTimeout: 1 / 0,
                    randomize: !1
                };
                for (var e in r) t[e] = r[e];
                if (t.minTimeout > t.maxTimeout) throw new Error("minTimeout is greater than maxTimeout");
                for (var o = [], n = 0; n < t.retries; n++) o.push(this.createTimeout(n, t));
                return r && r.forever && !o.length && o.push(this.createTimeout(n, t)), o.sort(function(r, t) {
                    return r - t
                }), o
            }, exports.createTimeout = function(r, t) {
                var e = t.randomize ? Math.random() + 1 : 1,
                    o = Math.round(e * t.minTimeout * Math.pow(t.factor, r));
                return o = Math.min(o, t.maxTimeout)
            }, exports.wrap = function(r, t, e) {
                if (t instanceof Array && (e = t, t = null), !e)
                    for (var o in e = [], r) "function" == typeof r[o] && e.push(o);
                for (var n = 0; n < e.length; n++) {
                    var i = e[n],
                        a = r[i];
                    r[i] = function(e) {
                        var o = exports.operation(t),
                            n = Array.prototype.slice.call(arguments, 1),
                            i = n.pop();
                        n.push(function(r) {
                            o.retry(r) || (r && (arguments[0] = o.mainError()), i.apply(this, arguments))
                        }), o.attempt(function() {
                            e.apply(r, n)
                        })
                    }.bind(r, a), r[i].options = t
                }
            };
        }, {
            "./retry_operation": "dNUO"
        }],
        "jaZo": [function(require, module, exports) {
            module.exports = require("./lib/retry");
        }, {
            "./lib/retry": "rxeB"
        }],
        "l4pJ": [function(require, module, exports) {
            const e = require("websocket").w3cwebsocket,
                s = require("retry"),
                t = require("../Logger"),
                o = require("../EnhancedEventEmitter"),
                r = require("../Message"),
                i = "protoo",
                n = {
                    retries: 10,
                    factor: 2,
                    minTimeout: 1e3,
                    maxTimeout: 8e3
                },
                c = new t("WebSocketTransport");
            class h extends o {
                constructor(e, s) {
                    super(c), c.debug("constructor() [url:%s, options:%o]", e, s), this._closed = !1, this._url = e, this._options = s || {}, this._ws = null, this._runWebSocket()
                }
                get closed() {
                    return this._closed
                }
                close() {
                    if (!this._closed) {
                        c.debug("close()"), this._closed = !0, this.safeEmit("close");
                        try {
                            this._ws.onopen = null, this._ws.onclose = null, this._ws.onerror = null, this._ws.onmessage = null, this._ws.close()
                        } catch (e) {
                            c.error("close() | error closing the WebSocket: %o", e)
                        }
                    }
                }
                async send(e) {
                    if (this._closed) throw new Error("transport closed");
                    try {
                        this._ws.send(JSON.stringify(e))
                    } catch (s) {
                        throw c.warn("send() failed:%o", s), s
                    }
                }
                _runWebSocket() {
                    const t = s.operation(this._options.retry || n);
                    let o = !1;
                    t.attempt(s => {
                        this._closed ? t.stop() : (c.debug("_runWebSocket() [currentAttempt:%s]", s), this._ws = new e(this._url, i, this._options.origin, this._options.headers, this._options.requestOptions, this._options.clientConfig), this._ws.onopen = (() => {
                            this._closed || (o = !0, this.safeEmit("open"))
                        }), this._ws.onclose = (e => {
                            if (!this._closed) {
                                if (c.warn('WebSocket "close" event [wasClean:%s, code:%s, reason:"%s"]', e.wasClean, e.code, e.reason), 4e3 !== e.code) {
                                    if (o) {
                                        if (t.stop(), this.safeEmit("disconnected"), this._closed) return;
                                        return void this._runWebSocket()
                                    }
                                    if (this.safeEmit("failed", s), this._closed) return;
                                    if (t.retry(!0)) return
                                }
                                this._closed = !0, this.safeEmit("close")
                            }
                        }), this._ws.onerror = (() => {
                            this._closed || c.error('WebSocket "error" event')
                        }), this._ws.onmessage = (e => {
                            if (this._closed) return;
                            const s = r.parse(e.data);
                            s && (0 !== this.listenerCount("message") ? this.safeEmit("message", s) : c.error('no listeners for WebSocket "message" event, ignoring received message'))
                        }))
                    })
                }
            }
            module.exports = h;
        }, {
            "websocket": "eEKz",
            "retry": "jaZo",
            "../Logger": "p5bA",
            "../EnhancedEventEmitter": "Oomd",
            "../Message": "fyRg"
        }],
        "Focm": [function(require, module, exports) {
            const {
                version: e
            } = require("../package.json"), r = require("./Peer"), o = require("./transports/WebSocketTransport");
            exports.version = e, exports.Peer = r, exports.WebSocketTransport = o;
        }, {
            "../package.json": "EHrm",
            "./Peer": "VMrj",
            "./transports/WebSocketTransport": "l4pJ"
        }]
    }, {}, ["Focm"], null)
//# sourceMappingURL=/index.js.map
export default module.exports;
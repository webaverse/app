/* const exports = {};
const module = {
    exports
}; */

// console.log('got module', module, exports);

var parcelRequire = function(e, r, t, n) {
    t = globalThis;
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
            e[t][0].call(l.exports, p, l, l.exports, globalThis)
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
    "FaBc": [function(require, module, exports) {
        "use strict";

        function t() {
            return (t = Object.assign || function(t) {
                for (var n = 1; n < arguments.length; n++) {
                    var r = arguments[n];
                    for (var e in r) Object.prototype.hasOwnProperty.call(r, e) && (t[e] = r[e])
                }
                return t
            }).apply(this, arguments)
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.why = exports.uuidExists = exports.uuid = exports.update = exports.put = exports.pipe = exports.makeUnknown = exports.makeTransaction = exports.makeScript = exports.makeProposer = exports.makePing = exports.makePayer = exports.makeParam = exports.makeGetTransactionStatus = exports.makeGetLatestBlock = exports.makeGetEvents = exports.makeGetAccount = exports.makeAuthorizer = exports.isUnknown = exports.isTransaction = exports.isScript = exports.isPing = exports.isParam = exports.isOk = exports.isInteraction = exports.isGetTransactionStatus = exports.isGetLatestBlock = exports.isGetEvents = exports.isGetAccount = exports.isBad = exports.isAccount = exports.interaction = exports.get = exports.destroy = exports.UNKNOWN = exports.TRANSACTION = exports.SCRIPT = exports.PING = exports.PARAM = exports.Ok = exports.OK = exports.GET_TRANSACTION_STATUS = exports.GET_LATEST_BLOCK = exports.GET_EVENTS = exports.GET_ACCOUNT = exports.Bad = exports.BAD = exports.ACCOUNT = void 0;
        var n = 1,
            r = 2,
            e = 4,
            o = 8,
            s = 16,
            a = 32,
            u = 64,
            i = 128,
            p = 1,
            c = 2,
            l = 1,
            x = 2,
            f = '{\n  "tag":1,\n  "assigns":{},\n  "status":2,\n  "reason":null,\n  "accounts":{},\n  "params":{},\n  "message": {\n    "cadence":null,\n    "refBlock":null,\n    "computLimit":null,\n    "proposer":null,\n    "payer":null,\n    "authorizations":[],\n    "params":[]\n  },\n  "proposer":null,\n  "authorizations":[],\n  "payer":null,\n  "events": {\n    "eventType":null,\n    "start":null,\n    "end":null\n  },\n  "latestBlock": {\n    "isSealed":null\n  },\n  "accountAddr":null,\n  "transactionId":null\n}',
            m = new Set(Object.keys(JSON.parse(f))),
            k = function() {
                return JSON.parse(f)
            },
            d = function(t) {
                return Array.isArray(t)
            },
            v = function(t) {
                return null == t
            },
            T = "abcdefghijklmnopqrstuvwxyz0123456789".split(""),
            A = function() {
                return T[~~(Math.random() * T.length)]
            },
            g = function() {
                return Array.from({
                    length: 10
                }, A).join("")
            },
            y = function(t, n) {
                return Boolean(t.accounts[n] || t.params[n])
            },
            N = function(t) {
                if ("object" != typeof t || v(t) || function(t) {
                        return "number" === t
                    }(t)) return !1;
                var n = m,
                    r = Array.isArray(n),
                    e = 0;
                for (n = r ? n : n[Symbol.iterator]();;) {
                    var o;
                    if (r) {
                        if (e >= n.length) break;
                        o = n[e++]
                    } else {
                        if ((e = n.next()).done) break;
                        o = e.value
                    }
                    if (!t.hasOwnProperty(o)) return !1
                }
                return !0
            },
            O = function(t) {
                return t.status = 2, t
            },
            S = function(t, n) {
                return t.status = 1, t.reason = n, t
            },
            h = function(t) {
                return function(n) {
                    return n.tag = t, O(n)
                }
            },
            G = function(n, r) {
                return function(e) {
                    return e.accounts[r] = JSON.parse('{\n  "kind":1,\n  "tempId":null,\n  "addr":null,\n  "keyId":null,\n  "sequenceNum":null,\n  "signature":null,\n  "signingFunction":null,\n  "resolve":null,\n  "role": {\n    "proposer":false,\n    "authorizer":false,\n    "payer":false,\n    "param":false\n  }\n}'), e.accounts[r].tempId = r, e.accounts[r].addr = n.addr, e.accounts[r].keyId = n.keyId, e.accounts[r].sequenceNum = n.sequenceNum, e.accounts[r].signature = n.signature, e.accounts[r].signingFunction = n.signingFunction, e.accounts[r].resolve = n.resolve, e.accounts[r].role = t({}, e.accounts[r].role, {}, n.role), O(e)
                }
            },
            P = function(t) {
                return function(n) {
                    for (var r = g(); y(n, r);) r = g();
                    return n.authorizations.push(r), O(tt(n, [G(t, r)]))
                }
            },
            E = function(t) {
                return function(n) {
                    for (var r = g(); y(n, r);) r = g();
                    return n.proposer = r, O(tt(n, [G(t, r)]))
                }
            },
            I = function(t) {
                return function(n) {
                    for (var r = g(); y(n, r);) r = g();
                    return n.payer = r, O(tt(n, [G(t, r)]))
                }
            },
            B = function(t) {
                return function(n) {
                    for (var r = g(); y(n, r);) r = g();
                    return n.message.params.push(r), n.params[r] = JSON.parse('{\n  "kind":2,\n  "tempId":null,\n  "key":null,\n  "value":null,\n  "xform":null,\n  "resolve": null\n}'), n.params[r].tempId = r, n.params[r].key = t.key, n.params[r].value = t.value, n.params[r].xform = t.xform, n.params[r].resolve = t.resolve, O(n)
                }
            },
            C = h(1),
            w = h(2),
            _ = h(4),
            U = h(8),
            b = h(16),
            j = h(32),
            L = h(64),
            R = h(128),
            z = function(t) {
                return function(n) {
                    return Boolean(n.tag & t)
                }
            },
            K = z(1),
            q = z(2),
            J = z(4),
            M = z(8),
            F = z(16),
            D = z(32),
            V = z(64),
            W = z(128),
            H = function(t) {
                return Boolean(2 & t.status)
            },
            Q = function(t) {
                return Boolean(1 & t.status)
            },
            X = function(t) {
                return t.reason
            },
            Y = function(t) {
                return Boolean(1 & t.kind)
            },
            Z = function(t) {
                return Boolean(2 & t.kind)
            },
            $ = function t(n, r) {
                void 0 === r && (r = []);
                try {
                    return Promise.resolve(n).then(function(e) {
                        if (n = function(t) {
                                for (var n = 0, r = Object.keys(t); n < r.length; n++) {
                                    var e = r[n];
                                    if (!m.has(e)) throw new Error('"' + e + '" is an invalid root level Interaction property.')
                                }
                                return t
                            }(e), Q(n) || !r.length) return n;
                        var o = r[0],
                            s = r.slice(1);
                        return Promise.resolve(o).then(function(r) {
                            if ("function" == typeof r) return t(r(n), s);
                            if (v(r) || !r) return t(n, s);
                            if (N(r)) return t(r, s);
                            throw new Error("Invalid Interaction Composition")
                        })
                    })
                } catch (t) {
                    return Promise.reject(t)
                }
            },
            tt = function t() {
                for (var n = arguments.length, r = new Array(n), e = 0; e < n; e++) r[e] = arguments[e];
                var o = r[0],
                    s = r[1];
                return d(o) && null == s ? function(n) {
                    return t(n, o)
                } : $(o, s)
            },
            nt = function(t) {
                return t
            },
            rt = function(t, n, r) {
                return null == t.assigns[n] ? r : t.assigns[n]
            },
            et = function(t, n) {
                return function(r) {
                    return r.assigns[t] = n, O(r)
                }
            },
            ot = function(t, n) {
                return void 0 === n && (n = nt),
                    function(r) {
                        return r.assigns[t] = n(r.assigns[t], r), O(r)
                    }
            },
            st = function(t) {
                return function(n) {
                    return delete n.assigns[t], O(n)
                }
            };
        exports.destroy = st, exports.update = ot, exports.put = et, exports.get = rt, exports.pipe = tt, exports.isParam = Z, exports.isAccount = Y, exports.why = X, exports.isBad = Q, exports.isOk = H, exports.isPing = W, exports.isGetLatestBlock = V, exports.isGetEvents = D, exports.isGetAccount = F, exports.isGetTransactionStatus = M, exports.isTransaction = J, exports.isScript = q, exports.isUnknown = K, exports.makePing = R, exports.makeGetLatestBlock = L, exports.makeGetEvents = j, exports.makeGetAccount = b, exports.makeGetTransactionStatus = U, exports.makeTransaction = _, exports.makeScript = w, exports.makeUnknown = C, exports.makeParam = B, exports.makePayer = I, exports.makeProposer = E, exports.makeAuthorizer = P, exports.Bad = S, exports.Ok = O, exports.isInteraction = N, exports.uuidExists = y, exports.uuid = g, exports.interaction = k, exports.PARAM = x, exports.ACCOUNT = l, exports.OK = c, exports.BAD = p, exports.PING = i, exports.GET_LATEST_BLOCK = u, exports.GET_EVENTS = a, exports.GET_ACCOUNT = s, exports.GET_TRANSACTION_STATUS = o, exports.TRANSACTION = e, exports.SCRIPT = r, exports.UNKNOWN = n;
    }, {}],
    "JBCS": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.build = r;
        var e = require("@onflow/interaction");

        function r(r = []) {
            return (0, e.pipe)((0, e.interaction)(), r)
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "UIhZ": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.resolve = void 0;
        var e = require("@onflow/interaction");
        const o = e.pipe;
        exports.resolve = o;
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "iKuJ": [function(require, module, exports) {
        "use strict";
        exports.byteLength = u, exports.toByteArray = i, exports.fromByteArray = d;
        for (var r = [], t = [], e = "undefined" != typeof Uint8Array ? Uint8Array : Array, n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", o = 0, a = n.length; o < a; ++o) r[o] = n[o], t[n.charCodeAt(o)] = o;

        function h(r) {
            var t = r.length;
            if (t % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
            var e = r.indexOf("=");
            return -1 === e && (e = t), [e, e === t ? 0 : 4 - e % 4]
        }

        function u(r) {
            var t = h(r),
                e = t[0],
                n = t[1];
            return 3 * (e + n) / 4 - n
        }

        function c(r, t, e) {
            return 3 * (t + e) / 4 - e
        }

        function i(r) {
            var n, o, a = h(r),
                u = a[0],
                i = a[1],
                f = new e(c(r, u, i)),
                A = 0,
                d = i > 0 ? u - 4 : u;
            for (o = 0; o < d; o += 4) n = t[r.charCodeAt(o)] << 18 | t[r.charCodeAt(o + 1)] << 12 | t[r.charCodeAt(o + 2)] << 6 | t[r.charCodeAt(o + 3)], f[A++] = n >> 16 & 255, f[A++] = n >> 8 & 255, f[A++] = 255 & n;
            return 2 === i && (n = t[r.charCodeAt(o)] << 2 | t[r.charCodeAt(o + 1)] >> 4, f[A++] = 255 & n), 1 === i && (n = t[r.charCodeAt(o)] << 10 | t[r.charCodeAt(o + 1)] << 4 | t[r.charCodeAt(o + 2)] >> 2, f[A++] = n >> 8 & 255, f[A++] = 255 & n), f
        }

        function f(t) {
            return r[t >> 18 & 63] + r[t >> 12 & 63] + r[t >> 6 & 63] + r[63 & t]
        }

        function A(r, t, e) {
            for (var n, o = [], a = t; a < e; a += 3) n = (r[a] << 16 & 16711680) + (r[a + 1] << 8 & 65280) + (255 & r[a + 2]), o.push(f(n));
            return o.join("")
        }

        function d(t) {
            for (var e, n = t.length, o = n % 3, a = [], h = 0, u = n - o; h < u; h += 16383) a.push(A(t, h, h + 16383 > u ? u : h + 16383));
            return 1 === o ? (e = t[n - 1], a.push(r[e >> 2] + r[e << 4 & 63] + "==")) : 2 === o && (e = (t[n - 2] << 8) + t[n - 1], a.push(r[e >> 10] + r[e >> 4 & 63] + r[e << 2 & 63] + "=")), a.join("")
        }
        t["-".charCodeAt(0)] = 62, t["_".charCodeAt(0)] = 63;
    }, {}],
    "LqlQ": [function(require, module, exports) {
        exports.read = function(a, o, t, r, h) {
            var M, p, w = 8 * h - r - 1,
                f = (1 << w) - 1,
                e = f >> 1,
                i = -7,
                N = t ? h - 1 : 0,
                n = t ? -1 : 1,
                s = a[o + N];
            for (N += n, M = s & (1 << -i) - 1, s >>= -i, i += w; i > 0; M = 256 * M + a[o + N], N += n, i -= 8);
            for (p = M & (1 << -i) - 1, M >>= -i, i += r; i > 0; p = 256 * p + a[o + N], N += n, i -= 8);
            if (0 === M) M = 1 - e;
            else {
                if (M === f) return p ? NaN : 1 / 0 * (s ? -1 : 1);
                p += Math.pow(2, r), M -= e
            }
            return (s ? -1 : 1) * p * Math.pow(2, M - r)
        }, exports.write = function(a, o, t, r, h, M) {
            var p, w, f, e = 8 * M - h - 1,
                i = (1 << e) - 1,
                N = i >> 1,
                n = 23 === h ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                s = r ? 0 : M - 1,
                u = r ? 1 : -1,
                l = o < 0 || 0 === o && 1 / o < 0 ? 1 : 0;
            for (o = Math.abs(o), isNaN(o) || o === 1 / 0 ? (w = isNaN(o) ? 1 : 0, p = i) : (p = Math.floor(Math.log(o) / Math.LN2), o * (f = Math.pow(2, -p)) < 1 && (p--, f *= 2), (o += p + N >= 1 ? n / f : n * Math.pow(2, 1 - N)) * f >= 2 && (p++, f /= 2), p + N >= i ? (w = 0, p = i) : p + N >= 1 ? (w = (o * f - 1) * Math.pow(2, h), p += N) : (w = o * Math.pow(2, N - 1) * Math.pow(2, h), p = 0)); h >= 8; a[t + s] = 255 & w, s += u, w /= 256, h -= 8);
            for (p = p << h | w, e += h; e > 0; a[t + s] = 255 & p, s += u, p /= 256, e -= 8);
            a[t + s - u] |= 128 * l
        };
    }, {}],
    "hNJ8": [function(require, module, exports) {
        var r = {}.toString;
        module.exports = Array.isArray || function(t) {
            return "[object Array]" == r.call(t)
        };
    }, {}],
    "ARb5": [function(require, module, exports) {

        var global = arguments[3];
        var t = arguments[3],
            r = require("base64-js"),
            e = require("ieee754"),
            n = require("isarray");

        function i() {
            try {
                var t = new Uint8Array(1);
                return t.__proto__ = {
                    __proto__: Uint8Array.prototype,
                    foo: function() {
                        return 42
                    }
                }, 42 === t.foo() && "function" == typeof t.subarray && 0 === t.subarray(1, 1).byteLength
            } catch (r) {
                return !1
            }
        }

        function o() {
            return f.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
        }

        function u(t, r) {
            if (o() < r) throw new RangeError("Invalid typed array length");
            return f.TYPED_ARRAY_SUPPORT ? (t = new Uint8Array(r)).__proto__ = f.prototype : (null === t && (t = new f(r)), t.length = r), t
        }

        function f(t, r, e) {
            if (!(f.TYPED_ARRAY_SUPPORT || this instanceof f)) return new f(t, r, e);
            if ("number" == typeof t) {
                if ("string" == typeof r) throw new Error("If encoding is specified then the first argument must be a string");
                return c(this, t)
            }
            return s(this, t, r, e)
        }

        function s(t, r, e, n) {
            if ("number" == typeof r) throw new TypeError('"value" argument must not be a number');
            return "undefined" != typeof ArrayBuffer && r instanceof ArrayBuffer ? g(t, r, e, n) : "string" == typeof r ? l(t, r, e) : y(t, r)
        }

        function h(t) {
            if ("number" != typeof t) throw new TypeError('"size" argument must be a number');
            if (t < 0) throw new RangeError('"size" argument must not be negative')
        }

        function a(t, r, e, n) {
            return h(r), r <= 0 ? u(t, r) : void 0 !== e ? "string" == typeof n ? u(t, r).fill(e, n) : u(t, r).fill(e) : u(t, r)
        }

        function c(t, r) {
            if (h(r), t = u(t, r < 0 ? 0 : 0 | w(r)), !f.TYPED_ARRAY_SUPPORT)
                for (var e = 0; e < r; ++e) t[e] = 0;
            return t
        }

        function l(t, r, e) {
            if ("string" == typeof e && "" !== e || (e = "utf8"), !f.isEncoding(e)) throw new TypeError('"encoding" must be a valid string encoding');
            var n = 0 | v(r, e),
                i = (t = u(t, n)).write(r, e);
            return i !== n && (t = t.slice(0, i)), t
        }

        function p(t, r) {
            var e = r.length < 0 ? 0 : 0 | w(r.length);
            t = u(t, e);
            for (var n = 0; n < e; n += 1) t[n] = 255 & r[n];
            return t
        }

        function g(t, r, e, n) {
            if (r.byteLength, e < 0 || r.byteLength < e) throw new RangeError("'offset' is out of bounds");
            if (r.byteLength < e + (n || 0)) throw new RangeError("'length' is out of bounds");
            return r = void 0 === e && void 0 === n ? new Uint8Array(r) : void 0 === n ? new Uint8Array(r, e) : new Uint8Array(r, e, n), f.TYPED_ARRAY_SUPPORT ? (t = r).__proto__ = f.prototype : t = p(t, r), t
        }

        function y(t, r) {
            if (f.isBuffer(r)) {
                var e = 0 | w(r.length);
                return 0 === (t = u(t, e)).length ? t : (r.copy(t, 0, 0, e), t)
            }
            if (r) {
                if ("undefined" != typeof ArrayBuffer && r.buffer instanceof ArrayBuffer || "length" in r) return "number" != typeof r.length || W(r.length) ? u(t, 0) : p(t, r);
                if ("Buffer" === r.type && n(r.data)) return p(t, r.data)
            }
            throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
        }

        function w(t) {
            if (t >= o()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + o().toString(16) + " bytes");
            return 0 | t
        }

        function d(t) {
            return +t != t && (t = 0), f.alloc(+t)
        }

        function v(t, r) {
            if (f.isBuffer(t)) return t.length;
            if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t) || t instanceof ArrayBuffer)) return t.byteLength;
            "string" != typeof t && (t = "" + t);
            var e = t.length;
            if (0 === e) return 0;
            for (var n = !1;;) switch (r) {
                case "ascii":
                case "latin1":
                case "binary":
                    return e;
                case "utf8":
                case "utf-8":
                case void 0:
                    return $(t).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return 2 * e;
                case "hex":
                    return e >>> 1;
                case "base64":
                    return K(t).length;
                default:
                    if (n) return $(t).length;
                    r = ("" + r).toLowerCase(), n = !0
            }
        }

        function E(t, r, e) {
            var n = !1;
            if ((void 0 === r || r < 0) && (r = 0), r > this.length) return "";
            if ((void 0 === e || e > this.length) && (e = this.length), e <= 0) return "";
            if ((e >>>= 0) <= (r >>>= 0)) return "";
            for (t || (t = "utf8");;) switch (t) {
                case "hex":
                    return x(this, r, e);
                case "utf8":
                case "utf-8":
                    return Y(this, r, e);
                case "ascii":
                    return L(this, r, e);
                case "latin1":
                case "binary":
                    return D(this, r, e);
                case "base64":
                    return S(this, r, e);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return C(this, r, e);
                default:
                    if (n) throw new TypeError("Unknown encoding: " + t);
                    t = (t + "").toLowerCase(), n = !0
            }
        }

        function b(t, r, e) {
            var n = t[r];
            t[r] = t[e], t[e] = n
        }

        function R(t, r, e, n, i) {
            if (0 === t.length) return -1;
            if ("string" == typeof e ? (n = e, e = 0) : e > 2147483647 ? e = 2147483647 : e < -2147483648 && (e = -2147483648), e = +e, isNaN(e) && (e = i ? 0 : t.length - 1), e < 0 && (e = t.length + e), e >= t.length) {
                if (i) return -1;
                e = t.length - 1
            } else if (e < 0) {
                if (!i) return -1;
                e = 0
            }
            if ("string" == typeof r && (r = f.from(r, n)), f.isBuffer(r)) return 0 === r.length ? -1 : _(t, r, e, n, i);
            if ("number" == typeof r) return r &= 255, f.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(t, r, e) : Uint8Array.prototype.lastIndexOf.call(t, r, e) : _(t, [r], e, n, i);
            throw new TypeError("val must be string, number or Buffer")
        }

        function _(t, r, e, n, i) {
            var o, u = 1,
                f = t.length,
                s = r.length;
            if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
                if (t.length < 2 || r.length < 2) return -1;
                u = 2, f /= 2, s /= 2, e /= 2
            }

            function h(t, r) {
                return 1 === u ? t[r] : t.readUInt16BE(r * u)
            }
            if (i) {
                var a = -1;
                for (o = e; o < f; o++)
                    if (h(t, o) === h(r, -1 === a ? 0 : o - a)) {
                        if (-1 === a && (a = o), o - a + 1 === s) return a * u
                    } else -1 !== a && (o -= o - a), a = -1
            } else
                for (e + s > f && (e = f - s), o = e; o >= 0; o--) {
                    for (var c = !0, l = 0; l < s; l++)
                        if (h(t, o + l) !== h(r, l)) {
                            c = !1;
                            break
                        } if (c) return o
                }
            return -1
        }

        function A(t, r, e, n) {
            e = Number(e) || 0;
            var i = t.length - e;
            n ? (n = Number(n)) > i && (n = i) : n = i;
            var o = r.length;
            if (o % 2 != 0) throw new TypeError("Invalid hex string");
            n > o / 2 && (n = o / 2);
            for (var u = 0; u < n; ++u) {
                var f = parseInt(r.substr(2 * u, 2), 16);
                if (isNaN(f)) return u;
                t[e + u] = f
            }
            return u
        }

        function m(t, r, e, n) {
            return Q($(r, t.length - e), t, e, n)
        }

        function P(t, r, e, n) {
            return Q(G(r), t, e, n)
        }

        function T(t, r, e, n) {
            return P(t, r, e, n)
        }

        function B(t, r, e, n) {
            return Q(K(r), t, e, n)
        }

        function U(t, r, e, n) {
            return Q(H(r, t.length - e), t, e, n)
        }

        function S(t, e, n) {
            return 0 === e && n === t.length ? r.fromByteArray(t) : r.fromByteArray(t.slice(e, n))
        }

        function Y(t, r, e) {
            e = Math.min(t.length, e);
            for (var n = [], i = r; i < e;) {
                var o, u, f, s, h = t[i],
                    a = null,
                    c = h > 239 ? 4 : h > 223 ? 3 : h > 191 ? 2 : 1;
                if (i + c <= e) switch (c) {
                    case 1:
                        h < 128 && (a = h);
                        break;
                    case 2:
                        128 == (192 & (o = t[i + 1])) && (s = (31 & h) << 6 | 63 & o) > 127 && (a = s);
                        break;
                    case 3:
                        o = t[i + 1], u = t[i + 2], 128 == (192 & o) && 128 == (192 & u) && (s = (15 & h) << 12 | (63 & o) << 6 | 63 & u) > 2047 && (s < 55296 || s > 57343) && (a = s);
                        break;
                    case 4:
                        o = t[i + 1], u = t[i + 2], f = t[i + 3], 128 == (192 & o) && 128 == (192 & u) && 128 == (192 & f) && (s = (15 & h) << 18 | (63 & o) << 12 | (63 & u) << 6 | 63 & f) > 65535 && s < 1114112 && (a = s)
                }
                null === a ? (a = 65533, c = 1) : a > 65535 && (a -= 65536, n.push(a >>> 10 & 1023 | 55296), a = 56320 | 1023 & a), n.push(a), i += c
            }
            return O(n)
        }
        exports.Buffer = f, exports.SlowBuffer = d, exports.INSPECT_MAX_BYTES = 50, f.TYPED_ARRAY_SUPPORT = void 0 !== t.TYPED_ARRAY_SUPPORT ? t.TYPED_ARRAY_SUPPORT : i(), exports.kMaxLength = o(), f.poolSize = 8192, f._augment = function(t) {
            return t.__proto__ = f.prototype, t
        }, f.from = function(t, r, e) {
            return s(null, t, r, e)
        }, f.TYPED_ARRAY_SUPPORT && (f.prototype.__proto__ = Uint8Array.prototype, f.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && f[Symbol.species] === f && Object.defineProperty(f, Symbol.species, {
            value: null,
            configurable: !0
        })), f.alloc = function(t, r, e) {
            return a(null, t, r, e)
        }, f.allocUnsafe = function(t) {
            return c(null, t)
        }, f.allocUnsafeSlow = function(t) {
            return c(null, t)
        }, f.isBuffer = function(t) {
            return !(null == t || !t._isBuffer)
        }, f.compare = function(t, r) {
            if (!f.isBuffer(t) || !f.isBuffer(r)) throw new TypeError("Arguments must be Buffers");
            if (t === r) return 0;
            for (var e = t.length, n = r.length, i = 0, o = Math.min(e, n); i < o; ++i)
                if (t[i] !== r[i]) {
                    e = t[i], n = r[i];
                    break
                } return e < n ? -1 : n < e ? 1 : 0
        }, f.isEncoding = function(t) {
            switch (String(t).toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "latin1":
                case "binary":
                case "base64":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return !0;
                default:
                    return !1
            }
        }, f.concat = function(t, r) {
            if (!n(t)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (0 === t.length) return f.alloc(0);
            var e;
            if (void 0 === r)
                for (r = 0, e = 0; e < t.length; ++e) r += t[e].length;
            var i = f.allocUnsafe(r),
                o = 0;
            for (e = 0; e < t.length; ++e) {
                var u = t[e];
                if (!f.isBuffer(u)) throw new TypeError('"list" argument must be an Array of Buffers');
                u.copy(i, o), o += u.length
            }
            return i
        }, f.byteLength = v, f.prototype._isBuffer = !0, f.prototype.swap16 = function() {
            var t = this.length;
            if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var r = 0; r < t; r += 2) b(this, r, r + 1);
            return this
        }, f.prototype.swap32 = function() {
            var t = this.length;
            if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var r = 0; r < t; r += 4) b(this, r, r + 3), b(this, r + 1, r + 2);
            return this
        }, f.prototype.swap64 = function() {
            var t = this.length;
            if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var r = 0; r < t; r += 8) b(this, r, r + 7), b(this, r + 1, r + 6), b(this, r + 2, r + 5), b(this, r + 3, r + 4);
            return this
        }, f.prototype.toString = function() {
            var t = 0 | this.length;
            return 0 === t ? "" : 0 === arguments.length ? Y(this, 0, t) : E.apply(this, arguments)
        }, f.prototype.equals = function(t) {
            if (!f.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
            return this === t || 0 === f.compare(this, t)
        }, f.prototype.inspect = function() {
            var t = "",
                r = exports.INSPECT_MAX_BYTES;
            return this.length > 0 && (t = this.toString("hex", 0, r).match(/.{2}/g).join(" "), this.length > r && (t += " ... ")), "<Buffer " + t + ">"
        }, f.prototype.compare = function(t, r, e, n, i) {
            if (!f.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
            if (void 0 === r && (r = 0), void 0 === e && (e = t ? t.length : 0), void 0 === n && (n = 0), void 0 === i && (i = this.length), r < 0 || e > t.length || n < 0 || i > this.length) throw new RangeError("out of range index");
            if (n >= i && r >= e) return 0;
            if (n >= i) return -1;
            if (r >= e) return 1;
            if (this === t) return 0;
            for (var o = (i >>>= 0) - (n >>>= 0), u = (e >>>= 0) - (r >>>= 0), s = Math.min(o, u), h = this.slice(n, i), a = t.slice(r, e), c = 0; c < s; ++c)
                if (h[c] !== a[c]) {
                    o = h[c], u = a[c];
                    break
                } return o < u ? -1 : u < o ? 1 : 0
        }, f.prototype.includes = function(t, r, e) {
            return -1 !== this.indexOf(t, r, e)
        }, f.prototype.indexOf = function(t, r, e) {
            return R(this, t, r, e, !0)
        }, f.prototype.lastIndexOf = function(t, r, e) {
            return R(this, t, r, e, !1)
        }, f.prototype.write = function(t, r, e, n) {
            if (void 0 === r) n = "utf8", e = this.length, r = 0;
            else if (void 0 === e && "string" == typeof r) n = r, e = this.length, r = 0;
            else {
                if (!isFinite(r)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                r |= 0, isFinite(e) ? (e |= 0, void 0 === n && (n = "utf8")) : (n = e, e = void 0)
            }
            var i = this.length - r;
            if ((void 0 === e || e > i) && (e = i), t.length > 0 && (e < 0 || r < 0) || r > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            n || (n = "utf8");
            for (var o = !1;;) switch (n) {
                case "hex":
                    return A(this, t, r, e);
                case "utf8":
                case "utf-8":
                    return m(this, t, r, e);
                case "ascii":
                    return P(this, t, r, e);
                case "latin1":
                case "binary":
                    return T(this, t, r, e);
                case "base64":
                    return B(this, t, r, e);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return U(this, t, r, e);
                default:
                    if (o) throw new TypeError("Unknown encoding: " + n);
                    n = ("" + n).toLowerCase(), o = !0
            }
        }, f.prototype.toJSON = function() {
            return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0)
            }
        };
        var I = 4096;

        function O(t) {
            var r = t.length;
            if (r <= I) return String.fromCharCode.apply(String, t);
            for (var e = "", n = 0; n < r;) e += String.fromCharCode.apply(String, t.slice(n, n += I));
            return e
        }

        function L(t, r, e) {
            var n = "";
            e = Math.min(t.length, e);
            for (var i = r; i < e; ++i) n += String.fromCharCode(127 & t[i]);
            return n
        }

        function D(t, r, e) {
            var n = "";
            e = Math.min(t.length, e);
            for (var i = r; i < e; ++i) n += String.fromCharCode(t[i]);
            return n
        }

        function x(t, r, e) {
            var n = t.length;
            (!r || r < 0) && (r = 0), (!e || e < 0 || e > n) && (e = n);
            for (var i = "", o = r; o < e; ++o) i += Z(t[o]);
            return i
        }

        function C(t, r, e) {
            for (var n = t.slice(r, e), i = "", o = 0; o < n.length; o += 2) i += String.fromCharCode(n[o] + 256 * n[o + 1]);
            return i
        }

        function M(t, r, e) {
            if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint");
            if (t + r > e) throw new RangeError("Trying to access beyond buffer length")
        }

        function k(t, r, e, n, i, o) {
            if (!f.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (r > i || r < o) throw new RangeError('"value" argument is out of bounds');
            if (e + n > t.length) throw new RangeError("Index out of range")
        }

        function N(t, r, e, n) {
            r < 0 && (r = 65535 + r + 1);
            for (var i = 0, o = Math.min(t.length - e, 2); i < o; ++i) t[e + i] = (r & 255 << 8 * (n ? i : 1 - i)) >>> 8 * (n ? i : 1 - i)
        }

        function z(t, r, e, n) {
            r < 0 && (r = 4294967295 + r + 1);
            for (var i = 0, o = Math.min(t.length - e, 4); i < o; ++i) t[e + i] = r >>> 8 * (n ? i : 3 - i) & 255
        }

        function F(t, r, e, n, i, o) {
            if (e + n > t.length) throw new RangeError("Index out of range");
            if (e < 0) throw new RangeError("Index out of range")
        }

        function j(t, r, n, i, o) {
            return o || F(t, r, n, 4, 3.4028234663852886e38, -3.4028234663852886e38), e.write(t, r, n, i, 23, 4), n + 4
        }

        function q(t, r, n, i, o) {
            return o || F(t, r, n, 8, 1.7976931348623157e308, -1.7976931348623157e308), e.write(t, r, n, i, 52, 8), n + 8
        }
        f.prototype.slice = function(t, r) {
            var e, n = this.length;
            if ((t = ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), (r = void 0 === r ? n : ~~r) < 0 ? (r += n) < 0 && (r = 0) : r > n && (r = n), r < t && (r = t), f.TYPED_ARRAY_SUPPORT)(e = this.subarray(t, r)).__proto__ = f.prototype;
            else {
                var i = r - t;
                e = new f(i, void 0);
                for (var o = 0; o < i; ++o) e[o] = this[o + t]
            }
            return e
        }, f.prototype.readUIntLE = function(t, r, e) {
            t |= 0, r |= 0, e || M(t, r, this.length);
            for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
            return n
        }, f.prototype.readUIntBE = function(t, r, e) {
            t |= 0, r |= 0, e || M(t, r, this.length);
            for (var n = this[t + --r], i = 1; r > 0 && (i *= 256);) n += this[t + --r] * i;
            return n
        }, f.prototype.readUInt8 = function(t, r) {
            return r || M(t, 1, this.length), this[t]
        }, f.prototype.readUInt16LE = function(t, r) {
            return r || M(t, 2, this.length), this[t] | this[t + 1] << 8
        }, f.prototype.readUInt16BE = function(t, r) {
            return r || M(t, 2, this.length), this[t] << 8 | this[t + 1]
        }, f.prototype.readUInt32LE = function(t, r) {
            return r || M(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3]
        }, f.prototype.readUInt32BE = function(t, r) {
            return r || M(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3])
        }, f.prototype.readIntLE = function(t, r, e) {
            t |= 0, r |= 0, e || M(t, r, this.length);
            for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
            return n >= (i *= 128) && (n -= Math.pow(2, 8 * r)), n
        }, f.prototype.readIntBE = function(t, r, e) {
            t |= 0, r |= 0, e || M(t, r, this.length);
            for (var n = r, i = 1, o = this[t + --n]; n > 0 && (i *= 256);) o += this[t + --n] * i;
            return o >= (i *= 128) && (o -= Math.pow(2, 8 * r)), o
        }, f.prototype.readInt8 = function(t, r) {
            return r || M(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t]
        }, f.prototype.readInt16LE = function(t, r) {
            r || M(t, 2, this.length);
            var e = this[t] | this[t + 1] << 8;
            return 32768 & e ? 4294901760 | e : e
        }, f.prototype.readInt16BE = function(t, r) {
            r || M(t, 2, this.length);
            var e = this[t + 1] | this[t] << 8;
            return 32768 & e ? 4294901760 | e : e
        }, f.prototype.readInt32LE = function(t, r) {
            return r || M(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24
        }, f.prototype.readInt32BE = function(t, r) {
            return r || M(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]
        }, f.prototype.readFloatLE = function(t, r) {
            return r || M(t, 4, this.length), e.read(this, t, !0, 23, 4)
        }, f.prototype.readFloatBE = function(t, r) {
            return r || M(t, 4, this.length), e.read(this, t, !1, 23, 4)
        }, f.prototype.readDoubleLE = function(t, r) {
            return r || M(t, 8, this.length), e.read(this, t, !0, 52, 8)
        }, f.prototype.readDoubleBE = function(t, r) {
            return r || M(t, 8, this.length), e.read(this, t, !1, 52, 8)
        }, f.prototype.writeUIntLE = function(t, r, e, n) {
            (t = +t, r |= 0, e |= 0, n) || k(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
            var i = 1,
                o = 0;
            for (this[r] = 255 & t; ++o < e && (i *= 256);) this[r + o] = t / i & 255;
            return r + e
        }, f.prototype.writeUIntBE = function(t, r, e, n) {
            (t = +t, r |= 0, e |= 0, n) || k(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
            var i = e - 1,
                o = 1;
            for (this[r + i] = 255 & t; --i >= 0 && (o *= 256);) this[r + i] = t / o & 255;
            return r + e
        }, f.prototype.writeUInt8 = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 1, 255, 0), f.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), this[r] = 255 & t, r + 1
        }, f.prototype.writeUInt16LE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 2, 65535, 0), f.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : N(this, t, r, !0), r + 2
        }, f.prototype.writeUInt16BE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 2, 65535, 0), f.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : N(this, t, r, !1), r + 2
        }, f.prototype.writeUInt32LE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 4, 4294967295, 0), f.TYPED_ARRAY_SUPPORT ? (this[r + 3] = t >>> 24, this[r + 2] = t >>> 16, this[r + 1] = t >>> 8, this[r] = 255 & t) : z(this, t, r, !0), r + 4
        }, f.prototype.writeUInt32BE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 4, 4294967295, 0), f.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : z(this, t, r, !1), r + 4
        }, f.prototype.writeIntLE = function(t, r, e, n) {
            if (t = +t, r |= 0, !n) {
                var i = Math.pow(2, 8 * e - 1);
                k(this, t, r, e, i - 1, -i)
            }
            var o = 0,
                u = 1,
                f = 0;
            for (this[r] = 255 & t; ++o < e && (u *= 256);) t < 0 && 0 === f && 0 !== this[r + o - 1] && (f = 1), this[r + o] = (t / u >> 0) - f & 255;
            return r + e
        }, f.prototype.writeIntBE = function(t, r, e, n) {
            if (t = +t, r |= 0, !n) {
                var i = Math.pow(2, 8 * e - 1);
                k(this, t, r, e, i - 1, -i)
            }
            var o = e - 1,
                u = 1,
                f = 0;
            for (this[r + o] = 255 & t; --o >= 0 && (u *= 256);) t < 0 && 0 === f && 0 !== this[r + o + 1] && (f = 1), this[r + o] = (t / u >> 0) - f & 255;
            return r + e
        }, f.prototype.writeInt8 = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 1, 127, -128), f.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), t < 0 && (t = 255 + t + 1), this[r] = 255 & t, r + 1
        }, f.prototype.writeInt16LE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 2, 32767, -32768), f.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : N(this, t, r, !0), r + 2
        }, f.prototype.writeInt16BE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 2, 32767, -32768), f.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : N(this, t, r, !1), r + 2
        }, f.prototype.writeInt32LE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 4, 2147483647, -2147483648), f.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8, this[r + 2] = t >>> 16, this[r + 3] = t >>> 24) : z(this, t, r, !0), r + 4
        }, f.prototype.writeInt32BE = function(t, r, e) {
            return t = +t, r |= 0, e || k(this, t, r, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), f.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : z(this, t, r, !1), r + 4
        }, f.prototype.writeFloatLE = function(t, r, e) {
            return j(this, t, r, !0, e)
        }, f.prototype.writeFloatBE = function(t, r, e) {
            return j(this, t, r, !1, e)
        }, f.prototype.writeDoubleLE = function(t, r, e) {
            return q(this, t, r, !0, e)
        }, f.prototype.writeDoubleBE = function(t, r, e) {
            return q(this, t, r, !1, e)
        }, f.prototype.copy = function(t, r, e, n) {
            if (e || (e = 0), n || 0 === n || (n = this.length), r >= t.length && (r = t.length), r || (r = 0), n > 0 && n < e && (n = e), n === e) return 0;
            if (0 === t.length || 0 === this.length) return 0;
            if (r < 0) throw new RangeError("targetStart out of bounds");
            if (e < 0 || e >= this.length) throw new RangeError("sourceStart out of bounds");
            if (n < 0) throw new RangeError("sourceEnd out of bounds");
            n > this.length && (n = this.length), t.length - r < n - e && (n = t.length - r + e);
            var i, o = n - e;
            if (this === t && e < r && r < n)
                for (i = o - 1; i >= 0; --i) t[i + r] = this[i + e];
            else if (o < 1e3 || !f.TYPED_ARRAY_SUPPORT)
                for (i = 0; i < o; ++i) t[i + r] = this[i + e];
            else Uint8Array.prototype.set.call(t, this.subarray(e, e + o), r);
            return o
        }, f.prototype.fill = function(t, r, e, n) {
            if ("string" == typeof t) {
                if ("string" == typeof r ? (n = r, r = 0, e = this.length) : "string" == typeof e && (n = e, e = this.length), 1 === t.length) {
                    var i = t.charCodeAt(0);
                    i < 256 && (t = i)
                }
                if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
                if ("string" == typeof n && !f.isEncoding(n)) throw new TypeError("Unknown encoding: " + n)
            } else "number" == typeof t && (t &= 255);
            if (r < 0 || this.length < r || this.length < e) throw new RangeError("Out of range index");
            if (e <= r) return this;
            var o;
            if (r >>>= 0, e = void 0 === e ? this.length : e >>> 0, t || (t = 0), "number" == typeof t)
                for (o = r; o < e; ++o) this[o] = t;
            else {
                var u = f.isBuffer(t) ? t : $(new f(t, n).toString()),
                    s = u.length;
                for (o = 0; o < e - r; ++o) this[o + r] = u[o % s]
            }
            return this
        };
        var V = /[^+\/0-9A-Za-z-_]/g;

        function X(t) {
            if ((t = J(t).replace(V, "")).length < 2) return "";
            for (; t.length % 4 != 0;) t += "=";
            return t
        }

        function J(t) {
            return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "")
        }

        function Z(t) {
            return t < 16 ? "0" + t.toString(16) : t.toString(16)
        }

        function $(t, r) {
            var e;
            r = r || 1 / 0;
            for (var n = t.length, i = null, o = [], u = 0; u < n; ++u) {
                if ((e = t.charCodeAt(u)) > 55295 && e < 57344) {
                    if (!i) {
                        if (e > 56319) {
                            (r -= 3) > -1 && o.push(239, 191, 189);
                            continue
                        }
                        if (u + 1 === n) {
                            (r -= 3) > -1 && o.push(239, 191, 189);
                            continue
                        }
                        i = e;
                        continue
                    }
                    if (e < 56320) {
                        (r -= 3) > -1 && o.push(239, 191, 189), i = e;
                        continue
                    }
                    e = 65536 + (i - 55296 << 10 | e - 56320)
                } else i && (r -= 3) > -1 && o.push(239, 191, 189);
                if (i = null, e < 128) {
                    if ((r -= 1) < 0) break;
                    o.push(e)
                } else if (e < 2048) {
                    if ((r -= 2) < 0) break;
                    o.push(e >> 6 | 192, 63 & e | 128)
                } else if (e < 65536) {
                    if ((r -= 3) < 0) break;
                    o.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128)
                } else {
                    if (!(e < 1114112)) throw new Error("Invalid code point");
                    if ((r -= 4) < 0) break;
                    o.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128)
                }
            }
            return o
        }

        function G(t) {
            for (var r = [], e = 0; e < t.length; ++e) r.push(255 & t.charCodeAt(e));
            return r
        }

        function H(t, r) {
            for (var e, n, i, o = [], u = 0; u < t.length && !((r -= 2) < 0); ++u) n = (e = t.charCodeAt(u)) >> 8, i = e % 256, o.push(i), o.push(n);
            return o
        }

        function K(t) {
            return r.toByteArray(X(t))
        }

        function Q(t, r, e, n) {
            for (var i = 0; i < n && !(i + e >= r.length || i >= t.length); ++i) r[i + e] = t[i];
            return i
        }

        function W(t) {
            return t != t
        }
    }, {
        "base64-js": "iKuJ",
        "ieee754": "LqlQ",
        "isarray": "hNJ8",
        "buffer": "ARb5"
    }],
    "LnxY": [function(require, module, exports) {
        var global = arguments[3];
        var Buffer = require("buffer").Buffer;
        var global = arguments[3],
            Buffer = require("buffer").Buffer;
        module.exports = function(e) {
            var t = {};

            function o(r) {
                if (t[r]) return t[r].exports;
                var s = t[r] = {
                    i: r,
                    l: !1,
                    exports: {}
                };
                return e[r].call(s.exports, s, s.exports, o), s.l = !0, s.exports
            }
            return o.m = e, o.c = t, o.d = function(e, t, r) {
                o.o(e, t) || Object.defineProperty(e, t, {
                    enumerable: !0,
                    get: r
                })
            }, o.r = function(e) {
                "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                    value: "Module"
                }), Object.defineProperty(e, "__esModule", {
                    value: !0
                })
            }, o.t = function(e, t) {
                if (1 & t && (e = o(e)), 8 & t) return e;
                if (4 & t && "object" == typeof e && e && e.__esModule) return e;
                var r = Object.create(null);
                if (o.r(r), Object.defineProperty(r, "default", {
                        enumerable: !0,
                        value: e
                    }), 2 & t && "string" != typeof e)
                    for (var s in e) o.d(r, s, function(t) {
                        return e[t]
                    }.bind(null, s));
                return r
            }, o.n = function(e) {
                var t = e && e.__esModule ? function() {
                    return e.default
                } : function() {
                    return e
                };
                return o.d(t, "a", t), t
            }, o.o = function(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t)
            }, o.p = "", o(o.s = 20)
        }([function(module, exports) {
            var $jscomp = $jscomp || {};
            $jscomp.scope = {}, $jscomp.findInternal = function(e, t, o) {
                e instanceof String && (e = String(e));
                for (var r = e.length, s = 0; s < r; s++) {
                    var n = e[s];
                    if (t.call(o, n, s, e)) return {
                        i: s,
                        v: n
                    }
                }
                return {
                    i: -1,
                    v: void 0
                }
            }, $jscomp.ASSUME_ES5 = !1, $jscomp.ASSUME_NO_NATIVE_MAP = !1, $jscomp.ASSUME_NO_NATIVE_SET = !1, $jscomp.SIMPLE_FROUND_POLYFILL = !1, $jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(e, t, o) {
                e != Array.prototype && e != Object.prototype && (e[t] = o.value)
            }, $jscomp.getGlobal = function(e) {
                return "undefined" != typeof window && window === e ? e : void 0 !== global && null != global ? global : e
            }, $jscomp.global = $jscomp.getGlobal(this), $jscomp.polyfill = function(e, t, o, r) {
                if (t) {
                    for (o = $jscomp.global, e = e.split("."), r = 0; r < e.length - 1; r++) {
                        var s = e[r];
                        s in o || (o[s] = {}), o = o[s]
                    }(t = t(r = o[e = e[e.length - 1]])) != r && null != t && $jscomp.defineProperty(o, e, {
                        configurable: !0,
                        writable: !0,
                        value: t
                    })
                }
            }, $jscomp.polyfill("Array.prototype.findIndex", function(e) {
                return e || function(e, t) {
                    return $jscomp.findInternal(this, e, t).i
                }
            }, "es6", "es3"), $jscomp.checkStringArgs = function(e, t, o) {
                if (null == e) throw new TypeError("The 'this' value for String.prototype." + o + " must not be null or undefined");
                if (t instanceof RegExp) throw new TypeError("First argument to String.prototype." + o + " must not be a regular expression");
                return e + ""
            }, $jscomp.polyfill("String.prototype.endsWith", function(e) {
                return e || function(e, t) {
                    var o = $jscomp.checkStringArgs(this, e, "endsWith");
                    e += "", void 0 === t && (t = o.length), t = Math.max(0, Math.min(0 | t, o.length));
                    for (var r = e.length; 0 < r && 0 < t;)
                        if (o[--t] != e[--r]) return !1;
                    return 0 >= r
                }
            }, "es6", "es3"), $jscomp.polyfill("Array.prototype.find", function(e) {
                return e || function(e, t) {
                    return $jscomp.findInternal(this, e, t).v
                }
            }, "es6", "es3"), $jscomp.polyfill("String.prototype.startsWith", function(e) {
                return e || function(e, t) {
                    var o = $jscomp.checkStringArgs(this, e, "startsWith");
                    e += "";
                    var r = o.length,
                        s = e.length;
                    t = Math.max(0, Math.min(0 | t, o.length));
                    for (var n = 0; n < s && t < r;)
                        if (o[t++] != e[n++]) return !1;
                    return n >= s
                }
            }, "es6", "es3"), $jscomp.polyfill("String.prototype.repeat", function(e) {
                return e || function(e) {
                    var t = $jscomp.checkStringArgs(this, null, "repeat");
                    if (0 > e || 1342177279 < e) throw new RangeError("Invalid count value");
                    e |= 0;
                    for (var o = ""; e;) 1 & e && (o += t), (e >>>= 1) && (t += t);
                    return o
                }
            }, "es6", "es3");
            var COMPILED = !0,
                goog = goog || {};
            goog.global = this || self, goog.isDef = function(e) {
                return void 0 !== e
            }, goog.isString = function(e) {
                return "string" == typeof e
            }, goog.isBoolean = function(e) {
                return "boolean" == typeof e
            }, goog.isNumber = function(e) {
                return "number" == typeof e
            }, goog.exportPath_ = function(e, t, o) {
                e = e.split("."), o = o || goog.global, e[0] in o || void 0 === o.execScript || o.execScript("var " + e[0]);
                for (var r; e.length && (r = e.shift());) !e.length && goog.isDef(t) ? o[r] = t : o = o[r] && o[r] !== Object.prototype[r] ? o[r] : o[r] = {}
            }, goog.define = function(e, t) {
                if (!COMPILED) {
                    var o = goog.global.CLOSURE_UNCOMPILED_DEFINES,
                        r = goog.global.CLOSURE_DEFINES;
                    o && void 0 === o.nodeType && Object.prototype.hasOwnProperty.call(o, e) ? t = o[e] : r && void 0 === r.nodeType && Object.prototype.hasOwnProperty.call(r, e) && (t = r[e])
                }
                return t
            }, goog.FEATURESET_YEAR = 2012, goog.DEBUG = !0, goog.LOCALE = "en", goog.TRUSTED_SITE = !0, goog.STRICT_MODE_COMPATIBLE = !1, goog.DISALLOW_TEST_ONLY_CODE = COMPILED && !goog.DEBUG, goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = !1, goog.provide = function(e) {
                if (goog.isInModuleLoader_()) throw Error("goog.provide cannot be used within a module.");
                if (!COMPILED && goog.isProvided_(e)) throw Error('Namespace "' + e + '" already declared.');
                goog.constructNamespace_(e)
            }, goog.constructNamespace_ = function(e, t) {
                if (!COMPILED) {
                    delete goog.implicitNamespaces_[e];
                    for (var o = e;
                        (o = o.substring(0, o.lastIndexOf("."))) && !goog.getObjectByName(o);) goog.implicitNamespaces_[o] = !0
                }
                goog.exportPath_(e, t)
            }, goog.getScriptNonce = function(e) {
                return e && e != goog.global ? goog.getScriptNonce_(e.document) : (null === goog.cspNonce_ && (goog.cspNonce_ = goog.getScriptNonce_(goog.global.document)), goog.cspNonce_)
            }, goog.NONCE_PATTERN_ = /^[\w+/_-]+[=]{0,2}$/, goog.cspNonce_ = null, goog.getScriptNonce_ = function(e) {
                return (e = e.querySelector && e.querySelector("script[nonce]")) && (e = e.nonce || e.getAttribute("nonce")) && goog.NONCE_PATTERN_.test(e) ? e : ""
            }, goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/, goog.module = function(e) {
                if (!goog.isString(e) || !e || -1 == e.search(goog.VALID_MODULE_RE_)) throw Error("Invalid module identifier");
                if (!goog.isInGoogModuleLoader_()) throw Error("Module " + e + " has been loaded incorrectly. Note, modules cannot be loaded as normal scripts. They require some kind of pre-processing step. You're likely trying to load a module via a script tag or as a part of a concatenated bundle without rewriting the module. For more info see: https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
                if (goog.moduleLoaderState_.moduleName) throw Error("goog.module may only be called once per module.");
                if (goog.moduleLoaderState_.moduleName = e, !COMPILED) {
                    if (goog.isProvided_(e)) throw Error('Namespace "' + e + '" already declared.');
                    delete goog.implicitNamespaces_[e]
                }
            }, goog.module.get = function(e) {
                return goog.module.getInternal_(e)
            }, goog.module.getInternal_ = function(e) {
                if (!COMPILED) {
                    if (e in goog.loadedModules_) return goog.loadedModules_[e].exports;
                    if (!goog.implicitNamespaces_[e]) return null != (e = goog.getObjectByName(e)) ? e : null
                }
                return null
            }, goog.ModuleType = {
                ES6: "es6",
                GOOG: "goog"
            }, goog.moduleLoaderState_ = null, goog.isInModuleLoader_ = function() {
                return goog.isInGoogModuleLoader_() || goog.isInEs6ModuleLoader_()
            }, goog.isInGoogModuleLoader_ = function() {
                return !!goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.GOOG
            }, goog.isInEs6ModuleLoader_ = function() {
                if (goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.ES6) return !0;
                var e = goog.global.$jscomp;
                return !!e && "function" == typeof e.getCurrentModulePath && !!e.getCurrentModulePath()
            }, goog.module.declareLegacyNamespace = function() {
                if (!COMPILED && !goog.isInGoogModuleLoader_()) throw Error("goog.module.declareLegacyNamespace must be called from within a goog.module");
                if (!COMPILED && !goog.moduleLoaderState_.moduleName) throw Error("goog.module must be called prior to goog.module.declareLegacyNamespace.");
                goog.moduleLoaderState_.declareLegacyNamespace = !0
            }, goog.declareModuleId = function(e) {
                if (!COMPILED) {
                    if (!goog.isInEs6ModuleLoader_()) throw Error("goog.declareModuleId may only be called from within an ES6 module");
                    if (goog.moduleLoaderState_ && goog.moduleLoaderState_.moduleName) throw Error("goog.declareModuleId may only be called once per module.");
                    if (e in goog.loadedModules_) throw Error('Module with namespace "' + e + '" already exists.')
                }
                if (goog.moduleLoaderState_) goog.moduleLoaderState_.moduleName = e;
                else {
                    var t = goog.global.$jscomp;
                    if (!t || "function" != typeof t.getCurrentModulePath) throw Error('Module with namespace "' + e + '" has been loaded incorrectly.');
                    t = t.require(t.getCurrentModulePath()), goog.loadedModules_[e] = {
                        exports: t,
                        type: goog.ModuleType.ES6,
                        moduleId: e
                    }
                }
            }, goog.setTestOnly = function(e) {
                if (goog.DISALLOW_TEST_ONLY_CODE) throw e = e || "", Error("Importing test-only code into non-debug environment" + (e ? ": " + e : "."))
            }, goog.forwardDeclare = function(e) {}, COMPILED || (goog.isProvided_ = function(e) {
                return e in goog.loadedModules_ || !goog.implicitNamespaces_[e] && goog.isDefAndNotNull(goog.getObjectByName(e))
            }, goog.implicitNamespaces_ = {
                "goog.module": !0
            }), goog.getObjectByName = function(e, t) {
                e = e.split("."), t = t || goog.global;
                for (var o = 0; o < e.length; o++)
                    if (t = t[e[o]], !goog.isDefAndNotNull(t)) return null;
                return t
            }, goog.globalize = function(e, t) {
                for (var o in t = t || goog.global, e) t[o] = e[o]
            }, goog.addDependency = function(e, t, o, r) {
                !COMPILED && goog.DEPENDENCIES_ENABLED && goog.debugLoader_.addDependency(e, t, o, r)
            }, goog.ENABLE_DEBUG_LOADER = !0, goog.logToConsole_ = function(e) {
                goog.global.console && goog.global.console.error(e)
            }, goog.require = function(e) {
                if (!COMPILED) {
                    if (goog.ENABLE_DEBUG_LOADER && goog.debugLoader_.requested(e), goog.isProvided_(e)) {
                        if (goog.isInModuleLoader_()) return goog.module.getInternal_(e)
                    } else if (goog.ENABLE_DEBUG_LOADER) {
                        var t = goog.moduleLoaderState_;
                        goog.moduleLoaderState_ = null;
                        try {
                            goog.debugLoader_.load_(e)
                        } finally {
                            goog.moduleLoaderState_ = t
                        }
                    }
                    return null
                }
            }, goog.requireType = function(e) {
                return {}
            }, goog.basePath = "", goog.nullFunction = function() {}, goog.abstractMethod = function() {
                throw Error("unimplemented abstract method")
            }, goog.addSingletonGetter = function(e) {
                e.instance_ = void 0, e.getInstance = function() {
                    return e.instance_ ? e.instance_ : (goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = e), e.instance_ = new e)
                }
            }, goog.instantiatedSingletons_ = [], goog.LOAD_MODULE_USING_EVAL = !0, goog.SEAL_MODULE_EXPORTS = goog.DEBUG, goog.loadedModules_ = {}, goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER, goog.TRANSPILE = "detect", goog.ASSUME_ES_MODULES_TRANSPILED = !1, goog.TRANSPILE_TO_LANGUAGE = "", goog.TRANSPILER = "transpile.js", goog.hasBadLetScoping = null, goog.useSafari10Workaround = function() {
                if (null == goog.hasBadLetScoping) {
                    try {
                        var a = !eval('"use strict";let x = 1; function f() { return typeof x; };f() == "number";')
                    } catch (e) {
                        a = !1
                    }
                    goog.hasBadLetScoping = a
                }
                return goog.hasBadLetScoping
            }, goog.workaroundSafari10EvalBug = function(e) {
                return "(function(){" + e + "\n;})();\n"
            }, goog.loadModule = function(e) {
                var t = goog.moduleLoaderState_;
                try {
                    if (goog.moduleLoaderState_ = {
                            moduleName: "",
                            declareLegacyNamespace: !1,
                            type: goog.ModuleType.GOOG
                        }, goog.isFunction(e)) var o = e.call(void 0, {});
                    else {
                        if (!goog.isString(e)) throw Error("Invalid module definition");
                        goog.useSafari10Workaround() && (e = goog.workaroundSafari10EvalBug(e)), o = goog.loadModuleFromSource_.call(void 0, e)
                    }
                    var r = goog.moduleLoaderState_.moduleName;
                    if (!goog.isString(r) || !r) throw Error('Invalid module name "' + r + '"');
                    goog.moduleLoaderState_.declareLegacyNamespace ? goog.constructNamespace_(r, o) : goog.SEAL_MODULE_EXPORTS && Object.seal && "object" == typeof o && null != o && Object.seal(o), goog.loadedModules_[r] = {
                        exports: o,
                        type: goog.ModuleType.GOOG,
                        moduleId: goog.moduleLoaderState_.moduleName
                    }
                } finally {
                    goog.moduleLoaderState_ = t
                }
            }, goog.loadModuleFromSource_ = function(a) {
                return eval(a), {}
            }, goog.normalizePath_ = function(e) {
                e = e.split("/");
                for (var t = 0; t < e.length;) "." == e[t] ? e.splice(t, 1) : t && ".." == e[t] && e[t - 1] && ".." != e[t - 1] ? e.splice(--t, 2) : t++;
                return e.join("/")
            }, goog.loadFileSync_ = function(e) {
                if (goog.global.CLOSURE_LOAD_FILE_SYNC) return goog.global.CLOSURE_LOAD_FILE_SYNC(e);
                try {
                    var t = new goog.global.XMLHttpRequest;
                    return t.open("get", e, !1), t.send(), 0 == t.status || 200 == t.status ? t.responseText : null
                } catch (e) {
                    return null
                }
            }, goog.transpile_ = function(e, t, o) {
                var r = goog.global.$jscomp;
                r || (goog.global.$jscomp = r = {});
                var s = r.transpile;
                if (!s) {
                    var n = goog.basePath + goog.TRANSPILER,
                        i = goog.loadFileSync_(n);
                    if (i) {
                        if (function() {
                                (0, eval)(i + "\n//# sourceURL=" + n)
                            }.call(goog.global), goog.global.$gwtExport && goog.global.$gwtExport.$jscomp && !goog.global.$gwtExport.$jscomp.transpile) throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: ' + JSON.stringify(goog.global.$gwtExport));
                        goog.global.$jscomp.transpile = goog.global.$gwtExport.$jscomp.transpile, s = (r = goog.global.$jscomp).transpile
                    }
                }
                return s || (s = r.transpile = function(e, t) {
                    return goog.logToConsole_(t + " requires transpilation but no transpiler was found."), e
                }), s(e, t, o)
            }, goog.typeOf = function(e) {
                var t = typeof e;
                if ("object" == t) {
                    if (!e) return "null";
                    if (e instanceof Array) return "array";
                    if (e instanceof Object) return t;
                    var o = Object.prototype.toString.call(e);
                    if ("[object Window]" == o) return "object";
                    if ("[object Array]" == o || "number" == typeof e.length && void 0 !== e.splice && void 0 !== e.propertyIsEnumerable && !e.propertyIsEnumerable("splice")) return "array";
                    if ("[object Function]" == o || void 0 !== e.call && void 0 !== e.propertyIsEnumerable && !e.propertyIsEnumerable("call")) return "function"
                } else if ("function" == t && void 0 === e.call) return "object";
                return t
            }, goog.isNull = function(e) {
                return null === e
            }, goog.isDefAndNotNull = function(e) {
                return null != e
            }, goog.isArray = function(e) {
                return "array" == goog.typeOf(e)
            }, goog.isArrayLike = function(e) {
                var t = goog.typeOf(e);
                return "array" == t || "object" == t && "number" == typeof e.length
            }, goog.isDateLike = function(e) {
                return goog.isObject(e) && "function" == typeof e.getFullYear
            }, goog.isFunction = function(e) {
                return "function" == goog.typeOf(e)
            }, goog.isObject = function(e) {
                var t = typeof e;
                return "object" == t && null != e || "function" == t
            }, goog.getUid = function(e) {
                return e[goog.UID_PROPERTY_] || (e[goog.UID_PROPERTY_] = ++goog.uidCounter_)
            }, goog.hasUid = function(e) {
                return !!e[goog.UID_PROPERTY_]
            }, goog.removeUid = function(e) {
                null !== e && "removeAttribute" in e && e.removeAttribute(goog.UID_PROPERTY_);
                try {
                    delete e[goog.UID_PROPERTY_]
                } catch (e) {}
            }, goog.UID_PROPERTY_ = "closure_uid_" + (1e9 * Math.random() >>> 0), goog.uidCounter_ = 0, goog.getHashCode = goog.getUid, goog.removeHashCode = goog.removeUid, goog.cloneObject = function(e) {
                var t = goog.typeOf(e);
                if ("object" == t || "array" == t) {
                    if ("function" == typeof e.clone) return e.clone();
                    for (var o in t = "array" == t ? [] : {}, e) t[o] = goog.cloneObject(e[o]);
                    return t
                }
                return e
            }, goog.bindNative_ = function(e, t, o) {
                return e.call.apply(e.bind, arguments)
            }, goog.bindJs_ = function(e, t, o) {
                if (!e) throw Error();
                if (2 < arguments.length) {
                    var r = Array.prototype.slice.call(arguments, 2);
                    return function() {
                        var o = Array.prototype.slice.call(arguments);
                        return Array.prototype.unshift.apply(o, r), e.apply(t, o)
                    }
                }
                return function() {
                    return e.apply(t, arguments)
                }
            }, goog.bind = function(e, t, o) {
                return Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bind = goog.bindNative_ : goog.bind = goog.bindJs_, goog.bind.apply(null, arguments)
            }, goog.partial = function(e, t) {
                var o = Array.prototype.slice.call(arguments, 1);
                return function() {
                    var t = o.slice();
                    return t.push.apply(t, arguments), e.apply(this, t)
                }
            }, goog.mixin = function(e, t) {
                for (var o in t) e[o] = t[o]
            }, goog.now = goog.TRUSTED_SITE && Date.now || function() {
                return +new Date
            }, goog.globalEval = function(e) {
                if (goog.global.execScript) goog.global.execScript(e, "JavaScript");
                else {
                    if (!goog.global.eval) throw Error("goog.globalEval not available");
                    if (null == goog.evalWorksForGlobals_) {
                        try {
                            goog.global.eval("var _evalTest_ = 1;")
                        } catch (e) {}
                        if (void 0 !== goog.global._evalTest_) {
                            try {
                                delete goog.global._evalTest_
                            } catch (e) {}
                            goog.evalWorksForGlobals_ = !0
                        } else goog.evalWorksForGlobals_ = !1
                    }
                    if (goog.evalWorksForGlobals_) goog.global.eval(e);
                    else {
                        var t = goog.global.document,
                            o = t.createElement("SCRIPT");
                        o.type = "text/javascript", o.defer = !1, o.appendChild(t.createTextNode(e)), t.head.appendChild(o), t.head.removeChild(o)
                    }
                }
            }, goog.evalWorksForGlobals_ = null, goog.getCssName = function(e, t) {
                if ("." == String(e).charAt(0)) throw Error('className passed in goog.getCssName must not start with ".". You passed: ' + e);
                var o = function(e) {
                        return goog.cssNameMapping_[e] || e
                    },
                    r = function(e) {
                        e = e.split("-");
                        for (var t = [], r = 0; r < e.length; r++) t.push(o(e[r]));
                        return t.join("-")
                    };
                return r = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? o : r : function(e) {
                    return e
                }, e = t ? e + "-" + r(t) : r(e), goog.global.CLOSURE_CSS_NAME_MAP_FN ? goog.global.CLOSURE_CSS_NAME_MAP_FN(e) : e
            }, goog.setCssNameMapping = function(e, t) {
                goog.cssNameMapping_ = e, goog.cssNameMappingStyle_ = t
            }, !COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING && (goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING), goog.getMsg = function(e, t, o) {
                return o && o.html && (e = e.replace(/</g, "&lt;")), t && (e = e.replace(/\{\$([^}]+)}/g, function(e, o) {
                    return null != t && o in t ? t[o] : e
                })), e
            }, goog.getMsgWithFallback = function(e, t) {
                return e
            }, goog.exportSymbol = function(e, t, o) {
                goog.exportPath_(e, t, o)
            }, goog.exportProperty = function(e, t, o) {
                e[t] = o
            }, goog.inherits = function(e, t) {
                function o() {}
                o.prototype = t.prototype, e.superClass_ = t.prototype, e.prototype = new o, e.prototype.constructor = e, e.base = function(e, o, r) {
                    for (var s = Array(arguments.length - 2), n = 2; n < arguments.length; n++) s[n - 2] = arguments[n];
                    return t.prototype[o].apply(e, s)
                }
            }, goog.base = function(e, t, o) {
                var r = arguments.callee.caller;
                if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !r) throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
                if (void 0 !== r.superClass_) {
                    for (var s = Array(arguments.length - 1), n = 1; n < arguments.length; n++) s[n - 1] = arguments[n];
                    return r.superClass_.constructor.apply(e, s)
                }
                if ("string" != typeof t && "symbol" != typeof t) throw Error("method names provided to goog.base must be a string or a symbol");
                for (s = Array(arguments.length - 2), n = 2; n < arguments.length; n++) s[n - 2] = arguments[n];
                n = !1;
                for (var i = e.constructor.prototype; i; i = Object.getPrototypeOf(i))
                    if (i[t] === r) n = !0;
                    else if (n) return i[t].apply(e, s);
                if (e[t] === r) return e.constructor.prototype[t].apply(e, s);
                throw Error("goog.base called from a method of one name to a method of a different name")
            }, goog.scope = function(e) {
                if (goog.isInModuleLoader_()) throw Error("goog.scope is not supported within a module.");
                e.call(goog.global)
            }, COMPILED || (goog.global.COMPILED = COMPILED), goog.defineClass = function(e, t) {
                var o = t.constructor,
                    r = t.statics;
                return o && o != Object.prototype.constructor || (o = function() {
                    throw Error("cannot instantiate an interface (no constructor defined).")
                }), o = goog.defineClass.createSealingConstructor_(o, e), e && goog.inherits(o, e), delete t.constructor, delete t.statics, goog.defineClass.applyProperties_(o.prototype, t), null != r && (r instanceof Function ? r(o) : goog.defineClass.applyProperties_(o, r)), o
            }, goog.defineClass.SEAL_CLASS_INSTANCES = goog.DEBUG, goog.defineClass.createSealingConstructor_ = function(e, t) {
                if (!goog.defineClass.SEAL_CLASS_INSTANCES) return e;
                var o = !goog.defineClass.isUnsealable_(t),
                    r = function() {
                        var t = e.apply(this, arguments) || this;
                        return t[goog.UID_PROPERTY_] = t[goog.UID_PROPERTY_], this.constructor === r && o && Object.seal instanceof Function && Object.seal(t), t
                    };
                return r
            }, goog.defineClass.isUnsealable_ = function(e) {
                return e && e.prototype && e.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]
            }, goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "), goog.defineClass.applyProperties_ = function(e, t) {
                for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
                for (var r = 0; r < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; r++) o = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[r], Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o])
            }, goog.tagUnsealableClass = function(e) {
                !COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES && (e.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = !0)
            }, goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable", !COMPILED && goog.DEPENDENCIES_ENABLED && (goog.inHtmlDocument_ = function() {
                var e = goog.global.document;
                return null != e && "write" in e
            }, goog.isDocumentLoading_ = function() {
                var e = goog.global.document;
                return e.attachEvent ? "complete" != e.readyState : "loading" == e.readyState
            }, goog.findBasePath_ = function() {
                if (goog.isDef(goog.global.CLOSURE_BASE_PATH) && goog.isString(goog.global.CLOSURE_BASE_PATH)) goog.basePath = goog.global.CLOSURE_BASE_PATH;
                else if (goog.inHtmlDocument_()) {
                    var e = goog.global.document,
                        t = e.currentScript;
                    for (t = (e = t ? [t] : e.getElementsByTagName("SCRIPT")).length - 1; 0 <= t; --t) {
                        var o = e[t].src,
                            r = o.lastIndexOf("?");
                        if (r = -1 == r ? o.length : r, "base.js" == o.substr(r - 7, 7)) {
                            goog.basePath = o.substr(0, r - 7);
                            break
                        }
                    }
                }
            }, goog.findBasePath_(), goog.Transpiler = function() {
                this.requiresTranspilation_ = null, this.transpilationTarget_ = goog.TRANSPILE_TO_LANGUAGE
            }, goog.Transpiler.prototype.createRequiresTranspilation_ = function() {
                function a(t, o) {
                    e ? d[t] = !0 : o() ? (c = t, d[t] = !1) : e = d[t] = !0
                }

                function b(a) {
                    try {
                        return !!eval(a)
                    } catch (e) {
                        return !1
                    }
                }
                var c = "es3",
                    d = {
                        es3: !1
                    },
                    e = !1,
                    f = goog.global.navigator && goog.global.navigator.userAgent ? goog.global.navigator.userAgent : "";
                return a("es5", function() {
                    return b("[1,].length==1")
                }), a("es6", function() {
                    return !f.match(/Edge\/(\d+)(\.\d)*/i) && b('(()=>{"use strict";class X{constructor(){if(new.target!=String)throw 1;this.x=42}}let q=Reflect.construct(X,[],String);if(q.x!=42||!(q instanceof String))throw 1;for(const a of[2,3]){if(a==2)continue;function f(z={a}){let a=0;return z.a}{function f(){return 0;}}return f()==3}})()')
                }), a("es7", function() {
                    return b("2 ** 2 == 4")
                }), a("es8", function() {
                    return b("async () => 1, true")
                }), a("es9", function() {
                    return b("({...rest} = {}), true")
                }), a("es_next", function() {
                    return !1
                }), {
                    target: c,
                    map: d
                }
            }, goog.Transpiler.prototype.needsTranspile = function(e, t) {
                if ("always" == goog.TRANSPILE) return !0;
                if ("never" == goog.TRANSPILE) return !1;
                if (!this.requiresTranspilation_) {
                    var o = this.createRequiresTranspilation_();
                    this.requiresTranspilation_ = o.map, this.transpilationTarget_ = this.transpilationTarget_ || o.target
                }
                if (e in this.requiresTranspilation_) return !!this.requiresTranspilation_[e] || !(!goog.inHtmlDocument_() || "es6" != t || "noModule" in goog.global.document.createElement("script"));
                throw Error("Unknown language mode: " + e)
            }, goog.Transpiler.prototype.transpile = function(e, t) {
                return goog.transpile_(e, t, this.transpilationTarget_)
            }, goog.transpiler_ = new goog.Transpiler, goog.protectScriptTag_ = function(e) {
                return e.replace(/<\/(SCRIPT)/gi, "\\x3c/$1")
            }, goog.DebugLoader_ = function() {
                this.dependencies_ = {}, this.idToPath_ = {}, this.written_ = {}, this.loadingDeps_ = [], this.depsToLoad_ = [], this.paused_ = !1, this.factory_ = new goog.DependencyFactory(goog.transpiler_), this.deferredCallbacks_ = {}, this.deferredQueue_ = []
            }, goog.DebugLoader_.prototype.bootstrap = function(e, t) {
                function o() {
                    r && (goog.global.setTimeout(r, 0), r = null)
                }
                var r = t;
                if (e.length) {
                    t = [];
                    for (var s = 0; s < e.length; s++) {
                        var n = this.getPathFromDeps_(e[s]);
                        if (!n) throw Error("Unregonized namespace: " + e[s]);
                        t.push(this.dependencies_[n])
                    }
                    n = goog.require;
                    var i = 0;
                    for (s = 0; s < e.length; s++) n(e[s]), t[s].onLoad(function() {
                        ++i == e.length && o()
                    })
                } else o()
            }, goog.DebugLoader_.prototype.loadClosureDeps = function() {
                this.depsToLoad_.push(this.factory_.createDependency(goog.normalizePath_(goog.basePath + "deps.js"), "deps.js", [], [], {}, !1)), this.loadDeps_()
            }, goog.DebugLoader_.prototype.requested = function(e, t) {
                (e = this.getPathFromDeps_(e)) && (t || this.areDepsLoaded_(this.dependencies_[e].requires)) && (t = this.deferredCallbacks_[e]) && (delete this.deferredCallbacks_[e], t())
            }, goog.DebugLoader_.prototype.setDependencyFactory = function(e) {
                this.factory_ = e
            }, goog.DebugLoader_.prototype.load_ = function(e) {
                if (!this.getPathFromDeps_(e)) throw e = "goog.require could not find: " + e, goog.logToConsole_(e), Error(e);
                var t = this,
                    o = [],
                    r = function(e) {
                        var s = t.getPathFromDeps_(e);
                        if (!s) throw Error("Bad dependency path or symbol: " + e);
                        if (!t.written_[s]) {
                            for (t.written_[s] = !0, e = t.dependencies_[s], s = 0; s < e.requires.length; s++) goog.isProvided_(e.requires[s]) || r(e.requires[s]);
                            o.push(e)
                        }
                    };
                r(e), e = !!this.depsToLoad_.length, this.depsToLoad_ = this.depsToLoad_.concat(o), this.paused_ || e || this.loadDeps_()
            }, goog.DebugLoader_.prototype.loadDeps_ = function() {
                for (var e = this, t = this.paused_; this.depsToLoad_.length && !t;) ! function() {
                    var o = !1,
                        r = e.depsToLoad_.shift(),
                        s = !1;
                    e.loading_(r);
                    var n = {
                        pause: function() {
                            if (o) throw Error("Cannot call pause after the call to load.");
                            t = !0
                        },
                        resume: function() {
                            o ? e.resume_() : t = !1
                        },
                        loaded: function() {
                            if (s) throw Error("Double call to loaded.");
                            s = !0, e.loaded_(r)
                        },
                        pending: function() {
                            for (var t = [], o = 0; o < e.loadingDeps_.length; o++) t.push(e.loadingDeps_[o]);
                            return t
                        },
                        setModuleState: function(e) {
                            goog.moduleLoaderState_ = {
                                type: e,
                                moduleName: "",
                                declareLegacyNamespace: !1
                            }
                        },
                        registerEs6ModuleExports: function(e, t, o) {
                            o && (goog.loadedModules_[o] = {
                                exports: t,
                                type: goog.ModuleType.ES6,
                                moduleId: o || ""
                            })
                        },
                        registerGoogModuleExports: function(e, t) {
                            goog.loadedModules_[e] = {
                                exports: t,
                                type: goog.ModuleType.GOOG,
                                moduleId: e
                            }
                        },
                        clearModuleState: function() {
                            goog.moduleLoaderState_ = null
                        },
                        defer: function(t) {
                            if (o) throw Error("Cannot register with defer after the call to load.");
                            e.defer_(r, t)
                        },
                        areDepsLoaded: function() {
                            return e.areDepsLoaded_(r.requires)
                        }
                    };
                    try {
                        r.load(n)
                    } finally {
                        o = !0
                    }
                }();
                t && this.pause_()
            }, goog.DebugLoader_.prototype.pause_ = function() {
                this.paused_ = !0
            }, goog.DebugLoader_.prototype.resume_ = function() {
                this.paused_ && (this.paused_ = !1, this.loadDeps_())
            }, goog.DebugLoader_.prototype.loading_ = function(e) {
                this.loadingDeps_.push(e)
            }, goog.DebugLoader_.prototype.loaded_ = function(e) {
                for (var t = 0; t < this.loadingDeps_.length; t++)
                    if (this.loadingDeps_[t] == e) {
                        this.loadingDeps_.splice(t, 1);
                        break
                    } for (t = 0; t < this.deferredQueue_.length; t++)
                    if (this.deferredQueue_[t] == e.path) {
                        this.deferredQueue_.splice(t, 1);
                        break
                    } if (this.loadingDeps_.length == this.deferredQueue_.length && !this.depsToLoad_.length)
                    for (; this.deferredQueue_.length;) this.requested(this.deferredQueue_.shift(), !0);
                e.loaded()
            }, goog.DebugLoader_.prototype.areDepsLoaded_ = function(e) {
                for (var t = 0; t < e.length; t++) {
                    var o = this.getPathFromDeps_(e[t]);
                    if (!o || !(o in this.deferredCallbacks_) && !goog.isProvided_(e[t])) return !1
                }
                return !0
            }, goog.DebugLoader_.prototype.getPathFromDeps_ = function(e) {
                return e in this.idToPath_ ? this.idToPath_[e] : e in this.dependencies_ ? e : null
            }, goog.DebugLoader_.prototype.defer_ = function(e, t) {
                this.deferredCallbacks_[e.path] = t, this.deferredQueue_.push(e.path)
            }, goog.LoadController = function() {}, goog.LoadController.prototype.pause = function() {}, goog.LoadController.prototype.resume = function() {}, goog.LoadController.prototype.loaded = function() {}, goog.LoadController.prototype.pending = function() {}, goog.LoadController.prototype.registerEs6ModuleExports = function(e, t, o) {}, goog.LoadController.prototype.setModuleState = function(e) {}, goog.LoadController.prototype.clearModuleState = function() {}, goog.LoadController.prototype.defer = function(e) {}, goog.LoadController.prototype.areDepsLoaded = function() {}, goog.Dependency = function(e, t, o, r, s) {
                this.path = e, this.relativePath = t, this.provides = o, this.requires = r, this.loadFlags = s, this.loaded_ = !1, this.loadCallbacks_ = []
            }, goog.Dependency.prototype.getPathName = function() {
                var e = this.path,
                    t = e.indexOf("://");
                return 0 <= t && 0 <= (t = (e = e.substring(t + 3)).indexOf("/")) && (e = e.substring(t + 1)), e
            }, goog.Dependency.prototype.onLoad = function(e) {
                this.loaded_ ? e() : this.loadCallbacks_.push(e)
            }, goog.Dependency.prototype.loaded = function() {
                this.loaded_ = !0;
                var e = this.loadCallbacks_;
                this.loadCallbacks_ = [];
                for (var t = 0; t < e.length; t++) e[t]()
            }, goog.Dependency.defer_ = !1, goog.Dependency.callbackMap_ = {}, goog.Dependency.registerCallback_ = function(e) {
                var t = Math.random().toString(32);
                return goog.Dependency.callbackMap_[t] = e, t
            }, goog.Dependency.unregisterCallback_ = function(e) {
                delete goog.Dependency.callbackMap_[e]
            }, goog.Dependency.callback_ = function(e, t) {
                if (!(e in goog.Dependency.callbackMap_)) throw Error("Callback key " + e + " does not exist (was base.js loaded more than once?).");
                for (var o = goog.Dependency.callbackMap_[e], r = [], s = 1; s < arguments.length; s++) r.push(arguments[s]);
                o.apply(void 0, r)
            }, goog.Dependency.prototype.load = function(e) {
                if (goog.global.CLOSURE_IMPORT_SCRIPT) goog.global.CLOSURE_IMPORT_SCRIPT(this.path) ? e.loaded() : e.pause();
                else if (goog.inHtmlDocument_()) {
                    var t = goog.global.document;
                    if ("complete" == t.readyState && !goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
                        if (/\bdeps.js$/.test(this.path)) return void e.loaded();
                        throw Error('Cannot write "' + this.path + '" after document load')
                    }
                    if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && goog.isDocumentLoading_()) {
                        var o = goog.Dependency.registerCallback_(function(t) {
                                goog.DebugLoader_.IS_OLD_IE_ && "complete" != t.readyState || (goog.Dependency.unregisterCallback_(o), e.loaded())
                            }),
                            r = !goog.DebugLoader_.IS_OLD_IE_ && goog.getScriptNonce() ? ' nonce="' + goog.getScriptNonce() + '"' : "";
                        r = '<script src="' + this.path + '" ' + (goog.DebugLoader_.IS_OLD_IE_ ? "onreadystatechange" : "onload") + "=\"goog.Dependency.callback_('" + o + '\', this)" type="text/javascript" ' + (goog.Dependency.defer_ ? "defer" : "") + r + "><\/script>", t.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(r) : r)
                    } else {
                        var s = t.createElement("script");
                        s.defer = goog.Dependency.defer_, s.async = !1, s.type = "text/javascript", (r = goog.getScriptNonce()) && s.setAttribute("nonce", r), goog.DebugLoader_.IS_OLD_IE_ ? (e.pause(), s.onreadystatechange = function() {
                            "loaded" != s.readyState && "complete" != s.readyState || (e.loaded(), e.resume())
                        }) : s.onload = function() {
                            s.onload = null, e.loaded()
                        }, s.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(this.path) : this.path, t.head.appendChild(s)
                    }
                } else goog.logToConsole_("Cannot use default debug loader outside of HTML documents."), "deps.js" == this.relativePath ? (goog.logToConsole_("Consider setting CLOSURE_IMPORT_SCRIPT before loading base.js, or setting CLOSURE_NO_DEPS to true."), e.loaded()) : e.pause()
            }, goog.Es6ModuleDependency = function(e, t, o, r, s) {
                goog.Dependency.call(this, e, t, o, r, s)
            }, goog.inherits(goog.Es6ModuleDependency, goog.Dependency), goog.Es6ModuleDependency.prototype.load = function(e) {
                if (goog.global.CLOSURE_IMPORT_SCRIPT) goog.global.CLOSURE_IMPORT_SCRIPT(this.path) ? e.loaded() : e.pause();
                else if (goog.inHtmlDocument_()) {
                    var t = goog.global.document,
                        o = this;
                    if (goog.isDocumentLoading_()) {
                        var r = function(e, o) {
                            e = o ? '<script type="module" crossorigin>' + o + "<\/script>" : '<script type="module" crossorigin src="' + e + '"><\/script>', t.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(e) : e)
                        };
                        goog.Dependency.defer_ = !0
                    } else r = function(e, o) {
                        var r = t.createElement("script");
                        r.defer = !0, r.async = !1, r.type = "module", r.setAttribute("crossorigin", !0);
                        var s = goog.getScriptNonce();
                        s && r.setAttribute("nonce", s), o ? r.textContent = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScript(o) : o : r.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(e) : e, t.head.appendChild(r)
                    };
                    var s = goog.Dependency.registerCallback_(function() {
                        goog.Dependency.unregisterCallback_(s), e.setModuleState(goog.ModuleType.ES6)
                    });
                    r(void 0, 'goog.Dependency.callback_("' + s + '")'), r(this.path, void 0);
                    var n = goog.Dependency.registerCallback_(function(t) {
                        goog.Dependency.unregisterCallback_(n), e.registerEs6ModuleExports(o.path, t, goog.moduleLoaderState_.moduleName)
                    });
                    r(void 0, 'import * as m from "' + this.path + '"; goog.Dependency.callback_("' + n + '", m)');
                    var i = goog.Dependency.registerCallback_(function() {
                        goog.Dependency.unregisterCallback_(i), e.clearModuleState(), e.loaded()
                    });
                    r(void 0, 'goog.Dependency.callback_("' + i + '")')
                } else goog.logToConsole_("Cannot use default debug loader outside of HTML documents."), e.pause()
            }, goog.TransformedDependency = function(e, t, o, r, s) {
                goog.Dependency.call(this, e, t, o, r, s), this.contents_ = null, this.lazyFetch_ = !(goog.inHtmlDocument_() && "noModule" in goog.global.document.createElement("script"))
            }, goog.inherits(goog.TransformedDependency, goog.Dependency), goog.TransformedDependency.prototype.load = function(e) {
                function t() {
                    r.contents_ = goog.loadFileSync_(r.path), r.contents_ && (r.contents_ = r.transform(r.contents_), r.contents_ && (r.contents_ += "\n//# sourceURL=" + r.path))
                }

                function o() {
                    if (r.lazyFetch_ && t(), r.contents_) {
                        s && e.setModuleState(goog.ModuleType.ES6);
                        try {
                            var o = r.contents_;
                            if (r.contents_ = null, goog.globalEval(o), s) var n = goog.moduleLoaderState_.moduleName
                        } finally {
                            s && e.clearModuleState()
                        }
                        s && goog.global.$jscomp.require.ensure([r.getPathName()], function() {
                            e.registerEs6ModuleExports(r.path, goog.global.$jscomp.require(r.getPathName()), n)
                        }), e.loaded()
                    }
                }
                var r = this;
                if (goog.global.CLOSURE_IMPORT_SCRIPT) t(), this.contents_ && goog.global.CLOSURE_IMPORT_SCRIPT("", this.contents_) ? (this.contents_ = null, e.loaded()) : e.pause();
                else {
                    var s = this.loadFlags.module == goog.ModuleType.ES6;
                    this.lazyFetch_ || t();
                    var n = 1 < e.pending().length,
                        i = n && goog.DebugLoader_.IS_OLD_IE_;
                    if (n = goog.Dependency.defer_ && (n || goog.isDocumentLoading_()), i || n) e.defer(function() {
                        o()
                    });
                    else {
                        var a = goog.global.document;
                        if (i = goog.inHtmlDocument_() && "ActiveXObject" in goog.global, s && goog.inHtmlDocument_() && goog.isDocumentLoading_() && !i) {
                            goog.Dependency.defer_ = !0, e.pause();
                            var g = a.onreadystatechange;
                            a.onreadystatechange = function() {
                                "interactive" == a.readyState && (a.onreadystatechange = g, o(), e.resume()), goog.isFunction(g) && g.apply(void 0, arguments)
                            }
                        } else !goog.DebugLoader_.IS_OLD_IE_ && goog.inHtmlDocument_() && goog.isDocumentLoading_() ? function() {
                            var e = goog.global.document,
                                t = goog.Dependency.registerCallback_(function() {
                                    goog.Dependency.unregisterCallback_(t), o()
                                }),
                                r = '<script type="text/javascript">' + goog.protectScriptTag_('goog.Dependency.callback_("' + t + '");') + "<\/script>";
                            e.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(r) : r)
                        }() : o()
                    }
                }
            }, goog.TransformedDependency.prototype.transform = function(e) {}, goog.TranspiledDependency = function(e, t, o, r, s, n) {
                goog.TransformedDependency.call(this, e, t, o, r, s), this.transpiler = n
            }, goog.inherits(goog.TranspiledDependency, goog.TransformedDependency), goog.TranspiledDependency.prototype.transform = function(e) {
                return this.transpiler.transpile(e, this.getPathName())
            }, goog.PreTranspiledEs6ModuleDependency = function(e, t, o, r, s) {
                goog.TransformedDependency.call(this, e, t, o, r, s)
            }, goog.inherits(goog.PreTranspiledEs6ModuleDependency, goog.TransformedDependency), goog.PreTranspiledEs6ModuleDependency.prototype.transform = function(e) {
                return e
            }, goog.GoogModuleDependency = function(e, t, o, r, s, n, i) {
                goog.TransformedDependency.call(this, e, t, o, r, s), this.needsTranspile_ = n, this.transpiler_ = i
            }, goog.inherits(goog.GoogModuleDependency, goog.TransformedDependency), goog.GoogModuleDependency.prototype.transform = function(e) {
                return this.needsTranspile_ && (e = this.transpiler_.transpile(e, this.getPathName())), goog.LOAD_MODULE_USING_EVAL && goog.isDef(goog.global.JSON) ? "goog.loadModule(" + goog.global.JSON.stringify(e + "\n//# sourceURL=" + this.path + "\n") + ");" : 'goog.loadModule(function(exports) {"use strict";' + e + "\n;return exports});\n//# sourceURL=" + this.path + "\n"
            }, goog.DebugLoader_.IS_OLD_IE_ = !(goog.global.atob || !goog.global.document || !goog.global.document.all), goog.DebugLoader_.prototype.addDependency = function(e, t, o, r) {
                t = t || [], e = e.replace(/\\/g, "/");
                var s = goog.normalizePath_(goog.basePath + e);
                for (r && "boolean" != typeof r || (r = r ? {
                        module: goog.ModuleType.GOOG
                    } : {}), o = this.factory_.createDependency(s, e, t, o, r, goog.transpiler_.needsTranspile(r.lang || "es3", r.module)), this.dependencies_[s] = o, o = 0; o < t.length; o++) this.idToPath_[t[o]] = s;
                this.idToPath_[e] = s
            }, goog.DependencyFactory = function(e) {
                this.transpiler = e
            }, goog.DependencyFactory.prototype.createDependency = function(e, t, o, r, s, n) {
                return s.module == goog.ModuleType.GOOG ? new goog.GoogModuleDependency(e, t, o, r, s, n, this.transpiler) : n ? new goog.TranspiledDependency(e, t, o, r, s, this.transpiler) : s.module == goog.ModuleType.ES6 ? "never" == goog.TRANSPILE && goog.ASSUME_ES_MODULES_TRANSPILED ? new goog.PreTranspiledEs6ModuleDependency(e, t, o, r, s) : new goog.Es6ModuleDependency(e, t, o, r, s) : new goog.Dependency(e, t, o, r, s)
            }, goog.debugLoader_ = new goog.DebugLoader_, goog.loadClosureDeps = function() {
                goog.debugLoader_.loadClosureDeps()
            }, goog.setDependencyFactory = function(e) {
                goog.debugLoader_.setDependencyFactory(e)
            }, goog.global.CLOSURE_NO_DEPS || goog.debugLoader_.loadClosureDeps(), goog.bootstrap = function(e, t) {
                goog.debugLoader_.bootstrap(e, t)
            }), goog.TRUSTED_TYPES_POLICY_NAME = "", goog.identity_ = function(e) {
                return e
            }, goog.createTrustedTypesPolicy = function(e) {
                var t = null;
                if ("undefined" == typeof TrustedTypes || !TrustedTypes.createPolicy) return t;
                try {
                    t = TrustedTypes.createPolicy(e, {
                        createHTML: goog.identity_,
                        createScript: goog.identity_,
                        createScriptURL: goog.identity_,
                        createURL: goog.identity_
                    })
                } catch (e) {
                    goog.logToConsole_(e.message)
                }
                return t
            }, goog.TRUSTED_TYPES_POLICY_ = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#base") : null;
            var jspb = {
                BinaryConstants: {},
                ConstBinaryMessage: function() {},
                BinaryMessage: function() {}
            };
            jspb.BinaryConstants.FieldType = {
                INVALID: -1,
                DOUBLE: 1,
                FLOAT: 2,
                INT64: 3,
                UINT64: 4,
                INT32: 5,
                FIXED64: 6,
                FIXED32: 7,
                BOOL: 8,
                STRING: 9,
                GROUP: 10,
                MESSAGE: 11,
                BYTES: 12,
                UINT32: 13,
                ENUM: 14,
                SFIXED32: 15,
                SFIXED64: 16,
                SINT32: 17,
                SINT64: 18,
                FHASH64: 30,
                VHASH64: 31
            }, jspb.BinaryConstants.WireType = {
                INVALID: -1,
                VARINT: 0,
                FIXED64: 1,
                DELIMITED: 2,
                START_GROUP: 3,
                END_GROUP: 4,
                FIXED32: 5
            }, jspb.BinaryConstants.FieldTypeToWireType = function(e) {
                var t = jspb.BinaryConstants.FieldType,
                    o = jspb.BinaryConstants.WireType;
                switch (e) {
                    case t.INT32:
                    case t.INT64:
                    case t.UINT32:
                    case t.UINT64:
                    case t.SINT32:
                    case t.SINT64:
                    case t.BOOL:
                    case t.ENUM:
                    case t.VHASH64:
                        return o.VARINT;
                    case t.DOUBLE:
                    case t.FIXED64:
                    case t.SFIXED64:
                    case t.FHASH64:
                        return o.FIXED64;
                    case t.STRING:
                    case t.MESSAGE:
                    case t.BYTES:
                        return o.DELIMITED;
                    case t.FLOAT:
                    case t.FIXED32:
                    case t.SFIXED32:
                        return o.FIXED32;
                    default:
                        return o.INVALID
                }
            }, jspb.BinaryConstants.INVALID_FIELD_NUMBER = -1, jspb.BinaryConstants.FLOAT32_EPS = 1.401298464324817e-45, jspb.BinaryConstants.FLOAT32_MIN = 1.1754943508222875e-38, jspb.BinaryConstants.FLOAT32_MAX = 3.4028234663852886e38, jspb.BinaryConstants.FLOAT64_EPS = 5e-324, jspb.BinaryConstants.FLOAT64_MIN = 2.2250738585072014e-308, jspb.BinaryConstants.FLOAT64_MAX = 1.7976931348623157e308, jspb.BinaryConstants.TWO_TO_20 = 1048576, jspb.BinaryConstants.TWO_TO_23 = 8388608, jspb.BinaryConstants.TWO_TO_31 = 2147483648, jspb.BinaryConstants.TWO_TO_32 = 4294967296, jspb.BinaryConstants.TWO_TO_52 = 4503599627370496, jspb.BinaryConstants.TWO_TO_63 = 0x8000000000000000, jspb.BinaryConstants.TWO_TO_64 = 0x10000000000000000, jspb.BinaryConstants.ZERO_HASH = "\0\0\0\0\0\0\0\0", goog.dom = {}, goog.dom.NodeType = {
                ELEMENT: 1,
                ATTRIBUTE: 2,
                TEXT: 3,
                CDATA_SECTION: 4,
                ENTITY_REFERENCE: 5,
                ENTITY: 6,
                PROCESSING_INSTRUCTION: 7,
                COMMENT: 8,
                DOCUMENT: 9,
                DOCUMENT_TYPE: 10,
                DOCUMENT_FRAGMENT: 11,
                NOTATION: 12
            }, goog.debug = {}, goog.debug.Error = function(e) {
                if (Error.captureStackTrace) Error.captureStackTrace(this, goog.debug.Error);
                else {
                    var t = Error().stack;
                    t && (this.stack = t)
                }
                e && (this.message = String(e)), this.reportErrorToServer = !0
            }, goog.inherits(goog.debug.Error, Error), goog.debug.Error.prototype.name = "CustomError", goog.asserts = {}, goog.asserts.ENABLE_ASSERTS = goog.DEBUG, goog.asserts.AssertionError = function(e, t) {
                goog.debug.Error.call(this, goog.asserts.subs_(e, t)), this.messagePattern = e
            }, goog.inherits(goog.asserts.AssertionError, goog.debug.Error), goog.asserts.AssertionError.prototype.name = "AssertionError", goog.asserts.DEFAULT_ERROR_HANDLER = function(e) {
                throw e
            }, goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER, goog.asserts.subs_ = function(e, t) {
                for (var o = "", r = (e = e.split("%s")).length - 1, s = 0; s < r; s++) o += e[s] + (s < t.length ? t[s] : "%s");
                return o + e[r]
            }, goog.asserts.doAssertFailure_ = function(e, t, o, r) {
                var s = "Assertion failed";
                if (o) {
                    s += ": " + o;
                    var n = r
                } else e && (s += ": " + e, n = t);
                e = new goog.asserts.AssertionError("" + s, n || []), goog.asserts.errorHandler_(e)
            }, goog.asserts.setErrorHandler = function(e) {
                goog.asserts.ENABLE_ASSERTS && (goog.asserts.errorHandler_ = e)
            }, goog.asserts.assert = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !e && goog.asserts.doAssertFailure_("", null, t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertExists = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && null == e && goog.asserts.doAssertFailure_("Expected to exist: %s.", [e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.fail = function(e, t) {
                goog.asserts.ENABLE_ASSERTS && goog.asserts.errorHandler_(new goog.asserts.AssertionError("Failure" + (e ? ": " + e : ""), Array.prototype.slice.call(arguments, 1)))
            }, goog.asserts.assertNumber = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isNumber(e) && goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertString = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isString(e) && goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertFunction = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isFunction(e) && goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertObject = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isObject(e) && goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertArray = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isArray(e) && goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertBoolean = function(e, t, o) {
                return goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(e) && goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertElement = function(e, t, o) {
                return !goog.asserts.ENABLE_ASSERTS || goog.isObject(e) && e.nodeType == goog.dom.NodeType.ELEMENT || goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(e), e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertInstanceof = function(e, t, o, r) {
                return !goog.asserts.ENABLE_ASSERTS || e instanceof t || goog.asserts.doAssertFailure_("Expected instanceof %s but got %s.", [goog.asserts.getType_(t), goog.asserts.getType_(e)], o, Array.prototype.slice.call(arguments, 3)), e
            }, goog.asserts.assertFinite = function(e, t, o) {
                return !goog.asserts.ENABLE_ASSERTS || "number" == typeof e && isFinite(e) || goog.asserts.doAssertFailure_("Expected %s to be a finite number but it is not.", [e], t, Array.prototype.slice.call(arguments, 2)), e
            }, goog.asserts.assertObjectPrototypeIsIntact = function() {
                for (var e in Object.prototype) goog.asserts.fail(e + " should not be enumerable in Object.prototype.")
            }, goog.asserts.getType_ = function(e) {
                return e instanceof Function ? e.displayName || e.name || "unknown type name" : e instanceof Object ? e.constructor.displayName || e.constructor.name || Object.prototype.toString.call(e) : null === e ? "null" : typeof e
            }, goog.array = {}, goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE, goog.array.ASSUME_NATIVE_FUNCTIONS = 2012 < goog.FEATURESET_YEAR, goog.array.peek = function(e) {
                return e[e.length - 1]
            }, goog.array.last = goog.array.peek, goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.indexOf) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.indexOf.call(e, t, o)
            } : function(e, t, o) {
                if (o = null == o ? 0 : 0 > o ? Math.max(0, e.length + o) : o, goog.isString(e)) return goog.isString(t) && 1 == t.length ? e.indexOf(t, o) : -1;
                for (; o < e.length; o++)
                    if (o in e && e[o] === t) return o;
                return -1
            }, goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.lastIndexOf) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.lastIndexOf.call(e, t, null == o ? e.length - 1 : o)
            } : function(e, t, o) {
                if (0 > (o = null == o ? e.length - 1 : o) && (o = Math.max(0, e.length + o)), goog.isString(e)) return goog.isString(t) && 1 == t.length ? e.lastIndexOf(t, o) : -1;
                for (; 0 <= o; o--)
                    if (o in e && e[o] === t) return o;
                return -1
            }, goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.forEach) ? function(e, t, o) {
                goog.asserts.assert(null != e.length), Array.prototype.forEach.call(e, t, o)
            } : function(e, t, o) {
                for (var r = e.length, s = goog.isString(e) ? e.split("") : e, n = 0; n < r; n++) n in s && t.call(o, s[n], n, e)
            }, goog.array.forEachRight = function(e, t, o) {
                var r = e.length,
                    s = goog.isString(e) ? e.split("") : e;
                for (--r; 0 <= r; --r) r in s && t.call(o, s[r], r, e)
            }, goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.filter) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.filter.call(e, t, o)
            } : function(e, t, o) {
                for (var r = e.length, s = [], n = 0, i = goog.isString(e) ? e.split("") : e, a = 0; a < r; a++)
                    if (a in i) {
                        var g = i[a];
                        t.call(o, g, a, e) && (s[n++] = g)
                    } return s
            }, goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.map) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.map.call(e, t, o)
            } : function(e, t, o) {
                for (var r = e.length, s = Array(r), n = goog.isString(e) ? e.split("") : e, i = 0; i < r; i++) i in n && (s[i] = t.call(o, n[i], i, e));
                return s
            }, goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduce) ? function(e, t, o, r) {
                return goog.asserts.assert(null != e.length), r && (t = goog.bind(t, r)), Array.prototype.reduce.call(e, t, o)
            } : function(e, t, o, r) {
                var s = o;
                return goog.array.forEach(e, function(o, n) {
                    s = t.call(r, s, o, n, e)
                }), s
            }, goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduceRight) ? function(e, t, o, r) {
                return goog.asserts.assert(null != e.length), goog.asserts.assert(null != t), r && (t = goog.bind(t, r)), Array.prototype.reduceRight.call(e, t, o)
            } : function(e, t, o, r) {
                var s = o;
                return goog.array.forEachRight(e, function(o, n) {
                    s = t.call(r, s, o, n, e)
                }), s
            }, goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.some) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.some.call(e, t, o)
            } : function(e, t, o) {
                for (var r = e.length, s = goog.isString(e) ? e.split("") : e, n = 0; n < r; n++)
                    if (n in s && t.call(o, s[n], n, e)) return !0;
                return !1
            }, goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.every) ? function(e, t, o) {
                return goog.asserts.assert(null != e.length), Array.prototype.every.call(e, t, o)
            } : function(e, t, o) {
                for (var r = e.length, s = goog.isString(e) ? e.split("") : e, n = 0; n < r; n++)
                    if (n in s && !t.call(o, s[n], n, e)) return !1;
                return !0
            }, goog.array.count = function(e, t, o) {
                var r = 0;
                return goog.array.forEach(e, function(e, s, n) {
                    t.call(o, e, s, n) && ++r
                }, o), r
            }, goog.array.find = function(e, t, o) {
                return 0 > (t = goog.array.findIndex(e, t, o)) ? null : goog.isString(e) ? e.charAt(t) : e[t]
            }, goog.array.findIndex = function(e, t, o) {
                for (var r = e.length, s = goog.isString(e) ? e.split("") : e, n = 0; n < r; n++)
                    if (n in s && t.call(o, s[n], n, e)) return n;
                return -1
            }, goog.array.findRight = function(e, t, o) {
                return 0 > (t = goog.array.findIndexRight(e, t, o)) ? null : goog.isString(e) ? e.charAt(t) : e[t]
            }, goog.array.findIndexRight = function(e, t, o) {
                var r = e.length,
                    s = goog.isString(e) ? e.split("") : e;
                for (--r; 0 <= r; r--)
                    if (r in s && t.call(o, s[r], r, e)) return r;
                return -1
            }, goog.array.contains = function(e, t) {
                return 0 <= goog.array.indexOf(e, t)
            }, goog.array.isEmpty = function(e) {
                return 0 == e.length
            }, goog.array.clear = function(e) {
                if (!goog.isArray(e))
                    for (var t = e.length - 1; 0 <= t; t--) delete e[t];
                e.length = 0
            }, goog.array.insert = function(e, t) {
                goog.array.contains(e, t) || e.push(t)
            }, goog.array.insertAt = function(e, t, o) {
                goog.array.splice(e, o, 0, t)
            }, goog.array.insertArrayAt = function(e, t, o) {
                goog.partial(goog.array.splice, e, o, 0).apply(null, t)
            }, goog.array.insertBefore = function(e, t, o) {
                var r;
                2 == arguments.length || 0 > (r = goog.array.indexOf(e, o)) ? e.push(t) : goog.array.insertAt(e, t, r)
            }, goog.array.remove = function(e, t) {
                var o;
                return (o = 0 <= (t = goog.array.indexOf(e, t))) && goog.array.removeAt(e, t), o
            }, goog.array.removeLast = function(e, t) {
                return 0 <= (t = goog.array.lastIndexOf(e, t)) && (goog.array.removeAt(e, t), !0)
            }, goog.array.removeAt = function(e, t) {
                return goog.asserts.assert(null != e.length), 1 == Array.prototype.splice.call(e, t, 1).length
            }, goog.array.removeIf = function(e, t, o) {
                return 0 <= (t = goog.array.findIndex(e, t, o)) && (goog.array.removeAt(e, t), !0)
            }, goog.array.removeAllIf = function(e, t, o) {
                var r = 0;
                return goog.array.forEachRight(e, function(s, n) {
                    t.call(o, s, n, e) && goog.array.removeAt(e, n) && r++
                }), r
            }, goog.array.concat = function(e) {
                return Array.prototype.concat.apply([], arguments)
            }, goog.array.join = function(e) {
                return Array.prototype.concat.apply([], arguments)
            }, goog.array.toArray = function(e) {
                var t = e.length;
                if (0 < t) {
                    for (var o = Array(t), r = 0; r < t; r++) o[r] = e[r];
                    return o
                }
                return []
            }, goog.array.clone = goog.array.toArray, goog.array.extend = function(e, t) {
                for (var o = 1; o < arguments.length; o++) {
                    var r = arguments[o];
                    if (goog.isArrayLike(r)) {
                        var s = e.length || 0,
                            n = r.length || 0;
                        e.length = s + n;
                        for (var i = 0; i < n; i++) e[s + i] = r[i]
                    } else e.push(r)
                }
            }, goog.array.splice = function(e, t, o, r) {
                return goog.asserts.assert(null != e.length), Array.prototype.splice.apply(e, goog.array.slice(arguments, 1))
            }, goog.array.slice = function(e, t, o) {
                return goog.asserts.assert(null != e.length), 2 >= arguments.length ? Array.prototype.slice.call(e, t) : Array.prototype.slice.call(e, t, o)
            }, goog.array.removeDuplicates = function(e, t, o) {
                t = t || e;
                var r = function(e) {
                    return goog.isObject(e) ? "o" + goog.getUid(e) : (typeof e).charAt(0) + e
                };
                o = o || r, r = {};
                for (var s = 0, n = 0; n < e.length;) {
                    var i = e[n++],
                        a = o(i);
                    Object.prototype.hasOwnProperty.call(r, a) || (r[a] = !0, t[s++] = i)
                }
                t.length = s
            }, goog.array.binarySearch = function(e, t, o) {
                return goog.array.binarySearch_(e, o || goog.array.defaultCompare, !1, t)
            }, goog.array.binarySelect = function(e, t, o) {
                return goog.array.binarySearch_(e, t, !0, void 0, o)
            }, goog.array.binarySearch_ = function(e, t, o, r, s) {
                for (var n, i = 0, a = e.length; i < a;) {
                    var g = i + a >> 1,
                        c = o ? t.call(s, e[g], g, e) : t(r, e[g]);
                    0 < c ? i = g + 1 : (a = g, n = !c)
                }
                return n ? i : ~i
            }, goog.array.sort = function(e, t) {
                e.sort(t || goog.array.defaultCompare)
            }, goog.array.stableSort = function(e, t) {
                for (var o = Array(e.length), r = 0; r < e.length; r++) o[r] = {
                    index: r,
                    value: e[r]
                };
                var s = t || goog.array.defaultCompare;
                for (goog.array.sort(o, function(e, t) {
                        return s(e.value, t.value) || e.index - t.index
                    }), r = 0; r < e.length; r++) e[r] = o[r].value
            }, goog.array.sortByKey = function(e, t, o) {
                var r = o || goog.array.defaultCompare;
                goog.array.sort(e, function(e, o) {
                    return r(t(e), t(o))
                })
            }, goog.array.sortObjectsByKey = function(e, t, o) {
                goog.array.sortByKey(e, function(e) {
                    return e[t]
                }, o)
            }, goog.array.isSorted = function(e, t, o) {
                t = t || goog.array.defaultCompare;
                for (var r = 1; r < e.length; r++) {
                    var s = t(e[r - 1], e[r]);
                    if (0 < s || 0 == s && o) return !1
                }
                return !0
            }, goog.array.equals = function(e, t, o) {
                if (!goog.isArrayLike(e) || !goog.isArrayLike(t) || e.length != t.length) return !1;
                var r = e.length;
                o = o || goog.array.defaultCompareEquality;
                for (var s = 0; s < r; s++)
                    if (!o(e[s], t[s])) return !1;
                return !0
            }, goog.array.compare3 = function(e, t, o) {
                o = o || goog.array.defaultCompare;
                for (var r = Math.min(e.length, t.length), s = 0; s < r; s++) {
                    var n = o(e[s], t[s]);
                    if (0 != n) return n
                }
                return goog.array.defaultCompare(e.length, t.length)
            }, goog.array.defaultCompare = function(e, t) {
                return e > t ? 1 : e < t ? -1 : 0
            }, goog.array.inverseDefaultCompare = function(e, t) {
                return -goog.array.defaultCompare(e, t)
            }, goog.array.defaultCompareEquality = function(e, t) {
                return e === t
            }, goog.array.binaryInsert = function(e, t, o) {
                return 0 > (o = goog.array.binarySearch(e, t, o)) && (goog.array.insertAt(e, t, -(o + 1)), !0)
            }, goog.array.binaryRemove = function(e, t, o) {
                return 0 <= (t = goog.array.binarySearch(e, t, o)) && goog.array.removeAt(e, t)
            }, goog.array.bucket = function(e, t, o) {
                for (var r = {}, s = 0; s < e.length; s++) {
                    var n = e[s],
                        i = t.call(o, n, s, e);
                    goog.isDef(i) && (r[i] || (r[i] = [])).push(n)
                }
                return r
            }, goog.array.toObject = function(e, t, o) {
                var r = {};
                return goog.array.forEach(e, function(s, n) {
                    r[t.call(o, s, n, e)] = s
                }), r
            }, goog.array.range = function(e, t, o) {
                var r = [],
                    s = 0,
                    n = e;
                if (void 0 !== t && (s = e, n = t), 0 > (o = o || 1) * (n - s)) return [];
                if (0 < o)
                    for (e = s; e < n; e += o) r.push(e);
                else
                    for (e = s; e > n; e += o) r.push(e);
                return r
            }, goog.array.repeat = function(e, t) {
                for (var o = [], r = 0; r < t; r++) o[r] = e;
                return o
            }, goog.array.flatten = function(e) {
                for (var t = [], o = 0; o < arguments.length; o++) {
                    var r = arguments[o];
                    if (goog.isArray(r))
                        for (var s = 0; s < r.length; s += 8192) {
                            var n = goog.array.slice(r, s, s + 8192);
                            n = goog.array.flatten.apply(null, n);
                            for (var i = 0; i < n.length; i++) t.push(n[i])
                        } else t.push(r)
                }
                return t
            }, goog.array.rotate = function(e, t) {
                return goog.asserts.assert(null != e.length), e.length && (0 < (t %= e.length) ? Array.prototype.unshift.apply(e, e.splice(-t, t)) : 0 > t && Array.prototype.push.apply(e, e.splice(0, -t))), e
            }, goog.array.moveItem = function(e, t, o) {
                goog.asserts.assert(0 <= t && t < e.length), goog.asserts.assert(0 <= o && o < e.length), t = Array.prototype.splice.call(e, t, 1), Array.prototype.splice.call(e, o, 0, t[0])
            }, goog.array.zip = function(e) {
                if (!arguments.length) return [];
                for (var t = [], o = arguments[0].length, r = 1; r < arguments.length; r++) arguments[r].length < o && (o = arguments[r].length);
                for (r = 0; r < o; r++) {
                    for (var s = [], n = 0; n < arguments.length; n++) s.push(arguments[n][r]);
                    t.push(s)
                }
                return t
            }, goog.array.shuffle = function(e, t) {
                t = t || Math.random;
                for (var o = e.length - 1; 0 < o; o--) {
                    var r = Math.floor(t() * (o + 1)),
                        s = e[o];
                    e[o] = e[r], e[r] = s
                }
            }, goog.array.copyByIndex = function(e, t) {
                var o = [];
                return goog.array.forEach(t, function(t) {
                    o.push(e[t])
                }), o
            }, goog.array.concatMap = function(e, t, o) {
                return goog.array.concat.apply([], goog.array.map(e, t, o))
            }, goog.crypt = {}, goog.crypt.stringToByteArray = function(e) {
                for (var t = [], o = 0, r = 0; r < e.length; r++) {
                    var s = e.charCodeAt(r);
                    255 < s && (t[o++] = 255 & s, s >>= 8), t[o++] = s
                }
                return t
            }, goog.crypt.byteArrayToString = function(e) {
                if (8192 >= e.length) return String.fromCharCode.apply(null, e);
                for (var t = "", o = 0; o < e.length; o += 8192) {
                    var r = goog.array.slice(e, o, o + 8192);
                    t += String.fromCharCode.apply(null, r)
                }
                return t
            }, goog.crypt.byteArrayToHex = function(e, t) {
                return goog.array.map(e, function(e) {
                    return 1 < (e = e.toString(16)).length ? e : "0" + e
                }).join(t || "")
            }, goog.crypt.hexToByteArray = function(e) {
                goog.asserts.assert(0 == e.length % 2, "Key string length must be multiple of 2");
                for (var t = [], o = 0; o < e.length; o += 2) t.push(parseInt(e.substring(o, o + 2), 16));
                return t
            }, goog.crypt.stringToUtf8ByteArray = function(e) {
                for (var t = [], o = 0, r = 0; r < e.length; r++) {
                    var s = e.charCodeAt(r);
                    128 > s ? t[o++] = s : (2048 > s ? t[o++] = s >> 6 | 192 : (55296 == (64512 & s) && r + 1 < e.length && 56320 == (64512 & e.charCodeAt(r + 1)) ? (s = 65536 + ((1023 & s) << 10) + (1023 & e.charCodeAt(++r)), t[o++] = s >> 18 | 240, t[o++] = s >> 12 & 63 | 128) : t[o++] = s >> 12 | 224, t[o++] = s >> 6 & 63 | 128), t[o++] = 63 & s | 128)
                }
                return t
            }, goog.crypt.utf8ByteArrayToString = function(e) {
                for (var t = [], o = 0, r = 0; o < e.length;) {
                    var s = e[o++];
                    if (128 > s) t[r++] = String.fromCharCode(s);
                    else if (191 < s && 224 > s) {
                        var n = e[o++];
                        t[r++] = String.fromCharCode((31 & s) << 6 | 63 & n)
                    } else if (239 < s && 365 > s) {
                        n = e[o++];
                        var i = e[o++];
                        s = ((7 & s) << 18 | (63 & n) << 12 | (63 & i) << 6 | 63 & e[o++]) - 65536, t[r++] = String.fromCharCode(55296 + (s >> 10)), t[r++] = String.fromCharCode(56320 + (1023 & s))
                    } else n = e[o++], i = e[o++], t[r++] = String.fromCharCode((15 & s) << 12 | (63 & n) << 6 | 63 & i)
                }
                return t.join("")
            }, goog.crypt.xorByteArray = function(e, t) {
                goog.asserts.assert(e.length == t.length, "XOR array lengths must match");
                for (var o = [], r = 0; r < e.length; r++) o.push(e[r] ^ t[r]);
                return o
            }, goog.string = {}, goog.string.internal = {}, goog.string.internal.startsWith = function(e, t) {
                return 0 == e.lastIndexOf(t, 0)
            }, goog.string.internal.endsWith = function(e, t) {
                var o = e.length - t.length;
                return 0 <= o && e.indexOf(t, o) == o
            }, goog.string.internal.caseInsensitiveStartsWith = function(e, t) {
                return 0 == goog.string.internal.caseInsensitiveCompare(t, e.substr(0, t.length))
            }, goog.string.internal.caseInsensitiveEndsWith = function(e, t) {
                return 0 == goog.string.internal.caseInsensitiveCompare(t, e.substr(e.length - t.length, t.length))
            }, goog.string.internal.caseInsensitiveEquals = function(e, t) {
                return e.toLowerCase() == t.toLowerCase()
            }, goog.string.internal.isEmptyOrWhitespace = function(e) {
                return /^[\s\xa0]*$/.test(e)
            }, goog.string.internal.trim = goog.TRUSTED_SITE && String.prototype.trim ? function(e) {
                return e.trim()
            } : function(e) {
                return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(e)[1]
            }, goog.string.internal.caseInsensitiveCompare = function(e, t) {
                return (e = String(e).toLowerCase()) < (t = String(t).toLowerCase()) ? -1 : e == t ? 0 : 1
            }, goog.string.internal.newLineToBr = function(e, t) {
                return e.replace(/(\r\n|\r|\n)/g, t ? "<br />" : "<br>")
            }, goog.string.internal.htmlEscape = function(e, t) {
                if (t) e = e.replace(goog.string.internal.AMP_RE_, "&amp;").replace(goog.string.internal.LT_RE_, "&lt;").replace(goog.string.internal.GT_RE_, "&gt;").replace(goog.string.internal.QUOT_RE_, "&quot;").replace(goog.string.internal.SINGLE_QUOTE_RE_, "&#39;").replace(goog.string.internal.NULL_RE_, "&#0;");
                else {
                    if (!goog.string.internal.ALL_RE_.test(e)) return e; - 1 != e.indexOf("&") && (e = e.replace(goog.string.internal.AMP_RE_, "&amp;")), -1 != e.indexOf("<") && (e = e.replace(goog.string.internal.LT_RE_, "&lt;")), -1 != e.indexOf(">") && (e = e.replace(goog.string.internal.GT_RE_, "&gt;")), -1 != e.indexOf('"') && (e = e.replace(goog.string.internal.QUOT_RE_, "&quot;")), -1 != e.indexOf("'") && (e = e.replace(goog.string.internal.SINGLE_QUOTE_RE_, "&#39;")), -1 != e.indexOf("\0") && (e = e.replace(goog.string.internal.NULL_RE_, "&#0;"))
                }
                return e
            }, goog.string.internal.AMP_RE_ = /&/g, goog.string.internal.LT_RE_ = /</g, goog.string.internal.GT_RE_ = />/g, goog.string.internal.QUOT_RE_ = /"/g, goog.string.internal.SINGLE_QUOTE_RE_ = /'/g, goog.string.internal.NULL_RE_ = /\x00/g, goog.string.internal.ALL_RE_ = /[\x00&<>"']/, goog.string.internal.whitespaceEscape = function(e, t) {
                return goog.string.internal.newLineToBr(e.replace(/  /g, " &#160;"), t)
            }, goog.string.internal.contains = function(e, t) {
                return -1 != e.indexOf(t)
            }, goog.string.internal.caseInsensitiveContains = function(e, t) {
                return goog.string.internal.contains(e.toLowerCase(), t.toLowerCase())
            }, goog.string.internal.compareVersions = function(e, t) {
                var o = 0;
                e = goog.string.internal.trim(String(e)).split("."), t = goog.string.internal.trim(String(t)).split(".");
                for (var r = Math.max(e.length, t.length), s = 0; 0 == o && s < r; s++) {
                    var n = e[s] || "",
                        i = t[s] || "";
                    do {
                        if (n = /(\d*)(\D*)(.*)/.exec(n) || ["", "", "", ""], i = /(\d*)(\D*)(.*)/.exec(i) || ["", "", "", ""], 0 == n[0].length && 0 == i[0].length) break;
                        o = 0 == n[1].length ? 0 : parseInt(n[1], 10);
                        var a = 0 == i[1].length ? 0 : parseInt(i[1], 10);
                        o = goog.string.internal.compareElements_(o, a) || goog.string.internal.compareElements_(0 == n[2].length, 0 == i[2].length) || goog.string.internal.compareElements_(n[2], i[2]), n = n[3], i = i[3]
                    } while (0 == o)
                }
                return o
            }, goog.string.internal.compareElements_ = function(e, t) {
                return e < t ? -1 : e > t ? 1 : 0
            }, goog.string.TypedString = function() {}, goog.string.Const = function(e, t) {
                this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ = e === goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ && t || "", this.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ = goog.string.Const.TYPE_MARKER_
            }, goog.string.Const.prototype.implementsGoogStringTypedString = !0, goog.string.Const.prototype.getTypedStringValue = function() {
                return this.stringConstValueWithSecurityContract__googStringSecurityPrivate_
            }, goog.string.Const.prototype.toString = function() {
                return "Const{" + this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ + "}"
            }, goog.string.Const.unwrap = function(e) {
                return e instanceof goog.string.Const && e.constructor === goog.string.Const && e.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ === goog.string.Const.TYPE_MARKER_ ? e.stringConstValueWithSecurityContract__googStringSecurityPrivate_ : (goog.asserts.fail("expected object of type Const, got '" + e + "'"), "type_error:Const")
            }, goog.string.Const.from = function(e) {
                return new goog.string.Const(goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_, e)
            }, goog.string.Const.TYPE_MARKER_ = {}, goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ = {}, goog.string.Const.EMPTY = goog.string.Const.from(""), goog.fs = {}, goog.fs.url = {}, goog.fs.url.createObjectUrl = function(e) {
                return goog.fs.url.getUrlObject_().createObjectURL(e)
            }, goog.fs.url.revokeObjectUrl = function(e) {
                goog.fs.url.getUrlObject_().revokeObjectURL(e)
            }, goog.fs.url.getUrlObject_ = function() {
                var e = goog.fs.url.findUrlObject_();
                if (null != e) return e;
                throw Error("This browser doesn't seem to support blob URLs")
            }, goog.fs.url.findUrlObject_ = function() {
                return goog.isDef(goog.global.URL) && goog.isDef(goog.global.URL.createObjectURL) ? goog.global.URL : goog.isDef(goog.global.webkitURL) && goog.isDef(goog.global.webkitURL.createObjectURL) ? goog.global.webkitURL : goog.isDef(goog.global.createObjectURL) ? goog.global : null
            }, goog.fs.url.browserSupportsObjectUrls = function() {
                return null != goog.fs.url.findUrlObject_()
            }, goog.html = {}, goog.html.trustedtypes = {}, goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#html") : null, goog.i18n = {}, goog.i18n.bidi = {}, goog.i18n.bidi.FORCE_RTL = !1, goog.i18n.bidi.IS_RTL = goog.i18n.bidi.FORCE_RTL || ("ar" == goog.LOCALE.substring(0, 2).toLowerCase() || "fa" == goog.LOCALE.substring(0, 2).toLowerCase() || "he" == goog.LOCALE.substring(0, 2).toLowerCase() || "iw" == goog.LOCALE.substring(0, 2).toLowerCase() || "ps" == goog.LOCALE.substring(0, 2).toLowerCase() || "sd" == goog.LOCALE.substring(0, 2).toLowerCase() || "ug" == goog.LOCALE.substring(0, 2).toLowerCase() || "ur" == goog.LOCALE.substring(0, 2).toLowerCase() || "yi" == goog.LOCALE.substring(0, 2).toLowerCase()) && (2 == goog.LOCALE.length || "-" == goog.LOCALE.substring(2, 3) || "_" == goog.LOCALE.substring(2, 3)) || 3 <= goog.LOCALE.length && "ckb" == goog.LOCALE.substring(0, 3).toLowerCase() && (3 == goog.LOCALE.length || "-" == goog.LOCALE.substring(3, 4) || "_" == goog.LOCALE.substring(3, 4)) || 7 <= goog.LOCALE.length && ("-" == goog.LOCALE.substring(2, 3) || "_" == goog.LOCALE.substring(2, 3)) && ("adlm" == goog.LOCALE.substring(3, 7).toLowerCase() || "arab" == goog.LOCALE.substring(3, 7).toLowerCase() || "hebr" == goog.LOCALE.substring(3, 7).toLowerCase() || "nkoo" == goog.LOCALE.substring(3, 7).toLowerCase() || "rohg" == goog.LOCALE.substring(3, 7).toLowerCase() || "thaa" == goog.LOCALE.substring(3, 7).toLowerCase()) || 8 <= goog.LOCALE.length && ("-" == goog.LOCALE.substring(3, 4) || "_" == goog.LOCALE.substring(3, 4)) && ("adlm" == goog.LOCALE.substring(4, 8).toLowerCase() || "arab" == goog.LOCALE.substring(4, 8).toLowerCase() || "hebr" == goog.LOCALE.substring(4, 8).toLowerCase() || "nkoo" == goog.LOCALE.substring(4, 8).toLowerCase() || "rohg" == goog.LOCALE.substring(4, 8).toLowerCase() || "thaa" == goog.LOCALE.substring(4, 8).toLowerCase()), goog.i18n.bidi.Format = {
                LRE: "‪",
                RLE: "‫",
                PDF: "‬",
                LRM: "‎",
                RLM: "‏"
            }, goog.i18n.bidi.Dir = {
                LTR: 1,
                RTL: -1,
                NEUTRAL: 0
            }, goog.i18n.bidi.RIGHT = "right", goog.i18n.bidi.LEFT = "left", goog.i18n.bidi.I18N_RIGHT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.LEFT : goog.i18n.bidi.RIGHT, goog.i18n.bidi.I18N_LEFT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT, goog.i18n.bidi.toDir = function(e, t) {
                return "number" == typeof e ? 0 < e ? goog.i18n.bidi.Dir.LTR : 0 > e ? goog.i18n.bidi.Dir.RTL : t ? null : goog.i18n.bidi.Dir.NEUTRAL : null == e ? null : e ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR
            }, goog.i18n.bidi.ltrChars_ = "A-Za-zÀ-ÖØ-öø-ʸ̀-֐ऀ-῿‎Ⰰ-\ud801\ud804-\ud839\ud83c-\udbff豈-﬜︀-﹯﻽-￿", goog.i18n.bidi.rtlChars_ = "֑-ۯۺ-ࣿ‏\ud802-\ud803\ud83a-\ud83bיִ-﷿ﹰ-ﻼ", goog.i18n.bidi.htmlSkipReg_ = /<[^>]*>|&[^;]+;/g, goog.i18n.bidi.stripHtmlIfNeeded_ = function(e, t) {
                return t ? e.replace(goog.i18n.bidi.htmlSkipReg_, "") : e
            }, goog.i18n.bidi.rtlCharReg_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "]"), goog.i18n.bidi.ltrCharReg_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "]"), goog.i18n.bidi.hasAnyRtl = function(e, t) {
                return goog.i18n.bidi.rtlCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.hasRtlChar = goog.i18n.bidi.hasAnyRtl, goog.i18n.bidi.hasAnyLtr = function(e, t) {
                return goog.i18n.bidi.ltrCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.ltrRe_ = new RegExp("^[" + goog.i18n.bidi.ltrChars_ + "]"), goog.i18n.bidi.rtlRe_ = new RegExp("^[" + goog.i18n.bidi.rtlChars_ + "]"), goog.i18n.bidi.isRtlChar = function(e) {
                return goog.i18n.bidi.rtlRe_.test(e)
            }, goog.i18n.bidi.isLtrChar = function(e) {
                return goog.i18n.bidi.ltrRe_.test(e)
            }, goog.i18n.bidi.isNeutralChar = function(e) {
                return !goog.i18n.bidi.isLtrChar(e) && !goog.i18n.bidi.isRtlChar(e)
            }, goog.i18n.bidi.ltrDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.rtlChars_ + "]*[" + goog.i18n.bidi.ltrChars_ + "]"), goog.i18n.bidi.rtlDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.ltrChars_ + "]*[" + goog.i18n.bidi.rtlChars_ + "]"), goog.i18n.bidi.startsWithRtl = function(e, t) {
                return goog.i18n.bidi.rtlDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.isRtlText = goog.i18n.bidi.startsWithRtl, goog.i18n.bidi.startsWithLtr = function(e, t) {
                return goog.i18n.bidi.ltrDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.isLtrText = goog.i18n.bidi.startsWithLtr, goog.i18n.bidi.isRequiredLtrRe_ = /^http:\/\/.*/, goog.i18n.bidi.isNeutralText = function(e, t) {
                return e = goog.i18n.bidi.stripHtmlIfNeeded_(e, t), goog.i18n.bidi.isRequiredLtrRe_.test(e) || !goog.i18n.bidi.hasAnyLtr(e) && !goog.i18n.bidi.hasAnyRtl(e)
            }, goog.i18n.bidi.ltrExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "][^" + goog.i18n.bidi.rtlChars_ + "]*$"), goog.i18n.bidi.rtlExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "][^" + goog.i18n.bidi.ltrChars_ + "]*$"), goog.i18n.bidi.endsWithLtr = function(e, t) {
                return goog.i18n.bidi.ltrExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.isLtrExitText = goog.i18n.bidi.endsWithLtr, goog.i18n.bidi.endsWithRtl = function(e, t) {
                return goog.i18n.bidi.rtlExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(e, t))
            }, goog.i18n.bidi.isRtlExitText = goog.i18n.bidi.endsWithRtl, goog.i18n.bidi.rtlLocalesRe_ = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i, goog.i18n.bidi.isRtlLanguage = function(e) {
                return goog.i18n.bidi.rtlLocalesRe_.test(e)
            }, goog.i18n.bidi.bracketGuardTextRe_ = /(\(.*?\)+)|(\[.*?\]+)|(\{.*?\}+)|(<.*?>+)/g, goog.i18n.bidi.guardBracketInText = function(e, t) {
                return t = (void 0 === t ? goog.i18n.bidi.hasAnyRtl(e) : t) ? goog.i18n.bidi.Format.RLM : goog.i18n.bidi.Format.LRM, e.replace(goog.i18n.bidi.bracketGuardTextRe_, t + "$&" + t)
            }, goog.i18n.bidi.enforceRtlInHtml = function(e) {
                return "<" == e.charAt(0) ? e.replace(/<\w+/, "$& dir=rtl") : "\n<span dir=rtl>" + e + "</span>"
            }, goog.i18n.bidi.enforceRtlInText = function(e) {
                return goog.i18n.bidi.Format.RLE + e + goog.i18n.bidi.Format.PDF
            }, goog.i18n.bidi.enforceLtrInHtml = function(e) {
                return "<" == e.charAt(0) ? e.replace(/<\w+/, "$& dir=ltr") : "\n<span dir=ltr>" + e + "</span>"
            }, goog.i18n.bidi.enforceLtrInText = function(e) {
                return goog.i18n.bidi.Format.LRE + e + goog.i18n.bidi.Format.PDF
            }, goog.i18n.bidi.dimensionsRe_ = /:\s*([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)/g, goog.i18n.bidi.leftRe_ = /left/gi, goog.i18n.bidi.rightRe_ = /right/gi, goog.i18n.bidi.tempRe_ = /%%%%/g, goog.i18n.bidi.mirrorCSS = function(e) {
                return e.replace(goog.i18n.bidi.dimensionsRe_, ":$1 $4 $3 $2").replace(goog.i18n.bidi.leftRe_, "%%%%").replace(goog.i18n.bidi.rightRe_, goog.i18n.bidi.LEFT).replace(goog.i18n.bidi.tempRe_, goog.i18n.bidi.RIGHT)
            }, goog.i18n.bidi.doubleQuoteSubstituteRe_ = /([\u0591-\u05f2])"/g, goog.i18n.bidi.singleQuoteSubstituteRe_ = /([\u0591-\u05f2])'/g, goog.i18n.bidi.normalizeHebrewQuote = function(e) {
                return e.replace(goog.i18n.bidi.doubleQuoteSubstituteRe_, "$1״").replace(goog.i18n.bidi.singleQuoteSubstituteRe_, "$1׳")
            }, goog.i18n.bidi.wordSeparatorRe_ = /\s+/, goog.i18n.bidi.hasNumeralsRe_ = /[\d\u06f0-\u06f9]/, goog.i18n.bidi.rtlDetectionThreshold_ = .4, goog.i18n.bidi.estimateDirection = function(e, t) {
                var o = 0,
                    r = 0,
                    s = !1;
                for (e = goog.i18n.bidi.stripHtmlIfNeeded_(e, t).split(goog.i18n.bidi.wordSeparatorRe_), t = 0; t < e.length; t++) {
                    var n = e[t];
                    goog.i18n.bidi.startsWithRtl(n) ? (o++, r++) : goog.i18n.bidi.isRequiredLtrRe_.test(n) ? s = !0 : goog.i18n.bidi.hasAnyLtr(n) ? r++ : goog.i18n.bidi.hasNumeralsRe_.test(n) && (s = !0)
                }
                return 0 == r ? s ? goog.i18n.bidi.Dir.LTR : goog.i18n.bidi.Dir.NEUTRAL : o / r > goog.i18n.bidi.rtlDetectionThreshold_ ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR
            }, goog.i18n.bidi.detectRtlDirectionality = function(e, t) {
                return goog.i18n.bidi.estimateDirection(e, t) == goog.i18n.bidi.Dir.RTL
            }, goog.i18n.bidi.setElementDirAndAlign = function(e, t) {
                e && (t = goog.i18n.bidi.toDir(t)) && (e.style.textAlign = t == goog.i18n.bidi.Dir.RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT, e.dir = t == goog.i18n.bidi.Dir.RTL ? "rtl" : "ltr")
            }, goog.i18n.bidi.setElementDirByTextDirectionality = function(e, t) {
                switch (goog.i18n.bidi.estimateDirection(t)) {
                    case goog.i18n.bidi.Dir.LTR:
                        e.dir = "ltr";
                        break;
                    case goog.i18n.bidi.Dir.RTL:
                        e.dir = "rtl";
                        break;
                    default:
                        e.removeAttribute("dir")
                }
            }, goog.i18n.bidi.DirectionalString = function() {}, goog.html.TrustedResourceUrl = function() {
                this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = "", this.trustedURL_ = null, this.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_
            }, goog.html.TrustedResourceUrl.prototype.implementsGoogStringTypedString = !0, goog.html.TrustedResourceUrl.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_.toString()
            }, goog.html.TrustedResourceUrl.prototype.implementsGoogI18nBidiDirectionalString = !0, goog.html.TrustedResourceUrl.prototype.getDirection = function() {
                return goog.i18n.bidi.Dir.LTR
            }, goog.html.TrustedResourceUrl.prototype.cloneWithParams = function(e, t) {
                var o = goog.html.TrustedResourceUrl.unwrap(this),
                    r = (o = goog.html.TrustedResourceUrl.URL_PARAM_PARSER_.exec(o))[3] || "";
                return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(o[1] + goog.html.TrustedResourceUrl.stringifyParams_("?", o[2] || "", e) + goog.html.TrustedResourceUrl.stringifyParams_("#", r, t))
            }, goog.DEBUG && (goog.html.TrustedResourceUrl.prototype.toString = function() {
                return "TrustedResourceUrl{" + this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ + "}"
            }), goog.html.TrustedResourceUrl.unwrap = function(e) {
                return goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(e).toString()
            }, goog.html.TrustedResourceUrl.unwrapTrustedScriptURL = function(e) {
                return e instanceof goog.html.TrustedResourceUrl && e.constructor === goog.html.TrustedResourceUrl && e.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ : (goog.asserts.fail("expected object of type TrustedResourceUrl, got '" + e + "' of type " + goog.typeOf(e)), "type_error:TrustedResourceUrl")
            }, goog.html.TrustedResourceUrl.unwrapTrustedURL = function(e) {
                return e.trustedURL_ ? e.trustedURL_ : goog.html.TrustedResourceUrl.unwrap(e)
            }, goog.html.TrustedResourceUrl.format = function(e, t) {
                var o = goog.string.Const.unwrap(e);
                if (!goog.html.TrustedResourceUrl.BASE_URL_.test(o)) throw Error("Invalid TrustedResourceUrl format: " + o);
                return e = o.replace(goog.html.TrustedResourceUrl.FORMAT_MARKER_, function(e, r) {
                    if (!Object.prototype.hasOwnProperty.call(t, r)) throw Error('Found marker, "' + r + '", in format string, "' + o + '", but no valid label mapping found in args: ' + JSON.stringify(t));
                    return (e = t[r]) instanceof goog.string.Const ? goog.string.Const.unwrap(e) : encodeURIComponent(String(e))
                }), goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.TrustedResourceUrl.FORMAT_MARKER_ = /%{(\w+)}/g, goog.html.TrustedResourceUrl.BASE_URL_ = /^((https:)?\/\/[0-9a-z.:[\]-]+\/|\/[^/\\]|[^:/\\%]+\/|[^:/\\%]*[?#]|about:blank#)/i, goog.html.TrustedResourceUrl.URL_PARAM_PARSER_ = /^([^?#]*)(\?[^#]*)?(#[\s\S]*)?/, goog.html.TrustedResourceUrl.formatWithParams = function(e, t, o, r) {
                return goog.html.TrustedResourceUrl.format(e, t).cloneWithParams(o, r)
            }, goog.html.TrustedResourceUrl.fromConstant = function(e) {
                return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(e))
            }, goog.html.TrustedResourceUrl.fromConstants = function(e) {
                for (var t = "", o = 0; o < e.length; o++) t += goog.string.Const.unwrap(e[o]);
                return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse = function(e) {
                var t = new goog.html.TrustedResourceUrl;
                return t.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScriptURL(e) : e, goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY && (t.trustedURL_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(e)), t
            }, goog.html.TrustedResourceUrl.stringifyParams_ = function(e, t, o) {
                if (null == o) return t;
                if (goog.isString(o)) return o ? e + encodeURIComponent(o) : "";
                for (var r in o) {
                    var s = o[r];
                    s = goog.isArray(s) ? s : [s];
                    for (var n = 0; n < s.length; n++) {
                        var i = s[n];
                        null != i && (t || (t = e), t += (t.length > e.length ? "&" : "") + encodeURIComponent(r) + "=" + encodeURIComponent(String(i)))
                    }
                }
                return t
            }, goog.html.SafeUrl = function() {
                this.privateDoNotAccessOrElseSafeUrlWrappedValue_ = "", this.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_
            }, goog.html.SafeUrl.INNOCUOUS_STRING = "about:invalid#zClosurez", goog.html.SafeUrl.prototype.implementsGoogStringTypedString = !0, goog.html.SafeUrl.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseSafeUrlWrappedValue_.toString()
            }, goog.html.SafeUrl.prototype.implementsGoogI18nBidiDirectionalString = !0, goog.html.SafeUrl.prototype.getDirection = function() {
                return goog.i18n.bidi.Dir.LTR
            }, goog.DEBUG && (goog.html.SafeUrl.prototype.toString = function() {
                return "SafeUrl{" + this.privateDoNotAccessOrElseSafeUrlWrappedValue_ + "}"
            }), goog.html.SafeUrl.unwrap = function(e) {
                return goog.html.SafeUrl.unwrapTrustedURL(e).toString()
            }, goog.html.SafeUrl.unwrapTrustedURL = function(e) {
                return e instanceof goog.html.SafeUrl && e.constructor === goog.html.SafeUrl && e.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseSafeUrlWrappedValue_ : (goog.asserts.fail("expected object of type SafeUrl, got '" + e + "' of type " + goog.typeOf(e)), "type_error:SafeUrl")
            }, goog.html.SafeUrl.fromConstant = function(e) {
                return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(e))
            }, goog.html.SAFE_MIME_TYPE_PATTERN_ = /^(?:audio\/(?:3gpp2|3gpp|aac|L16|midi|mp3|mp4|mpeg|oga|ogg|opus|x-m4a|x-wav|wav|webm)|image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp|x-icon)|text\/csv|video\/(?:mpeg|mp4|ogg|webm|quicktime))(?:;\w+=(?:\w+|"[\w;=]+"))*$/i, goog.html.SafeUrl.isSafeMimeType = function(e) {
                return goog.html.SAFE_MIME_TYPE_PATTERN_.test(e)
            }, goog.html.SafeUrl.fromBlob = function(e) {
                return e = goog.html.SAFE_MIME_TYPE_PATTERN_.test(e.type) ? goog.fs.url.createObjectUrl(e) : goog.html.SafeUrl.INNOCUOUS_STRING, goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.DATA_URL_PATTERN_ = /^data:([^,]*);base64,[a-z0-9+\/]+=*$/i, goog.html.SafeUrl.fromDataUrl = function(e) {
                var t = (e = e.replace(/(%0A|%0D)/g, "")).match(goog.html.DATA_URL_PATTERN_);
                return t = t && goog.html.SAFE_MIME_TYPE_PATTERN_.test(t[1]), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(t ? e : goog.html.SafeUrl.INNOCUOUS_STRING)
            }, goog.html.SafeUrl.fromTelUrl = function(e) {
                return goog.string.internal.caseInsensitiveStartsWith(e, "tel:") || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SIP_URL_PATTERN_ = /^sip[s]?:[+a-z0-9_.!$%&'*\/=^`{|}~-]+@([a-z0-9-]+\.)+[a-z0-9]{2,63}$/i, goog.html.SafeUrl.fromSipUrl = function(e) {
                return goog.html.SIP_URL_PATTERN_.test(decodeURIComponent(e)) || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeUrl.fromFacebookMessengerUrl = function(e) {
                return goog.string.internal.caseInsensitiveStartsWith(e, "fb-messenger://share") || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeUrl.fromWhatsAppUrl = function(e) {
                return goog.string.internal.caseInsensitiveStartsWith(e, "whatsapp://send") || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeUrl.fromSmsUrl = function(e) {
                return goog.string.internal.caseInsensitiveStartsWith(e, "sms:") && goog.html.SafeUrl.isSmsUrlBodyValid_(e) || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeUrl.isSmsUrlBodyValid_ = function(e) {
                var t = e.indexOf("#");
                if (0 < t && (e = e.substring(0, t)), !(t = e.match(/[?&]body=/gi))) return !0;
                if (1 < t.length) return !1;
                if (!(e = e.match(/[?&]body=([^&]*)/)[1])) return !0;
                try {
                    decodeURIComponent(e)
                } catch (e) {
                    return !1
                }
                return /^(?:[a-z0-9\-_.~]|%[0-9a-f]{2})+$/i.test(e)
            }, goog.html.SafeUrl.fromSshUrl = function(e) {
                return goog.string.internal.caseInsensitiveStartsWith(e, "ssh://") || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeUrl.sanitizeChromeExtensionUrl = function(e, t) {
                return goog.html.SafeUrl.sanitizeExtensionUrl_(/^chrome-extension:\/\/([^\/]+)\//, e, t)
            }, goog.html.SafeUrl.sanitizeFirefoxExtensionUrl = function(e, t) {
                return goog.html.SafeUrl.sanitizeExtensionUrl_(/^moz-extension:\/\/([^\/]+)\//, e, t)
            }, goog.html.SafeUrl.sanitizeEdgeExtensionUrl = function(e, t) {
                return goog.html.SafeUrl.sanitizeExtensionUrl_(/^ms-browser-extension:\/\/([^\/]+)\//, e, t)
            }, goog.html.SafeUrl.sanitizeExtensionUrl_ = function(e, t, o) {
                return (e = e.exec(t)) ? (e = e[1], -1 == (o instanceof goog.string.Const ? [goog.string.Const.unwrap(o)] : o.map(function(e) {
                    return goog.string.Const.unwrap(e)
                })).indexOf(e) && (t = goog.html.SafeUrl.INNOCUOUS_STRING)) : t = goog.html.SafeUrl.INNOCUOUS_STRING, goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.SafeUrl.fromTrustedResourceUrl = function(e) {
                return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.html.TrustedResourceUrl.unwrap(e))
            }, goog.html.SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i, goog.html.SafeUrl.SAFE_URL_PATTERN = goog.html.SAFE_URL_PATTERN_, goog.html.SafeUrl.sanitize = function(e) {
                return e instanceof goog.html.SafeUrl ? e : (e = "object" == typeof e && e.implementsGoogStringTypedString ? e.getTypedStringValue() : String(e), goog.html.SAFE_URL_PATTERN_.test(e) || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e))
            }, goog.html.SafeUrl.sanitizeAssertUnchanged = function(e, t) {
                return e instanceof goog.html.SafeUrl ? e : (e = "object" == typeof e && e.implementsGoogStringTypedString ? e.getTypedStringValue() : String(e), t && /^data:/i.test(e) && (t = goog.html.SafeUrl.fromDataUrl(e)).getTypedStringValue() == e ? t : (goog.asserts.assert(goog.html.SAFE_URL_PATTERN_.test(e), "%s does not match the safe URL pattern", e) || (e = goog.html.SafeUrl.INNOCUOUS_STRING), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(e)))
            }, goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse = function(e) {
                var t = new goog.html.SafeUrl;
                return t.privateDoNotAccessOrElseSafeUrlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(e) : e, t
            }, goog.html.SafeUrl.ABOUT_BLANK = goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse("about:blank"), goog.html.SafeStyle = function() {
                this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = "", this.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_
            }, goog.html.SafeStyle.prototype.implementsGoogStringTypedString = !0, goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.SafeStyle.fromConstant = function(e) {
                return 0 === (e = goog.string.Const.unwrap(e)).length ? goog.html.SafeStyle.EMPTY : (goog.asserts.assert(goog.string.internal.endsWith(e, ";"), "Last character of style string is not ';': " + e), goog.asserts.assert(goog.string.internal.contains(e, ":"), "Style string must contain at least one ':', to specify a \"name: value\" pair: " + e), goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(e))
            }, goog.html.SafeStyle.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseSafeStyleWrappedValue_
            }, goog.DEBUG && (goog.html.SafeStyle.prototype.toString = function() {
                return "SafeStyle{" + this.privateDoNotAccessOrElseSafeStyleWrappedValue_ + "}"
            }), goog.html.SafeStyle.unwrap = function(e) {
                return e instanceof goog.html.SafeStyle && e.constructor === goog.html.SafeStyle && e.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseSafeStyleWrappedValue_ : (goog.asserts.fail("expected object of type SafeStyle, got '" + e + "' of type " + goog.typeOf(e)), "type_error:SafeStyle")
            }, goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse = function(e) {
                return (new goog.html.SafeStyle).initSecurityPrivateDoNotAccessOrElse_(e)
            }, goog.html.SafeStyle.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(e) {
                return this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = e, this
            }, goog.html.SafeStyle.EMPTY = goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(""), goog.html.SafeStyle.INNOCUOUS_STRING = "zClosurez", goog.html.SafeStyle.create = function(e) {
                var t, o = "";
                for (t in e) {
                    if (!/^[-_a-zA-Z0-9]+$/.test(t)) throw Error("Name allows only [-_a-zA-Z0-9], got: " + t);
                    var r = e[t];
                    null != r && (o += t + ":" + (r = goog.isArray(r) ? goog.array.map(r, goog.html.SafeStyle.sanitizePropertyValue_).join(" ") : goog.html.SafeStyle.sanitizePropertyValue_(r)) + ";")
                }
                return o ? goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(o) : goog.html.SafeStyle.EMPTY
            }, goog.html.SafeStyle.sanitizePropertyValue_ = function(e) {
                if (e instanceof goog.html.SafeUrl) return 'url("' + goog.html.SafeUrl.unwrap(e).replace(/</g, "%3c").replace(/[\\"]/g, "\\$&") + '")';
                if (e = e instanceof goog.string.Const ? goog.string.Const.unwrap(e) : goog.html.SafeStyle.sanitizePropertyValueString_(String(e)), /[{;}]/.test(e)) throw new goog.asserts.AssertionError("Value does not allow [{;}], got: %s.", [e]);
                return e
            }, goog.html.SafeStyle.sanitizePropertyValueString_ = function(e) {
                var t = e.replace(goog.html.SafeStyle.FUNCTIONS_RE_, "$1").replace(goog.html.SafeStyle.FUNCTIONS_RE_, "$1").replace(goog.html.SafeStyle.URL_RE_, "url");
                return goog.html.SafeStyle.VALUE_RE_.test(t) ? goog.html.SafeStyle.COMMENT_RE_.test(e) ? (goog.asserts.fail("String value disallows comments, got: " + e), goog.html.SafeStyle.INNOCUOUS_STRING) : goog.html.SafeStyle.hasBalancedQuotes_(e) ? goog.html.SafeStyle.hasBalancedSquareBrackets_(e) ? goog.html.SafeStyle.sanitizeUrl_(e) : (goog.asserts.fail("String value requires balanced square brackets and one identifier per pair of brackets, got: " + e), goog.html.SafeStyle.INNOCUOUS_STRING) : (goog.asserts.fail("String value requires balanced quotes, got: " + e), goog.html.SafeStyle.INNOCUOUS_STRING) : (goog.asserts.fail("String value allows only " + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + " and simple functions, got: " + e), goog.html.SafeStyle.INNOCUOUS_STRING)
            }, goog.html.SafeStyle.hasBalancedQuotes_ = function(e) {
                for (var t = !0, o = !0, r = 0; r < e.length; r++) {
                    var s = e.charAt(r);
                    "'" == s && o ? t = !t : '"' == s && t && (o = !o)
                }
                return t && o
            }, goog.html.SafeStyle.hasBalancedSquareBrackets_ = function(e) {
                for (var t = !0, o = /^[-_a-zA-Z0-9]$/, r = 0; r < e.length; r++) {
                    var s = e.charAt(r);
                    if ("]" == s) {
                        if (t) return !1;
                        t = !0
                    } else if ("[" == s) {
                        if (!t) return !1;
                        t = !1
                    } else if (!t && !o.test(s)) return !1
                }
                return t
            }, goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ = "[-,.\"'%_!# a-zA-Z0-9\\[\\]]", goog.html.SafeStyle.VALUE_RE_ = new RegExp("^" + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + "+$"), goog.html.SafeStyle.URL_RE_ = /\b(url\([ \t\n]*)('[ -&(-\[\]-~]*'|"[ !#-\[\]-~]*"|[!#-&*-\[\]-~]*)([ \t\n]*\))/g, goog.html.SafeStyle.FUNCTIONS_RE_ = /\b(hsl|hsla|rgb|rgba|matrix|calc|minmax|fit-content|repeat|(rotate|scale|translate)(X|Y|Z|3d)?)\([-+*/0-9a-z.%\[\], ]+\)/g, goog.html.SafeStyle.COMMENT_RE_ = /\/\*/, goog.html.SafeStyle.sanitizeUrl_ = function(e) {
                return e.replace(goog.html.SafeStyle.URL_RE_, function(e, t, o, r) {
                    var s = "";
                    return o = o.replace(/^(['"])(.*)\1$/, function(e, t, o) {
                        return s = t, o
                    }), e = goog.html.SafeUrl.sanitize(o).getTypedStringValue(), t + s + e + s + r
                })
            }, goog.html.SafeStyle.concat = function(e) {
                var t = "",
                    o = function(e) {
                        goog.isArray(e) ? goog.array.forEach(e, o) : t += goog.html.SafeStyle.unwrap(e)
                    };
                return goog.array.forEach(arguments, o), t ? goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(t) : goog.html.SafeStyle.EMPTY
            }, goog.html.SafeScript = function() {
                this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = "", this.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_
            }, goog.html.SafeScript.prototype.implementsGoogStringTypedString = !0, goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.SafeScript.fromConstant = function(e) {
                return 0 === (e = goog.string.Const.unwrap(e)).length ? goog.html.SafeScript.EMPTY : goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeScript.fromConstantAndArgs = function(e, t) {
                for (var o = [], r = 1; r < arguments.length; r++) o.push(goog.html.SafeScript.stringify_(arguments[r]));
                return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("(" + goog.string.Const.unwrap(e) + ")(" + o.join(", ") + ");")
            }, goog.html.SafeScript.fromJson = function(e) {
                return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(goog.html.SafeScript.stringify_(e))
            }, goog.html.SafeScript.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseSafeScriptWrappedValue_.toString()
            }, goog.DEBUG && (goog.html.SafeScript.prototype.toString = function() {
                return "SafeScript{" + this.privateDoNotAccessOrElseSafeScriptWrappedValue_ + "}"
            }), goog.html.SafeScript.unwrap = function(e) {
                return goog.html.SafeScript.unwrapTrustedScript(e).toString()
            }, goog.html.SafeScript.unwrapTrustedScript = function(e) {
                return e instanceof goog.html.SafeScript && e.constructor === goog.html.SafeScript && e.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseSafeScriptWrappedValue_ : (goog.asserts.fail("expected object of type SafeScript, got '" + e + "' of type " + goog.typeOf(e)), "type_error:SafeScript")
            }, goog.html.SafeScript.stringify_ = function(e) {
                return JSON.stringify(e).replace(/</g, "\\x3c")
            }, goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse = function(e) {
                return (new goog.html.SafeScript).initSecurityPrivateDoNotAccessOrElse_(e)
            }, goog.html.SafeScript.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(e) {
                return this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScript(e) : e, this
            }, goog.html.SafeScript.EMPTY = goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(""), goog.object = {}, goog.object.is = function(e, t) {
                return e === t ? 0 !== e || 1 / e == 1 / t : e != e && t != t
            }, goog.object.forEach = function(e, t, o) {
                for (var r in e) t.call(o, e[r], r, e)
            }, goog.object.filter = function(e, t, o) {
                var r, s = {};
                for (r in e) t.call(o, e[r], r, e) && (s[r] = e[r]);
                return s
            }, goog.object.map = function(e, t, o) {
                var r, s = {};
                for (r in e) s[r] = t.call(o, e[r], r, e);
                return s
            }, goog.object.some = function(e, t, o) {
                for (var r in e)
                    if (t.call(o, e[r], r, e)) return !0;
                return !1
            }, goog.object.every = function(e, t, o) {
                for (var r in e)
                    if (!t.call(o, e[r], r, e)) return !1;
                return !0
            }, goog.object.getCount = function(e) {
                var t, o = 0;
                for (t in e) o++;
                return o
            }, goog.object.getAnyKey = function(e) {
                for (var t in e) return t
            }, goog.object.getAnyValue = function(e) {
                for (var t in e) return e[t]
            }, goog.object.contains = function(e, t) {
                return goog.object.containsValue(e, t)
            }, goog.object.getValues = function(e) {
                var t, o = [],
                    r = 0;
                for (t in e) o[r++] = e[t];
                return o
            }, goog.object.getKeys = function(e) {
                var t, o = [],
                    r = 0;
                for (t in e) o[r++] = t;
                return o
            }, goog.object.getValueByKeys = function(e, t) {
                var o = goog.isArrayLike(t),
                    r = o ? t : arguments;
                for (o = o ? 0 : 1; o < r.length; o++) {
                    if (null == e) return;
                    e = e[r[o]]
                }
                return e
            }, goog.object.containsKey = function(e, t) {
                return null !== e && t in e
            }, goog.object.containsValue = function(e, t) {
                for (var o in e)
                    if (e[o] == t) return !0;
                return !1
            }, goog.object.findKey = function(e, t, o) {
                for (var r in e)
                    if (t.call(o, e[r], r, e)) return r
            }, goog.object.findValue = function(e, t, o) {
                return (t = goog.object.findKey(e, t, o)) && e[t]
            }, goog.object.isEmpty = function(e) {
                for (var t in e) return !1;
                return !0
            }, goog.object.clear = function(e) {
                for (var t in e) delete e[t]
            }, goog.object.remove = function(e, t) {
                var o;
                return (o = t in e) && delete e[t], o
            }, goog.object.add = function(e, t, o) {
                if (null !== e && t in e) throw Error('The object already contains the key "' + t + '"');
                goog.object.set(e, t, o)
            }, goog.object.get = function(e, t, o) {
                return null !== e && t in e ? e[t] : o
            }, goog.object.set = function(e, t, o) {
                e[t] = o
            }, goog.object.setIfUndefined = function(e, t, o) {
                return t in e ? e[t] : e[t] = o
            }, goog.object.setWithReturnValueIfNotSet = function(e, t, o) {
                return t in e ? e[t] : (o = o(), e[t] = o)
            }, goog.object.equals = function(e, t) {
                for (var o in e)
                    if (!(o in t) || e[o] !== t[o]) return !1;
                for (var r in t)
                    if (!(r in e)) return !1;
                return !0
            }, goog.object.clone = function(e) {
                var t, o = {};
                for (t in e) o[t] = e[t];
                return o
            }, goog.object.unsafeClone = function(e) {
                var t = goog.typeOf(e);
                if ("object" == t || "array" == t) {
                    if (goog.isFunction(e.clone)) return e.clone();
                    for (var o in t = "array" == t ? [] : {}, e) t[o] = goog.object.unsafeClone(e[o]);
                    return t
                }
                return e
            }, goog.object.transpose = function(e) {
                var t, o = {};
                for (t in e) o[e[t]] = t;
                return o
            }, goog.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "), goog.object.extend = function(e, t) {
                for (var o, r, s = 1; s < arguments.length; s++) {
                    for (o in r = arguments[s]) e[o] = r[o];
                    for (var n = 0; n < goog.object.PROTOTYPE_FIELDS_.length; n++) o = goog.object.PROTOTYPE_FIELDS_[n], Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o])
                }
            }, goog.object.create = function(e) {
                var t = arguments.length;
                if (1 == t && goog.isArray(arguments[0])) return goog.object.create.apply(null, arguments[0]);
                if (t % 2) throw Error("Uneven number of arguments");
                for (var o = {}, r = 0; r < t; r += 2) o[arguments[r]] = arguments[r + 1];
                return o
            }, goog.object.createSet = function(e) {
                var t = arguments.length;
                if (1 == t && goog.isArray(arguments[0])) return goog.object.createSet.apply(null, arguments[0]);
                for (var o = {}, r = 0; r < t; r++) o[arguments[r]] = !0;
                return o
            }, goog.object.createImmutableView = function(e) {
                var t = e;
                return Object.isFrozen && !Object.isFrozen(e) && (t = Object.create(e), Object.freeze(t)), t
            }, goog.object.isImmutableView = function(e) {
                return !!Object.isFrozen && Object.isFrozen(e)
            }, goog.object.getAllPropertyNames = function(e, t, o) {
                if (!e) return [];
                if (!Object.getOwnPropertyNames || !Object.getPrototypeOf) return goog.object.getKeys(e);
                for (var r = {}; e && (e !== Object.prototype || t) && (e !== Function.prototype || o);) {
                    for (var s = Object.getOwnPropertyNames(e), n = 0; n < s.length; n++) r[s[n]] = !0;
                    e = Object.getPrototypeOf(e)
                }
                return goog.object.getKeys(r)
            }, goog.object.getSuperClass = function(e) {
                return (e = Object.getPrototypeOf(e.prototype)) && e.constructor
            }, goog.html.SafeStyleSheet = function() {
                this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = "", this.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_
            }, goog.html.SafeStyleSheet.prototype.implementsGoogStringTypedString = !0, goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.SafeStyleSheet.createRule = function(e, t) {
                if (goog.string.internal.contains(e, "<")) throw Error("Selector does not allow '<', got: " + e);
                var o = e.replace(/('|")((?!\1)[^\r\n\f\\]|\\[\s\S])*\1/g, "");
                if (!/^[-_a-zA-Z0-9#.:* ,>+~[\]()=^$|]+$/.test(o)) throw Error("Selector allows only [-_a-zA-Z0-9#.:* ,>+~[\\]()=^$|] and strings, got: " + e);
                if (!goog.html.SafeStyleSheet.hasBalancedBrackets_(o)) throw Error("() and [] in selector must be balanced, got: " + e);
                return t instanceof goog.html.SafeStyle || (t = goog.html.SafeStyle.create(t)), e = e + "{" + goog.html.SafeStyle.unwrap(t).replace(/</g, "\\3C ") + "}", goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(e)
            }, goog.html.SafeStyleSheet.hasBalancedBrackets_ = function(e) {
                for (var t = {
                        "(": ")",
                        "[": "]"
                    }, o = [], r = 0; r < e.length; r++) {
                    var s = e[r];
                    if (t[s]) o.push(t[s]);
                    else if (goog.object.contains(t, s) && o.pop() != s) return !1
                }
                return 0 == o.length
            }, goog.html.SafeStyleSheet.concat = function(e) {
                var t = "",
                    o = function(e) {
                        goog.isArray(e) ? goog.array.forEach(e, o) : t += goog.html.SafeStyleSheet.unwrap(e)
                    };
                return goog.array.forEach(arguments, o), goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.SafeStyleSheet.fromConstant = function(e) {
                return 0 === (e = goog.string.Const.unwrap(e)).length ? goog.html.SafeStyleSheet.EMPTY : (goog.asserts.assert(!goog.string.internal.contains(e, "<"), "Forbidden '<' character in style sheet string: " + e), goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(e))
            }, goog.html.SafeStyleSheet.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_
            }, goog.DEBUG && (goog.html.SafeStyleSheet.prototype.toString = function() {
                return "SafeStyleSheet{" + this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ + "}"
            }), goog.html.SafeStyleSheet.unwrap = function(e) {
                return e instanceof goog.html.SafeStyleSheet && e.constructor === goog.html.SafeStyleSheet && e.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ : (goog.asserts.fail("expected object of type SafeStyleSheet, got '" + e + "' of type " + goog.typeOf(e)), "type_error:SafeStyleSheet")
            }, goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse = function(e) {
                return (new goog.html.SafeStyleSheet).initSecurityPrivateDoNotAccessOrElse_(e)
            }, goog.html.SafeStyleSheet.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(e) {
                return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = e, this
            }, goog.html.SafeStyleSheet.EMPTY = goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(""), goog.dom.tags = {}, goog.dom.tags.VOID_TAGS_ = {
                area: !0,
                base: !0,
                br: !0,
                col: !0,
                command: !0,
                embed: !0,
                hr: !0,
                img: !0,
                input: !0,
                keygen: !0,
                link: !0,
                meta: !0,
                param: !0,
                source: !0,
                track: !0,
                wbr: !0
            }, goog.dom.tags.isVoidTag = function(e) {
                return !0 === goog.dom.tags.VOID_TAGS_[e]
            }, goog.dom.HtmlElement = function() {}, goog.dom.TagName = function(e) {
                this.tagName_ = e
            }, goog.dom.TagName.prototype.toString = function() {
                return this.tagName_
            }, goog.dom.TagName.A = new goog.dom.TagName("A"), goog.dom.TagName.ABBR = new goog.dom.TagName("ABBR"), goog.dom.TagName.ACRONYM = new goog.dom.TagName("ACRONYM"), goog.dom.TagName.ADDRESS = new goog.dom.TagName("ADDRESS"), goog.dom.TagName.APPLET = new goog.dom.TagName("APPLET"), goog.dom.TagName.AREA = new goog.dom.TagName("AREA"), goog.dom.TagName.ARTICLE = new goog.dom.TagName("ARTICLE"), goog.dom.TagName.ASIDE = new goog.dom.TagName("ASIDE"), goog.dom.TagName.AUDIO = new goog.dom.TagName("AUDIO"), goog.dom.TagName.B = new goog.dom.TagName("B"), goog.dom.TagName.BASE = new goog.dom.TagName("BASE"), goog.dom.TagName.BASEFONT = new goog.dom.TagName("BASEFONT"), goog.dom.TagName.BDI = new goog.dom.TagName("BDI"), goog.dom.TagName.BDO = new goog.dom.TagName("BDO"), goog.dom.TagName.BIG = new goog.dom.TagName("BIG"), goog.dom.TagName.BLOCKQUOTE = new goog.dom.TagName("BLOCKQUOTE"), goog.dom.TagName.BODY = new goog.dom.TagName("BODY"), goog.dom.TagName.BR = new goog.dom.TagName("BR"), goog.dom.TagName.BUTTON = new goog.dom.TagName("BUTTON"), goog.dom.TagName.CANVAS = new goog.dom.TagName("CANVAS"), goog.dom.TagName.CAPTION = new goog.dom.TagName("CAPTION"), goog.dom.TagName.CENTER = new goog.dom.TagName("CENTER"), goog.dom.TagName.CITE = new goog.dom.TagName("CITE"), goog.dom.TagName.CODE = new goog.dom.TagName("CODE"), goog.dom.TagName.COL = new goog.dom.TagName("COL"), goog.dom.TagName.COLGROUP = new goog.dom.TagName("COLGROUP"), goog.dom.TagName.COMMAND = new goog.dom.TagName("COMMAND"), goog.dom.TagName.DATA = new goog.dom.TagName("DATA"), goog.dom.TagName.DATALIST = new goog.dom.TagName("DATALIST"), goog.dom.TagName.DD = new goog.dom.TagName("DD"), goog.dom.TagName.DEL = new goog.dom.TagName("DEL"), goog.dom.TagName.DETAILS = new goog.dom.TagName("DETAILS"), goog.dom.TagName.DFN = new goog.dom.TagName("DFN"), goog.dom.TagName.DIALOG = new goog.dom.TagName("DIALOG"), goog.dom.TagName.DIR = new goog.dom.TagName("DIR"), goog.dom.TagName.DIV = new goog.dom.TagName("DIV"), goog.dom.TagName.DL = new goog.dom.TagName("DL"), goog.dom.TagName.DT = new goog.dom.TagName("DT"), goog.dom.TagName.EM = new goog.dom.TagName("EM"), goog.dom.TagName.EMBED = new goog.dom.TagName("EMBED"), goog.dom.TagName.FIELDSET = new goog.dom.TagName("FIELDSET"), goog.dom.TagName.FIGCAPTION = new goog.dom.TagName("FIGCAPTION"), goog.dom.TagName.FIGURE = new goog.dom.TagName("FIGURE"), goog.dom.TagName.FONT = new goog.dom.TagName("FONT"), goog.dom.TagName.FOOTER = new goog.dom.TagName("FOOTER"), goog.dom.TagName.FORM = new goog.dom.TagName("FORM"), goog.dom.TagName.FRAME = new goog.dom.TagName("FRAME"), goog.dom.TagName.FRAMESET = new goog.dom.TagName("FRAMESET"), goog.dom.TagName.H1 = new goog.dom.TagName("H1"), goog.dom.TagName.H2 = new goog.dom.TagName("H2"), goog.dom.TagName.H3 = new goog.dom.TagName("H3"), goog.dom.TagName.H4 = new goog.dom.TagName("H4"), goog.dom.TagName.H5 = new goog.dom.TagName("H5"), goog.dom.TagName.H6 = new goog.dom.TagName("H6"), goog.dom.TagName.HEAD = new goog.dom.TagName("HEAD"), goog.dom.TagName.HEADER = new goog.dom.TagName("HEADER"), goog.dom.TagName.HGROUP = new goog.dom.TagName("HGROUP"), goog.dom.TagName.HR = new goog.dom.TagName("HR"), goog.dom.TagName.HTML = new goog.dom.TagName("HTML"), goog.dom.TagName.I = new goog.dom.TagName("I"), goog.dom.TagName.IFRAME = new goog.dom.TagName("IFRAME"), goog.dom.TagName.IMG = new goog.dom.TagName("IMG"), goog.dom.TagName.INPUT = new goog.dom.TagName("INPUT"), goog.dom.TagName.INS = new goog.dom.TagName("INS"), goog.dom.TagName.ISINDEX = new goog.dom.TagName("ISINDEX"), goog.dom.TagName.KBD = new goog.dom.TagName("KBD"), goog.dom.TagName.KEYGEN = new goog.dom.TagName("KEYGEN"), goog.dom.TagName.LABEL = new goog.dom.TagName("LABEL"), goog.dom.TagName.LEGEND = new goog.dom.TagName("LEGEND"), goog.dom.TagName.LI = new goog.dom.TagName("LI"), goog.dom.TagName.LINK = new goog.dom.TagName("LINK"), goog.dom.TagName.MAIN = new goog.dom.TagName("MAIN"), goog.dom.TagName.MAP = new goog.dom.TagName("MAP"), goog.dom.TagName.MARK = new goog.dom.TagName("MARK"), goog.dom.TagName.MATH = new goog.dom.TagName("MATH"), goog.dom.TagName.MENU = new goog.dom.TagName("MENU"), goog.dom.TagName.MENUITEM = new goog.dom.TagName("MENUITEM"), goog.dom.TagName.META = new goog.dom.TagName("META"), goog.dom.TagName.METER = new goog.dom.TagName("METER"), goog.dom.TagName.NAV = new goog.dom.TagName("NAV"), goog.dom.TagName.NOFRAMES = new goog.dom.TagName("NOFRAMES"), goog.dom.TagName.NOSCRIPT = new goog.dom.TagName("NOSCRIPT"), goog.dom.TagName.OBJECT = new goog.dom.TagName("OBJECT"), goog.dom.TagName.OL = new goog.dom.TagName("OL"), goog.dom.TagName.OPTGROUP = new goog.dom.TagName("OPTGROUP"), goog.dom.TagName.OPTION = new goog.dom.TagName("OPTION"), goog.dom.TagName.OUTPUT = new goog.dom.TagName("OUTPUT"), goog.dom.TagName.P = new goog.dom.TagName("P"), goog.dom.TagName.PARAM = new goog.dom.TagName("PARAM"), goog.dom.TagName.PICTURE = new goog.dom.TagName("PICTURE"), goog.dom.TagName.PRE = new goog.dom.TagName("PRE"), goog.dom.TagName.PROGRESS = new goog.dom.TagName("PROGRESS"), goog.dom.TagName.Q = new goog.dom.TagName("Q"), goog.dom.TagName.RP = new goog.dom.TagName("RP"), goog.dom.TagName.RT = new goog.dom.TagName("RT"), goog.dom.TagName.RTC = new goog.dom.TagName("RTC"), goog.dom.TagName.RUBY = new goog.dom.TagName("RUBY"), goog.dom.TagName.S = new goog.dom.TagName("S"), goog.dom.TagName.SAMP = new goog.dom.TagName("SAMP"), goog.dom.TagName.SCRIPT = new goog.dom.TagName("SCRIPT"), goog.dom.TagName.SECTION = new goog.dom.TagName("SECTION"), goog.dom.TagName.SELECT = new goog.dom.TagName("SELECT"), goog.dom.TagName.SMALL = new goog.dom.TagName("SMALL"), goog.dom.TagName.SOURCE = new goog.dom.TagName("SOURCE"), goog.dom.TagName.SPAN = new goog.dom.TagName("SPAN"), goog.dom.TagName.STRIKE = new goog.dom.TagName("STRIKE"), goog.dom.TagName.STRONG = new goog.dom.TagName("STRONG"), goog.dom.TagName.STYLE = new goog.dom.TagName("STYLE"), goog.dom.TagName.SUB = new goog.dom.TagName("SUB"), goog.dom.TagName.SUMMARY = new goog.dom.TagName("SUMMARY"), goog.dom.TagName.SUP = new goog.dom.TagName("SUP"), goog.dom.TagName.SVG = new goog.dom.TagName("SVG"), goog.dom.TagName.TABLE = new goog.dom.TagName("TABLE"), goog.dom.TagName.TBODY = new goog.dom.TagName("TBODY"), goog.dom.TagName.TD = new goog.dom.TagName("TD"), goog.dom.TagName.TEMPLATE = new goog.dom.TagName("TEMPLATE"), goog.dom.TagName.TEXTAREA = new goog.dom.TagName("TEXTAREA"), goog.dom.TagName.TFOOT = new goog.dom.TagName("TFOOT"), goog.dom.TagName.TH = new goog.dom.TagName("TH"), goog.dom.TagName.THEAD = new goog.dom.TagName("THEAD"), goog.dom.TagName.TIME = new goog.dom.TagName("TIME"), goog.dom.TagName.TITLE = new goog.dom.TagName("TITLE"), goog.dom.TagName.TR = new goog.dom.TagName("TR"), goog.dom.TagName.TRACK = new goog.dom.TagName("TRACK"), goog.dom.TagName.TT = new goog.dom.TagName("TT"), goog.dom.TagName.U = new goog.dom.TagName("U"), goog.dom.TagName.UL = new goog.dom.TagName("UL"), goog.dom.TagName.VAR = new goog.dom.TagName("VAR"), goog.dom.TagName.VIDEO = new goog.dom.TagName("VIDEO"), goog.dom.TagName.WBR = new goog.dom.TagName("WBR"), goog.labs = {}, goog.labs.userAgent = {}, goog.labs.userAgent.util = {}, goog.labs.userAgent.util.getNativeUserAgentString_ = function() {
                var e = goog.labs.userAgent.util.getNavigator_();
                return e && (e = e.userAgent) ? e : ""
            }, goog.labs.userAgent.util.getNavigator_ = function() {
                return goog.global.navigator
            }, goog.labs.userAgent.util.userAgent_ = goog.labs.userAgent.util.getNativeUserAgentString_(), goog.labs.userAgent.util.setUserAgent = function(e) {
                goog.labs.userAgent.util.userAgent_ = e || goog.labs.userAgent.util.getNativeUserAgentString_()
            }, goog.labs.userAgent.util.getUserAgent = function() {
                return goog.labs.userAgent.util.userAgent_
            }, goog.labs.userAgent.util.matchUserAgent = function(e) {
                var t = goog.labs.userAgent.util.getUserAgent();
                return goog.string.internal.contains(t, e)
            }, goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(e) {
                var t = goog.labs.userAgent.util.getUserAgent();
                return goog.string.internal.caseInsensitiveContains(t, e)
            }, goog.labs.userAgent.util.extractVersionTuples = function(e) {
                for (var t, o = /(\w[\w ]+)\/([^\s]+)\s*(?:\((.*?)\))?/g, r = []; t = o.exec(e);) r.push([t[1], t[2], t[3] || void 0]);
                return r
            }, goog.labs.userAgent.browser = {}, goog.labs.userAgent.browser.matchOpera_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Opera")
            }, goog.labs.userAgent.browser.matchIE_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE")
            }, goog.labs.userAgent.browser.matchEdgeHtml_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Edge")
            }, goog.labs.userAgent.browser.matchEdgeChromium_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Edg/")
            }, goog.labs.userAgent.browser.matchOperaChromium_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("OPR")
            }, goog.labs.userAgent.browser.matchFirefox_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Firefox") || goog.labs.userAgent.util.matchUserAgent("FxiOS")
            }, goog.labs.userAgent.browser.matchSafari_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Safari") && !(goog.labs.userAgent.browser.matchChrome_() || goog.labs.userAgent.browser.matchCoast_() || goog.labs.userAgent.browser.matchOpera_() || goog.labs.userAgent.browser.matchEdgeHtml_() || goog.labs.userAgent.browser.matchEdgeChromium_() || goog.labs.userAgent.browser.matchOperaChromium_() || goog.labs.userAgent.browser.matchFirefox_() || goog.labs.userAgent.browser.isSilk() || goog.labs.userAgent.util.matchUserAgent("Android"))
            }, goog.labs.userAgent.browser.matchCoast_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Coast")
            }, goog.labs.userAgent.browser.matchIosWebview_ = function() {
                return (goog.labs.userAgent.util.matchUserAgent("iPad") || goog.labs.userAgent.util.matchUserAgent("iPhone")) && !goog.labs.userAgent.browser.matchSafari_() && !goog.labs.userAgent.browser.matchChrome_() && !goog.labs.userAgent.browser.matchCoast_() && !goog.labs.userAgent.browser.matchFirefox_() && goog.labs.userAgent.util.matchUserAgent("AppleWebKit")
            }, goog.labs.userAgent.browser.matchChrome_ = function() {
                return (goog.labs.userAgent.util.matchUserAgent("Chrome") || goog.labs.userAgent.util.matchUserAgent("CriOS")) && !goog.labs.userAgent.browser.matchEdgeHtml_()
            }, goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
                return goog.labs.userAgent.util.matchUserAgent("Android") && !(goog.labs.userAgent.browser.isChrome() || goog.labs.userAgent.browser.isFirefox() || goog.labs.userAgent.browser.isOpera() || goog.labs.userAgent.browser.isSilk())
            }, goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_, goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_, goog.labs.userAgent.browser.isEdge = goog.labs.userAgent.browser.matchEdgeHtml_, goog.labs.userAgent.browser.isEdgeChromium = goog.labs.userAgent.browser.matchEdgeChromium_, goog.labs.userAgent.browser.isOperaChromium = goog.labs.userAgent.browser.matchOperaChromium_, goog.labs.userAgent.browser.isFirefox = goog.labs.userAgent.browser.matchFirefox_, goog.labs.userAgent.browser.isSafari = goog.labs.userAgent.browser.matchSafari_, goog.labs.userAgent.browser.isCoast = goog.labs.userAgent.browser.matchCoast_, goog.labs.userAgent.browser.isIosWebview = goog.labs.userAgent.browser.matchIosWebview_, goog.labs.userAgent.browser.isChrome = goog.labs.userAgent.browser.matchChrome_, goog.labs.userAgent.browser.isAndroidBrowser = goog.labs.userAgent.browser.matchAndroidBrowser_, goog.labs.userAgent.browser.isSilk = function() {
                return goog.labs.userAgent.util.matchUserAgent("Silk")
            }, goog.labs.userAgent.browser.getVersion = function() {
                function e(e) {
                    return e = goog.array.find(e, r), o[e] || ""
                }
                var t = goog.labs.userAgent.util.getUserAgent();
                if (goog.labs.userAgent.browser.isIE()) return goog.labs.userAgent.browser.getIEVersion_(t);
                t = goog.labs.userAgent.util.extractVersionTuples(t);
                var o = {};
                goog.array.forEach(t, function(e) {
                    o[e[0]] = e[1]
                });
                var r = goog.partial(goog.object.containsKey, o);
                return goog.labs.userAgent.browser.isOpera() ? e(["Version", "Opera"]) : goog.labs.userAgent.browser.isEdge() ? e(["Edge"]) : goog.labs.userAgent.browser.isEdgeChromium() ? e(["Edg"]) : goog.labs.userAgent.browser.isChrome() ? e(["Chrome", "CriOS"]) : (t = t[2]) && t[1] || ""
            }, goog.labs.userAgent.browser.isVersionOrHigher = function(e) {
                return 0 <= goog.string.internal.compareVersions(goog.labs.userAgent.browser.getVersion(), e)
            }, goog.labs.userAgent.browser.getIEVersion_ = function(e) {
                var t = /rv: *([\d\.]*)/.exec(e);
                if (t && t[1]) return t[1];
                t = "";
                var o = /MSIE +([\d\.]+)/.exec(e);
                if (o && o[1])
                    if (e = /Trident\/(\d.\d)/.exec(e), "7.0" == o[1])
                        if (e && e[1]) switch (e[1]) {
                            case "4.0":
                                t = "8.0";
                                break;
                            case "5.0":
                                t = "9.0";
                                break;
                            case "6.0":
                                t = "10.0";
                                break;
                            case "7.0":
                                t = "11.0"
                        } else t = "7.0";
                        else t = o[1];
                return t
            }, goog.html.SafeHtml = function() {
                this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = "", this.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_, this.dir_ = null
            }, goog.html.SafeHtml.prototype.implementsGoogI18nBidiDirectionalString = !0, goog.html.SafeHtml.prototype.getDirection = function() {
                return this.dir_
            }, goog.html.SafeHtml.prototype.implementsGoogStringTypedString = !0, goog.html.SafeHtml.prototype.getTypedStringValue = function() {
                return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_.toString()
            }, goog.DEBUG && (goog.html.SafeHtml.prototype.toString = function() {
                return "SafeHtml{" + this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ + "}"
            }), goog.html.SafeHtml.unwrap = function(e) {
                return goog.html.SafeHtml.unwrapTrustedHTML(e).toString()
            }, goog.html.SafeHtml.unwrapTrustedHTML = function(e) {
                return e instanceof goog.html.SafeHtml && e.constructor === goog.html.SafeHtml && e.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ ? e.privateDoNotAccessOrElseSafeHtmlWrappedValue_ : (goog.asserts.fail("expected object of type SafeHtml, got '" + e + "' of type " + goog.typeOf(e)), "type_error:SafeHtml")
            }, goog.html.SafeHtml.htmlEscape = function(e) {
                if (e instanceof goog.html.SafeHtml) return e;
                var t = "object" == typeof e,
                    o = null;
                return t && e.implementsGoogI18nBidiDirectionalString && (o = e.getDirection()), e = t && e.implementsGoogStringTypedString ? e.getTypedStringValue() : String(e), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.htmlEscape(e), o)
            }, goog.html.SafeHtml.htmlEscapePreservingNewlines = function(e) {
                return e instanceof goog.html.SafeHtml ? e : (e = goog.html.SafeHtml.htmlEscape(e), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.newLineToBr(goog.html.SafeHtml.unwrap(e)), e.getDirection()))
            }, goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces = function(e) {
                return e instanceof goog.html.SafeHtml ? e : (e = goog.html.SafeHtml.htmlEscape(e), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.whitespaceEscape(goog.html.SafeHtml.unwrap(e)), e.getDirection()))
            }, goog.html.SafeHtml.from = goog.html.SafeHtml.htmlEscape, goog.html.SafeHtml.VALID_NAMES_IN_TAG_ = /^[a-zA-Z0-9-]+$/, goog.html.SafeHtml.URL_ATTRIBUTES_ = {
                action: !0,
                cite: !0,
                data: !0,
                formaction: !0,
                href: !0,
                manifest: !0,
                poster: !0,
                src: !0
            }, goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_ = {
                APPLET: !0,
                BASE: !0,
                EMBED: !0,
                IFRAME: !0,
                LINK: !0,
                MATH: !0,
                META: !0,
                OBJECT: !0,
                SCRIPT: !0,
                STYLE: !0,
                SVG: !0,
                TEMPLATE: !0
            }, goog.html.SafeHtml.create = function(e, t, o) {
                return goog.html.SafeHtml.verifyTagName(String(e)), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(String(e), t, o)
            }, goog.html.SafeHtml.verifyTagName = function(e) {
                if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(e)) throw Error("Invalid tag name <" + e + ">.");
                if (e.toUpperCase() in goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_) throw Error("Tag name <" + e + "> is not allowed for SafeHtml.")
            }, goog.html.SafeHtml.createIframe = function(e, t, o, r) {
                e && goog.html.TrustedResourceUrl.unwrap(e);
                var s = {};
                return s.src = e || null, s.srcdoc = t && goog.html.SafeHtml.unwrap(t), e = goog.html.SafeHtml.combineAttributes(s, {
                    sandbox: ""
                }, o), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", e, r)
            }, goog.html.SafeHtml.createSandboxIframe = function(e, t, o, r) {
                if (!goog.html.SafeHtml.canUseSandboxIframe()) throw Error("The browser does not support sandboxed iframes.");
                var s = {};
                return s.src = e ? goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(e)) : null, s.srcdoc = t || null, s.sandbox = "", e = goog.html.SafeHtml.combineAttributes(s, {}, o), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", e, r)
            }, goog.html.SafeHtml.canUseSandboxIframe = function() {
                return goog.global.HTMLIFrameElement && "sandbox" in goog.global.HTMLIFrameElement.prototype
            }, goog.html.SafeHtml.createScriptSrc = function(e, t) {
                return goog.html.TrustedResourceUrl.unwrap(e), e = goog.html.SafeHtml.combineAttributes({
                    src: e
                }, {}, t), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", e)
            }, goog.html.SafeHtml.createScript = function(e, t) {
                for (var o in t) {
                    var r = o.toLowerCase();
                    if ("language" == r || "src" == r || "text" == r || "type" == r) throw Error('Cannot set "' + r + '" attribute')
                }
                for (o = "", e = goog.array.concat(e), r = 0; r < e.length; r++) o += goog.html.SafeScript.unwrap(e[r]);
                return e = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(o, goog.i18n.bidi.Dir.NEUTRAL), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", t, e)
            }, goog.html.SafeHtml.createStyle = function(e, t) {
                t = goog.html.SafeHtml.combineAttributes({
                    type: "text/css"
                }, {}, t);
                var o = "";
                e = goog.array.concat(e);
                for (var r = 0; r < e.length; r++) o += goog.html.SafeStyleSheet.unwrap(e[r]);
                return e = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(o, goog.i18n.bidi.Dir.NEUTRAL), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("style", t, e)
            }, goog.html.SafeHtml.createMetaRefresh = function(e, t) {
                return e = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(e)), (goog.labs.userAgent.browser.isIE() || goog.labs.userAgent.browser.isEdge()) && goog.string.internal.contains(e, ";") && (e = "'" + e.replace(/'/g, "%27") + "'"), goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("meta", {
                    "http-equiv": "refresh",
                    content: (t || 0) + "; url=" + e
                })
            }, goog.html.SafeHtml.getAttrNameAndValue_ = function(e, t, o) {
                if (o instanceof goog.string.Const) o = goog.string.Const.unwrap(o);
                else if ("style" == t.toLowerCase()) o = goog.html.SafeHtml.getStyleValue_(o);
                else {
                    if (/^on/i.test(t)) throw Error('Attribute "' + t + '" requires goog.string.Const value, "' + o + '" given.');
                    if (t.toLowerCase() in goog.html.SafeHtml.URL_ATTRIBUTES_)
                        if (o instanceof goog.html.TrustedResourceUrl) o = goog.html.TrustedResourceUrl.unwrap(o);
                        else if (o instanceof goog.html.SafeUrl) o = goog.html.SafeUrl.unwrap(o);
                    else {
                        if (!goog.isString(o)) throw Error('Attribute "' + t + '" on tag "' + e + '" requires goog.html.SafeUrl, goog.string.Const, or string, value "' + o + '" given.');
                        o = goog.html.SafeUrl.sanitize(o).getTypedStringValue()
                    }
                }
                return o.implementsGoogStringTypedString && (o = o.getTypedStringValue()), goog.asserts.assert(goog.isString(o) || goog.isNumber(o), "String or number value expected, got " + typeof o + " with value: " + o), t + '="' + goog.string.internal.htmlEscape(String(o)) + '"'
            }, goog.html.SafeHtml.getStyleValue_ = function(e) {
                if (!goog.isObject(e)) throw Error('The "style" attribute requires goog.html.SafeStyle or map of style properties, ' + typeof e + " given: " + e);
                return e instanceof goog.html.SafeStyle || (e = goog.html.SafeStyle.create(e)), goog.html.SafeStyle.unwrap(e)
            }, goog.html.SafeHtml.createWithDir = function(e, t, o, r) {
                return (t = goog.html.SafeHtml.create(t, o, r)).dir_ = e, t
            }, goog.html.SafeHtml.join = function(e, t) {
                var o = (e = goog.html.SafeHtml.htmlEscape(e)).getDirection(),
                    r = [],
                    s = function(e) {
                        goog.isArray(e) ? goog.array.forEach(e, s) : (e = goog.html.SafeHtml.htmlEscape(e), r.push(goog.html.SafeHtml.unwrap(e)), e = e.getDirection(), o == goog.i18n.bidi.Dir.NEUTRAL ? o = e : e != goog.i18n.bidi.Dir.NEUTRAL && o != e && (o = null))
                    };
                return goog.array.forEach(t, s), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(r.join(goog.html.SafeHtml.unwrap(e)), o)
            }, goog.html.SafeHtml.concat = function(e) {
                return goog.html.SafeHtml.join(goog.html.SafeHtml.EMPTY, Array.prototype.slice.call(arguments))
            }, goog.html.SafeHtml.concatWithDir = function(e, t) {
                var o = goog.html.SafeHtml.concat(goog.array.slice(arguments, 1));
                return o.dir_ = e, o
            }, goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {}, goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse = function(e, t) {
                return (new goog.html.SafeHtml).initSecurityPrivateDoNotAccessOrElse_(e, t)
            }, goog.html.SafeHtml.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(e, t) {
                return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createHTML(e) : e, this.dir_ = t, this
            }, goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse = function(e, t, o) {
                var r = null,
                    s = "<" + e + goog.html.SafeHtml.stringifyAttributes(e, t);
                return goog.isDefAndNotNull(o) ? goog.isArray(o) || (o = [o]) : o = [], goog.dom.tags.isVoidTag(e.toLowerCase()) ? (goog.asserts.assert(!o.length, "Void tag <" + e + "> does not allow content."), s += ">") : (r = goog.html.SafeHtml.concat(o), s += ">" + goog.html.SafeHtml.unwrap(r) + "</" + e + ">", r = r.getDirection()), (e = t && t.dir) && (r = /^(ltr|rtl|auto)$/i.test(e) ? goog.i18n.bidi.Dir.NEUTRAL : null), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(s, r)
            }, goog.html.SafeHtml.stringifyAttributes = function(e, t) {
                var o = "";
                if (t)
                    for (var r in t) {
                        if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(r)) throw Error('Invalid attribute name "' + r + '".');
                        var s = t[r];
                        goog.isDefAndNotNull(s) && (o += " " + goog.html.SafeHtml.getAttrNameAndValue_(e, r, s))
                    }
                return o
            }, goog.html.SafeHtml.combineAttributes = function(e, t, o) {
                var r, s = {};
                for (r in e) goog.asserts.assert(r.toLowerCase() == r, "Must be lower case"), s[r] = e[r];
                for (r in t) goog.asserts.assert(r.toLowerCase() == r, "Must be lower case"), s[r] = t[r];
                for (r in o) {
                    var n = r.toLowerCase();
                    if (n in e) throw Error('Cannot override "' + n + '" attribute, got "' + r + '" with value "' + o[r] + '"');
                    n in t && delete s[n], s[r] = o[r]
                }
                return s
            }, goog.html.SafeHtml.DOCTYPE_HTML = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<!DOCTYPE html>", goog.i18n.bidi.Dir.NEUTRAL), goog.html.SafeHtml.EMPTY = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("", goog.i18n.bidi.Dir.NEUTRAL), goog.html.SafeHtml.BR = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<br>", goog.i18n.bidi.Dir.NEUTRAL), goog.html.uncheckedconversions = {}, goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract = function(e, t, o) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(t, o || null)
            }, goog.html.uncheckedconversions.safeScriptFromStringKnownToSatisfyTypeContract = function(e, t) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.uncheckedconversions.safeStyleFromStringKnownToSatisfyTypeContract = function(e, t) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.uncheckedconversions.safeStyleSheetFromStringKnownToSatisfyTypeContract = function(e, t) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract = function(e, t) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(t)
            }, goog.html.uncheckedconversions.trustedResourceUrlFromStringKnownToSatisfyTypeContract = function(e, t) {
                return goog.asserts.assertString(goog.string.Const.unwrap(e), "must provide justification"), goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(e)), "must provide non-empty justification"), goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(t)
            }, goog.dom.asserts = {}, goog.dom.asserts.assertIsLocation = function(e) {
                if (goog.asserts.ENABLE_ASSERTS) {
                    var t = goog.dom.asserts.getWindow_(e);
                    t && (!e || !(e instanceof t.Location) && e instanceof t.Element) && goog.asserts.fail("Argument is not a Location (or a non-Element mock); got: %s", goog.dom.asserts.debugStringForType_(e))
                }
                return e
            }, goog.dom.asserts.assertIsElementType_ = function(e, t) {
                if (goog.asserts.ENABLE_ASSERTS) {
                    var o = goog.dom.asserts.getWindow_(e);
                    o && void 0 !== o[t] && (e && (e instanceof o[t] || !(e instanceof o.Location || e instanceof o.Element)) || goog.asserts.fail("Argument is not a %s (or a non-Element, non-Location mock); got: %s", t, goog.dom.asserts.debugStringForType_(e)))
                }
                return e
            }, goog.dom.asserts.assertIsHTMLAnchorElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLAnchorElement")
            }, goog.dom.asserts.assertIsHTMLButtonElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLButtonElement")
            }, goog.dom.asserts.assertIsHTMLLinkElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLLinkElement")
            }, goog.dom.asserts.assertIsHTMLImageElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLImageElement")
            }, goog.dom.asserts.assertIsHTMLAudioElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLAudioElement")
            }, goog.dom.asserts.assertIsHTMLVideoElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLVideoElement")
            }, goog.dom.asserts.assertIsHTMLInputElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLInputElement")
            }, goog.dom.asserts.assertIsHTMLTextAreaElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLTextAreaElement")
            }, goog.dom.asserts.assertIsHTMLCanvasElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLCanvasElement")
            }, goog.dom.asserts.assertIsHTMLEmbedElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLEmbedElement")
            }, goog.dom.asserts.assertIsHTMLFormElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLFormElement")
            }, goog.dom.asserts.assertIsHTMLFrameElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLFrameElement")
            }, goog.dom.asserts.assertIsHTMLIFrameElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLIFrameElement")
            }, goog.dom.asserts.assertIsHTMLObjectElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLObjectElement")
            }, goog.dom.asserts.assertIsHTMLScriptElement = function(e) {
                return goog.dom.asserts.assertIsElementType_(e, "HTMLScriptElement")
            }, goog.dom.asserts.debugStringForType_ = function(e) {
                if (!goog.isObject(e)) return void 0 === e ? "undefined" : null === e ? "null" : typeof e;
                try {
                    return e.constructor.displayName || e.constructor.name || Object.prototype.toString.call(e)
                } catch (e) {
                    return "<object could not be stringified>"
                }
            }, goog.dom.asserts.getWindow_ = function(e) {
                try {
                    var t = e && e.ownerDocument,
                        o = t && (t.defaultView || t.parentWindow);
                    if ((o = o || goog.global).Element && o.Location) return o
                } catch (e) {}
                return null
            }, goog.functions = {}, goog.functions.constant = function(e) {
                return function() {
                    return e
                }
            }, goog.functions.FALSE = function() {
                return !1
            }, goog.functions.TRUE = function() {
                return !0
            }, goog.functions.NULL = function() {
                return null
            }, goog.functions.identity = function(e, t) {
                return e
            }, goog.functions.error = function(e) {
                return function() {
                    throw Error(e)
                }
            }, goog.functions.fail = function(e) {
                return function() {
                    throw e
                }
            }, goog.functions.lock = function(e, t) {
                return t = t || 0,
                    function() {
                        return e.apply(this, Array.prototype.slice.call(arguments, 0, t))
                    }
            }, goog.functions.nth = function(e) {
                return function() {
                    return arguments[e]
                }
            }, goog.functions.partialRight = function(e, t) {
                var o = Array.prototype.slice.call(arguments, 1);
                return function() {
                    var t = Array.prototype.slice.call(arguments);
                    return t.push.apply(t, o), e.apply(this, t)
                }
            }, goog.functions.withReturnValue = function(e, t) {
                return goog.functions.sequence(e, goog.functions.constant(t))
            }, goog.functions.equalTo = function(e, t) {
                return function(o) {
                    return t ? e == o : e === o
                }
            }, goog.functions.compose = function(e, t) {
                var o = arguments,
                    r = o.length;
                return function() {
                    var e;
                    r && (e = o[r - 1].apply(this, arguments));
                    for (var t = r - 2; 0 <= t; t--) e = o[t].call(this, e);
                    return e
                }
            }, goog.functions.sequence = function(e) {
                var t = arguments,
                    o = t.length;
                return function() {
                    for (var e, r = 0; r < o; r++) e = t[r].apply(this, arguments);
                    return e
                }
            }, goog.functions.and = function(e) {
                var t = arguments,
                    o = t.length;
                return function() {
                    for (var e = 0; e < o; e++)
                        if (!t[e].apply(this, arguments)) return !1;
                    return !0
                }
            }, goog.functions.or = function(e) {
                var t = arguments,
                    o = t.length;
                return function() {
                    for (var e = 0; e < o; e++)
                        if (t[e].apply(this, arguments)) return !0;
                    return !1
                }
            }, goog.functions.not = function(e) {
                return function() {
                    return !e.apply(this, arguments)
                }
            }, goog.functions.create = function(e, t) {
                var o = function() {};
                return o.prototype = e.prototype, o = new o, e.apply(o, Array.prototype.slice.call(arguments, 1)), o
            }, goog.functions.CACHE_RETURN_VALUE = !0, goog.functions.cacheReturnValue = function(e) {
                var t, o = !1;
                return function() {
                    return goog.functions.CACHE_RETURN_VALUE ? (o || (t = e(), o = !0), t) : e()
                }
            }, goog.functions.once = function(e) {
                var t = e;
                return function() {
                    if (t) {
                        var e = t;
                        t = null, e()
                    }
                }
            }, goog.functions.debounce = function(e, t, o) {
                var r = 0;
                return function(s) {
                    goog.global.clearTimeout(r);
                    var n = arguments;
                    r = goog.global.setTimeout(function() {
                        e.apply(o, n)
                    }, t)
                }
            }, goog.functions.throttle = function(e, t, o) {
                var r = 0,
                    s = !1,
                    n = [],
                    i = function() {
                        r = 0, s && (s = !1, a())
                    },
                    a = function() {
                        r = goog.global.setTimeout(i, t), e.apply(o, n)
                    };
                return function(e) {
                    n = arguments, r ? s = !0 : a()
                }
            }, goog.functions.rateLimit = function(e, t, o) {
                var r = 0,
                    s = function() {
                        r = 0
                    };
                return function(n) {
                    r || (r = goog.global.setTimeout(s, t), e.apply(o, arguments))
                }
            }, goog.dom.safe = {}, goog.dom.safe.InsertAdjacentHtmlPosition = {
                AFTERBEGIN: "afterbegin",
                AFTEREND: "afterend",
                BEFOREBEGIN: "beforebegin",
                BEFOREEND: "beforeend"
            }, goog.dom.safe.insertAdjacentHtml = function(e, t, o) {
                e.insertAdjacentHTML(t, goog.html.SafeHtml.unwrapTrustedHTML(o))
            }, goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_ = {
                MATH: !0,
                SCRIPT: !0,
                STYLE: !0,
                SVG: !0,
                TEMPLATE: !0
            }, goog.dom.safe.isInnerHtmlCleanupRecursive_ = goog.functions.cacheReturnValue(function() {
                if (goog.DEBUG && "undefined" == typeof document) return !1;
                var e = document.createElement("div"),
                    t = document.createElement("div");
                return t.appendChild(document.createElement("div")), e.appendChild(t), !(goog.DEBUG && !e.firstChild || (t = e.firstChild.firstChild, e.innerHTML = goog.html.SafeHtml.unwrapTrustedHTML(goog.html.SafeHtml.EMPTY), t.parentElement))
            }), goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse = function(e, t) {
                if (goog.dom.safe.isInnerHtmlCleanupRecursive_())
                    for (; e.lastChild;) e.removeChild(e.lastChild);
                e.innerHTML = goog.html.SafeHtml.unwrapTrustedHTML(t)
            }, goog.dom.safe.setInnerHtml = function(e, t) {
                if (goog.asserts.ENABLE_ASSERTS) {
                    var o = e.tagName.toUpperCase();
                    if (goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_[o]) throw Error("goog.dom.safe.setInnerHtml cannot be used to set content of " + e.tagName + ".")
                }
                goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse(e, t)
            }, goog.dom.safe.setOuterHtml = function(e, t) {
                e.outerHTML = goog.html.SafeHtml.unwrapTrustedHTML(t)
            }, goog.dom.safe.setFormElementAction = function(e, t) {
                t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), goog.dom.asserts.assertIsHTMLFormElement(e).action = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setButtonFormAction = function(e, t) {
                t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), goog.dom.asserts.assertIsHTMLButtonElement(e).formAction = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setInputFormAction = function(e, t) {
                t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), goog.dom.asserts.assertIsHTMLInputElement(e).formAction = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setStyle = function(e, t) {
                e.style.cssText = goog.html.SafeStyle.unwrap(t)
            }, goog.dom.safe.documentWrite = function(e, t) {
                e.write(goog.html.SafeHtml.unwrapTrustedHTML(t))
            }, goog.dom.safe.setAnchorHref = function(e, t) {
                goog.dom.asserts.assertIsHTMLAnchorElement(e), t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), e.href = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setImageSrc = function(e, t) {
                if (goog.dom.asserts.assertIsHTMLImageElement(e), !(t instanceof goog.html.SafeUrl)) {
                    var o = /^data:image\//i.test(t);
                    t = goog.html.SafeUrl.sanitizeAssertUnchanged(t, o)
                }
                e.src = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setAudioSrc = function(e, t) {
                if (goog.dom.asserts.assertIsHTMLAudioElement(e), !(t instanceof goog.html.SafeUrl)) {
                    var o = /^data:audio\//i.test(t);
                    t = goog.html.SafeUrl.sanitizeAssertUnchanged(t, o)
                }
                e.src = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setVideoSrc = function(e, t) {
                if (goog.dom.asserts.assertIsHTMLVideoElement(e), !(t instanceof goog.html.SafeUrl)) {
                    var o = /^data:video\//i.test(t);
                    t = goog.html.SafeUrl.sanitizeAssertUnchanged(t, o)
                }
                e.src = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setEmbedSrc = function(e, t) {
                goog.dom.asserts.assertIsHTMLEmbedElement(e), e.src = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(t)
            }, goog.dom.safe.setFrameSrc = function(e, t) {
                goog.dom.asserts.assertIsHTMLFrameElement(e), e.src = goog.html.TrustedResourceUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setIframeSrc = function(e, t) {
                goog.dom.asserts.assertIsHTMLIFrameElement(e), e.src = goog.html.TrustedResourceUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.setIframeSrcdoc = function(e, t) {
                goog.dom.asserts.assertIsHTMLIFrameElement(e), e.srcdoc = goog.html.SafeHtml.unwrapTrustedHTML(t)
            }, goog.dom.safe.setLinkHrefAndRel = function(e, t, o) {
                goog.dom.asserts.assertIsHTMLLinkElement(e), e.rel = o, goog.string.internal.caseInsensitiveContains(o, "stylesheet") ? (goog.asserts.assert(t instanceof goog.html.TrustedResourceUrl, 'URL must be TrustedResourceUrl because "rel" contains "stylesheet"'), e.href = goog.html.TrustedResourceUrl.unwrapTrustedURL(t)) : e.href = t instanceof goog.html.TrustedResourceUrl ? goog.html.TrustedResourceUrl.unwrapTrustedURL(t) : t instanceof goog.html.SafeUrl ? goog.html.SafeUrl.unwrapTrustedURL(t) : goog.html.SafeUrl.unwrapTrustedURL(goog.html.SafeUrl.sanitizeAssertUnchanged(t))
            }, goog.dom.safe.setObjectData = function(e, t) {
                goog.dom.asserts.assertIsHTMLObjectElement(e), e.data = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(t)
            }, goog.dom.safe.setScriptSrc = function(e, t) {
                goog.dom.asserts.assertIsHTMLScriptElement(e), e.src = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(t), (t = goog.getScriptNonce()) && e.setAttribute("nonce", t)
            }, goog.dom.safe.setScriptContent = function(e, t) {
                goog.dom.asserts.assertIsHTMLScriptElement(e), e.text = goog.html.SafeScript.unwrapTrustedScript(t), (t = goog.getScriptNonce()) && e.setAttribute("nonce", t)
            }, goog.dom.safe.setLocationHref = function(e, t) {
                goog.dom.asserts.assertIsLocation(e), t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), e.href = goog.html.SafeUrl.unwrapTrustedURL(t)
            }, goog.dom.safe.assignLocation = function(e, t) {
                goog.dom.asserts.assertIsLocation(e), t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), e.assign(goog.html.SafeUrl.unwrapTrustedURL(t))
            }, goog.dom.safe.replaceLocation = function(e, t) {
                goog.dom.asserts.assertIsLocation(e), t = t instanceof goog.html.SafeUrl ? t : goog.html.SafeUrl.sanitizeAssertUnchanged(t), e.replace(goog.html.SafeUrl.unwrapTrustedURL(t))
            }, goog.dom.safe.openInWindow = function(e, t, o, r, s) {
                return e = e instanceof goog.html.SafeUrl ? e : goog.html.SafeUrl.sanitizeAssertUnchanged(e), (t || goog.global).open(goog.html.SafeUrl.unwrapTrustedURL(e), o ? goog.string.Const.unwrap(o) : "", r, s)
            }, goog.dom.safe.parseFromStringHtml = function(e, t) {
                return goog.dom.safe.parseFromString(e, t, "text/html")
            }, goog.dom.safe.parseFromString = function(e, t, o) {
                return e.parseFromString(goog.html.SafeHtml.unwrapTrustedHTML(t), o)
            }, goog.dom.safe.createImageFromBlob = function(e) {
                if (!/^image\/.*/g.test(e.type)) throw Error("goog.dom.safe.createImageFromBlob only accepts MIME type image/.*.");
                var t = goog.global.URL.createObjectURL(e);
                return (e = new goog.global.Image).onload = function() {
                    goog.global.URL.revokeObjectURL(t)
                }, goog.dom.safe.setImageSrc(e, goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Image blob URL."), t)), e
            }, goog.string.DETECT_DOUBLE_ESCAPING = !1, goog.string.FORCE_NON_DOM_HTML_UNESCAPING = !1, goog.string.Unicode = {
                NBSP: " "
            }, goog.string.startsWith = goog.string.internal.startsWith, goog.string.endsWith = goog.string.internal.endsWith, goog.string.caseInsensitiveStartsWith = goog.string.internal.caseInsensitiveStartsWith, goog.string.caseInsensitiveEndsWith = goog.string.internal.caseInsensitiveEndsWith, goog.string.caseInsensitiveEquals = goog.string.internal.caseInsensitiveEquals, goog.string.subs = function(e, t) {
                for (var o = e.split("%s"), r = "", s = Array.prototype.slice.call(arguments, 1); s.length && 1 < o.length;) r += o.shift() + s.shift();
                return r + o.join("%s")
            }, goog.string.collapseWhitespace = function(e) {
                return e.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
            }, goog.string.isEmptyOrWhitespace = goog.string.internal.isEmptyOrWhitespace, goog.string.isEmptyString = function(e) {
                return 0 == e.length
            }, goog.string.isEmpty = goog.string.isEmptyOrWhitespace, goog.string.isEmptyOrWhitespaceSafe = function(e) {
                return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(e))
            }, goog.string.isEmptySafe = goog.string.isEmptyOrWhitespaceSafe, goog.string.isBreakingWhitespace = function(e) {
                return !/[^\t\n\r ]/.test(e)
            }, goog.string.isAlpha = function(e) {
                return !/[^a-zA-Z]/.test(e)
            }, goog.string.isNumeric = function(e) {
                return !/[^0-9]/.test(e)
            }, goog.string.isAlphaNumeric = function(e) {
                return !/[^a-zA-Z0-9]/.test(e)
            }, goog.string.isSpace = function(e) {
                return " " == e
            }, goog.string.isUnicodeChar = function(e) {
                return 1 == e.length && " " <= e && "~" >= e || "" <= e && "�" >= e
            }, goog.string.stripNewlines = function(e) {
                return e.replace(/(\r\n|\r|\n)+/g, " ")
            }, goog.string.canonicalizeNewlines = function(e) {
                return e.replace(/(\r\n|\r|\n)/g, "\n")
            }, goog.string.normalizeWhitespace = function(e) {
                return e.replace(/\xa0|\s/g, " ")
            }, goog.string.normalizeSpaces = function(e) {
                return e.replace(/\xa0|[ \t]+/g, " ")
            }, goog.string.collapseBreakingSpaces = function(e) {
                return e.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
            }, goog.string.trim = goog.string.internal.trim, goog.string.trimLeft = function(e) {
                return e.replace(/^[\s\xa0]+/, "")
            }, goog.string.trimRight = function(e) {
                return e.replace(/[\s\xa0]+$/, "")
            }, goog.string.caseInsensitiveCompare = goog.string.internal.caseInsensitiveCompare, goog.string.numberAwareCompare_ = function(e, t, o) {
                if (e == t) return 0;
                if (!e) return -1;
                if (!t) return 1;
                for (var r = e.toLowerCase().match(o), s = t.toLowerCase().match(o), n = Math.min(r.length, s.length), i = 0; i < n; i++) {
                    o = r[i];
                    var a = s[i];
                    if (o != a) return e = parseInt(o, 10), !isNaN(e) && (t = parseInt(a, 10), !isNaN(t) && e - t) ? e - t : o < a ? -1 : 1
                }
                return r.length != s.length ? r.length - s.length : e < t ? -1 : 1
            }, goog.string.intAwareCompare = function(e, t) {
                return goog.string.numberAwareCompare_(e, t, /\d+|\D+/g)
            }, goog.string.floatAwareCompare = function(e, t) {
                return goog.string.numberAwareCompare_(e, t, /\d+|\.\d+|\D+/g)
            }, goog.string.numerateCompare = goog.string.floatAwareCompare, goog.string.urlEncode = function(e) {
                return encodeURIComponent(String(e))
            }, goog.string.urlDecode = function(e) {
                return decodeURIComponent(e.replace(/\+/g, " "))
            }, goog.string.newLineToBr = goog.string.internal.newLineToBr, goog.string.htmlEscape = function(e, t) {
                return e = goog.string.internal.htmlEscape(e, t), goog.string.DETECT_DOUBLE_ESCAPING && (e = e.replace(goog.string.E_RE_, "&#101;")), e
            }, goog.string.E_RE_ = /e/g, goog.string.unescapeEntities = function(e) {
                return goog.string.contains(e, "&") ? !goog.string.FORCE_NON_DOM_HTML_UNESCAPING && "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(e) : goog.string.unescapePureXmlEntities_(e) : e
            }, goog.string.unescapeEntitiesWithDocument = function(e, t) {
                return goog.string.contains(e, "&") ? goog.string.unescapeEntitiesUsingDom_(e, t) : e
            }, goog.string.unescapeEntitiesUsingDom_ = function(e, t) {
                var o = {
                        "&amp;": "&",
                        "&lt;": "<",
                        "&gt;": ">",
                        "&quot;": '"'
                    },
                    r = t ? t.createElement("div") : goog.global.document.createElement("div");
                return e.replace(goog.string.HTML_ENTITY_PATTERN_, function(e, t) {
                    var s = o[e];
                    return s || ("#" == t.charAt(0) && (t = Number("0" + t.substr(1)), isNaN(t) || (s = String.fromCharCode(t))), s || (goog.dom.safe.setInnerHtml(r, goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Single HTML entity."), e + " ")), s = r.firstChild.nodeValue.slice(0, -1)), o[e] = s)
                })
            }, goog.string.unescapePureXmlEntities_ = function(e) {
                return e.replace(/&([^;]+);/g, function(e, t) {
                    switch (t) {
                        case "amp":
                            return "&";
                        case "lt":
                            return "<";
                        case "gt":
                            return ">";
                        case "quot":
                            return '"';
                        default:
                            return "#" != t.charAt(0) || (t = Number("0" + t.substr(1)), isNaN(t)) ? e : String.fromCharCode(t)
                    }
                })
            }, goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g, goog.string.whitespaceEscape = function(e, t) {
                return goog.string.newLineToBr(e.replace(/  /g, " &#160;"), t)
            }, goog.string.preserveSpaces = function(e) {
                return e.replace(/(^|[\n ]) /g, "$1" + goog.string.Unicode.NBSP)
            }, goog.string.stripQuotes = function(e, t) {
                for (var o = t.length, r = 0; r < o; r++) {
                    var s = 1 == o ? t : t.charAt(r);
                    if (e.charAt(0) == s && e.charAt(e.length - 1) == s) return e.substring(1, e.length - 1)
                }
                return e
            }, goog.string.truncate = function(e, t, o) {
                return o && (e = goog.string.unescapeEntities(e)), e.length > t && (e = e.substring(0, t - 3) + "..."), o && (e = goog.string.htmlEscape(e)), e
            }, goog.string.truncateMiddle = function(e, t, o, r) {
                if (o && (e = goog.string.unescapeEntities(e)), r && e.length > t) {
                    r > t && (r = t);
                    var s = e.length - r;
                    e = e.substring(0, t - r) + "..." + e.substring(s)
                } else e.length > t && (r = Math.floor(t / 2), s = e.length - r, e = e.substring(0, r + t % 2) + "..." + e.substring(s));
                return o && (e = goog.string.htmlEscape(e)), e
            }, goog.string.specialEscapeChars_ = {
                "\0": "\\0",
                "\b": "\\b",
                "\f": "\\f",
                "\n": "\\n",
                "\r": "\\r",
                "\t": "\\t",
                "\v": "\\x0B",
                '"': '\\"',
                "\\": "\\\\",
                "<": "\\u003C"
            }, goog.string.jsEscapeCache_ = {
                "'": "\\'"
            }, goog.string.quote = function(e) {
                e = String(e);
                for (var t = ['"'], o = 0; o < e.length; o++) {
                    var r = e.charAt(o),
                        s = r.charCodeAt(0);
                    t[o + 1] = goog.string.specialEscapeChars_[r] || (31 < s && 127 > s ? r : goog.string.escapeChar(r))
                }
                return t.push('"'), t.join("")
            }, goog.string.escapeString = function(e) {
                for (var t = [], o = 0; o < e.length; o++) t[o] = goog.string.escapeChar(e.charAt(o));
                return t.join("")
            }, goog.string.escapeChar = function(e) {
                if (e in goog.string.jsEscapeCache_) return goog.string.jsEscapeCache_[e];
                if (e in goog.string.specialEscapeChars_) return goog.string.jsEscapeCache_[e] = goog.string.specialEscapeChars_[e];
                var t = e.charCodeAt(0);
                if (31 < t && 127 > t) var o = e;
                else 256 > t ? (o = "\\x", (16 > t || 256 < t) && (o += "0")) : (o = "\\u", 4096 > t && (o += "0")), o += t.toString(16).toUpperCase();
                return goog.string.jsEscapeCache_[e] = o
            }, goog.string.contains = goog.string.internal.contains, goog.string.caseInsensitiveContains = goog.string.internal.caseInsensitiveContains, goog.string.countOf = function(e, t) {
                return e && t ? e.split(t).length - 1 : 0
            }, goog.string.removeAt = function(e, t, o) {
                var r = e;
                return 0 <= t && t < e.length && 0 < o && (r = e.substr(0, t) + e.substr(t + o, e.length - t - o)), r
            }, goog.string.remove = function(e, t) {
                return e.replace(t, "")
            }, goog.string.removeAll = function(e, t) {
                return t = new RegExp(goog.string.regExpEscape(t), "g"), e.replace(t, "")
            }, goog.string.replaceAll = function(e, t, o) {
                return t = new RegExp(goog.string.regExpEscape(t), "g"), e.replace(t, o.replace(/\$/g, "$$$$"))
            }, goog.string.regExpEscape = function(e) {
                return String(e).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
            }, goog.string.repeat = String.prototype.repeat ? function(e, t) {
                return e.repeat(t)
            } : function(e, t) {
                return Array(t + 1).join(e)
            }, goog.string.padNumber = function(e, t, o) {
                return -1 == (o = (e = goog.isDef(o) ? e.toFixed(o) : String(e)).indexOf(".")) && (o = e.length), goog.string.repeat("0", Math.max(0, t - o)) + e
            }, goog.string.makeSafe = function(e) {
                return null == e ? "" : String(e)
            }, goog.string.buildString = function(e) {
                return Array.prototype.join.call(arguments, "")
            }, goog.string.getRandomString = function() {
                return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ goog.now()).toString(36)
            }, goog.string.compareVersions = goog.string.internal.compareVersions, goog.string.hashCode = function(e) {
                for (var t = 0, o = 0; o < e.length; ++o) t = 31 * t + e.charCodeAt(o) >>> 0;
                return t
            }, goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0, goog.string.createUniqueString = function() {
                return "goog_" + goog.string.uniqueStringCounter_++
            }, goog.string.toNumber = function(e) {
                var t = Number(e);
                return 0 == t && goog.string.isEmptyOrWhitespace(e) ? NaN : t
            }, goog.string.isLowerCamelCase = function(e) {
                return /^[a-z]+([A-Z][a-z]*)*$/.test(e)
            }, goog.string.isUpperCamelCase = function(e) {
                return /^([A-Z][a-z]*)+$/.test(e)
            }, goog.string.toCamelCase = function(e) {
                return String(e).replace(/\-([a-z])/g, function(e, t) {
                    return t.toUpperCase()
                })
            }, goog.string.toSelectorCase = function(e) {
                return String(e).replace(/([A-Z])/g, "-$1").toLowerCase()
            }, goog.string.toTitleCase = function(e, t) {
                return t = goog.isString(t) ? goog.string.regExpEscape(t) : "\\s", e.replace(new RegExp("(^" + (t ? "|[" + t + "]+" : "") + ")([a-z])", "g"), function(e, t, o) {
                    return t + o.toUpperCase()
                })
            }, goog.string.capitalize = function(e) {
                return String(e.charAt(0)).toUpperCase() + String(e.substr(1)).toLowerCase()
            }, goog.string.parseInt = function(e) {
                return isFinite(e) && (e = String(e)), goog.isString(e) ? /^\s*-?0x/i.test(e) ? parseInt(e, 16) : parseInt(e, 10) : NaN
            }, goog.string.splitLimit = function(e, t, o) {
                e = e.split(t);
                for (var r = []; 0 < o && e.length;) r.push(e.shift()), o--;
                return e.length && r.push(e.join(t)), r
            }, goog.string.lastComponent = function(e, t) {
                if (!t) return e;
                "string" == typeof t && (t = [t]);
                for (var o = -1, r = 0; r < t.length; r++)
                    if ("" != t[r]) {
                        var s = e.lastIndexOf(t[r]);
                        s > o && (o = s)
                    } return -1 == o ? e : e.slice(o + 1)
            }, goog.string.editDistance = function(e, t) {
                var o = [],
                    r = [];
                if (e == t) return 0;
                if (!e.length || !t.length) return Math.max(e.length, t.length);
                for (var s = 0; s < t.length + 1; s++) o[s] = s;
                for (s = 0; s < e.length; s++) {
                    r[0] = s + 1;
                    for (var n = 0; n < t.length; n++) r[n + 1] = Math.min(r[n] + 1, o[n + 1] + 1, o[n] + Number(e[s] != t[n]));
                    for (n = 0; n < o.length; n++) o[n] = r[n]
                }
                return r[t.length]
            }, goog.labs.userAgent.platform = {}, goog.labs.userAgent.platform.isAndroid = function() {
                return goog.labs.userAgent.util.matchUserAgent("Android")
            }, goog.labs.userAgent.platform.isIpod = function() {
                return goog.labs.userAgent.util.matchUserAgent("iPod")
            }, goog.labs.userAgent.platform.isIphone = function() {
                return goog.labs.userAgent.util.matchUserAgent("iPhone") && !goog.labs.userAgent.util.matchUserAgent("iPod") && !goog.labs.userAgent.util.matchUserAgent("iPad")
            }, goog.labs.userAgent.platform.isIpad = function() {
                return goog.labs.userAgent.util.matchUserAgent("iPad")
            }, goog.labs.userAgent.platform.isIos = function() {
                return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpad() || goog.labs.userAgent.platform.isIpod()
            }, goog.labs.userAgent.platform.isMacintosh = function() {
                return goog.labs.userAgent.util.matchUserAgent("Macintosh")
            }, goog.labs.userAgent.platform.isLinux = function() {
                return goog.labs.userAgent.util.matchUserAgent("Linux")
            }, goog.labs.userAgent.platform.isWindows = function() {
                return goog.labs.userAgent.util.matchUserAgent("Windows")
            }, goog.labs.userAgent.platform.isChromeOS = function() {
                return goog.labs.userAgent.util.matchUserAgent("CrOS")
            }, goog.labs.userAgent.platform.isChromecast = function() {
                return goog.labs.userAgent.util.matchUserAgent("CrKey")
            }, goog.labs.userAgent.platform.isKaiOS = function() {
                return goog.labs.userAgent.util.matchUserAgentIgnoreCase("KaiOS")
            }, goog.labs.userAgent.platform.isGo2Phone = function() {
                return goog.labs.userAgent.util.matchUserAgentIgnoreCase("GAFP")
            }, goog.labs.userAgent.platform.getVersion = function() {
                var e = goog.labs.userAgent.util.getUserAgent(),
                    t = "";
                return goog.labs.userAgent.platform.isWindows() ? t = (e = (t = /Windows (?:NT|Phone) ([0-9.]+)/).exec(e)) ? e[1] : "0.0" : goog.labs.userAgent.platform.isIos() ? t = (e = (t = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/).exec(e)) && e[1].replace(/_/g, ".") : goog.labs.userAgent.platform.isMacintosh() ? t = (e = (t = /Mac OS X ([0-9_.]+)/).exec(e)) ? e[1].replace(/_/g, ".") : "10" : goog.labs.userAgent.platform.isKaiOS() ? t = (e = (t = /(?:KaiOS)\/(\S+)/i).exec(e)) && e[1] : goog.labs.userAgent.platform.isAndroid() ? t = (e = (t = /Android\s+([^\);]+)(\)|;)/).exec(e)) && e[1] : goog.labs.userAgent.platform.isChromeOS() && (t = (e = (t = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/).exec(e)) && e[1]), t || ""
            }, goog.labs.userAgent.platform.isVersionOrHigher = function(e) {
                return 0 <= goog.string.compareVersions(goog.labs.userAgent.platform.getVersion(), e)
            }, goog.reflect = {}, goog.reflect.object = function(e, t) {
                return t
            }, goog.reflect.objectProperty = function(e, t) {
                return e
            }, goog.reflect.sinkValue = function(e) {
                return goog.reflect.sinkValue[" "](e), e
            }, goog.reflect.sinkValue[" "] = goog.nullFunction, goog.reflect.canAccessProperty = function(e, t) {
                try {
                    return goog.reflect.sinkValue(e[t]), !0
                } catch (e) {}
                return !1
            }, goog.reflect.cache = function(e, t, o, r) {
                return r = r ? r(t) : t, Object.prototype.hasOwnProperty.call(e, r) ? e[r] : e[r] = o(t)
            }, goog.labs.userAgent.engine = {}, goog.labs.userAgent.engine.isPresto = function() {
                return goog.labs.userAgent.util.matchUserAgent("Presto")
            }, goog.labs.userAgent.engine.isTrident = function() {
                return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE")
            }, goog.labs.userAgent.engine.isEdge = function() {
                return goog.labs.userAgent.util.matchUserAgent("Edge")
            }, goog.labs.userAgent.engine.isWebKit = function() {
                return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit") && !goog.labs.userAgent.engine.isEdge()
            }, goog.labs.userAgent.engine.isGecko = function() {
                return goog.labs.userAgent.util.matchUserAgent("Gecko") && !goog.labs.userAgent.engine.isWebKit() && !goog.labs.userAgent.engine.isTrident() && !goog.labs.userAgent.engine.isEdge()
            }, goog.labs.userAgent.engine.getVersion = function() {
                var e = goog.labs.userAgent.util.getUserAgent();
                if (e) {
                    e = goog.labs.userAgent.util.extractVersionTuples(e);
                    var t, o = goog.labs.userAgent.engine.getEngineTuple_(e);
                    if (o) return "Gecko" == o[0] ? goog.labs.userAgent.engine.getVersionForKey_(e, "Firefox") : o[1];
                    if ((e = e[0]) && (t = e[2]) && (t = /Trident\/([^\s;]+)/.exec(t))) return t[1]
                }
                return ""
            }, goog.labs.userAgent.engine.getEngineTuple_ = function(e) {
                if (!goog.labs.userAgent.engine.isEdge()) return e[1];
                for (var t = 0; t < e.length; t++) {
                    var o = e[t];
                    if ("Edge" == o[0]) return o
                }
            }, goog.labs.userAgent.engine.isVersionOrHigher = function(e) {
                return 0 <= goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(), e)
            }, goog.labs.userAgent.engine.getVersionForKey_ = function(e, t) {
                return (e = goog.array.find(e, function(e) {
                    return t == e[0]
                })) && e[1] || ""
            }, goog.userAgent = {}, goog.userAgent.ASSUME_IE = !1, goog.userAgent.ASSUME_EDGE = !1, goog.userAgent.ASSUME_GECKO = !1, goog.userAgent.ASSUME_WEBKIT = !1, goog.userAgent.ASSUME_MOBILE_WEBKIT = !1, goog.userAgent.ASSUME_OPERA = !1, goog.userAgent.ASSUME_ANY_VERSION = !1, goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA, goog.userAgent.getUserAgentString = function() {
                return goog.labs.userAgent.util.getUserAgent()
            }, goog.userAgent.getNavigatorTyped = function() {
                return goog.global.navigator || null
            }, goog.userAgent.getNavigator = function() {
                return goog.userAgent.getNavigatorTyped()
            }, goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.labs.userAgent.browser.isOpera(), goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.labs.userAgent.browser.isIE(), goog.userAgent.EDGE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_EDGE : goog.labs.userAgent.engine.isEdge(), goog.userAgent.EDGE_OR_IE = goog.userAgent.EDGE || goog.userAgent.IE, goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.labs.userAgent.engine.isGecko();
            goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.labs.userAgent.engine.isWebKit(), goog.userAgent.isMobile_ = function() {
                return goog.userAgent.WEBKIT && goog.labs.userAgent.util.matchUserAgent("Mobile")
            }, goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.isMobile_(), goog.userAgent.SAFARI = goog.userAgent.WEBKIT, goog.userAgent.determinePlatform_ = function() {
                var e = goog.userAgent.getNavigatorTyped();
                return e && e.platform || ""
            }, goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_(), goog.userAgent.ASSUME_MAC = !1, goog.userAgent.ASSUME_WINDOWS = !1, goog.userAgent.ASSUME_LINUX = !1, goog.userAgent.ASSUME_X11 = !1, goog.userAgent.ASSUME_ANDROID = !1, goog.userAgent.ASSUME_IPHONE = !1, goog.userAgent.ASSUME_IPAD = !1, goog.userAgent.ASSUME_IPOD = !1, goog.userAgent.ASSUME_KAIOS = !1, goog.userAgent.ASSUME_GO2PHONE = !1, goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD, goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.labs.userAgent.platform.isMacintosh(), goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.labs.userAgent.platform.isWindows(), goog.userAgent.isLegacyLinux_ = function() {
                return goog.labs.userAgent.platform.isLinux() || goog.labs.userAgent.platform.isChromeOS()
            }, goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.isLegacyLinux_(), goog.userAgent.isX11_ = function() {
                var e = goog.userAgent.getNavigatorTyped();
                return !!e && goog.string.contains(e.appVersion || "", "X11")
            }, goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.isX11_(), goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.labs.userAgent.platform.isAndroid(), goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.labs.userAgent.platform.isIphone(), goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad(), goog.userAgent.IPOD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIpod(), goog.userAgent.IOS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIos(), goog.userAgent.KAIOS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_KAIOS : goog.labs.userAgent.platform.isKaiOS(), goog.userAgent.GO2PHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_GO2PHONE : goog.labs.userAgent.platform.isGo2Phone(), goog.userAgent.determineVersion_ = function() {
                var e = "",
                    t = goog.userAgent.getVersionRegexResult_();
                return t && (e = t ? t[1] : ""), goog.userAgent.IE && null != (t = goog.userAgent.getDocumentMode_()) && t > parseFloat(e) ? String(t) : e
            }, goog.userAgent.getVersionRegexResult_ = function() {
                var e = goog.userAgent.getUserAgentString();
                return goog.userAgent.GECKO ? /rv:([^\);]+)(\)|;)/.exec(e) : goog.userAgent.EDGE ? /Edge\/([\d\.]+)/.exec(e) : goog.userAgent.IE ? /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(e) : goog.userAgent.WEBKIT ? /WebKit\/(\S+)/.exec(e) : goog.userAgent.OPERA ? /(?:Version)[ \/]?(\S+)/.exec(e) : void 0
            }, goog.userAgent.getDocumentMode_ = function() {
                var e = goog.global.document;
                return e ? e.documentMode : void 0
            }, goog.userAgent.VERSION = goog.userAgent.determineVersion_(), goog.userAgent.compare = function(e, t) {
                return goog.string.compareVersions(e, t)
            }, goog.userAgent.isVersionOrHigherCache_ = {}, goog.userAgent.isVersionOrHigher = function(e) {
                return goog.userAgent.ASSUME_ANY_VERSION || goog.reflect.cache(goog.userAgent.isVersionOrHigherCache_, e, function() {
                    return 0 <= goog.string.compareVersions(goog.userAgent.VERSION, e)
                })
            }, goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher, goog.userAgent.isDocumentModeOrHigher = function(e) {
                return Number(goog.userAgent.DOCUMENT_MODE) >= e
            }, goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher, goog.userAgent.DOCUMENT_MODE = function() {
                if (goog.global.document && goog.userAgent.IE) return goog.userAgent.getDocumentMode_()
            }(), goog.userAgent.product = {}, goog.userAgent.product.ASSUME_FIREFOX = !1, goog.userAgent.product.ASSUME_IPHONE = !1, goog.userAgent.product.ASSUME_IPAD = !1, goog.userAgent.product.ASSUME_ANDROID = !1, goog.userAgent.product.ASSUME_CHROME = !1, goog.userAgent.product.ASSUME_SAFARI = !1, goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI, goog.userAgent.product.OPERA = goog.userAgent.OPERA, goog.userAgent.product.IE = goog.userAgent.IE, goog.userAgent.product.EDGE = goog.userAgent.EDGE, goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.labs.userAgent.browser.isFirefox(), goog.userAgent.product.isIphoneOrIpod_ = function() {
                return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpod()
            }, goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.isIphoneOrIpod_(), goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad(), goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.labs.userAgent.browser.isAndroidBrowser(), goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.labs.userAgent.browser.isChrome(), goog.userAgent.product.isSafariDesktop_ = function() {
                return goog.labs.userAgent.browser.isSafari() && !goog.labs.userAgent.platform.isIos()
            }, goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.isSafariDesktop_(), goog.crypt.base64 = {}, goog.crypt.base64.DEFAULT_ALPHABET_COMMON_ = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", goog.crypt.base64.ENCODED_VALS = goog.crypt.base64.DEFAULT_ALPHABET_COMMON_ + "+/=", goog.crypt.base64.ENCODED_VALS_WEBSAFE = goog.crypt.base64.DEFAULT_ALPHABET_COMMON_ + "-_.", goog.crypt.base64.Alphabet = {
                DEFAULT: 0,
                NO_PADDING: 1,
                WEBSAFE: 2,
                WEBSAFE_DOT_PADDING: 3,
                WEBSAFE_NO_PADDING: 4
            }, goog.crypt.base64.paddingChars_ = "=.", goog.crypt.base64.isPadding_ = function(e) {
                return goog.string.contains(goog.crypt.base64.paddingChars_, e)
            }, goog.crypt.base64.byteToCharMaps_ = {}, goog.crypt.base64.charToByteMap_ = null, goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ = goog.userAgent.GECKO || goog.userAgent.WEBKIT && !goog.userAgent.product.SAFARI || goog.userAgent.OPERA, goog.crypt.base64.HAS_NATIVE_ENCODE_ = goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ || "function" == typeof goog.global.btoa, goog.crypt.base64.HAS_NATIVE_DECODE_ = goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ || !goog.userAgent.product.SAFARI && !goog.userAgent.IE && "function" == typeof goog.global.atob, goog.crypt.base64.encodeByteArray = function(e, t) {
                goog.asserts.assert(goog.isArrayLike(e), "encodeByteArray takes an array as a parameter"), void 0 === t && (t = goog.crypt.base64.Alphabet.DEFAULT), goog.crypt.base64.init_(), t = goog.crypt.base64.byteToCharMaps_[t];
                for (var o = [], r = 0; r < e.length; r += 3) {
                    var s = e[r],
                        n = r + 1 < e.length,
                        i = n ? e[r + 1] : 0,
                        a = r + 2 < e.length,
                        g = a ? e[r + 2] : 0,
                        c = s >> 2;
                    s = (3 & s) << 4 | i >> 4, i = (15 & i) << 2 | g >> 6, g &= 63, a || (g = 64, n || (i = 64)), o.push(t[c], t[s], t[i] || "", t[g] || "")
                }
                return o.join("")
            }, goog.crypt.base64.encodeString = function(e, t) {
                return goog.crypt.base64.HAS_NATIVE_ENCODE_ && !t ? goog.global.btoa(e) : goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(e), t)
            }, goog.crypt.base64.decodeString = function(e, t) {
                if (goog.crypt.base64.HAS_NATIVE_DECODE_ && !t) return goog.global.atob(e);
                var o = "";
                return goog.crypt.base64.decodeStringInternal_(e, function(e) {
                    o += String.fromCharCode(e)
                }), o
            }, goog.crypt.base64.decodeStringToByteArray = function(e, t) {
                var o = [];
                return goog.crypt.base64.decodeStringInternal_(e, function(e) {
                    o.push(e)
                }), o
            }, goog.crypt.base64.decodeStringToUint8Array = function(e) {
                goog.asserts.assert(!goog.userAgent.IE || goog.userAgent.isVersionOrHigher("10"), "Browser does not support typed arrays");
                var t = e.length,
                    o = 3 * t / 4;
                o % 3 ? o = Math.floor(o) : goog.crypt.base64.isPadding_(e[t - 1]) && (o = goog.crypt.base64.isPadding_(e[t - 2]) ? o - 2 : o - 1);
                var r = new Uint8Array(o),
                    s = 0;
                return goog.crypt.base64.decodeStringInternal_(e, function(e) {
                    r[s++] = e
                }), r.subarray(0, s)
            }, goog.crypt.base64.decodeStringInternal_ = function(e, t) {
                function o(t) {
                    for (; r < e.length;) {
                        var o = e.charAt(r++),
                            s = goog.crypt.base64.charToByteMap_[o];
                        if (null != s) return s;
                        if (!goog.string.isEmptyOrWhitespace(o)) throw Error("Unknown base64 encoding at char: " + o)
                    }
                    return t
                }
                goog.crypt.base64.init_();
                for (var r = 0;;) {
                    var s = o(-1),
                        n = o(0),
                        i = o(64),
                        a = o(64);
                    if (64 === a && -1 === s) break;
                    t(s << 2 | n >> 4), 64 != i && (t(n << 4 & 240 | i >> 2), 64 != a && t(i << 6 & 192 | a))
                }
            }, goog.crypt.base64.init_ = function() {
                if (!goog.crypt.base64.charToByteMap_) {
                    goog.crypt.base64.charToByteMap_ = {};
                    for (var e = goog.crypt.base64.DEFAULT_ALPHABET_COMMON_.split(""), t = ["+/=", "+/", "-_=", "-_.", "-_"], o = 0; 5 > o; o++) {
                        var r = e.concat(t[o].split(""));
                        goog.crypt.base64.byteToCharMaps_[o] = r;
                        for (var s = 0; s < r.length; s++) {
                            var n = r[s],
                                i = goog.crypt.base64.charToByteMap_[n];
                            void 0 === i ? goog.crypt.base64.charToByteMap_[n] = s : goog.asserts.assert(i === s)
                        }
                    }
                }
            }, jspb.utils = {}, jspb.utils.split64Low = 0, jspb.utils.split64High = 0, jspb.utils.splitUint64 = function(e) {
                var t = e >>> 0;
                e = Math.floor((e - t) / jspb.BinaryConstants.TWO_TO_32) >>> 0, jspb.utils.split64Low = t, jspb.utils.split64High = e
            }, jspb.utils.splitInt64 = function(e) {
                var t = 0 > e,
                    o = (e = Math.abs(e)) >>> 0;
                e = Math.floor((e - o) / jspb.BinaryConstants.TWO_TO_32), e >>>= 0, t && (e = ~e >>> 0, 4294967295 < (o = 1 + (~o >>> 0)) && (o = 0, 4294967295 < ++e && (e = 0))), jspb.utils.split64Low = o, jspb.utils.split64High = e
            }, jspb.utils.splitZigzag64 = function(e) {
                var t = 0 > e;
                e = 2 * Math.abs(e), jspb.utils.splitUint64(e), e = jspb.utils.split64Low;
                var o = jspb.utils.split64High;
                t && (0 == e ? 0 == o ? o = e = 4294967295 : (o--, e = 4294967295) : e--), jspb.utils.split64Low = e, jspb.utils.split64High = o
            }, jspb.utils.splitFloat32 = function(e) {
                var t = 0 > e ? 1 : 0;
                if (0 === (e = t ? -e : e)) 0 < 1 / e ? (jspb.utils.split64High = 0, jspb.utils.split64Low = 0) : (jspb.utils.split64High = 0, jspb.utils.split64Low = 2147483648);
                else if (isNaN(e)) jspb.utils.split64High = 0, jspb.utils.split64Low = 2147483647;
                else if (e > jspb.BinaryConstants.FLOAT32_MAX) jspb.utils.split64High = 0, jspb.utils.split64Low = (t << 31 | 2139095040) >>> 0;
                else if (e < jspb.BinaryConstants.FLOAT32_MIN) e = Math.round(e / Math.pow(2, -149)), jspb.utils.split64High = 0, jspb.utils.split64Low = (t << 31 | e) >>> 0;
                else {
                    var o = Math.floor(Math.log(e) / Math.LN2);
                    e *= Math.pow(2, -o), e = 8388607 & Math.round(e * jspb.BinaryConstants.TWO_TO_23), jspb.utils.split64High = 0, jspb.utils.split64Low = (t << 31 | o + 127 << 23 | e) >>> 0
                }
            }, jspb.utils.splitFloat64 = function(e) {
                var t = 0 > e ? 1 : 0;
                if (0 === (e = t ? -e : e)) jspb.utils.split64High = 0 < 1 / e ? 0 : 2147483648, jspb.utils.split64Low = 0;
                else if (isNaN(e)) jspb.utils.split64High = 2147483647, jspb.utils.split64Low = 4294967295;
                else if (e > jspb.BinaryConstants.FLOAT64_MAX) jspb.utils.split64High = (t << 31 | 2146435072) >>> 0, jspb.utils.split64Low = 0;
                else if (e < jspb.BinaryConstants.FLOAT64_MIN) {
                    var o = e / Math.pow(2, -1074);
                    e = o / jspb.BinaryConstants.TWO_TO_32, jspb.utils.split64High = (t << 31 | e) >>> 0, jspb.utils.split64Low = o >>> 0
                } else {
                    var r = 0;
                    if (2 <= (o = e))
                        for (; 2 <= o && 1023 > r;) r++, o /= 2;
                    else
                        for (; 1 > o && -1022 < r;) o *= 2, r--;
                    e = (o = e * Math.pow(2, -r)) * jspb.BinaryConstants.TWO_TO_20 & 1048575, o = o * jspb.BinaryConstants.TWO_TO_52 >>> 0, jspb.utils.split64High = (t << 31 | r + 1023 << 20 | e) >>> 0, jspb.utils.split64Low = o
                }
            }, jspb.utils.splitHash64 = function(e) {
                var t = e.charCodeAt(0),
                    o = e.charCodeAt(1),
                    r = e.charCodeAt(2),
                    s = e.charCodeAt(3),
                    n = e.charCodeAt(4),
                    i = e.charCodeAt(5),
                    a = e.charCodeAt(6);
                e = e.charCodeAt(7), jspb.utils.split64Low = t + (o << 8) + (r << 16) + (s << 24) >>> 0, jspb.utils.split64High = n + (i << 8) + (a << 16) + (e << 24) >>> 0
            }, jspb.utils.joinUint64 = function(e, t) {
                return t * jspb.BinaryConstants.TWO_TO_32 + (e >>> 0)
            }, jspb.utils.joinInt64 = function(e, t) {
                var o = 2147483648 & t;
                return o && (t = ~t >>> 0, 0 == (e = 1 + ~e >>> 0) && (t = t + 1 >>> 0)), e = jspb.utils.joinUint64(e, t), o ? -e : e
            }, jspb.utils.toZigzag64 = function(e, t, o) {
                var r = t >> 31;
                return o(e << 1 ^ r, (t << 1 | e >>> 31) ^ r)
            }, jspb.utils.joinZigzag64 = function(e, t) {
                return jspb.utils.fromZigzag64(e, t, jspb.utils.joinInt64)
            }, jspb.utils.fromZigzag64 = function(e, t, o) {
                var r = -(1 & e);
                return o((e >>> 1 | t << 31) ^ r, t >>> 1 ^ r)
            }, jspb.utils.joinFloat32 = function(e, t) {
                t = 2 * (e >> 31) + 1;
                var o = e >>> 23 & 255;
                return e &= 8388607, 255 == o ? e ? NaN : 1 / 0 * t : 0 == o ? t * Math.pow(2, -149) * e : t * Math.pow(2, o - 150) * (e + Math.pow(2, 23))
            }, jspb.utils.joinFloat64 = function(e, t) {
                var o = 2 * (t >> 31) + 1,
                    r = t >>> 20 & 2047;
                return e = jspb.BinaryConstants.TWO_TO_32 * (1048575 & t) + e, 2047 == r ? e ? NaN : 1 / 0 * o : 0 == r ? o * Math.pow(2, -1074) * e : o * Math.pow(2, r - 1075) * (e + jspb.BinaryConstants.TWO_TO_52)
            }, jspb.utils.joinHash64 = function(e, t) {
                return String.fromCharCode(e >>> 0 & 255, e >>> 8 & 255, e >>> 16 & 255, e >>> 24 & 255, t >>> 0 & 255, t >>> 8 & 255, t >>> 16 & 255, t >>> 24 & 255)
            }, jspb.utils.DIGITS = "0123456789abcdef".split(""), jspb.utils.ZERO_CHAR_CODE_ = 48, jspb.utils.A_CHAR_CODE_ = 97, jspb.utils.joinUnsignedDecimalString = function(e, t) {
                function o(e, t) {
                    return e = e ? String(e) : "", t ? "0000000".slice(e.length) + e : e
                }
                if (2097151 >= t) return "" + (jspb.BinaryConstants.TWO_TO_32 * t + e);
                var r = (e >>> 24 | t << 8) >>> 0 & 16777215;
                return e = (16777215 & e) + 6777216 * r + 6710656 * (t = t >> 16 & 65535), r += 8147497 * t, t *= 2, 1e7 <= e && (r += Math.floor(e / 1e7), e %= 1e7), 1e7 <= r && (t += Math.floor(r / 1e7), r %= 1e7), o(t, 0) + o(r, t) + o(e, 1)
            }, jspb.utils.joinSignedDecimalString = function(e, t) {
                var o = 2147483648 & t;
                return o && (t = ~t + (0 == (e = 1 + ~e >>> 0) ? 1 : 0) >>> 0), e = jspb.utils.joinUnsignedDecimalString(e, t), o ? "-" + e : e
            }, jspb.utils.hash64ToDecimalString = function(e, t) {
                jspb.utils.splitHash64(e), e = jspb.utils.split64Low;
                var o = jspb.utils.split64High;
                return t ? jspb.utils.joinSignedDecimalString(e, o) : jspb.utils.joinUnsignedDecimalString(e, o)
            }, jspb.utils.hash64ArrayToDecimalStrings = function(e, t) {
                for (var o = Array(e.length), r = 0; r < e.length; r++) o[r] = jspb.utils.hash64ToDecimalString(e[r], t);
                return o
            }, jspb.utils.decimalStringToHash64 = function(e) {
                function t(e, t) {
                    for (var o = 0; 8 > o && (1 !== e || 0 < t); o++) t = e * r[o] + t, r[o] = 255 & t, t >>>= 8
                }
                goog.asserts.assert(0 < e.length);
                var o = !1;
                "-" === e[0] && (o = !0, e = e.slice(1));
                for (var r = [0, 0, 0, 0, 0, 0, 0, 0], s = 0; s < e.length; s++) t(10, e.charCodeAt(s) - jspb.utils.ZERO_CHAR_CODE_);
                return o && (function() {
                    for (var e = 0; 8 > e; e++) r[e] = 255 & ~r[e]
                }(), t(1, 1)), goog.crypt.byteArrayToString(r)
            }, jspb.utils.splitDecimalString = function(e) {
                jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(e))
            }, jspb.utils.toHexDigit_ = function(e) {
                return String.fromCharCode(10 > e ? jspb.utils.ZERO_CHAR_CODE_ + e : jspb.utils.A_CHAR_CODE_ - 10 + e)
            }, jspb.utils.fromHexCharCode_ = function(e) {
                return e >= jspb.utils.A_CHAR_CODE_ ? e - jspb.utils.A_CHAR_CODE_ + 10 : e - jspb.utils.ZERO_CHAR_CODE_
            }, jspb.utils.hash64ToHexString = function(e) {
                var t = Array(18);
                t[0] = "0", t[1] = "x";
                for (var o = 0; 8 > o; o++) {
                    var r = e.charCodeAt(7 - o);
                    t[2 * o + 2] = jspb.utils.toHexDigit_(r >> 4), t[2 * o + 3] = jspb.utils.toHexDigit_(15 & r)
                }
                return t.join("")
            }, jspb.utils.hexStringToHash64 = function(e) {
                e = e.toLowerCase(), goog.asserts.assert(18 == e.length), goog.asserts.assert("0" == e[0]), goog.asserts.assert("x" == e[1]);
                for (var t = "", o = 0; 8 > o; o++) {
                    var r = jspb.utils.fromHexCharCode_(e.charCodeAt(2 * o + 2)),
                        s = jspb.utils.fromHexCharCode_(e.charCodeAt(2 * o + 3));
                    t = String.fromCharCode(16 * r + s) + t
                }
                return t
            }, jspb.utils.hash64ToNumber = function(e, t) {
                jspb.utils.splitHash64(e), e = jspb.utils.split64Low;
                var o = jspb.utils.split64High;
                return t ? jspb.utils.joinInt64(e, o) : jspb.utils.joinUint64(e, o)
            }, jspb.utils.numberToHash64 = function(e) {
                return jspb.utils.splitInt64(e), jspb.utils.joinHash64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.utils.countVarints = function(e, t, o) {
                for (var r = 0, s = t; s < o; s++) r += e[s] >> 7;
                return o - t - r
            }, jspb.utils.countVarintFields = function(e, t, o, r) {
                var s = 0;
                if (128 > (r = 8 * r + jspb.BinaryConstants.WireType.VARINT))
                    for (; t < o && e[t++] == r;)
                        for (s++;;) {
                            var n = e[t++];
                            if (0 == (128 & n)) break
                        } else
                            for (; t < o;) {
                                for (n = r; 128 < n;) {
                                    if (e[t] != (127 & n | 128)) return s;
                                    t++, n >>= 7
                                }
                                if (e[t++] != n) break;
                                for (s++; 0 != (128 & (n = e[t++])););
                            }
                return s
            }, jspb.utils.countFixedFields_ = function(e, t, o, r, s) {
                var n = 0;
                if (128 > r)
                    for (; t < o && e[t++] == r;) n++, t += s;
                else
                    for (; t < o;) {
                        for (var i = r; 128 < i;) {
                            if (e[t++] != (127 & i | 128)) return n;
                            i >>= 7
                        }
                        if (e[t++] != i) break;
                        n++, t += s
                    }
                return n
            }, jspb.utils.countFixed32Fields = function(e, t, o, r) {
                return jspb.utils.countFixedFields_(e, t, o, 8 * r + jspb.BinaryConstants.WireType.FIXED32, 4)
            }, jspb.utils.countFixed64Fields = function(e, t, o, r) {
                return jspb.utils.countFixedFields_(e, t, o, 8 * r + jspb.BinaryConstants.WireType.FIXED64, 8)
            }, jspb.utils.countDelimitedFields = function(e, t, o, r) {
                var s = 0;
                for (r = 8 * r + jspb.BinaryConstants.WireType.DELIMITED; t < o;) {
                    for (var n = r; 128 < n;) {
                        if (e[t++] != (127 & n | 128)) return s;
                        n >>= 7
                    }
                    if (e[t++] != n) break;
                    s++;
                    for (var i = 0, a = 1; i += (127 & (n = e[t++])) * a, a *= 128, 0 != (128 & n););
                    t += i
                }
                return s
            }, jspb.utils.debugBytesToTextFormat = function(e) {
                var t = '"';
                if (e) {
                    e = jspb.utils.byteSourceToUint8Array(e);
                    for (var o = 0; o < e.length; o++) t += "\\x", 16 > e[o] && (t += "0"), t += e[o].toString(16)
                }
                return t + '"'
            }, jspb.utils.debugScalarToTextFormat = function(e) {
                return "string" == typeof e ? goog.string.quote(e) : e.toString()
            }, jspb.utils.stringToByteArray = function(e) {
                for (var t = new Uint8Array(e.length), o = 0; o < e.length; o++) {
                    var r = e.charCodeAt(o);
                    if (255 < r) throw Error("Conversion error: string contains codepoint outside of byte range");
                    t[o] = r
                }
                return t
            }, jspb.utils.byteSourceToUint8Array = function(e) {
                return e.constructor === Uint8Array ? e : e.constructor === ArrayBuffer || void 0 !== Buffer && e.constructor === Buffer || e.constructor === Array ? new Uint8Array(e) : e.constructor === String ? goog.crypt.base64.decodeStringToUint8Array(e) : (goog.asserts.fail("Type not convertible to Uint8Array."), new Uint8Array(0))
            }, jspb.BinaryDecoder = function(e, t, o) {
                this.bytes_ = null, this.cursor_ = this.end_ = this.start_ = 0, this.error_ = !1, e && this.setBlock(e, t, o)
            }, jspb.BinaryDecoder.instanceCache_ = [], jspb.BinaryDecoder.alloc = function(e, t, o) {
                if (jspb.BinaryDecoder.instanceCache_.length) {
                    var r = jspb.BinaryDecoder.instanceCache_.pop();
                    return e && r.setBlock(e, t, o), r
                }
                return new jspb.BinaryDecoder(e, t, o)
            }, jspb.BinaryDecoder.prototype.free = function() {
                this.clear(), 100 > jspb.BinaryDecoder.instanceCache_.length && jspb.BinaryDecoder.instanceCache_.push(this)
            }, jspb.BinaryDecoder.prototype.clone = function() {
                return jspb.BinaryDecoder.alloc(this.bytes_, this.start_, this.end_ - this.start_)
            }, jspb.BinaryDecoder.prototype.clear = function() {
                this.bytes_ = null, this.cursor_ = this.end_ = this.start_ = 0, this.error_ = !1
            }, jspb.BinaryDecoder.prototype.getBuffer = function() {
                return this.bytes_
            }, jspb.BinaryDecoder.prototype.setBlock = function(e, t, o) {
                this.bytes_ = jspb.utils.byteSourceToUint8Array(e), this.start_ = void 0 !== t ? t : 0, this.end_ = void 0 !== o ? this.start_ + o : this.bytes_.length, this.cursor_ = this.start_
            }, jspb.BinaryDecoder.prototype.getEnd = function() {
                return this.end_
            }, jspb.BinaryDecoder.prototype.setEnd = function(e) {
                this.end_ = e
            }, jspb.BinaryDecoder.prototype.reset = function() {
                this.cursor_ = this.start_
            }, jspb.BinaryDecoder.prototype.getCursor = function() {
                return this.cursor_
            }, jspb.BinaryDecoder.prototype.setCursor = function(e) {
                this.cursor_ = e
            }, jspb.BinaryDecoder.prototype.advance = function(e) {
                this.cursor_ += e, goog.asserts.assert(this.cursor_ <= this.end_)
            }, jspb.BinaryDecoder.prototype.atEnd = function() {
                return this.cursor_ == this.end_
            }, jspb.BinaryDecoder.prototype.pastEnd = function() {
                return this.cursor_ > this.end_
            }, jspb.BinaryDecoder.prototype.getError = function() {
                return this.error_ || 0 > this.cursor_ || this.cursor_ > this.end_
            }, jspb.BinaryDecoder.prototype.readSplitVarint64 = function(e) {
                for (var t = 128, o = 0, r = 0, s = 0; 4 > s && 128 <= t; s++) o |= (127 & (t = this.bytes_[this.cursor_++])) << 7 * s;
                if (128 <= t && (o |= (127 & (t = this.bytes_[this.cursor_++])) << 28, r |= (127 & t) >> 4), 128 <= t)
                    for (s = 0; 5 > s && 128 <= t; s++) r |= (127 & (t = this.bytes_[this.cursor_++])) << 7 * s + 3;
                if (128 > t) return e(o >>> 0, r >>> 0);
                goog.asserts.fail("Failed to read varint, encoding is invalid."), this.error_ = !0
            }, jspb.BinaryDecoder.prototype.readSplitZigzagVarint64 = function(e) {
                return this.readSplitVarint64(function(t, o) {
                    return jspb.utils.fromZigzag64(t, o, e)
                })
            }, jspb.BinaryDecoder.prototype.readSplitFixed64 = function(e) {
                var t = this.bytes_,
                    o = this.cursor_;
                this.cursor_ += 8;
                for (var r = 0, s = 0, n = o + 7; n >= o; n--) r = r << 8 | t[n], s = s << 8 | t[n + 4];
                return e(r, s)
            }, jspb.BinaryDecoder.prototype.skipVarint = function() {
                for (; 128 & this.bytes_[this.cursor_];) this.cursor_++;
                this.cursor_++
            }, jspb.BinaryDecoder.prototype.unskipVarint = function(e) {
                for (; 128 < e;) this.cursor_--, e >>>= 7;
                this.cursor_--
            }, jspb.BinaryDecoder.prototype.readUnsignedVarint32 = function() {
                var e = this.bytes_,
                    t = e[this.cursor_ + 0],
                    o = 127 & t;
                return 128 > t ? (this.cursor_ += 1, goog.asserts.assert(this.cursor_ <= this.end_), o) : (o |= (127 & (t = e[this.cursor_ + 1])) << 7, 128 > t ? (this.cursor_ += 2, goog.asserts.assert(this.cursor_ <= this.end_), o) : (o |= (127 & (t = e[this.cursor_ + 2])) << 14, 128 > t ? (this.cursor_ += 3, goog.asserts.assert(this.cursor_ <= this.end_), o) : (o |= (127 & (t = e[this.cursor_ + 3])) << 21, 128 > t ? (this.cursor_ += 4, goog.asserts.assert(this.cursor_ <= this.end_), o) : (o |= (15 & (t = e[this.cursor_ + 4])) << 28, 128 > t ? (this.cursor_ += 5, goog.asserts.assert(this.cursor_ <= this.end_), o >>> 0) : (this.cursor_ += 5, 128 <= e[this.cursor_++] && 128 <= e[this.cursor_++] && 128 <= e[this.cursor_++] && 128 <= e[this.cursor_++] && 128 <= e[this.cursor_++] && goog.asserts.assert(!1), goog.asserts.assert(this.cursor_ <= this.end_), o)))))
            }, jspb.BinaryDecoder.prototype.readSignedVarint32 = jspb.BinaryDecoder.prototype.readUnsignedVarint32, jspb.BinaryDecoder.prototype.readUnsignedVarint32String = function() {
                return this.readUnsignedVarint32().toString()
            }, jspb.BinaryDecoder.prototype.readSignedVarint32String = function() {
                return this.readSignedVarint32().toString()
            }, jspb.BinaryDecoder.prototype.readZigzagVarint32 = function() {
                var e = this.readUnsignedVarint32();
                return e >>> 1 ^ -(1 & e)
            }, jspb.BinaryDecoder.prototype.readUnsignedVarint64 = function() {
                return this.readSplitVarint64(jspb.utils.joinUint64)
            }, jspb.BinaryDecoder.prototype.readUnsignedVarint64String = function() {
                return this.readSplitVarint64(jspb.utils.joinUnsignedDecimalString)
            }, jspb.BinaryDecoder.prototype.readSignedVarint64 = function() {
                return this.readSplitVarint64(jspb.utils.joinInt64)
            }, jspb.BinaryDecoder.prototype.readSignedVarint64String = function() {
                return this.readSplitVarint64(jspb.utils.joinSignedDecimalString)
            }, jspb.BinaryDecoder.prototype.readZigzagVarint64 = function() {
                return this.readSplitVarint64(jspb.utils.joinZigzag64)
            }, jspb.BinaryDecoder.prototype.readZigzagVarintHash64 = function() {
                return this.readSplitZigzagVarint64(jspb.utils.joinHash64)
            }, jspb.BinaryDecoder.prototype.readZigzagVarint64String = function() {
                return this.readSplitZigzagVarint64(jspb.utils.joinSignedDecimalString)
            }, jspb.BinaryDecoder.prototype.readUint8 = function() {
                var e = this.bytes_[this.cursor_ + 0];
                return this.cursor_ += 1, goog.asserts.assert(this.cursor_ <= this.end_), e
            }, jspb.BinaryDecoder.prototype.readUint16 = function() {
                var e = this.bytes_[this.cursor_ + 0],
                    t = this.bytes_[this.cursor_ + 1];
                return this.cursor_ += 2, goog.asserts.assert(this.cursor_ <= this.end_), e << 0 | t << 8
            }, jspb.BinaryDecoder.prototype.readUint32 = function() {
                var e = this.bytes_[this.cursor_ + 0],
                    t = this.bytes_[this.cursor_ + 1],
                    o = this.bytes_[this.cursor_ + 2],
                    r = this.bytes_[this.cursor_ + 3];
                return this.cursor_ += 4, goog.asserts.assert(this.cursor_ <= this.end_), (e << 0 | t << 8 | o << 16 | r << 24) >>> 0
            }, jspb.BinaryDecoder.prototype.readUint64 = function() {
                var e = this.readUint32(),
                    t = this.readUint32();
                return jspb.utils.joinUint64(e, t)
            }, jspb.BinaryDecoder.prototype.readUint64String = function() {
                var e = this.readUint32(),
                    t = this.readUint32();
                return jspb.utils.joinUnsignedDecimalString(e, t)
            }, jspb.BinaryDecoder.prototype.readInt8 = function() {
                var e = this.bytes_[this.cursor_ + 0];
                return this.cursor_ += 1, goog.asserts.assert(this.cursor_ <= this.end_), e << 24 >> 24
            }, jspb.BinaryDecoder.prototype.readInt16 = function() {
                var e = this.bytes_[this.cursor_ + 0],
                    t = this.bytes_[this.cursor_ + 1];
                return this.cursor_ += 2, goog.asserts.assert(this.cursor_ <= this.end_), (e << 0 | t << 8) << 16 >> 16
            }, jspb.BinaryDecoder.prototype.readInt32 = function() {
                var e = this.bytes_[this.cursor_ + 0],
                    t = this.bytes_[this.cursor_ + 1],
                    o = this.bytes_[this.cursor_ + 2],
                    r = this.bytes_[this.cursor_ + 3];
                return this.cursor_ += 4, goog.asserts.assert(this.cursor_ <= this.end_), e << 0 | t << 8 | o << 16 | r << 24
            }, jspb.BinaryDecoder.prototype.readInt64 = function() {
                var e = this.readUint32(),
                    t = this.readUint32();
                return jspb.utils.joinInt64(e, t)
            }, jspb.BinaryDecoder.prototype.readInt64String = function() {
                var e = this.readUint32(),
                    t = this.readUint32();
                return jspb.utils.joinSignedDecimalString(e, t)
            }, jspb.BinaryDecoder.prototype.readFloat = function() {
                var e = this.readUint32();
                return jspb.utils.joinFloat32(e, 0)
            }, jspb.BinaryDecoder.prototype.readDouble = function() {
                var e = this.readUint32(),
                    t = this.readUint32();
                return jspb.utils.joinFloat64(e, t)
            }, jspb.BinaryDecoder.prototype.readBool = function() {
                return !!this.bytes_[this.cursor_++]
            }, jspb.BinaryDecoder.prototype.readEnum = function() {
                return this.readSignedVarint32()
            }, jspb.BinaryDecoder.prototype.readString = function(e) {
                var t = this.bytes_,
                    o = this.cursor_;
                e = o + e;
                for (var r = [], s = ""; o < e;) {
                    var n = t[o++];
                    if (128 > n) r.push(n);
                    else {
                        if (192 > n) continue;
                        if (224 > n) {
                            var i = t[o++];
                            r.push((31 & n) << 6 | 63 & i)
                        } else if (240 > n) {
                            i = t[o++];
                            var a = t[o++];
                            r.push((15 & n) << 12 | (63 & i) << 6 | 63 & a)
                        } else 248 > n && (n = (7 & n) << 18 | (63 & (i = t[o++])) << 12 | (63 & (a = t[o++])) << 6 | 63 & t[o++], n -= 65536, r.push(55296 + (n >> 10 & 1023), 56320 + (1023 & n)))
                    }
                    8192 <= r.length && (s += String.fromCharCode.apply(null, r), r.length = 0)
                }
                return s += goog.crypt.byteArrayToString(r), this.cursor_ = o, s
            }, jspb.BinaryDecoder.prototype.readStringWithLength = function() {
                var e = this.readUnsignedVarint32();
                return this.readString(e)
            }, jspb.BinaryDecoder.prototype.readBytes = function(e) {
                if (0 > e || this.cursor_ + e > this.bytes_.length) return this.error_ = !0, goog.asserts.fail("Invalid byte length!"), new Uint8Array(0);
                var t = this.bytes_.subarray(this.cursor_, this.cursor_ + e);
                return this.cursor_ += e, goog.asserts.assert(this.cursor_ <= this.end_), t
            }, jspb.BinaryDecoder.prototype.readVarintHash64 = function() {
                return this.readSplitVarint64(jspb.utils.joinHash64)
            }, jspb.BinaryDecoder.prototype.readFixedHash64 = function() {
                var e = this.bytes_,
                    t = this.cursor_,
                    o = e[t + 0],
                    r = e[t + 1],
                    s = e[t + 2],
                    n = e[t + 3],
                    i = e[t + 4],
                    a = e[t + 5],
                    g = e[t + 6];
                return e = e[t + 7], this.cursor_ += 8, String.fromCharCode(o, r, s, n, i, a, g, e)
            }, jspb.BinaryReader = function(e, t, o) {
                this.decoder_ = jspb.BinaryDecoder.alloc(e, t, o), this.fieldCursor_ = this.decoder_.getCursor(), this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER, this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID, this.error_ = !1, this.readCallbacks_ = null
            }, jspb.BinaryReader.instanceCache_ = [], jspb.BinaryReader.alloc = function(e, t, o) {
                if (jspb.BinaryReader.instanceCache_.length) {
                    var r = jspb.BinaryReader.instanceCache_.pop();
                    return e && r.decoder_.setBlock(e, t, o), r
                }
                return new jspb.BinaryReader(e, t, o)
            }, jspb.BinaryReader.prototype.alloc = jspb.BinaryReader.alloc, jspb.BinaryReader.prototype.free = function() {
                this.decoder_.clear(), this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER, this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID, this.error_ = !1, this.readCallbacks_ = null, 100 > jspb.BinaryReader.instanceCache_.length && jspb.BinaryReader.instanceCache_.push(this)
            }, jspb.BinaryReader.prototype.getFieldCursor = function() {
                return this.fieldCursor_
            }, jspb.BinaryReader.prototype.getCursor = function() {
                return this.decoder_.getCursor()
            }, jspb.BinaryReader.prototype.getBuffer = function() {
                return this.decoder_.getBuffer()
            }, jspb.BinaryReader.prototype.getFieldNumber = function() {
                return this.nextField_
            }, jspb.BinaryReader.prototype.getWireType = function() {
                return this.nextWireType_
            }, jspb.BinaryReader.prototype.isEndGroup = function() {
                return this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP
            }, jspb.BinaryReader.prototype.getError = function() {
                return this.error_ || this.decoder_.getError()
            }, jspb.BinaryReader.prototype.setBlock = function(e, t, o) {
                this.decoder_.setBlock(e, t, o), this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER, this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID
            }, jspb.BinaryReader.prototype.reset = function() {
                this.decoder_.reset(), this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER, this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID
            }, jspb.BinaryReader.prototype.advance = function(e) {
                this.decoder_.advance(e)
            }, jspb.BinaryReader.prototype.nextField = function() {
                if (this.decoder_.atEnd()) return !1;
                if (this.getError()) return goog.asserts.fail("Decoder hit an error"), !1;
                this.fieldCursor_ = this.decoder_.getCursor();
                var e = this.decoder_.readUnsignedVarint32(),
                    t = e >>> 3;
                return (e &= 7) != jspb.BinaryConstants.WireType.VARINT && e != jspb.BinaryConstants.WireType.FIXED32 && e != jspb.BinaryConstants.WireType.FIXED64 && e != jspb.BinaryConstants.WireType.DELIMITED && e != jspb.BinaryConstants.WireType.START_GROUP && e != jspb.BinaryConstants.WireType.END_GROUP ? (goog.asserts.fail("Invalid wire type: %s (at position %s)", e, this.fieldCursor_), this.error_ = !0, !1) : (this.nextField_ = t, this.nextWireType_ = e, !0)
            }, jspb.BinaryReader.prototype.unskipHeader = function() {
                this.decoder_.unskipVarint(this.nextField_ << 3 | this.nextWireType_)
            }, jspb.BinaryReader.prototype.skipMatchingFields = function() {
                var e = this.nextField_;
                for (this.unskipHeader(); this.nextField() && this.getFieldNumber() == e;) this.skipField();
                this.decoder_.atEnd() || this.unskipHeader()
            }, jspb.BinaryReader.prototype.skipVarintField = function() {
                this.nextWireType_ != jspb.BinaryConstants.WireType.VARINT ? (goog.asserts.fail("Invalid wire type for skipVarintField"), this.skipField()) : this.decoder_.skipVarint()
            }, jspb.BinaryReader.prototype.skipDelimitedField = function() {
                if (this.nextWireType_ != jspb.BinaryConstants.WireType.DELIMITED) goog.asserts.fail("Invalid wire type for skipDelimitedField"), this.skipField();
                else {
                    var e = this.decoder_.readUnsignedVarint32();
                    this.decoder_.advance(e)
                }
            }, jspb.BinaryReader.prototype.skipFixed32Field = function() {
                this.nextWireType_ != jspb.BinaryConstants.WireType.FIXED32 ? (goog.asserts.fail("Invalid wire type for skipFixed32Field"), this.skipField()) : this.decoder_.advance(4)
            }, jspb.BinaryReader.prototype.skipFixed64Field = function() {
                this.nextWireType_ != jspb.BinaryConstants.WireType.FIXED64 ? (goog.asserts.fail("Invalid wire type for skipFixed64Field"), this.skipField()) : this.decoder_.advance(8)
            }, jspb.BinaryReader.prototype.skipGroup = function() {
                for (var e = this.nextField_;;) {
                    if (!this.nextField()) {
                        goog.asserts.fail("Unmatched start-group tag: stream EOF"), this.error_ = !0;
                        break
                    }
                    if (this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP) {
                        this.nextField_ != e && (goog.asserts.fail("Unmatched end-group tag"), this.error_ = !0);
                        break
                    }
                    this.skipField()
                }
            }, jspb.BinaryReader.prototype.skipField = function() {
                switch (this.nextWireType_) {
                    case jspb.BinaryConstants.WireType.VARINT:
                        this.skipVarintField();
                        break;
                    case jspb.BinaryConstants.WireType.FIXED64:
                        this.skipFixed64Field();
                        break;
                    case jspb.BinaryConstants.WireType.DELIMITED:
                        this.skipDelimitedField();
                        break;
                    case jspb.BinaryConstants.WireType.FIXED32:
                        this.skipFixed32Field();
                        break;
                    case jspb.BinaryConstants.WireType.START_GROUP:
                        this.skipGroup();
                        break;
                    default:
                        goog.asserts.fail("Invalid wire encoding for field.")
                }
            }, jspb.BinaryReader.prototype.registerReadCallback = function(e, t) {
                null === this.readCallbacks_ && (this.readCallbacks_ = {}), goog.asserts.assert(!this.readCallbacks_[e]), this.readCallbacks_[e] = t
            }, jspb.BinaryReader.prototype.runReadCallback = function(e) {
                return goog.asserts.assert(null !== this.readCallbacks_), e = this.readCallbacks_[e], goog.asserts.assert(e), e(this)
            }, jspb.BinaryReader.prototype.readAny = function(e) {
                this.nextWireType_ = jspb.BinaryConstants.FieldTypeToWireType(e);
                var t = jspb.BinaryConstants.FieldType;
                switch (e) {
                    case t.DOUBLE:
                        return this.readDouble();
                    case t.FLOAT:
                        return this.readFloat();
                    case t.INT64:
                        return this.readInt64();
                    case t.UINT64:
                        return this.readUint64();
                    case t.INT32:
                        return this.readInt32();
                    case t.FIXED64:
                        return this.readFixed64();
                    case t.FIXED32:
                        return this.readFixed32();
                    case t.BOOL:
                        return this.readBool();
                    case t.STRING:
                        return this.readString();
                    case t.GROUP:
                        goog.asserts.fail("Group field type not supported in readAny()");
                    case t.MESSAGE:
                        goog.asserts.fail("Message field type not supported in readAny()");
                    case t.BYTES:
                        return this.readBytes();
                    case t.UINT32:
                        return this.readUint32();
                    case t.ENUM:
                        return this.readEnum();
                    case t.SFIXED32:
                        return this.readSfixed32();
                    case t.SFIXED64:
                        return this.readSfixed64();
                    case t.SINT32:
                        return this.readSint32();
                    case t.SINT64:
                        return this.readSint64();
                    case t.FHASH64:
                        return this.readFixedHash64();
                    case t.VHASH64:
                        return this.readVarintHash64();
                    default:
                        goog.asserts.fail("Invalid field type in readAny()")
                }
                return 0
            }, jspb.BinaryReader.prototype.readMessage = function(e, t) {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
                var o = this.decoder_.getEnd(),
                    r = this.decoder_.readUnsignedVarint32();
                r = this.decoder_.getCursor() + r, this.decoder_.setEnd(r), t(e, this), this.decoder_.setCursor(r), this.decoder_.setEnd(o)
            }, jspb.BinaryReader.prototype.readGroup = function(e, t, o) {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.START_GROUP), goog.asserts.assert(this.nextField_ == e), o(t, this), this.error_ || this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP || (goog.asserts.fail("Group submessage did not end with an END_GROUP tag"), this.error_ = !0)
            }, jspb.BinaryReader.prototype.getFieldDecoder = function() {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
                var e = this.decoder_.readUnsignedVarint32(),
                    t = this.decoder_.getCursor(),
                    o = t + e;
                return e = jspb.BinaryDecoder.alloc(this.decoder_.getBuffer(), t, e), this.decoder_.setCursor(o), e
            }, jspb.BinaryReader.prototype.readInt32 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSignedVarint32()
            }, jspb.BinaryReader.prototype.readInt32String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSignedVarint32String()
            }, jspb.BinaryReader.prototype.readInt64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSignedVarint64()
            }, jspb.BinaryReader.prototype.readInt64String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSignedVarint64String()
            }, jspb.BinaryReader.prototype.readUint32 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readUnsignedVarint32()
            }, jspb.BinaryReader.prototype.readUint32String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readUnsignedVarint32String()
            }, jspb.BinaryReader.prototype.readUint64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readUnsignedVarint64()
            }, jspb.BinaryReader.prototype.readUint64String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readUnsignedVarint64String()
            }, jspb.BinaryReader.prototype.readSint32 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readZigzagVarint32()
            }, jspb.BinaryReader.prototype.readSint64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readZigzagVarint64()
            }, jspb.BinaryReader.prototype.readSint64String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readZigzagVarint64String()
            }, jspb.BinaryReader.prototype.readFixed32 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32), this.decoder_.readUint32()
            }, jspb.BinaryReader.prototype.readFixed64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readUint64()
            }, jspb.BinaryReader.prototype.readFixed64String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readUint64String()
            }, jspb.BinaryReader.prototype.readSfixed32 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32), this.decoder_.readInt32()
            }, jspb.BinaryReader.prototype.readSfixed32String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32), this.decoder_.readInt32().toString()
            }, jspb.BinaryReader.prototype.readSfixed64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readInt64()
            }, jspb.BinaryReader.prototype.readSfixed64String = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readInt64String()
            }, jspb.BinaryReader.prototype.readFloat = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32), this.decoder_.readFloat()
            }, jspb.BinaryReader.prototype.readDouble = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readDouble()
            }, jspb.BinaryReader.prototype.readBool = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), !!this.decoder_.readUnsignedVarint32()
            }, jspb.BinaryReader.prototype.readEnum = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSignedVarint64()
            }, jspb.BinaryReader.prototype.readString = function() {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
                var e = this.decoder_.readUnsignedVarint32();
                return this.decoder_.readString(e)
            }, jspb.BinaryReader.prototype.readBytes = function() {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
                var e = this.decoder_.readUnsignedVarint32();
                return this.decoder_.readBytes(e)
            }, jspb.BinaryReader.prototype.readVarintHash64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readVarintHash64()
            }, jspb.BinaryReader.prototype.readSintHash64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readZigzagVarintHash64()
            }, jspb.BinaryReader.prototype.readSplitVarint64 = function(e) {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSplitVarint64(e)
            }, jspb.BinaryReader.prototype.readSplitZigzagVarint64 = function(e) {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT), this.decoder_.readSplitVarint64(function(t, o) {
                    return jspb.utils.fromZigzag64(t, o, e)
                })
            }, jspb.BinaryReader.prototype.readFixedHash64 = function() {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readFixedHash64()
            }, jspb.BinaryReader.prototype.readSplitFixed64 = function(e) {
                return goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64), this.decoder_.readSplitFixed64(e)
            }, jspb.BinaryReader.prototype.readPackedField_ = function(e) {
                goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
                var t = this.decoder_.readUnsignedVarint32();
                t = this.decoder_.getCursor() + t;
                for (var o = []; this.decoder_.getCursor() < t;) o.push(e.call(this.decoder_));
                return o
            }, jspb.BinaryReader.prototype.readPackedInt32 = function() {
                return this.readPackedField_(this.decoder_.readSignedVarint32)
            }, jspb.BinaryReader.prototype.readPackedInt32String = function() {
                return this.readPackedField_(this.decoder_.readSignedVarint32String)
            }, jspb.BinaryReader.prototype.readPackedInt64 = function() {
                return this.readPackedField_(this.decoder_.readSignedVarint64)
            }, jspb.BinaryReader.prototype.readPackedInt64String = function() {
                return this.readPackedField_(this.decoder_.readSignedVarint64String)
            }, jspb.BinaryReader.prototype.readPackedUint32 = function() {
                return this.readPackedField_(this.decoder_.readUnsignedVarint32)
            }, jspb.BinaryReader.prototype.readPackedUint32String = function() {
                return this.readPackedField_(this.decoder_.readUnsignedVarint32String)
            }, jspb.BinaryReader.prototype.readPackedUint64 = function() {
                return this.readPackedField_(this.decoder_.readUnsignedVarint64)
            }, jspb.BinaryReader.prototype.readPackedUint64String = function() {
                return this.readPackedField_(this.decoder_.readUnsignedVarint64String)
            }, jspb.BinaryReader.prototype.readPackedSint32 = function() {
                return this.readPackedField_(this.decoder_.readZigzagVarint32)
            }, jspb.BinaryReader.prototype.readPackedSint64 = function() {
                return this.readPackedField_(this.decoder_.readZigzagVarint64)
            }, jspb.BinaryReader.prototype.readPackedSint64String = function() {
                return this.readPackedField_(this.decoder_.readZigzagVarint64String)
            }, jspb.BinaryReader.prototype.readPackedFixed32 = function() {
                return this.readPackedField_(this.decoder_.readUint32)
            }, jspb.BinaryReader.prototype.readPackedFixed64 = function() {
                return this.readPackedField_(this.decoder_.readUint64)
            }, jspb.BinaryReader.prototype.readPackedFixed64String = function() {
                return this.readPackedField_(this.decoder_.readUint64String)
            }, jspb.BinaryReader.prototype.readPackedSfixed32 = function() {
                return this.readPackedField_(this.decoder_.readInt32)
            }, jspb.BinaryReader.prototype.readPackedSfixed64 = function() {
                return this.readPackedField_(this.decoder_.readInt64)
            }, jspb.BinaryReader.prototype.readPackedSfixed64String = function() {
                return this.readPackedField_(this.decoder_.readInt64String)
            }, jspb.BinaryReader.prototype.readPackedFloat = function() {
                return this.readPackedField_(this.decoder_.readFloat)
            }, jspb.BinaryReader.prototype.readPackedDouble = function() {
                return this.readPackedField_(this.decoder_.readDouble)
            }, jspb.BinaryReader.prototype.readPackedBool = function() {
                return this.readPackedField_(this.decoder_.readBool)
            }, jspb.BinaryReader.prototype.readPackedEnum = function() {
                return this.readPackedField_(this.decoder_.readEnum)
            }, jspb.BinaryReader.prototype.readPackedVarintHash64 = function() {
                return this.readPackedField_(this.decoder_.readVarintHash64)
            }, jspb.BinaryReader.prototype.readPackedFixedHash64 = function() {
                return this.readPackedField_(this.decoder_.readFixedHash64)
            }, jspb.Map = function(e, t) {
                this.arr_ = e, this.valueCtor_ = t, this.map_ = {}, this.arrClean = !0, 0 < this.arr_.length && this.loadFromArray_()
            }, jspb.Map.prototype.loadFromArray_ = function() {
                for (var e = 0; e < this.arr_.length; e++) {
                    var t = this.arr_[e],
                        o = t[0];
                    this.map_[o.toString()] = new jspb.Map.Entry_(o, t[1])
                }
                this.arrClean = !0
            }, jspb.Map.prototype.toArray = function() {
                if (this.arrClean) {
                    if (this.valueCtor_) {
                        var e, t = this.map_;
                        for (e in t)
                            if (Object.prototype.hasOwnProperty.call(t, e)) {
                                var o = t[e].valueWrapper;
                                o && o.toArray()
                            }
                    }
                } else {
                    for (this.arr_.length = 0, (t = this.stringKeys_()).sort(), e = 0; e < t.length; e++) {
                        var r = this.map_[t[e]];
                        (o = r.valueWrapper) && o.toArray(), this.arr_.push([r.key, r.value])
                    }
                    this.arrClean = !0
                }
                return this.arr_
            }, jspb.Map.prototype.toObject = function(e, t) {
                for (var o = this.toArray(), r = [], s = 0; s < o.length; s++) {
                    var n = this.map_[o[s][0].toString()];
                    this.wrapEntry_(n);
                    var i = n.valueWrapper;
                    i ? (goog.asserts.assert(t), r.push([n.key, t(e, i)])) : r.push([n.key, n.value])
                }
                return r
            }, jspb.Map.fromObject = function(e, t, o) {
                t = new jspb.Map([], t);
                for (var r = 0; r < e.length; r++) {
                    var s = e[r][0],
                        n = o(e[r][1]);
                    t.set(s, n)
                }
                return t
            }, jspb.Map.ArrayIteratorIterable_ = function(e) {
                this.idx_ = 0, this.arr_ = e
            }, jspb.Map.ArrayIteratorIterable_.prototype.next = function() {
                return this.idx_ < this.arr_.length ? {
                    done: !1,
                    value: this.arr_[this.idx_++]
                } : {
                    done: !0,
                    value: void 0
                }
            }, "undefined" != typeof Symbol && (jspb.Map.ArrayIteratorIterable_.prototype[Symbol.iterator] = function() {
                return this
            }), jspb.Map.prototype.getLength = function() {
                return this.stringKeys_().length
            }, jspb.Map.prototype.clear = function() {
                this.map_ = {}, this.arrClean = !1
            }, jspb.Map.prototype.del = function(e) {
                e = e.toString();
                var t = this.map_.hasOwnProperty(e);
                return delete this.map_[e], this.arrClean = !1, t
            }, jspb.Map.prototype.getEntryList = function() {
                var e = [],
                    t = this.stringKeys_();
                t.sort();
                for (var o = 0; o < t.length; o++) {
                    var r = this.map_[t[o]];
                    e.push([r.key, r.value])
                }
                return e
            }, jspb.Map.prototype.entries = function() {
                var e = [],
                    t = this.stringKeys_();
                t.sort();
                for (var o = 0; o < t.length; o++) {
                    var r = this.map_[t[o]];
                    e.push([r.key, this.wrapEntry_(r)])
                }
                return new jspb.Map.ArrayIteratorIterable_(e)
            }, jspb.Map.prototype.keys = function() {
                var e = [],
                    t = this.stringKeys_();
                t.sort();
                for (var o = 0; o < t.length; o++) e.push(this.map_[t[o]].key);
                return new jspb.Map.ArrayIteratorIterable_(e)
            }, jspb.Map.prototype.values = function() {
                var e = [],
                    t = this.stringKeys_();
                t.sort();
                for (var o = 0; o < t.length; o++) e.push(this.wrapEntry_(this.map_[t[o]]));
                return new jspb.Map.ArrayIteratorIterable_(e)
            }, jspb.Map.prototype.forEach = function(e, t) {
                var o = this.stringKeys_();
                o.sort();
                for (var r = 0; r < o.length; r++) {
                    var s = this.map_[o[r]];
                    e.call(t, this.wrapEntry_(s), s.key, this)
                }
            }, jspb.Map.prototype.set = function(e, t) {
                var o = new jspb.Map.Entry_(e);
                return this.valueCtor_ ? (o.valueWrapper = t, o.value = t.toArray()) : o.value = t, this.map_[e.toString()] = o, this.arrClean = !1, this
            }, jspb.Map.prototype.wrapEntry_ = function(e) {
                return this.valueCtor_ ? (e.valueWrapper || (e.valueWrapper = new this.valueCtor_(e.value)), e.valueWrapper) : e.value
            }, jspb.Map.prototype.get = function(e) {
                if (e = this.map_[e.toString()]) return this.wrapEntry_(e)
            }, jspb.Map.prototype.has = function(e) {
                return e.toString() in this.map_
            }, jspb.Map.prototype.serializeBinary = function(e, t, o, r, s) {
                var n = this.stringKeys_();
                n.sort();
                for (var i = 0; i < n.length; i++) {
                    var a = this.map_[n[i]];
                    t.beginSubMessage(e), o.call(t, 1, a.key), this.valueCtor_ ? r.call(t, 2, this.wrapEntry_(a), s) : r.call(t, 2, a.value), t.endSubMessage()
                }
            }, jspb.Map.deserializeBinary = function(e, t, o, r, s, n, i) {
                for (; t.nextField() && !t.isEndGroup();) {
                    var a = t.getFieldNumber();
                    1 == a ? n = o.call(t) : 2 == a && (e.valueCtor_ ? (goog.asserts.assert(s), i || (i = new e.valueCtor_), r.call(t, i, s)) : i = r.call(t))
                }
                goog.asserts.assert(null != n), goog.asserts.assert(null != i), e.set(n, i)
            }, jspb.Map.prototype.stringKeys_ = function() {
                var e, t = this.map_,
                    o = [];
                for (e in t) Object.prototype.hasOwnProperty.call(t, e) && o.push(e);
                return o
            }, jspb.Map.Entry_ = function(e, t) {
                this.key = e, this.value = t, this.valueWrapper = void 0
            }, jspb.ExtensionFieldInfo = function(e, t, o, r, s) {
                this.fieldIndex = e, this.fieldName = t, this.ctor = o, this.toObjectFn = r, this.isRepeated = s
            }, jspb.ExtensionFieldBinaryInfo = function(e, t, o, r, s, n) {
                this.fieldInfo = e, this.binaryReaderFn = t, this.binaryWriterFn = o, this.binaryMessageSerializeFn = r, this.binaryMessageDeserializeFn = s, this.isPacked = n
            }, jspb.ExtensionFieldInfo.prototype.isMessageType = function() {
                return !!this.ctor
            }, jspb.Message = function() {}, jspb.Message.GENERATE_TO_OBJECT = !0, jspb.Message.GENERATE_FROM_OBJECT = !goog.DISALLOW_TEST_ONLY_CODE, jspb.Message.GENERATE_TO_STRING = !0, jspb.Message.ASSUME_LOCAL_ARRAYS = !1, jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS = !0, jspb.Message.SUPPORTS_UINT8ARRAY_ = "function" == typeof Uint8Array, jspb.Message.prototype.getJsPbMessageId = function() {
                return this.messageId_
            }, jspb.Message.getIndex_ = function(e, t) {
                return t + e.arrayIndexOffset_
            }, jspb.Message.hiddenES6Property_ = function() {}, jspb.Message.getFieldNumber_ = function(e, t) {
                return t - e.arrayIndexOffset_
            }, jspb.Message.initialize = function(e, t, o, r, s, n) {
                if (e.wrappers_ = null, t || (t = o ? [o] : []), e.messageId_ = o ? String(o) : void 0, e.arrayIndexOffset_ = 0 === o ? -1 : 0, e.array = t, jspb.Message.initPivotAndExtensionObject_(e, r), e.convertedPrimitiveFields_ = {}, jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS || (e.repeatedFields = s), s)
                    for (t = 0; t < s.length; t++)(o = s[t]) < e.pivot_ ? (o = jspb.Message.getIndex_(e, o), e.array[o] = e.array[o] || jspb.Message.EMPTY_LIST_SENTINEL_) : (jspb.Message.maybeInitEmptyExtensionObject_(e), e.extensionObject_[o] = e.extensionObject_[o] || jspb.Message.EMPTY_LIST_SENTINEL_);
                if (n && n.length)
                    for (t = 0; t < n.length; t++) jspb.Message.computeOneofCase(e, n[t])
            }, jspb.Message.EMPTY_LIST_SENTINEL_ = goog.DEBUG && Object.freeze ? Object.freeze([]) : [], jspb.Message.isArray_ = function(e) {
                return jspb.Message.ASSUME_LOCAL_ARRAYS ? e instanceof Array : goog.isArray(e)
            }, jspb.Message.isExtensionObject_ = function(e) {
                return !(null === e || "object" != typeof e || jspb.Message.isArray_(e) || jspb.Message.SUPPORTS_UINT8ARRAY_ && e instanceof Uint8Array)
            }, jspb.Message.initPivotAndExtensionObject_ = function(e, t) {
                var o = e.array.length,
                    r = -1;
                if (o && (r = o - 1, o = e.array[r], jspb.Message.isExtensionObject_(o))) return e.pivot_ = jspb.Message.getFieldNumber_(e, r), void(e.extensionObject_ = o); - 1 < t ? (e.pivot_ = Math.max(t, jspb.Message.getFieldNumber_(e, r + 1)), e.extensionObject_ = null) : e.pivot_ = Number.MAX_VALUE
            }, jspb.Message.maybeInitEmptyExtensionObject_ = function(e) {
                var t = jspb.Message.getIndex_(e, e.pivot_);
                e.array[t] || (e.extensionObject_ = e.array[t] = {})
            }, jspb.Message.toObjectList = function(e, t, o) {
                for (var r = [], s = 0; s < e.length; s++) r[s] = t.call(e[s], o, e[s]);
                return r
            }, jspb.Message.toObjectExtension = function(e, t, o, r, s) {
                for (var n in o) {
                    var i = o[n],
                        a = r.call(e, i);
                    if (null != a) {
                        for (var g in i.fieldName)
                            if (i.fieldName.hasOwnProperty(g)) break;
                        t[g] = i.toObjectFn ? i.isRepeated ? jspb.Message.toObjectList(a, i.toObjectFn, s) : i.toObjectFn(s, a) : a
                    }
                }
            }, jspb.Message.serializeBinaryExtensions = function(e, t, o, r) {
                for (var s in o) {
                    var n = o[s],
                        i = n.fieldInfo;
                    if (!n.binaryWriterFn) throw Error("Message extension present that was generated without binary serialization support");
                    var a = r.call(e, i);
                    if (null != a)
                        if (i.isMessageType()) {
                            if (!n.binaryMessageSerializeFn) throw Error("Message extension present holding submessage without binary support enabled, and message is being serialized to binary format");
                            n.binaryWriterFn.call(t, i.fieldIndex, a, n.binaryMessageSerializeFn)
                        } else n.binaryWriterFn.call(t, i.fieldIndex, a)
                }
            }, jspb.Message.readBinaryExtension = function(e, t, o, r, s) {
                var n = o[t.getFieldNumber()];
                if (n) {
                    if (o = n.fieldInfo, !n.binaryReaderFn) throw Error("Deserializing extension whose generated code does not support binary format");
                    if (o.isMessageType()) {
                        var i = new o.ctor;
                        n.binaryReaderFn.call(t, i, n.binaryMessageDeserializeFn)
                    } else i = n.binaryReaderFn.call(t);
                    o.isRepeated && !n.isPacked ? (t = r.call(e, o)) ? t.push(i) : s.call(e, o, [i]) : s.call(e, o, i)
                } else t.skipField()
            }, jspb.Message.getField = function(e, t) {
                if (t < e.pivot_) {
                    t = jspb.Message.getIndex_(e, t);
                    var o = e.array[t];
                    return o === jspb.Message.EMPTY_LIST_SENTINEL_ ? e.array[t] = [] : o
                }
                if (e.extensionObject_) return (o = e.extensionObject_[t]) === jspb.Message.EMPTY_LIST_SENTINEL_ ? e.extensionObject_[t] = [] : o
            }, jspb.Message.getRepeatedField = function(e, t) {
                return jspb.Message.getField(e, t)
            }, jspb.Message.getOptionalFloatingPointField = function(e, t) {
                return null == (e = jspb.Message.getField(e, t)) ? e : +e
            }, jspb.Message.getBooleanField = function(e, t) {
                return null == (e = jspb.Message.getField(e, t)) ? e : !!e
            }, jspb.Message.getRepeatedFloatingPointField = function(e, t) {
                var o = jspb.Message.getRepeatedField(e, t);
                if (e.convertedPrimitiveFields_ || (e.convertedPrimitiveFields_ = {}), !e.convertedPrimitiveFields_[t]) {
                    for (var r = 0; r < o.length; r++) o[r] = +o[r];
                    e.convertedPrimitiveFields_[t] = !0
                }
                return o
            }, jspb.Message.getRepeatedBooleanField = function(e, t) {
                var o = jspb.Message.getRepeatedField(e, t);
                if (e.convertedPrimitiveFields_ || (e.convertedPrimitiveFields_ = {}), !e.convertedPrimitiveFields_[t]) {
                    for (var r = 0; r < o.length; r++) o[r] = !!o[r];
                    e.convertedPrimitiveFields_[t] = !0
                }
                return o
            }, jspb.Message.bytesAsB64 = function(e) {
                return null == e || "string" == typeof e ? e : jspb.Message.SUPPORTS_UINT8ARRAY_ && e instanceof Uint8Array ? goog.crypt.base64.encodeByteArray(e) : (goog.asserts.fail("Cannot coerce to b64 string: " + goog.typeOf(e)), null)
            }, jspb.Message.bytesAsU8 = function(e) {
                return null == e || e instanceof Uint8Array ? e : "string" == typeof e ? goog.crypt.base64.decodeStringToUint8Array(e) : (goog.asserts.fail("Cannot coerce to Uint8Array: " + goog.typeOf(e)), null)
            }, jspb.Message.bytesListAsB64 = function(e) {
                return jspb.Message.assertConsistentTypes_(e), e.length && "string" != typeof e[0] ? goog.array.map(e, jspb.Message.bytesAsB64) : e
            }, jspb.Message.bytesListAsU8 = function(e) {
                return jspb.Message.assertConsistentTypes_(e), !e.length || e[0] instanceof Uint8Array ? e : goog.array.map(e, jspb.Message.bytesAsU8)
            }, jspb.Message.assertConsistentTypes_ = function(e) {
                if (goog.DEBUG && e && 1 < e.length) {
                    var t = goog.typeOf(e[0]);
                    goog.array.forEach(e, function(e) {
                        goog.typeOf(e) != t && goog.asserts.fail("Inconsistent type in JSPB repeated field array. Got " + goog.typeOf(e) + " expected " + t)
                    })
                }
            }, jspb.Message.getFieldWithDefault = function(e, t, o) {
                return null == (e = jspb.Message.getField(e, t)) ? o : e
            }, jspb.Message.getBooleanFieldWithDefault = function(e, t, o) {
                return null == (e = jspb.Message.getBooleanField(e, t)) ? o : e
            }, jspb.Message.getFloatingPointFieldWithDefault = function(e, t, o) {
                return null == (e = jspb.Message.getOptionalFloatingPointField(e, t)) ? o : e
            }, jspb.Message.getFieldProto3 = jspb.Message.getFieldWithDefault, jspb.Message.getMapField = function(e, t, o, r) {
                if (e.wrappers_ || (e.wrappers_ = {}), t in e.wrappers_) return e.wrappers_[t];
                var s = jspb.Message.getField(e, t);
                if (!s) {
                    if (o) return;
                    s = [], jspb.Message.setField(e, t, s)
                }
                return e.wrappers_[t] = new jspb.Map(s, r)
            }, jspb.Message.setField = function(e, t, o) {
                return goog.asserts.assertInstanceof(e, jspb.Message), t < e.pivot_ ? e.array[jspb.Message.getIndex_(e, t)] = o : (jspb.Message.maybeInitEmptyExtensionObject_(e), e.extensionObject_[t] = o), e
            }, jspb.Message.setProto3IntField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, 0)
            }, jspb.Message.setProto3FloatField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, 0)
            }, jspb.Message.setProto3BooleanField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, !1)
            }, jspb.Message.setProto3StringField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, "")
            }, jspb.Message.setProto3BytesField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, "")
            }, jspb.Message.setProto3EnumField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, 0)
            }, jspb.Message.setProto3StringIntField = function(e, t, o) {
                return jspb.Message.setFieldIgnoringDefault_(e, t, o, "0")
            }, jspb.Message.setFieldIgnoringDefault_ = function(e, t, o, r) {
                return goog.asserts.assertInstanceof(e, jspb.Message), o !== r ? jspb.Message.setField(e, t, o) : t < e.pivot_ ? e.array[jspb.Message.getIndex_(e, t)] = null : (jspb.Message.maybeInitEmptyExtensionObject_(e), delete e.extensionObject_[t]), e
            }, jspb.Message.addToRepeatedField = function(e, t, o, r) {
                return goog.asserts.assertInstanceof(e, jspb.Message), t = jspb.Message.getRepeatedField(e, t), null != r ? t.splice(r, 0, o) : t.push(o), e
            }, jspb.Message.setOneofField = function(e, t, o, r) {
                return goog.asserts.assertInstanceof(e, jspb.Message), (o = jspb.Message.computeOneofCase(e, o)) && o !== t && void 0 !== r && (e.wrappers_ && o in e.wrappers_ && (e.wrappers_[o] = void 0), jspb.Message.setField(e, o, void 0)), jspb.Message.setField(e, t, r)
            }, jspb.Message.computeOneofCase = function(e, t) {
                for (var o, r, s = 0; s < t.length; s++) {
                    var n = t[s],
                        i = jspb.Message.getField(e, n);
                    null != i && (o = n, r = i, jspb.Message.setField(e, n, void 0))
                }
                return o ? (jspb.Message.setField(e, o, r), o) : 0
            }, jspb.Message.getWrapperField = function(e, t, o, r) {
                if (e.wrappers_ || (e.wrappers_ = {}), !e.wrappers_[o]) {
                    var s = jspb.Message.getField(e, o);
                    (r || s) && (e.wrappers_[o] = new t(s))
                }
                return e.wrappers_[o]
            }, jspb.Message.getRepeatedWrapperField = function(e, t, o) {
                return jspb.Message.wrapRepeatedField_(e, t, o), (t = e.wrappers_[o]) == jspb.Message.EMPTY_LIST_SENTINEL_ && (t = e.wrappers_[o] = []), t
            }, jspb.Message.wrapRepeatedField_ = function(e, t, o) {
                if (e.wrappers_ || (e.wrappers_ = {}), !e.wrappers_[o]) {
                    for (var r = jspb.Message.getRepeatedField(e, o), s = [], n = 0; n < r.length; n++) s[n] = new t(r[n]);
                    e.wrappers_[o] = s
                }
            }, jspb.Message.setWrapperField = function(e, t, o) {
                goog.asserts.assertInstanceof(e, jspb.Message), e.wrappers_ || (e.wrappers_ = {});
                var r = o ? o.toArray() : o;
                return e.wrappers_[t] = o, jspb.Message.setField(e, t, r)
            }, jspb.Message.setOneofWrapperField = function(e, t, o, r) {
                goog.asserts.assertInstanceof(e, jspb.Message), e.wrappers_ || (e.wrappers_ = {});
                var s = r ? r.toArray() : r;
                return e.wrappers_[t] = r, jspb.Message.setOneofField(e, t, o, s)
            }, jspb.Message.setRepeatedWrapperField = function(e, t, o) {
                goog.asserts.assertInstanceof(e, jspb.Message), e.wrappers_ || (e.wrappers_ = {}), o = o || [];
                for (var r = [], s = 0; s < o.length; s++) r[s] = o[s].toArray();
                return e.wrappers_[t] = o, jspb.Message.setField(e, t, r)
            }, jspb.Message.addToRepeatedWrapperField = function(e, t, o, r, s) {
                jspb.Message.wrapRepeatedField_(e, r, t);
                var n = e.wrappers_[t];
                return n || (n = e.wrappers_[t] = []), o = o || new r, e = jspb.Message.getRepeatedField(e, t), null != s ? (n.splice(s, 0, o), e.splice(s, 0, o.toArray())) : (n.push(o), e.push(o.toArray())), o
            }, jspb.Message.toMap = function(e, t, o, r) {
                for (var s = {}, n = 0; n < e.length; n++) s[t.call(e[n])] = o ? o.call(e[n], r, e[n]) : e[n];
                return s
            }, jspb.Message.prototype.syncMapFields_ = function() {
                if (this.wrappers_)
                    for (var e in this.wrappers_) {
                        var t = this.wrappers_[e];
                        if (goog.isArray(t))
                            for (var o = 0; o < t.length; o++) t[o] && t[o].toArray();
                        else t && t.toArray()
                    }
            }, jspb.Message.prototype.toArray = function() {
                return this.syncMapFields_(), this.array
            }, jspb.Message.GENERATE_TO_STRING && (jspb.Message.prototype.toString = function() {
                return this.syncMapFields_(), this.array.toString()
            }), jspb.Message.prototype.getExtension = function(e) {
                if (this.extensionObject_) {
                    this.wrappers_ || (this.wrappers_ = {});
                    var t = e.fieldIndex;
                    if (e.isRepeated) {
                        if (e.isMessageType()) return this.wrappers_[t] || (this.wrappers_[t] = goog.array.map(this.extensionObject_[t] || [], function(t) {
                            return new e.ctor(t)
                        })), this.wrappers_[t]
                    } else if (e.isMessageType()) return !this.wrappers_[t] && this.extensionObject_[t] && (this.wrappers_[t] = new e.ctor(this.extensionObject_[t])), this.wrappers_[t];
                    return this.extensionObject_[t]
                }
            }, jspb.Message.prototype.setExtension = function(e, t) {
                this.wrappers_ || (this.wrappers_ = {}), jspb.Message.maybeInitEmptyExtensionObject_(this);
                var o = e.fieldIndex;
                return e.isRepeated ? (t = t || [], e.isMessageType() ? (this.wrappers_[o] = t, this.extensionObject_[o] = goog.array.map(t, function(e) {
                    return e.toArray()
                })) : this.extensionObject_[o] = t) : e.isMessageType() ? (this.wrappers_[o] = t, this.extensionObject_[o] = t ? t.toArray() : t) : this.extensionObject_[o] = t, this
            }, jspb.Message.difference = function(e, t) {
                if (!(e instanceof t.constructor)) throw Error("Messages have different types.");
                var o = e.toArray();
                t = t.toArray();
                var r = [],
                    s = 0,
                    n = o.length > t.length ? o.length : t.length;
                for (e.getJsPbMessageId() && (r[0] = e.getJsPbMessageId(), s = 1); s < n; s++) jspb.Message.compareFields(o[s], t[s]) || (r[s] = t[s]);
                return new e.constructor(r)
            }, jspb.Message.equals = function(e, t) {
                return e == t || !(!e || !t) && e instanceof t.constructor && jspb.Message.compareFields(e.toArray(), t.toArray())
            }, jspb.Message.compareExtensions = function(e, t) {
                e = e || {}, t = t || {};
                var o, r = {};
                for (o in e) r[o] = 0;
                for (o in t) r[o] = 0;
                for (o in r)
                    if (!jspb.Message.compareFields(e[o], t[o])) return !1;
                return !0
            }, jspb.Message.compareFields = function(e, t) {
                if (e == t) return !0;
                if (!goog.isObject(e) || !goog.isObject(t)) return !!("number" == typeof e && isNaN(e) || "number" == typeof t && isNaN(t)) && String(e) == String(t);
                if (e.constructor != t.constructor) return !1;
                if (jspb.Message.SUPPORTS_UINT8ARRAY_ && e.constructor === Uint8Array) {
                    if (e.length != t.length) return !1;
                    for (var o = 0; o < e.length; o++)
                        if (e[o] != t[o]) return !1;
                    return !0
                }
                if (e.constructor === Array) {
                    var r = void 0,
                        s = void 0,
                        n = Math.max(e.length, t.length);
                    for (o = 0; o < n; o++) {
                        var i = e[o],
                            a = t[o];
                        if (i && i.constructor == Object && (goog.asserts.assert(void 0 === r), goog.asserts.assert(o === e.length - 1), r = i, i = void 0), a && a.constructor == Object && (goog.asserts.assert(void 0 === s), goog.asserts.assert(o === t.length - 1), s = a, a = void 0), !jspb.Message.compareFields(i, a)) return !1
                    }
                    return !r && !s || (r = r || {}, s = s || {}, jspb.Message.compareExtensions(r, s))
                }
                if (e.constructor === Object) return jspb.Message.compareExtensions(e, t);
                throw Error("Invalid type in JSPB array")
            }, jspb.Message.prototype.cloneMessage = function() {
                return jspb.Message.cloneMessage(this)
            }, jspb.Message.prototype.clone = function() {
                return jspb.Message.cloneMessage(this)
            }, jspb.Message.clone = function(e) {
                return jspb.Message.cloneMessage(e)
            }, jspb.Message.cloneMessage = function(e) {
                return new e.constructor(jspb.Message.clone_(e.toArray()))
            }, jspb.Message.copyInto = function(e, t) {
                goog.asserts.assertInstanceof(e, jspb.Message), goog.asserts.assertInstanceof(t, jspb.Message), goog.asserts.assert(e.constructor == t.constructor, "Copy source and target message should have the same type."), e = jspb.Message.clone(e);
                for (var o = t.toArray(), r = e.toArray(), s = o.length = 0; s < r.length; s++) o[s] = r[s];
                t.wrappers_ = e.wrappers_, t.extensionObject_ = e.extensionObject_
            }, jspb.Message.clone_ = function(e) {
                if (goog.isArray(e)) {
                    for (var t = Array(e.length), o = 0; o < e.length; o++) {
                        var r = e[o];
                        null != r && (t[o] = "object" == typeof r ? jspb.Message.clone_(goog.asserts.assert(r)) : r)
                    }
                    return t
                }
                if (jspb.Message.SUPPORTS_UINT8ARRAY_ && e instanceof Uint8Array) return new Uint8Array(e);
                for (o in t = {}, e) null != (r = e[o]) && (t[o] = "object" == typeof r ? jspb.Message.clone_(goog.asserts.assert(r)) : r);
                return t
            }, jspb.Message.registerMessageType = function(e, t) {
                t.messageId = e
            }, jspb.Message.messageSetExtensions = {}, jspb.Message.messageSetExtensionsBinary = {}, jspb.arith = {}, jspb.arith.UInt64 = function(e, t) {
                this.lo = e, this.hi = t
            }, jspb.arith.UInt64.prototype.cmp = function(e) {
                return this.hi < e.hi || this.hi == e.hi && this.lo < e.lo ? -1 : this.hi == e.hi && this.lo == e.lo ? 0 : 1
            }, jspb.arith.UInt64.prototype.rightShift = function() {
                return new jspb.arith.UInt64((this.lo >>> 1 | (1 & this.hi) << 31) >>> 0, this.hi >>> 1 >>> 0)
            }, jspb.arith.UInt64.prototype.leftShift = function() {
                return new jspb.arith.UInt64(this.lo << 1 >>> 0, (this.hi << 1 | this.lo >>> 31) >>> 0)
            }, jspb.arith.UInt64.prototype.msb = function() {
                return !!(2147483648 & this.hi)
            }, jspb.arith.UInt64.prototype.lsb = function() {
                return !!(1 & this.lo)
            }, jspb.arith.UInt64.prototype.zero = function() {
                return 0 == this.lo && 0 == this.hi
            }, jspb.arith.UInt64.prototype.add = function(e) {
                return new jspb.arith.UInt64((this.lo + e.lo & 4294967295) >>> 0 >>> 0, ((this.hi + e.hi & 4294967295) >>> 0) + (4294967296 <= this.lo + e.lo ? 1 : 0) >>> 0)
            }, jspb.arith.UInt64.prototype.sub = function(e) {
                return new jspb.arith.UInt64((this.lo - e.lo & 4294967295) >>> 0 >>> 0, ((this.hi - e.hi & 4294967295) >>> 0) - (0 > this.lo - e.lo ? 1 : 0) >>> 0)
            }, jspb.arith.UInt64.mul32x32 = function(e, t) {
                var o = 65535 & e,
                    r = 65535 & t,
                    s = t >>> 16;
                for (t = o * r + 65536 * (o * s & 65535) + 65536 * ((e >>>= 16) * r & 65535), o = e * s + (o * s >>> 16) + (e * r >>> 16); 4294967296 <= t;) t -= 4294967296, o += 1;
                return new jspb.arith.UInt64(t >>> 0, o >>> 0)
            }, jspb.arith.UInt64.prototype.mul = function(e) {
                var t = jspb.arith.UInt64.mul32x32(this.lo, e);
                return (e = jspb.arith.UInt64.mul32x32(this.hi, e)).hi = e.lo, e.lo = 0, t.add(e)
            }, jspb.arith.UInt64.prototype.div = function(e) {
                if (0 == e) return [];
                var t = new jspb.arith.UInt64(0, 0),
                    o = new jspb.arith.UInt64(this.lo, this.hi);
                e = new jspb.arith.UInt64(e, 0);
                for (var r = new jspb.arith.UInt64(1, 0); !e.msb();) e = e.leftShift(), r = r.leftShift();
                for (; !r.zero();) 0 >= e.cmp(o) && (t = t.add(r), o = o.sub(e)), e = e.rightShift(), r = r.rightShift();
                return [t, o]
            }, jspb.arith.UInt64.prototype.toString = function() {
                for (var e = "", t = this; !t.zero();) {
                    var o = (t = t.div(10))[0];
                    e = t[1].lo + e, t = o
                }
                return "" == e && (e = "0"), e
            }, jspb.arith.UInt64.fromString = function(e) {
                for (var t = new jspb.arith.UInt64(0, 0), o = new jspb.arith.UInt64(0, 0), r = 0; r < e.length; r++) {
                    if ("0" > e[r] || "9" < e[r]) return null;
                    var s = parseInt(e[r], 10);
                    o.lo = s, t = t.mul(10).add(o)
                }
                return t
            }, jspb.arith.UInt64.prototype.clone = function() {
                return new jspb.arith.UInt64(this.lo, this.hi)
            }, jspb.arith.Int64 = function(e, t) {
                this.lo = e, this.hi = t
            }, jspb.arith.Int64.prototype.add = function(e) {
                return new jspb.arith.Int64((this.lo + e.lo & 4294967295) >>> 0 >>> 0, ((this.hi + e.hi & 4294967295) >>> 0) + (4294967296 <= this.lo + e.lo ? 1 : 0) >>> 0)
            }, jspb.arith.Int64.prototype.sub = function(e) {
                return new jspb.arith.Int64((this.lo - e.lo & 4294967295) >>> 0 >>> 0, ((this.hi - e.hi & 4294967295) >>> 0) - (0 > this.lo - e.lo ? 1 : 0) >>> 0)
            }, jspb.arith.Int64.prototype.clone = function() {
                return new jspb.arith.Int64(this.lo, this.hi)
            }, jspb.arith.Int64.prototype.toString = function() {
                var e = 0 != (2147483648 & this.hi),
                    t = new jspb.arith.UInt64(this.lo, this.hi);
                return e && (t = new jspb.arith.UInt64(0, 0).sub(t)), (e ? "-" : "") + t.toString()
            }, jspb.arith.Int64.fromString = function(e) {
                var t = 0 < e.length && "-" == e[0];
                return t && (e = e.substring(1)), null === (e = jspb.arith.UInt64.fromString(e)) ? null : (t && (e = new jspb.arith.UInt64(0, 0).sub(e)), new jspb.arith.Int64(e.lo, e.hi))
            }, jspb.BinaryEncoder = function() {
                this.buffer_ = []
            }, jspb.BinaryEncoder.prototype.length = function() {
                return this.buffer_.length
            }, jspb.BinaryEncoder.prototype.end = function() {
                var e = this.buffer_;
                return this.buffer_ = [], e
            }, jspb.BinaryEncoder.prototype.writeSplitVarint64 = function(e, t) {
                for (goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(t == Math.floor(t)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_32), goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_32); 0 < t || 127 < e;) this.buffer_.push(127 & e | 128), e = (e >>> 7 | t << 25) >>> 0, t >>>= 7;
                this.buffer_.push(e)
            }, jspb.BinaryEncoder.prototype.writeSplitFixed64 = function(e, t) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(t == Math.floor(t)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_32), goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_32), this.writeUint32(e), this.writeUint32(t)
            }, jspb.BinaryEncoder.prototype.writeUnsignedVarint32 = function(e) {
                for (goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_32); 127 < e;) this.buffer_.push(127 & e | 128), e >>>= 7;
                this.buffer_.push(e)
            }, jspb.BinaryEncoder.prototype.writeSignedVarint32 = function(e) {
                if (goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_31 && e < jspb.BinaryConstants.TWO_TO_31), 0 <= e) this.writeUnsignedVarint32(e);
                else {
                    for (var t = 0; 9 > t; t++) this.buffer_.push(127 & e | 128), e >>= 7;
                    this.buffer_.push(1)
                }
            }, jspb.BinaryEncoder.prototype.writeUnsignedVarint64 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_64), jspb.utils.splitInt64(e), this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeSignedVarint64 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_63 && e < jspb.BinaryConstants.TWO_TO_63), jspb.utils.splitInt64(e), this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeZigzagVarint32 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_31 && e < jspb.BinaryConstants.TWO_TO_31), this.writeUnsignedVarint32((e << 1 ^ e >> 31) >>> 0)
            }, jspb.BinaryEncoder.prototype.writeZigzagVarint64 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_63 && e < jspb.BinaryConstants.TWO_TO_63), jspb.utils.splitZigzag64(e), this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeZigzagVarint64String = function(e) {
                this.writeZigzagVarintHash64(jspb.utils.decimalStringToHash64(e))
            }, jspb.BinaryEncoder.prototype.writeZigzagVarintHash64 = function(e) {
                var t = this;
                jspb.utils.splitHash64(e), jspb.utils.toZigzag64(jspb.utils.split64Low, jspb.utils.split64High, function(e, o) {
                    t.writeSplitVarint64(e >>> 0, o >>> 0)
                })
            }, jspb.BinaryEncoder.prototype.writeUint8 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && 256 > e), this.buffer_.push(e >>> 0 & 255)
            }, jspb.BinaryEncoder.prototype.writeUint16 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && 65536 > e), this.buffer_.push(e >>> 0 & 255), this.buffer_.push(e >>> 8 & 255)
            }, jspb.BinaryEncoder.prototype.writeUint32 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_32), this.buffer_.push(e >>> 0 & 255), this.buffer_.push(e >>> 8 & 255), this.buffer_.push(e >>> 16 & 255), this.buffer_.push(e >>> 24 & 255)
            }, jspb.BinaryEncoder.prototype.writeUint64 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(0 <= e && e < jspb.BinaryConstants.TWO_TO_64), jspb.utils.splitUint64(e), this.writeUint32(jspb.utils.split64Low), this.writeUint32(jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeInt8 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(-128 <= e && 128 > e), this.buffer_.push(e >>> 0 & 255)
            }, jspb.BinaryEncoder.prototype.writeInt16 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(-32768 <= e && 32768 > e), this.buffer_.push(e >>> 0 & 255), this.buffer_.push(e >>> 8 & 255)
            }, jspb.BinaryEncoder.prototype.writeInt32 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_31 && e < jspb.BinaryConstants.TWO_TO_31), this.buffer_.push(e >>> 0 & 255), this.buffer_.push(e >>> 8 & 255), this.buffer_.push(e >>> 16 & 255), this.buffer_.push(e >>> 24 & 255)
            }, jspb.BinaryEncoder.prototype.writeInt64 = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_63 && e < jspb.BinaryConstants.TWO_TO_63), jspb.utils.splitInt64(e), this.writeSplitFixed64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeInt64String = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(+e >= -jspb.BinaryConstants.TWO_TO_63 && +e < jspb.BinaryConstants.TWO_TO_63), jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(e)), this.writeSplitFixed64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeFloat = function(e) {
                goog.asserts.assert(1 / 0 === e || -1 / 0 === e || isNaN(e) || e >= -jspb.BinaryConstants.FLOAT32_MAX && e <= jspb.BinaryConstants.FLOAT32_MAX), jspb.utils.splitFloat32(e), this.writeUint32(jspb.utils.split64Low)
            }, jspb.BinaryEncoder.prototype.writeDouble = function(e) {
                goog.asserts.assert(1 / 0 === e || -1 / 0 === e || isNaN(e) || e >= -jspb.BinaryConstants.FLOAT64_MAX && e <= jspb.BinaryConstants.FLOAT64_MAX), jspb.utils.splitFloat64(e), this.writeUint32(jspb.utils.split64Low), this.writeUint32(jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeBool = function(e) {
                goog.asserts.assert("boolean" == typeof e || "number" == typeof e), this.buffer_.push(e ? 1 : 0)
            }, jspb.BinaryEncoder.prototype.writeEnum = function(e) {
                goog.asserts.assert(e == Math.floor(e)), goog.asserts.assert(e >= -jspb.BinaryConstants.TWO_TO_31 && e < jspb.BinaryConstants.TWO_TO_31), this.writeSignedVarint32(e)
            }, jspb.BinaryEncoder.prototype.writeBytes = function(e) {
                this.buffer_.push.apply(this.buffer_, e)
            }, jspb.BinaryEncoder.prototype.writeVarintHash64 = function(e) {
                jspb.utils.splitHash64(e), this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeFixedHash64 = function(e) {
                jspb.utils.splitHash64(e), this.writeUint32(jspb.utils.split64Low), this.writeUint32(jspb.utils.split64High)
            }, jspb.BinaryEncoder.prototype.writeString = function(e) {
                for (var t = this.buffer_.length, o = 0; o < e.length; o++) {
                    var r = e.charCodeAt(o);
                    if (128 > r) this.buffer_.push(r);
                    else if (2048 > r) this.buffer_.push(r >> 6 | 192), this.buffer_.push(63 & r | 128);
                    else if (65536 > r)
                        if (55296 <= r && 56319 >= r && o + 1 < e.length) {
                            var s = e.charCodeAt(o + 1);
                            56320 <= s && 57343 >= s && (r = 1024 * (r - 55296) + s - 56320 + 65536, this.buffer_.push(r >> 18 | 240), this.buffer_.push(r >> 12 & 63 | 128), this.buffer_.push(r >> 6 & 63 | 128), this.buffer_.push(63 & r | 128), o++)
                        } else this.buffer_.push(r >> 12 | 224), this.buffer_.push(r >> 6 & 63 | 128), this.buffer_.push(63 & r | 128)
                }
                return this.buffer_.length - t
            }, jspb.BinaryWriter = function() {
                this.blocks_ = [], this.totalLength_ = 0, this.encoder_ = new jspb.BinaryEncoder, this.bookmarks_ = []
            }, jspb.BinaryWriter.prototype.appendUint8Array_ = function(e) {
                var t = this.encoder_.end();
                this.blocks_.push(t), this.blocks_.push(e), this.totalLength_ += t.length + e.length
            }, jspb.BinaryWriter.prototype.beginDelimited_ = function(e) {
                return this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), e = this.encoder_.end(), this.blocks_.push(e), this.totalLength_ += e.length, e.push(this.totalLength_), e
            }, jspb.BinaryWriter.prototype.endDelimited_ = function(e) {
                var t = e.pop();
                for (t = this.totalLength_ + this.encoder_.length() - t, goog.asserts.assert(0 <= t); 127 < t;) e.push(127 & t | 128), t >>>= 7, this.totalLength_++;
                e.push(t), this.totalLength_++
            }, jspb.BinaryWriter.prototype.writeSerializedMessage = function(e, t, o) {
                this.appendUint8Array_(e.subarray(t, o))
            }, jspb.BinaryWriter.prototype.maybeWriteSerializedMessage = function(e, t, o) {
                null != e && null != t && null != o && this.writeSerializedMessage(e, t, o)
            }, jspb.BinaryWriter.prototype.reset = function() {
                this.blocks_ = [], this.encoder_.end(), this.totalLength_ = 0, this.bookmarks_ = []
            }, jspb.BinaryWriter.prototype.getResultBuffer = function() {
                goog.asserts.assert(0 == this.bookmarks_.length);
                for (var e = new Uint8Array(this.totalLength_ + this.encoder_.length()), t = this.blocks_, o = t.length, r = 0, s = 0; s < o; s++) {
                    var n = t[s];
                    e.set(n, r), r += n.length
                }
                return t = this.encoder_.end(), e.set(t, r), r += t.length, goog.asserts.assert(r == e.length), this.blocks_ = [e], e
            }, jspb.BinaryWriter.prototype.getResultBase64String = function(e) {
                return goog.crypt.base64.encodeByteArray(this.getResultBuffer(), e)
            }, jspb.BinaryWriter.prototype.beginSubMessage = function(e) {
                this.bookmarks_.push(this.beginDelimited_(e))
            }, jspb.BinaryWriter.prototype.endSubMessage = function() {
                goog.asserts.assert(0 <= this.bookmarks_.length), this.endDelimited_(this.bookmarks_.pop())
            }, jspb.BinaryWriter.prototype.writeFieldHeader_ = function(e, t) {
                goog.asserts.assert(1 <= e && e == Math.floor(e)), this.encoder_.writeUnsignedVarint32(8 * e + t)
            }, jspb.BinaryWriter.prototype.writeAny = function(e, t, o) {
                var r = jspb.BinaryConstants.FieldType;
                switch (e) {
                    case r.DOUBLE:
                        this.writeDouble(t, o);
                        break;
                    case r.FLOAT:
                        this.writeFloat(t, o);
                        break;
                    case r.INT64:
                        this.writeInt64(t, o);
                        break;
                    case r.UINT64:
                        this.writeUint64(t, o);
                        break;
                    case r.INT32:
                        this.writeInt32(t, o);
                        break;
                    case r.FIXED64:
                        this.writeFixed64(t, o);
                        break;
                    case r.FIXED32:
                        this.writeFixed32(t, o);
                        break;
                    case r.BOOL:
                        this.writeBool(t, o);
                        break;
                    case r.STRING:
                        this.writeString(t, o);
                        break;
                    case r.GROUP:
                        goog.asserts.fail("Group field type not supported in writeAny()");
                        break;
                    case r.MESSAGE:
                        goog.asserts.fail("Message field type not supported in writeAny()");
                        break;
                    case r.BYTES:
                        this.writeBytes(t, o);
                        break;
                    case r.UINT32:
                        this.writeUint32(t, o);
                        break;
                    case r.ENUM:
                        this.writeEnum(t, o);
                        break;
                    case r.SFIXED32:
                        this.writeSfixed32(t, o);
                        break;
                    case r.SFIXED64:
                        this.writeSfixed64(t, o);
                        break;
                    case r.SINT32:
                        this.writeSint32(t, o);
                        break;
                    case r.SINT64:
                        this.writeSint64(t, o);
                        break;
                    case r.FHASH64:
                        this.writeFixedHash64(t, o);
                        break;
                    case r.VHASH64:
                        this.writeVarintHash64(t, o);
                        break;
                    default:
                        goog.asserts.fail("Invalid field type in writeAny()")
                }
            }, jspb.BinaryWriter.prototype.writeUnsignedVarint32_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeUnsignedVarint32(t))
            }, jspb.BinaryWriter.prototype.writeSignedVarint32_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint32(t))
            }, jspb.BinaryWriter.prototype.writeUnsignedVarint64_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeUnsignedVarint64(t))
            }, jspb.BinaryWriter.prototype.writeSignedVarint64_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint64(t))
            }, jspb.BinaryWriter.prototype.writeZigzagVarint32_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint32(t))
            }, jspb.BinaryWriter.prototype.writeZigzagVarint64_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint64(t))
            }, jspb.BinaryWriter.prototype.writeZigzagVarint64String_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint64String(t))
            }, jspb.BinaryWriter.prototype.writeZigzagVarintHash64_ = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarintHash64(t))
            }, jspb.BinaryWriter.prototype.writeInt32 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_31 && t < jspb.BinaryConstants.TWO_TO_31), this.writeSignedVarint32_(e, t))
            }, jspb.BinaryWriter.prototype.writeInt32String = function(e, t) {
                null != t && (t = parseInt(t, 10), goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_31 && t < jspb.BinaryConstants.TWO_TO_31), this.writeSignedVarint32_(e, t))
            }, jspb.BinaryWriter.prototype.writeInt64 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_63 && t < jspb.BinaryConstants.TWO_TO_63), this.writeSignedVarint64_(e, t))
            }, jspb.BinaryWriter.prototype.writeInt64String = function(e, t) {
                null != t && (t = jspb.arith.Int64.fromString(t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSplitVarint64(t.lo, t.hi))
            }, jspb.BinaryWriter.prototype.writeUint32 = function(e, t) {
                null != t && (goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_32), this.writeUnsignedVarint32_(e, t))
            }, jspb.BinaryWriter.prototype.writeUint32String = function(e, t) {
                null != t && (t = parseInt(t, 10), goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_32), this.writeUnsignedVarint32_(e, t))
            }, jspb.BinaryWriter.prototype.writeUint64 = function(e, t) {
                null != t && (goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_64), this.writeUnsignedVarint64_(e, t))
            }, jspb.BinaryWriter.prototype.writeUint64String = function(e, t) {
                null != t && (t = jspb.arith.UInt64.fromString(t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSplitVarint64(t.lo, t.hi))
            }, jspb.BinaryWriter.prototype.writeSint32 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_31 && t < jspb.BinaryConstants.TWO_TO_31), this.writeZigzagVarint32_(e, t))
            }, jspb.BinaryWriter.prototype.writeSint64 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_63 && t < jspb.BinaryConstants.TWO_TO_63), this.writeZigzagVarint64_(e, t))
            }, jspb.BinaryWriter.prototype.writeSintHash64 = function(e, t) {
                null != t && this.writeZigzagVarintHash64_(e, t)
            }, jspb.BinaryWriter.prototype.writeSint64String = function(e, t) {
                null != t && this.writeZigzagVarint64String_(e, t)
            }, jspb.BinaryWriter.prototype.writeFixed32 = function(e, t) {
                null != t && (goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_32), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeUint32(t))
            }, jspb.BinaryWriter.prototype.writeFixed64 = function(e, t) {
                null != t && (goog.asserts.assert(0 <= t && t < jspb.BinaryConstants.TWO_TO_64), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeUint64(t))
            }, jspb.BinaryWriter.prototype.writeFixed64String = function(e, t) {
                null != t && (t = jspb.arith.UInt64.fromString(t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeSplitFixed64(t.lo, t.hi))
            }, jspb.BinaryWriter.prototype.writeSfixed32 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_31 && t < jspb.BinaryConstants.TWO_TO_31), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeInt32(t))
            }, jspb.BinaryWriter.prototype.writeSfixed64 = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_63 && t < jspb.BinaryConstants.TWO_TO_63), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeInt64(t))
            }, jspb.BinaryWriter.prototype.writeSfixed64String = function(e, t) {
                null != t && (t = jspb.arith.Int64.fromString(t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeSplitFixed64(t.lo, t.hi))
            }, jspb.BinaryWriter.prototype.writeFloat = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeFloat(t))
            }, jspb.BinaryWriter.prototype.writeDouble = function(e, t) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeDouble(t))
            }, jspb.BinaryWriter.prototype.writeBool = function(e, t) {
                null != t && (goog.asserts.assert("boolean" == typeof t || "number" == typeof t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeBool(t))
            }, jspb.BinaryWriter.prototype.writeEnum = function(e, t) {
                null != t && (goog.asserts.assert(t >= -jspb.BinaryConstants.TWO_TO_31 && t < jspb.BinaryConstants.TWO_TO_31), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint32(t))
            }, jspb.BinaryWriter.prototype.writeString = function(e, t) {
                null != t && (e = this.beginDelimited_(e), this.encoder_.writeString(t), this.endDelimited_(e))
            }, jspb.BinaryWriter.prototype.writeBytes = function(e, t) {
                null != t && (t = jspb.utils.byteSourceToUint8Array(t), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(t.length), this.appendUint8Array_(t))
            }, jspb.BinaryWriter.prototype.writeMessage = function(e, t, o) {
                null != t && (e = this.beginDelimited_(e), o(t, this), this.endDelimited_(e))
            }, jspb.BinaryWriter.prototype.writeMessageSet = function(e, t, o) {
                null != t && (this.writeFieldHeader_(1, jspb.BinaryConstants.WireType.START_GROUP), this.writeFieldHeader_(2, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint32(e), e = this.beginDelimited_(3), o(t, this), this.endDelimited_(e), this.writeFieldHeader_(1, jspb.BinaryConstants.WireType.END_GROUP))
            }, jspb.BinaryWriter.prototype.writeGroup = function(e, t, o) {
                null != t && (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.START_GROUP), o(t, this), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.END_GROUP))
            }, jspb.BinaryWriter.prototype.writeFixedHash64 = function(e, t) {
                null != t && (goog.asserts.assert(8 == t.length), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeFixedHash64(t))
            }, jspb.BinaryWriter.prototype.writeVarintHash64 = function(e, t) {
                null != t && (goog.asserts.assert(8 == t.length), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeVarintHash64(t))
            }, jspb.BinaryWriter.prototype.writeSplitFixed64 = function(e, t, o) {
                this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeSplitFixed64(t, o)
            }, jspb.BinaryWriter.prototype.writeSplitVarint64 = function(e, t, o) {
                this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSplitVarint64(t, o)
            }, jspb.BinaryWriter.prototype.writeSplitZigzagVarint64 = function(e, t, o) {
                this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.VARINT);
                var r = this.encoder_;
                jspb.utils.toZigzag64(t, o, function(e, t) {
                    r.writeSplitVarint64(e >>> 0, t >>> 0)
                })
            }, jspb.BinaryWriter.prototype.writeRepeatedInt32 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeSignedVarint32_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedInt32String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeInt32String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedInt64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeSignedVarint64_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSplitFixed64 = function(e, t, o, r) {
                if (null != t)
                    for (var s = 0; s < t.length; s++) this.writeSplitFixed64(e, o(t[s]), r(t[s]))
            }, jspb.BinaryWriter.prototype.writeRepeatedSplitVarint64 = function(e, t, o, r) {
                if (null != t)
                    for (var s = 0; s < t.length; s++) this.writeSplitVarint64(e, o(t[s]), r(t[s]))
            }, jspb.BinaryWriter.prototype.writeRepeatedSplitZigzagVarint64 = function(e, t, o, r) {
                if (null != t)
                    for (var s = 0; s < t.length; s++) this.writeSplitZigzagVarint64(e, o(t[s]), r(t[s]))
            }, jspb.BinaryWriter.prototype.writeRepeatedInt64String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeInt64String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedUint32 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeUnsignedVarint32_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedUint32String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeUint32String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedUint64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeUnsignedVarint64_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedUint64String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeUint64String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSint32 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeZigzagVarint32_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSint64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeZigzagVarint64_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSint64String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeZigzagVarint64String_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSintHash64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeZigzagVarintHash64_(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedFixed32 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeFixed32(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedFixed64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeFixed64(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedFixed64String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeFixed64String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSfixed32 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeSfixed32(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSfixed64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeSfixed64(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedSfixed64String = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeSfixed64String(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedFloat = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeFloat(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedDouble = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeDouble(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedBool = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeBool(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedEnum = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeEnum(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedString = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeString(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedBytes = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeBytes(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedMessage = function(e, t, o) {
                if (null != t)
                    for (var r = 0; r < t.length; r++) {
                        var s = this.beginDelimited_(e);
                        o(t[r], this), this.endDelimited_(s)
                    }
            }, jspb.BinaryWriter.prototype.writeRepeatedGroup = function(e, t, o) {
                if (null != t)
                    for (var r = 0; r < t.length; r++) this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.START_GROUP), o(t[r], this), this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.END_GROUP)
            }, jspb.BinaryWriter.prototype.writeRepeatedFixedHash64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeFixedHash64(e, t[o])
            }, jspb.BinaryWriter.prototype.writeRepeatedVarintHash64 = function(e, t) {
                if (null != t)
                    for (var o = 0; o < t.length; o++) this.writeVarintHash64(e, t[o])
            }, jspb.BinaryWriter.prototype.writePackedInt32 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeSignedVarint32(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedInt32String = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeSignedVarint32(parseInt(t[o], 10));
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedInt64 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeSignedVarint64(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSplitFixed64 = function(e, t, o, r) {
                if (null != t) {
                    e = this.beginDelimited_(e);
                    for (var s = 0; s < t.length; s++) this.encoder_.writeSplitFixed64(o(t[s]), r(t[s]));
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSplitVarint64 = function(e, t, o, r) {
                if (null != t) {
                    e = this.beginDelimited_(e);
                    for (var s = 0; s < t.length; s++) this.encoder_.writeSplitVarint64(o(t[s]), r(t[s]));
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSplitZigzagVarint64 = function(e, t, o, r) {
                if (null != t) {
                    e = this.beginDelimited_(e);
                    for (var s = this.encoder_, n = 0; n < t.length; n++) jspb.utils.toZigzag64(o(t[n]), r(t[n]), function(e, t) {
                        s.writeSplitVarint64(e >>> 0, t >>> 0)
                    });
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedInt64String = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) {
                        var r = jspb.arith.Int64.fromString(t[o]);
                        this.encoder_.writeSplitVarint64(r.lo, r.hi)
                    }
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedUint32 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeUnsignedVarint32(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedUint32String = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeUnsignedVarint32(parseInt(t[o], 10));
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedUint64 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeUnsignedVarint64(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedUint64String = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) {
                        var r = jspb.arith.UInt64.fromString(t[o]);
                        this.encoder_.writeSplitVarint64(r.lo, r.hi)
                    }
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSint32 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeZigzagVarint32(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSint64 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeZigzagVarint64(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSint64String = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeZigzagVarintHash64(jspb.utils.decimalStringToHash64(t[o]));
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedSintHash64 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeZigzagVarintHash64(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedFixed32 = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(4 * t.length), e = 0; e < t.length; e++) this.encoder_.writeUint32(t[e])
            }, jspb.BinaryWriter.prototype.writePackedFixed64 = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) this.encoder_.writeUint64(t[e])
            }, jspb.BinaryWriter.prototype.writePackedFixed64String = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) {
                        var o = jspb.arith.UInt64.fromString(t[e]);
                        this.encoder_.writeSplitFixed64(o.lo, o.hi)
                    }
            }, jspb.BinaryWriter.prototype.writePackedSfixed32 = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(4 * t.length), e = 0; e < t.length; e++) this.encoder_.writeInt32(t[e])
            }, jspb.BinaryWriter.prototype.writePackedSfixed64 = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) this.encoder_.writeInt64(t[e])
            }, jspb.BinaryWriter.prototype.writePackedSfixed64String = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) this.encoder_.writeInt64String(t[e])
            }, jspb.BinaryWriter.prototype.writePackedFloat = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(4 * t.length), e = 0; e < t.length; e++) this.encoder_.writeFloat(t[e])
            }, jspb.BinaryWriter.prototype.writePackedDouble = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) this.encoder_.writeDouble(t[e])
            }, jspb.BinaryWriter.prototype.writePackedBool = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(t.length), e = 0; e < t.length; e++) this.encoder_.writeBool(t[e])
            }, jspb.BinaryWriter.prototype.writePackedEnum = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeEnum(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.BinaryWriter.prototype.writePackedFixedHash64 = function(e, t) {
                if (null != t && t.length)
                    for (this.writeFieldHeader_(e, jspb.BinaryConstants.WireType.DELIMITED), this.encoder_.writeUnsignedVarint32(8 * t.length), e = 0; e < t.length; e++) this.encoder_.writeFixedHash64(t[e])
            }, jspb.BinaryWriter.prototype.writePackedVarintHash64 = function(e, t) {
                if (null != t && t.length) {
                    e = this.beginDelimited_(e);
                    for (var o = 0; o < t.length; o++) this.encoder_.writeVarintHash64(t[o]);
                    this.endDelimited_(e)
                }
            }, jspb.Export = {}, exports.Map = jspb.Map, exports.Message = jspb.Message, exports.BinaryReader = jspb.BinaryReader, exports.BinaryWriter = jspb.BinaryWriter, exports.ExtensionFieldInfo = jspb.ExtensionFieldInfo, exports.ExtensionFieldBinaryInfo = jspb.ExtensionFieldBinaryInfo, exports.exportSymbol = goog.exportSymbol, exports.inherits = goog.inherits, exports.object = {
                extend: goog.object.extend
            }, exports.typeOf = goog.typeOf
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.Collection", null, n), s.exportSymbol("proto.entities.CollectionGuarantee", null, n), proto.entities.Collection = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.Collection.repeatedFields_, null)
            }, s.inherits(proto.entities.Collection, r.Message), s.DEBUG && !COMPILED && (proto.entities.Collection.displayName = "proto.entities.Collection"), proto.entities.CollectionGuarantee = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.CollectionGuarantee.repeatedFields_, null)
            }, s.inherits(proto.entities.CollectionGuarantee, r.Message), s.DEBUG && !COMPILED && (proto.entities.CollectionGuarantee.displayName = "proto.entities.CollectionGuarantee"), proto.entities.Collection.repeatedFields_ = [2], r.Message.GENERATE_TO_OBJECT && (proto.entities.Collection.prototype.toObject = function(e) {
                return proto.entities.Collection.toObject(e, this)
            }, proto.entities.Collection.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64(),
                    transactionIdsList: t.getTransactionIdsList_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.Collection.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Collection;
                return proto.entities.Collection.deserializeBinaryFromReader(o, t)
            }, proto.entities.Collection.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.addTransactionIds(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Collection.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Collection.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Collection.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getTransactionIdsList_asU8()).length > 0 && t.writeRepeatedBytes(2, o)
            }, proto.entities.Collection.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Collection.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.entities.Collection.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.entities.Collection.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Collection.prototype.getTransactionIdsList = function() {
                return r.Message.getRepeatedField(this, 2)
            }, proto.entities.Collection.prototype.getTransactionIdsList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getTransactionIdsList())
            }, proto.entities.Collection.prototype.getTransactionIdsList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getTransactionIdsList())
            }, proto.entities.Collection.prototype.setTransactionIdsList = function(e) {
                return r.Message.setField(this, 2, e || [])
            }, proto.entities.Collection.prototype.addTransactionIds = function(e, t) {
                return r.Message.addToRepeatedField(this, 2, e, t)
            }, proto.entities.Collection.prototype.clearTransactionIdsList = function() {
                return this.setTransactionIdsList([])
            }, proto.entities.CollectionGuarantee.repeatedFields_ = [2], r.Message.GENERATE_TO_OBJECT && (proto.entities.CollectionGuarantee.prototype.toObject = function(e) {
                return proto.entities.CollectionGuarantee.toObject(e, this)
            }, proto.entities.CollectionGuarantee.toObject = function(e, t) {
                var o = {
                    collectionId: t.getCollectionId_asB64(),
                    signaturesList: t.getSignaturesList_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.CollectionGuarantee.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.CollectionGuarantee;
                return proto.entities.CollectionGuarantee.deserializeBinaryFromReader(o, t)
            }, proto.entities.CollectionGuarantee.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setCollectionId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.addSignatures(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.CollectionGuarantee.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.CollectionGuarantee.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.CollectionGuarantee.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getCollectionId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getSignaturesList_asU8()).length > 0 && t.writeRepeatedBytes(2, o)
            }, proto.entities.CollectionGuarantee.prototype.getCollectionId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.CollectionGuarantee.prototype.getCollectionId_asB64 = function() {
                return r.Message.bytesAsB64(this.getCollectionId())
            }, proto.entities.CollectionGuarantee.prototype.getCollectionId_asU8 = function() {
                return r.Message.bytesAsU8(this.getCollectionId())
            }, proto.entities.CollectionGuarantee.prototype.setCollectionId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.CollectionGuarantee.prototype.getSignaturesList = function() {
                return r.Message.getRepeatedField(this, 2)
            }, proto.entities.CollectionGuarantee.prototype.getSignaturesList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getSignaturesList())
            }, proto.entities.CollectionGuarantee.prototype.getSignaturesList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getSignaturesList())
            }, proto.entities.CollectionGuarantee.prototype.setSignaturesList = function(e) {
                return r.Message.setField(this, 2, e || [])
            }, proto.entities.CollectionGuarantee.prototype.addSignatures = function(e, t) {
                return r.Message.addToRepeatedField(this, 2, e, t)
            }, proto.entities.CollectionGuarantee.prototype.clearSignaturesList = function() {
                return this.setSignaturesList([])
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.Account", null, n), s.exportSymbol("proto.entities.AccountKey", null, n), proto.entities.Account = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.Account.repeatedFields_, null)
            }, s.inherits(proto.entities.Account, r.Message), s.DEBUG && !COMPILED && (proto.entities.Account.displayName = "proto.entities.Account"), proto.entities.AccountKey = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.entities.AccountKey, r.Message), s.DEBUG && !COMPILED && (proto.entities.AccountKey.displayName = "proto.entities.AccountKey"), proto.entities.Account.repeatedFields_ = [4], r.Message.GENERATE_TO_OBJECT && (proto.entities.Account.prototype.toObject = function(e) {
                return proto.entities.Account.toObject(e, this)
            }, proto.entities.Account.toObject = function(e, t) {
                var o = {
                    address: t.getAddress_asB64(),
                    balance: r.Message.getFieldWithDefault(t, 2, 0),
                    code: t.getCode_asB64(),
                    keysList: r.Message.toObjectList(t.getKeysList(), proto.entities.AccountKey.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.Account.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Account;
                return proto.entities.Account.deserializeBinaryFromReader(o, t)
            }, proto.entities.Account.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setAddress(o);
                        break;
                    case 2:
                        o = t.readUint64(), e.setBalance(o);
                        break;
                    case 3:
                        o = t.readBytes(), e.setCode(o);
                        break;
                    case 4:
                        o = new proto.entities.AccountKey, t.readMessage(o, proto.entities.AccountKey.deserializeBinaryFromReader), e.addKeys(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Account.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Account.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Account.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getAddress_asU8()).length > 0 && t.writeBytes(1, o), 0 !== (o = e.getBalance()) && t.writeUint64(2, o), (o = e.getCode_asU8()).length > 0 && t.writeBytes(3, o), (o = e.getKeysList()).length > 0 && t.writeRepeatedMessage(4, o, proto.entities.AccountKey.serializeBinaryToWriter)
            }, proto.entities.Account.prototype.getAddress = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Account.prototype.getAddress_asB64 = function() {
                return r.Message.bytesAsB64(this.getAddress())
            }, proto.entities.Account.prototype.getAddress_asU8 = function() {
                return r.Message.bytesAsU8(this.getAddress())
            }, proto.entities.Account.prototype.setAddress = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Account.prototype.getBalance = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.entities.Account.prototype.setBalance = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.entities.Account.prototype.getCode = function() {
                return r.Message.getFieldWithDefault(this, 3, "")
            }, proto.entities.Account.prototype.getCode_asB64 = function() {
                return r.Message.bytesAsB64(this.getCode())
            }, proto.entities.Account.prototype.getCode_asU8 = function() {
                return r.Message.bytesAsU8(this.getCode())
            }, proto.entities.Account.prototype.setCode = function(e) {
                return r.Message.setProto3BytesField(this, 3, e)
            }, proto.entities.Account.prototype.getKeysList = function() {
                return r.Message.getRepeatedWrapperField(this, proto.entities.AccountKey, 4)
            }, proto.entities.Account.prototype.setKeysList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 4, e)
            }, proto.entities.Account.prototype.addKeys = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 4, e, proto.entities.AccountKey, t)
            }, proto.entities.Account.prototype.clearKeysList = function() {
                return this.setKeysList([])
            }, r.Message.GENERATE_TO_OBJECT && (proto.entities.AccountKey.prototype.toObject = function(e) {
                return proto.entities.AccountKey.toObject(e, this)
            }, proto.entities.AccountKey.toObject = function(e, t) {
                var o = {
                    index: r.Message.getFieldWithDefault(t, 1, 0),
                    publicKey: t.getPublicKey_asB64(),
                    signAlgo: r.Message.getFieldWithDefault(t, 3, 0),
                    hashAlgo: r.Message.getFieldWithDefault(t, 4, 0),
                    weight: r.Message.getFieldWithDefault(t, 5, 0),
                    sequenceNumber: r.Message.getFieldWithDefault(t, 6, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.AccountKey.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.AccountKey;
                return proto.entities.AccountKey.deserializeBinaryFromReader(o, t)
            }, proto.entities.AccountKey.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readUint32();
                        e.setIndex(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setPublicKey(o);
                        break;
                    case 3:
                        o = t.readUint32(), e.setSignAlgo(o);
                        break;
                    case 4:
                        o = t.readUint32(), e.setHashAlgo(o);
                        break;
                    case 5:
                        o = t.readUint32(), e.setWeight(o);
                        break;
                    case 6:
                        o = t.readUint32(), e.setSequenceNumber(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.AccountKey.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.AccountKey.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.AccountKey.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                0 !== (o = e.getIndex()) && t.writeUint32(1, o), (o = e.getPublicKey_asU8()).length > 0 && t.writeBytes(2, o), 0 !== (o = e.getSignAlgo()) && t.writeUint32(3, o), 0 !== (o = e.getHashAlgo()) && t.writeUint32(4, o), 0 !== (o = e.getWeight()) && t.writeUint32(5, o), 0 !== (o = e.getSequenceNumber()) && t.writeUint32(6, o)
            }, proto.entities.AccountKey.prototype.getIndex = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.entities.AccountKey.prototype.setIndex = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, proto.entities.AccountKey.prototype.getPublicKey = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.entities.AccountKey.prototype.getPublicKey_asB64 = function() {
                return r.Message.bytesAsB64(this.getPublicKey())
            }, proto.entities.AccountKey.prototype.getPublicKey_asU8 = function() {
                return r.Message.bytesAsU8(this.getPublicKey())
            }, proto.entities.AccountKey.prototype.setPublicKey = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.entities.AccountKey.prototype.getSignAlgo = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.entities.AccountKey.prototype.setSignAlgo = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, proto.entities.AccountKey.prototype.getHashAlgo = function() {
                return r.Message.getFieldWithDefault(this, 4, 0)
            }, proto.entities.AccountKey.prototype.setHashAlgo = function(e) {
                return r.Message.setProto3IntField(this, 4, e)
            }, proto.entities.AccountKey.prototype.getWeight = function() {
                return r.Message.getFieldWithDefault(this, 5, 0)
            }, proto.entities.AccountKey.prototype.setWeight = function(e) {
                return r.Message.setProto3IntField(this, 5, e)
            }, proto.entities.AccountKey.prototype.getSequenceNumber = function() {
                return r.Message.getFieldWithDefault(this, 6, 0)
            }, proto.entities.AccountKey.prototype.setSequenceNumber = function(e) {
                return r.Message.setProto3IntField(this, 6, e)
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.Event", null, n), proto.entities.Event = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.entities.Event, r.Message), s.DEBUG && !COMPILED && (proto.entities.Event.displayName = "proto.entities.Event"), r.Message.GENERATE_TO_OBJECT && (proto.entities.Event.prototype.toObject = function(e) {
                return proto.entities.Event.toObject(e, this)
            }, proto.entities.Event.toObject = function(e, t) {
                var o = {
                    type: r.Message.getFieldWithDefault(t, 1, ""),
                    transactionId: t.getTransactionId_asB64(),
                    transactionIndex: r.Message.getFieldWithDefault(t, 3, 0),
                    eventIndex: r.Message.getFieldWithDefault(t, 4, 0),
                    payload: t.getPayload_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.Event.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Event;
                return proto.entities.Event.deserializeBinaryFromReader(o, t)
            }, proto.entities.Event.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readString();
                        e.setType(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setTransactionId(o);
                        break;
                    case 3:
                        o = t.readUint32(), e.setTransactionIndex(o);
                        break;
                    case 4:
                        o = t.readUint32(), e.setEventIndex(o);
                        break;
                    case 5:
                        o = t.readBytes(), e.setPayload(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Event.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Event.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Event.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getType()).length > 0 && t.writeString(1, o), (o = e.getTransactionId_asU8()).length > 0 && t.writeBytes(2, o), 0 !== (o = e.getTransactionIndex()) && t.writeUint32(3, o), 0 !== (o = e.getEventIndex()) && t.writeUint32(4, o), (o = e.getPayload_asU8()).length > 0 && t.writeBytes(5, o)
            }, proto.entities.Event.prototype.getType = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Event.prototype.setType = function(e) {
                return r.Message.setProto3StringField(this, 1, e)
            }, proto.entities.Event.prototype.getTransactionId = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.entities.Event.prototype.getTransactionId_asB64 = function() {
                return r.Message.bytesAsB64(this.getTransactionId())
            }, proto.entities.Event.prototype.getTransactionId_asU8 = function() {
                return r.Message.bytesAsU8(this.getTransactionId())
            }, proto.entities.Event.prototype.setTransactionId = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.entities.Event.prototype.getTransactionIndex = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.entities.Event.prototype.setTransactionIndex = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, proto.entities.Event.prototype.getEventIndex = function() {
                return r.Message.getFieldWithDefault(this, 4, 0)
            }, proto.entities.Event.prototype.setEventIndex = function(e) {
                return r.Message.setProto3IntField(this, 4, e)
            }, proto.entities.Event.prototype.getPayload = function() {
                return r.Message.getFieldWithDefault(this, 5, "")
            }, proto.entities.Event.prototype.getPayload_asB64 = function() {
                return r.Message.bytesAsB64(this.getPayload())
            }, proto.entities.Event.prototype.getPayload_asU8 = function() {
                return r.Message.bytesAsU8(this.getPayload())
            }, proto.entities.Event.prototype.setPayload = function(e) {
                return r.Message.setProto3BytesField(this, 5, e)
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")(),
                i = o(5);
            s.object.extend(proto, i);
            var a = o(6);
            s.object.extend(proto, a);
            var g = o(1);
            s.object.extend(proto, g);
            var c = o(8);
            s.object.extend(proto, c);
            var u = o(2);
            s.object.extend(proto, u);
            var l = o(3);
            s.object.extend(proto, l), s.exportSymbol("proto.access.BlockHeaderResponse", null, n), s.exportSymbol("proto.access.BlockResponse", null, n), s.exportSymbol("proto.access.CollectionResponse", null, n), s.exportSymbol("proto.access.EventsResponse", null, n), s.exportSymbol("proto.access.EventsResponse.Result", null, n), s.exportSymbol("proto.access.ExecuteScriptAtBlockHeightRequest", null, n), s.exportSymbol("proto.access.ExecuteScriptAtBlockIDRequest", null, n), s.exportSymbol("proto.access.ExecuteScriptAtLatestBlockRequest", null, n), s.exportSymbol("proto.access.ExecuteScriptResponse", null, n), s.exportSymbol("proto.access.GetAccountRequest", null, n), s.exportSymbol("proto.access.GetAccountResponse", null, n), s.exportSymbol("proto.access.GetBlockByHeightRequest", null, n), s.exportSymbol("proto.access.GetBlockByIDRequest", null, n), s.exportSymbol("proto.access.GetBlockHeaderByHeightRequest", null, n), s.exportSymbol("proto.access.GetBlockHeaderByIDRequest", null, n), s.exportSymbol("proto.access.GetCollectionByIDRequest", null, n), s.exportSymbol("proto.access.GetEventsForBlockIDsRequest", null, n), s.exportSymbol("proto.access.GetEventsForHeightRangeRequest", null, n), s.exportSymbol("proto.access.GetLatestBlockHeaderRequest", null, n), s.exportSymbol("proto.access.GetLatestBlockRequest", null, n), s.exportSymbol("proto.access.GetTransactionRequest", null, n), s.exportSymbol("proto.access.PingRequest", null, n), s.exportSymbol("proto.access.PingResponse", null, n), s.exportSymbol("proto.access.SendTransactionRequest", null, n), s.exportSymbol("proto.access.SendTransactionResponse", null, n), s.exportSymbol("proto.access.TransactionResponse", null, n), s.exportSymbol("proto.access.TransactionResultResponse", null, n), proto.access.PingRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.PingRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.PingRequest.displayName = "proto.access.PingRequest"), proto.access.PingResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.PingResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.PingResponse.displayName = "proto.access.PingResponse"), proto.access.GetLatestBlockHeaderRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetLatestBlockHeaderRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetLatestBlockHeaderRequest.displayName = "proto.access.GetLatestBlockHeaderRequest"), proto.access.GetBlockHeaderByIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetBlockHeaderByIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetBlockHeaderByIDRequest.displayName = "proto.access.GetBlockHeaderByIDRequest"), proto.access.GetBlockHeaderByHeightRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetBlockHeaderByHeightRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetBlockHeaderByHeightRequest.displayName = "proto.access.GetBlockHeaderByHeightRequest"), proto.access.BlockHeaderResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.BlockHeaderResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.BlockHeaderResponse.displayName = "proto.access.BlockHeaderResponse"), proto.access.GetLatestBlockRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetLatestBlockRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetLatestBlockRequest.displayName = "proto.access.GetLatestBlockRequest"), proto.access.GetBlockByIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetBlockByIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetBlockByIDRequest.displayName = "proto.access.GetBlockByIDRequest"), proto.access.GetBlockByHeightRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetBlockByHeightRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetBlockByHeightRequest.displayName = "proto.access.GetBlockByHeightRequest"), proto.access.BlockResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.BlockResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.BlockResponse.displayName = "proto.access.BlockResponse"), proto.access.GetCollectionByIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetCollectionByIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetCollectionByIDRequest.displayName = "proto.access.GetCollectionByIDRequest"), proto.access.CollectionResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.CollectionResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.CollectionResponse.displayName = "proto.access.CollectionResponse"), proto.access.SendTransactionRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.SendTransactionRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.SendTransactionRequest.displayName = "proto.access.SendTransactionRequest"), proto.access.SendTransactionResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.SendTransactionResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.SendTransactionResponse.displayName = "proto.access.SendTransactionResponse"), proto.access.GetTransactionRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetTransactionRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetTransactionRequest.displayName = "proto.access.GetTransactionRequest"), proto.access.TransactionResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.TransactionResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.TransactionResponse.displayName = "proto.access.TransactionResponse"), proto.access.TransactionResultResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.access.TransactionResultResponse.repeatedFields_, null)
            }, s.inherits(proto.access.TransactionResultResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.TransactionResultResponse.displayName = "proto.access.TransactionResultResponse"), proto.access.GetAccountRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetAccountRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetAccountRequest.displayName = "proto.access.GetAccountRequest"), proto.access.GetAccountResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetAccountResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.GetAccountResponse.displayName = "proto.access.GetAccountResponse"), proto.access.ExecuteScriptAtLatestBlockRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.ExecuteScriptAtLatestBlockRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.ExecuteScriptAtLatestBlockRequest.displayName = "proto.access.ExecuteScriptAtLatestBlockRequest"), proto.access.ExecuteScriptAtBlockIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.ExecuteScriptAtBlockIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.ExecuteScriptAtBlockIDRequest.displayName = "proto.access.ExecuteScriptAtBlockIDRequest"), proto.access.ExecuteScriptAtBlockHeightRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.ExecuteScriptAtBlockHeightRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.ExecuteScriptAtBlockHeightRequest.displayName = "proto.access.ExecuteScriptAtBlockHeightRequest"), proto.access.ExecuteScriptResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.ExecuteScriptResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.ExecuteScriptResponse.displayName = "proto.access.ExecuteScriptResponse"), proto.access.GetEventsForHeightRangeRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.access.GetEventsForHeightRangeRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetEventsForHeightRangeRequest.displayName = "proto.access.GetEventsForHeightRangeRequest"), proto.access.GetEventsForBlockIDsRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.access.GetEventsForBlockIDsRequest.repeatedFields_, null)
            }, s.inherits(proto.access.GetEventsForBlockIDsRequest, r.Message), s.DEBUG && !COMPILED && (proto.access.GetEventsForBlockIDsRequest.displayName = "proto.access.GetEventsForBlockIDsRequest"), proto.access.EventsResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.access.EventsResponse.repeatedFields_, null)
            }, s.inherits(proto.access.EventsResponse, r.Message), s.DEBUG && !COMPILED && (proto.access.EventsResponse.displayName = "proto.access.EventsResponse"), proto.access.EventsResponse.Result = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.access.EventsResponse.Result.repeatedFields_, null)
            }, s.inherits(proto.access.EventsResponse.Result, r.Message), s.DEBUG && !COMPILED && (proto.access.EventsResponse.Result.displayName = "proto.access.EventsResponse.Result"), r.Message.GENERATE_TO_OBJECT && (proto.access.PingRequest.prototype.toObject = function(e) {
                return proto.access.PingRequest.toObject(e, this)
            }, proto.access.PingRequest.toObject = function(e, t) {
                var o = {};
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.PingRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.PingRequest;
                return proto.access.PingRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.PingRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) t.getFieldNumber(), t.skipField();
                return e
            }, proto.access.PingRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.PingRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.PingRequest.serializeBinaryToWriter = function(e, t) {}, r.Message.GENERATE_TO_OBJECT && (proto.access.PingResponse.prototype.toObject = function(e) {
                return proto.access.PingResponse.toObject(e, this)
            }, proto.access.PingResponse.toObject = function(e, t) {
                var o = {};
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.PingResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.PingResponse;
                return proto.access.PingResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.PingResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) t.getFieldNumber(), t.skipField();
                return e
            }, proto.access.PingResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.PingResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.PingResponse.serializeBinaryToWriter = function(e, t) {}, r.Message.GENERATE_TO_OBJECT && (proto.access.GetLatestBlockHeaderRequest.prototype.toObject = function(e) {
                return proto.access.GetLatestBlockHeaderRequest.toObject(e, this)
            }, proto.access.GetLatestBlockHeaderRequest.toObject = function(e, t) {
                var o = {
                    isSealed: r.Message.getBooleanFieldWithDefault(t, 1, !1)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetLatestBlockHeaderRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetLatestBlockHeaderRequest;
                return proto.access.GetLatestBlockHeaderRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetLatestBlockHeaderRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBool();
                        e.setIsSealed(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetLatestBlockHeaderRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetLatestBlockHeaderRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetLatestBlockHeaderRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getIsSealed()) && t.writeBool(1, o)
            }, proto.access.GetLatestBlockHeaderRequest.prototype.getIsSealed = function() {
                return r.Message.getBooleanFieldWithDefault(this, 1, !1)
            }, proto.access.GetLatestBlockHeaderRequest.prototype.setIsSealed = function(e) {
                return r.Message.setProto3BooleanField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetBlockHeaderByIDRequest.prototype.toObject = function(e) {
                return proto.access.GetBlockHeaderByIDRequest.toObject(e, this)
            }, proto.access.GetBlockHeaderByIDRequest.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetBlockHeaderByIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetBlockHeaderByIDRequest;
                return proto.access.GetBlockHeaderByIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetBlockHeaderByIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetBlockHeaderByIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetBlockHeaderByIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetBlockHeaderByIDRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.GetBlockHeaderByIDRequest.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetBlockHeaderByIDRequest.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.access.GetBlockHeaderByIDRequest.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.access.GetBlockHeaderByIDRequest.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetBlockHeaderByHeightRequest.prototype.toObject = function(e) {
                return proto.access.GetBlockHeaderByHeightRequest.toObject(e, this)
            }, proto.access.GetBlockHeaderByHeightRequest.toObject = function(e, t) {
                var o = {
                    height: r.Message.getFieldWithDefault(t, 1, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetBlockHeaderByHeightRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetBlockHeaderByHeightRequest;
                return proto.access.GetBlockHeaderByHeightRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetBlockHeaderByHeightRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readUint64();
                        e.setHeight(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetBlockHeaderByHeightRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetBlockHeaderByHeightRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetBlockHeaderByHeightRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                0 !== (o = e.getHeight()) && t.writeUint64(1, o)
            }, proto.access.GetBlockHeaderByHeightRequest.prototype.getHeight = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.access.GetBlockHeaderByHeightRequest.prototype.setHeight = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.BlockHeaderResponse.prototype.toObject = function(e) {
                return proto.access.BlockHeaderResponse.toObject(e, this)
            }, proto.access.BlockHeaderResponse.toObject = function(e, t) {
                var o, r = {
                    block: (o = t.getBlock()) && i.BlockHeader.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.BlockHeaderResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.BlockHeaderResponse;
                return proto.access.BlockHeaderResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.BlockHeaderResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new i.BlockHeader;
                        t.readMessage(o, i.BlockHeader.deserializeBinaryFromReader), e.setBlock(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.BlockHeaderResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.BlockHeaderResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.BlockHeaderResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getBlock()) && t.writeMessage(1, o, i.BlockHeader.serializeBinaryToWriter)
            }, proto.access.BlockHeaderResponse.prototype.getBlock = function() {
                return r.Message.getWrapperField(this, i.BlockHeader, 1)
            }, proto.access.BlockHeaderResponse.prototype.setBlock = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.BlockHeaderResponse.prototype.clearBlock = function() {
                return this.setBlock(void 0)
            }, proto.access.BlockHeaderResponse.prototype.hasBlock = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetLatestBlockRequest.prototype.toObject = function(e) {
                return proto.access.GetLatestBlockRequest.toObject(e, this)
            }, proto.access.GetLatestBlockRequest.toObject = function(e, t) {
                var o = {
                    isSealed: r.Message.getBooleanFieldWithDefault(t, 1, !1)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetLatestBlockRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetLatestBlockRequest;
                return proto.access.GetLatestBlockRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetLatestBlockRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBool();
                        e.setIsSealed(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetLatestBlockRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetLatestBlockRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetLatestBlockRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getIsSealed()) && t.writeBool(1, o)
            }, proto.access.GetLatestBlockRequest.prototype.getIsSealed = function() {
                return r.Message.getBooleanFieldWithDefault(this, 1, !1)
            }, proto.access.GetLatestBlockRequest.prototype.setIsSealed = function(e) {
                return r.Message.setProto3BooleanField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetBlockByIDRequest.prototype.toObject = function(e) {
                return proto.access.GetBlockByIDRequest.toObject(e, this)
            }, proto.access.GetBlockByIDRequest.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetBlockByIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetBlockByIDRequest;
                return proto.access.GetBlockByIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetBlockByIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetBlockByIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetBlockByIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetBlockByIDRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.GetBlockByIDRequest.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetBlockByIDRequest.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.access.GetBlockByIDRequest.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.access.GetBlockByIDRequest.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetBlockByHeightRequest.prototype.toObject = function(e) {
                return proto.access.GetBlockByHeightRequest.toObject(e, this)
            }, proto.access.GetBlockByHeightRequest.toObject = function(e, t) {
                var o = {
                    height: r.Message.getFieldWithDefault(t, 1, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetBlockByHeightRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetBlockByHeightRequest;
                return proto.access.GetBlockByHeightRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetBlockByHeightRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readUint64();
                        e.setHeight(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetBlockByHeightRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetBlockByHeightRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetBlockByHeightRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                0 !== (o = e.getHeight()) && t.writeUint64(1, o)
            }, proto.access.GetBlockByHeightRequest.prototype.getHeight = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.access.GetBlockByHeightRequest.prototype.setHeight = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.BlockResponse.prototype.toObject = function(e) {
                return proto.access.BlockResponse.toObject(e, this)
            }, proto.access.BlockResponse.toObject = function(e, t) {
                var o, r = {
                    block: (o = t.getBlock()) && a.Block.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.BlockResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.BlockResponse;
                return proto.access.BlockResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.BlockResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new a.Block;
                        t.readMessage(o, a.Block.deserializeBinaryFromReader), e.setBlock(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.BlockResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.BlockResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.BlockResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getBlock()) && t.writeMessage(1, o, a.Block.serializeBinaryToWriter)
            }, proto.access.BlockResponse.prototype.getBlock = function() {
                return r.Message.getWrapperField(this, a.Block, 1)
            }, proto.access.BlockResponse.prototype.setBlock = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.BlockResponse.prototype.clearBlock = function() {
                return this.setBlock(void 0)
            }, proto.access.BlockResponse.prototype.hasBlock = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetCollectionByIDRequest.prototype.toObject = function(e) {
                return proto.access.GetCollectionByIDRequest.toObject(e, this)
            }, proto.access.GetCollectionByIDRequest.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetCollectionByIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetCollectionByIDRequest;
                return proto.access.GetCollectionByIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetCollectionByIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetCollectionByIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetCollectionByIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetCollectionByIDRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.GetCollectionByIDRequest.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetCollectionByIDRequest.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.access.GetCollectionByIDRequest.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.access.GetCollectionByIDRequest.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.CollectionResponse.prototype.toObject = function(e) {
                return proto.access.CollectionResponse.toObject(e, this)
            }, proto.access.CollectionResponse.toObject = function(e, t) {
                var o, r = {
                    collection: (o = t.getCollection()) && g.Collection.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.CollectionResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.CollectionResponse;
                return proto.access.CollectionResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.CollectionResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new g.Collection;
                        t.readMessage(o, g.Collection.deserializeBinaryFromReader), e.setCollection(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.CollectionResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.CollectionResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.CollectionResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getCollection()) && t.writeMessage(1, o, g.Collection.serializeBinaryToWriter)
            }, proto.access.CollectionResponse.prototype.getCollection = function() {
                return r.Message.getWrapperField(this, g.Collection, 1)
            }, proto.access.CollectionResponse.prototype.setCollection = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.CollectionResponse.prototype.clearCollection = function() {
                return this.setCollection(void 0)
            }, proto.access.CollectionResponse.prototype.hasCollection = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.SendTransactionRequest.prototype.toObject = function(e) {
                return proto.access.SendTransactionRequest.toObject(e, this)
            }, proto.access.SendTransactionRequest.toObject = function(e, t) {
                var o, r = {
                    transaction: (o = t.getTransaction()) && c.Transaction.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.SendTransactionRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.SendTransactionRequest;
                return proto.access.SendTransactionRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.SendTransactionRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new c.Transaction;
                        t.readMessage(o, c.Transaction.deserializeBinaryFromReader), e.setTransaction(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.SendTransactionRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.SendTransactionRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.SendTransactionRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getTransaction()) && t.writeMessage(1, o, c.Transaction.serializeBinaryToWriter)
            }, proto.access.SendTransactionRequest.prototype.getTransaction = function() {
                return r.Message.getWrapperField(this, c.Transaction, 1)
            }, proto.access.SendTransactionRequest.prototype.setTransaction = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.SendTransactionRequest.prototype.clearTransaction = function() {
                return this.setTransaction(void 0)
            }, proto.access.SendTransactionRequest.prototype.hasTransaction = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.SendTransactionResponse.prototype.toObject = function(e) {
                return proto.access.SendTransactionResponse.toObject(e, this)
            }, proto.access.SendTransactionResponse.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.SendTransactionResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.SendTransactionResponse;
                return proto.access.SendTransactionResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.SendTransactionResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.SendTransactionResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.SendTransactionResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.SendTransactionResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.SendTransactionResponse.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.SendTransactionResponse.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.access.SendTransactionResponse.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.access.SendTransactionResponse.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetTransactionRequest.prototype.toObject = function(e) {
                return proto.access.GetTransactionRequest.toObject(e, this)
            }, proto.access.GetTransactionRequest.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetTransactionRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetTransactionRequest;
                return proto.access.GetTransactionRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetTransactionRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetTransactionRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetTransactionRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetTransactionRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.GetTransactionRequest.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetTransactionRequest.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.access.GetTransactionRequest.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.access.GetTransactionRequest.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.TransactionResponse.prototype.toObject = function(e) {
                return proto.access.TransactionResponse.toObject(e, this)
            }, proto.access.TransactionResponse.toObject = function(e, t) {
                var o, r = {
                    transaction: (o = t.getTransaction()) && c.Transaction.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.TransactionResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.TransactionResponse;
                return proto.access.TransactionResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.TransactionResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new c.Transaction;
                        t.readMessage(o, c.Transaction.deserializeBinaryFromReader), e.setTransaction(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.TransactionResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.TransactionResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.TransactionResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getTransaction()) && t.writeMessage(1, o, c.Transaction.serializeBinaryToWriter)
            }, proto.access.TransactionResponse.prototype.getTransaction = function() {
                return r.Message.getWrapperField(this, c.Transaction, 1)
            }, proto.access.TransactionResponse.prototype.setTransaction = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.TransactionResponse.prototype.clearTransaction = function() {
                return this.setTransaction(void 0)
            }, proto.access.TransactionResponse.prototype.hasTransaction = function() {
                return null != r.Message.getField(this, 1)
            }, proto.access.TransactionResultResponse.repeatedFields_ = [4], r.Message.GENERATE_TO_OBJECT && (proto.access.TransactionResultResponse.prototype.toObject = function(e) {
                return proto.access.TransactionResultResponse.toObject(e, this)
            }, proto.access.TransactionResultResponse.toObject = function(e, t) {
                var o = {
                    status: r.Message.getFieldWithDefault(t, 1, 0),
                    statusCode: r.Message.getFieldWithDefault(t, 2, 0),
                    errorMessage: r.Message.getFieldWithDefault(t, 3, ""),
                    eventsList: r.Message.toObjectList(t.getEventsList(), l.Event.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.TransactionResultResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.TransactionResultResponse;
                return proto.access.TransactionResultResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.TransactionResultResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readEnum();
                        e.setStatus(o);
                        break;
                    case 2:
                        o = t.readUint32(), e.setStatusCode(o);
                        break;
                    case 3:
                        o = t.readString(), e.setErrorMessage(o);
                        break;
                    case 4:
                        o = new l.Event, t.readMessage(o, l.Event.deserializeBinaryFromReader), e.addEvents(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.TransactionResultResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.TransactionResultResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.TransactionResultResponse.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                0 !== (o = e.getStatus()) && t.writeEnum(1, o), 0 !== (o = e.getStatusCode()) && t.writeUint32(2, o), (o = e.getErrorMessage()).length > 0 && t.writeString(3, o), (o = e.getEventsList()).length > 0 && t.writeRepeatedMessage(4, o, l.Event.serializeBinaryToWriter)
            }, proto.access.TransactionResultResponse.prototype.getStatus = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.access.TransactionResultResponse.prototype.setStatus = function(e) {
                return r.Message.setProto3EnumField(this, 1, e)
            }, proto.access.TransactionResultResponse.prototype.getStatusCode = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.access.TransactionResultResponse.prototype.setStatusCode = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.access.TransactionResultResponse.prototype.getErrorMessage = function() {
                return r.Message.getFieldWithDefault(this, 3, "")
            }, proto.access.TransactionResultResponse.prototype.setErrorMessage = function(e) {
                return r.Message.setProto3StringField(this, 3, e)
            }, proto.access.TransactionResultResponse.prototype.getEventsList = function() {
                return r.Message.getRepeatedWrapperField(this, l.Event, 4)
            }, proto.access.TransactionResultResponse.prototype.setEventsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 4, e)
            }, proto.access.TransactionResultResponse.prototype.addEvents = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 4, e, proto.entities.Event, t)
            }, proto.access.TransactionResultResponse.prototype.clearEventsList = function() {
                return this.setEventsList([])
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetAccountRequest.prototype.toObject = function(e) {
                return proto.access.GetAccountRequest.toObject(e, this)
            }, proto.access.GetAccountRequest.toObject = function(e, t) {
                var o = {
                    address: t.getAddress_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetAccountRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetAccountRequest;
                return proto.access.GetAccountRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetAccountRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setAddress(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetAccountRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetAccountRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetAccountRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getAddress_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.GetAccountRequest.prototype.getAddress = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetAccountRequest.prototype.getAddress_asB64 = function() {
                return r.Message.bytesAsB64(this.getAddress())
            }, proto.access.GetAccountRequest.prototype.getAddress_asU8 = function() {
                return r.Message.bytesAsU8(this.getAddress())
            }, proto.access.GetAccountRequest.prototype.setAddress = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetAccountResponse.prototype.toObject = function(e) {
                return proto.access.GetAccountResponse.toObject(e, this)
            }, proto.access.GetAccountResponse.toObject = function(e, t) {
                var o, r = {
                    account: (o = t.getAccount()) && u.Account.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.access.GetAccountResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetAccountResponse;
                return proto.access.GetAccountResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.GetAccountResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new u.Account;
                        t.readMessage(o, u.Account.deserializeBinaryFromReader), e.setAccount(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetAccountResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetAccountResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetAccountResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getAccount()) && t.writeMessage(1, o, u.Account.serializeBinaryToWriter)
            }, proto.access.GetAccountResponse.prototype.getAccount = function() {
                return r.Message.getWrapperField(this, u.Account, 1)
            }, proto.access.GetAccountResponse.prototype.setAccount = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.access.GetAccountResponse.prototype.clearAccount = function() {
                return this.setAccount(void 0)
            }, proto.access.GetAccountResponse.prototype.hasAccount = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.ExecuteScriptAtLatestBlockRequest.prototype.toObject = function(e) {
                return proto.access.ExecuteScriptAtLatestBlockRequest.toObject(e, this)
            }, proto.access.ExecuteScriptAtLatestBlockRequest.toObject = function(e, t) {
                var o = {
                    script: t.getScript_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.ExecuteScriptAtLatestBlockRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.ExecuteScriptAtLatestBlockRequest;
                return proto.access.ExecuteScriptAtLatestBlockRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.ExecuteScriptAtLatestBlockRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setScript(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.ExecuteScriptAtLatestBlockRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.ExecuteScriptAtLatestBlockRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.ExecuteScriptAtLatestBlockRequest.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getScript_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.ExecuteScriptAtLatestBlockRequest.prototype.getScript = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.ExecuteScriptAtLatestBlockRequest.prototype.getScript_asB64 = function() {
                return r.Message.bytesAsB64(this.getScript())
            }, proto.access.ExecuteScriptAtLatestBlockRequest.prototype.getScript_asU8 = function() {
                return r.Message.bytesAsU8(this.getScript())
            }, proto.access.ExecuteScriptAtLatestBlockRequest.prototype.setScript = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.ExecuteScriptAtBlockIDRequest.prototype.toObject = function(e) {
                return proto.access.ExecuteScriptAtBlockIDRequest.toObject(e, this)
            }, proto.access.ExecuteScriptAtBlockIDRequest.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    script: t.getScript_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.ExecuteScriptAtBlockIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.ExecuteScriptAtBlockIDRequest;
                return proto.access.ExecuteScriptAtBlockIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.ExecuteScriptAtBlockIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setScript(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.ExecuteScriptAtBlockIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.ExecuteScriptAtBlockIDRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getScript_asU8()).length > 0 && t.writeBytes(2, o)
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getScript = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getScript_asB64 = function() {
                return r.Message.bytesAsB64(this.getScript())
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.getScript_asU8 = function() {
                return r.Message.bytesAsU8(this.getScript())
            }, proto.access.ExecuteScriptAtBlockIDRequest.prototype.setScript = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.ExecuteScriptAtBlockHeightRequest.prototype.toObject = function(e) {
                return proto.access.ExecuteScriptAtBlockHeightRequest.toObject(e, this)
            }, proto.access.ExecuteScriptAtBlockHeightRequest.toObject = function(e, t) {
                var o = {
                    blockHeight: r.Message.getFieldWithDefault(t, 1, 0),
                    script: t.getScript_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.ExecuteScriptAtBlockHeightRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.ExecuteScriptAtBlockHeightRequest;
                return proto.access.ExecuteScriptAtBlockHeightRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.ExecuteScriptAtBlockHeightRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readUint64();
                        e.setBlockHeight(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setScript(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.ExecuteScriptAtBlockHeightRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.ExecuteScriptAtBlockHeightRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                0 !== (o = e.getBlockHeight()) && t.writeUint64(1, o), (o = e.getScript_asU8()).length > 0 && t.writeBytes(2, o)
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.getBlockHeight = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.setBlockHeight = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.getScript = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.getScript_asB64 = function() {
                return r.Message.bytesAsB64(this.getScript())
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.getScript_asU8 = function() {
                return r.Message.bytesAsU8(this.getScript())
            }, proto.access.ExecuteScriptAtBlockHeightRequest.prototype.setScript = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.ExecuteScriptResponse.prototype.toObject = function(e) {
                return proto.access.ExecuteScriptResponse.toObject(e, this)
            }, proto.access.ExecuteScriptResponse.toObject = function(e, t) {
                var o = {
                    value: t.getValue_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.ExecuteScriptResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.ExecuteScriptResponse;
                return proto.access.ExecuteScriptResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.ExecuteScriptResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setValue(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.ExecuteScriptResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.ExecuteScriptResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.ExecuteScriptResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getValue_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.access.ExecuteScriptResponse.prototype.getValue = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.ExecuteScriptResponse.prototype.getValue_asB64 = function() {
                return r.Message.bytesAsB64(this.getValue())
            }, proto.access.ExecuteScriptResponse.prototype.getValue_asU8 = function() {
                return r.Message.bytesAsU8(this.getValue())
            }, proto.access.ExecuteScriptResponse.prototype.setValue = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.access.GetEventsForHeightRangeRequest.prototype.toObject = function(e) {
                return proto.access.GetEventsForHeightRangeRequest.toObject(e, this)
            }, proto.access.GetEventsForHeightRangeRequest.toObject = function(e, t) {
                var o = {
                    type: r.Message.getFieldWithDefault(t, 1, ""),
                    startHeight: r.Message.getFieldWithDefault(t, 2, 0),
                    endHeight: r.Message.getFieldWithDefault(t, 3, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetEventsForHeightRangeRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetEventsForHeightRangeRequest;
                return proto.access.GetEventsForHeightRangeRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetEventsForHeightRangeRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readString();
                        e.setType(o);
                        break;
                    case 2:
                        o = t.readUint64(), e.setStartHeight(o);
                        break;
                    case 3:
                        o = t.readUint64(), e.setEndHeight(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetEventsForHeightRangeRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetEventsForHeightRangeRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetEventsForHeightRangeRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getType()).length > 0 && t.writeString(1, o), 0 !== (o = e.getStartHeight()) && t.writeUint64(2, o), 0 !== (o = e.getEndHeight()) && t.writeUint64(3, o)
            }, proto.access.GetEventsForHeightRangeRequest.prototype.getType = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetEventsForHeightRangeRequest.prototype.setType = function(e) {
                return r.Message.setProto3StringField(this, 1, e)
            }, proto.access.GetEventsForHeightRangeRequest.prototype.getStartHeight = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.access.GetEventsForHeightRangeRequest.prototype.setStartHeight = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.access.GetEventsForHeightRangeRequest.prototype.getEndHeight = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.access.GetEventsForHeightRangeRequest.prototype.setEndHeight = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, proto.access.GetEventsForBlockIDsRequest.repeatedFields_ = [2], r.Message.GENERATE_TO_OBJECT && (proto.access.GetEventsForBlockIDsRequest.prototype.toObject = function(e) {
                return proto.access.GetEventsForBlockIDsRequest.toObject(e, this)
            }, proto.access.GetEventsForBlockIDsRequest.toObject = function(e, t) {
                var o = {
                    type: r.Message.getFieldWithDefault(t, 1, ""),
                    blockIdsList: t.getBlockIdsList_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.GetEventsForBlockIDsRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.GetEventsForBlockIDsRequest;
                return proto.access.GetEventsForBlockIDsRequest.deserializeBinaryFromReader(o, t)
            }, proto.access.GetEventsForBlockIDsRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readString();
                        e.setType(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.addBlockIds(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.GetEventsForBlockIDsRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.GetEventsForBlockIDsRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.GetEventsForBlockIDsRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getType()).length > 0 && t.writeString(1, o), (o = e.getBlockIdsList_asU8()).length > 0 && t.writeRepeatedBytes(2, o)
            }, proto.access.GetEventsForBlockIDsRequest.prototype.getType = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.GetEventsForBlockIDsRequest.prototype.setType = function(e) {
                return r.Message.setProto3StringField(this, 1, e)
            }, proto.access.GetEventsForBlockIDsRequest.prototype.getBlockIdsList = function() {
                return r.Message.getRepeatedField(this, 2)
            }, proto.access.GetEventsForBlockIDsRequest.prototype.getBlockIdsList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getBlockIdsList())
            }, proto.access.GetEventsForBlockIDsRequest.prototype.getBlockIdsList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getBlockIdsList())
            }, proto.access.GetEventsForBlockIDsRequest.prototype.setBlockIdsList = function(e) {
                return r.Message.setField(this, 2, e || [])
            }, proto.access.GetEventsForBlockIDsRequest.prototype.addBlockIds = function(e, t) {
                return r.Message.addToRepeatedField(this, 2, e, t)
            }, proto.access.GetEventsForBlockIDsRequest.prototype.clearBlockIdsList = function() {
                return this.setBlockIdsList([])
            }, proto.access.EventsResponse.repeatedFields_ = [1], r.Message.GENERATE_TO_OBJECT && (proto.access.EventsResponse.prototype.toObject = function(e) {
                return proto.access.EventsResponse.toObject(e, this)
            }, proto.access.EventsResponse.toObject = function(e, t) {
                var o = {
                    resultsList: r.Message.toObjectList(t.getResultsList(), proto.access.EventsResponse.Result.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.EventsResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.EventsResponse;
                return proto.access.EventsResponse.deserializeBinaryFromReader(o, t)
            }, proto.access.EventsResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new proto.access.EventsResponse.Result;
                        t.readMessage(o, proto.access.EventsResponse.Result.deserializeBinaryFromReader), e.addResults(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.EventsResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.EventsResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.EventsResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getResultsList()).length > 0 && t.writeRepeatedMessage(1, o, proto.access.EventsResponse.Result.serializeBinaryToWriter)
            }, proto.access.EventsResponse.Result.repeatedFields_ = [3], r.Message.GENERATE_TO_OBJECT && (proto.access.EventsResponse.Result.prototype.toObject = function(e) {
                return proto.access.EventsResponse.Result.toObject(e, this)
            }, proto.access.EventsResponse.Result.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    blockHeight: r.Message.getFieldWithDefault(t, 2, 0),
                    eventsList: r.Message.toObjectList(t.getEventsList(), l.Event.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.access.EventsResponse.Result.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.access.EventsResponse.Result;
                return proto.access.EventsResponse.Result.deserializeBinaryFromReader(o, t)
            }, proto.access.EventsResponse.Result.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readUint64(), e.setBlockHeight(o);
                        break;
                    case 3:
                        o = new l.Event, t.readMessage(o, l.Event.deserializeBinaryFromReader), e.addEvents(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.access.EventsResponse.Result.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.access.EventsResponse.Result.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.access.EventsResponse.Result.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), 0 !== (o = e.getBlockHeight()) && t.writeUint64(2, o), (o = e.getEventsList()).length > 0 && t.writeRepeatedMessage(3, o, l.Event.serializeBinaryToWriter)
            }, proto.access.EventsResponse.Result.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.access.EventsResponse.Result.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.access.EventsResponse.Result.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.access.EventsResponse.Result.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.access.EventsResponse.Result.prototype.getBlockHeight = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.access.EventsResponse.Result.prototype.setBlockHeight = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.access.EventsResponse.Result.prototype.getEventsList = function() {
                return r.Message.getRepeatedWrapperField(this, l.Event, 3)
            }, proto.access.EventsResponse.Result.prototype.setEventsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 3, e)
            }, proto.access.EventsResponse.Result.prototype.addEvents = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 3, e, proto.entities.Event, t)
            }, proto.access.EventsResponse.Result.prototype.clearEventsList = function() {
                return this.setEventsList([])
            }, proto.access.EventsResponse.prototype.getResultsList = function() {
                return r.Message.getRepeatedWrapperField(this, proto.access.EventsResponse.Result, 1)
            }, proto.access.EventsResponse.prototype.setResultsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 1, e)
            }, proto.access.EventsResponse.prototype.addResults = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 1, e, proto.access.EventsResponse.Result, t)
            }, proto.access.EventsResponse.prototype.clearResultsList = function() {
                return this.setResultsList([])
            }, s.object.extend(t, proto.access)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.BlockHeader", null, n), proto.entities.BlockHeader = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.entities.BlockHeader, r.Message), s.DEBUG && !COMPILED && (proto.entities.BlockHeader.displayName = "proto.entities.BlockHeader"), r.Message.GENERATE_TO_OBJECT && (proto.entities.BlockHeader.prototype.toObject = function(e) {
                return proto.entities.BlockHeader.toObject(e, this)
            }, proto.entities.BlockHeader.toObject = function(e, t) {
                var o = {
                    id: t.getId_asB64(),
                    parentId: t.getParentId_asB64(),
                    height: r.Message.getFieldWithDefault(t, 3, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.BlockHeader.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.BlockHeader;
                return proto.entities.BlockHeader.deserializeBinaryFromReader(o, t)
            }, proto.entities.BlockHeader.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setParentId(o);
                        break;
                    case 3:
                        o = t.readUint64(), e.setHeight(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.BlockHeader.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.BlockHeader.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.BlockHeader.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getParentId_asU8()).length > 0 && t.writeBytes(2, o), 0 !== (o = e.getHeight()) && t.writeUint64(3, o)
            }, proto.entities.BlockHeader.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.BlockHeader.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.entities.BlockHeader.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.entities.BlockHeader.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.BlockHeader.prototype.getParentId = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.entities.BlockHeader.prototype.getParentId_asB64 = function() {
                return r.Message.bytesAsB64(this.getParentId())
            }, proto.entities.BlockHeader.prototype.getParentId_asU8 = function() {
                return r.Message.bytesAsU8(this.getParentId())
            }, proto.entities.BlockHeader.prototype.setParentId = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.entities.BlockHeader.prototype.getHeight = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.entities.BlockHeader.prototype.setHeight = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")(),
                i = o(21);
            s.object.extend(proto, i);
            var a = o(1);
            s.object.extend(proto, a);
            var g = o(7);
            s.object.extend(proto, g), s.exportSymbol("proto.entities.Block", null, n), proto.entities.Block = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.Block.repeatedFields_, null)
            }, s.inherits(proto.entities.Block, r.Message), s.DEBUG && !COMPILED && (proto.entities.Block.displayName = "proto.entities.Block"), proto.entities.Block.repeatedFields_ = [5, 6, 7], r.Message.GENERATE_TO_OBJECT && (proto.entities.Block.prototype.toObject = function(e) {
                return proto.entities.Block.toObject(e, this)
            }, proto.entities.Block.toObject = function(e, t) {
                var o, s = {
                    id: t.getId_asB64(),
                    parentId: t.getParentId_asB64(),
                    height: r.Message.getFieldWithDefault(t, 3, 0),
                    timestamp: (o = t.getTimestamp()) && i.Timestamp.toObject(e, o),
                    collectionGuaranteesList: r.Message.toObjectList(t.getCollectionGuaranteesList(), a.CollectionGuarantee.toObject, e),
                    blockSealsList: r.Message.toObjectList(t.getBlockSealsList(), g.BlockSeal.toObject, e),
                    signaturesList: t.getSignaturesList_asB64()
                };
                return e && (s.$jspbMessageInstance = t), s
            }), proto.entities.Block.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Block;
                return proto.entities.Block.deserializeBinaryFromReader(o, t)
            }, proto.entities.Block.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setParentId(o);
                        break;
                    case 3:
                        o = t.readUint64(), e.setHeight(o);
                        break;
                    case 4:
                        o = new i.Timestamp, t.readMessage(o, i.Timestamp.deserializeBinaryFromReader), e.setTimestamp(o);
                        break;
                    case 5:
                        o = new a.CollectionGuarantee, t.readMessage(o, a.CollectionGuarantee.deserializeBinaryFromReader), e.addCollectionGuarantees(o);
                        break;
                    case 6:
                        o = new g.BlockSeal, t.readMessage(o, g.BlockSeal.deserializeBinaryFromReader), e.addBlockSeals(o);
                        break;
                    case 7:
                        o = t.readBytes(), e.addSignatures(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Block.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Block.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Block.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getParentId_asU8()).length > 0 && t.writeBytes(2, o), 0 !== (o = e.getHeight()) && t.writeUint64(3, o), null != (o = e.getTimestamp()) && t.writeMessage(4, o, i.Timestamp.serializeBinaryToWriter), (o = e.getCollectionGuaranteesList()).length > 0 && t.writeRepeatedMessage(5, o, a.CollectionGuarantee.serializeBinaryToWriter), (o = e.getBlockSealsList()).length > 0 && t.writeRepeatedMessage(6, o, g.BlockSeal.serializeBinaryToWriter), (o = e.getSignaturesList_asU8()).length > 0 && t.writeRepeatedBytes(7, o)
            }, proto.entities.Block.prototype.getId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Block.prototype.getId_asB64 = function() {
                return r.Message.bytesAsB64(this.getId())
            }, proto.entities.Block.prototype.getId_asU8 = function() {
                return r.Message.bytesAsU8(this.getId())
            }, proto.entities.Block.prototype.setId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Block.prototype.getParentId = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.entities.Block.prototype.getParentId_asB64 = function() {
                return r.Message.bytesAsB64(this.getParentId())
            }, proto.entities.Block.prototype.getParentId_asU8 = function() {
                return r.Message.bytesAsU8(this.getParentId())
            }, proto.entities.Block.prototype.setParentId = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.entities.Block.prototype.getHeight = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.entities.Block.prototype.setHeight = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, proto.entities.Block.prototype.getTimestamp = function() {
                return r.Message.getWrapperField(this, i.Timestamp, 4)
            }, proto.entities.Block.prototype.setTimestamp = function(e) {
                return r.Message.setWrapperField(this, 4, e)
            }, proto.entities.Block.prototype.clearTimestamp = function() {
                return this.setTimestamp(void 0)
            }, proto.entities.Block.prototype.hasTimestamp = function() {
                return null != r.Message.getField(this, 4)
            }, proto.entities.Block.prototype.getCollectionGuaranteesList = function() {
                return r.Message.getRepeatedWrapperField(this, a.CollectionGuarantee, 5)
            }, proto.entities.Block.prototype.setCollectionGuaranteesList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 5, e)
            }, proto.entities.Block.prototype.addCollectionGuarantees = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 5, e, proto.entities.CollectionGuarantee, t)
            }, proto.entities.Block.prototype.clearCollectionGuaranteesList = function() {
                return this.setCollectionGuaranteesList([])
            }, proto.entities.Block.prototype.getBlockSealsList = function() {
                return r.Message.getRepeatedWrapperField(this, g.BlockSeal, 6)
            }, proto.entities.Block.prototype.setBlockSealsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 6, e)
            }, proto.entities.Block.prototype.addBlockSeals = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 6, e, proto.entities.BlockSeal, t)
            }, proto.entities.Block.prototype.clearBlockSealsList = function() {
                return this.setBlockSealsList([])
            }, proto.entities.Block.prototype.getSignaturesList = function() {
                return r.Message.getRepeatedField(this, 7)
            }, proto.entities.Block.prototype.getSignaturesList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getSignaturesList())
            }, proto.entities.Block.prototype.getSignaturesList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getSignaturesList())
            }, proto.entities.Block.prototype.setSignaturesList = function(e) {
                return r.Message.setField(this, 7, e || [])
            }, proto.entities.Block.prototype.addSignatures = function(e, t) {
                return r.Message.addToRepeatedField(this, 7, e, t)
            }, proto.entities.Block.prototype.clearSignaturesList = function() {
                return this.setSignaturesList([])
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.BlockSeal", null, n), proto.entities.BlockSeal = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.BlockSeal.repeatedFields_, null)
            }, s.inherits(proto.entities.BlockSeal, r.Message), s.DEBUG && !COMPILED && (proto.entities.BlockSeal.displayName = "proto.entities.BlockSeal"), proto.entities.BlockSeal.repeatedFields_ = [3, 4], r.Message.GENERATE_TO_OBJECT && (proto.entities.BlockSeal.prototype.toObject = function(e) {
                return proto.entities.BlockSeal.toObject(e, this)
            }, proto.entities.BlockSeal.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    executionReceiptId: t.getExecutionReceiptId_asB64(),
                    executionReceiptSignaturesList: t.getExecutionReceiptSignaturesList_asB64(),
                    resultApprovalSignaturesList: t.getResultApprovalSignaturesList_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.BlockSeal.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.BlockSeal;
                return proto.entities.BlockSeal.deserializeBinaryFromReader(o, t)
            }, proto.entities.BlockSeal.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setExecutionReceiptId(o);
                        break;
                    case 3:
                        o = t.readBytes(), e.addExecutionReceiptSignatures(o);
                        break;
                    case 4:
                        o = t.readBytes(), e.addResultApprovalSignatures(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.BlockSeal.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.BlockSeal.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.BlockSeal.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getExecutionReceiptId_asU8()).length > 0 && t.writeBytes(2, o), (o = e.getExecutionReceiptSignaturesList_asU8()).length > 0 && t.writeRepeatedBytes(3, o), (o = e.getResultApprovalSignaturesList_asU8()).length > 0 && t.writeRepeatedBytes(4, o)
            }, proto.entities.BlockSeal.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.BlockSeal.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.entities.BlockSeal.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.entities.BlockSeal.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptId = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptId_asB64 = function() {
                return r.Message.bytesAsB64(this.getExecutionReceiptId())
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptId_asU8 = function() {
                return r.Message.bytesAsU8(this.getExecutionReceiptId())
            }, proto.entities.BlockSeal.prototype.setExecutionReceiptId = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptSignaturesList = function() {
                return r.Message.getRepeatedField(this, 3)
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptSignaturesList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getExecutionReceiptSignaturesList())
            }, proto.entities.BlockSeal.prototype.getExecutionReceiptSignaturesList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getExecutionReceiptSignaturesList())
            }, proto.entities.BlockSeal.prototype.setExecutionReceiptSignaturesList = function(e) {
                return r.Message.setField(this, 3, e || [])
            }, proto.entities.BlockSeal.prototype.addExecutionReceiptSignatures = function(e, t) {
                return r.Message.addToRepeatedField(this, 3, e, t)
            }, proto.entities.BlockSeal.prototype.clearExecutionReceiptSignaturesList = function() {
                return this.setExecutionReceiptSignaturesList([])
            }, proto.entities.BlockSeal.prototype.getResultApprovalSignaturesList = function() {
                return r.Message.getRepeatedField(this, 4)
            }, proto.entities.BlockSeal.prototype.getResultApprovalSignaturesList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getResultApprovalSignaturesList())
            }, proto.entities.BlockSeal.prototype.getResultApprovalSignaturesList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getResultApprovalSignaturesList())
            }, proto.entities.BlockSeal.prototype.setResultApprovalSignaturesList = function(e) {
                return r.Message.setField(this, 4, e || [])
            }, proto.entities.BlockSeal.prototype.addResultApprovalSignatures = function(e, t) {
                return r.Message.addToRepeatedField(this, 4, e, t)
            }, proto.entities.BlockSeal.prototype.clearResultApprovalSignaturesList = function() {
                return this.setResultApprovalSignaturesList([])
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.entities.Transaction", null, n), s.exportSymbol("proto.entities.Transaction.ProposalKey", null, n), s.exportSymbol("proto.entities.Transaction.Signature", null, n), s.exportSymbol("proto.entities.TransactionStatus", null, n), proto.entities.Transaction = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.entities.Transaction.repeatedFields_, null)
            }, s.inherits(proto.entities.Transaction, r.Message), s.DEBUG && !COMPILED && (proto.entities.Transaction.displayName = "proto.entities.Transaction"), proto.entities.Transaction.ProposalKey = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.entities.Transaction.ProposalKey, r.Message), s.DEBUG && !COMPILED && (proto.entities.Transaction.ProposalKey.displayName = "proto.entities.Transaction.ProposalKey"), proto.entities.Transaction.Signature = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.entities.Transaction.Signature, r.Message), s.DEBUG && !COMPILED && (proto.entities.Transaction.Signature.displayName = "proto.entities.Transaction.Signature"), proto.entities.Transaction.repeatedFields_ = [2, 7, 8, 9], r.Message.GENERATE_TO_OBJECT && (proto.entities.Transaction.prototype.toObject = function(e) {
                return proto.entities.Transaction.toObject(e, this)
            }, proto.entities.Transaction.toObject = function(e, t) {
                var o, s = {
                    script: t.getScript_asB64(),
                    argumentsList: t.getArgumentsList_asB64(),
                    referenceBlockId: t.getReferenceBlockId_asB64(),
                    gasLimit: r.Message.getFieldWithDefault(t, 4, 0),
                    proposalKey: (o = t.getProposalKey()) && proto.entities.Transaction.ProposalKey.toObject(e, o),
                    payer: t.getPayer_asB64(),
                    authorizersList: t.getAuthorizersList_asB64(),
                    payloadSignaturesList: r.Message.toObjectList(t.getPayloadSignaturesList(), proto.entities.Transaction.Signature.toObject, e),
                    envelopeSignaturesList: r.Message.toObjectList(t.getEnvelopeSignaturesList(), proto.entities.Transaction.Signature.toObject, e)
                };
                return e && (s.$jspbMessageInstance = t), s
            }), proto.entities.Transaction.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Transaction;
                return proto.entities.Transaction.deserializeBinaryFromReader(o, t)
            }, proto.entities.Transaction.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setScript(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.addArguments(o);
                        break;
                    case 3:
                        o = t.readBytes(), e.setReferenceBlockId(o);
                        break;
                    case 4:
                        o = t.readUint64(), e.setGasLimit(o);
                        break;
                    case 5:
                        o = new proto.entities.Transaction.ProposalKey, t.readMessage(o, proto.entities.Transaction.ProposalKey.deserializeBinaryFromReader), e.setProposalKey(o);
                        break;
                    case 6:
                        o = t.readBytes(), e.setPayer(o);
                        break;
                    case 7:
                        o = t.readBytes(), e.addAuthorizers(o);
                        break;
                    case 8:
                        o = new proto.entities.Transaction.Signature, t.readMessage(o, proto.entities.Transaction.Signature.deserializeBinaryFromReader), e.addPayloadSignatures(o);
                        break;
                    case 9:
                        o = new proto.entities.Transaction.Signature, t.readMessage(o, proto.entities.Transaction.Signature.deserializeBinaryFromReader), e.addEnvelopeSignatures(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Transaction.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Transaction.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Transaction.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getScript_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getArgumentsList_asU8()).length > 0 && t.writeRepeatedBytes(2, o), (o = e.getReferenceBlockId_asU8()).length > 0 && t.writeBytes(3, o), 0 !== (o = e.getGasLimit()) && t.writeUint64(4, o), null != (o = e.getProposalKey()) && t.writeMessage(5, o, proto.entities.Transaction.ProposalKey.serializeBinaryToWriter), (o = e.getPayer_asU8()).length > 0 && t.writeBytes(6, o), (o = e.getAuthorizersList_asU8()).length > 0 && t.writeRepeatedBytes(7, o), (o = e.getPayloadSignaturesList()).length > 0 && t.writeRepeatedMessage(8, o, proto.entities.Transaction.Signature.serializeBinaryToWriter), (o = e.getEnvelopeSignaturesList()).length > 0 && t.writeRepeatedMessage(9, o, proto.entities.Transaction.Signature.serializeBinaryToWriter)
            }, r.Message.GENERATE_TO_OBJECT && (proto.entities.Transaction.ProposalKey.prototype.toObject = function(e) {
                return proto.entities.Transaction.ProposalKey.toObject(e, this)
            }, proto.entities.Transaction.ProposalKey.toObject = function(e, t) {
                var o = {
                    address: t.getAddress_asB64(),
                    keyId: r.Message.getFieldWithDefault(t, 2, 0),
                    sequenceNumber: r.Message.getFieldWithDefault(t, 3, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.Transaction.ProposalKey.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Transaction.ProposalKey;
                return proto.entities.Transaction.ProposalKey.deserializeBinaryFromReader(o, t)
            }, proto.entities.Transaction.ProposalKey.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setAddress(o);
                        break;
                    case 2:
                        o = t.readUint32(), e.setKeyId(o);
                        break;
                    case 3:
                        o = t.readUint64(), e.setSequenceNumber(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Transaction.ProposalKey.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Transaction.ProposalKey.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Transaction.ProposalKey.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getAddress_asU8()).length > 0 && t.writeBytes(1, o), 0 !== (o = e.getKeyId()) && t.writeUint32(2, o), 0 !== (o = e.getSequenceNumber()) && t.writeUint64(3, o)
            }, proto.entities.Transaction.ProposalKey.prototype.getAddress = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Transaction.ProposalKey.prototype.getAddress_asB64 = function() {
                return r.Message.bytesAsB64(this.getAddress())
            }, proto.entities.Transaction.ProposalKey.prototype.getAddress_asU8 = function() {
                return r.Message.bytesAsU8(this.getAddress())
            }, proto.entities.Transaction.ProposalKey.prototype.setAddress = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Transaction.ProposalKey.prototype.getKeyId = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.entities.Transaction.ProposalKey.prototype.setKeyId = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.entities.Transaction.ProposalKey.prototype.getSequenceNumber = function() {
                return r.Message.getFieldWithDefault(this, 3, 0)
            }, proto.entities.Transaction.ProposalKey.prototype.setSequenceNumber = function(e) {
                return r.Message.setProto3IntField(this, 3, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.entities.Transaction.Signature.prototype.toObject = function(e) {
                return proto.entities.Transaction.Signature.toObject(e, this)
            }, proto.entities.Transaction.Signature.toObject = function(e, t) {
                var o = {
                    address: t.getAddress_asB64(),
                    keyId: r.Message.getFieldWithDefault(t, 2, 0),
                    signature: t.getSignature_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.entities.Transaction.Signature.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.entities.Transaction.Signature;
                return proto.entities.Transaction.Signature.deserializeBinaryFromReader(o, t)
            }, proto.entities.Transaction.Signature.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setAddress(o);
                        break;
                    case 2:
                        o = t.readUint32(), e.setKeyId(o);
                        break;
                    case 3:
                        o = t.readBytes(), e.setSignature(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.entities.Transaction.Signature.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.entities.Transaction.Signature.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.entities.Transaction.Signature.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getAddress_asU8()).length > 0 && t.writeBytes(1, o), 0 !== (o = e.getKeyId()) && t.writeUint32(2, o), (o = e.getSignature_asU8()).length > 0 && t.writeBytes(3, o)
            }, proto.entities.Transaction.Signature.prototype.getAddress = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Transaction.Signature.prototype.getAddress_asB64 = function() {
                return r.Message.bytesAsB64(this.getAddress())
            }, proto.entities.Transaction.Signature.prototype.getAddress_asU8 = function() {
                return r.Message.bytesAsU8(this.getAddress())
            }, proto.entities.Transaction.Signature.prototype.setAddress = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Transaction.Signature.prototype.getKeyId = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.entities.Transaction.Signature.prototype.setKeyId = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.entities.Transaction.Signature.prototype.getSignature = function() {
                return r.Message.getFieldWithDefault(this, 3, "")
            }, proto.entities.Transaction.Signature.prototype.getSignature_asB64 = function() {
                return r.Message.bytesAsB64(this.getSignature())
            }, proto.entities.Transaction.Signature.prototype.getSignature_asU8 = function() {
                return r.Message.bytesAsU8(this.getSignature())
            }, proto.entities.Transaction.Signature.prototype.setSignature = function(e) {
                return r.Message.setProto3BytesField(this, 3, e)
            }, proto.entities.Transaction.prototype.getScript = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.entities.Transaction.prototype.getScript_asB64 = function() {
                return r.Message.bytesAsB64(this.getScript())
            }, proto.entities.Transaction.prototype.getScript_asU8 = function() {
                return r.Message.bytesAsU8(this.getScript())
            }, proto.entities.Transaction.prototype.setScript = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.entities.Transaction.prototype.getArgumentsList = function() {
                return r.Message.getRepeatedField(this, 2)
            }, proto.entities.Transaction.prototype.getArgumentsList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getArgumentsList())
            }, proto.entities.Transaction.prototype.getArgumentsList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getArgumentsList())
            }, proto.entities.Transaction.prototype.setArgumentsList = function(e) {
                return r.Message.setField(this, 2, e || [])
            }, proto.entities.Transaction.prototype.addArguments = function(e, t) {
                return r.Message.addToRepeatedField(this, 2, e, t)
            }, proto.entities.Transaction.prototype.clearArgumentsList = function() {
                return this.setArgumentsList([])
            }, proto.entities.Transaction.prototype.getReferenceBlockId = function() {
                return r.Message.getFieldWithDefault(this, 3, "")
            }, proto.entities.Transaction.prototype.getReferenceBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getReferenceBlockId())
            }, proto.entities.Transaction.prototype.getReferenceBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getReferenceBlockId())
            }, proto.entities.Transaction.prototype.setReferenceBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 3, e)
            }, proto.entities.Transaction.prototype.getGasLimit = function() {
                return r.Message.getFieldWithDefault(this, 4, 0)
            }, proto.entities.Transaction.prototype.setGasLimit = function(e) {
                return r.Message.setProto3IntField(this, 4, e)
            }, proto.entities.Transaction.prototype.getProposalKey = function() {
                return r.Message.getWrapperField(this, proto.entities.Transaction.ProposalKey, 5)
            }, proto.entities.Transaction.prototype.setProposalKey = function(e) {
                return r.Message.setWrapperField(this, 5, e)
            }, proto.entities.Transaction.prototype.clearProposalKey = function() {
                return this.setProposalKey(void 0)
            }, proto.entities.Transaction.prototype.hasProposalKey = function() {
                return null != r.Message.getField(this, 5)
            }, proto.entities.Transaction.prototype.getPayer = function() {
                return r.Message.getFieldWithDefault(this, 6, "")
            }, proto.entities.Transaction.prototype.getPayer_asB64 = function() {
                return r.Message.bytesAsB64(this.getPayer())
            }, proto.entities.Transaction.prototype.getPayer_asU8 = function() {
                return r.Message.bytesAsU8(this.getPayer())
            }, proto.entities.Transaction.prototype.setPayer = function(e) {
                return r.Message.setProto3BytesField(this, 6, e)
            }, proto.entities.Transaction.prototype.getAuthorizersList = function() {
                return r.Message.getRepeatedField(this, 7)
            }, proto.entities.Transaction.prototype.getAuthorizersList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getAuthorizersList())
            }, proto.entities.Transaction.prototype.getAuthorizersList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getAuthorizersList())
            }, proto.entities.Transaction.prototype.setAuthorizersList = function(e) {
                return r.Message.setField(this, 7, e || [])
            }, proto.entities.Transaction.prototype.addAuthorizers = function(e, t) {
                return r.Message.addToRepeatedField(this, 7, e, t)
            }, proto.entities.Transaction.prototype.clearAuthorizersList = function() {
                return this.setAuthorizersList([])
            }, proto.entities.Transaction.prototype.getPayloadSignaturesList = function() {
                return r.Message.getRepeatedWrapperField(this, proto.entities.Transaction.Signature, 8)
            }, proto.entities.Transaction.prototype.setPayloadSignaturesList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 8, e)
            }, proto.entities.Transaction.prototype.addPayloadSignatures = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 8, e, proto.entities.Transaction.Signature, t)
            }, proto.entities.Transaction.prototype.clearPayloadSignaturesList = function() {
                return this.setPayloadSignaturesList([])
            }, proto.entities.Transaction.prototype.getEnvelopeSignaturesList = function() {
                return r.Message.getRepeatedWrapperField(this, proto.entities.Transaction.Signature, 9)
            }, proto.entities.Transaction.prototype.setEnvelopeSignaturesList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 9, e)
            }, proto.entities.Transaction.prototype.addEnvelopeSignatures = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 9, e, proto.entities.Transaction.Signature, t)
            }, proto.entities.Transaction.prototype.clearEnvelopeSignaturesList = function() {
                return this.setEnvelopeSignaturesList([])
            }, proto.entities.TransactionStatus = {
                UNKNOWN: 0,
                PENDING: 1,
                FINALIZED: 2,
                EXECUTED: 3,
                SEALED: 4
            }, s.object.extend(t, proto.entities)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")(),
                i = o(2);
            s.object.extend(proto, i);
            var a = o(3);
            s.object.extend(proto, a), s.exportSymbol("proto.execution.ExecuteScriptAtBlockIDRequest", null, n), s.exportSymbol("proto.execution.ExecuteScriptAtBlockIDResponse", null, n), s.exportSymbol("proto.execution.GetAccountAtBlockIDRequest", null, n), s.exportSymbol("proto.execution.GetAccountAtBlockIDResponse", null, n), s.exportSymbol("proto.execution.GetEventsForBlockIDsRequest", null, n), s.exportSymbol("proto.execution.GetEventsForBlockIDsResponse", null, n), s.exportSymbol("proto.execution.GetEventsForBlockIDsResponse.Result", null, n), s.exportSymbol("proto.execution.GetTransactionResultRequest", null, n), s.exportSymbol("proto.execution.GetTransactionResultResponse", null, n), s.exportSymbol("proto.execution.PingRequest", null, n), s.exportSymbol("proto.execution.PingResponse", null, n), proto.execution.PingRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.PingRequest, r.Message), s.DEBUG && !COMPILED && (proto.execution.PingRequest.displayName = "proto.execution.PingRequest"), proto.execution.PingResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.PingResponse, r.Message), s.DEBUG && !COMPILED && (proto.execution.PingResponse.displayName = "proto.execution.PingResponse"), proto.execution.GetAccountAtBlockIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.GetAccountAtBlockIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetAccountAtBlockIDRequest.displayName = "proto.execution.GetAccountAtBlockIDRequest"), proto.execution.GetAccountAtBlockIDResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.GetAccountAtBlockIDResponse, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetAccountAtBlockIDResponse.displayName = "proto.execution.GetAccountAtBlockIDResponse"), proto.execution.ExecuteScriptAtBlockIDRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.ExecuteScriptAtBlockIDRequest, r.Message), s.DEBUG && !COMPILED && (proto.execution.ExecuteScriptAtBlockIDRequest.displayName = "proto.execution.ExecuteScriptAtBlockIDRequest"), proto.execution.ExecuteScriptAtBlockIDResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.ExecuteScriptAtBlockIDResponse, r.Message), s.DEBUG && !COMPILED && (proto.execution.ExecuteScriptAtBlockIDResponse.displayName = "proto.execution.ExecuteScriptAtBlockIDResponse"), proto.execution.GetEventsForBlockIDsResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.execution.GetEventsForBlockIDsResponse.repeatedFields_, null)
            }, s.inherits(proto.execution.GetEventsForBlockIDsResponse, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetEventsForBlockIDsResponse.displayName = "proto.execution.GetEventsForBlockIDsResponse"), proto.execution.GetEventsForBlockIDsResponse.Result = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.execution.GetEventsForBlockIDsResponse.Result.repeatedFields_, null)
            }, s.inherits(proto.execution.GetEventsForBlockIDsResponse.Result, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetEventsForBlockIDsResponse.Result.displayName = "proto.execution.GetEventsForBlockIDsResponse.Result"), proto.execution.GetEventsForBlockIDsRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.execution.GetEventsForBlockIDsRequest.repeatedFields_, null)
            }, s.inherits(proto.execution.GetEventsForBlockIDsRequest, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetEventsForBlockIDsRequest.displayName = "proto.execution.GetEventsForBlockIDsRequest"), proto.execution.GetTransactionResultRequest = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.execution.GetTransactionResultRequest, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetTransactionResultRequest.displayName = "proto.execution.GetTransactionResultRequest"), proto.execution.GetTransactionResultResponse = function(e) {
                r.Message.initialize(this, e, 0, -1, proto.execution.GetTransactionResultResponse.repeatedFields_, null)
            }, s.inherits(proto.execution.GetTransactionResultResponse, r.Message), s.DEBUG && !COMPILED && (proto.execution.GetTransactionResultResponse.displayName = "proto.execution.GetTransactionResultResponse"), r.Message.GENERATE_TO_OBJECT && (proto.execution.PingRequest.prototype.toObject = function(e) {
                return proto.execution.PingRequest.toObject(e, this)
            }, proto.execution.PingRequest.toObject = function(e, t) {
                var o = {};
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.PingRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.PingRequest;
                return proto.execution.PingRequest.deserializeBinaryFromReader(o, t)
            }, proto.execution.PingRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) t.getFieldNumber(), t.skipField();
                return e
            }, proto.execution.PingRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.PingRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.PingRequest.serializeBinaryToWriter = function(e, t) {}, r.Message.GENERATE_TO_OBJECT && (proto.execution.PingResponse.prototype.toObject = function(e) {
                return proto.execution.PingResponse.toObject(e, this)
            }, proto.execution.PingResponse.toObject = function(e, t) {
                var o = {};
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.PingResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.PingResponse;
                return proto.execution.PingResponse.deserializeBinaryFromReader(o, t)
            }, proto.execution.PingResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) t.getFieldNumber(), t.skipField();
                return e
            }, proto.execution.PingResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.PingResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.PingResponse.serializeBinaryToWriter = function(e, t) {}, r.Message.GENERATE_TO_OBJECT && (proto.execution.GetAccountAtBlockIDRequest.prototype.toObject = function(e) {
                return proto.execution.GetAccountAtBlockIDRequest.toObject(e, this)
            }, proto.execution.GetAccountAtBlockIDRequest.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    address: t.getAddress_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetAccountAtBlockIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetAccountAtBlockIDRequest;
                return proto.execution.GetAccountAtBlockIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetAccountAtBlockIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setAddress(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetAccountAtBlockIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetAccountAtBlockIDRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getAddress_asU8()).length > 0 && t.writeBytes(2, o)
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getAddress = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getAddress_asB64 = function() {
                return r.Message.bytesAsB64(this.getAddress())
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.getAddress_asU8 = function() {
                return r.Message.bytesAsU8(this.getAddress())
            }, proto.execution.GetAccountAtBlockIDRequest.prototype.setAddress = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.execution.GetAccountAtBlockIDResponse.prototype.toObject = function(e) {
                return proto.execution.GetAccountAtBlockIDResponse.toObject(e, this)
            }, proto.execution.GetAccountAtBlockIDResponse.toObject = function(e, t) {
                var o, r = {
                    account: (o = t.getAccount()) && i.Account.toObject(e, o)
                };
                return e && (r.$jspbMessageInstance = t), r
            }), proto.execution.GetAccountAtBlockIDResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetAccountAtBlockIDResponse;
                return proto.execution.GetAccountAtBlockIDResponse.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetAccountAtBlockIDResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new i.Account;
                        t.readMessage(o, i.Account.deserializeBinaryFromReader), e.setAccount(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetAccountAtBlockIDResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetAccountAtBlockIDResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetAccountAtBlockIDResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                null != (o = e.getAccount()) && t.writeMessage(1, o, i.Account.serializeBinaryToWriter)
            }, proto.execution.GetAccountAtBlockIDResponse.prototype.getAccount = function() {
                return r.Message.getWrapperField(this, i.Account, 1)
            }, proto.execution.GetAccountAtBlockIDResponse.prototype.setAccount = function(e) {
                return r.Message.setWrapperField(this, 1, e)
            }, proto.execution.GetAccountAtBlockIDResponse.prototype.clearAccount = function() {
                return this.setAccount(void 0)
            }, proto.execution.GetAccountAtBlockIDResponse.prototype.hasAccount = function() {
                return null != r.Message.getField(this, 1)
            }, r.Message.GENERATE_TO_OBJECT && (proto.execution.ExecuteScriptAtBlockIDRequest.prototype.toObject = function(e) {
                return proto.execution.ExecuteScriptAtBlockIDRequest.toObject(e, this)
            }, proto.execution.ExecuteScriptAtBlockIDRequest.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    script: t.getScript_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.ExecuteScriptAtBlockIDRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.ExecuteScriptAtBlockIDRequest;
                return proto.execution.ExecuteScriptAtBlockIDRequest.deserializeBinaryFromReader(o, t)
            }, proto.execution.ExecuteScriptAtBlockIDRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setScript(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.ExecuteScriptAtBlockIDRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.ExecuteScriptAtBlockIDRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getScript_asU8()).length > 0 && t.writeBytes(2, o)
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getScript = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getScript_asB64 = function() {
                return r.Message.bytesAsB64(this.getScript())
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.getScript_asU8 = function() {
                return r.Message.bytesAsU8(this.getScript())
            }, proto.execution.ExecuteScriptAtBlockIDRequest.prototype.setScript = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, r.Message.GENERATE_TO_OBJECT && (proto.execution.ExecuteScriptAtBlockIDResponse.prototype.toObject = function(e) {
                return proto.execution.ExecuteScriptAtBlockIDResponse.toObject(e, this)
            }, proto.execution.ExecuteScriptAtBlockIDResponse.toObject = function(e, t) {
                var o = {
                    value: t.getValue_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.ExecuteScriptAtBlockIDResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.ExecuteScriptAtBlockIDResponse;
                return proto.execution.ExecuteScriptAtBlockIDResponse.deserializeBinaryFromReader(o, t)
            }, proto.execution.ExecuteScriptAtBlockIDResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setValue(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.ExecuteScriptAtBlockIDResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.ExecuteScriptAtBlockIDResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.ExecuteScriptAtBlockIDResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getValue_asU8()).length > 0 && t.writeBytes(1, o)
            }, proto.execution.ExecuteScriptAtBlockIDResponse.prototype.getValue = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.ExecuteScriptAtBlockIDResponse.prototype.getValue_asB64 = function() {
                return r.Message.bytesAsB64(this.getValue())
            }, proto.execution.ExecuteScriptAtBlockIDResponse.prototype.getValue_asU8 = function() {
                return r.Message.bytesAsU8(this.getValue())
            }, proto.execution.ExecuteScriptAtBlockIDResponse.prototype.setValue = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.execution.GetEventsForBlockIDsResponse.repeatedFields_ = [1], r.Message.GENERATE_TO_OBJECT && (proto.execution.GetEventsForBlockIDsResponse.prototype.toObject = function(e) {
                return proto.execution.GetEventsForBlockIDsResponse.toObject(e, this)
            }, proto.execution.GetEventsForBlockIDsResponse.toObject = function(e, t) {
                var o = {
                    resultsList: r.Message.toObjectList(t.getResultsList(), proto.execution.GetEventsForBlockIDsResponse.Result.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetEventsForBlockIDsResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetEventsForBlockIDsResponse;
                return proto.execution.GetEventsForBlockIDsResponse.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetEventsForBlockIDsResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = new proto.execution.GetEventsForBlockIDsResponse.Result;
                        t.readMessage(o, proto.execution.GetEventsForBlockIDsResponse.Result.deserializeBinaryFromReader), e.addResults(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetEventsForBlockIDsResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetEventsForBlockIDsResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetEventsForBlockIDsResponse.serializeBinaryToWriter = function(e, t) {
                var o;
                (o = e.getResultsList()).length > 0 && t.writeRepeatedMessage(1, o, proto.execution.GetEventsForBlockIDsResponse.Result.serializeBinaryToWriter)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.repeatedFields_ = [3], r.Message.GENERATE_TO_OBJECT && (proto.execution.GetEventsForBlockIDsResponse.Result.prototype.toObject = function(e) {
                return proto.execution.GetEventsForBlockIDsResponse.Result.toObject(e, this)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    blockHeight: r.Message.getFieldWithDefault(t, 2, 0),
                    eventsList: r.Message.toObjectList(t.getEventsList(), a.Event.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetEventsForBlockIDsResponse.Result.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetEventsForBlockIDsResponse.Result;
                return proto.execution.GetEventsForBlockIDsResponse.Result.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readUint64(), e.setBlockHeight(o);
                        break;
                    case 3:
                        o = new a.Event, t.readMessage(o, a.Event.deserializeBinaryFromReader), e.addEvents(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetEventsForBlockIDsResponse.Result.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetEventsForBlockIDsResponse.Result.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), 0 !== (o = e.getBlockHeight()) && t.writeUint64(2, o), (o = e.getEventsList()).length > 0 && t.writeRepeatedMessage(3, o, a.Event.serializeBinaryToWriter)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.getBlockHeight = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.setBlockHeight = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.getEventsList = function() {
                return r.Message.getRepeatedWrapperField(this, a.Event, 3)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.setEventsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 3, e)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.addEvents = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 3, e, proto.entities.Event, t)
            }, proto.execution.GetEventsForBlockIDsResponse.Result.prototype.clearEventsList = function() {
                return this.setEventsList([])
            }, proto.execution.GetEventsForBlockIDsResponse.prototype.getResultsList = function() {
                return r.Message.getRepeatedWrapperField(this, proto.execution.GetEventsForBlockIDsResponse.Result, 1)
            }, proto.execution.GetEventsForBlockIDsResponse.prototype.setResultsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 1, e)
            }, proto.execution.GetEventsForBlockIDsResponse.prototype.addResults = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 1, e, proto.execution.GetEventsForBlockIDsResponse.Result, t)
            }, proto.execution.GetEventsForBlockIDsResponse.prototype.clearResultsList = function() {
                return this.setResultsList([])
            }, proto.execution.GetEventsForBlockIDsRequest.repeatedFields_ = [2], r.Message.GENERATE_TO_OBJECT && (proto.execution.GetEventsForBlockIDsRequest.prototype.toObject = function(e) {
                return proto.execution.GetEventsForBlockIDsRequest.toObject(e, this)
            }, proto.execution.GetEventsForBlockIDsRequest.toObject = function(e, t) {
                var o = {
                    type: r.Message.getFieldWithDefault(t, 1, ""),
                    blockIdsList: t.getBlockIdsList_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetEventsForBlockIDsRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetEventsForBlockIDsRequest;
                return proto.execution.GetEventsForBlockIDsRequest.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetEventsForBlockIDsRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readString();
                        e.setType(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.addBlockIds(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetEventsForBlockIDsRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetEventsForBlockIDsRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getType()).length > 0 && t.writeString(1, o), (o = e.getBlockIdsList_asU8()).length > 0 && t.writeRepeatedBytes(2, o)
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.getType = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.setType = function(e) {
                return r.Message.setProto3StringField(this, 1, e)
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.getBlockIdsList = function() {
                return r.Message.getRepeatedField(this, 2)
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.getBlockIdsList_asB64 = function() {
                return r.Message.bytesListAsB64(this.getBlockIdsList())
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.getBlockIdsList_asU8 = function() {
                return r.Message.bytesListAsU8(this.getBlockIdsList())
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.setBlockIdsList = function(e) {
                return r.Message.setField(this, 2, e || [])
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.addBlockIds = function(e, t) {
                return r.Message.addToRepeatedField(this, 2, e, t)
            }, proto.execution.GetEventsForBlockIDsRequest.prototype.clearBlockIdsList = function() {
                return this.setBlockIdsList([])
            }, r.Message.GENERATE_TO_OBJECT && (proto.execution.GetTransactionResultRequest.prototype.toObject = function(e) {
                return proto.execution.GetTransactionResultRequest.toObject(e, this)
            }, proto.execution.GetTransactionResultRequest.toObject = function(e, t) {
                var o = {
                    blockId: t.getBlockId_asB64(),
                    transactionId: t.getTransactionId_asB64()
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetTransactionResultRequest.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetTransactionResultRequest;
                return proto.execution.GetTransactionResultRequest.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetTransactionResultRequest.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readBytes();
                        e.setBlockId(o);
                        break;
                    case 2:
                        o = t.readBytes(), e.setTransactionId(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetTransactionResultRequest.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetTransactionResultRequest.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetTransactionResultRequest.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                (o = e.getBlockId_asU8()).length > 0 && t.writeBytes(1, o), (o = e.getTransactionId_asU8()).length > 0 && t.writeBytes(2, o)
            }, proto.execution.GetTransactionResultRequest.prototype.getBlockId = function() {
                return r.Message.getFieldWithDefault(this, 1, "")
            }, proto.execution.GetTransactionResultRequest.prototype.getBlockId_asB64 = function() {
                return r.Message.bytesAsB64(this.getBlockId())
            }, proto.execution.GetTransactionResultRequest.prototype.getBlockId_asU8 = function() {
                return r.Message.bytesAsU8(this.getBlockId())
            }, proto.execution.GetTransactionResultRequest.prototype.setBlockId = function(e) {
                return r.Message.setProto3BytesField(this, 1, e)
            }, proto.execution.GetTransactionResultRequest.prototype.getTransactionId = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.execution.GetTransactionResultRequest.prototype.getTransactionId_asB64 = function() {
                return r.Message.bytesAsB64(this.getTransactionId())
            }, proto.execution.GetTransactionResultRequest.prototype.getTransactionId_asU8 = function() {
                return r.Message.bytesAsU8(this.getTransactionId())
            }, proto.execution.GetTransactionResultRequest.prototype.setTransactionId = function(e) {
                return r.Message.setProto3BytesField(this, 2, e)
            }, proto.execution.GetTransactionResultResponse.repeatedFields_ = [3], r.Message.GENERATE_TO_OBJECT && (proto.execution.GetTransactionResultResponse.prototype.toObject = function(e) {
                return proto.execution.GetTransactionResultResponse.toObject(e, this)
            }, proto.execution.GetTransactionResultResponse.toObject = function(e, t) {
                var o = {
                    statusCode: r.Message.getFieldWithDefault(t, 1, 0),
                    errorMessage: r.Message.getFieldWithDefault(t, 2, ""),
                    eventsList: r.Message.toObjectList(t.getEventsList(), a.Event.toObject, e)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.execution.GetTransactionResultResponse.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.execution.GetTransactionResultResponse;
                return proto.execution.GetTransactionResultResponse.deserializeBinaryFromReader(o, t)
            }, proto.execution.GetTransactionResultResponse.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readUint32();
                        e.setStatusCode(o);
                        break;
                    case 2:
                        o = t.readString(), e.setErrorMessage(o);
                        break;
                    case 3:
                        o = new a.Event, t.readMessage(o, a.Event.deserializeBinaryFromReader), e.addEvents(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.execution.GetTransactionResultResponse.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.execution.GetTransactionResultResponse.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.execution.GetTransactionResultResponse.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                0 !== (o = e.getStatusCode()) && t.writeUint32(1, o), (o = e.getErrorMessage()).length > 0 && t.writeString(2, o), (o = e.getEventsList()).length > 0 && t.writeRepeatedMessage(3, o, a.Event.serializeBinaryToWriter)
            }, proto.execution.GetTransactionResultResponse.prototype.getStatusCode = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.execution.GetTransactionResultResponse.prototype.setStatusCode = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, proto.execution.GetTransactionResultResponse.prototype.getErrorMessage = function() {
                return r.Message.getFieldWithDefault(this, 2, "")
            }, proto.execution.GetTransactionResultResponse.prototype.setErrorMessage = function(e) {
                return r.Message.setProto3StringField(this, 2, e)
            }, proto.execution.GetTransactionResultResponse.prototype.getEventsList = function() {
                return r.Message.getRepeatedWrapperField(this, a.Event, 3)
            }, proto.execution.GetTransactionResultResponse.prototype.setEventsList = function(e) {
                return r.Message.setRepeatedWrapperField(this, 3, e)
            }, proto.execution.GetTransactionResultResponse.prototype.addEvents = function(e, t) {
                return r.Message.addToRepeatedWrapperField(this, 3, e, proto.entities.Event, t)
            }, proto.execution.GetTransactionResultResponse.prototype.clearEventsList = function() {
                return this.setEventsList([])
            }, s.object.extend(t, proto.execution)
        }, function(e, t, o) {
            var r = o(4),
                s = o(11).grpc,
                n = function() {
                    function e() {}
                    return e.serviceName = "access.AccessAPI", e
                }();

            function i(e, t) {
                this.serviceHost = e, this.options = t || {}
            }
            n.Ping = {
                methodName: "Ping",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.PingRequest,
                responseType: r.PingResponse
            }, n.GetLatestBlockHeader = {
                methodName: "GetLatestBlockHeader",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetLatestBlockHeaderRequest,
                responseType: r.BlockHeaderResponse
            }, n.GetBlockHeaderByID = {
                methodName: "GetBlockHeaderByID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetBlockHeaderByIDRequest,
                responseType: r.BlockHeaderResponse
            }, n.GetBlockHeaderByHeight = {
                methodName: "GetBlockHeaderByHeight",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetBlockHeaderByHeightRequest,
                responseType: r.BlockHeaderResponse
            }, n.GetLatestBlock = {
                methodName: "GetLatestBlock",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetLatestBlockRequest,
                responseType: r.BlockResponse
            }, n.GetBlockByID = {
                methodName: "GetBlockByID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetBlockByIDRequest,
                responseType: r.BlockResponse
            }, n.GetBlockByHeight = {
                methodName: "GetBlockByHeight",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetBlockByHeightRequest,
                responseType: r.BlockResponse
            }, n.GetCollectionByID = {
                methodName: "GetCollectionByID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetCollectionByIDRequest,
                responseType: r.CollectionResponse
            }, n.SendTransaction = {
                methodName: "SendTransaction",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.SendTransactionRequest,
                responseType: r.SendTransactionResponse
            }, n.GetTransaction = {
                methodName: "GetTransaction",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetTransactionRequest,
                responseType: r.TransactionResponse
            }, n.GetTransactionResult = {
                methodName: "GetTransactionResult",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetTransactionRequest,
                responseType: r.TransactionResultResponse
            }, n.GetAccount = {
                methodName: "GetAccount",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetAccountRequest,
                responseType: r.GetAccountResponse
            }, n.ExecuteScriptAtLatestBlock = {
                methodName: "ExecuteScriptAtLatestBlock",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.ExecuteScriptAtLatestBlockRequest,
                responseType: r.ExecuteScriptResponse
            }, n.ExecuteScriptAtBlockID = {
                methodName: "ExecuteScriptAtBlockID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.ExecuteScriptAtBlockIDRequest,
                responseType: r.ExecuteScriptResponse
            }, n.ExecuteScriptAtBlockHeight = {
                methodName: "ExecuteScriptAtBlockHeight",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.ExecuteScriptAtBlockHeightRequest,
                responseType: r.ExecuteScriptResponse
            }, n.GetEventsForHeightRange = {
                methodName: "GetEventsForHeightRange",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetEventsForHeightRangeRequest,
                responseType: r.EventsResponse
            }, n.GetEventsForBlockIDs = {
                methodName: "GetEventsForBlockIDs",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetEventsForBlockIDsRequest,
                responseType: r.EventsResponse
            }, t.AccessAPI = n, i.prototype.ping = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.Ping, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getLatestBlockHeader = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetLatestBlockHeader, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getBlockHeaderByID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetBlockHeaderByID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getBlockHeaderByHeight = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetBlockHeaderByHeight, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getLatestBlock = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetLatestBlock, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getBlockByID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetBlockByID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getBlockByHeight = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetBlockByHeight, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getCollectionByID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetCollectionByID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.sendTransaction = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.SendTransaction, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getTransaction = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetTransaction, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getTransactionResult = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetTransactionResult, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getAccount = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetAccount, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.executeScriptAtLatestBlock = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.ExecuteScriptAtLatestBlock, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.executeScriptAtBlockID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.ExecuteScriptAtBlockID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.executeScriptAtBlockHeight = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.ExecuteScriptAtBlockHeight, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getEventsForHeightRange = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetEventsForHeightRange, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getEventsForBlockIDs = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetEventsForBlockIDs, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, t.AccessAPIClient = i
        }, function(e, t) {
            ! function(e, t) {
                for (var o in t) e[o] = t[o]
            }(t, function(e) {
                var t = {};

                function o(r) {
                    if (t[r]) return t[r].exports;
                    var s = t[r] = {
                        i: r,
                        l: !1,
                        exports: {}
                    };
                    return e[r].call(s.exports, s, s.exports, o), s.l = !0, s.exports
                }
                return o.m = e, o.c = t, o.d = function(e, t, r) {
                    o.o(e, t) || Object.defineProperty(e, t, {
                        enumerable: !0,
                        get: r
                    })
                }, o.r = function(e) {
                    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                        value: "Module"
                    }), Object.defineProperty(e, "__esModule", {
                        value: !0
                    })
                }, o.t = function(e, t) {
                    if (1 & t && (e = o(e)), 8 & t) return e;
                    if (4 & t && "object" == typeof e && e && e.__esModule) return e;
                    var r = Object.create(null);
                    if (o.r(r), Object.defineProperty(r, "default", {
                            enumerable: !0,
                            value: e
                        }), 2 & t && "string" != typeof e)
                        for (var s in e) o.d(r, s, function(t) {
                            return e[t]
                        }.bind(null, s));
                    return r
                }, o.n = function(e) {
                    var t = e && e.__esModule ? function() {
                        return e.default
                    } : function() {
                        return e
                    };
                    return o.d(t, "a", t), t
                }, o.o = function(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t)
                }, o.p = "", o(o.s = 11)
            }([function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(4);
                t.Metadata = r.BrowserHeaders
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.debug = function() {
                    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                    console.debug ? console.debug.apply(null, e) : console.log.apply(null, e)
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = null;
                t.default = function(e) {
                    null === r ? (r = [e], setTimeout(function() {
                        ! function e() {
                            if (r) {
                                var t = r;
                                r = null;
                                for (var o = 0; o < t.length; o++) try {
                                    t[o]()
                                } catch (n) {
                                    null === r && (r = [], setTimeout(function() {
                                        e()
                                    }, 0));
                                    for (var s = t.length - 1; s > o; s--) r.unshift(t[s]);
                                    throw n
                                }
                            }
                        }()
                    }, 0)) : r.push(e)
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(0),
                    s = o(9),
                    n = o(10),
                    i = o(1),
                    a = o(2),
                    g = o(5),
                    c = o(15);
                t.client = function(e, t) {
                    return new u(e, t)
                };
                var u = function() {
                    function e(e, t) {
                        this.started = !1, this.sentFirstMessage = !1, this.completed = !1, this.closed = !1, this.finishedSending = !1, this.onHeadersCallbacks = [], this.onMessageCallbacks = [], this.onEndCallbacks = [], this.parser = new s.ChunkParser, this.methodDefinition = e, this.props = t, this.createTransport()
                    }
                    return e.prototype.createTransport = function() {
                        var e = this.props.host + "/" + this.methodDefinition.service.serviceName + "/" + this.methodDefinition.methodName,
                            t = {
                                methodDefinition: this.methodDefinition,
                                debug: this.props.debug || !1,
                                url: e,
                                onHeaders: this.onTransportHeaders.bind(this),
                                onChunk: this.onTransportChunk.bind(this),
                                onEnd: this.onTransportEnd.bind(this)
                            };
                        this.props.transport ? this.transport = this.props.transport(t) : this.transport = g.makeDefaultTransport(t)
                    }, e.prototype.onTransportHeaders = function(e, t) {
                        if (this.props.debug && i.debug("onHeaders", e, t), this.closed) this.props.debug && i.debug("grpc.onHeaders received after request was closed - ignoring");
                        else if (0 === t);
                        else {
                            this.responseHeaders = e, this.props.debug && i.debug("onHeaders.responseHeaders", JSON.stringify(this.responseHeaders, null, 2));
                            var o = l(e);
                            this.props.debug && i.debug("onHeaders.gRPCStatus", o);
                            var r = o && o >= 0 ? o : n.httpStatusToCode(t);
                            this.props.debug && i.debug("onHeaders.code", r);
                            var s = e.get("grpc-message") || [];
                            if (this.props.debug && i.debug("onHeaders.gRPCMessage", s), this.rawOnHeaders(e), r !== n.Code.OK) {
                                var a = this.decodeGRPCStatus(s[0]);
                                this.rawOnError(r, a, e)
                            }
                        }
                    }, e.prototype.onTransportChunk = function(e) {
                        var t = this;
                        if (this.closed) this.props.debug && i.debug("grpc.onChunk received after request was closed - ignoring");
                        else {
                            var o = [];
                            try {
                                o = this.parser.parse(e)
                            } catch (e) {
                                return this.props.debug && i.debug("onChunk.parsing error", e, e.message), void this.rawOnError(n.Code.Internal, "parsing error: " + e.message)
                            }
                            o.forEach(function(e) {
                                if (e.chunkType === s.ChunkType.MESSAGE) {
                                    var o = t.methodDefinition.responseType.deserializeBinary(e.data);
                                    t.rawOnMessage(o)
                                } else e.chunkType === s.ChunkType.TRAILERS && (t.responseHeaders ? (t.responseTrailers = new r.Metadata(e.trailers), t.props.debug && i.debug("onChunk.trailers", t.responseTrailers)) : (t.responseHeaders = new r.Metadata(e.trailers), t.rawOnHeaders(t.responseHeaders)))
                            })
                        }
                    }, e.prototype.onTransportEnd = function() {
                        if (this.props.debug && i.debug("grpc.onEnd"), this.closed) this.props.debug && i.debug("grpc.onEnd received after request was closed - ignoring");
                        else if (void 0 !== this.responseTrailers) {
                            var e = l(this.responseTrailers);
                            if (null !== e) {
                                var t = this.responseTrailers.get("grpc-message"),
                                    o = this.decodeGRPCStatus(t[0]);
                                this.rawOnEnd(e, o, this.responseTrailers)
                            } else this.rawOnError(n.Code.Internal, "Response closed without grpc-status (Trailers provided)")
                        } else {
                            if (void 0 === this.responseHeaders) return void this.rawOnError(n.Code.Unknown, "Response closed without headers");
                            var r = l(this.responseHeaders),
                                s = this.responseHeaders.get("grpc-message");
                            if (this.props.debug && i.debug("grpc.headers only response ", r, s), null === r) return void this.rawOnEnd(n.Code.Unknown, "Response closed without grpc-status (Headers only)", this.responseHeaders);
                            var a = this.decodeGRPCStatus(s[0]);
                            this.rawOnEnd(r, a, this.responseHeaders)
                        }
                    }, e.prototype.decodeGRPCStatus = function(e) {
                        if (!e) return "";
                        try {
                            return decodeURIComponent(e)
                        } catch (t) {
                            return e
                        }
                    }, e.prototype.rawOnEnd = function(e, t, o) {
                        var r = this;
                        this.props.debug && i.debug("rawOnEnd", e, t, o), this.completed || (this.completed = !0, this.onEndCallbacks.forEach(function(s) {
                            a.default(function() {
                                r.closed || s(e, t, o)
                            })
                        }))
                    }, e.prototype.rawOnHeaders = function(e) {
                        this.props.debug && i.debug("rawOnHeaders", e), this.completed || this.onHeadersCallbacks.forEach(function(t) {
                            a.default(function() {
                                t(e)
                            })
                        })
                    }, e.prototype.rawOnError = function(e, t, o) {
                        var s = this;
                        void 0 === o && (o = new r.Metadata), this.props.debug && i.debug("rawOnError", e, t), this.completed || (this.completed = !0, this.onEndCallbacks.forEach(function(r) {
                            a.default(function() {
                                s.closed || r(e, t, o)
                            })
                        }))
                    }, e.prototype.rawOnMessage = function(e) {
                        var t = this;
                        this.props.debug && i.debug("rawOnMessage", e.toObject()), this.completed || this.closed || this.onMessageCallbacks.forEach(function(o) {
                            a.default(function() {
                                t.closed || o(e)
                            })
                        })
                    }, e.prototype.onHeaders = function(e) {
                        this.onHeadersCallbacks.push(e)
                    }, e.prototype.onMessage = function(e) {
                        this.onMessageCallbacks.push(e)
                    }, e.prototype.onEnd = function(e) {
                        this.onEndCallbacks.push(e)
                    }, e.prototype.start = function(e) {
                        if (this.started) throw new Error("Client already started - cannot .start()");
                        this.started = !0;
                        var t = new r.Metadata(e || {});
                        t.set("content-type", "application/grpc-web+proto"), t.set("x-grpc-web", "1"), this.transport.start(t)
                    }, e.prototype.send = function(e) {
                        if (!this.started) throw new Error("Client not started - .start() must be called before .send()");
                        if (this.closed) throw new Error("Client already closed - cannot .send()");
                        if (this.finishedSending) throw new Error("Client already finished sending - cannot .send()");
                        if (!this.methodDefinition.requestStream && this.sentFirstMessage) throw new Error("Message already sent for non-client-streaming method - cannot .send()");
                        this.sentFirstMessage = !0;
                        var t = c.frameRequest(e);
                        this.transport.sendMessage(t)
                    }, e.prototype.finishSend = function() {
                        if (!this.started) throw new Error("Client not started - .finishSend() must be called before .close()");
                        if (this.closed) throw new Error("Client already closed - cannot .send()");
                        if (this.finishedSending) throw new Error("Client already finished sending - cannot .finishSend()");
                        this.finishedSending = !0, this.transport.finishSend()
                    }, e.prototype.close = function() {
                        if (!this.started) throw new Error("Client not started - .start() must be called before .close()");
                        if (this.closed) throw new Error("Client already closed - cannot .close()");
                        this.closed = !0, this.props.debug && i.debug("request.abort aborting request"), this.transport.cancel()
                    }, e
                }();

                function l(e) {
                    var t = e.get("grpc-status") || [];
                    if (t.length > 0) try {
                        var o = t[0];
                        return parseInt(o, 10)
                    } catch (e) {
                        return null
                    }
                    return null
                }
            }, function(e, t, o) {
                var r;
                r = function() {
                    return function(e) {
                        var t = {};

                        function o(r) {
                            if (t[r]) return t[r].exports;
                            var s = t[r] = {
                                i: r,
                                l: !1,
                                exports: {}
                            };
                            return e[r].call(s.exports, s, s.exports, o), s.l = !0, s.exports
                        }
                        return o.m = e, o.c = t, o.i = function(e) {
                            return e
                        }, o.d = function(e, t, r) {
                            o.o(e, t) || Object.defineProperty(e, t, {
                                configurable: !1,
                                enumerable: !0,
                                get: r
                            })
                        }, o.n = function(e) {
                            var t = e && e.__esModule ? function() {
                                return e.default
                            } : function() {
                                return e
                            };
                            return o.d(t, "a", t), t
                        }, o.o = function(e, t) {
                            return Object.prototype.hasOwnProperty.call(e, t)
                        }, o.p = "", o(o.s = 1)
                    }([function(e, t, o) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = o(3),
                            s = function() {
                                function e(e, t) {
                                    void 0 === e && (e = {}), void 0 === t && (t = {
                                        splitValues: !1
                                    });
                                    var o, s = this;
                                    this.headersMap = {}, e && ("undefined" != typeof Headers && e instanceof Headers ? r.getHeaderKeys(e).forEach(function(o) {
                                        r.getHeaderValues(e, o).forEach(function(e) {
                                            t.splitValues ? s.append(o, r.splitHeaderValue(e)) : s.append(o, e)
                                        })
                                    }) : "object" == typeof(o = e) && "object" == typeof o.headersMap && "function" == typeof o.forEach ? e.forEach(function(e, t) {
                                        s.append(e, t)
                                    }) : "undefined" != typeof Map && e instanceof Map ? e.forEach(function(e, t) {
                                        s.append(t, e)
                                    }) : "string" == typeof e ? this.appendFromString(e) : "object" == typeof e && Object.getOwnPropertyNames(e).forEach(function(t) {
                                        var o = e[t];
                                        Array.isArray(o) ? o.forEach(function(e) {
                                            s.append(t, e)
                                        }) : s.append(t, o)
                                    }))
                                }
                                return e.prototype.appendFromString = function(e) {
                                    for (var t = e.split("\r\n"), o = 0; o < t.length; o++) {
                                        var r = t[o],
                                            s = r.indexOf(":");
                                        if (s > 0) {
                                            var n = r.substring(0, s).trim(),
                                                i = r.substring(s + 1).trim();
                                            this.append(n, i)
                                        }
                                    }
                                }, e.prototype.delete = function(e, t) {
                                    var o = r.normalizeName(e);
                                    if (void 0 === t) delete this.headersMap[o];
                                    else {
                                        var s = this.headersMap[o];
                                        if (s) {
                                            var n = s.indexOf(t);
                                            n >= 0 && s.splice(n, 1), 0 === s.length && delete this.headersMap[o]
                                        }
                                    }
                                }, e.prototype.append = function(e, t) {
                                    var o = this,
                                        s = r.normalizeName(e);
                                    Array.isArray(this.headersMap[s]) || (this.headersMap[s] = []), Array.isArray(t) ? t.forEach(function(e) {
                                        o.headersMap[s].push(r.normalizeValue(e))
                                    }) : this.headersMap[s].push(r.normalizeValue(t))
                                }, e.prototype.set = function(e, t) {
                                    var o = r.normalizeName(e);
                                    if (Array.isArray(t)) {
                                        var s = [];
                                        t.forEach(function(e) {
                                            s.push(r.normalizeValue(e))
                                        }), this.headersMap[o] = s
                                    } else this.headersMap[o] = [r.normalizeValue(t)]
                                }, e.prototype.has = function(e, t) {
                                    var o = this.headersMap[r.normalizeName(e)];
                                    if (!Array.isArray(o)) return !1;
                                    if (void 0 !== t) {
                                        var s = r.normalizeValue(t);
                                        return o.indexOf(s) >= 0
                                    }
                                    return !0
                                }, e.prototype.get = function(e) {
                                    var t = this.headersMap[r.normalizeName(e)];
                                    return void 0 !== t ? t.concat() : []
                                }, e.prototype.forEach = function(e) {
                                    var t = this;
                                    Object.getOwnPropertyNames(this.headersMap).forEach(function(o) {
                                        e(o, t.headersMap[o])
                                    }, this)
                                }, e.prototype.toHeaders = function() {
                                    if ("undefined" != typeof Headers) {
                                        var e = new Headers;
                                        return this.forEach(function(t, o) {
                                            o.forEach(function(o) {
                                                e.append(t, o)
                                            })
                                        }), e
                                    }
                                    throw new Error("Headers class is not defined")
                                }, e
                            }();
                        t.BrowserHeaders = s
                    }, function(e, t, o) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = o(0);
                        t.BrowserHeaders = r.BrowserHeaders
                    }, function(e, t, o) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        }), t.iterateHeaders = function(e, t) {
                            for (var o = e[Symbol.iterator](), r = o.next(); !r.done;) t(r.value[0]), r = o.next()
                        }, t.iterateHeadersKeys = function(e, t) {
                            for (var o = e.keys(), r = o.next(); !r.done;) t(r.value), r = o.next()
                        }
                    }, function(e, t, o) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = o(2);
                        t.normalizeName = function(e) {
                            if ("string" != typeof e && (e = String(e)), /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(e)) throw new TypeError("Invalid character in header field name");
                            return e.toLowerCase()
                        }, t.normalizeValue = function(e) {
                            return "string" != typeof e && (e = String(e)), e
                        }, t.getHeaderValues = function(e, t) {
                            var o = e;
                            if (o instanceof Headers && o.getAll) return o.getAll(t);
                            var r = o.get(t);
                            return r && "string" == typeof r ? [r] : r
                        }, t.getHeaderKeys = function(e) {
                            var t = e,
                                o = {},
                                s = [];
                            return t.keys ? r.iterateHeadersKeys(t, function(e) {
                                o[e] || (o[e] = !0, s.push(e))
                            }) : t.forEach ? t.forEach(function(e, t) {
                                o[t] || (o[t] = !0, s.push(t))
                            }) : r.iterateHeaders(t, function(e) {
                                var t = e[0];
                                o[t] || (o[t] = !0, s.push(t))
                            }), s
                        }, t.splitHeaderValue = function(e) {
                            var t = [];
                            return e.split(", ").forEach(function(e) {
                                e.split(",").forEach(function(e) {
                                    t.push(e)
                                })
                            }), t
                        }
                    }])
                }, e.exports = r()
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(6),
                    s = function(e) {
                        return r.CrossBrowserHttpTransport({
                            withCredentials: !1
                        })(e)
                    };
                t.setDefaultTransportFactory = function(e) {
                    s = e
                }, t.makeDefaultTransport = function(e) {
                    return s(e)
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(7),
                    s = o(8);
                t.CrossBrowserHttpTransport = function(e) {
                    if (r.detectFetchSupport()) {
                        var t = {
                            credentials: e.withCredentials ? "include" : "same-origin"
                        };
                        return r.FetchReadableStreamTransport(t)
                    }
                    return s.XhrTransport({
                        withCredentials: e.withCredentials
                    })
                }
            }, function(e, t, o) {
                "use strict";
                var r = this && this.__assign || function() {
                    return (r = Object.assign || function(e) {
                        for (var t, o = 1, r = arguments.length; o < r; o++)
                            for (var s in t = arguments[o]) Object.prototype.hasOwnProperty.call(t, s) && (e[s] = t[s]);
                        return e
                    }).apply(this, arguments)
                };
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var s = o(0),
                    n = o(1),
                    i = o(2);
                t.FetchReadableStreamTransport = function(e) {
                    return function(t) {
                        return function(e, t) {
                            return e.debug && n.debug("fetchRequest", e), new a(e, t)
                        }(t, e)
                    }
                };
                var a = function() {
                    function e(e, t) {
                        this.cancelled = !1, this.controller = self.AbortController && new AbortController, this.options = e, this.init = t
                    }
                    return e.prototype.pump = function(e, t) {
                        var o = this;
                        if (this.reader = e, this.cancelled) return this.options.debug && n.debug("Fetch.pump.cancel at first pump"), void this.reader.cancel();
                        this.reader.read().then(function(e) {
                            if (e.done) return i.default(function() {
                                o.options.onEnd()
                            }), t;
                            i.default(function() {
                                o.options.onChunk(e.value)
                            }), o.pump(o.reader, t)
                        }).catch(function(e) {
                            o.cancelled ? o.options.debug && n.debug("Fetch.catch - request cancelled") : (o.cancelled = !0, o.options.debug && n.debug("Fetch.catch", e.message), i.default(function() {
                                o.options.onEnd(e)
                            }))
                        })
                    }, e.prototype.send = function(e) {
                        var t = this;
                        fetch(this.options.url, r({}, this.init, {
                            headers: this.metadata.toHeaders(),
                            method: "POST",
                            body: e,
                            signal: this.controller && this.controller.signal
                        })).then(function(e) {
                            if (t.options.debug && n.debug("Fetch.response", e), i.default(function() {
                                    t.options.onHeaders(new s.Metadata(e.headers), e.status)
                                }), !e.body) return e;
                            t.pump(e.body.getReader(), e)
                        }).catch(function(e) {
                            t.cancelled ? t.options.debug && n.debug("Fetch.catch - request cancelled") : (t.cancelled = !0, t.options.debug && n.debug("Fetch.catch", e.message), i.default(function() {
                                t.options.onEnd(e)
                            }))
                        })
                    }, e.prototype.sendMessage = function(e) {
                        this.send(e)
                    }, e.prototype.finishSend = function() {}, e.prototype.start = function(e) {
                        this.metadata = e
                    }, e.prototype.cancel = function() {
                        this.cancelled ? this.options.debug && n.debug("Fetch.abort.cancel already cancelled") : (this.cancelled = !0, this.reader ? (this.options.debug && n.debug("Fetch.abort.cancel"), this.reader.cancel()) : this.options.debug && n.debug("Fetch.abort.cancel before reader"), this.controller && this.controller.abort())
                    }, e
                }();
                t.detectFetchSupport = function() {
                    return "undefined" != typeof Response && Response.prototype.hasOwnProperty("body") && "function" == typeof Headers
                }
            }, function(e, t, o) {
                "use strict";
                var r, s = this && this.__extends || (r = function(e, t) {
                    return (r = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(e, t) {
                            e.__proto__ = t
                        } || function(e, t) {
                            for (var o in t) t.hasOwnProperty(o) && (e[o] = t[o])
                        })(e, t)
                }, function(e, t) {
                    function o() {
                        this.constructor = e
                    }
                    r(e, t), e.prototype = null === t ? Object.create(t) : (o.prototype = t.prototype, new o)
                });
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var n = o(0),
                    i = o(1),
                    a = o(2),
                    g = o(12);
                t.XhrTransport = function(e) {
                    return function(t) {
                        if (g.detectMozXHRSupport()) return new u(t, e);
                        if (g.detectXHROverrideMimeTypeSupport()) return new c(t, e);
                        throw new Error("This environment's XHR implementation cannot support binary transfer.")
                    }
                };
                var c = function() {
                    function e(e, t) {
                        this.options = e, this.init = t
                    }
                    return e.prototype.onProgressEvent = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onProgressEvent.length: ", this.xhr.response.length);
                        var t = this.xhr.response.substr(this.index);
                        this.index = this.xhr.response.length;
                        var o = p(t);
                        a.default(function() {
                            e.options.onChunk(o)
                        })
                    }, e.prototype.onLoadEvent = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onLoadEvent"), a.default(function() {
                            e.options.onEnd()
                        })
                    }, e.prototype.onStateChange = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onStateChange", this.xhr.readyState), this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && a.default(function() {
                            e.options.onHeaders(new n.Metadata(e.xhr.getAllResponseHeaders()), e.xhr.status)
                        })
                    }, e.prototype.sendMessage = function(e) {
                        this.xhr.send(e)
                    }, e.prototype.finishSend = function() {}, e.prototype.start = function(e) {
                        var t = this;
                        this.metadata = e;
                        var o = new XMLHttpRequest;
                        this.xhr = o, o.open("POST", this.options.url), this.configureXhr(), this.metadata.forEach(function(e, t) {
                            o.setRequestHeader(e, t.join(", "))
                        }), o.withCredentials = Boolean(this.init.withCredentials), o.addEventListener("readystatechange", this.onStateChange.bind(this)), o.addEventListener("progress", this.onProgressEvent.bind(this)), o.addEventListener("loadend", this.onLoadEvent.bind(this)), o.addEventListener("error", function(e) {
                            t.options.debug && i.debug("XHR.error", e), a.default(function() {
                                t.options.onEnd(e.error)
                            })
                        })
                    }, e.prototype.configureXhr = function() {
                        this.xhr.responseType = "text", this.xhr.overrideMimeType("text/plain; charset=x-user-defined")
                    }, e.prototype.cancel = function() {
                        this.options.debug && i.debug("XHR.abort"), this.xhr.abort()
                    }, e
                }();
                t.XHR = c;
                var u = function(e) {
                    function t() {
                        return null !== e && e.apply(this, arguments) || this
                    }
                    return s(t, e), t.prototype.configureXhr = function() {
                        this.options.debug && i.debug("MozXHR.configureXhr: setting responseType to 'moz-chunked-arraybuffer'"), this.xhr.responseType = "moz-chunked-arraybuffer"
                    }, t.prototype.onProgressEvent = function() {
                        var e = this,
                            t = this.xhr.response;
                        this.options.debug && i.debug("MozXHR.onProgressEvent: ", new Uint8Array(t)), a.default(function() {
                            e.options.onChunk(new Uint8Array(t))
                        })
                    }, t
                }(c);

                function l(e, t) {
                    var o = e.charCodeAt(t);
                    if (o >= 55296 && o <= 56319) {
                        var r = e.charCodeAt(t + 1);
                        r >= 56320 && r <= 57343 && (o = 65536 + (o - 55296 << 10) + (r - 56320))
                    }
                    return o
                }

                function p(e) {
                    for (var t = new Uint8Array(e.length), o = 0, r = 0; r < e.length; r++) {
                        var s = String.prototype.codePointAt ? e.codePointAt(r) : l(e, r);
                        t[o++] = 255 & s
                    }
                    return t
                }
                t.MozChunkedArrayBufferXHR = u, t.stringToArrayBuffer = p
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r, s = o(0);

                function n(e) {
                    return function(e) {
                        return 9 === e || 10 === e || 13 === e
                    }(e) || e >= 32 && e <= 126
                }

                function i(e) {
                    for (var t = 0; t !== e.length; ++t)
                        if (!n(e[t])) throw new Error("Metadata is not valid (printable) ASCII");
                    return String.fromCharCode.apply(String, Array.prototype.slice.call(e))
                }

                function a(e) {
                    return 128 == (128 & e.getUint8(0))
                }

                function g(e) {
                    return e.getUint32(1, !1)
                }

                function c(e, t, o) {
                    return e.byteLength - t >= o
                }

                function u(e, t, o) {
                    if (e.slice) return e.slice(t, o);
                    var r = e.length;
                    void 0 !== o && (r = o);
                    for (var s = new Uint8Array(r - t), n = 0, i = t; i < r; i++) s[n++] = e[i];
                    return s
                }
                t.decodeASCII = i, t.encodeASCII = function(e) {
                        for (var t = new Uint8Array(e.length), o = 0; o !== e.length; ++o) {
                            var r = e.charCodeAt(o);
                            if (!n(r)) throw new Error("Metadata contains invalid ASCII");
                            t[o] = r
                        }
                        return t
                    },
                    function(e) {
                        e[e.MESSAGE = 1] = "MESSAGE", e[e.TRAILERS = 2] = "TRAILERS"
                    }(r = t.ChunkType || (t.ChunkType = {}));
                var l = function() {
                    function e() {
                        this.buffer = null, this.position = 0
                    }
                    return e.prototype.parse = function(e, t) {
                        if (0 === e.length && t) return [];
                        var o, n = [];
                        if (null == this.buffer) this.buffer = e, this.position = 0;
                        else if (this.position === this.buffer.byteLength) this.buffer = e, this.position = 0;
                        else {
                            var l = this.buffer.byteLength - this.position,
                                p = new Uint8Array(l + e.byteLength),
                                d = u(this.buffer, this.position);
                            p.set(d, 0);
                            var f = new Uint8Array(e);
                            p.set(f, l), this.buffer = p, this.position = 0
                        }
                        for (;;) {
                            if (!c(this.buffer, this.position, 5)) return n;
                            var h = u(this.buffer, this.position, this.position + 5),
                                y = new DataView(h.buffer, h.byteOffset, h.byteLength),
                                b = g(y);
                            if (!c(this.buffer, this.position, 5 + b)) return n;
                            var _ = u(this.buffer, this.position + 5, this.position + 5 + b);
                            if (this.position += 5 + b, a(y)) return n.push({
                                chunkType: r.TRAILERS,
                                trailers: (o = _, new s.Metadata(i(o)))
                            }), n;
                            n.push({
                                chunkType: r.MESSAGE,
                                data: _
                            })
                        }
                    }, e
                }();
                t.ChunkParser = l
            }, function(e, t, o) {
                "use strict";
                var r;
                Object.defineProperty(t, "__esModule", {
                        value: !0
                    }),
                    function(e) {
                        e[e.OK = 0] = "OK", e[e.Canceled = 1] = "Canceled", e[e.Unknown = 2] = "Unknown", e[e.InvalidArgument = 3] = "InvalidArgument", e[e.DeadlineExceeded = 4] = "DeadlineExceeded", e[e.NotFound = 5] = "NotFound", e[e.AlreadyExists = 6] = "AlreadyExists", e[e.PermissionDenied = 7] = "PermissionDenied", e[e.ResourceExhausted = 8] = "ResourceExhausted", e[e.FailedPrecondition = 9] = "FailedPrecondition", e[e.Aborted = 10] = "Aborted", e[e.OutOfRange = 11] = "OutOfRange", e[e.Unimplemented = 12] = "Unimplemented", e[e.Internal = 13] = "Internal", e[e.Unavailable = 14] = "Unavailable", e[e.DataLoss = 15] = "DataLoss", e[e.Unauthenticated = 16] = "Unauthenticated"
                    }(r = t.Code || (t.Code = {})), t.httpStatusToCode = function(e) {
                        switch (e) {
                            case 0:
                                return r.Internal;
                            case 200:
                                return r.OK;
                            case 400:
                                return r.InvalidArgument;
                            case 401:
                                return r.Unauthenticated;
                            case 403:
                                return r.PermissionDenied;
                            case 404:
                                return r.NotFound;
                            case 409:
                                return r.Aborted;
                            case 412:
                                return r.FailedPrecondition;
                            case 429:
                                return r.ResourceExhausted;
                            case 499:
                                return r.Canceled;
                            case 500:
                                return r.Unknown;
                            case 501:
                                return r.Unimplemented;
                            case 503:
                                return r.Unavailable;
                            case 504:
                                return r.DeadlineExceeded;
                            default:
                                return r.Unknown
                        }
                    }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(4),
                    s = o(5),
                    n = o(7),
                    i = o(13),
                    a = o(8),
                    g = o(6),
                    c = o(10),
                    u = o(14),
                    l = o(16),
                    p = o(3);
                ! function(e) {
                    e.setDefaultTransport = s.setDefaultTransportFactory, e.CrossBrowserHttpTransport = g.CrossBrowserHttpTransport, e.FetchReadableStreamTransport = n.FetchReadableStreamTransport, e.XhrTransport = a.XhrTransport, e.WebsocketTransport = i.WebsocketTransport, e.Code = c.Code, e.Metadata = r.BrowserHeaders, e.client = function(e, t) {
                        return p.client(e, t)
                    }, e.invoke = u.invoke, e.unary = l.unary
                }(t.grpc || (t.grpc = {}))
            }, function(e, t, o) {
                "use strict";
                var r;

                function s(e) {
                    var t = function() {
                        if (void 0 !== r) return r;
                        if (XMLHttpRequest) {
                            r = new XMLHttpRequest;
                            try {
                                r.open("GET", "https://localhost")
                            } catch (e) {}
                        }
                        return r
                    }();
                    if (!t) return !1;
                    try {
                        return t.responseType = e, t.responseType === e
                    } catch (e) {}
                    return !1
                }
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.xhrSupportsResponseType = s, t.detectMozXHRSupport = function() {
                    return "undefined" != typeof XMLHttpRequest && s("moz-chunked-arraybuffer")
                }, t.detectXHROverrideMimeTypeSupport = function() {
                    return "undefined" != typeof XMLHttpRequest && XMLHttpRequest.prototype.hasOwnProperty("overrideMimeType")
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r, s = o(1),
                    n = o(2),
                    i = o(9);
                ! function(e) {
                    e[e.FINISH_SEND = 1] = "FINISH_SEND"
                }(r || (r = {}));
                var a = new Uint8Array([1]);
                t.WebsocketTransport = function() {
                    return function(e) {
                        return function(e) {
                            e.debug && s.debug("websocketRequest", e);
                            var t, o = function(e) {
                                    if ("https://" === e.substr(0, 8)) return "wss://" + e.substr(8);
                                    if ("http://" === e.substr(0, 7)) return "ws://" + e.substr(7);
                                    throw new Error("Websocket transport constructed with non-https:// or http:// host.")
                                }(e.url),
                                g = [];

                            function c(e) {
                                if (e === r.FINISH_SEND) t.send(a);
                                else {
                                    var o = e,
                                        s = new Int8Array(o.byteLength + 1);
                                    s.set(new Uint8Array([0])), s.set(o, 1), t.send(s)
                                }
                            }
                            return {
                                sendMessage: function(e) {
                                    t && t.readyState !== t.CONNECTING ? c(e) : g.push(e)
                                },
                                finishSend: function() {
                                    t && t.readyState !== t.CONNECTING ? c(r.FINISH_SEND) : g.push(r.FINISH_SEND)
                                },
                                start: function(r) {
                                    (t = new WebSocket(o, ["grpc-websockets"])).binaryType = "arraybuffer", t.onopen = function() {
                                        var o;
                                        e.debug && s.debug("websocketRequest.onopen"), t.send((o = "", r.forEach(function(e, t) {
                                            o += e + ": " + t.join(", ") + "\r\n"
                                        }), i.encodeASCII(o))), g.forEach(function(e) {
                                            c(e)
                                        })
                                    }, t.onclose = function(t) {
                                        e.debug && s.debug("websocketRequest.onclose", t), n.default(function() {
                                            e.onEnd()
                                        })
                                    }, t.onerror = function(t) {
                                        e.debug && s.debug("websocketRequest.onerror", t)
                                    }, t.onmessage = function(t) {
                                        n.default(function() {
                                            e.onChunk(new Uint8Array(t.data))
                                        })
                                    }
                                },
                                cancel: function() {
                                    e.debug && s.debug("websocket.abort"), n.default(function() {
                                        t.close()
                                    })
                                }
                            }
                        }(e)
                    }
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(3);
                t.invoke = function(e, t) {
                    if (e.requestStream) throw new Error(".invoke cannot be used with client-streaming methods. Use .client instead.");
                    var o = r.client(e, {
                        host: t.host,
                        transport: t.transport,
                        debug: t.debug
                    });
                    return t.onHeaders && o.onHeaders(t.onHeaders), t.onMessage && o.onMessage(t.onMessage), t.onEnd && o.onEnd(t.onEnd), o.start(t.metadata), o.send(t.request), o.finishSend(), {
                        close: function() {
                            o.close()
                        }
                    }
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.frameRequest = function(e) {
                    var t = e.serializeBinary(),
                        o = new ArrayBuffer(t.byteLength + 5);
                    return new DataView(o, 1, 4).setUint32(0, t.length, !1), new Uint8Array(o, 5).set(t), new Uint8Array(o)
                }
            }, function(e, t, o) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = o(0),
                    s = o(3);
                t.unary = function(e, t) {
                    if (e.responseStream) throw new Error(".unary cannot be used with server-streaming methods. Use .invoke or .client instead.");
                    if (e.requestStream) throw new Error(".unary cannot be used with client-streaming methods. Use .client instead.");
                    var o = null,
                        n = null,
                        i = s.client(e, {
                            host: t.host,
                            transport: t.transport,
                            debug: t.debug
                        });
                    return i.onHeaders(function(e) {
                        o = e
                    }), i.onMessage(function(e) {
                        n = e
                    }), i.onEnd(function(e, s, i) {
                        t.onEnd({
                            status: e,
                            statusMessage: s,
                            headers: o || new r.Metadata,
                            message: n,
                            trailers: i
                        })
                    }), i.start(t.metadata), i.send(t.request), i.finishSend(), {
                        close: function() {
                            i.close()
                        }
                    }
                }
            }]))
        }, function(e, t) {}, function(e, t) {}, function(e, t) {}, function(e, t) {}, function(e, t) {}, function(e, t) {}, function(e, t) {}, function(e, t, o) {
            var r = o(9),
                s = o(11).grpc,
                n = function() {
                    function e() {}
                    return e.serviceName = "execution.ExecutionAPI", e
                }();

            function i(e, t) {
                this.serviceHost = e, this.options = t || {}
            }
            n.Ping = {
                methodName: "Ping",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.PingRequest,
                responseType: r.PingResponse
            }, n.GetAccountAtBlockID = {
                methodName: "GetAccountAtBlockID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetAccountAtBlockIDRequest,
                responseType: r.GetAccountAtBlockIDResponse
            }, n.ExecuteScriptAtBlockID = {
                methodName: "ExecuteScriptAtBlockID",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.ExecuteScriptAtBlockIDRequest,
                responseType: r.ExecuteScriptAtBlockIDResponse
            }, n.GetEventsForBlockIDs = {
                methodName: "GetEventsForBlockIDs",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetEventsForBlockIDsRequest,
                responseType: r.GetEventsForBlockIDsResponse
            }, n.GetTransactionResult = {
                methodName: "GetTransactionResult",
                service: n,
                requestStream: !1,
                responseStream: !1,
                requestType: r.GetTransactionResultRequest,
                responseType: r.GetTransactionResultResponse
            }, t.ExecutionAPI = n, i.prototype.ping = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.Ping, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getAccountAtBlockID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetAccountAtBlockID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.executeScriptAtBlockID = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.ExecuteScriptAtBlockID, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getEventsForBlockIDs = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetEventsForBlockIDs, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, i.prototype.getTransactionResult = function(e, t, o) {
                2 === arguments.length && (o = arguments[1]);
                var r = s.unary(n.GetTransactionResult, {
                    request: e,
                    host: this.serviceHost,
                    metadata: t,
                    transport: this.options.transport,
                    debug: this.options.debug,
                    onEnd: function(e) {
                        if (o)
                            if (e.status !== s.Code.OK) {
                                var t = new Error(e.statusMessage);
                                t.code = e.status, t.metadata = e.trailers, o(t, null)
                            } else o(null, e.message)
                    }
                });
                return {
                    cancel: function() {
                        o = null, r.close()
                    }
                }
            }, t.ExecutionAPIClient = i
        }, function(e, t, o) {
            "use strict";
            o.r(t);
            var r = o(10);
            for (var s in r) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return r[e]
                })
            }(s);
            var n = o(4);
            for (var s in n) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return n[e]
                })
            }(s);
            var i = o(12);
            for (var s in i) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return i[e]
                })
            }(s);
            var a = o(2);
            for (var s in a) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return a[e]
                })
            }(s);
            var g = o(13);
            for (var s in g) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return g[e]
                })
            }(s);
            var c = o(5);
            for (var s in c) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return c[e]
                })
            }(s);
            var u = o(14);
            for (var s in u) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return u[e]
                })
            }(s);
            var l = o(6);
            for (var s in l) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return l[e]
                })
            }(s);
            var p = o(15);
            for (var s in p) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return p[e]
                })
            }(s);
            var d = o(7);
            for (var s in d) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return d[e]
                })
            }(s);
            var f = o(16);
            for (var s in f) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return f[e]
                })
            }(s);
            var h = o(1);
            for (var s in h) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return h[e]
                })
            }(s);
            var y = o(17);
            for (var s in y) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return y[e]
                })
            }(s);
            var b = o(3);
            for (var s in b) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return b[e]
                })
            }(s);
            var _ = o(18);
            for (var s in _) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return _[e]
                })
            }(s);
            var m = o(8);
            for (var s in m) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return m[e]
                })
            }(s);
            var E = o(19);
            for (var s in E) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return E[e]
                })
            }(s);
            var S = o(9);
            for (var s in S) "default" !== s && function(e) {
                o.d(t, e, function() {
                    return S[e]
                })
            }(s)
        }, function(e, t, o) {
            var r = o(0),
                s = r,
                n = Function("return this")();
            s.exportSymbol("proto.google.protobuf.Timestamp", null, n), proto.google.protobuf.Timestamp = function(e) {
                r.Message.initialize(this, e, 0, -1, null, null)
            }, s.inherits(proto.google.protobuf.Timestamp, r.Message), s.DEBUG && !COMPILED && (proto.google.protobuf.Timestamp.displayName = "proto.google.protobuf.Timestamp"), r.Message.GENERATE_TO_OBJECT && (proto.google.protobuf.Timestamp.prototype.toObject = function(e) {
                return proto.google.protobuf.Timestamp.toObject(e, this)
            }, proto.google.protobuf.Timestamp.toObject = function(e, t) {
                var o = {
                    seconds: r.Message.getFieldWithDefault(t, 1, 0),
                    nanos: r.Message.getFieldWithDefault(t, 2, 0)
                };
                return e && (o.$jspbMessageInstance = t), o
            }), proto.google.protobuf.Timestamp.deserializeBinary = function(e) {
                var t = new r.BinaryReader(e),
                    o = new proto.google.protobuf.Timestamp;
                return proto.google.protobuf.Timestamp.deserializeBinaryFromReader(o, t)
            }, proto.google.protobuf.Timestamp.deserializeBinaryFromReader = function(e, t) {
                for (; t.nextField() && !t.isEndGroup();) switch (t.getFieldNumber()) {
                    case 1:
                        var o = t.readInt64();
                        e.setSeconds(o);
                        break;
                    case 2:
                        o = t.readInt32(), e.setNanos(o);
                        break;
                    default:
                        t.skipField()
                }
                return e
            }, proto.google.protobuf.Timestamp.prototype.serializeBinary = function() {
                var e = new r.BinaryWriter;
                return proto.google.protobuf.Timestamp.serializeBinaryToWriter(this, e), e.getResultBuffer()
            }, proto.google.protobuf.Timestamp.serializeBinaryToWriter = function(e, t) {
                var o = void 0;
                0 !== (o = e.getSeconds()) && t.writeInt64(1, o), 0 !== (o = e.getNanos()) && t.writeInt32(2, o)
            }, proto.google.protobuf.Timestamp.prototype.getSeconds = function() {
                return r.Message.getFieldWithDefault(this, 1, 0)
            }, proto.google.protobuf.Timestamp.prototype.setSeconds = function(e) {
                return r.Message.setProto3IntField(this, 1, e)
            }, proto.google.protobuf.Timestamp.prototype.getNanos = function() {
                return r.Message.getFieldWithDefault(this, 2, 0)
            }, proto.google.protobuf.Timestamp.prototype.setNanos = function(e) {
                return r.Message.setProto3IntField(this, 2, e)
            }, s.object.extend(t, proto.google.protobuf), proto.google.protobuf.Timestamp.prototype.toDate = function() {
                var e = this.getSeconds(),
                    t = this.getNanos();
                return new Date(1e3 * e + t / 1e6)
            }, proto.google.protobuf.Timestamp.prototype.fromDate = function(e) {
                this.setSeconds(Math.floor(e.getTime() / 1e3)), this.setNanos(1e6 * e.getMilliseconds())
            }, proto.google.protobuf.Timestamp.fromDate = function(e) {
                var t = new proto.google.protobuf.Timestamp;
                return t.fromDate(e), t
            }
        }]);
    }, {
        "buffer": "ARb5"
    }],
    "CVFT": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.response = void 0;
        var e = function() {
            return JSON.parse('{"tag": 0, "transaction":null, "transactionId":null, "encodedData":null, "events": null, "account": null}')
        };
        exports.response = e;
    }, {}],
    "FY0d": [function(require, module, exports) {
        var define;
        var e;
        ! function(t, n) {
            if ("object" == typeof exports && "object" == typeof module) module.exports = n();
            else if ("function" == typeof e && e.amd) e([], n);
            else {
                var r = n();
                for (var o in r)("object" == typeof exports ? exports : t)[o] = r[o]
            }
        }(this, function() {
            return function(e) {
                var t = {};

                function n(r) {
                    if (t[r]) return t[r].exports;
                    var o = t[r] = {
                        i: r,
                        l: !1,
                        exports: {}
                    };
                    return e[r].call(o.exports, o, o.exports, n), o.l = !0, o.exports
                }
                return n.m = e, n.c = t, n.d = function(e, t, r) {
                    n.o(e, t) || Object.defineProperty(e, t, {
                        enumerable: !0,
                        get: r
                    })
                }, n.r = function(e) {
                    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                        value: "Module"
                    }), Object.defineProperty(e, "__esModule", {
                        value: !0
                    })
                }, n.t = function(e, t) {
                    if (1 & t && (e = n(e)), 8 & t) return e;
                    if (4 & t && "object" == typeof e && e && e.__esModule) return e;
                    var r = Object.create(null);
                    if (n.r(r), Object.defineProperty(r, "default", {
                            enumerable: !0,
                            value: e
                        }), 2 & t && "string" != typeof e)
                        for (var o in e) n.d(r, o, function(t) {
                            return e[t]
                        }.bind(null, o));
                    return r
                }, n.n = function(e) {
                    var t = e && e.__esModule ? function() {
                        return e.default
                    } : function() {
                        return e
                    };
                    return n.d(t, "a", t), t
                }, n.o = function(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t)
                }, n.p = "", n(n.s = 11)
            }([function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(4);
                t.Metadata = r.BrowserHeaders
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.debug = function() {
                    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                    console.debug ? console.debug.apply(null, e) : console.log.apply(null, e)
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = null;
                t.default = function(e) {
                    null === r ? (r = [e], setTimeout(function() {
                        ! function e() {
                            if (r) {
                                var t = r;
                                r = null;
                                for (var n = 0; n < t.length; n++) try {
                                    t[n]()
                                } catch (s) {
                                    null === r && (r = [], setTimeout(function() {
                                        e()
                                    }, 0));
                                    for (var o = t.length - 1; o > n; o--) r.unshift(t[o]);
                                    throw s
                                }
                            }
                        }()
                    }, 0)) : r.push(e)
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(0),
                    o = n(9),
                    s = n(10),
                    i = n(1),
                    a = n(2),
                    u = n(5),
                    d = n(15);
                t.client = function(e, t) {
                    return new c(e, t)
                };
                var c = function() {
                    function e(e, t) {
                        this.started = !1, this.sentFirstMessage = !1, this.completed = !1, this.closed = !1, this.finishedSending = !1, this.onHeadersCallbacks = [], this.onMessageCallbacks = [], this.onEndCallbacks = [], this.parser = new o.ChunkParser, this.methodDefinition = e, this.props = t, this.createTransport()
                    }
                    return e.prototype.createTransport = function() {
                        var e = this.props.host + "/" + this.methodDefinition.service.serviceName + "/" + this.methodDefinition.methodName,
                            t = {
                                methodDefinition: this.methodDefinition,
                                debug: this.props.debug || !1,
                                url: e,
                                onHeaders: this.onTransportHeaders.bind(this),
                                onChunk: this.onTransportChunk.bind(this),
                                onEnd: this.onTransportEnd.bind(this)
                            };
                        this.props.transport ? this.transport = this.props.transport(t) : this.transport = u.makeDefaultTransport(t)
                    }, e.prototype.onTransportHeaders = function(e, t) {
                        if (this.props.debug && i.debug("onHeaders", e, t), this.closed) this.props.debug && i.debug("grpc.onHeaders received after request was closed - ignoring");
                        else if (0 === t);
                        else {
                            this.responseHeaders = e, this.props.debug && i.debug("onHeaders.responseHeaders", JSON.stringify(this.responseHeaders, null, 2));
                            var n = p(e);
                            this.props.debug && i.debug("onHeaders.gRPCStatus", n);
                            var r = n && n >= 0 ? n : s.httpStatusToCode(t);
                            this.props.debug && i.debug("onHeaders.code", r);
                            var o = e.get("grpc-message") || [];
                            if (this.props.debug && i.debug("onHeaders.gRPCMessage", o), this.rawOnHeaders(e), r !== s.Code.OK) {
                                var a = this.decodeGRPCStatus(o[0]);
                                this.rawOnError(r, a, e)
                            }
                        }
                    }, e.prototype.onTransportChunk = function(e) {
                        var t = this;
                        if (this.closed) this.props.debug && i.debug("grpc.onChunk received after request was closed - ignoring");
                        else {
                            var n = [];
                            try {
                                n = this.parser.parse(e)
                            } catch (e) {
                                return this.props.debug && i.debug("onChunk.parsing error", e, e.message), void this.rawOnError(s.Code.Internal, "parsing error: " + e.message)
                            }
                            n.forEach(function(e) {
                                if (e.chunkType === o.ChunkType.MESSAGE) {
                                    var n = t.methodDefinition.responseType.deserializeBinary(e.data);
                                    t.rawOnMessage(n)
                                } else e.chunkType === o.ChunkType.TRAILERS && (t.responseHeaders ? (t.responseTrailers = new r.Metadata(e.trailers), t.props.debug && i.debug("onChunk.trailers", t.responseTrailers)) : (t.responseHeaders = new r.Metadata(e.trailers), t.rawOnHeaders(t.responseHeaders)))
                            })
                        }
                    }, e.prototype.onTransportEnd = function() {
                        if (this.props.debug && i.debug("grpc.onEnd"), this.closed) this.props.debug && i.debug("grpc.onEnd received after request was closed - ignoring");
                        else if (void 0 !== this.responseTrailers) {
                            var e = p(this.responseTrailers);
                            if (null !== e) {
                                var t = this.responseTrailers.get("grpc-message"),
                                    n = this.decodeGRPCStatus(t[0]);
                                this.rawOnEnd(e, n, this.responseTrailers)
                            } else this.rawOnError(s.Code.Internal, "Response closed without grpc-status (Trailers provided)")
                        } else {
                            if (void 0 === this.responseHeaders) return void this.rawOnError(s.Code.Unknown, "Response closed without headers");
                            var r = p(this.responseHeaders),
                                o = this.responseHeaders.get("grpc-message");
                            if (this.props.debug && i.debug("grpc.headers only response ", r, o), null === r) return void this.rawOnEnd(s.Code.Unknown, "Response closed without grpc-status (Headers only)", this.responseHeaders);
                            var a = this.decodeGRPCStatus(o[0]);
                            this.rawOnEnd(r, a, this.responseHeaders)
                        }
                    }, e.prototype.decodeGRPCStatus = function(e) {
                        if (!e) return "";
                        try {
                            return decodeURIComponent(e)
                        } catch (t) {
                            return e
                        }
                    }, e.prototype.rawOnEnd = function(e, t, n) {
                        var r = this;
                        this.props.debug && i.debug("rawOnEnd", e, t, n), this.completed || (this.completed = !0, this.onEndCallbacks.forEach(function(o) {
                            a.default(function() {
                                r.closed || o(e, t, n)
                            })
                        }))
                    }, e.prototype.rawOnHeaders = function(e) {
                        this.props.debug && i.debug("rawOnHeaders", e), this.completed || this.onHeadersCallbacks.forEach(function(t) {
                            a.default(function() {
                                t(e)
                            })
                        })
                    }, e.prototype.rawOnError = function(e, t, n) {
                        var o = this;
                        void 0 === n && (n = new r.Metadata), this.props.debug && i.debug("rawOnError", e, t), this.completed || (this.completed = !0, this.onEndCallbacks.forEach(function(r) {
                            a.default(function() {
                                o.closed || r(e, t, n)
                            })
                        }))
                    }, e.prototype.rawOnMessage = function(e) {
                        var t = this;
                        this.props.debug && i.debug("rawOnMessage", e.toObject()), this.completed || this.closed || this.onMessageCallbacks.forEach(function(n) {
                            a.default(function() {
                                t.closed || n(e)
                            })
                        })
                    }, e.prototype.onHeaders = function(e) {
                        this.onHeadersCallbacks.push(e)
                    }, e.prototype.onMessage = function(e) {
                        this.onMessageCallbacks.push(e)
                    }, e.prototype.onEnd = function(e) {
                        this.onEndCallbacks.push(e)
                    }, e.prototype.start = function(e) {
                        if (this.started) throw new Error("Client already started - cannot .start()");
                        this.started = !0;
                        var t = new r.Metadata(e || {});
                        t.set("content-type", "application/grpc-web+proto"), t.set("x-grpc-web", "1"), this.transport.start(t)
                    }, e.prototype.send = function(e) {
                        if (!this.started) throw new Error("Client not started - .start() must be called before .send()");
                        if (this.closed) throw new Error("Client already closed - cannot .send()");
                        if (this.finishedSending) throw new Error("Client already finished sending - cannot .send()");
                        if (!this.methodDefinition.requestStream && this.sentFirstMessage) throw new Error("Message already sent for non-client-streaming method - cannot .send()");
                        this.sentFirstMessage = !0;
                        var t = d.frameRequest(e);
                        this.transport.sendMessage(t)
                    }, e.prototype.finishSend = function() {
                        if (!this.started) throw new Error("Client not started - .finishSend() must be called before .close()");
                        if (this.closed) throw new Error("Client already closed - cannot .send()");
                        if (this.finishedSending) throw new Error("Client already finished sending - cannot .finishSend()");
                        this.finishedSending = !0, this.transport.finishSend()
                    }, e.prototype.close = function() {
                        if (!this.started) throw new Error("Client not started - .start() must be called before .close()");
                        if (this.closed) throw new Error("Client already closed - cannot .close()");
                        this.closed = !0, this.props.debug && i.debug("request.abort aborting request"), this.transport.cancel()
                    }, e
                }();

                function p(e) {
                    var t = e.get("grpc-status") || [];
                    if (t.length > 0) try {
                        var n = t[0];
                        return parseInt(n, 10)
                    } catch (e) {
                        return null
                    }
                    return null
                }
            }, function(e, t, n) {
                var r;
                r = function() {
                    return function(e) {
                        var t = {};

                        function n(r) {
                            if (t[r]) return t[r].exports;
                            var o = t[r] = {
                                i: r,
                                l: !1,
                                exports: {}
                            };
                            return e[r].call(o.exports, o, o.exports, n), o.l = !0, o.exports
                        }
                        return n.m = e, n.c = t, n.i = function(e) {
                            return e
                        }, n.d = function(e, t, r) {
                            n.o(e, t) || Object.defineProperty(e, t, {
                                configurable: !1,
                                enumerable: !0,
                                get: r
                            })
                        }, n.n = function(e) {
                            var t = e && e.__esModule ? function() {
                                return e.default
                            } : function() {
                                return e
                            };
                            return n.d(t, "a", t), t
                        }, n.o = function(e, t) {
                            return Object.prototype.hasOwnProperty.call(e, t)
                        }, n.p = "", n(n.s = 1)
                    }([function(e, t, n) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = n(3),
                            o = function() {
                                function e(e, t) {
                                    void 0 === e && (e = {}), void 0 === t && (t = {
                                        splitValues: !1
                                    });
                                    var n, o = this;
                                    this.headersMap = {}, e && ("undefined" != typeof Headers && e instanceof Headers ? r.getHeaderKeys(e).forEach(function(n) {
                                        r.getHeaderValues(e, n).forEach(function(e) {
                                            t.splitValues ? o.append(n, r.splitHeaderValue(e)) : o.append(n, e)
                                        })
                                    }) : "object" == typeof(n = e) && "object" == typeof n.headersMap && "function" == typeof n.forEach ? e.forEach(function(e, t) {
                                        o.append(e, t)
                                    }) : "undefined" != typeof Map && e instanceof Map ? e.forEach(function(e, t) {
                                        o.append(t, e)
                                    }) : "string" == typeof e ? this.appendFromString(e) : "object" == typeof e && Object.getOwnPropertyNames(e).forEach(function(t) {
                                        var n = e[t];
                                        Array.isArray(n) ? n.forEach(function(e) {
                                            o.append(t, e)
                                        }) : o.append(t, n)
                                    }))
                                }
                                return e.prototype.appendFromString = function(e) {
                                    for (var t = e.split("\r\n"), n = 0; n < t.length; n++) {
                                        var r = t[n],
                                            o = r.indexOf(":");
                                        if (o > 0) {
                                            var s = r.substring(0, o).trim(),
                                                i = r.substring(o + 1).trim();
                                            this.append(s, i)
                                        }
                                    }
                                }, e.prototype.delete = function(e, t) {
                                    var n = r.normalizeName(e);
                                    if (void 0 === t) delete this.headersMap[n];
                                    else {
                                        var o = this.headersMap[n];
                                        if (o) {
                                            var s = o.indexOf(t);
                                            s >= 0 && o.splice(s, 1), 0 === o.length && delete this.headersMap[n]
                                        }
                                    }
                                }, e.prototype.append = function(e, t) {
                                    var n = this,
                                        o = r.normalizeName(e);
                                    Array.isArray(this.headersMap[o]) || (this.headersMap[o] = []), Array.isArray(t) ? t.forEach(function(e) {
                                        n.headersMap[o].push(r.normalizeValue(e))
                                    }) : this.headersMap[o].push(r.normalizeValue(t))
                                }, e.prototype.set = function(e, t) {
                                    var n = r.normalizeName(e);
                                    if (Array.isArray(t)) {
                                        var o = [];
                                        t.forEach(function(e) {
                                            o.push(r.normalizeValue(e))
                                        }), this.headersMap[n] = o
                                    } else this.headersMap[n] = [r.normalizeValue(t)]
                                }, e.prototype.has = function(e, t) {
                                    var n = this.headersMap[r.normalizeName(e)];
                                    if (!Array.isArray(n)) return !1;
                                    if (void 0 !== t) {
                                        var o = r.normalizeValue(t);
                                        return n.indexOf(o) >= 0
                                    }
                                    return !0
                                }, e.prototype.get = function(e) {
                                    var t = this.headersMap[r.normalizeName(e)];
                                    return void 0 !== t ? t.concat() : []
                                }, e.prototype.forEach = function(e) {
                                    var t = this;
                                    Object.getOwnPropertyNames(this.headersMap).forEach(function(n) {
                                        e(n, t.headersMap[n])
                                    }, this)
                                }, e.prototype.toHeaders = function() {
                                    if ("undefined" != typeof Headers) {
                                        var e = new Headers;
                                        return this.forEach(function(t, n) {
                                            n.forEach(function(n) {
                                                e.append(t, n)
                                            })
                                        }), e
                                    }
                                    throw new Error("Headers class is not defined")
                                }, e
                            }();
                        t.BrowserHeaders = o
                    }, function(e, t, n) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = n(0);
                        t.BrowserHeaders = r.BrowserHeaders
                    }, function(e, t, n) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        }), t.iterateHeaders = function(e, t) {
                            for (var n = e[Symbol.iterator](), r = n.next(); !r.done;) t(r.value[0]), r = n.next()
                        }, t.iterateHeadersKeys = function(e, t) {
                            for (var n = e.keys(), r = n.next(); !r.done;) t(r.value), r = n.next()
                        }
                    }, function(e, t, n) {
                        "use strict";
                        Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                        var r = n(2);

                        function o(e) {
                            return e
                        }
                        t.normalizeName = function(e) {
                            if ("string" != typeof e && (e = String(e)), /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(e)) throw new TypeError("Invalid character in header field name");
                            return e.toLowerCase()
                        }, t.normalizeValue = function(e) {
                            return "string" != typeof e && (e = String(e)), e
                        }, t.getHeaderValues = function(e, t) {
                            var n = o(e);
                            if (n instanceof Headers && n.getAll) return n.getAll(t);
                            var r = n.get(t);
                            return r && "string" == typeof r ? [r] : r
                        }, t.getHeaderKeys = function(e) {
                            var t = o(e),
                                n = {},
                                s = [];
                            return t.keys ? r.iterateHeadersKeys(t, function(e) {
                                n[e] || (n[e] = !0, s.push(e))
                            }) : t.forEach ? t.forEach(function(e, t) {
                                n[t] || (n[t] = !0, s.push(t))
                            }) : r.iterateHeaders(t, function(e) {
                                var t = e[0];
                                n[t] || (n[t] = !0, s.push(t))
                            }), s
                        }, t.splitHeaderValue = function(e) {
                            var t = [];
                            return e.split(", ").forEach(function(e) {
                                e.split(",").forEach(function(e) {
                                    t.push(e)
                                })
                            }), t
                        }
                    }])
                }, e.exports = r()
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(6),
                    o = function(e) {
                        return r.CrossBrowserHttpTransport({
                            withCredentials: !1
                        })(e)
                    };
                t.setDefaultTransportFactory = function(e) {
                    o = e
                }, t.makeDefaultTransport = function(e) {
                    return o(e)
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(7),
                    o = n(8);
                t.CrossBrowserHttpTransport = function(e) {
                    if (r.detectFetchSupport()) {
                        var t = {
                            credentials: e.withCredentials ? "include" : "same-origin"
                        };
                        return r.FetchReadableStreamTransport(t)
                    }
                    return o.XhrTransport({
                        withCredentials: e.withCredentials
                    })
                }
            }, function(e, t, n) {
                "use strict";
                var r = this && this.__assign || function() {
                    return (r = Object.assign || function(e) {
                        for (var t, n = 1, r = arguments.length; n < r; n++)
                            for (var o in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
                        return e
                    }).apply(this, arguments)
                };
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var o = n(0),
                    s = n(1),
                    i = n(2);
                t.FetchReadableStreamTransport = function(e) {
                    return function(t) {
                        return function(e, t) {
                            return e.debug && s.debug("fetchRequest", e), new a(e, t)
                        }(t, e)
                    }
                };
                var a = function() {
                    function e(e, t) {
                        this.cancelled = !1, this.controller = self.AbortController && new AbortController, this.options = e, this.init = t
                    }
                    return e.prototype.pump = function(e, t) {
                        var n = this;
                        if (this.reader = e, this.cancelled) return this.options.debug && s.debug("Fetch.pump.cancel at first pump"), void this.reader.cancel();
                        this.reader.read().then(function(e) {
                            if (e.done) return i.default(function() {
                                n.options.onEnd()
                            }), t;
                            i.default(function() {
                                n.options.onChunk(e.value)
                            }), n.pump(n.reader, t)
                        }).catch(function(e) {
                            n.cancelled ? n.options.debug && s.debug("Fetch.catch - request cancelled") : (n.cancelled = !0, n.options.debug && s.debug("Fetch.catch", e.message), i.default(function() {
                                n.options.onEnd(e)
                            }))
                        })
                    }, e.prototype.send = function(e) {
                        var t = this;
                        fetch(this.options.url, r({}, this.init, {
                            headers: this.metadata.toHeaders(),
                            method: "POST",
                            body: e,
                            signal: this.controller && this.controller.signal
                        })).then(function(e) {
                            if (t.options.debug && s.debug("Fetch.response", e), i.default(function() {
                                    t.options.onHeaders(new o.Metadata(e.headers), e.status)
                                }), !e.body) return e;
                            t.pump(e.body.getReader(), e)
                        }).catch(function(e) {
                            t.cancelled ? t.options.debug && s.debug("Fetch.catch - request cancelled") : (t.cancelled = !0, t.options.debug && s.debug("Fetch.catch", e.message), i.default(function() {
                                t.options.onEnd(e)
                            }))
                        })
                    }, e.prototype.sendMessage = function(e) {
                        this.send(e)
                    }, e.prototype.finishSend = function() {}, e.prototype.start = function(e) {
                        this.metadata = e
                    }, e.prototype.cancel = function() {
                        this.cancelled ? this.options.debug && s.debug("Fetch.abort.cancel already cancelled") : (this.cancelled = !0, this.reader ? (this.options.debug && s.debug("Fetch.abort.cancel"), this.reader.cancel()) : this.options.debug && s.debug("Fetch.abort.cancel before reader"), this.controller && this.controller.abort())
                    }, e
                }();
                t.detectFetchSupport = function() {
                    return "undefined" != typeof Response && Response.prototype.hasOwnProperty("body") && "function" == typeof Headers
                }
            }, function(e, t, n) {
                "use strict";
                var r, o = this && this.__extends || (r = function(e, t) {
                    return (r = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(e, t) {
                            e.__proto__ = t
                        } || function(e, t) {
                            for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n])
                        })(e, t)
                }, function(e, t) {
                    function n() {
                        this.constructor = e
                    }
                    r(e, t), e.prototype = null === t ? Object.create(t) : (n.prototype = t.prototype, new n)
                });
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var s = n(0),
                    i = n(1),
                    a = n(2),
                    u = n(12);
                t.XhrTransport = function(e) {
                    return function(t) {
                        if (u.detectMozXHRSupport()) return new c(t, e);
                        if (u.detectXHROverrideMimeTypeSupport()) return new d(t, e);
                        throw new Error("This environment's XHR implementation cannot support binary transfer.")
                    }
                };
                var d = function() {
                    function e(e, t) {
                        this.options = e, this.init = t
                    }
                    return e.prototype.onProgressEvent = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onProgressEvent.length: ", this.xhr.response.length);
                        var t = this.xhr.response.substr(this.index);
                        this.index = this.xhr.response.length;
                        var n = f(t);
                        a.default(function() {
                            e.options.onChunk(n)
                        })
                    }, e.prototype.onLoadEvent = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onLoadEvent"), a.default(function() {
                            e.options.onEnd()
                        })
                    }, e.prototype.onStateChange = function() {
                        var e = this;
                        this.options.debug && i.debug("XHR.onStateChange", this.xhr.readyState), this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && a.default(function() {
                            e.options.onHeaders(new s.Metadata(e.xhr.getAllResponseHeaders()), e.xhr.status)
                        })
                    }, e.prototype.sendMessage = function(e) {
                        this.xhr.send(e)
                    }, e.prototype.finishSend = function() {}, e.prototype.start = function(e) {
                        var t = this;
                        this.metadata = e;
                        var n = new XMLHttpRequest;
                        this.xhr = n, n.open("POST", this.options.url), this.configureXhr(), this.metadata.forEach(function(e, t) {
                            n.setRequestHeader(e, t.join(", "))
                        }), n.withCredentials = Boolean(this.init.withCredentials), n.addEventListener("readystatechange", this.onStateChange.bind(this)), n.addEventListener("progress", this.onProgressEvent.bind(this)), n.addEventListener("loadend", this.onLoadEvent.bind(this)), n.addEventListener("error", function(e) {
                            t.options.debug && i.debug("XHR.error", e), a.default(function() {
                                t.options.onEnd(e.error)
                            })
                        })
                    }, e.prototype.configureXhr = function() {
                        this.xhr.responseType = "text", this.xhr.overrideMimeType("text/plain; charset=x-user-defined")
                    }, e.prototype.cancel = function() {
                        this.options.debug && i.debug("XHR.abort"), this.xhr.abort()
                    }, e
                }();
                t.XHR = d;
                var c = function(e) {
                    function t() {
                        return null !== e && e.apply(this, arguments) || this
                    }
                    return o(t, e), t.prototype.configureXhr = function() {
                        this.options.debug && i.debug("MozXHR.configureXhr: setting responseType to 'moz-chunked-arraybuffer'"), this.xhr.responseType = "moz-chunked-arraybuffer"
                    }, t.prototype.onProgressEvent = function() {
                        var e = this,
                            t = this.xhr.response;
                        this.options.debug && i.debug("MozXHR.onProgressEvent: ", new Uint8Array(t)), a.default(function() {
                            e.options.onChunk(new Uint8Array(t))
                        })
                    }, t
                }(d);

                function p(e, t) {
                    var n = e.charCodeAt(t);
                    if (n >= 55296 && n <= 56319) {
                        var r = e.charCodeAt(t + 1);
                        r >= 56320 && r <= 57343 && (n = 65536 + (n - 55296 << 10) + (r - 56320))
                    }
                    return n
                }

                function f(e) {
                    for (var t = new Uint8Array(e.length), n = 0, r = 0; r < e.length; r++) {
                        var o = String.prototype.codePointAt ? e.codePointAt(r) : p(e, r);
                        t[n++] = 255 & o
                    }
                    return t
                }
                t.MozChunkedArrayBufferXHR = c, t.stringToArrayBuffer = f
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r, o = n(0),
                    s = function(e) {
                        return 9 === e || 10 === e || 13 === e
                    };

                function i(e) {
                    return s(e) || e >= 32 && e <= 126
                }

                function a(e) {
                    for (var t = 0; t !== e.length; ++t)
                        if (!i(e[t])) throw new Error("Metadata is not valid (printable) ASCII");
                    return String.fromCharCode.apply(String, Array.prototype.slice.call(e))
                }

                function u(e) {
                    return 128 == (128 & e.getUint8(0))
                }

                function d(e) {
                    return e.getUint32(1, !1)
                }

                function c(e, t, n) {
                    return e.byteLength - t >= n
                }

                function p(e, t, n) {
                    if (e.slice) return e.slice(t, n);
                    var r = e.length;
                    void 0 !== n && (r = n);
                    for (var o = new Uint8Array(r - t), s = 0, i = t; i < r; i++) o[s++] = e[i];
                    return o
                }
                t.decodeASCII = a, t.encodeASCII = function(e) {
                        for (var t = new Uint8Array(e.length), n = 0; n !== e.length; ++n) {
                            var r = e.charCodeAt(n);
                            if (!i(r)) throw new Error("Metadata contains invalid ASCII");
                            t[n] = r
                        }
                        return t
                    },
                    function(e) {
                        e[e.MESSAGE = 1] = "MESSAGE", e[e.TRAILERS = 2] = "TRAILERS"
                    }(r = t.ChunkType || (t.ChunkType = {}));
                var f = function() {
                    function e() {
                        this.buffer = null, this.position = 0
                    }
                    return e.prototype.parse = function(e, t) {
                        if (0 === e.length && t) return [];
                        var n, s = [];
                        if (null == this.buffer) this.buffer = e, this.position = 0;
                        else if (this.position === this.buffer.byteLength) this.buffer = e, this.position = 0;
                        else {
                            var i = this.buffer.byteLength - this.position,
                                f = new Uint8Array(i + e.byteLength),
                                h = p(this.buffer, this.position);
                            f.set(h, 0);
                            var l = new Uint8Array(e);
                            f.set(l, i), this.buffer = f, this.position = 0
                        }
                        for (;;) {
                            if (!c(this.buffer, this.position, 5)) return s;
                            var g = p(this.buffer, this.position, this.position + 5),
                                b = new DataView(g.buffer, g.byteOffset, g.byteLength),
                                y = d(b);
                            if (!c(this.buffer, this.position, 5 + y)) return s;
                            var v = p(this.buffer, this.position + 5, this.position + 5 + y);
                            if (this.position += 5 + y, u(b)) return s.push({
                                chunkType: r.TRAILERS,
                                trailers: (n = v, new o.Metadata(a(n)))
                            }), s;
                            s.push({
                                chunkType: r.MESSAGE,
                                data: v
                            })
                        }
                    }, e
                }();
                t.ChunkParser = f
            }, function(e, t, n) {
                "use strict";
                var r;
                Object.defineProperty(t, "__esModule", {
                        value: !0
                    }),
                    function(e) {
                        e[e.OK = 0] = "OK", e[e.Canceled = 1] = "Canceled", e[e.Unknown = 2] = "Unknown", e[e.InvalidArgument = 3] = "InvalidArgument", e[e.DeadlineExceeded = 4] = "DeadlineExceeded", e[e.NotFound = 5] = "NotFound", e[e.AlreadyExists = 6] = "AlreadyExists", e[e.PermissionDenied = 7] = "PermissionDenied", e[e.ResourceExhausted = 8] = "ResourceExhausted", e[e.FailedPrecondition = 9] = "FailedPrecondition", e[e.Aborted = 10] = "Aborted", e[e.OutOfRange = 11] = "OutOfRange", e[e.Unimplemented = 12] = "Unimplemented", e[e.Internal = 13] = "Internal", e[e.Unavailable = 14] = "Unavailable", e[e.DataLoss = 15] = "DataLoss", e[e.Unauthenticated = 16] = "Unauthenticated"
                    }(r = t.Code || (t.Code = {})), t.httpStatusToCode = function(e) {
                        switch (e) {
                            case 0:
                                return r.Internal;
                            case 200:
                                return r.OK;
                            case 400:
                                return r.InvalidArgument;
                            case 401:
                                return r.Unauthenticated;
                            case 403:
                                return r.PermissionDenied;
                            case 404:
                                return r.NotFound;
                            case 409:
                                return r.Aborted;
                            case 412:
                                return r.FailedPrecondition;
                            case 429:
                                return r.ResourceExhausted;
                            case 499:
                                return r.Canceled;
                            case 500:
                                return r.Unknown;
                            case 501:
                                return r.Unimplemented;
                            case 503:
                                return r.Unavailable;
                            case 504:
                                return r.DeadlineExceeded;
                            default:
                                return r.Unknown
                        }
                    }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(4),
                    o = n(5),
                    s = n(7),
                    i = n(13),
                    a = n(8),
                    u = n(6),
                    d = n(10),
                    c = n(14),
                    p = n(16),
                    f = n(3);
                ! function(e) {
                    e.setDefaultTransport = o.setDefaultTransportFactory, e.CrossBrowserHttpTransport = u.CrossBrowserHttpTransport, e.FetchReadableStreamTransport = s.FetchReadableStreamTransport, e.XhrTransport = a.XhrTransport, e.WebsocketTransport = i.WebsocketTransport, e.Code = d.Code, e.Metadata = r.BrowserHeaders, e.client = function(e, t) {
                        return f.client(e, t)
                    }, e.invoke = c.invoke, e.unary = p.unary
                }(t.grpc || (t.grpc = {}))
            }, function(e, t, n) {
                "use strict";
                var r;

                function o(e) {
                    var t = function() {
                        if (void 0 !== r) return r;
                        if (XMLHttpRequest) {
                            r = new XMLHttpRequest;
                            try {
                                r.open("GET", "https://localhost")
                            } catch (e) {}
                        }
                        return r
                    }();
                    if (!t) return !1;
                    try {
                        return t.responseType = e, t.responseType === e
                    } catch (e) {}
                    return !1
                }
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.xhrSupportsResponseType = o, t.detectMozXHRSupport = function() {
                    return "undefined" != typeof XMLHttpRequest && o("moz-chunked-arraybuffer")
                }, t.detectXHROverrideMimeTypeSupport = function() {
                    return "undefined" != typeof XMLHttpRequest && XMLHttpRequest.prototype.hasOwnProperty("overrideMimeType")
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r, o = n(1),
                    s = n(2),
                    i = n(9);
                ! function(e) {
                    e[e.FINISH_SEND = 1] = "FINISH_SEND"
                }(r || (r = {}));
                var a = new Uint8Array([1]);
                t.WebsocketTransport = function() {
                    return function(e) {
                        return function(e) {
                            e.debug && o.debug("websocketRequest", e);
                            var t, n = function(e) {
                                    if ("https://" === e.substr(0, 8)) return "wss://" + e.substr(8);
                                    if ("http://" === e.substr(0, 7)) return "ws://" + e.substr(7);
                                    throw new Error("Websocket transport constructed with non-https:// or http:// host.")
                                }(e.url),
                                u = [];

                            function d(e) {
                                if (e === r.FINISH_SEND) t.send(a);
                                else {
                                    var n = e,
                                        o = new Int8Array(n.byteLength + 1);
                                    o.set(new Uint8Array([0])), o.set(n, 1), t.send(o)
                                }
                            }
                            return {
                                sendMessage: function(e) {
                                    t && t.readyState !== t.CONNECTING ? d(e) : u.push(e)
                                },
                                finishSend: function() {
                                    t && t.readyState !== t.CONNECTING ? d(r.FINISH_SEND) : u.push(r.FINISH_SEND)
                                },
                                start: function(r) {
                                    (t = new WebSocket(n, ["grpc-websockets"])).binaryType = "arraybuffer", t.onopen = function() {
                                        var n;
                                        e.debug && o.debug("websocketRequest.onopen"), t.send((n = "", r.forEach(function(e, t) {
                                            n += e + ": " + t.join(", ") + "\r\n"
                                        }), i.encodeASCII(n))), u.forEach(function(e) {
                                            d(e)
                                        })
                                    }, t.onclose = function(t) {
                                        e.debug && o.debug("websocketRequest.onclose", t), s.default(function() {
                                            e.onEnd()
                                        })
                                    }, t.onerror = function(t) {
                                        e.debug && o.debug("websocketRequest.onerror", t)
                                    }, t.onmessage = function(t) {
                                        s.default(function() {
                                            e.onChunk(new Uint8Array(t.data))
                                        })
                                    }
                                },
                                cancel: function() {
                                    e.debug && o.debug("websocket.abort"), s.default(function() {
                                        t.close()
                                    })
                                }
                            }
                        }(e)
                    }
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(3);
                t.invoke = function(e, t) {
                    if (e.requestStream) throw new Error(".invoke cannot be used with client-streaming methods. Use .client instead.");
                    var n = r.client(e, {
                        host: t.host,
                        transport: t.transport,
                        debug: t.debug
                    });
                    return t.onHeaders && n.onHeaders(t.onHeaders), t.onMessage && n.onMessage(t.onMessage), t.onEnd && n.onEnd(t.onEnd), n.start(t.metadata), n.send(t.request), n.finishSend(), {
                        close: function() {
                            n.close()
                        }
                    }
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                }), t.frameRequest = function(e) {
                    var t = e.serializeBinary(),
                        n = new ArrayBuffer(t.byteLength + 5);
                    return new DataView(n, 1, 4).setUint32(0, t.length, !1), new Uint8Array(n, 5).set(t), new Uint8Array(n)
                }
            }, function(e, t, n) {
                "use strict";
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = n(0),
                    o = n(3);
                t.unary = function(e, t) {
                    if (e.responseStream) throw new Error(".unary cannot be used with server-streaming methods. Use .invoke or .client instead.");
                    if (e.requestStream) throw new Error(".unary cannot be used with client-streaming methods. Use .client instead.");
                    var n = null,
                        s = null,
                        i = o.client(e, {
                            host: t.host,
                            transport: t.transport,
                            debug: t.debug
                        });
                    return i.onHeaders(function(e) {
                        n = e
                    }), i.onMessage(function(e) {
                        s = e
                    }), i.onEnd(function(e, o, i) {
                        t.onEnd({
                            status: e,
                            statusMessage: o,
                            headers: n || new r.Metadata,
                            message: s,
                            trailers: i
                        })
                    }), i.start(t.metadata), i.send(t.request), i.finishSend(), {
                        close: function() {
                            i.close()
                        }
                    }
                }
            }])
        });
    }, {}],
    "M4MV": [function(require, module, exports) {
        var global = arguments[3];
        var r, e = arguments[3];
        exports.fetch = s(e.fetch) && s(e.ReadableStream), exports.writableStream = s(e.WritableStream), exports.abortController = s(e.AbortController), exports.blobConstructor = !1;
        try {
            new Blob([new ArrayBuffer(1)]), exports.blobConstructor = !0
        } catch (f) {}

        function t() {
            if (void 0 !== r) return r;
            if (e.XMLHttpRequest) {
                r = new e.XMLHttpRequest;
                try {
                    r.open("GET", e.XDomainRequest ? "/" : "https://example.com")
                } catch (f) {
                    r = null
                }
            } else r = null;
            return r
        }

        function o(r) {
            var e = t();
            if (!e) return !1;
            try {
                return e.responseType = r, e.responseType === r
            } catch (f) {}
            return !1
        }
        var a = void 0 !== e.ArrayBuffer,
            n = a && s(e.ArrayBuffer.prototype.slice);

        function s(r) {
            return "function" == typeof r
        }
        exports.arraybuffer = exports.fetch || a && o("arraybuffer"), exports.msstream = !exports.fetch && n && o("ms-stream"), exports.mozchunkedarraybuffer = !exports.fetch && a && o("moz-chunked-arraybuffer"), exports.overrideMimeType = exports.fetch || !!t() && s(t().overrideMimeType), exports.vbArray = s(e.VBArray), r = null;
    }, {}],
    "CiT7": [function(require, module, exports) {
        "function" == typeof Object.create ? module.exports = function(t, e) {
            e && (t.super_ = e, t.prototype = Object.create(e.prototype, {
                constructor: {
                    value: t,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }))
        } : module.exports = function(t, e) {
            if (e) {
                t.super_ = e;
                var o = function() {};
                o.prototype = e.prototype, t.prototype = new o, t.prototype.constructor = t
            }
        };
    }, {}],
    "qLuB": [function(require, module, exports) {

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
    "uuRL": [function(require, module, exports) {
        var process = require("process");
        var n = require("process");

        function e(e, r, t, c) {
            if ("function" != typeof e) throw new TypeError('"callback" argument must be a function');
            var i, l, u = arguments.length;
            switch (u) {
                case 0:
                case 1:
                    return n.nextTick(e);
                case 2:
                    return n.nextTick(function() {
                        e.call(null, r)
                    });
                case 3:
                    return n.nextTick(function() {
                        e.call(null, r, t)
                    });
                case 4:
                    return n.nextTick(function() {
                        e.call(null, r, t, c)
                    });
                default:
                    for (i = new Array(u - 1), l = 0; l < i.length;) i[l++] = arguments[l];
                    return n.nextTick(function() {
                        e.apply(null, i)
                    })
            }
        }
        void 0 === n || !n.version || 0 === n.version.indexOf("v0.") || 0 === n.version.indexOf("v1.") && 0 !== n.version.indexOf("v1.8.") ? module.exports = {
            nextTick: e
        } : module.exports = n;
    }, {
        "process": "qLuB"
    }],
    "WnWe": [function(require, module, exports) {
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
    "LQWv": [function(require, module, exports) {
        module.exports = require("events").EventEmitter;
    }, {
        "events": "WnWe"
    }],
    "ziru": [function(require, module, exports) {

        var r = require("buffer"),
            e = r.Buffer;

        function n(r, e) {
            for (var n in r) e[n] = r[n]
        }

        function o(r, n, o) {
            return e(r, n, o)
        }
        e.from && e.alloc && e.allocUnsafe && e.allocUnsafeSlow ? module.exports = r : (n(r, exports), exports.Buffer = o), n(e, o), o.from = function(r, n, o) {
            if ("number" == typeof r) throw new TypeError("Argument must not be a number");
            return e(r, n, o)
        }, o.alloc = function(r, n, o) {
            if ("number" != typeof r) throw new TypeError("Argument must be a number");
            var f = e(r);
            return void 0 !== n ? "string" == typeof o ? f.fill(n, o) : f.fill(n) : f.fill(0), f
        }, o.allocUnsafe = function(r) {
            if ("number" != typeof r) throw new TypeError("Argument must be a number");
            return e(r)
        }, o.allocUnsafeSlow = function(e) {
            if ("number" != typeof e) throw new TypeError("Argument must be a number");
            return r.SlowBuffer(e)
        };
    }, {
        "buffer": "ARb5"
    }],
    "dzde": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var r = require("buffer").Buffer;

        function t(r) {
            return Array.isArray ? Array.isArray(r) : "[object Array]" === a(r)
        }

        function e(r) {
            return "boolean" == typeof r
        }

        function n(r) {
            return null === r
        }

        function o(r) {
            return null == r
        }

        function i(r) {
            return "number" == typeof r
        }

        function u(r) {
            return "string" == typeof r
        }

        function s(r) {
            return "symbol" == typeof r
        }

        function f(r) {
            return void 0 === r
        }

        function p(r) {
            return "[object RegExp]" === a(r)
        }

        function c(r) {
            return "object" == typeof r && null !== r
        }

        function l(r) {
            return "[object Date]" === a(r)
        }

        function y(r) {
            return "[object Error]" === a(r) || r instanceof Error
        }

        function x(r) {
            return "function" == typeof r
        }

        function b(r) {
            return null === r || "boolean" == typeof r || "number" == typeof r || "string" == typeof r || "symbol" == typeof r || void 0 === r
        }

        function a(r) {
            return Object.prototype.toString.call(r)
        }
        exports.isArray = t, exports.isBoolean = e, exports.isNull = n, exports.isNullOrUndefined = o, exports.isNumber = i, exports.isString = u, exports.isSymbol = s, exports.isUndefined = f, exports.isRegExp = p, exports.isObject = c, exports.isDate = l, exports.isError = y, exports.isFunction = x, exports.isPrimitive = b, exports.isBuffer = r.isBuffer;
    }, {
        "buffer": "ARb5"
    }],
    "jtu4": [function(require, module, exports) {

    }, {}],
    "xIMZ": [function(require, module, exports) {

        "use strict";

        function t(t, n) {
            if (!(t instanceof n)) throw new TypeError("Cannot call a class as a function")
        }
        var n = require("safe-buffer").Buffer,
            e = require("util");

        function i(t, n, e) {
            t.copy(n, e)
        }
        module.exports = function() {
            function e() {
                t(this, e), this.head = null, this.tail = null, this.length = 0
            }
            return e.prototype.push = function(t) {
                var n = {
                    data: t,
                    next: null
                };
                this.length > 0 ? this.tail.next = n : this.head = n, this.tail = n, ++this.length
            }, e.prototype.unshift = function(t) {
                var n = {
                    data: t,
                    next: this.head
                };
                0 === this.length && (this.tail = n), this.head = n, ++this.length
            }, e.prototype.shift = function() {
                if (0 !== this.length) {
                    var t = this.head.data;
                    return 1 === this.length ? this.head = this.tail = null : this.head = this.head.next, --this.length, t
                }
            }, e.prototype.clear = function() {
                this.head = this.tail = null, this.length = 0
            }, e.prototype.join = function(t) {
                if (0 === this.length) return "";
                for (var n = this.head, e = "" + n.data; n = n.next;) e += t + n.data;
                return e
            }, e.prototype.concat = function(t) {
                if (0 === this.length) return n.alloc(0);
                if (1 === this.length) return this.head.data;
                for (var e = n.allocUnsafe(t >>> 0), h = this.head, a = 0; h;) i(h.data, e, a), a += h.data.length, h = h.next;
                return e
            }, e
        }(), e && e.inspect && e.inspect.custom && (module.exports.prototype[e.inspect.custom] = function() {
            var t = e.inspect({
                length: this.length
            });
            return this.constructor.name + " " + t
        });
    }, {
        "safe-buffer": "ziru",
        "util": "jtu4"
    }],
    "huTf": [function(require, module, exports) {
        "use strict";
        var t = require("process-nextick-args");

        function e(e, a) {
            var r = this,
                s = this._readableState && this._readableState.destroyed,
                d = this._writableState && this._writableState.destroyed;
            return s || d ? (a ? a(e) : !e || this._writableState && this._writableState.errorEmitted || t.nextTick(i, this, e), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(e || null, function(e) {
                !a && e ? (t.nextTick(i, r, e), r._writableState && (r._writableState.errorEmitted = !0)) : a && a(e)
            }), this)
        }

        function a() {
            this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1)
        }

        function i(t, e) {
            t.emit("error", e)
        }
        module.exports = {
            destroy: e,
            undestroy: a
        };
    }, {
        "process-nextick-args": "uuRL"
    }],
    "Dix8": [function(require, module, exports) {
        var global = arguments[3];
        var r = arguments[3];

        function t(r, t) {
            if (e("noDeprecation")) return r;
            var n = !1;
            return function() {
                if (!n) {
                    if (e("throwDeprecation")) throw new Error(t);
                    e("traceDeprecation") ? console.trace(t) : console.warn(t), n = !0
                }
                return r.apply(this, arguments)
            }
        }

        function e(t) {
            try {
                if (!r.localStorage) return !1
            } catch (n) {
                return !1
            }
            var e = r.localStorage[t];
            return null != e && "true" === String(e).toLowerCase()
        }
        module.exports = t;
    }, {}],
    "sBwl": [function(require, module, exports) {
        var process = require("process");

        var global = arguments[3];
        var e = require("process"),
            t = arguments[3],
            n = require("process-nextick-args");

        function r(e, t, n) {
            this.chunk = e, this.encoding = t, this.callback = n, this.next = null
        }

        function i(e) {
            var t = this;
            this.next = null, this.entry = null, this.finish = function() {
                W(t, e)
            }
        }
        module.exports = g;
        var o, s = n.nextTick;
        g.WritableState = y;
        var f = Object.create(require("core-util-is"));
        f.inherits = require("inherits");
        var u = {
                deprecate: require("util-deprecate")
            },
            a = require("./internal/streams/stream"),
            c = require("safe-buffer").Buffer,
            l = t.Uint8Array || function() {};

        function d(e) {
            return c.from(e)
        }

        function h(e) {
            return c.isBuffer(e) || e instanceof l
        }
        var b, p = require("./internal/streams/destroy");

        function w() {}

        function y(e, t) {
            o = o || require("./_stream_duplex"), e = e || {};
            var n = t instanceof o;
            this.objectMode = !!e.objectMode, n && (this.objectMode = this.objectMode || !!e.writableObjectMode);
            var r = e.highWaterMark,
                s = e.writableHighWaterMark,
                f = this.objectMode ? 16 : 16384;
            this.highWaterMark = r || 0 === r ? r : n && (s || 0 === s) ? s : f, this.highWaterMark = Math.floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
            var u = !1 === e.decodeStrings;
            this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(e) {
                S(t, e)
            }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new i(this)
        }

        function g(e) {
            if (o = o || require("./_stream_duplex"), !(b.call(g, this) || this instanceof o)) return new g(e);
            this._writableState = new y(e, this), this.writable = !0, e && ("function" == typeof e.write && (this._write = e.write), "function" == typeof e.writev && (this._writev = e.writev), "function" == typeof e.destroy && (this._destroy = e.destroy), "function" == typeof e.final && (this._final = e.final)), a.call(this)
        }

        function k(e, t) {
            var r = new Error("write after end");
            e.emit("error", r), n.nextTick(t, r)
        }

        function v(e, t, r, i) {
            var o = !0,
                s = !1;
            return null === r ? s = new TypeError("May not write null values to stream") : "string" == typeof r || void 0 === r || t.objectMode || (s = new TypeError("Invalid non-string/buffer chunk")), s && (e.emit("error", s), n.nextTick(i, s), o = !1), o
        }

        function q(e, t, n) {
            return e.objectMode || !1 === e.decodeStrings || "string" != typeof t || (t = c.from(t, n)), t
        }

        function _(e, t, n, r, i, o) {
            if (!n) {
                var s = q(t, r, i);
                r !== s && (n = !0, i = "buffer", r = s)
            }
            var f = t.objectMode ? 1 : r.length;
            t.length += f;
            var u = t.length < t.highWaterMark;
            if (u || (t.needDrain = !0), t.writing || t.corked) {
                var a = t.lastBufferedRequest;
                t.lastBufferedRequest = {
                    chunk: r,
                    encoding: i,
                    isBuf: n,
                    callback: o,
                    next: null
                }, a ? a.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1
            } else m(e, t, !1, f, r, i, o);
            return u
        }

        function m(e, t, n, r, i, o, s) {
            t.writelen = r, t.writecb = s, t.writing = !0, t.sync = !0, n ? e._writev(i, t.onwrite) : e._write(i, o, t.onwrite), t.sync = !1
        }

        function R(e, t, r, i, o) {
            --t.pendingcb, r ? (n.nextTick(o, i), n.nextTick(T, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (o(i), e._writableState.errorEmitted = !0, e.emit("error", i), T(e, t))
        }

        function x(e) {
            e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0
        }

        function S(e, t) {
            var n = e._writableState,
                r = n.sync,
                i = n.writecb;
            if (x(n), t) R(e, n, r, t, i);
            else {
                var o = E(n);
                o || n.corked || n.bufferProcessing || !n.bufferedRequest || B(e, n), r ? s(M, e, n, o, i) : M(e, n, o, i)
            }
        }

        function M(e, t, n, r) {
            n || j(e, t), t.pendingcb--, r(), T(e, t)
        }

        function j(e, t) {
            0 === t.length && t.needDrain && (t.needDrain = !1, e.emit("drain"))
        }

        function B(e, t) {
            t.bufferProcessing = !0;
            var n = t.bufferedRequest;
            if (e._writev && n && n.next) {
                var r = t.bufferedRequestCount,
                    o = new Array(r),
                    s = t.corkedRequestsFree;
                s.entry = n;
                for (var f = 0, u = !0; n;) o[f] = n, n.isBuf || (u = !1), n = n.next, f += 1;
                o.allBuffers = u, m(e, t, !0, t.length, o, "", s.finish), t.pendingcb++, t.lastBufferedRequest = null, s.next ? (t.corkedRequestsFree = s.next, s.next = null) : t.corkedRequestsFree = new i(t), t.bufferedRequestCount = 0
            } else {
                for (; n;) {
                    var a = n.chunk,
                        c = n.encoding,
                        l = n.callback;
                    if (m(e, t, !1, t.objectMode ? 1 : a.length, a, c, l), n = n.next, t.bufferedRequestCount--, t.writing) break
                }
                null === n && (t.lastBufferedRequest = null)
            }
            t.bufferedRequest = n, t.bufferProcessing = !1
        }

        function E(e) {
            return e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
        }

        function C(e, t) {
            e._final(function(n) {
                t.pendingcb--, n && e.emit("error", n), t.prefinished = !0, e.emit("prefinish"), T(e, t)
            })
        }

        function P(e, t) {
            t.prefinished || t.finalCalled || ("function" == typeof e._final ? (t.pendingcb++, t.finalCalled = !0, n.nextTick(C, e, t)) : (t.prefinished = !0, e.emit("prefinish")))
        }

        function T(e, t) {
            var n = E(t);
            return n && (P(e, t), 0 === t.pendingcb && (t.finished = !0, e.emit("finish"))), n
        }

        function F(e, t, r) {
            t.ending = !0, T(e, t), r && (t.finished ? n.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1
        }

        function W(e, t, n) {
            var r = e.entry;
            for (e.entry = null; r;) {
                var i = r.callback;
                t.pendingcb--, i(n), r = r.next
            }
            t.corkedRequestsFree ? t.corkedRequestsFree.next = e : t.corkedRequestsFree = e
        }
        f.inherits(g, a), y.prototype.getBuffer = function() {
                for (var e = this.bufferedRequest, t = []; e;) t.push(e), e = e.next;
                return t
            },
            function() {
                try {
                    Object.defineProperty(y.prototype, "buffer", {
                        get: u.deprecate(function() {
                            return this.getBuffer()
                        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
                    })
                } catch (e) {}
            }(), "function" == typeof Symbol && Symbol.hasInstance && "function" == typeof Function.prototype[Symbol.hasInstance] ? (b = Function.prototype[Symbol.hasInstance], Object.defineProperty(g, Symbol.hasInstance, {
                value: function(e) {
                    return !!b.call(this, e) || this === g && (e && e._writableState instanceof y)
                }
            })) : b = function(e) {
                return e instanceof this
            }, g.prototype.pipe = function() {
                this.emit("error", new Error("Cannot pipe, not readable"))
            }, g.prototype.write = function(e, t, n) {
                var r = this._writableState,
                    i = !1,
                    o = !r.objectMode && h(e);
                return o && !c.isBuffer(e) && (e = d(e)), "function" == typeof t && (n = t, t = null), o ? t = "buffer" : t || (t = r.defaultEncoding), "function" != typeof n && (n = w), r.ended ? k(this, n) : (o || v(this, r, e, n)) && (r.pendingcb++, i = _(this, r, o, e, t, n)), i
            }, g.prototype.cork = function() {
                this._writableState.corked++
            }, g.prototype.uncork = function() {
                var e = this._writableState;
                e.corked && (e.corked--, e.writing || e.corked || e.finished || e.bufferProcessing || !e.bufferedRequest || B(this, e))
            }, g.prototype.setDefaultEncoding = function(e) {
                if ("string" == typeof e && (e = e.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + e);
                return this._writableState.defaultEncoding = e, this
            }, Object.defineProperty(g.prototype, "writableHighWaterMark", {
                enumerable: !1,
                get: function() {
                    return this._writableState.highWaterMark
                }
            }), g.prototype._write = function(e, t, n) {
                n(new Error("_write() is not implemented"))
            }, g.prototype._writev = null, g.prototype.end = function(e, t, n) {
                var r = this._writableState;
                "function" == typeof e ? (n = e, e = null, t = null) : "function" == typeof t && (n = t, t = null), null != e && this.write(e, t), r.corked && (r.corked = 1, this.uncork()), r.ending || r.finished || F(this, r, n)
            }, Object.defineProperty(g.prototype, "destroyed", {
                get: function() {
                    return void 0 !== this._writableState && this._writableState.destroyed
                },
                set: function(e) {
                    this._writableState && (this._writableState.destroyed = e)
                }
            }), g.prototype.destroy = p.destroy, g.prototype._undestroy = p.undestroy, g.prototype._destroy = function(e, t) {
                this.end(), t(e)
            };
    }, {
        "process-nextick-args": "uuRL",
        "core-util-is": "dzde",
        "inherits": "CiT7",
        "util-deprecate": "Dix8",
        "./internal/streams/stream": "LQWv",
        "safe-buffer": "ziru",
        "./internal/streams/destroy": "huTf",
        "./_stream_duplex": "ps7p",
        "process": "qLuB"
    }],
    "ps7p": [function(require, module, exports) {
        "use strict";
        var e = require("process-nextick-args"),
            t = Object.keys || function(e) {
                var t = [];
                for (var r in e) t.push(r);
                return t
            };
        module.exports = l;
        var r = Object.create(require("core-util-is"));
        r.inherits = require("inherits");
        var i = require("./_stream_readable"),
            a = require("./_stream_writable");
        r.inherits(l, i);
        for (var o = t(a.prototype), s = 0; s < o.length; s++) {
            var n = o[s];
            l.prototype[n] || (l.prototype[n] = a.prototype[n])
        }

        function l(e) {
            if (!(this instanceof l)) return new l(e);
            i.call(this, e), a.call(this, e), e && !1 === e.readable && (this.readable = !1), e && !1 === e.writable && (this.writable = !1), this.allowHalfOpen = !0, e && !1 === e.allowHalfOpen && (this.allowHalfOpen = !1), this.once("end", h)
        }

        function h() {
            this.allowHalfOpen || this._writableState.ended || e.nextTick(d, this)
        }

        function d(e) {
            e.end()
        }
        Object.defineProperty(l.prototype, "writableHighWaterMark", {
            enumerable: !1,
            get: function() {
                return this._writableState.highWaterMark
            }
        }), Object.defineProperty(l.prototype, "destroyed", {
            get: function() {
                return void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed && this._writableState.destroyed)
            },
            set: function(e) {
                void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed = e, this._writableState.destroyed = e)
            }
        }), l.prototype._destroy = function(t, r) {
            this.push(null), this.end(), e.nextTick(r, t)
        };
    }, {
        "process-nextick-args": "uuRL",
        "core-util-is": "dzde",
        "inherits": "CiT7",
        "./_stream_readable": "tGXh",
        "./_stream_writable": "sBwl"
    }],
    "sYY1": [function(require, module, exports) {

        "use strict";
        var t = require("safe-buffer").Buffer,
            e = t.isEncoding || function(t) {
                switch ((t = "" + t) && t.toLowerCase()) {
                    case "hex":
                    case "utf8":
                    case "utf-8":
                    case "ascii":
                    case "binary":
                    case "base64":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                    case "raw":
                        return !0;
                    default:
                        return !1
                }
            };

        function s(t) {
            if (!t) return "utf8";
            for (var e;;) switch (t) {
                case "utf8":
                case "utf-8":
                    return "utf8";
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return "utf16le";
                case "latin1":
                case "binary":
                    return "latin1";
                case "base64":
                case "ascii":
                case "hex":
                    return t;
                default:
                    if (e) return;
                    t = ("" + t).toLowerCase(), e = !0
            }
        }

        function i(i) {
            var a = s(i);
            if ("string" != typeof a && (t.isEncoding === e || !e(i))) throw new Error("Unknown encoding: " + i);
            return a || i
        }

        function a(e) {
            var s;
            switch (this.encoding = i(e), this.encoding) {
                case "utf16le":
                    this.text = c, this.end = f, s = 4;
                    break;
                case "utf8":
                    this.fillLast = l, s = 4;
                    break;
                case "base64":
                    this.text = d, this.end = g, s = 3;
                    break;
                default:
                    return this.write = N, void(this.end = v)
            }
            this.lastNeed = 0, this.lastTotal = 0, this.lastChar = t.allocUnsafe(s)
        }

        function r(t) {
            return t <= 127 ? 0 : t >> 5 == 6 ? 2 : t >> 4 == 14 ? 3 : t >> 3 == 30 ? 4 : t >> 6 == 2 ? -1 : -2
        }

        function n(t, e, s) {
            var i = e.length - 1;
            if (i < s) return 0;
            var a = r(e[i]);
            return a >= 0 ? (a > 0 && (t.lastNeed = a - 1), a) : --i < s || -2 === a ? 0 : (a = r(e[i])) >= 0 ? (a > 0 && (t.lastNeed = a - 2), a) : --i < s || -2 === a ? 0 : (a = r(e[i])) >= 0 ? (a > 0 && (2 === a ? a = 0 : t.lastNeed = a - 3), a) : 0
        }

        function h(t, e, s) {
            if (128 != (192 & e[0])) return t.lastNeed = 0, "�";
            if (t.lastNeed > 1 && e.length > 1) {
                if (128 != (192 & e[1])) return t.lastNeed = 1, "�";
                if (t.lastNeed > 2 && e.length > 2 && 128 != (192 & e[2])) return t.lastNeed = 2, "�"
            }
        }

        function l(t) {
            var e = this.lastTotal - this.lastNeed,
                s = h(this, t, e);
            return void 0 !== s ? s : this.lastNeed <= t.length ? (t.copy(this.lastChar, e, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : (t.copy(this.lastChar, e, 0, t.length), void(this.lastNeed -= t.length))
        }

        function u(t, e) {
            var s = n(this, t, e);
            if (!this.lastNeed) return t.toString("utf8", e);
            this.lastTotal = s;
            var i = t.length - (s - this.lastNeed);
            return t.copy(this.lastChar, 0, i), t.toString("utf8", e, i)
        }

        function o(t) {
            var e = t && t.length ? this.write(t) : "";
            return this.lastNeed ? e + "�" : e
        }

        function c(t, e) {
            if ((t.length - e) % 2 == 0) {
                var s = t.toString("utf16le", e);
                if (s) {
                    var i = s.charCodeAt(s.length - 1);
                    if (i >= 55296 && i <= 56319) return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1], s.slice(0, -1)
                }
                return s
            }
            return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = t[t.length - 1], t.toString("utf16le", e, t.length - 1)
        }

        function f(t) {
            var e = t && t.length ? this.write(t) : "";
            if (this.lastNeed) {
                var s = this.lastTotal - this.lastNeed;
                return e + this.lastChar.toString("utf16le", 0, s)
            }
            return e
        }

        function d(t, e) {
            var s = (t.length - e) % 3;
            return 0 === s ? t.toString("base64", e) : (this.lastNeed = 3 - s, this.lastTotal = 3, 1 === s ? this.lastChar[0] = t[t.length - 1] : (this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1]), t.toString("base64", e, t.length - s))
        }

        function g(t) {
            var e = t && t.length ? this.write(t) : "";
            return this.lastNeed ? e + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : e
        }

        function N(t) {
            return t.toString(this.encoding)
        }

        function v(t) {
            return t && t.length ? this.write(t) : ""
        }
        exports.StringDecoder = a, a.prototype.write = function(t) {
            if (0 === t.length) return "";
            var e, s;
            if (this.lastNeed) {
                if (void 0 === (e = this.fillLast(t))) return "";
                s = this.lastNeed, this.lastNeed = 0
            } else s = 0;
            return s < t.length ? e ? e + this.text(t, s) : this.text(t, s) : e || ""
        }, a.prototype.end = o, a.prototype.text = u, a.prototype.fillLast = function(t) {
            if (this.lastNeed <= t.length) return t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
            t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t.length), this.lastNeed -= t.length
        };
    }, {
        "safe-buffer": "ziru"
    }],
    "tGXh": [function(require, module, exports) {

        var global = arguments[3];
        var process = require("process");
        var e = arguments[3],
            t = require("process"),
            n = require("process-nextick-args");
        module.exports = _;
        var r, i = require("isarray");
        _.ReadableState = w;
        var a = require("events").EventEmitter,
            d = function(e, t) {
                return e.listeners(t).length
            },
            o = require("./internal/streams/stream"),
            s = require("safe-buffer").Buffer,
            u = e.Uint8Array || function() {};

        function l(e) {
            return s.from(e)
        }

        function h(e) {
            return s.isBuffer(e) || e instanceof u
        }
        var p = Object.create(require("core-util-is"));
        p.inherits = require("inherits");
        var f = require("util"),
            c = void 0;
        c = f && f.debuglog ? f.debuglog("stream") : function() {};
        var g, b = require("./internal/streams/BufferList"),
            m = require("./internal/streams/destroy");
        p.inherits(_, o);
        var v = ["error", "close", "destroy", "pause", "resume"];

        function y(e, t, n) {
            if ("function" == typeof e.prependListener) return e.prependListener(t, n);
            e._events && e._events[t] ? i(e._events[t]) ? e._events[t].unshift(n) : e._events[t] = [n, e._events[t]] : e.on(t, n)
        }

        function w(e, t) {
            e = e || {};
            var n = t instanceof(r = r || require("./_stream_duplex"));
            this.objectMode = !!e.objectMode, n && (this.objectMode = this.objectMode || !!e.readableObjectMode);
            var i = e.highWaterMark,
                a = e.readableHighWaterMark,
                d = this.objectMode ? 16 : 16384;
            this.highWaterMark = i || 0 === i ? i : n && (a || 0 === a) ? a : d, this.highWaterMark = Math.floor(this.highWaterMark), this.buffer = new b, this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, e.encoding && (g || (g = require("string_decoder/").StringDecoder), this.decoder = new g(e.encoding), this.encoding = e.encoding)
        }

        function _(e) {
            if (r = r || require("./_stream_duplex"), !(this instanceof _)) return new _(e);
            this._readableState = new w(e, this), this.readable = !0, e && ("function" == typeof e.read && (this._read = e.read), "function" == typeof e.destroy && (this._destroy = e.destroy)), o.call(this)
        }

        function M(e, t, n, r, i) {
            var a, d = e._readableState;
            null === t ? (d.reading = !1, x(e, d)) : (i || (a = k(d, t)), a ? e.emit("error", a) : d.objectMode || t && t.length > 0 ? ("string" == typeof t || d.objectMode || Object.getPrototypeOf(t) === s.prototype || (t = l(t)), r ? d.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : S(e, d, t, !0) : d.ended ? e.emit("error", new Error("stream.push() after EOF")) : (d.reading = !1, d.decoder && !n ? (t = d.decoder.write(t), d.objectMode || 0 !== t.length ? S(e, d, t, !1) : C(e, d)) : S(e, d, t, !1))) : r || (d.reading = !1));
            return j(d)
        }

        function S(e, t, n, r) {
            t.flowing && 0 === t.length && !t.sync ? (e.emit("data", n), e.read(0)) : (t.length += t.objectMode ? 1 : n.length, r ? t.buffer.unshift(n) : t.buffer.push(n), t.needReadable && q(e)), C(e, t)
        }

        function k(e, t) {
            var n;
            return h(t) || "string" == typeof t || void 0 === t || e.objectMode || (n = new TypeError("Invalid non-string/buffer chunk")), n
        }

        function j(e) {
            return !e.ended && (e.needReadable || e.length < e.highWaterMark || 0 === e.length)
        }
        Object.defineProperty(_.prototype, "destroyed", {
            get: function() {
                return void 0 !== this._readableState && this._readableState.destroyed
            },
            set: function(e) {
                this._readableState && (this._readableState.destroyed = e)
            }
        }), _.prototype.destroy = m.destroy, _.prototype._undestroy = m.undestroy, _.prototype._destroy = function(e, t) {
            this.push(null), t(e)
        }, _.prototype.push = function(e, t) {
            var n, r = this._readableState;
            return r.objectMode ? n = !0 : "string" == typeof e && ((t = t || r.defaultEncoding) !== r.encoding && (e = s.from(e, t), t = ""), n = !0), M(this, e, t, !1, n)
        }, _.prototype.unshift = function(e) {
            return M(this, e, null, !0, !1)
        }, _.prototype.isPaused = function() {
            return !1 === this._readableState.flowing
        }, _.prototype.setEncoding = function(e) {
            return g || (g = require("string_decoder/").StringDecoder), this._readableState.decoder = new g(e), this._readableState.encoding = e, this
        };
        var R = 8388608;

        function E(e) {
            return e >= R ? e = R : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e
        }

        function L(e, t) {
            return e <= 0 || 0 === t.length && t.ended ? 0 : t.objectMode ? 1 : e != e ? t.flowing && t.length ? t.buffer.head.data.length : t.length : (e > t.highWaterMark && (t.highWaterMark = E(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0))
        }

        function x(e, t) {
            if (!t.ended) {
                if (t.decoder) {
                    var n = t.decoder.end();
                    n && n.length && (t.buffer.push(n), t.length += t.objectMode ? 1 : n.length)
                }
                t.ended = !0, q(e)
            }
        }

        function q(e) {
            var t = e._readableState;
            t.needReadable = !1, t.emittedReadable || (c("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? n.nextTick(W, e) : W(e))
        }

        function W(e) {
            c("emit readable"), e.emit("readable"), B(e)
        }

        function C(e, t) {
            t.readingMore || (t.readingMore = !0, n.nextTick(D, e, t))
        }

        function D(e, t) {
            for (var n = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (c("maybeReadMore read 0"), e.read(0), n !== t.length);) n = t.length;
            t.readingMore = !1
        }

        function O(e) {
            return function() {
                var t = e._readableState;
                c("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, 0 === t.awaitDrain && d(e, "data") && (t.flowing = !0, B(e))
            }
        }

        function T(e) {
            c("readable nexttick read 0"), e.read(0)
        }

        function U(e, t) {
            t.resumeScheduled || (t.resumeScheduled = !0, n.nextTick(P, e, t))
        }

        function P(e, t) {
            t.reading || (c("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), B(e), t.flowing && !t.reading && e.read(0)
        }

        function B(e) {
            var t = e._readableState;
            for (c("flow", t.flowing); t.flowing && null !== e.read(););
        }

        function H(e, t) {
            return 0 === t.length ? null : (t.objectMode ? n = t.buffer.shift() : !e || e >= t.length ? (n = t.decoder ? t.buffer.join("") : 1 === t.buffer.length ? t.buffer.head.data : t.buffer.concat(t.length), t.buffer.clear()) : n = I(e, t.buffer, t.decoder), n);
            var n
        }

        function I(e, t, n) {
            var r;
            return e < t.head.data.length ? (r = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : r = e === t.head.data.length ? t.shift() : n ? A(e, t) : F(e, t), r
        }

        function A(e, t) {
            var n = t.head,
                r = 1,
                i = n.data;
            for (e -= i.length; n = n.next;) {
                var a = n.data,
                    d = e > a.length ? a.length : e;
                if (d === a.length ? i += a : i += a.slice(0, e), 0 === (e -= d)) {
                    d === a.length ? (++r, n.next ? t.head = n.next : t.head = t.tail = null) : (t.head = n, n.data = a.slice(d));
                    break
                }++r
            }
            return t.length -= r, i
        }

        function F(e, t) {
            var n = s.allocUnsafe(e),
                r = t.head,
                i = 1;
            for (r.data.copy(n), e -= r.data.length; r = r.next;) {
                var a = r.data,
                    d = e > a.length ? a.length : e;
                if (a.copy(n, n.length - e, 0, d), 0 === (e -= d)) {
                    d === a.length ? (++i, r.next ? t.head = r.next : t.head = t.tail = null) : (t.head = r, r.data = a.slice(d));
                    break
                }++i
            }
            return t.length -= i, n
        }

        function z(e) {
            var t = e._readableState;
            if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
            t.endEmitted || (t.ended = !0, n.nextTick(G, t, e))
        }

        function G(e, t) {
            e.endEmitted || 0 !== e.length || (e.endEmitted = !0, t.readable = !1, t.emit("end"))
        }

        function J(e, t) {
            for (var n = 0, r = e.length; n < r; n++)
                if (e[n] === t) return n;
            return -1
        }
        _.prototype.read = function(e) {
            c("read", e), e = parseInt(e, 10);
            var t = this._readableState,
                n = e;
            if (0 !== e && (t.emittedReadable = !1), 0 === e && t.needReadable && (t.length >= t.highWaterMark || t.ended)) return c("read: emitReadable", t.length, t.ended), 0 === t.length && t.ended ? z(this) : q(this), null;
            if (0 === (e = L(e, t)) && t.ended) return 0 === t.length && z(this), null;
            var r, i = t.needReadable;
            return c("need readable", i), (0 === t.length || t.length - e < t.highWaterMark) && c("length less than watermark", i = !0), t.ended || t.reading ? c("reading or ended", i = !1) : i && (c("do read"), t.reading = !0, t.sync = !0, 0 === t.length && (t.needReadable = !0), this._read(t.highWaterMark), t.sync = !1, t.reading || (e = L(n, t))), null === (r = e > 0 ? H(e, t) : null) ? (t.needReadable = !0, e = 0) : t.length -= e, 0 === t.length && (t.ended || (t.needReadable = !0), n !== e && t.ended && z(this)), null !== r && this.emit("data", r), r
        }, _.prototype._read = function(e) {
            this.emit("error", new Error("_read() is not implemented"))
        }, _.prototype.pipe = function(e, r) {
            var i = this,
                a = this._readableState;
            switch (a.pipesCount) {
                case 0:
                    a.pipes = e;
                    break;
                case 1:
                    a.pipes = [a.pipes, e];
                    break;
                default:
                    a.pipes.push(e)
            }
            a.pipesCount += 1, c("pipe count=%d opts=%j", a.pipesCount, r);
            var o = (!r || !1 !== r.end) && e !== t.stdout && e !== t.stderr ? u : v;

            function s(t, n) {
                c("onunpipe"), t === i && n && !1 === n.hasUnpiped && (n.hasUnpiped = !0, c("cleanup"), e.removeListener("close", b), e.removeListener("finish", m), e.removeListener("drain", l), e.removeListener("error", g), e.removeListener("unpipe", s), i.removeListener("end", u), i.removeListener("end", v), i.removeListener("data", f), h = !0, !a.awaitDrain || e._writableState && !e._writableState.needDrain || l())
            }

            function u() {
                c("onend"), e.end()
            }
            a.endEmitted ? n.nextTick(o) : i.once("end", o), e.on("unpipe", s);
            var l = O(i);
            e.on("drain", l);
            var h = !1;
            var p = !1;

            function f(t) {
                c("ondata"), p = !1, !1 !== e.write(t) || p || ((1 === a.pipesCount && a.pipes === e || a.pipesCount > 1 && -1 !== J(a.pipes, e)) && !h && (c("false write response, pause", i._readableState.awaitDrain), i._readableState.awaitDrain++, p = !0), i.pause())
            }

            function g(t) {
                c("onerror", t), v(), e.removeListener("error", g), 0 === d(e, "error") && e.emit("error", t)
            }

            function b() {
                e.removeListener("finish", m), v()
            }

            function m() {
                c("onfinish"), e.removeListener("close", b), v()
            }

            function v() {
                c("unpipe"), i.unpipe(e)
            }
            return i.on("data", f), y(e, "error", g), e.once("close", b), e.once("finish", m), e.emit("pipe", i), a.flowing || (c("pipe resume"), i.resume()), e
        }, _.prototype.unpipe = function(e) {
            var t = this._readableState,
                n = {
                    hasUnpiped: !1
                };
            if (0 === t.pipesCount) return this;
            if (1 === t.pipesCount) return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this, n), this);
            if (!e) {
                var r = t.pipes,
                    i = t.pipesCount;
                t.pipes = null, t.pipesCount = 0, t.flowing = !1;
                for (var a = 0; a < i; a++) r[a].emit("unpipe", this, n);
                return this
            }
            var d = J(t.pipes, e);
            return -1 === d ? this : (t.pipes.splice(d, 1), t.pipesCount -= 1, 1 === t.pipesCount && (t.pipes = t.pipes[0]), e.emit("unpipe", this, n), this)
        }, _.prototype.on = function(e, t) {
            var r = o.prototype.on.call(this, e, t);
            if ("data" === e) !1 !== this._readableState.flowing && this.resume();
            else if ("readable" === e) {
                var i = this._readableState;
                i.endEmitted || i.readableListening || (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && q(this) : n.nextTick(T, this))
            }
            return r
        }, _.prototype.addListener = _.prototype.on, _.prototype.resume = function() {
            var e = this._readableState;
            return e.flowing || (c("resume"), e.flowing = !0, U(this, e)), this
        }, _.prototype.pause = function() {
            return c("call pause flowing=%j", this._readableState.flowing), !1 !== this._readableState.flowing && (c("pause"), this._readableState.flowing = !1, this.emit("pause")), this
        }, _.prototype.wrap = function(e) {
            var t = this,
                n = this._readableState,
                r = !1;
            for (var i in e.on("end", function() {
                    if (c("wrapped end"), n.decoder && !n.ended) {
                        var e = n.decoder.end();
                        e && e.length && t.push(e)
                    }
                    t.push(null)
                }), e.on("data", function(i) {
                    (c("wrapped data"), n.decoder && (i = n.decoder.write(i)), n.objectMode && null == i) || (n.objectMode || i && i.length) && (t.push(i) || (r = !0, e.pause()))
                }), e) void 0 === this[i] && "function" == typeof e[i] && (this[i] = function(t) {
                return function() {
                    return e[t].apply(e, arguments)
                }
            }(i));
            for (var a = 0; a < v.length; a++) e.on(v[a], this.emit.bind(this, v[a]));
            return this._read = function(t) {
                c("wrapped _read", t), r && (r = !1, e.resume())
            }, this
        }, Object.defineProperty(_.prototype, "readableHighWaterMark", {
            enumerable: !1,
            get: function() {
                return this._readableState.highWaterMark
            }
        }), _._fromList = H;
    }, {
        "process-nextick-args": "uuRL",
        "isarray": "hNJ8",
        "events": "WnWe",
        "./internal/streams/stream": "LQWv",
        "safe-buffer": "ziru",
        "core-util-is": "dzde",
        "inherits": "CiT7",
        "util": "jtu4",
        "./internal/streams/BufferList": "xIMZ",
        "./internal/streams/destroy": "huTf",
        "./_stream_duplex": "ps7p",
        "string_decoder/": "sYY1",
        "process": "qLuB"
    }],
    "dOUA": [function(require, module, exports) {
        "use strict";
        module.exports = n;
        var t = require("./_stream_duplex"),
            r = Object.create(require("core-util-is"));

        function e(t, r) {
            var e = this._transformState;
            e.transforming = !1;
            var n = e.writecb;
            if (!n) return this.emit("error", new Error("write callback called multiple times"));
            e.writechunk = null, e.writecb = null, null != r && this.push(r), n(t);
            var i = this._readableState;
            i.reading = !1, (i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
        }

        function n(r) {
            if (!(this instanceof n)) return new n(r);
            t.call(this, r), this._transformState = {
                afterTransform: e.bind(this),
                needTransform: !1,
                transforming: !1,
                writecb: null,
                writechunk: null,
                writeencoding: null
            }, this._readableState.needReadable = !0, this._readableState.sync = !1, r && ("function" == typeof r.transform && (this._transform = r.transform), "function" == typeof r.flush && (this._flush = r.flush)), this.on("prefinish", i)
        }

        function i() {
            var t = this;
            "function" == typeof this._flush ? this._flush(function(r, e) {
                a(t, r, e)
            }) : a(this, null, null)
        }

        function a(t, r, e) {
            if (r) return t.emit("error", r);
            if (null != e && t.push(e), t._writableState.length) throw new Error("Calling transform done when ws.length != 0");
            if (t._transformState.transforming) throw new Error("Calling transform done when still transforming");
            return t.push(null)
        }
        r.inherits = require("inherits"), r.inherits(n, t), n.prototype.push = function(r, e) {
            return this._transformState.needTransform = !1, t.prototype.push.call(this, r, e)
        }, n.prototype._transform = function(t, r, e) {
            throw new Error("_transform() is not implemented")
        }, n.prototype._write = function(t, r, e) {
            var n = this._transformState;
            if (n.writecb = e, n.writechunk = t, n.writeencoding = r, !n.transforming) {
                var i = this._readableState;
                (n.needTransform || i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
            }
        }, n.prototype._read = function(t) {
            var r = this._transformState;
            null !== r.writechunk && r.writecb && !r.transforming ? (r.transforming = !0, this._transform(r.writechunk, r.writeencoding, r.afterTransform)) : r.needTransform = !0
        }, n.prototype._destroy = function(r, e) {
            var n = this;
            t.prototype._destroy.call(this, r, function(t) {
                e(t), n.emit("close")
            })
        };
    }, {
        "./_stream_duplex": "ps7p",
        "core-util-is": "dzde",
        "inherits": "CiT7"
    }],
    "kpyT": [function(require, module, exports) {
        "use strict";
        module.exports = t;
        var r = require("./_stream_transform"),
            e = Object.create(require("core-util-is"));

        function t(e) {
            if (!(this instanceof t)) return new t(e);
            r.call(this, e)
        }
        e.inherits = require("inherits"), e.inherits(t, r), t.prototype._transform = function(r, e, t) {
            t(null, r)
        };
    }, {
        "./_stream_transform": "dOUA",
        "core-util-is": "dzde",
        "inherits": "CiT7"
    }],
    "A6pU": [function(require, module, exports) {
        exports = module.exports = require("./lib/_stream_readable.js"), exports.Stream = exports, exports.Readable = exports, exports.Writable = require("./lib/_stream_writable.js"), exports.Duplex = require("./lib/_stream_duplex.js"), exports.Transform = require("./lib/_stream_transform.js"), exports.PassThrough = require("./lib/_stream_passthrough.js");
    }, {
        "./lib/_stream_readable.js": "tGXh",
        "./lib/_stream_writable.js": "sBwl",
        "./lib/_stream_duplex.js": "ps7p",
        "./lib/_stream_transform.js": "dOUA",
        "./lib/_stream_passthrough.js": "kpyT"
    }],
    "UKTQ": [function(require, module, exports) {
        var process = require("process");
        var Buffer = require("buffer").Buffer;
        var global = arguments[3];
        var e = require("process"),
            r = require("buffer").Buffer,
            t = arguments[3],
            s = require("./capability"),
            a = require("inherits"),
            o = require("readable-stream"),
            n = exports.readyStates = {
                UNSENT: 0,
                OPENED: 1,
                HEADERS_RECEIVED: 2,
                LOADING: 3,
                DONE: 4
            },
            u = exports.IncomingMessage = function(a, n, u, i) {
                var c = this;
                if (o.Readable.call(c), c._mode = u, c.headers = {}, c.rawHeaders = [], c.trailers = {}, c.rawTrailers = [], c.on("end", function() {
                        e.nextTick(function() {
                            c.emit("close")
                        })
                    }), "fetch" === u) {
                    if (c._fetchResponse = n, c.url = n.url, c.statusCode = n.status, c.statusMessage = n.statusText, n.headers.forEach(function(e, r) {
                            c.headers[r.toLowerCase()] = e, c.rawHeaders.push(r, e)
                        }), s.writableStream) {
                        var d = new WritableStream({
                            write: function(e) {
                                return new Promise(function(t, s) {
                                    c._destroyed ? s() : c.push(new r(e)) ? t() : c._resumeFetch = t
                                })
                            },
                            close: function() {
                                t.clearTimeout(i), c._destroyed || c.push(null)
                            },
                            abort: function(e) {
                                c._destroyed || c.emit("error", e)
                            }
                        });
                        try {
                            return void n.body.pipeTo(d).catch(function(e) {
                                t.clearTimeout(i), c._destroyed || c.emit("error", e)
                            })
                        } catch (p) {}
                    }
                    var h = n.body.getReader();
                    ! function e() {
                        h.read().then(function(s) {
                            if (!c._destroyed) {
                                if (s.done) return t.clearTimeout(i), void c.push(null);
                                c.push(new r(s.value)), e()
                            }
                        }).catch(function(e) {
                            t.clearTimeout(i), c._destroyed || c.emit("error", e)
                        })
                    }()
                } else {
                    if (c._xhr = a, c._pos = 0, c.url = a.responseURL, c.statusCode = a.status, c.statusMessage = a.statusText, a.getAllResponseHeaders().split(/\r?\n/).forEach(function(e) {
                            var r = e.match(/^([^:]+):\s*(.*)/);
                            if (r) {
                                var t = r[1].toLowerCase();
                                "set-cookie" === t ? (void 0 === c.headers[t] && (c.headers[t] = []), c.headers[t].push(r[2])) : void 0 !== c.headers[t] ? c.headers[t] += ", " + r[2] : c.headers[t] = r[2], c.rawHeaders.push(r[1], r[2])
                            }
                        }), c._charset = "x-user-defined", !s.overrideMimeType) {
                        var f = c.rawHeaders["mime-type"];
                        if (f) {
                            var l = f.match(/;\s*charset=([^;])(;|$)/);
                            l && (c._charset = l[1].toLowerCase())
                        }
                        c._charset || (c._charset = "utf-8")
                    }
                }
            };
        a(u, o.Readable), u.prototype._read = function() {
            var e = this._resumeFetch;
            e && (this._resumeFetch = null, e())
        }, u.prototype._onXHRProgress = function() {
            var e = this,
                s = e._xhr,
                a = null;
            switch (e._mode) {
                case "text:vbarray":
                    if (s.readyState !== n.DONE) break;
                    try {
                        a = new t.VBArray(s.responseBody).toArray()
                    } catch (d) {}
                    if (null !== a) {
                        e.push(new r(a));
                        break
                    }
                    case "text":
                        try {
                            a = s.responseText
                        } catch (d) {
                            e._mode = "text:vbarray";
                            break
                        }
                        if (a.length > e._pos) {
                            var o = a.substr(e._pos);
                            if ("x-user-defined" === e._charset) {
                                for (var u = new r(o.length), i = 0; i < o.length; i++) u[i] = 255 & o.charCodeAt(i);
                                e.push(u)
                            } else e.push(o, e._charset);
                            e._pos = a.length
                        }
                        break;
                    case "arraybuffer":
                        if (s.readyState !== n.DONE || !s.response) break;
                        a = s.response, e.push(new r(new Uint8Array(a)));
                        break;
                    case "moz-chunked-arraybuffer":
                        if (a = s.response, s.readyState !== n.LOADING || !a) break;
                        e.push(new r(new Uint8Array(a)));
                        break;
                    case "ms-stream":
                        if (a = s.response, s.readyState !== n.LOADING) break;
                        var c = new t.MSStreamReader;
                        c.onprogress = function() {
                            c.result.byteLength > e._pos && (e.push(new r(new Uint8Array(c.result.slice(e._pos)))), e._pos = c.result.byteLength)
                        }, c.onload = function() {
                            e.push(null)
                        }, c.readAsArrayBuffer(a)
            }
            e._xhr.readyState === n.DONE && "ms-stream" !== e._mode && e.push(null)
        };
    }, {
        "./capability": "M4MV",
        "inherits": "CiT7",
        "readable-stream": "A6pU",
        "process": "qLuB",
        "buffer": "ARb5"
    }],
    "F2q9": [function(require, module, exports) {

        var e = require("buffer").Buffer;
        module.exports = function(f) {
            if (f instanceof Uint8Array) {
                if (0 === f.byteOffset && f.byteLength === f.buffer.byteLength) return f.buffer;
                if ("function" == typeof f.buffer.slice) return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength)
            }
            if (e.isBuffer(f)) {
                for (var r = new Uint8Array(f.length), t = f.length, n = 0; n < t; n++) r[n] = f[n];
                return r.buffer
            }
            throw new Error("Argument must be a Buffer")
        };
    }, {
        "buffer": "ARb5"
    }],
    "qC17": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var global = arguments[3];
        var process = require("process");
        var e = require("buffer").Buffer,
            t = arguments[3],
            r = require("process"),
            o = require("./capability"),
            n = require("inherits"),
            i = require("./response"),
            s = require("readable-stream"),
            a = require("to-arraybuffer"),
            c = i.IncomingMessage,
            u = i.readyStates;

        function d(e, t) {
            return o.fetch && t ? "fetch" : o.mozchunkedarraybuffer ? "moz-chunked-arraybuffer" : o.msstream ? "ms-stream" : o.arraybuffer && e ? "arraybuffer" : o.vbArray && e ? "text:vbarray" : "text"
        }
        var f = module.exports = function(t) {
            var r, n = this;
            s.Writable.call(n), n._opts = t, n._body = [], n._headers = {}, t.auth && n.setHeader("Authorization", "Basic " + new e(t.auth).toString("base64")), Object.keys(t.headers).forEach(function(e) {
                n.setHeader(e, t.headers[e])
            });
            var i = !0;
            if ("disable-fetch" === t.mode || "requestTimeout" in t && !o.abortController) i = !1, r = !0;
            else if ("prefer-streaming" === t.mode) r = !1;
            else if ("allow-wrong-content-type" === t.mode) r = !o.overrideMimeType;
            else {
                if (t.mode && "default" !== t.mode && "prefer-fast" !== t.mode) throw new Error("Invalid value for opts.mode");
                r = !0
            }
            n._mode = d(r, i), n._fetchTimer = null, n.on("finish", function() {
                n._onFinish()
            })
        };

        function h(e) {
            try {
                var t = e.status;
                return null !== t && 0 !== t
            } catch (r) {
                return !1
            }
        }
        n(f, s.Writable), f.prototype.setHeader = function(e, t) {
            var r = e.toLowerCase(); - 1 === p.indexOf(r) && (this._headers[r] = {
                name: e,
                value: t
            })
        }, f.prototype.getHeader = function(e) {
            var t = this._headers[e.toLowerCase()];
            return t ? t.value : null
        }, f.prototype.removeHeader = function(e) {
            delete this._headers[e.toLowerCase()]
        }, f.prototype._onFinish = function() {
            var n = this;
            if (!n._destroyed) {
                var i = n._opts,
                    s = n._headers,
                    c = null;
                "GET" !== i.method && "HEAD" !== i.method && (c = o.arraybuffer ? a(e.concat(n._body)) : o.blobConstructor ? new t.Blob(n._body.map(function(e) {
                    return a(e)
                }), {
                    type: (s["content-type"] || {}).value || ""
                }) : e.concat(n._body).toString());
                var d = [];
                if (Object.keys(s).forEach(function(e) {
                        var t = s[e].name,
                            r = s[e].value;
                        Array.isArray(r) ? r.forEach(function(e) {
                            d.push([t, e])
                        }) : d.push([t, r])
                    }), "fetch" === n._mode) {
                    var f = null;
                    if (o.abortController) {
                        var h = new AbortController;
                        f = h.signal, n._fetchAbortController = h, "requestTimeout" in i && 0 !== i.requestTimeout && (n._fetchTimer = t.setTimeout(function() {
                            n.emit("requestTimeout"), n._fetchAbortController && n._fetchAbortController.abort()
                        }, i.requestTimeout))
                    }
                    t.fetch(n._opts.url, {
                        method: n._opts.method,
                        headers: d,
                        body: c || void 0,
                        mode: "cors",
                        credentials: i.withCredentials ? "include" : "same-origin",
                        signal: f
                    }).then(function(e) {
                        n._fetchResponse = e, n._connect()
                    }, function(e) {
                        t.clearTimeout(n._fetchTimer), n._destroyed || n.emit("error", e)
                    })
                } else {
                    var p = n._xhr = new t.XMLHttpRequest;
                    try {
                        p.open(n._opts.method, n._opts.url, !0)
                    } catch (l) {
                        return void r.nextTick(function() {
                            n.emit("error", l)
                        })
                    }
                    "responseType" in p && (p.responseType = n._mode.split(":")[0]), "withCredentials" in p && (p.withCredentials = !!i.withCredentials), "text" === n._mode && "overrideMimeType" in p && p.overrideMimeType("text/plain; charset=x-user-defined"), "requestTimeout" in i && (p.timeout = i.requestTimeout, p.ontimeout = function() {
                        n.emit("requestTimeout")
                    }), d.forEach(function(e) {
                        p.setRequestHeader(e[0], e[1])
                    }), n._response = null, p.onreadystatechange = function() {
                        switch (p.readyState) {
                            case u.LOADING:
                            case u.DONE:
                                n._onXHRProgress()
                        }
                    }, "moz-chunked-arraybuffer" === n._mode && (p.onprogress = function() {
                        n._onXHRProgress()
                    }), p.onerror = function() {
                        n._destroyed || n.emit("error", new Error("XHR error"))
                    };
                    try {
                        p.send(c)
                    } catch (l) {
                        return void r.nextTick(function() {
                            n.emit("error", l)
                        })
                    }
                }
            }
        }, f.prototype._onXHRProgress = function() {
            h(this._xhr) && !this._destroyed && (this._response || this._connect(), this._response._onXHRProgress())
        }, f.prototype._connect = function() {
            var e = this;
            e._destroyed || (e._response = new c(e._xhr, e._fetchResponse, e._mode, e._fetchTimer), e._response.on("error", function(t) {
                e.emit("error", t)
            }), e.emit("response", e._response))
        }, f.prototype._write = function(e, t, r) {
            this._body.push(e), r()
        }, f.prototype.abort = f.prototype.destroy = function() {
            this._destroyed = !0, t.clearTimeout(this._fetchTimer), this._response && (this._response._destroyed = !0), this._xhr ? this._xhr.abort() : this._fetchAbortController && this._fetchAbortController.abort()
        }, f.prototype.end = function(e, t, r) {
            "function" == typeof e && (r = e, e = void 0), s.Writable.prototype.end.call(this, e, t, r)
        }, f.prototype.flushHeaders = function() {}, f.prototype.setTimeout = function() {}, f.prototype.setNoDelay = function() {}, f.prototype.setSocketKeepAlive = function() {};
        var p = ["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "connection", "content-length", "cookie", "cookie2", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "te", "trailer", "transfer-encoding", "upgrade", "via"];
    }, {
        "./capability": "M4MV",
        "inherits": "CiT7",
        "./response": "UKTQ",
        "readable-stream": "A6pU",
        "to-arraybuffer": "F2q9",
        "buffer": "ARb5",
        "process": "qLuB"
    }],
    "ddQX": [function(require, module, exports) {
        module.exports = o;
        var r = Object.prototype.hasOwnProperty;

        function o() {
            for (var o = {}, t = 0; t < arguments.length; t++) {
                var e = arguments[t];
                for (var a in e) r.call(e, a) && (o[a] = e[a])
            }
            return o
        }
    }, {}],
    "SrMQ": [function(require, module, exports) {
        module.exports = {
            100: "Continue",
            101: "Switching Protocols",
            102: "Processing",
            200: "OK",
            201: "Created",
            202: "Accepted",
            203: "Non-Authoritative Information",
            204: "No Content",
            205: "Reset Content",
            206: "Partial Content",
            207: "Multi-Status",
            208: "Already Reported",
            226: "IM Used",
            300: "Multiple Choices",
            301: "Moved Permanently",
            302: "Found",
            303: "See Other",
            304: "Not Modified",
            305: "Use Proxy",
            307: "Temporary Redirect",
            308: "Permanent Redirect",
            400: "Bad Request",
            401: "Unauthorized",
            402: "Payment Required",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            406: "Not Acceptable",
            407: "Proxy Authentication Required",
            408: "Request Timeout",
            409: "Conflict",
            410: "Gone",
            411: "Length Required",
            412: "Precondition Failed",
            413: "Payload Too Large",
            414: "URI Too Long",
            415: "Unsupported Media Type",
            416: "Range Not Satisfiable",
            417: "Expectation Failed",
            418: "I'm a teapot",
            421: "Misdirected Request",
            422: "Unprocessable Entity",
            423: "Locked",
            424: "Failed Dependency",
            425: "Unordered Collection",
            426: "Upgrade Required",
            428: "Precondition Required",
            429: "Too Many Requests",
            431: "Request Header Fields Too Large",
            451: "Unavailable For Legal Reasons",
            500: "Internal Server Error",
            501: "Not Implemented",
            502: "Bad Gateway",
            503: "Service Unavailable",
            504: "Gateway Timeout",
            505: "HTTP Version Not Supported",
            506: "Variant Also Negotiates",
            507: "Insufficient Storage",
            508: "Loop Detected",
            509: "Bandwidth Limit Exceeded",
            510: "Not Extended",
            511: "Network Authentication Required"
        };
    }, {}],
    "vrOd": [function(require, module, exports) {
        var global = arguments[3];
        var define;
        var o, e = arguments[3];
        ! function(n) {
            var r = "object" == typeof exports && exports && !exports.nodeType && exports,
                t = "object" == typeof module && module && !module.nodeType && module,
                u = "object" == typeof e && e;
            u.global !== u && u.window !== u && u.self !== u || (n = u);
            var i, f, c = 2147483647,
                l = 36,
                s = 1,
                p = 26,
                a = 38,
                d = 700,
                h = 72,
                v = 128,
                g = "-",
                w = /^xn--/,
                x = /[^\x20-\x7E]/,
                y = /[\x2E\u3002\uFF0E\uFF61]/g,
                m = {
                    overflow: "Overflow: input needs wider integers to process",
                    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                    "invalid-input": "Invalid input"
                },
                C = l - s,
                b = Math.floor,
                j = String.fromCharCode;

            function A(o) {
                throw new RangeError(m[o])
            }

            function I(o, e) {
                for (var n = o.length, r = []; n--;) r[n] = e(o[n]);
                return r
            }

            function E(o, e) {
                var n = o.split("@"),
                    r = "";
                return n.length > 1 && (r = n[0] + "@", o = n[1]), r + I((o = o.replace(y, ".")).split("."), e).join(".")
            }

            function F(o) {
                for (var e, n, r = [], t = 0, u = o.length; t < u;)(e = o.charCodeAt(t++)) >= 55296 && e <= 56319 && t < u ? 56320 == (64512 & (n = o.charCodeAt(t++))) ? r.push(((1023 & e) << 10) + (1023 & n) + 65536) : (r.push(e), t--) : r.push(e);
                return r
            }

            function O(o) {
                return I(o, function(o) {
                    var e = "";
                    return o > 65535 && (e += j((o -= 65536) >>> 10 & 1023 | 55296), o = 56320 | 1023 & o), e += j(o)
                }).join("")
            }

            function S(o, e) {
                return o + 22 + 75 * (o < 26) - ((0 != e) << 5)
            }

            function T(o, e, n) {
                var r = 0;
                for (o = n ? b(o / d) : o >> 1, o += b(o / e); o > C * p >> 1; r += l) o = b(o / C);
                return b(r + (C + 1) * o / (o + a))
            }

            function L(o) {
                var e, n, r, t, u, i, f, a, d, w, x, y = [],
                    m = o.length,
                    C = 0,
                    j = v,
                    I = h;
                for ((n = o.lastIndexOf(g)) < 0 && (n = 0), r = 0; r < n; ++r) o.charCodeAt(r) >= 128 && A("not-basic"), y.push(o.charCodeAt(r));
                for (t = n > 0 ? n + 1 : 0; t < m;) {
                    for (u = C, i = 1, f = l; t >= m && A("invalid-input"), ((a = (x = o.charCodeAt(t++)) - 48 < 10 ? x - 22 : x - 65 < 26 ? x - 65 : x - 97 < 26 ? x - 97 : l) >= l || a > b((c - C) / i)) && A("overflow"), C += a * i, !(a < (d = f <= I ? s : f >= I + p ? p : f - I)); f += l) i > b(c / (w = l - d)) && A("overflow"), i *= w;
                    I = T(C - u, e = y.length + 1, 0 == u), b(C / e) > c - j && A("overflow"), j += b(C / e), C %= e, y.splice(C++, 0, j)
                }
                return O(y)
            }

            function M(o) {
                var e, n, r, t, u, i, f, a, d, w, x, y, m, C, I, E = [];
                for (y = (o = F(o)).length, e = v, n = 0, u = h, i = 0; i < y; ++i)(x = o[i]) < 128 && E.push(j(x));
                for (r = t = E.length, t && E.push(g); r < y;) {
                    for (f = c, i = 0; i < y; ++i)(x = o[i]) >= e && x < f && (f = x);
                    for (f - e > b((c - n) / (m = r + 1)) && A("overflow"), n += (f - e) * m, e = f, i = 0; i < y; ++i)
                        if ((x = o[i]) < e && ++n > c && A("overflow"), x == e) {
                            for (a = n, d = l; !(a < (w = d <= u ? s : d >= u + p ? p : d - u)); d += l) I = a - w, C = l - w, E.push(j(S(w + I % C, 0))), a = b(I / C);
                            E.push(j(S(a, 0))), u = T(n, m, r == t), n = 0, ++r
                        }++ n, ++e
                }
                return E.join("")
            }
            if (i = {
                    version: "1.4.1",
                    ucs2: {
                        decode: F,
                        encode: O
                    },
                    decode: L,
                    encode: M,
                    toASCII: function(o) {
                        return E(o, function(o) {
                            return x.test(o) ? "xn--" + M(o) : o
                        })
                    },
                    toUnicode: function(o) {
                        return E(o, function(o) {
                            return w.test(o) ? L(o.slice(4).toLowerCase()) : o
                        })
                    }
                }, "function" == typeof o && "object" == typeof o.amd && o.amd) o("punycode", function() {
                return i
            });
            else if (r && t)
                if (module.exports == r) t.exports = i;
                else
                    for (f in i) i.hasOwnProperty(f) && (r[f] = i[f]);
            else n.punycode = i
        }(this);
    }, {}],
    "cM1Q": [function(require, module, exports) {
        "use strict";
        module.exports = {
            isString: function(n) {
                return "string" == typeof n
            },
            isObject: function(n) {
                return "object" == typeof n && null !== n
            },
            isNull: function(n) {
                return null === n
            },
            isNullOrUndefined: function(n) {
                return null == n
            }
        };
    }, {}],
    "Xrb9": [function(require, module, exports) {
        "use strict";

        function r(r, e) {
            return Object.prototype.hasOwnProperty.call(r, e)
        }
        module.exports = function(t, n, o, a) {
            n = n || "&", o = o || "=";
            var s = {};
            if ("string" != typeof t || 0 === t.length) return s;
            var p = /\+/g;
            t = t.split(n);
            var u = 1e3;
            a && "number" == typeof a.maxKeys && (u = a.maxKeys);
            var c = t.length;
            u > 0 && c > u && (c = u);
            for (var i = 0; i < c; ++i) {
                var y, l, f, v, b = t[i].replace(p, "%20"),
                    d = b.indexOf(o);
                d >= 0 ? (y = b.substr(0, d), l = b.substr(d + 1)) : (y = b, l = ""), f = decodeURIComponent(y), v = decodeURIComponent(l), r(s, f) ? e(s[f]) ? s[f].push(v) : s[f] = [s[f], v] : s[f] = v
            }
            return s
        };
        var e = Array.isArray || function(r) {
            return "[object Array]" === Object.prototype.toString.call(r)
        };
    }, {}],
    "nSK5": [function(require, module, exports) {
        "use strict";
        var n = function(n) {
            switch (typeof n) {
                case "string":
                    return n;
                case "boolean":
                    return n ? "true" : "false";
                case "number":
                    return isFinite(n) ? n : "";
                default:
                    return ""
            }
        };
        module.exports = function(o, u, c, a) {
            return u = u || "&", c = c || "=", null === o && (o = void 0), "object" == typeof o ? r(t(o), function(t) {
                var a = encodeURIComponent(n(t)) + c;
                return e(o[t]) ? r(o[t], function(e) {
                    return a + encodeURIComponent(n(e))
                }).join(u) : a + encodeURIComponent(n(o[t]))
            }).join(u) : a ? encodeURIComponent(n(a)) + c + encodeURIComponent(n(o)) : ""
        };
        var e = Array.isArray || function(n) {
            return "[object Array]" === Object.prototype.toString.call(n)
        };

        function r(n, e) {
            if (n.map) return n.map(e);
            for (var r = [], t = 0; t < n.length; t++) r.push(e(n[t], t));
            return r
        }
        var t = Object.keys || function(n) {
            var e = [];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && e.push(r);
            return e
        };
    }, {}],
    "bxhR": [function(require, module, exports) {
        "use strict";
        exports.decode = exports.parse = require("./decode"), exports.encode = exports.stringify = require("./encode");
    }, {
        "./decode": "Xrb9",
        "./encode": "nSK5"
    }],
    "YNaF": [function(require, module, exports) {
        "use strict";
        var t = require("punycode"),
            s = require("./util");

        function h() {
            this.protocol = null, this.slashes = null, this.auth = null, this.host = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.query = null, this.pathname = null, this.path = null, this.href = null
        }
        exports.parse = b, exports.resolve = O, exports.resolveObject = d, exports.format = q, exports.Url = h;
        var e = /^([a-z0-9.+-]+:)/i,
            a = /:[0-9]*$/,
            r = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
            o = ["<", ">", '"', "`", " ", "\r", "\n", "\t"],
            n = ["{", "}", "|", "\\", "^", "`"].concat(o),
            i = ["'"].concat(n),
            l = ["%", "/", "?", ";", "#"].concat(i),
            p = ["/", "?", "#"],
            c = 255,
            u = /^[+a-z0-9A-Z_-]{0,63}$/,
            f = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
            m = {
                javascript: !0,
                "javascript:": !0
            },
            v = {
                javascript: !0,
                "javascript:": !0
            },
            g = {
                http: !0,
                https: !0,
                ftp: !0,
                gopher: !0,
                file: !0,
                "http:": !0,
                "https:": !0,
                "ftp:": !0,
                "gopher:": !0,
                "file:": !0
            },
            y = require("querystring");

        function b(t, e, a) {
            if (t && s.isObject(t) && t instanceof h) return t;
            var r = new h;
            return r.parse(t, e, a), r
        }

        function q(t) {
            return s.isString(t) && (t = b(t)), t instanceof h ? t.format() : h.prototype.format.call(t)
        }

        function O(t, s) {
            return b(t, !1, !0).resolve(s)
        }

        function d(t, s) {
            return t ? b(t, !1, !0).resolveObject(s) : s
        }
        h.prototype.parse = function(h, a, o) {
            if (!s.isString(h)) throw new TypeError("Parameter 'url' must be a string, not " + typeof h);
            var n = h.indexOf("?"),
                b = -1 !== n && n < h.indexOf("#") ? "?" : "#",
                q = h.split(b);
            q[0] = q[0].replace(/\\/g, "/");
            var O = h = q.join(b);
            if (O = O.trim(), !o && 1 === h.split("#").length) {
                var d = r.exec(O);
                if (d) return this.path = O, this.href = O, this.pathname = d[1], d[2] ? (this.search = d[2], this.query = a ? y.parse(this.search.substr(1)) : this.search.substr(1)) : a && (this.search = "", this.query = {}), this
            }
            var j = e.exec(O);
            if (j) {
                var x = (j = j[0]).toLowerCase();
                this.protocol = x, O = O.substr(j.length)
            }
            if (o || j || O.match(/^\/\/[^@\/]+@[^@\/]+/)) {
                var A = "//" === O.substr(0, 2);
                !A || j && v[j] || (O = O.substr(2), this.slashes = !0)
            }
            if (!v[j] && (A || j && !g[j])) {
                for (var C, I, w = -1, U = 0; U < p.length; U++) {
                    -1 !== (k = O.indexOf(p[U])) && (-1 === w || k < w) && (w = k)
                } - 1 !== (I = -1 === w ? O.lastIndexOf("@") : O.lastIndexOf("@", w)) && (C = O.slice(0, I), O = O.slice(I + 1), this.auth = decodeURIComponent(C)), w = -1;
                for (U = 0; U < l.length; U++) {
                    var k; - 1 !== (k = O.indexOf(l[U])) && (-1 === w || k < w) && (w = k)
                } - 1 === w && (w = O.length), this.host = O.slice(0, w), O = O.slice(w), this.parseHost(), this.hostname = this.hostname || "";
                var N = "[" === this.hostname[0] && "]" === this.hostname[this.hostname.length - 1];
                if (!N)
                    for (var R = this.hostname.split(/\./), S = (U = 0, R.length); U < S; U++) {
                        var $ = R[U];
                        if ($ && !$.match(u)) {
                            for (var z = "", H = 0, L = $.length; H < L; H++) $.charCodeAt(H) > 127 ? z += "x" : z += $[H];
                            if (!z.match(u)) {
                                var Z = R.slice(0, U),
                                    _ = R.slice(U + 1),
                                    E = $.match(f);
                                E && (Z.push(E[1]), _.unshift(E[2])), _.length && (O = "/" + _.join(".") + O), this.hostname = Z.join(".");
                                break
                            }
                        }
                    }
                this.hostname.length > c ? this.hostname = "" : this.hostname = this.hostname.toLowerCase(), N || (this.hostname = t.toASCII(this.hostname));
                var P = this.port ? ":" + this.port : "",
                    T = this.hostname || "";
                this.host = T + P, this.href += this.host, N && (this.hostname = this.hostname.substr(1, this.hostname.length - 2), "/" !== O[0] && (O = "/" + O))
            }
            if (!m[x])
                for (U = 0, S = i.length; U < S; U++) {
                    var B = i[U];
                    if (-1 !== O.indexOf(B)) {
                        var D = encodeURIComponent(B);
                        D === B && (D = escape(B)), O = O.split(B).join(D)
                    }
                }
            var F = O.indexOf("#"); - 1 !== F && (this.hash = O.substr(F), O = O.slice(0, F));
            var G = O.indexOf("?");
            if (-1 !== G ? (this.search = O.substr(G), this.query = O.substr(G + 1), a && (this.query = y.parse(this.query)), O = O.slice(0, G)) : a && (this.search = "", this.query = {}), O && (this.pathname = O), g[x] && this.hostname && !this.pathname && (this.pathname = "/"), this.pathname || this.search) {
                P = this.pathname || "";
                var J = this.search || "";
                this.path = P + J
            }
            return this.href = this.format(), this
        }, h.prototype.format = function() {
            var t = this.auth || "";
            t && (t = (t = encodeURIComponent(t)).replace(/%3A/i, ":"), t += "@");
            var h = this.protocol || "",
                e = this.pathname || "",
                a = this.hash || "",
                r = !1,
                o = "";
            this.host ? r = t + this.host : this.hostname && (r = t + (-1 === this.hostname.indexOf(":") ? this.hostname : "[" + this.hostname + "]"), this.port && (r += ":" + this.port)), this.query && s.isObject(this.query) && Object.keys(this.query).length && (o = y.stringify(this.query));
            var n = this.search || o && "?" + o || "";
            return h && ":" !== h.substr(-1) && (h += ":"), this.slashes || (!h || g[h]) && !1 !== r ? (r = "//" + (r || ""), e && "/" !== e.charAt(0) && (e = "/" + e)) : r || (r = ""), a && "#" !== a.charAt(0) && (a = "#" + a), n && "?" !== n.charAt(0) && (n = "?" + n), h + r + (e = e.replace(/[?#]/g, function(t) {
                return encodeURIComponent(t)
            })) + (n = n.replace("#", "%23")) + a
        }, h.prototype.resolve = function(t) {
            return this.resolveObject(b(t, !1, !0)).format()
        }, h.prototype.resolveObject = function(t) {
            if (s.isString(t)) {
                var e = new h;
                e.parse(t, !1, !0), t = e
            }
            for (var a = new h, r = Object.keys(this), o = 0; o < r.length; o++) {
                var n = r[o];
                a[n] = this[n]
            }
            if (a.hash = t.hash, "" === t.href) return a.href = a.format(), a;
            if (t.slashes && !t.protocol) {
                for (var i = Object.keys(t), l = 0; l < i.length; l++) {
                    var p = i[l];
                    "protocol" !== p && (a[p] = t[p])
                }
                return g[a.protocol] && a.hostname && !a.pathname && (a.path = a.pathname = "/"), a.href = a.format(), a
            }
            if (t.protocol && t.protocol !== a.protocol) {
                if (!g[t.protocol]) {
                    for (var c = Object.keys(t), u = 0; u < c.length; u++) {
                        var f = c[u];
                        a[f] = t[f]
                    }
                    return a.href = a.format(), a
                }
                if (a.protocol = t.protocol, t.host || v[t.protocol]) a.pathname = t.pathname;
                else {
                    for (var m = (t.pathname || "").split("/"); m.length && !(t.host = m.shift()););
                    t.host || (t.host = ""), t.hostname || (t.hostname = ""), "" !== m[0] && m.unshift(""), m.length < 2 && m.unshift(""), a.pathname = m.join("/")
                }
                if (a.search = t.search, a.query = t.query, a.host = t.host || "", a.auth = t.auth, a.hostname = t.hostname || t.host, a.port = t.port, a.pathname || a.search) {
                    var y = a.pathname || "",
                        b = a.search || "";
                    a.path = y + b
                }
                return a.slashes = a.slashes || t.slashes, a.href = a.format(), a
            }
            var q = a.pathname && "/" === a.pathname.charAt(0),
                O = t.host || t.pathname && "/" === t.pathname.charAt(0),
                d = O || q || a.host && t.pathname,
                j = d,
                x = a.pathname && a.pathname.split("/") || [],
                A = (m = t.pathname && t.pathname.split("/") || [], a.protocol && !g[a.protocol]);
            if (A && (a.hostname = "", a.port = null, a.host && ("" === x[0] ? x[0] = a.host : x.unshift(a.host)), a.host = "", t.protocol && (t.hostname = null, t.port = null, t.host && ("" === m[0] ? m[0] = t.host : m.unshift(t.host)), t.host = null), d = d && ("" === m[0] || "" === x[0])), O) a.host = t.host || "" === t.host ? t.host : a.host, a.hostname = t.hostname || "" === t.hostname ? t.hostname : a.hostname, a.search = t.search, a.query = t.query, x = m;
            else if (m.length) x || (x = []), x.pop(), x = x.concat(m), a.search = t.search, a.query = t.query;
            else if (!s.isNullOrUndefined(t.search)) {
                if (A) a.hostname = a.host = x.shift(), (k = !!(a.host && a.host.indexOf("@") > 0) && a.host.split("@")) && (a.auth = k.shift(), a.host = a.hostname = k.shift());
                return a.search = t.search, a.query = t.query, s.isNull(a.pathname) && s.isNull(a.search) || (a.path = (a.pathname ? a.pathname : "") + (a.search ? a.search : "")), a.href = a.format(), a
            }
            if (!x.length) return a.pathname = null, a.search ? a.path = "/" + a.search : a.path = null, a.href = a.format(), a;
            for (var C = x.slice(-1)[0], I = (a.host || t.host || x.length > 1) && ("." === C || ".." === C) || "" === C, w = 0, U = x.length; U >= 0; U--) "." === (C = x[U]) ? x.splice(U, 1) : ".." === C ? (x.splice(U, 1), w++) : w && (x.splice(U, 1), w--);
            if (!d && !j)
                for (; w--; w) x.unshift("..");
            !d || "" === x[0] || x[0] && "/" === x[0].charAt(0) || x.unshift(""), I && "/" !== x.join("/").substr(-1) && x.push("");
            var k, N = "" === x[0] || x[0] && "/" === x[0].charAt(0);
            A && (a.hostname = a.host = N ? "" : x.length ? x.shift() : "", (k = !!(a.host && a.host.indexOf("@") > 0) && a.host.split("@")) && (a.auth = k.shift(), a.host = a.hostname = k.shift()));
            return (d = d || a.host && x.length) && !N && x.unshift(""), x.length ? a.pathname = x.join("/") : (a.pathname = null, a.path = null), s.isNull(a.pathname) && s.isNull(a.search) || (a.path = (a.pathname ? a.pathname : "") + (a.search ? a.search : "")), a.auth = t.auth || a.auth, a.slashes = a.slashes || t.slashes, a.href = a.format(), a
        }, h.prototype.parseHost = function() {
            var t = this.host,
                s = a.exec(t);
            s && (":" !== (s = s[0]) && (this.port = s.substr(1)), t = t.substr(0, t.length - s.length)), t && (this.hostname = t)
        };
    }, {
        "punycode": "vrOd",
        "./util": "cM1Q",
        "querystring": "bxhR"
    }],
    "x1kL": [function(require, module, exports) {
        var global = arguments[3];
        var e = arguments[3],
            t = require("./lib/request"),
            r = require("./lib/response"),
            n = require("xtend"),
            o = require("builtin-status-codes"),
            s = require("url"),
            u = exports;
        u.request = function(r, o) {
            r = "string" == typeof r ? s.parse(r) : n(r);
            var u = -1 === e.location.protocol.search(/^https?:$/) ? "http:" : "",
                E = r.protocol || u,
                a = r.hostname || r.host,
                C = r.port,
                i = r.path || "/";
            a && -1 !== a.indexOf(":") && (a = "[" + a + "]"), r.url = (a ? E + "//" + a : "") + (C ? ":" + C : "") + i, r.method = (r.method || "GET").toUpperCase(), r.headers = r.headers || {};
            var T = new t(r);
            return o && T.on("response", o), T
        }, u.get = function(e, t) {
            var r = u.request(e, t);
            return r.end(), r
        }, u.ClientRequest = t, u.IncomingMessage = r.IncomingMessage, u.Agent = function() {}, u.Agent.defaultMaxSockets = 4, u.globalAgent = new u.Agent, u.STATUS_CODES = o, u.METHODS = ["CHECKOUT", "CONNECT", "COPY", "DELETE", "GET", "HEAD", "LOCK", "M-SEARCH", "MERGE", "MKACTIVITY", "MKCOL", "MOVE", "NOTIFY", "OPTIONS", "PATCH", "POST", "PROPFIND", "PROPPATCH", "PURGE", "PUT", "REPORT", "SEARCH", "SUBSCRIBE", "TRACE", "UNLOCK", "UNSUBSCRIBE"];
    }, {
        "./lib/request": "qC17",
        "./lib/response": "UKTQ",
        "xtend": "ddQX",
        "builtin-status-codes": "SrMQ",
        "url": "YNaF"
    }],
    "nYXW": [function(require, module, exports) {
        var t = require("http"),
            r = require("url"),
            o = module.exports;
        for (var e in t) t.hasOwnProperty(e) && (o[e] = t[e]);

        function p(t) {
            if ("string" == typeof t && (t = r.parse(t)), t.protocol || (t.protocol = "https:"), "https:" !== t.protocol) throw new Error('Protocol "' + t.protocol + '" not supported. Expected "https:"');
            return t
        }
        o.request = function(r, o) {
            return r = p(r), t.request.call(this, r, o)
        }, o.get = function(r, o) {
            return r = p(r), t.get.call(this, r, o)
        };
    }, {
        "http": "x1kL",
        "url": "YNaF"
    }],
    "qvzX": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var t = require("buffer").Buffer;
        Object.defineProperty(exports, "__esModule", {
            value: !0
        });
        var e = require("http"),
            o = require("https"),
            n = require("url"),
            r = require("@improbable-eng/grpc-web");

        function s() {
            return function(t) {
                return new i(t)
            }
        }
        exports.NodeHttpTransport = s;
        var i = function() {
            function t(t) {
                this.options = t
            }
            return t.prototype.sendMessage = function(t) {
                this.options.methodDefinition.requestStream || this.options.methodDefinition.responseStream || this.request.setHeader("Content-Length", t.byteLength), this.request.write(a(t)), this.request.end()
            }, t.prototype.finishSend = function() {}, t.prototype.responseCallback = function(t) {
                var e = this;
                this.options.debug && console.log("NodeHttp.response", t.statusCode);
                var o = p(t.headers);
                this.options.onHeaders(new r.grpc.Metadata(o), t.statusCode), t.on("data", function(t) {
                    e.options.debug && console.log("NodeHttp.data", t), e.options.onChunk(u(t))
                }), t.on("end", function() {
                    e.options.debug && console.log("NodeHttp.end"), e.options.onEnd()
                })
            }, t.prototype.start = function(t) {
                var r = this,
                    s = {};
                t.forEach(function(t, e) {
                    s[t] = e.join(", ")
                });
                var i = n.parse(this.options.url),
                    p = {
                        host: i.hostname,
                        port: i.port ? parseInt(i.port) : void 0,
                        path: i.path,
                        headers: s,
                        method: "POST"
                    };
                "https:" === i.protocol ? this.request = o.request(p, this.responseCallback.bind(this)) : this.request = e.request(p, this.responseCallback.bind(this)), this.request.on("error", function(t) {
                    r.options.debug && console.log("NodeHttp.error", t), r.options.onEnd(t)
                })
            }, t.prototype.cancel = function() {
                this.options.debug && console.log("NodeHttp.abort"), this.request.abort()
            }, t
        }();

        function p(t) {
            var e = {};
            for (var o in t) {
                var n = t[o];
                t.hasOwnProperty(o) && void 0 !== n && (e[o] = n)
            }
            return e
        }

        function u(t) {
            for (var e = new Uint8Array(t.length), o = 0; o < t.length; o++) e[o] = t[o];
            return e
        }

        function a(e) {
            for (var o = t.alloc(e.byteLength), n = 0; n < o.length; n++) o[n] = e[n];
            return o
        }
    }, {
        "http": "x1kL",
        "https": "nYXW",
        "url": "YNaF",
        "@improbable-eng/grpc-web": "FY0d",
        "buffer": "ARb5"
    }],
    "HjM1": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var e = require("buffer").Buffer;
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.send = void 0;
        var t = require("@onflow/interaction"),
            r = require("@onflow/protobuf"),
            n = require("@onflow/response"),
            s = require("@improbable-eng/grpc-web"),
            o = require("@improbable-eng/grpc-web-node-http-transport"),
            a = function(e, t, r) {
                try {
                    return Promise.resolve(new Promise(function(n, o) {
                        s.grpc.unary(t, {
                            request: r,
                            host: e,
                            onEnd: function(e) {
                                var t = e.statusMessage;
                                e.status === s.grpc.Code.OK ? n(e.message) : o(new Error(t))
                            }
                        })
                    }))
                } catch (e) {
                    return Promise.reject(e)
                }
            };
        s.grpc.setDefaultTransport((0, o.NodeHttpTransport)());
        var c = function(t) {
                return e.from(t, "hex")
            },
            i = function(t) {
                return e.from(t.padStart(16, 0), "hex")
            },
            u = function(t) {
                return e.from(t).toString("hex")
            },
            g = function(t) {
                return e.from(t).toString("hex")
            },
            d = function(s, o) {
                void 0 === o && (o = {});
                try {
                    switch (!0) {
                        case (0, t.isTransaction)(s):
                            return Promise.resolve(function(t, s) {
                                void 0 === s && (s = {});
                                try {
                                    var o = new r.Transaction;
                                    o.setScript(e.from(t.message.cadence, "utf8")), o.setGasLimit(t.message.computeLimit), o.setReferenceBlockId(t.message.refBlock ? c(t.message.refBlock) : null), o.setPayer(i(t.accounts[t.payer].addr)), t.authorizations.forEach(function(e) {
                                        return o.addAuthorizers(i(t.accounts[e].addr))
                                    });
                                    var u = new r.Transaction.ProposalKey;
                                    u.setAddress(i(t.accounts[t.proposer].addr)), u.setKeyId(t.accounts[t.proposer].keyId), u.setSequenceNumber(t.accounts[t.proposer].sequenceNum), o.setProposalKey(u), t.authorizations.forEach(function(e) {
                                        if (null !== t.accounts[e].signature && !t.accounts[e].role.payer) {
                                            var n = new r.Transaction.Signature;
                                            n.setAddress(i(t.accounts[e].addr)), n.setKeyId(t.accounts[e].keyId), n.setSignature(c(t.accounts[e].signature)), o.addPayloadSignatures(n)
                                        }
                                    });
                                    var g = new r.Transaction.Signature;
                                    g.setAddress(i(t.accounts[t.payer].addr)), g.setKeyId(t.accounts[t.payer].keyId), g.setSignature(c(t.accounts[t.payer].signature)), o.addEnvelopeSignatures(g);
                                    var d = new r.SendTransactionRequest;
                                    return d.setTransaction(o), Promise.resolve(a(s.node, r.AccessAPI.SendTransaction, d)).then(function(r) {
                                        var s, o = (0, n.response)();
                                        return o.tag = t.tag, o.transactionId = (s = r.getId_asU8(), e.from(s).toString("hex")), o
                                    })
                                } catch (t) {
                                    return Promise.reject(t)
                                }
                            }(s, o));
                        case (0, t.isGetTransactionStatus)(s):
                            return Promise.resolve(function(t, s) {
                                void 0 === s && (s = {});
                                try {
                                    var o = new r.GetTransactionRequest;
                                    return o.setId(e.from(t.transactionId, "hex")), Promise.resolve(a(s.node, r.AccessAPI.GetTransactionResult, o)).then(function(r) {
                                        var s = r.getEventsList(),
                                            o = (0, n.response)();
                                        return o.tag = t.tag, o.transaction = {
                                            status: r.getStatus(),
                                            statusCode: r.getStatusCode(),
                                            errorMessage: r.getErrorMessage(),
                                            events: s.map(function(t) {
                                                return {
                                                    type: t.getType(),
                                                    transactionId: (r = t.getTransactionId_asU8(), e.from(r).toString("hex")),
                                                    transactionIndex: t.getTransactionIndex(),
                                                    eventIndex: t.getEventIndex(),
                                                    payload: JSON.parse(e.from(t.getPayload_asU8()).toString("utf8"))
                                                };
                                                var r
                                            })
                                        }, o
                                    })
                                } catch (t) {
                                    return Promise.reject(t)
                                }
                            }(s, o));
                        case (0, t.isScript)(s):
                            return Promise.resolve(function(t, s) {
                                void 0 === s && (s = {});
                                try {
                                    var o = new r.ExecuteScriptAtLatestBlockRequest,
                                        c = e.from(t.message.cadence, "utf8");
                                    return o.setScript(c), Promise.resolve(a(s.node, r.AccessAPI.ExecuteScriptAtLatestBlock, o)).then(function(r) {
                                        var s = (0, n.response)();
                                        return s.tag = t.tag, s.encodedData = JSON.parse(e.from(r.getValue_asU8()).toString("utf8")), s
                                    })
                                } catch (t) {
                                    return Promise.reject(t)
                                }
                            }(s, o));
                        case (0, t.isGetAccount)(s):
                            return Promise.resolve(function(t, s) {
                                void 0 === s && (s = {});
                                try {
                                    var o = new r.GetAccountRequest;
                                    return o.setAddress(e.from(t.accountAddr.padStart(16, 0), "hex")), Promise.resolve(a(s.node, r.AccessAPI.GetAccount, o)).then(function(e) {
                                        var r = (0, n.response)();
                                        r.tag = t.tag;
                                        var s = e.getAccount();
                                        return r.account = {
                                            address: u(s.getAddress_asU8()),
                                            balance: s.getBalance(),
                                            code: s.getCode_asU8(),
                                            keys: s.getKeysList().map(function(e) {
                                                return {
                                                    index: e.getIndex(),
                                                    publicKey: u(e.getPublicKey_asU8()),
                                                    signAlgo: e.getSignAlgo(),
                                                    hashAlgo: e.getHashAlgo(),
                                                    weight: e.getWeight(),
                                                    sequenceNumber: e.getSequenceNumber()
                                                }
                                            })
                                        }, r
                                    })
                                } catch (t) {
                                    return Promise.reject(t)
                                }
                            }(s, o));
                        case (0, t.isGetEvents)(s):
                            return Promise.resolve(function(t, s) {
                                void 0 === s && (s = {});
                                try {
                                    var o = new r.GetEventsForHeightRangeRequest;
                                    return o.setType(t.events.eventType), o.setStartHeight(Number(t.events.start)), o.setEndHeight(Number(t.events.end)), Promise.resolve(a(s.node, r.AccessAPI.GetEventsForHeightRange, o)).then(function(r) {
                                        var s = (0, n.response)();
                                        s.tag = t.tag;
                                        var o = r.getResultsList();
                                        return s.events = o.reduce(function(t, r) {
                                            var n = r.getBlockId(),
                                                s = r.getBlockHeight();
                                            return r.getEventsList().forEach(function(r) {
                                                var o;
                                                t.push({
                                                    blockId: n,
                                                    blockHeight: s,
                                                    type: r.getType(),
                                                    transactionId: (o = r.getTransactionId_asU8(), e.from(o).toString("hex")),
                                                    transactionIndex: r.getTransactionIndex(),
                                                    eventIndex: r.getEventIndex(),
                                                    payload: JSON.parse(e.from(r.getPayload_asU8()).toString("utf8"))
                                                })
                                            }), t
                                        }, []), s
                                    })
                                } catch (t) {
                                    return Promise.reject(t)
                                }
                            }(s, o));
                        case (0, t.isGetLatestBlock)(s):
                            return Promise.resolve(function(e, t) {
                                void 0 === t && (t = {});
                                try {
                                    var s = new r.GetLatestBlockRequest;
                                    return s.setIsSealed(e.latestBlock.isSealed), Promise.resolve(a(t.node, r.AccessAPI.GetLatestBlock, s)).then(function(t) {
                                        var r = t.getBlock(),
                                            s = r.getCollectionGuaranteesList(),
                                            o = r.getBlockSealsList(),
                                            a = r.getSignaturesList(),
                                            c = (0, n.response)();
                                        return c.tag = e.tag, c.latestBlock = {
                                            id: g(r.getId_asU8()),
                                            parentId: g(r.getParentId_asU8()),
                                            height: r.getHeight(),
                                            timestamp: r.getTimestamp(),
                                            collectionGuarantees: s.map(function(e) {
                                                return {
                                                    collectionId: g(e.getCollectionId_asU8()),
                                                    signatures: e.getSignaturesList()
                                                }
                                            }),
                                            blockSeals: o.map(function(e) {
                                                return {
                                                    blockId: g(e.getBlockId_asU8()),
                                                    executionReceiptId: g(e.getExecutionReceiptId_asU8()),
                                                    executionReceiptSignatures: e.getExecutionReceiptSignaturesList(),
                                                    resultApprovalSignatures: e.getResultApprovalSignaturesList()
                                                }
                                            }),
                                            signatures: a
                                        }, c
                                    })
                                } catch (e) {
                                    return Promise.reject(e)
                                }
                            }(s, o));
                        case (0, t.isPing)(s):
                            return Promise.resolve(function(e, t) {
                                void 0 === t && (t = {});
                                try {
                                    var s = new r.PingRequest;
                                    return Promise.resolve(a(t.node, r.AccessAPI.Ping, s)).then(function(t) {
                                        var r = (0, n.response)();
                                        return r.tag = e.tag, r
                                    })
                                } catch (e) {
                                    return Promise.reject(e)
                                }
                            }(s, o));
                        default:
                            return Promise.resolve(s)
                    }
                } catch (d) {
                    return Promise.reject(d)
                }
            };
        exports.send = d;
    }, {
        "@onflow/interaction": "FaBc",
        "@onflow/protobuf": "LnxY",
        "@onflow/response": "CVFT",
        "@improbable-eng/grpc-web": "FY0d",
        "@improbable-eng/grpc-web-node-http-transport": "qvzX",
        "buffer": "ARb5"
    }],
    "HpQW": [function(require, module, exports) {
        "use strict";

        function e() {
            return (e = Object.assign || function(e) {
                for (var r = 1; r < arguments.length; r++) {
                    var t = arguments[r];
                    for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n])
                }
                return e
            }).apply(this, arguments)
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.decodeResponse = exports.decode = void 0;
        var r = function(e, r, t) {
                try {
                    try {
                        return Promise.resolve(Number(e))
                    } catch (e) {
                        throw new Error("Decode Number Error : " + t.join("."))
                    }
                } catch (e) {
                    return Promise.reject(e)
                }
            },
            t = function(e) {
                return Promise.resolve(e)
            },
            n = function(e, r, t) {
                try {
                    return Promise.resolve(e.fields.reduce(function(e, n) {
                        try {
                            return Promise.resolve(e).then(function(o) {
                                return e = o, Promise.resolve(s(n.value, r, [].concat(t, [n.name]))).then(function(r) {
                                    return e[n.name] = r, e
                                })
                            })
                        } catch (e) {
                            return Promise.reject(e)
                        }
                    }, Promise.resolve({}))).then(function(t) {
                        var n = e.id && c(r, e.id);
                        return n ? Promise.resolve(n(t)) : t
                    })
                } catch (e) {
                    return Promise.reject(e)
                }
            },
            o = {
                UInt: r,
                Int: r,
                UInt8: r,
                Int8: r,
                UInt16: r,
                Int16: r,
                UInt32: r,
                Int32: r,
                UInt64: r,
                Int64: r,
                UInt128: r,
                Int128: r,
                UInt256: r,
                Int256: r,
                Word8: r,
                Word16: r,
                Word32: r,
                Word64: r,
                UFix64: r,
                Fix64: r,
                String: t,
                Character: t,
                Bool: t,
                Address: t,
                Void: function() {
                    return Promise.resolve(null)
                },
                Optional: function(e, r, t) {
                    return Promise.resolve(e ? s(e, r, t) : null)
                },
                Reference: function(e) {
                    try {
                        return Promise.resolve({
                            address: e.address,
                            type: e.type
                        })
                    } catch (e) {
                        return Promise.reject(e)
                    }
                },
                Array: function(e, r, t) {
                    try {
                        return Promise.resolve(Promise.all(e.map(function(e) {
                            return new Promise(function(n) {
                                try {
                                    return Promise.resolve(s(e, r, [].concat(t, [e.type]))).then(n)
                                } catch (e) {
                                    return Promise.reject(e)
                                }
                            })
                        })))
                    } catch (e) {
                        return Promise.reject(e)
                    }
                },
                Dictionary: function(e, r, t) {
                    try {
                        return Promise.resolve(e.reduce(function(e, n) {
                            try {
                                return Promise.resolve(e).then(function(o) {
                                    return e = o, Promise.resolve(s(n.key, r, [].concat(t, [n.key]))).then(function(o) {
                                        return Promise.resolve(s(n.value, r, [].concat(t, [n.key]))).then(function(r) {
                                            return e[o] = r, e
                                        })
                                    })
                                })
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        }, Promise.resolve({})))
                    } catch (e) {
                        return Promise.reject(e)
                    }
                },
                Event: n,
                Resource: n,
                Struct: n
            },
            c = function(e, r) {
                var t = Object.keys(e).find(function(e) {
                    return /^\/.*\/$/.test(e) ? new RegExp(e.substring(1, e.length - 1)).test(r) : e === r
                });
                return r && t && e[t]
            },
            s = function(e, r, t) {
                try {
                    var n = c(r, e.type);
                    if (!n) throw new Error("Undefined Decoder Error: " + e.type + "@" + t.join("."));
                    return Promise.resolve(n(e.value, r, t))
                } catch (e) {
                    return Promise.reject(e)
                }
            },
            i = function(r, t, n) {
                void 0 === t && (t = {}), void 0 === n && (n = []);
                var c = e({}, o, {}, t);
                return Promise.resolve(s(r, c, n))
            },
            a = function(r, t) {
                void 0 === t && (t = {});
                try {
                    var n = !1,
                        c = e({}, o, {}, t),
                        s = r.encodedData ? (n = !0, Promise.resolve(i(r.encodedData, c))) : r.transaction ? (n = !0, Promise.resolve(Promise.all(r.transaction.events.map(function(e) {
                            try {
                                var r = e.eventIndex,
                                    t = e.transactionIndex,
                                    n = e.transactionId,
                                    o = e.type;
                                return Promise.resolve(i(e.payload, c)).then(function(e) {
                                    return {
                                        type: o,
                                        transactionId: n,
                                        transactionIndex: t,
                                        eventIndex: r,
                                        data: e
                                    }
                                })
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        }))).then(function(t) {
                            return e({}, r.transaction, {
                                events: t
                            })
                        })) : r.events ? (n = !0, Promise.resolve(Promise.all(r.events.map(function(e) {
                            try {
                                var r = e.eventIndex,
                                    t = e.transactionIndex,
                                    n = e.transactionId,
                                    o = e.type;
                                return Promise.resolve(i(e.payload, c)).then(function(e) {
                                    return {
                                        type: o,
                                        transactionId: n,
                                        transactionIndex: t,
                                        eventIndex: r,
                                        data: e
                                    }
                                })
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        })))) : r.account ? (n = !0, r.account) : r.latestBlock ? (n = !0, r.latestBlock) : r.transactionId ? (n = !0, r.transactionId) : void 0;
                    return Promise.resolve(s && s.then ? s.then(function(e) {
                        return n ? e : null
                    }) : n ? s : null)
                } catch (e) {
                    return Promise.reject(e)
                }
            };
        exports.decodeResponse = a, exports.decode = i;
    }, {}],
    "IL6F": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.templar = exports.interleave = void 0;
        const e = (t = [], r = [], n = []) => {
            if (!t.length && !r.length) return n;
            if (!t.length) return n;
            if (!r.length) return [...n, t[0]];
            const [o, ...i] = t, [s, ...p] = r;
            return void 0 !== o && n.push(o), void 0 !== s && n.push(s), e(i, p, n)
        };
        exports.interleave = e;
        const t = e => r => "function" == typeof r ? t(e)(r(e)) : String(r),
            r = (r, ...n) => "string" == typeof r ? () => r : Array.isArray(r) ? o => e(r, n.map(t(o))).join("").trim() : r;
        exports.templar = r;
    }, {}],
    "SPk7": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.authorizations = t, exports.authorization = o;
        var e = require("@onflow/interaction");
        const r = e => "function" == typeof e;

        function t(t = []) {
            return (0, e.pipe)(t.map(t => {
                const o = r(t) ? {
                    resolve: t
                } : t;
                return (0, e.makeAuthorizer)({
                    ...o,
                    role: {
                        authorizer: !0
                    }
                })
            }))
        }

        function o(e, r, t, o) {
            return {
                addr: e,
                signingFunction: r,
                keyId: t,
                sequenceNum: o
            }
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "LuDD": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.getAccount = t;
        var e = require("@onflow/interaction");

        function t(t) {
            return (0, e.pipe)([e.makeGetAccount, r => (r.accountAddr = t, (0, e.Ok)(r))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "Yrh0": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.getEvents = t;
        var e = require("@onflow/interaction");

        function t(t, n, r) {
            return (0, e.pipe)([e.makeGetEvents, n => (n.events.eventType = t, (0, e.Ok)(n)), t => (t.events.start = n, (0, e.Ok)(t)), t => (t.events.end = r, (0, e.Ok)(t))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "xEs7": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.getLatestBlock = t;
        var e = require("@onflow/interaction");

        function t(t = !1) {
            return (0, e.pipe)([e.makeGetLatestBlock, o => (o.latestBlock.isSealed = t, (0, e.Ok)(o))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "FU6l": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.getTransactionStatus = e;
        var t = require("@onflow/interaction");

        function e(e) {
            return (0, t.pipe)([t.makeGetTransactionStatus, r => (r.transactionId = e, (0, t.Ok)(r))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "JVCQ": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.limit = t;
        var e = require("@onflow/interaction");

        function t(t) {
            return (0, e.pipe)([i => (i.message.computeLimit = t, (0, e.Ok)(i))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "fMt9": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.params = t, exports.param = o;
        var e = require("@onflow/interaction");
        const r = e => "function" == typeof e;

        function t(t = []) {
            return (0, e.pipe)(t.map(t => {
                const n = r(t) ? {
                    resolve: t
                } : t;
                return (0, e.makeParam)(n)
            }))
        }
        const n = {
            asParam: e => e,
            asInjection: e => e
        };

        function o(e, r = n, t = null) {
            return {
                key: t,
                value: e,
                xform: r
            }
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "tAA3": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.proposer = r;
        var e = require("@onflow/interaction");
        const o = e => "function" == typeof e;
        async function r(r) {
            return o(r) ? (0, e.makeProposer)({
                resolve: r,
                role: {
                    proposer: !0
                }
            }) : (0, e.makeProposer)({
                ...r,
                role: {
                    proposer: !0
                }
            })
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "cw41": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.payer = o;
        var e = require("@onflow/interaction");
        const r = e => "function" == typeof e;

        function o(o) {
            const t = r(o) ? {
                resolve: o
            } : o;
            return (0, e.makePayer)({
                ...t,
                role: {
                    payer: !0
                }
            })
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "HDYO": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.ping = r;
        var e = require("@onflow/interaction");

        function r() {
            return (0, e.pipe)([e.makePing])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "rnBx": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.ref = r;
        var e = require("@onflow/interaction");

        function r(r) {
            return (0, e.pipe)([t => (t.message.refBlock = r, (0, e.Ok)(t))])
        }
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "ebx1": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.script = t;
        var e = require("@onflow/interaction"),
            r = require("@qvvg/templar");

        function t(...t) {
            return (0, e.pipe)([e.makeScript, (0, e.put)("ix.cadence", (0, r.templar)(...t))])
        }
    }, {
        "@onflow/interaction": "FaBc",
        "@qvvg/templar": "IL6F"
    }],
    "feDD": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.transaction = o;
        var e = require("@onflow/interaction"),
            t = require("@qvvg/templar");
        const r = 10,
            a = [],
            i = null;

        function o(...o) {
            return (0, e.pipe)([e.makeTransaction, (0, e.put)("ix.cadence", (0, t.templar)(...o)), t => (t.message.computeLimit = t.message.computeLimit || r, t.message.refBlock = t.message.refBlock || i, t.authorizations = t.authorizations || a, (0, e.Ok)(t))])
        }
    }, {
        "@onflow/interaction": "FaBc",
        "@qvvg/templar": "IL6F"
    }],
    "BwdW": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.resolveAccounts = exports.dedupeResolvedAccounts = exports.enforceResolvedAccounts = void 0;
        var e = require("@onflow/interaction");
        const o = e => "function" == typeof e,
            r = e => "number" == typeof e,
            n = e => "string" == typeof e,
            t = (e, o, ...r) => {
                if (!e) {
                    const e = new Error(`INVARIANT ${o}`);
                    throw e.stack = e.stack.split("\n").filter(e => !/at invariant/.test(e)).join("\n"), console.error("\n\n---\n\n", e, "\n\n", ...r, "\n\n---\n\n"), e
                }
            },
            s = e => !(e.role.proposer && !(n(e.addr) && r(e.keyId) && r(e.sequenceNum) && o(e.signingFunction))) && (!(e.role.payer && !(n(e.addr) && r(e.keyId) && o(e.signingFunction))) && !(e.role.authorizer && !(n(e.addr) && r(e.keyId) && o(e.signingFunction)))),
            c = (e = []) => e.filter(Boolean)[0] || null,
            u = (e = []) => "number" == typeof e.filter(r)[0] ? e.filter(r)[0] : null,
            a = (e = []) => e.find(e => e.role.proposer) || {},
            i = (e, o) => ({
                kind: c([e.kind, o.kind]),
                tempId: c([e.tempId, o.tempId]),
                addr: c([e.addr, o.addr]),
                keyId: u([e.keyId, o.keyId]),
                sequenceNum: "number" == typeof a([e, o]).sequenceNum ? a([e, o]).sequenceNum : e.sequenceNum,
                signature: c([e.signature, o.signature]),
                signingFunction: c([e.signingFunction, o.signingFunction]),
                resolve: c([e.resolve, o.resolve]),
                role: {
                    proposer: e.role.proposer || o.role.proposer,
                    authorizer: e.role.authorizer || o.role.authorizer,
                    payer: e.role.payer || o.role.payer,
                    param: e.role.param || o.role.param
                }
            }),
            l = async r => {
                if (!(0, e.isTransaction)(r)) return (0, e.Ok)(r);
                for (let [e, n] of Object.entries(r.accounts)) o(n.resolve) && (r.accounts[e] = await n.resolve(n)), t(s(r.accounts[e]), "Account unable to fulfill role", r.accounts[e]);
                return (0, e.Ok)(r)
            };
        exports.enforceResolvedAccounts = l;
        const p = async o => {
            if (!(0, e.isTransaction)(o)) return (0, e.Ok)(o);
            for (let e of Object.values(o.accounts)) {
                const r = `${e.addr}|${e.keyId}`;
                null != o.accounts[r] ? o.accounts[r] = i(o.accounts[r], {
                    tempId: r,
                    ...e
                }) : o.accounts[r] = {
                    tempId: r,
                    ...e
                }, o.proposer === e.tempId && (o.proposer = r), o.payer === e.tempId && (o.payer = r), o.authorizations = o.authorizations.map(o => o === e.tempId ? r : o), delete o.accounts[e.tempId]
            }
            for (let e of Object.values(o.accounts)) t(s(e), "Account unable to fulfill roles", e);
            return (0, e.Ok)(o)
        };
        exports.dedupeResolvedAccounts = p;
        const d = (0, e.pipe)([l, p]);
        exports.resolveAccounts = d;
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "S3gV": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.resolveParams = void 0;
        var e = require("@onflow/interaction");
        const r = e => "function" == typeof e,
            t = e => "string" == typeof e,
            a = async a => {
                if (!(0, e.isTransaction)(a) && !(0, e.isScript)(a)) return (0, e.Ok)(a);
                const n = (0, e.get)(a, "ix.cadence");
                if (t(n)) return a.message.cadence = n, (0, e.Ok)(a);
                if (r(n)) {
                    let r = Object.values(a.params),
                        t = await Promise.all(r.map(async function(e) {
                            return "function" == typeof e.resolve ? {
                                ...await e.resolve(),
                                tempId: e.tempId
                            } : e
                        }));
                    return t.forEach(e => {
                        a.params[e.tempId] = e
                    }), t = Object.fromEntries(t.filter(e => null != e.key).map(e => [e.key, e.xform.asInjection(e.value)])), a.message.cadence = n(t), (0, e.Ok)(a)
                }
                throw new Error("Invalid Cadence Value")
            };
        exports.resolveParams = a;
    }, {
        "@onflow/interaction": "FaBc"
    }],
    "VOEF": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var t = require("buffer").Buffer;
        ! function(t, i) {
            "use strict";

            function r(t, i) {
                if (!t) throw new Error(i || "Assertion failed")
            }

            function h(t, i) {
                t.super_ = i;
                var r = function() {};
                r.prototype = i.prototype, t.prototype = new r, t.prototype.constructor = t
            }

            function n(t, i, r) {
                if (n.isBN(t)) return t;
                this.negative = 0, this.words = null, this.length = 0, this.red = null, null !== t && ("le" !== i && "be" !== i || (r = i, i = 10), this._init(t || 0, i || 10, r || "be"))
            }
            var e;
            "object" == typeof t ? t.exports = n : i.BN = n, n.BN = n, n.wordSize = 26;
            try {
                e = require("buffer").Buffer
            } catch (k) {}

            function o(t, i, r) {
                for (var h = 0, n = Math.min(t.length, r), e = i; e < n; e++) {
                    var o = t.charCodeAt(e) - 48;
                    h <<= 4, h |= o >= 49 && o <= 54 ? o - 49 + 10 : o >= 17 && o <= 22 ? o - 17 + 10 : 15 & o
                }
                return h
            }

            function s(t, i, r, h) {
                for (var n = 0, e = Math.min(t.length, r), o = i; o < e; o++) {
                    var s = t.charCodeAt(o) - 48;
                    n *= h, n += s >= 49 ? s - 49 + 10 : s >= 17 ? s - 17 + 10 : s
                }
                return n
            }
            n.isBN = function(t) {
                return t instanceof n || null !== t && "object" == typeof t && t.constructor.wordSize === n.wordSize && Array.isArray(t.words)
            }, n.max = function(t, i) {
                return t.cmp(i) > 0 ? t : i
            }, n.min = function(t, i) {
                return t.cmp(i) < 0 ? t : i
            }, n.prototype._init = function(t, i, h) {
                if ("number" == typeof t) return this._initNumber(t, i, h);
                if ("object" == typeof t) return this._initArray(t, i, h);
                "hex" === i && (i = 16), r(i === (0 | i) && i >= 2 && i <= 36);
                var n = 0;
                "-" === (t = t.toString().replace(/\s+/g, ""))[0] && n++, 16 === i ? this._parseHex(t, n) : this._parseBase(t, i, n), "-" === t[0] && (this.negative = 1), this.strip(), "le" === h && this._initArray(this.toArray(), i, h)
            }, n.prototype._initNumber = function(t, i, h) {
                t < 0 && (this.negative = 1, t = -t), t < 67108864 ? (this.words = [67108863 & t], this.length = 1) : t < 4503599627370496 ? (this.words = [67108863 & t, t / 67108864 & 67108863], this.length = 2) : (r(t < 9007199254740992), this.words = [67108863 & t, t / 67108864 & 67108863, 1], this.length = 3), "le" === h && this._initArray(this.toArray(), i, h)
            }, n.prototype._initArray = function(t, i, h) {
                if (r("number" == typeof t.length), t.length <= 0) return this.words = [0], this.length = 1, this;
                this.length = Math.ceil(t.length / 3), this.words = new Array(this.length);
                for (var n = 0; n < this.length; n++) this.words[n] = 0;
                var e, o, s = 0;
                if ("be" === h)
                    for (n = t.length - 1, e = 0; n >= 0; n -= 3) o = t[n] | t[n - 1] << 8 | t[n - 2] << 16, this.words[e] |= o << s & 67108863, this.words[e + 1] = o >>> 26 - s & 67108863, (s += 24) >= 26 && (s -= 26, e++);
                else if ("le" === h)
                    for (n = 0, e = 0; n < t.length; n += 3) o = t[n] | t[n + 1] << 8 | t[n + 2] << 16, this.words[e] |= o << s & 67108863, this.words[e + 1] = o >>> 26 - s & 67108863, (s += 24) >= 26 && (s -= 26, e++);
                return this.strip()
            }, n.prototype._parseHex = function(t, i) {
                this.length = Math.ceil((t.length - i) / 6), this.words = new Array(this.length);
                for (var r = 0; r < this.length; r++) this.words[r] = 0;
                var h, n, e = 0;
                for (r = t.length - 6, h = 0; r >= i; r -= 6) n = o(t, r, r + 6), this.words[h] |= n << e & 67108863, this.words[h + 1] |= n >>> 26 - e & 4194303, (e += 24) >= 26 && (e -= 26, h++);
                r + 6 !== i && (n = o(t, i, r + 6), this.words[h] |= n << e & 67108863, this.words[h + 1] |= n >>> 26 - e & 4194303), this.strip()
            }, n.prototype._parseBase = function(t, i, r) {
                this.words = [0], this.length = 1;
                for (var h = 0, n = 1; n <= 67108863; n *= i) h++;
                h--, n = n / i | 0;
                for (var e = t.length - r, o = e % h, u = Math.min(e, e - o) + r, a = 0, l = r; l < u; l += h) a = s(t, l, l + h, i), this.imuln(n), this.words[0] + a < 67108864 ? this.words[0] += a : this._iaddn(a);
                if (0 !== o) {
                    var m = 1;
                    for (a = s(t, l, t.length, i), l = 0; l < o; l++) m *= i;
                    this.imuln(m), this.words[0] + a < 67108864 ? this.words[0] += a : this._iaddn(a)
                }
            }, n.prototype.copy = function(t) {
                t.words = new Array(this.length);
                for (var i = 0; i < this.length; i++) t.words[i] = this.words[i];
                t.length = this.length, t.negative = this.negative, t.red = this.red
            }, n.prototype.clone = function() {
                var t = new n(null);
                return this.copy(t), t
            }, n.prototype._expand = function(t) {
                for (; this.length < t;) this.words[this.length++] = 0;
                return this
            }, n.prototype.strip = function() {
                for (; this.length > 1 && 0 === this.words[this.length - 1];) this.length--;
                return this._normSign()
            }, n.prototype._normSign = function() {
                return 1 === this.length && 0 === this.words[0] && (this.negative = 0), this
            }, n.prototype.inspect = function() {
                return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">"
            };
            var u = ["", "0", "00", "000", "0000", "00000", "000000", "0000000", "00000000", "000000000", "0000000000", "00000000000", "000000000000", "0000000000000", "00000000000000", "000000000000000", "0000000000000000", "00000000000000000", "000000000000000000", "0000000000000000000", "00000000000000000000", "000000000000000000000", "0000000000000000000000", "00000000000000000000000", "000000000000000000000000", "0000000000000000000000000"],
                a = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
                l = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 1e7, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 243e5, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176];

            function m(t, i, r) {
                r.negative = i.negative ^ t.negative;
                var h = t.length + i.length | 0;
                r.length = h, h = h - 1 | 0;
                var n = 0 | t.words[0],
                    e = 0 | i.words[0],
                    o = n * e,
                    s = 67108863 & o,
                    u = o / 67108864 | 0;
                r.words[0] = s;
                for (var a = 1; a < h; a++) {
                    for (var l = u >>> 26, m = 67108863 & u, f = Math.min(a, i.length - 1), d = Math.max(0, a - t.length + 1); d <= f; d++) {
                        var p = a - d | 0;
                        l += (o = (n = 0 | t.words[p]) * (e = 0 | i.words[d]) + m) / 67108864 | 0, m = 67108863 & o
                    }
                    r.words[a] = 0 | m, u = 0 | l
                }
                return 0 !== u ? r.words[a] = 0 | u : r.length--, r.strip()
            }
            n.prototype.toString = function(t, i) {
                var h;
                if (i = 0 | i || 1, 16 === (t = t || 10) || "hex" === t) {
                    h = "";
                    for (var n = 0, e = 0, o = 0; o < this.length; o++) {
                        var s = this.words[o],
                            m = (16777215 & (s << n | e)).toString(16);
                        h = 0 !== (e = s >>> 24 - n & 16777215) || o !== this.length - 1 ? u[6 - m.length] + m + h : m + h, (n += 2) >= 26 && (n -= 26, o--)
                    }
                    for (0 !== e && (h = e.toString(16) + h); h.length % i != 0;) h = "0" + h;
                    return 0 !== this.negative && (h = "-" + h), h
                }
                if (t === (0 | t) && t >= 2 && t <= 36) {
                    var f = a[t],
                        d = l[t];
                    h = "";
                    var p = this.clone();
                    for (p.negative = 0; !p.isZero();) {
                        var M = p.modn(d).toString(t);
                        h = (p = p.idivn(d)).isZero() ? M + h : u[f - M.length] + M + h
                    }
                    for (this.isZero() && (h = "0" + h); h.length % i != 0;) h = "0" + h;
                    return 0 !== this.negative && (h = "-" + h), h
                }
                r(!1, "Base should be between 2 and 36")
            }, n.prototype.toNumber = function() {
                var t = this.words[0];
                return 2 === this.length ? t += 67108864 * this.words[1] : 3 === this.length && 1 === this.words[2] ? t += 4503599627370496 + 67108864 * this.words[1] : this.length > 2 && r(!1, "Number can only safely store up to 53 bits"), 0 !== this.negative ? -t : t
            }, n.prototype.toJSON = function() {
                return this.toString(16)
            }, n.prototype.toBuffer = function(t, i) {
                return r(void 0 !== e), this.toArrayLike(e, t, i)
            }, n.prototype.toArray = function(t, i) {
                return this.toArrayLike(Array, t, i)
            }, n.prototype.toArrayLike = function(t, i, h) {
                var n = this.byteLength(),
                    e = h || Math.max(1, n);
                r(n <= e, "byte array longer than desired length"), r(e > 0, "Requested array length <= 0"), this.strip();
                var o, s, u = "le" === i,
                    a = new t(e),
                    l = this.clone();
                if (u) {
                    for (s = 0; !l.isZero(); s++) o = l.andln(255), l.iushrn(8), a[s] = o;
                    for (; s < e; s++) a[s] = 0
                } else {
                    for (s = 0; s < e - n; s++) a[s] = 0;
                    for (s = 0; !l.isZero(); s++) o = l.andln(255), l.iushrn(8), a[e - s - 1] = o
                }
                return a
            }, Math.clz32 ? n.prototype._countBits = function(t) {
                return 32 - Math.clz32(t)
            } : n.prototype._countBits = function(t) {
                var i = t,
                    r = 0;
                return i >= 4096 && (r += 13, i >>>= 13), i >= 64 && (r += 7, i >>>= 7), i >= 8 && (r += 4, i >>>= 4), i >= 2 && (r += 2, i >>>= 2), r + i
            }, n.prototype._zeroBits = function(t) {
                if (0 === t) return 26;
                var i = t,
                    r = 0;
                return 0 == (8191 & i) && (r += 13, i >>>= 13), 0 == (127 & i) && (r += 7, i >>>= 7), 0 == (15 & i) && (r += 4, i >>>= 4), 0 == (3 & i) && (r += 2, i >>>= 2), 0 == (1 & i) && r++, r
            }, n.prototype.bitLength = function() {
                var t = this.words[this.length - 1],
                    i = this._countBits(t);
                return 26 * (this.length - 1) + i
            }, n.prototype.zeroBits = function() {
                if (this.isZero()) return 0;
                for (var t = 0, i = 0; i < this.length; i++) {
                    var r = this._zeroBits(this.words[i]);
                    if (t += r, 26 !== r) break
                }
                return t
            }, n.prototype.byteLength = function() {
                return Math.ceil(this.bitLength() / 8)
            }, n.prototype.toTwos = function(t) {
                return 0 !== this.negative ? this.abs().inotn(t).iaddn(1) : this.clone()
            }, n.prototype.fromTwos = function(t) {
                return this.testn(t - 1) ? this.notn(t).iaddn(1).ineg() : this.clone()
            }, n.prototype.isNeg = function() {
                return 0 !== this.negative
            }, n.prototype.neg = function() {
                return this.clone().ineg()
            }, n.prototype.ineg = function() {
                return this.isZero() || (this.negative ^= 1), this
            }, n.prototype.iuor = function(t) {
                for (; this.length < t.length;) this.words[this.length++] = 0;
                for (var i = 0; i < t.length; i++) this.words[i] = this.words[i] | t.words[i];
                return this.strip()
            }, n.prototype.ior = function(t) {
                return r(0 == (this.negative | t.negative)), this.iuor(t)
            }, n.prototype.or = function(t) {
                return this.length > t.length ? this.clone().ior(t) : t.clone().ior(this)
            }, n.prototype.uor = function(t) {
                return this.length > t.length ? this.clone().iuor(t) : t.clone().iuor(this)
            }, n.prototype.iuand = function(t) {
                var i;
                i = this.length > t.length ? t : this;
                for (var r = 0; r < i.length; r++) this.words[r] = this.words[r] & t.words[r];
                return this.length = i.length, this.strip()
            }, n.prototype.iand = function(t) {
                return r(0 == (this.negative | t.negative)), this.iuand(t)
            }, n.prototype.and = function(t) {
                return this.length > t.length ? this.clone().iand(t) : t.clone().iand(this)
            }, n.prototype.uand = function(t) {
                return this.length > t.length ? this.clone().iuand(t) : t.clone().iuand(this)
            }, n.prototype.iuxor = function(t) {
                var i, r;
                this.length > t.length ? (i = this, r = t) : (i = t, r = this);
                for (var h = 0; h < r.length; h++) this.words[h] = i.words[h] ^ r.words[h];
                if (this !== i)
                    for (; h < i.length; h++) this.words[h] = i.words[h];
                return this.length = i.length, this.strip()
            }, n.prototype.ixor = function(t) {
                return r(0 == (this.negative | t.negative)), this.iuxor(t)
            }, n.prototype.xor = function(t) {
                return this.length > t.length ? this.clone().ixor(t) : t.clone().ixor(this)
            }, n.prototype.uxor = function(t) {
                return this.length > t.length ? this.clone().iuxor(t) : t.clone().iuxor(this)
            }, n.prototype.inotn = function(t) {
                r("number" == typeof t && t >= 0);
                var i = 0 | Math.ceil(t / 26),
                    h = t % 26;
                this._expand(i), h > 0 && i--;
                for (var n = 0; n < i; n++) this.words[n] = 67108863 & ~this.words[n];
                return h > 0 && (this.words[n] = ~this.words[n] & 67108863 >> 26 - h), this.strip()
            }, n.prototype.notn = function(t) {
                return this.clone().inotn(t)
            }, n.prototype.setn = function(t, i) {
                r("number" == typeof t && t >= 0);
                var h = t / 26 | 0,
                    n = t % 26;
                return this._expand(h + 1), this.words[h] = i ? this.words[h] | 1 << n : this.words[h] & ~(1 << n), this.strip()
            }, n.prototype.iadd = function(t) {
                var i, r, h;
                if (0 !== this.negative && 0 === t.negative) return this.negative = 0, i = this.isub(t), this.negative ^= 1, this._normSign();
                if (0 === this.negative && 0 !== t.negative) return t.negative = 0, i = this.isub(t), t.negative = 1, i._normSign();
                this.length > t.length ? (r = this, h = t) : (r = t, h = this);
                for (var n = 0, e = 0; e < h.length; e++) i = (0 | r.words[e]) + (0 | h.words[e]) + n, this.words[e] = 67108863 & i, n = i >>> 26;
                for (; 0 !== n && e < r.length; e++) i = (0 | r.words[e]) + n, this.words[e] = 67108863 & i, n = i >>> 26;
                if (this.length = r.length, 0 !== n) this.words[this.length] = n, this.length++;
                else if (r !== this)
                    for (; e < r.length; e++) this.words[e] = r.words[e];
                return this
            }, n.prototype.add = function(t) {
                var i;
                return 0 !== t.negative && 0 === this.negative ? (t.negative = 0, i = this.sub(t), t.negative ^= 1, i) : 0 === t.negative && 0 !== this.negative ? (this.negative = 0, i = t.sub(this), this.negative = 1, i) : this.length > t.length ? this.clone().iadd(t) : t.clone().iadd(this)
            }, n.prototype.isub = function(t) {
                if (0 !== t.negative) {
                    t.negative = 0;
                    var i = this.iadd(t);
                    return t.negative = 1, i._normSign()
                }
                if (0 !== this.negative) return this.negative = 0, this.iadd(t), this.negative = 1, this._normSign();
                var r, h, n = this.cmp(t);
                if (0 === n) return this.negative = 0, this.length = 1, this.words[0] = 0, this;
                n > 0 ? (r = this, h = t) : (r = t, h = this);
                for (var e = 0, o = 0; o < h.length; o++) e = (i = (0 | r.words[o]) - (0 | h.words[o]) + e) >> 26, this.words[o] = 67108863 & i;
                for (; 0 !== e && o < r.length; o++) e = (i = (0 | r.words[o]) + e) >> 26, this.words[o] = 67108863 & i;
                if (0 === e && o < r.length && r !== this)
                    for (; o < r.length; o++) this.words[o] = r.words[o];
                return this.length = Math.max(this.length, o), r !== this && (this.negative = 1), this.strip()
            }, n.prototype.sub = function(t) {
                return this.clone().isub(t)
            };
            var f = function(t, i, r) {
                var h, n, e, o = t.words,
                    s = i.words,
                    u = r.words,
                    a = 0,
                    l = 0 | o[0],
                    m = 8191 & l,
                    f = l >>> 13,
                    d = 0 | o[1],
                    p = 8191 & d,
                    M = d >>> 13,
                    v = 0 | o[2],
                    g = 8191 & v,
                    c = v >>> 13,
                    w = 0 | o[3],
                    y = 8191 & w,
                    b = w >>> 13,
                    _ = 0 | o[4],
                    k = 8191 & _,
                    A = _ >>> 13,
                    x = 0 | o[5],
                    S = 8191 & x,
                    q = x >>> 13,
                    Z = 0 | o[6],
                    R = 8191 & Z,
                    B = Z >>> 13,
                    N = 0 | o[7],
                    L = 8191 & N,
                    I = N >>> 13,
                    z = 0 | o[8],
                    T = 8191 & z,
                    E = z >>> 13,
                    O = 0 | o[9],
                    j = 8191 & O,
                    K = O >>> 13,
                    P = 0 | s[0],
                    F = 8191 & P,
                    C = P >>> 13,
                    D = 0 | s[1],
                    H = 8191 & D,
                    J = D >>> 13,
                    U = 0 | s[2],
                    G = 8191 & U,
                    Q = U >>> 13,
                    V = 0 | s[3],
                    W = 8191 & V,
                    X = V >>> 13,
                    Y = 0 | s[4],
                    $ = 8191 & Y,
                    tt = Y >>> 13,
                    it = 0 | s[5],
                    rt = 8191 & it,
                    ht = it >>> 13,
                    nt = 0 | s[6],
                    et = 8191 & nt,
                    ot = nt >>> 13,
                    st = 0 | s[7],
                    ut = 8191 & st,
                    at = st >>> 13,
                    lt = 0 | s[8],
                    mt = 8191 & lt,
                    ft = lt >>> 13,
                    dt = 0 | s[9],
                    pt = 8191 & dt,
                    Mt = dt >>> 13;
                r.negative = t.negative ^ i.negative, r.length = 19;
                var vt = (a + (h = Math.imul(m, F)) | 0) + ((8191 & (n = (n = Math.imul(m, C)) + Math.imul(f, F) | 0)) << 13) | 0;
                a = ((e = Math.imul(f, C)) + (n >>> 13) | 0) + (vt >>> 26) | 0, vt &= 67108863, h = Math.imul(p, F), n = (n = Math.imul(p, C)) + Math.imul(M, F) | 0, e = Math.imul(M, C);
                var gt = (a + (h = h + Math.imul(m, H) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, J) | 0) + Math.imul(f, H) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, J) | 0) + (n >>> 13) | 0) + (gt >>> 26) | 0, gt &= 67108863, h = Math.imul(g, F), n = (n = Math.imul(g, C)) + Math.imul(c, F) | 0, e = Math.imul(c, C), h = h + Math.imul(p, H) | 0, n = (n = n + Math.imul(p, J) | 0) + Math.imul(M, H) | 0, e = e + Math.imul(M, J) | 0;
                var ct = (a + (h = h + Math.imul(m, G) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, Q) | 0) + Math.imul(f, G) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, Q) | 0) + (n >>> 13) | 0) + (ct >>> 26) | 0, ct &= 67108863, h = Math.imul(y, F), n = (n = Math.imul(y, C)) + Math.imul(b, F) | 0, e = Math.imul(b, C), h = h + Math.imul(g, H) | 0, n = (n = n + Math.imul(g, J) | 0) + Math.imul(c, H) | 0, e = e + Math.imul(c, J) | 0, h = h + Math.imul(p, G) | 0, n = (n = n + Math.imul(p, Q) | 0) + Math.imul(M, G) | 0, e = e + Math.imul(M, Q) | 0;
                var wt = (a + (h = h + Math.imul(m, W) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, X) | 0) + Math.imul(f, W) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, X) | 0) + (n >>> 13) | 0) + (wt >>> 26) | 0, wt &= 67108863, h = Math.imul(k, F), n = (n = Math.imul(k, C)) + Math.imul(A, F) | 0, e = Math.imul(A, C), h = h + Math.imul(y, H) | 0, n = (n = n + Math.imul(y, J) | 0) + Math.imul(b, H) | 0, e = e + Math.imul(b, J) | 0, h = h + Math.imul(g, G) | 0, n = (n = n + Math.imul(g, Q) | 0) + Math.imul(c, G) | 0, e = e + Math.imul(c, Q) | 0, h = h + Math.imul(p, W) | 0, n = (n = n + Math.imul(p, X) | 0) + Math.imul(M, W) | 0, e = e + Math.imul(M, X) | 0;
                var yt = (a + (h = h + Math.imul(m, $) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, tt) | 0) + Math.imul(f, $) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, tt) | 0) + (n >>> 13) | 0) + (yt >>> 26) | 0, yt &= 67108863, h = Math.imul(S, F), n = (n = Math.imul(S, C)) + Math.imul(q, F) | 0, e = Math.imul(q, C), h = h + Math.imul(k, H) | 0, n = (n = n + Math.imul(k, J) | 0) + Math.imul(A, H) | 0, e = e + Math.imul(A, J) | 0, h = h + Math.imul(y, G) | 0, n = (n = n + Math.imul(y, Q) | 0) + Math.imul(b, G) | 0, e = e + Math.imul(b, Q) | 0, h = h + Math.imul(g, W) | 0, n = (n = n + Math.imul(g, X) | 0) + Math.imul(c, W) | 0, e = e + Math.imul(c, X) | 0, h = h + Math.imul(p, $) | 0, n = (n = n + Math.imul(p, tt) | 0) + Math.imul(M, $) | 0, e = e + Math.imul(M, tt) | 0;
                var bt = (a + (h = h + Math.imul(m, rt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, ht) | 0) + Math.imul(f, rt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, ht) | 0) + (n >>> 13) | 0) + (bt >>> 26) | 0, bt &= 67108863, h = Math.imul(R, F), n = (n = Math.imul(R, C)) + Math.imul(B, F) | 0, e = Math.imul(B, C), h = h + Math.imul(S, H) | 0, n = (n = n + Math.imul(S, J) | 0) + Math.imul(q, H) | 0, e = e + Math.imul(q, J) | 0, h = h + Math.imul(k, G) | 0, n = (n = n + Math.imul(k, Q) | 0) + Math.imul(A, G) | 0, e = e + Math.imul(A, Q) | 0, h = h + Math.imul(y, W) | 0, n = (n = n + Math.imul(y, X) | 0) + Math.imul(b, W) | 0, e = e + Math.imul(b, X) | 0, h = h + Math.imul(g, $) | 0, n = (n = n + Math.imul(g, tt) | 0) + Math.imul(c, $) | 0, e = e + Math.imul(c, tt) | 0, h = h + Math.imul(p, rt) | 0, n = (n = n + Math.imul(p, ht) | 0) + Math.imul(M, rt) | 0, e = e + Math.imul(M, ht) | 0;
                var _t = (a + (h = h + Math.imul(m, et) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, ot) | 0) + Math.imul(f, et) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, ot) | 0) + (n >>> 13) | 0) + (_t >>> 26) | 0, _t &= 67108863, h = Math.imul(L, F), n = (n = Math.imul(L, C)) + Math.imul(I, F) | 0, e = Math.imul(I, C), h = h + Math.imul(R, H) | 0, n = (n = n + Math.imul(R, J) | 0) + Math.imul(B, H) | 0, e = e + Math.imul(B, J) | 0, h = h + Math.imul(S, G) | 0, n = (n = n + Math.imul(S, Q) | 0) + Math.imul(q, G) | 0, e = e + Math.imul(q, Q) | 0, h = h + Math.imul(k, W) | 0, n = (n = n + Math.imul(k, X) | 0) + Math.imul(A, W) | 0, e = e + Math.imul(A, X) | 0, h = h + Math.imul(y, $) | 0, n = (n = n + Math.imul(y, tt) | 0) + Math.imul(b, $) | 0, e = e + Math.imul(b, tt) | 0, h = h + Math.imul(g, rt) | 0, n = (n = n + Math.imul(g, ht) | 0) + Math.imul(c, rt) | 0, e = e + Math.imul(c, ht) | 0, h = h + Math.imul(p, et) | 0, n = (n = n + Math.imul(p, ot) | 0) + Math.imul(M, et) | 0, e = e + Math.imul(M, ot) | 0;
                var kt = (a + (h = h + Math.imul(m, ut) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, at) | 0) + Math.imul(f, ut) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, at) | 0) + (n >>> 13) | 0) + (kt >>> 26) | 0, kt &= 67108863, h = Math.imul(T, F), n = (n = Math.imul(T, C)) + Math.imul(E, F) | 0, e = Math.imul(E, C), h = h + Math.imul(L, H) | 0, n = (n = n + Math.imul(L, J) | 0) + Math.imul(I, H) | 0, e = e + Math.imul(I, J) | 0, h = h + Math.imul(R, G) | 0, n = (n = n + Math.imul(R, Q) | 0) + Math.imul(B, G) | 0, e = e + Math.imul(B, Q) | 0, h = h + Math.imul(S, W) | 0, n = (n = n + Math.imul(S, X) | 0) + Math.imul(q, W) | 0, e = e + Math.imul(q, X) | 0, h = h + Math.imul(k, $) | 0, n = (n = n + Math.imul(k, tt) | 0) + Math.imul(A, $) | 0, e = e + Math.imul(A, tt) | 0, h = h + Math.imul(y, rt) | 0, n = (n = n + Math.imul(y, ht) | 0) + Math.imul(b, rt) | 0, e = e + Math.imul(b, ht) | 0, h = h + Math.imul(g, et) | 0, n = (n = n + Math.imul(g, ot) | 0) + Math.imul(c, et) | 0, e = e + Math.imul(c, ot) | 0, h = h + Math.imul(p, ut) | 0, n = (n = n + Math.imul(p, at) | 0) + Math.imul(M, ut) | 0, e = e + Math.imul(M, at) | 0;
                var At = (a + (h = h + Math.imul(m, mt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, ft) | 0) + Math.imul(f, mt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, ft) | 0) + (n >>> 13) | 0) + (At >>> 26) | 0, At &= 67108863, h = Math.imul(j, F), n = (n = Math.imul(j, C)) + Math.imul(K, F) | 0, e = Math.imul(K, C), h = h + Math.imul(T, H) | 0, n = (n = n + Math.imul(T, J) | 0) + Math.imul(E, H) | 0, e = e + Math.imul(E, J) | 0, h = h + Math.imul(L, G) | 0, n = (n = n + Math.imul(L, Q) | 0) + Math.imul(I, G) | 0, e = e + Math.imul(I, Q) | 0, h = h + Math.imul(R, W) | 0, n = (n = n + Math.imul(R, X) | 0) + Math.imul(B, W) | 0, e = e + Math.imul(B, X) | 0, h = h + Math.imul(S, $) | 0, n = (n = n + Math.imul(S, tt) | 0) + Math.imul(q, $) | 0, e = e + Math.imul(q, tt) | 0, h = h + Math.imul(k, rt) | 0, n = (n = n + Math.imul(k, ht) | 0) + Math.imul(A, rt) | 0, e = e + Math.imul(A, ht) | 0, h = h + Math.imul(y, et) | 0, n = (n = n + Math.imul(y, ot) | 0) + Math.imul(b, et) | 0, e = e + Math.imul(b, ot) | 0, h = h + Math.imul(g, ut) | 0, n = (n = n + Math.imul(g, at) | 0) + Math.imul(c, ut) | 0, e = e + Math.imul(c, at) | 0, h = h + Math.imul(p, mt) | 0, n = (n = n + Math.imul(p, ft) | 0) + Math.imul(M, mt) | 0, e = e + Math.imul(M, ft) | 0;
                var xt = (a + (h = h + Math.imul(m, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(m, Mt) | 0) + Math.imul(f, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(f, Mt) | 0) + (n >>> 13) | 0) + (xt >>> 26) | 0, xt &= 67108863, h = Math.imul(j, H), n = (n = Math.imul(j, J)) + Math.imul(K, H) | 0, e = Math.imul(K, J), h = h + Math.imul(T, G) | 0, n = (n = n + Math.imul(T, Q) | 0) + Math.imul(E, G) | 0, e = e + Math.imul(E, Q) | 0, h = h + Math.imul(L, W) | 0, n = (n = n + Math.imul(L, X) | 0) + Math.imul(I, W) | 0, e = e + Math.imul(I, X) | 0, h = h + Math.imul(R, $) | 0, n = (n = n + Math.imul(R, tt) | 0) + Math.imul(B, $) | 0, e = e + Math.imul(B, tt) | 0, h = h + Math.imul(S, rt) | 0, n = (n = n + Math.imul(S, ht) | 0) + Math.imul(q, rt) | 0, e = e + Math.imul(q, ht) | 0, h = h + Math.imul(k, et) | 0, n = (n = n + Math.imul(k, ot) | 0) + Math.imul(A, et) | 0, e = e + Math.imul(A, ot) | 0, h = h + Math.imul(y, ut) | 0, n = (n = n + Math.imul(y, at) | 0) + Math.imul(b, ut) | 0, e = e + Math.imul(b, at) | 0, h = h + Math.imul(g, mt) | 0, n = (n = n + Math.imul(g, ft) | 0) + Math.imul(c, mt) | 0, e = e + Math.imul(c, ft) | 0;
                var St = (a + (h = h + Math.imul(p, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(p, Mt) | 0) + Math.imul(M, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(M, Mt) | 0) + (n >>> 13) | 0) + (St >>> 26) | 0, St &= 67108863, h = Math.imul(j, G), n = (n = Math.imul(j, Q)) + Math.imul(K, G) | 0, e = Math.imul(K, Q), h = h + Math.imul(T, W) | 0, n = (n = n + Math.imul(T, X) | 0) + Math.imul(E, W) | 0, e = e + Math.imul(E, X) | 0, h = h + Math.imul(L, $) | 0, n = (n = n + Math.imul(L, tt) | 0) + Math.imul(I, $) | 0, e = e + Math.imul(I, tt) | 0, h = h + Math.imul(R, rt) | 0, n = (n = n + Math.imul(R, ht) | 0) + Math.imul(B, rt) | 0, e = e + Math.imul(B, ht) | 0, h = h + Math.imul(S, et) | 0, n = (n = n + Math.imul(S, ot) | 0) + Math.imul(q, et) | 0, e = e + Math.imul(q, ot) | 0, h = h + Math.imul(k, ut) | 0, n = (n = n + Math.imul(k, at) | 0) + Math.imul(A, ut) | 0, e = e + Math.imul(A, at) | 0, h = h + Math.imul(y, mt) | 0, n = (n = n + Math.imul(y, ft) | 0) + Math.imul(b, mt) | 0, e = e + Math.imul(b, ft) | 0;
                var qt = (a + (h = h + Math.imul(g, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(g, Mt) | 0) + Math.imul(c, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(c, Mt) | 0) + (n >>> 13) | 0) + (qt >>> 26) | 0, qt &= 67108863, h = Math.imul(j, W), n = (n = Math.imul(j, X)) + Math.imul(K, W) | 0, e = Math.imul(K, X), h = h + Math.imul(T, $) | 0, n = (n = n + Math.imul(T, tt) | 0) + Math.imul(E, $) | 0, e = e + Math.imul(E, tt) | 0, h = h + Math.imul(L, rt) | 0, n = (n = n + Math.imul(L, ht) | 0) + Math.imul(I, rt) | 0, e = e + Math.imul(I, ht) | 0, h = h + Math.imul(R, et) | 0, n = (n = n + Math.imul(R, ot) | 0) + Math.imul(B, et) | 0, e = e + Math.imul(B, ot) | 0, h = h + Math.imul(S, ut) | 0, n = (n = n + Math.imul(S, at) | 0) + Math.imul(q, ut) | 0, e = e + Math.imul(q, at) | 0, h = h + Math.imul(k, mt) | 0, n = (n = n + Math.imul(k, ft) | 0) + Math.imul(A, mt) | 0, e = e + Math.imul(A, ft) | 0;
                var Zt = (a + (h = h + Math.imul(y, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(y, Mt) | 0) + Math.imul(b, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(b, Mt) | 0) + (n >>> 13) | 0) + (Zt >>> 26) | 0, Zt &= 67108863, h = Math.imul(j, $), n = (n = Math.imul(j, tt)) + Math.imul(K, $) | 0, e = Math.imul(K, tt), h = h + Math.imul(T, rt) | 0, n = (n = n + Math.imul(T, ht) | 0) + Math.imul(E, rt) | 0, e = e + Math.imul(E, ht) | 0, h = h + Math.imul(L, et) | 0, n = (n = n + Math.imul(L, ot) | 0) + Math.imul(I, et) | 0, e = e + Math.imul(I, ot) | 0, h = h + Math.imul(R, ut) | 0, n = (n = n + Math.imul(R, at) | 0) + Math.imul(B, ut) | 0, e = e + Math.imul(B, at) | 0, h = h + Math.imul(S, mt) | 0, n = (n = n + Math.imul(S, ft) | 0) + Math.imul(q, mt) | 0, e = e + Math.imul(q, ft) | 0;
                var Rt = (a + (h = h + Math.imul(k, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(k, Mt) | 0) + Math.imul(A, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(A, Mt) | 0) + (n >>> 13) | 0) + (Rt >>> 26) | 0, Rt &= 67108863, h = Math.imul(j, rt), n = (n = Math.imul(j, ht)) + Math.imul(K, rt) | 0, e = Math.imul(K, ht), h = h + Math.imul(T, et) | 0, n = (n = n + Math.imul(T, ot) | 0) + Math.imul(E, et) | 0, e = e + Math.imul(E, ot) | 0, h = h + Math.imul(L, ut) | 0, n = (n = n + Math.imul(L, at) | 0) + Math.imul(I, ut) | 0, e = e + Math.imul(I, at) | 0, h = h + Math.imul(R, mt) | 0, n = (n = n + Math.imul(R, ft) | 0) + Math.imul(B, mt) | 0, e = e + Math.imul(B, ft) | 0;
                var Bt = (a + (h = h + Math.imul(S, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(S, Mt) | 0) + Math.imul(q, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(q, Mt) | 0) + (n >>> 13) | 0) + (Bt >>> 26) | 0, Bt &= 67108863, h = Math.imul(j, et), n = (n = Math.imul(j, ot)) + Math.imul(K, et) | 0, e = Math.imul(K, ot), h = h + Math.imul(T, ut) | 0, n = (n = n + Math.imul(T, at) | 0) + Math.imul(E, ut) | 0, e = e + Math.imul(E, at) | 0, h = h + Math.imul(L, mt) | 0, n = (n = n + Math.imul(L, ft) | 0) + Math.imul(I, mt) | 0, e = e + Math.imul(I, ft) | 0;
                var Nt = (a + (h = h + Math.imul(R, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(R, Mt) | 0) + Math.imul(B, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(B, Mt) | 0) + (n >>> 13) | 0) + (Nt >>> 26) | 0, Nt &= 67108863, h = Math.imul(j, ut), n = (n = Math.imul(j, at)) + Math.imul(K, ut) | 0, e = Math.imul(K, at), h = h + Math.imul(T, mt) | 0, n = (n = n + Math.imul(T, ft) | 0) + Math.imul(E, mt) | 0, e = e + Math.imul(E, ft) | 0;
                var Lt = (a + (h = h + Math.imul(L, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(L, Mt) | 0) + Math.imul(I, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(I, Mt) | 0) + (n >>> 13) | 0) + (Lt >>> 26) | 0, Lt &= 67108863, h = Math.imul(j, mt), n = (n = Math.imul(j, ft)) + Math.imul(K, mt) | 0, e = Math.imul(K, ft);
                var It = (a + (h = h + Math.imul(T, pt) | 0) | 0) + ((8191 & (n = (n = n + Math.imul(T, Mt) | 0) + Math.imul(E, pt) | 0)) << 13) | 0;
                a = ((e = e + Math.imul(E, Mt) | 0) + (n >>> 13) | 0) + (It >>> 26) | 0, It &= 67108863;
                var zt = (a + (h = Math.imul(j, pt)) | 0) + ((8191 & (n = (n = Math.imul(j, Mt)) + Math.imul(K, pt) | 0)) << 13) | 0;
                return a = ((e = Math.imul(K, Mt)) + (n >>> 13) | 0) + (zt >>> 26) | 0, zt &= 67108863, u[0] = vt, u[1] = gt, u[2] = ct, u[3] = wt, u[4] = yt, u[5] = bt, u[6] = _t, u[7] = kt, u[8] = At, u[9] = xt, u[10] = St, u[11] = qt, u[12] = Zt, u[13] = Rt, u[14] = Bt, u[15] = Nt, u[16] = Lt, u[17] = It, u[18] = zt, 0 !== a && (u[19] = a, r.length++), r
            };

            function d(t, i, r) {
                return (new p).mulp(t, i, r)
            }

            function p(t, i) {
                this.x = t, this.y = i
            }
            Math.imul || (f = m), n.prototype.mulTo = function(t, i) {
                var r = this.length + t.length;
                return 10 === this.length && 10 === t.length ? f(this, t, i) : r < 63 ? m(this, t, i) : r < 1024 ? function(t, i, r) {
                    r.negative = i.negative ^ t.negative, r.length = t.length + i.length;
                    for (var h = 0, n = 0, e = 0; e < r.length - 1; e++) {
                        var o = n;
                        n = 0;
                        for (var s = 67108863 & h, u = Math.min(e, i.length - 1), a = Math.max(0, e - t.length + 1); a <= u; a++) {
                            var l = e - a,
                                m = (0 | t.words[l]) * (0 | i.words[a]),
                                f = 67108863 & m;
                            s = 67108863 & (f = f + s | 0), n += (o = (o = o + (m / 67108864 | 0) | 0) + (f >>> 26) | 0) >>> 26, o &= 67108863
                        }
                        r.words[e] = s, h = o, o = n
                    }
                    return 0 !== h ? r.words[e] = h : r.length--, r.strip()
                }(this, t, i) : d(this, t, i)
            }, p.prototype.makeRBT = function(t) {
                for (var i = new Array(t), r = n.prototype._countBits(t) - 1, h = 0; h < t; h++) i[h] = this.revBin(h, r, t);
                return i
            }, p.prototype.revBin = function(t, i, r) {
                if (0 === t || t === r - 1) return t;
                for (var h = 0, n = 0; n < i; n++) h |= (1 & t) << i - n - 1, t >>= 1;
                return h
            }, p.prototype.permute = function(t, i, r, h, n, e) {
                for (var o = 0; o < e; o++) h[o] = i[t[o]], n[o] = r[t[o]]
            }, p.prototype.transform = function(t, i, r, h, n, e) {
                this.permute(e, t, i, r, h, n);
                for (var o = 1; o < n; o <<= 1)
                    for (var s = o << 1, u = Math.cos(2 * Math.PI / s), a = Math.sin(2 * Math.PI / s), l = 0; l < n; l += s)
                        for (var m = u, f = a, d = 0; d < o; d++) {
                            var p = r[l + d],
                                M = h[l + d],
                                v = r[l + d + o],
                                g = h[l + d + o],
                                c = m * v - f * g;
                            g = m * g + f * v, v = c, r[l + d] = p + v, h[l + d] = M + g, r[l + d + o] = p - v, h[l + d + o] = M - g, d !== s && (c = u * m - a * f, f = u * f + a * m, m = c)
                        }
            }, p.prototype.guessLen13b = function(t, i) {
                var r = 1 | Math.max(i, t),
                    h = 1 & r,
                    n = 0;
                for (r = r / 2 | 0; r; r >>>= 1) n++;
                return 1 << n + 1 + h
            }, p.prototype.conjugate = function(t, i, r) {
                if (!(r <= 1))
                    for (var h = 0; h < r / 2; h++) {
                        var n = t[h];
                        t[h] = t[r - h - 1], t[r - h - 1] = n, n = i[h], i[h] = -i[r - h - 1], i[r - h - 1] = -n
                    }
            }, p.prototype.normalize13b = function(t, i) {
                for (var r = 0, h = 0; h < i / 2; h++) {
                    var n = 8192 * Math.round(t[2 * h + 1] / i) + Math.round(t[2 * h] / i) + r;
                    t[h] = 67108863 & n, r = n < 67108864 ? 0 : n / 67108864 | 0
                }
                return t
            }, p.prototype.convert13b = function(t, i, h, n) {
                for (var e = 0, o = 0; o < i; o++) e += 0 | t[o], h[2 * o] = 8191 & e, e >>>= 13, h[2 * o + 1] = 8191 & e, e >>>= 13;
                for (o = 2 * i; o < n; ++o) h[o] = 0;
                r(0 === e), r(0 == (-8192 & e))
            }, p.prototype.stub = function(t) {
                for (var i = new Array(t), r = 0; r < t; r++) i[r] = 0;
                return i
            }, p.prototype.mulp = function(t, i, r) {
                var h = 2 * this.guessLen13b(t.length, i.length),
                    n = this.makeRBT(h),
                    e = this.stub(h),
                    o = new Array(h),
                    s = new Array(h),
                    u = new Array(h),
                    a = new Array(h),
                    l = new Array(h),
                    m = new Array(h),
                    f = r.words;
                f.length = h, this.convert13b(t.words, t.length, o, h), this.convert13b(i.words, i.length, a, h), this.transform(o, e, s, u, h, n), this.transform(a, e, l, m, h, n);
                for (var d = 0; d < h; d++) {
                    var p = s[d] * l[d] - u[d] * m[d];
                    u[d] = s[d] * m[d] + u[d] * l[d], s[d] = p
                }
                return this.conjugate(s, u, h), this.transform(s, u, f, e, h, n), this.conjugate(f, e, h), this.normalize13b(f, h), r.negative = t.negative ^ i.negative, r.length = t.length + i.length, r.strip()
            }, n.prototype.mul = function(t) {
                var i = new n(null);
                return i.words = new Array(this.length + t.length), this.mulTo(t, i)
            }, n.prototype.mulf = function(t) {
                var i = new n(null);
                return i.words = new Array(this.length + t.length), d(this, t, i)
            }, n.prototype.imul = function(t) {
                return this.clone().mulTo(t, this)
            }, n.prototype.imuln = function(t) {
                r("number" == typeof t), r(t < 67108864);
                for (var i = 0, h = 0; h < this.length; h++) {
                    var n = (0 | this.words[h]) * t,
                        e = (67108863 & n) + (67108863 & i);
                    i >>= 26, i += n / 67108864 | 0, i += e >>> 26, this.words[h] = 67108863 & e
                }
                return 0 !== i && (this.words[h] = i, this.length++), this
            }, n.prototype.muln = function(t) {
                return this.clone().imuln(t)
            }, n.prototype.sqr = function() {
                return this.mul(this)
            }, n.prototype.isqr = function() {
                return this.imul(this.clone())
            }, n.prototype.pow = function(t) {
                var i = function(t) {
                    for (var i = new Array(t.bitLength()), r = 0; r < i.length; r++) {
                        var h = r / 26 | 0,
                            n = r % 26;
                        i[r] = (t.words[h] & 1 << n) >>> n
                    }
                    return i
                }(t);
                if (0 === i.length) return new n(1);
                for (var r = this, h = 0; h < i.length && 0 === i[h]; h++, r = r.sqr());
                if (++h < i.length)
                    for (var e = r.sqr(); h < i.length; h++, e = e.sqr()) 0 !== i[h] && (r = r.mul(e));
                return r
            }, n.prototype.iushln = function(t) {
                r("number" == typeof t && t >= 0);
                var i, h = t % 26,
                    n = (t - h) / 26,
                    e = 67108863 >>> 26 - h << 26 - h;
                if (0 !== h) {
                    var o = 0;
                    for (i = 0; i < this.length; i++) {
                        var s = this.words[i] & e,
                            u = (0 | this.words[i]) - s << h;
                        this.words[i] = u | o, o = s >>> 26 - h
                    }
                    o && (this.words[i] = o, this.length++)
                }
                if (0 !== n) {
                    for (i = this.length - 1; i >= 0; i--) this.words[i + n] = this.words[i];
                    for (i = 0; i < n; i++) this.words[i] = 0;
                    this.length += n
                }
                return this.strip()
            }, n.prototype.ishln = function(t) {
                return r(0 === this.negative), this.iushln(t)
            }, n.prototype.iushrn = function(t, i, h) {
                var n;
                r("number" == typeof t && t >= 0), n = i ? (i - i % 26) / 26 : 0;
                var e = t % 26,
                    o = Math.min((t - e) / 26, this.length),
                    s = 67108863 ^ 67108863 >>> e << e,
                    u = h;
                if (n -= o, n = Math.max(0, n), u) {
                    for (var a = 0; a < o; a++) u.words[a] = this.words[a];
                    u.length = o
                }
                if (0 === o);
                else if (this.length > o)
                    for (this.length -= o, a = 0; a < this.length; a++) this.words[a] = this.words[a + o];
                else this.words[0] = 0, this.length = 1;
                var l = 0;
                for (a = this.length - 1; a >= 0 && (0 !== l || a >= n); a--) {
                    var m = 0 | this.words[a];
                    this.words[a] = l << 26 - e | m >>> e, l = m & s
                }
                return u && 0 !== l && (u.words[u.length++] = l), 0 === this.length && (this.words[0] = 0, this.length = 1), this.strip()
            }, n.prototype.ishrn = function(t, i, h) {
                return r(0 === this.negative), this.iushrn(t, i, h)
            }, n.prototype.shln = function(t) {
                return this.clone().ishln(t)
            }, n.prototype.ushln = function(t) {
                return this.clone().iushln(t)
            }, n.prototype.shrn = function(t) {
                return this.clone().ishrn(t)
            }, n.prototype.ushrn = function(t) {
                return this.clone().iushrn(t)
            }, n.prototype.testn = function(t) {
                r("number" == typeof t && t >= 0);
                var i = t % 26,
                    h = (t - i) / 26,
                    n = 1 << i;
                return !(this.length <= h) && !!(this.words[h] & n)
            }, n.prototype.imaskn = function(t) {
                r("number" == typeof t && t >= 0);
                var i = t % 26,
                    h = (t - i) / 26;
                if (r(0 === this.negative, "imaskn works only with positive numbers"), this.length <= h) return this;
                if (0 !== i && h++, this.length = Math.min(h, this.length), 0 !== i) {
                    var n = 67108863 ^ 67108863 >>> i << i;
                    this.words[this.length - 1] &= n
                }
                return this.strip()
            }, n.prototype.maskn = function(t) {
                return this.clone().imaskn(t)
            }, n.prototype.iaddn = function(t) {
                return r("number" == typeof t), r(t < 67108864), t < 0 ? this.isubn(-t) : 0 !== this.negative ? 1 === this.length && (0 | this.words[0]) < t ? (this.words[0] = t - (0 | this.words[0]), this.negative = 0, this) : (this.negative = 0, this.isubn(t), this.negative = 1, this) : this._iaddn(t)
            }, n.prototype._iaddn = function(t) {
                this.words[0] += t;
                for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) this.words[i] -= 67108864, i === this.length - 1 ? this.words[i + 1] = 1 : this.words[i + 1]++;
                return this.length = Math.max(this.length, i + 1), this
            }, n.prototype.isubn = function(t) {
                if (r("number" == typeof t), r(t < 67108864), t < 0) return this.iaddn(-t);
                if (0 !== this.negative) return this.negative = 0, this.iaddn(t), this.negative = 1, this;
                if (this.words[0] -= t, 1 === this.length && this.words[0] < 0) this.words[0] = -this.words[0], this.negative = 1;
                else
                    for (var i = 0; i < this.length && this.words[i] < 0; i++) this.words[i] += 67108864, this.words[i + 1] -= 1;
                return this.strip()
            }, n.prototype.addn = function(t) {
                return this.clone().iaddn(t)
            }, n.prototype.subn = function(t) {
                return this.clone().isubn(t)
            }, n.prototype.iabs = function() {
                return this.negative = 0, this
            }, n.prototype.abs = function() {
                return this.clone().iabs()
            }, n.prototype._ishlnsubmul = function(t, i, h) {
                var n, e, o = t.length + h;
                this._expand(o);
                var s = 0;
                for (n = 0; n < t.length; n++) {
                    e = (0 | this.words[n + h]) + s;
                    var u = (0 | t.words[n]) * i;
                    s = ((e -= 67108863 & u) >> 26) - (u / 67108864 | 0), this.words[n + h] = 67108863 & e
                }
                for (; n < this.length - h; n++) s = (e = (0 | this.words[n + h]) + s) >> 26, this.words[n + h] = 67108863 & e;
                if (0 === s) return this.strip();
                for (r(-1 === s), s = 0, n = 0; n < this.length; n++) s = (e = -(0 | this.words[n]) + s) >> 26, this.words[n] = 67108863 & e;
                return this.negative = 1, this.strip()
            }, n.prototype._wordDiv = function(t, i) {
                var r = (this.length, t.length),
                    h = this.clone(),
                    e = t,
                    o = 0 | e.words[e.length - 1];
                0 !== (r = 26 - this._countBits(o)) && (e = e.ushln(r), h.iushln(r), o = 0 | e.words[e.length - 1]);
                var s, u = h.length - e.length;
                if ("mod" !== i) {
                    (s = new n(null)).length = u + 1, s.words = new Array(s.length);
                    for (var a = 0; a < s.length; a++) s.words[a] = 0
                }
                var l = h.clone()._ishlnsubmul(e, 1, u);
                0 === l.negative && (h = l, s && (s.words[u] = 1));
                for (var m = u - 1; m >= 0; m--) {
                    var f = 67108864 * (0 | h.words[e.length + m]) + (0 | h.words[e.length + m - 1]);
                    for (f = Math.min(f / o | 0, 67108863), h._ishlnsubmul(e, f, m); 0 !== h.negative;) f--, h.negative = 0, h._ishlnsubmul(e, 1, m), h.isZero() || (h.negative ^= 1);
                    s && (s.words[m] = f)
                }
                return s && s.strip(), h.strip(), "div" !== i && 0 !== r && h.iushrn(r), {
                    div: s || null,
                    mod: h
                }
            }, n.prototype.divmod = function(t, i, h) {
                return r(!t.isZero()), this.isZero() ? {
                    div: new n(0),
                    mod: new n(0)
                } : 0 !== this.negative && 0 === t.negative ? (s = this.neg().divmod(t, i), "mod" !== i && (e = s.div.neg()), "div" !== i && (o = s.mod.neg(), h && 0 !== o.negative && o.iadd(t)), {
                    div: e,
                    mod: o
                }) : 0 === this.negative && 0 !== t.negative ? (s = this.divmod(t.neg(), i), "mod" !== i && (e = s.div.neg()), {
                    div: e,
                    mod: s.mod
                }) : 0 != (this.negative & t.negative) ? (s = this.neg().divmod(t.neg(), i), "div" !== i && (o = s.mod.neg(), h && 0 !== o.negative && o.isub(t)), {
                    div: s.div,
                    mod: o
                }) : t.length > this.length || this.cmp(t) < 0 ? {
                    div: new n(0),
                    mod: this
                } : 1 === t.length ? "div" === i ? {
                    div: this.divn(t.words[0]),
                    mod: null
                } : "mod" === i ? {
                    div: null,
                    mod: new n(this.modn(t.words[0]))
                } : {
                    div: this.divn(t.words[0]),
                    mod: new n(this.modn(t.words[0]))
                } : this._wordDiv(t, i);
                var e, o, s
            }, n.prototype.div = function(t) {
                return this.divmod(t, "div", !1).div
            }, n.prototype.mod = function(t) {
                return this.divmod(t, "mod", !1).mod
            }, n.prototype.umod = function(t) {
                return this.divmod(t, "mod", !0).mod
            }, n.prototype.divRound = function(t) {
                var i = this.divmod(t);
                if (i.mod.isZero()) return i.div;
                var r = 0 !== i.div.negative ? i.mod.isub(t) : i.mod,
                    h = t.ushrn(1),
                    n = t.andln(1),
                    e = r.cmp(h);
                return e < 0 || 1 === n && 0 === e ? i.div : 0 !== i.div.negative ? i.div.isubn(1) : i.div.iaddn(1)
            }, n.prototype.modn = function(t) {
                r(t <= 67108863);
                for (var i = (1 << 26) % t, h = 0, n = this.length - 1; n >= 0; n--) h = (i * h + (0 | this.words[n])) % t;
                return h
            }, n.prototype.idivn = function(t) {
                r(t <= 67108863);
                for (var i = 0, h = this.length - 1; h >= 0; h--) {
                    var n = (0 | this.words[h]) + 67108864 * i;
                    this.words[h] = n / t | 0, i = n % t
                }
                return this.strip()
            }, n.prototype.divn = function(t) {
                return this.clone().idivn(t)
            }, n.prototype.egcd = function(t) {
                r(0 === t.negative), r(!t.isZero());
                var i = this,
                    h = t.clone();
                i = 0 !== i.negative ? i.umod(t) : i.clone();
                for (var e = new n(1), o = new n(0), s = new n(0), u = new n(1), a = 0; i.isEven() && h.isEven();) i.iushrn(1), h.iushrn(1), ++a;
                for (var l = h.clone(), m = i.clone(); !i.isZero();) {
                    for (var f = 0, d = 1; 0 == (i.words[0] & d) && f < 26; ++f, d <<= 1);
                    if (f > 0)
                        for (i.iushrn(f); f-- > 0;)(e.isOdd() || o.isOdd()) && (e.iadd(l), o.isub(m)), e.iushrn(1), o.iushrn(1);
                    for (var p = 0, M = 1; 0 == (h.words[0] & M) && p < 26; ++p, M <<= 1);
                    if (p > 0)
                        for (h.iushrn(p); p-- > 0;)(s.isOdd() || u.isOdd()) && (s.iadd(l), u.isub(m)), s.iushrn(1), u.iushrn(1);
                    i.cmp(h) >= 0 ? (i.isub(h), e.isub(s), o.isub(u)) : (h.isub(i), s.isub(e), u.isub(o))
                }
                return {
                    a: s,
                    b: u,
                    gcd: h.iushln(a)
                }
            }, n.prototype._invmp = function(t) {
                r(0 === t.negative), r(!t.isZero());
                var i = this,
                    h = t.clone();
                i = 0 !== i.negative ? i.umod(t) : i.clone();
                for (var e, o = new n(1), s = new n(0), u = h.clone(); i.cmpn(1) > 0 && h.cmpn(1) > 0;) {
                    for (var a = 0, l = 1; 0 == (i.words[0] & l) && a < 26; ++a, l <<= 1);
                    if (a > 0)
                        for (i.iushrn(a); a-- > 0;) o.isOdd() && o.iadd(u), o.iushrn(1);
                    for (var m = 0, f = 1; 0 == (h.words[0] & f) && m < 26; ++m, f <<= 1);
                    if (m > 0)
                        for (h.iushrn(m); m-- > 0;) s.isOdd() && s.iadd(u), s.iushrn(1);
                    i.cmp(h) >= 0 ? (i.isub(h), o.isub(s)) : (h.isub(i), s.isub(o))
                }
                return (e = 0 === i.cmpn(1) ? o : s).cmpn(0) < 0 && e.iadd(t), e
            }, n.prototype.gcd = function(t) {
                if (this.isZero()) return t.abs();
                if (t.isZero()) return this.abs();
                var i = this.clone(),
                    r = t.clone();
                i.negative = 0, r.negative = 0;
                for (var h = 0; i.isEven() && r.isEven(); h++) i.iushrn(1), r.iushrn(1);
                for (;;) {
                    for (; i.isEven();) i.iushrn(1);
                    for (; r.isEven();) r.iushrn(1);
                    var n = i.cmp(r);
                    if (n < 0) {
                        var e = i;
                        i = r, r = e
                    } else if (0 === n || 0 === r.cmpn(1)) break;
                    i.isub(r)
                }
                return r.iushln(h)
            }, n.prototype.invm = function(t) {
                return this.egcd(t).a.umod(t)
            }, n.prototype.isEven = function() {
                return 0 == (1 & this.words[0])
            }, n.prototype.isOdd = function() {
                return 1 == (1 & this.words[0])
            }, n.prototype.andln = function(t) {
                return this.words[0] & t
            }, n.prototype.bincn = function(t) {
                r("number" == typeof t);
                var i = t % 26,
                    h = (t - i) / 26,
                    n = 1 << i;
                if (this.length <= h) return this._expand(h + 1), this.words[h] |= n, this;
                for (var e = n, o = h; 0 !== e && o < this.length; o++) {
                    var s = 0 | this.words[o];
                    e = (s += e) >>> 26, s &= 67108863, this.words[o] = s
                }
                return 0 !== e && (this.words[o] = e, this.length++), this
            }, n.prototype.isZero = function() {
                return 1 === this.length && 0 === this.words[0]
            }, n.prototype.cmpn = function(t) {
                var i, h = t < 0;
                if (0 !== this.negative && !h) return -1;
                if (0 === this.negative && h) return 1;
                if (this.strip(), this.length > 1) i = 1;
                else {
                    h && (t = -t), r(t <= 67108863, "Number is too big");
                    var n = 0 | this.words[0];
                    i = n === t ? 0 : n < t ? -1 : 1
                }
                return 0 !== this.negative ? 0 | -i : i
            }, n.prototype.cmp = function(t) {
                if (0 !== this.negative && 0 === t.negative) return -1;
                if (0 === this.negative && 0 !== t.negative) return 1;
                var i = this.ucmp(t);
                return 0 !== this.negative ? 0 | -i : i
            }, n.prototype.ucmp = function(t) {
                if (this.length > t.length) return 1;
                if (this.length < t.length) return -1;
                for (var i = 0, r = this.length - 1; r >= 0; r--) {
                    var h = 0 | this.words[r],
                        n = 0 | t.words[r];
                    if (h !== n) {
                        h < n ? i = -1 : h > n && (i = 1);
                        break
                    }
                }
                return i
            }, n.prototype.gtn = function(t) {
                return 1 === this.cmpn(t)
            }, n.prototype.gt = function(t) {
                return 1 === this.cmp(t)
            }, n.prototype.gten = function(t) {
                return this.cmpn(t) >= 0
            }, n.prototype.gte = function(t) {
                return this.cmp(t) >= 0
            }, n.prototype.ltn = function(t) {
                return -1 === this.cmpn(t)
            }, n.prototype.lt = function(t) {
                return -1 === this.cmp(t)
            }, n.prototype.lten = function(t) {
                return this.cmpn(t) <= 0
            }, n.prototype.lte = function(t) {
                return this.cmp(t) <= 0
            }, n.prototype.eqn = function(t) {
                return 0 === this.cmpn(t)
            }, n.prototype.eq = function(t) {
                return 0 === this.cmp(t)
            }, n.red = function(t) {
                return new b(t)
            }, n.prototype.toRed = function(t) {
                return r(!this.red, "Already a number in reduction context"), r(0 === this.negative, "red works only with positives"), t.convertTo(this)._forceRed(t)
            }, n.prototype.fromRed = function() {
                return r(this.red, "fromRed works only with numbers in reduction context"), this.red.convertFrom(this)
            }, n.prototype._forceRed = function(t) {
                return this.red = t, this
            }, n.prototype.forceRed = function(t) {
                return r(!this.red, "Already a number in reduction context"), this._forceRed(t)
            }, n.prototype.redAdd = function(t) {
                return r(this.red, "redAdd works only with red numbers"), this.red.add(this, t)
            }, n.prototype.redIAdd = function(t) {
                return r(this.red, "redIAdd works only with red numbers"), this.red.iadd(this, t)
            }, n.prototype.redSub = function(t) {
                return r(this.red, "redSub works only with red numbers"), this.red.sub(this, t)
            }, n.prototype.redISub = function(t) {
                return r(this.red, "redISub works only with red numbers"), this.red.isub(this, t)
            }, n.prototype.redShl = function(t) {
                return r(this.red, "redShl works only with red numbers"), this.red.shl(this, t)
            }, n.prototype.redMul = function(t) {
                return r(this.red, "redMul works only with red numbers"), this.red._verify2(this, t), this.red.mul(this, t)
            }, n.prototype.redIMul = function(t) {
                return r(this.red, "redMul works only with red numbers"), this.red._verify2(this, t), this.red.imul(this, t)
            }, n.prototype.redSqr = function() {
                return r(this.red, "redSqr works only with red numbers"), this.red._verify1(this), this.red.sqr(this)
            }, n.prototype.redISqr = function() {
                return r(this.red, "redISqr works only with red numbers"), this.red._verify1(this), this.red.isqr(this)
            }, n.prototype.redSqrt = function() {
                return r(this.red, "redSqrt works only with red numbers"), this.red._verify1(this), this.red.sqrt(this)
            }, n.prototype.redInvm = function() {
                return r(this.red, "redInvm works only with red numbers"), this.red._verify1(this), this.red.invm(this)
            }, n.prototype.redNeg = function() {
                return r(this.red, "redNeg works only with red numbers"), this.red._verify1(this), this.red.neg(this)
            }, n.prototype.redPow = function(t) {
                return r(this.red && !t.red, "redPow(normalNum)"), this.red._verify1(this), this.red.pow(this, t)
            };
            var M = {
                k256: null,
                p224: null,
                p192: null,
                p25519: null
            };

            function v(t, i) {
                this.name = t, this.p = new n(i, 16), this.n = this.p.bitLength(), this.k = new n(1).iushln(this.n).isub(this.p), this.tmp = this._tmp()
            }

            function g() {
                v.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f")
            }

            function c() {
                v.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001")
            }

            function w() {
                v.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff")
            }

            function y() {
                v.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed")
            }

            function b(t) {
                if ("string" == typeof t) {
                    var i = n._prime(t);
                    this.m = i.p, this.prime = i
                } else r(t.gtn(1), "modulus must be greater than 1"), this.m = t, this.prime = null
            }

            function _(t) {
                b.call(this, t), this.shift = this.m.bitLength(), this.shift % 26 != 0 && (this.shift += 26 - this.shift % 26), this.r = new n(1).iushln(this.shift), this.r2 = this.imod(this.r.sqr()), this.rinv = this.r._invmp(this.m), this.minv = this.rinv.mul(this.r).isubn(1).div(this.m), this.minv = this.minv.umod(this.r), this.minv = this.r.sub(this.minv)
            }
            v.prototype._tmp = function() {
                var t = new n(null);
                return t.words = new Array(Math.ceil(this.n / 13)), t
            }, v.prototype.ireduce = function(t) {
                var i, r = t;
                do {
                    this.split(r, this.tmp), i = (r = (r = this.imulK(r)).iadd(this.tmp)).bitLength()
                } while (i > this.n);
                var h = i < this.n ? -1 : r.ucmp(this.p);
                return 0 === h ? (r.words[0] = 0, r.length = 1) : h > 0 ? r.isub(this.p) : void 0 !== r.strip ? r.strip() : r._strip(), r
            }, v.prototype.split = function(t, i) {
                t.iushrn(this.n, 0, i)
            }, v.prototype.imulK = function(t) {
                return t.imul(this.k)
            }, h(g, v), g.prototype.split = function(t, i) {
                for (var r = Math.min(t.length, 9), h = 0; h < r; h++) i.words[h] = t.words[h];
                if (i.length = r, t.length <= 9) return t.words[0] = 0, void(t.length = 1);
                var n = t.words[9];
                for (i.words[i.length++] = 4194303 & n, h = 10; h < t.length; h++) {
                    var e = 0 | t.words[h];
                    t.words[h - 10] = (4194303 & e) << 4 | n >>> 22, n = e
                }
                n >>>= 22, t.words[h - 10] = n, 0 === n && t.length > 10 ? t.length -= 10 : t.length -= 9
            }, g.prototype.imulK = function(t) {
                t.words[t.length] = 0, t.words[t.length + 1] = 0, t.length += 2;
                for (var i = 0, r = 0; r < t.length; r++) {
                    var h = 0 | t.words[r];
                    i += 977 * h, t.words[r] = 67108863 & i, i = 64 * h + (i / 67108864 | 0)
                }
                return 0 === t.words[t.length - 1] && (t.length--, 0 === t.words[t.length - 1] && t.length--), t
            }, h(c, v), h(w, v), h(y, v), y.prototype.imulK = function(t) {
                for (var i = 0, r = 0; r < t.length; r++) {
                    var h = 19 * (0 | t.words[r]) + i,
                        n = 67108863 & h;
                    h >>>= 26, t.words[r] = n, i = h
                }
                return 0 !== i && (t.words[t.length++] = i), t
            }, n._prime = function(t) {
                if (M[t]) return M[t];
                var i;
                if ("k256" === t) i = new g;
                else if ("p224" === t) i = new c;
                else if ("p192" === t) i = new w;
                else {
                    if ("p25519" !== t) throw new Error("Unknown prime " + t);
                    i = new y
                }
                return M[t] = i, i
            }, b.prototype._verify1 = function(t) {
                r(0 === t.negative, "red works only with positives"), r(t.red, "red works only with red numbers")
            }, b.prototype._verify2 = function(t, i) {
                r(0 == (t.negative | i.negative), "red works only with positives"), r(t.red && t.red === i.red, "red works only with red numbers")
            }, b.prototype.imod = function(t) {
                return this.prime ? this.prime.ireduce(t)._forceRed(this) : t.umod(this.m)._forceRed(this)
            }, b.prototype.neg = function(t) {
                return t.isZero() ? t.clone() : this.m.sub(t)._forceRed(this)
            }, b.prototype.add = function(t, i) {
                this._verify2(t, i);
                var r = t.add(i);
                return r.cmp(this.m) >= 0 && r.isub(this.m), r._forceRed(this)
            }, b.prototype.iadd = function(t, i) {
                this._verify2(t, i);
                var r = t.iadd(i);
                return r.cmp(this.m) >= 0 && r.isub(this.m), r
            }, b.prototype.sub = function(t, i) {
                this._verify2(t, i);
                var r = t.sub(i);
                return r.cmpn(0) < 0 && r.iadd(this.m), r._forceRed(this)
            }, b.prototype.isub = function(t, i) {
                this._verify2(t, i);
                var r = t.isub(i);
                return r.cmpn(0) < 0 && r.iadd(this.m), r
            }, b.prototype.shl = function(t, i) {
                return this._verify1(t), this.imod(t.ushln(i))
            }, b.prototype.imul = function(t, i) {
                return this._verify2(t, i), this.imod(t.imul(i))
            }, b.prototype.mul = function(t, i) {
                return this._verify2(t, i), this.imod(t.mul(i))
            }, b.prototype.isqr = function(t) {
                return this.imul(t, t.clone())
            }, b.prototype.sqr = function(t) {
                return this.mul(t, t)
            }, b.prototype.sqrt = function(t) {
                if (t.isZero()) return t.clone();
                var i = this.m.andln(3);
                if (r(i % 2 == 1), 3 === i) {
                    var h = this.m.add(new n(1)).iushrn(2);
                    return this.pow(t, h)
                }
                for (var e = this.m.subn(1), o = 0; !e.isZero() && 0 === e.andln(1);) o++, e.iushrn(1);
                r(!e.isZero());
                var s = new n(1).toRed(this),
                    u = s.redNeg(),
                    a = this.m.subn(1).iushrn(1),
                    l = this.m.bitLength();
                for (l = new n(2 * l * l).toRed(this); 0 !== this.pow(l, a).cmp(u);) l.redIAdd(u);
                for (var m = this.pow(l, e), f = this.pow(t, e.addn(1).iushrn(1)), d = this.pow(t, e), p = o; 0 !== d.cmp(s);) {
                    for (var M = d, v = 0; 0 !== M.cmp(s); v++) M = M.redSqr();
                    r(v < p);
                    var g = this.pow(m, new n(1).iushln(p - v - 1));
                    f = f.redMul(g), m = g.redSqr(), d = d.redMul(m), p = v
                }
                return f
            }, b.prototype.invm = function(t) {
                var i = t._invmp(this.m);
                return 0 !== i.negative ? (i.negative = 0, this.imod(i).redNeg()) : this.imod(i)
            }, b.prototype.pow = function(t, i) {
                if (i.isZero()) return new n(1).toRed(this);
                if (0 === i.cmpn(1)) return t.clone();
                var r = new Array(16);
                r[0] = new n(1).toRed(this), r[1] = t;
                for (var h = 2; h < r.length; h++) r[h] = this.mul(r[h - 1], t);
                var e = r[0],
                    o = 0,
                    s = 0,
                    u = i.bitLength() % 26;
                for (0 === u && (u = 26), h = i.length - 1; h >= 0; h--) {
                    for (var a = i.words[h], l = u - 1; l >= 0; l--) {
                        var m = a >> l & 1;
                        e !== r[0] && (e = this.sqr(e)), 0 !== m || 0 !== o ? (o <<= 1, o |= m, (4 === ++s || 0 === h && 0 === l) && (e = this.mul(e, r[o]), s = 0, o = 0)) : s = 0
                    }
                    u = 26
                }
                return e
            }, b.prototype.convertTo = function(t) {
                var i = t.umod(this.m);
                return i === t ? i.clone() : i
            }, b.prototype.convertFrom = function(t) {
                var i = t.clone();
                return i.red = null, i
            }, n.mont = function(t) {
                return new _(t)
            }, h(_, b), _.prototype.convertTo = function(t) {
                return this.imod(t.ushln(this.shift))
            }, _.prototype.convertFrom = function(t) {
                var i = this.imod(t.mul(this.rinv));
                return i.red = null, i
            }, _.prototype.imul = function(t, i) {
                if (t.isZero() || i.isZero()) return t.words[0] = 0, t.length = 1, t;
                var r = t.imul(i),
                    h = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                    n = r.isub(h).iushrn(this.shift),
                    e = n;
                return n.cmp(this.m) >= 0 ? e = n.isub(this.m) : n.cmpn(0) < 0 && (e = n.iadd(this.m)), e._forceRed(this)
            }, _.prototype.mul = function(t, i) {
                if (t.isZero() || i.isZero()) return new n(0)._forceRed(this);
                var r = t.mul(i),
                    h = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                    e = r.isub(h).iushrn(this.shift),
                    o = e;
                return e.cmp(this.m) >= 0 ? o = e.isub(this.m) : e.cmpn(0) < 0 && (o = e.iadd(this.m)), o._forceRed(this)
            }, _.prototype.invm = function(t) {
                return this.imod(t._invmp(this.m).mul(this.r2))._forceRed(this)
            }
        }("undefined" == typeof module || module, this);
    }, {
        "buffer": "jtu4"
    }],
    "mIAn": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var r = require("buffer").Buffer;
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.getLength = exports.decode = exports.encode = void 0;
        var e = require("bn.js");

        function n(e) {
            if (Array.isArray(e)) {
                for (var t = [], o = 0; o < e.length; o++) t.push(n(e[o]));
                var a = r.concat(t);
                return r.concat([i(a.length, 192), a])
            }
            var f = d(e);
            return 1 === f.length && f[0] < 128 ? f : r.concat([i(f.length, 128), f])
        }

        function t(r, e) {
            if ("00" === r.slice(0, 2)) throw new Error("invalid RLP: extra zeros");
            return parseInt(r, e)
        }

        function i(e, n) {
            if (e < 56) return r.from([e + n]);
            var t = s(e),
                i = s(n + 55 + t.length / 2);
            return r.from(i + t, "hex")
        }

        function o(e, n) {
            if (void 0 === n && (n = !1), !e || 0 === e.length) return r.from([]);
            var t = f(d(e));
            if (n) return t;
            if (0 !== t.remainder.length) throw new Error("invalid remainder");
            return t.data
        }

        function a(e) {
            if (!e || 0 === e.length) return r.from([]);
            var n = d(e),
                i = n[0];
            if (i <= 127) return n.length;
            if (i <= 183) return i - 127;
            if (i <= 191) return i - 182;
            if (i <= 247) return i - 191;
            var o = i - 246;
            return o + t(n.slice(1, o).toString("hex"), 16)
        }

        function f(e) {
            var n, i, o, a, u, l = [],
                s = e[0];
            if (s <= 127) return {
                data: e.slice(0, 1),
                remainder: e.slice(1)
            };
            if (s <= 183) {
                if (n = s - 127, o = 128 === s ? r.from([]) : e.slice(1, n), 2 === n && o[0] < 128) throw new Error("invalid rlp encoding: byte must be less 0x80");
                return {
                    data: o,
                    remainder: e.slice(n)
                }
            }
            if (s <= 191) {
                if (i = s - 182, n = t(e.slice(1, i).toString("hex"), 16), (o = e.slice(i, n + i)).length < n) throw new Error("invalid RLP");
                return {
                    data: o,
                    remainder: e.slice(n + i)
                }
            }
            if (s <= 247) {
                for (n = s - 191, a = e.slice(1, n); a.length;) u = f(a), l.push(u.data), a = u.remainder;
                return {
                    data: l,
                    remainder: e.slice(n)
                }
            }
            var c = (i = s - 246) + (n = t(e.slice(1, i).toString("hex"), 16));
            if (c > e.length) throw new Error("invalid rlp: total length is larger than the data");
            if (0 === (a = e.slice(i, c)).length) throw new Error("invalid rlp, List has a invalid length");
            for (; a.length;) u = f(a), l.push(u.data), a = u.remainder;
            return {
                data: l,
                remainder: e.slice(c)
            }
        }

        function u(r) {
            return "0x" === r.slice(0, 2)
        }

        function l(r) {
            return "string" != typeof r ? r : u(r) ? r.slice(2) : r
        }

        function s(r) {
            if (r < 0) throw new Error("Invalid integer as argument, must be unsigned!");
            var e = r.toString(16);
            return e.length % 2 ? "0" + e : e
        }

        function c(r) {
            return r.length % 2 ? "0" + r : r
        }

        function h(e) {
            var n = s(e);
            return r.from(n, "hex")
        }

        function d(n) {
            if (!r.isBuffer(n)) {
                if ("string" == typeof n) return u(n) ? r.from(c(l(n)), "hex") : r.from(n);
                if ("number" == typeof n || "bigint" == typeof n) return n ? h(n) : r.from([]);
                if (null == n) return r.from([]);
                if (n instanceof Uint8Array) return r.from(n);
                if (e.isBN(n)) return r.from(n.toArray());
                throw new Error("invalid type")
            }
            return n
        }
        exports.encode = n, exports.decode = o, exports.getLength = a;
    }, {
        "bn.js": "VOEF",
        "buffer": "ARb5"
    }],
    "yiVV": [function(require, module, exports) {
        var Buffer = require("buffer").Buffer;
        var e = require("buffer").Buffer;
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.encodeTransactionPayload = exports.encodeTransactionEnvelope = void 0;
        var n = require("rlp"),
            r = function(e) {
                return c(u(e))
            },
            o = function(e) {
                return c(i(e))
            },
            t = function(n, r) {
                return e.from(n.padStart(2 * r, 0), "hex")
            },
            a = function(e) {
                return t(e, 8)
            },
            c = function(e) {
                return n.encode(e).toString("hex")
            },
            u = function(n) {
                return d(n), [(o = n.script, e.from(o, "utf8")), [], (r = n.refBlock, t(r, 32)), n.gasLimit, a(n.proposalKey.address), n.proposalKey.keyId, n.proposalKey.sequenceNum, a(n.payer), n.authorizers.map(a)];
                var r, o
            },
            i = function(e) {
                return p(e), [u(e), s(e)]
            },
            s = function(n) {
                var r = f(n);
                return n.payloadSigs.map(function(e) {
                    return {
                        signerIndex: r.get(e.address),
                        keyId: e.keyId,
                        sig: e.sig
                    }
                }).sort(function(e, n) {
                    return e.signerIndex > n.signerIndex ? 1 : e.signerIndex < n.signerIndex ? -1 : e.keyId > n.keyId ? 1 : e.keyId < n.keyId ? -1 : void 0
                }).map(function(n) {
                    return [n.signerIndex, n.keyId, (r = n.sig, e.from(r, "hex"))];
                    var r
                })
            },
            f = function(e) {
                var n = new Map,
                    r = 0,
                    o = function(e) {
                        n.has(e) || (n.set(e, r), r++)
                    };
                return o(e.proposalKey.address), o(e.payer), e.authorizers.forEach(o), n
            },
            d = function(e) {
                m.forEach(function(n) {
                    return v(e, n)
                }), g.forEach(function(n) {
                    return v(e.proposalKey, n, "proposalKey")
                })
            },
            p = function(e) {
                I.forEach(function(n) {
                    return v(e, n)
                }), e.payloadSigs.forEach(function(e, n) {
                    x.forEach(function(r) {
                        return v(e, r, "payloadSigs", n)
                    })
                })
            },
            l = function(e) {
                return "number" == typeof e
            },
            y = function(e) {
                return "string" == typeof e
            },
            h = function(e) {
                return null !== e && "object" == typeof e
            },
            k = function(e) {
                return h(e) && e instanceof Array
            },
            m = [{
                name: "script",
                check: y
            }, {
                name: "refBlock",
                check: y,
                defaultVal: "0"
            }, {
                name: "gasLimit",
                check: l
            }, {
                name: "proposalKey",
                check: h
            }, {
                name: "payer",
                check: y
            }, {
                name: "authorizers",
                check: k
            }],
            g = [{
                name: "address",
                check: y
            }, {
                name: "keyId",
                check: l
            }, {
                name: "sequenceNum",
                check: l
            }],
            I = [{
                name: "payloadSigs",
                check: k
            }],
            x = [{
                name: "address",
                check: y
            }, {
                name: "keyId",
                check: l
            }, {
                name: "sig",
                check: y
            }],
            v = function(e, n, r, o) {
                var t = n.name,
                    a = n.check,
                    c = n.defaultVal;
                if (null == e[t] && null != c && (e[t] = c), null == e[t]) throw K(t, r, o);
                if (!a(e[t])) throw S(t, r, o)
            },
            E = function(e, n, r) {
                return n ? null == r ? n + "." + e : n + "." + r + "." + e : e
            },
            K = function(e, n, r) {
                return new Error("Missing field " + E(e, n, r))
            },
            S = function(e, n, r) {
                return new Error("Invalid field " + E(e, n, r))
            };
        exports.encodeTransactionEnvelope = o, exports.encodeTransactionPayload = r;
    }, {
        "rlp": "mIAn",
        "buffer": "ARb5"
    }],
    "ahJU": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.resolveSignatures = t;
        var e = require("@onflow/interaction"),
            a = require("@onflow/encode");
        const r = "Transactions require at least one authoriztion";

        function n(e) {
            return "function" == typeof e
        }

        function s(e) {
            return Array.isArray(e)
        }
        async function t(r) {
            if (!(0, e.isTransaction)(r)) return (0, e.Ok)(r);
            let n = r.authorizations.map(e => r.accounts[e]);
            const s = r.accounts[r.payer],
                t = r.accounts[r.proposer],
                o = (0, a.encodeTransactionPayload)({
                    script: r.message.cadence,
                    refBlock: r.message.refBlock || null,
                    gasLimit: r.message.computeLimit,
                    proposalKey: {
                        address: t.addr,
                        keyId: t.keyId,
                        sequenceNum: t.sequenceNum
                    },
                    payer: s.addr,
                    authorizers: n.map(e => e.addr)
                }),
                d = n.map(async function(e) {
                    if (e.addr === s.addr) return void(r.accounts[e.tempId] = {
                        ...r.accounts[e.tempId],
                        signature: null
                    });
                    const a = await e.signingFunction({
                        message: o,
                        addr: e.addr,
                        keyId: e.keyId,
                        roles: {
                            proposer: t.addr === e.addr,
                            authorizer: !0,
                            payer: s.addr === e.addr
                        },
                        interaction: r
                    });
                    r.accounts[e.tempId] = {
                        ...r.accounts[e.tempId],
                        signature: a.signature
                    }
                });
            await Promise.all(d), n = r.authorizations.map(e => r.accounts[e]);
            const i = (0, a.encodeTransactionEnvelope)({
                    script: r.message.cadence,
                    refBlock: r.message.refBlock || null,
                    gasLimit: r.message.computeLimit,
                    proposalKey: {
                        address: t.addr,
                        keyId: t.keyId,
                        sequenceNum: t.sequenceNum
                    },
                    payer: s.addr,
                    authorizers: n.map(e => e.addr),
                    payloadSigs: n.map(e => null === e.signature ? null : {
                        address: e.addr,
                        keyId: e.keyId,
                        sig: e.signature
                    }).filter(e => null !== e)
                }),
                c = await s.signingFunction({
                    message: i,
                    addr: s.addr,
                    keyId: s.keyId,
                    roles: {
                        proposer: t.addr === s.addr,
                        authorizer: Boolean(n.find(e => e.addr === s.addr)),
                        payer: !0
                    },
                    interaction: r
                });
            return r.accounts[r.payer] = {
                ...r.accounts[r.payer],
                signature: c.signature
            }, (0, e.Ok)(r)
        }
    }, {
        "@onflow/interaction": "FaBc",
        "@onflow/encode": "yiVV"
    }],
    "rjjY": [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), Object.defineProperty(exports, "build", {
            enumerable: !0,
            get: function() {
                return e.build
            }
        }), Object.defineProperty(exports, "resolve", {
            enumerable: !0,
            get: function() {
                return r.resolve
            }
        }), Object.defineProperty(exports, "send", {
            enumerable: !0,
            get: function() {
                return t.send
            }
        }), Object.defineProperty(exports, "decode", {
            enumerable: !0,
            get: function() {
                return n.decode
            }
        }), Object.defineProperty(exports, "decodeResponse", {
            enumerable: !0,
            get: function() {
                return n.decodeResponse
            }
        }), Object.defineProperty(exports, "isOk", {
            enumerable: !0,
            get: function() {
                return o.isOk
            }
        }), Object.defineProperty(exports, "isBad", {
            enumerable: !0,
            get: function() {
                return o.isBad
            }
        }), Object.defineProperty(exports, "why", {
            enumerable: !0,
            get: function() {
                return o.why
            }
        }), Object.defineProperty(exports, "pipe", {
            enumerable: !0,
            get: function() {
                return o.pipe
            }
        }), Object.defineProperty(exports, "cadence", {
            enumerable: !0,
            get: function() {
                return u.templar
            }
        }), Object.defineProperty(exports, "cdc", {
            enumerable: !0,
            get: function() {
                return u.templar
            }
        }), Object.defineProperty(exports, "authorizations", {
            enumerable: !0,
            get: function() {
                return i.authorizations
            }
        }), Object.defineProperty(exports, "authorization", {
            enumerable: !0,
            get: function() {
                return i.authorization
            }
        }), Object.defineProperty(exports, "getAccount", {
            enumerable: !0,
            get: function() {
                return s.getAccount
            }
        }), Object.defineProperty(exports, "getEvents", {
            enumerable: !0,
            get: function() {
                return c.getEvents
            }
        }), Object.defineProperty(exports, "getLatestBlock", {
            enumerable: !0,
            get: function() {
                return a.getLatestBlock
            }
        }), Object.defineProperty(exports, "getTransactionStatus", {
            enumerable: !0,
            get: function() {
                return p.getTransactionStatus
            }
        }), Object.defineProperty(exports, "limit", {
            enumerable: !0,
            get: function() {
                return b.limit
            }
        }), Object.defineProperty(exports, "params", {
            enumerable: !0,
            get: function() {
                return l.params
            }
        }), Object.defineProperty(exports, "param", {
            enumerable: !0,
            get: function() {
                return l.param
            }
        }), Object.defineProperty(exports, "proposer", {
            enumerable: !0,
            get: function() {
                return f.proposer
            }
        }), Object.defineProperty(exports, "payer", {
            enumerable: !0,
            get: function() {
                return d.payer
            }
        }), Object.defineProperty(exports, "ping", {
            enumerable: !0,
            get: function() {
                return g.ping
            }
        }), Object.defineProperty(exports, "ref", {
            enumerable: !0,
            get: function() {
                return m.ref
            }
        }), Object.defineProperty(exports, "script", {
            enumerable: !0,
            get: function() {
                return y.script
            }
        }), Object.defineProperty(exports, "transaction", {
            enumerable: !0,
            get: function() {
                return O.transaction
            }
        }), Object.defineProperty(exports, "resolveAccounts", {
            enumerable: !0,
            get: function() {
                return P.resolveAccounts
            }
        }), Object.defineProperty(exports, "resolveParams", {
            enumerable: !0,
            get: function() {
                return j.resolveParams
            }
        }), Object.defineProperty(exports, "resolveSignatures", {
            enumerable: !0,
            get: function() {
                return x.resolveSignatures
            }
        });
        var e = require("./build"),
            r = require("./resolve"),
            t = require("@onflow/send"),
            n = require("@onflow/decode"),
            o = require("@onflow/interaction"),
            u = require("@qvvg/templar"),
            i = require("./build/authorizations"),
            s = require("./build/get-account"),
            c = require("./build/get-events"),
            a = require("./build/get-latest-block"),
            p = require("./build/get-transaction-status"),
            b = require("./build/limit"),
            l = require("./build/params"),
            f = require("./build/proposer"),
            d = require("./build/payer"),
            g = require("./build/ping"),
            m = require("./build/ref"),
            y = require("./build/script"),
            O = require("./build/transaction"),
            P = require("./resolve/resolve-accounts"),
            j = require("./resolve/resolve-params"),
            x = require("./resolve/resolve-signatures");
    }, {
        "./build": "JBCS",
        "./resolve": "UIhZ",
        "@onflow/send": "HjM1",
        "@onflow/decode": "HpQW",
        "@onflow/interaction": "FaBc",
        "@qvvg/templar": "IL6F",
        "./build/authorizations": "SPk7",
        "./build/get-account": "LuDD",
        "./build/get-events": "Yrh0",
        "./build/get-latest-block": "xEs7",
        "./build/get-transaction-status": "FU6l",
        "./build/limit": "JVCQ",
        "./build/params": "fMt9",
        "./build/proposer": "tAA3",
        "./build/payer": "cw41",
        "./build/ping": "HDYO",
        "./build/ref": "rnBx",
        "./build/script": "ebx1",
        "./build/transaction": "feDD",
        "./resolve/resolve-accounts": "BwdW",
        "./resolve/resolve-params": "S3gV",
        "./resolve/resolve-signatures": "ahJU"
    }]
}, {}, ["rjjY"], null)
//# sourceMappingURL=/sdk.js.map

const x = (() => {
	const exports = {};
	const module = {exports};
	return parcelRequire.call(globalThis, "rjjY", module, exports);
})();
export default x;
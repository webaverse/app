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
        "eDg8": [function(require, module, exports) {
            var define;
            var e;
            ! function(t, r) {
                "object" == typeof exports && "object" == typeof module ? module.exports = r() : "function" == typeof e && e.amd ? e([], r) : "object" == typeof exports ? exports.bowser = r() : t.bowser = r()
            }(this, function() {
                return function(e) {
                    var t = {};

                    function r(n) {
                        if (t[n]) return t[n].exports;
                        var i = t[n] = {
                            i: n,
                            l: !1,
                            exports: {}
                        };
                        return e[n].call(i.exports, i, i.exports, r), i.l = !0, i.exports
                    }
                    return r.m = e, r.c = t, r.d = function(e, t, n) {
                        r.o(e, t) || Object.defineProperty(e, t, {
                            enumerable: !0,
                            get: n
                        })
                    }, r.r = function(e) {
                        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                            value: "Module"
                        }), Object.defineProperty(e, "__esModule", {
                            value: !0
                        })
                    }, r.t = function(e, t) {
                        if (1 & t && (e = r(e)), 8 & t) return e;
                        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
                        var n = Object.create(null);
                        if (r.r(n), Object.defineProperty(n, "default", {
                                enumerable: !0,
                                value: e
                            }), 2 & t && "string" != typeof e)
                            for (var i in e) r.d(n, i, function(t) {
                                return e[t]
                            }.bind(null, i));
                        return n
                    }, r.n = function(e) {
                        var t = e && e.__esModule ? function() {
                            return e.default
                        } : function() {
                            return e
                        };
                        return r.d(t, "a", t), t
                    }, r.o = function(e, t) {
                        return Object.prototype.hasOwnProperty.call(e, t)
                    }, r.p = "", r(r.s = 90)
                }({
                    17: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n = r(18),
                            i = function() {
                                function e() {}
                                return e.getFirstMatch = function(e, t) {
                                    var r = t.match(e);
                                    return r && r.length > 0 && r[1] || ""
                                }, e.getSecondMatch = function(e, t) {
                                    var r = t.match(e);
                                    return r && r.length > 1 && r[2] || ""
                                }, e.matchAndReturnConst = function(e, t, r) {
                                    if (e.test(t)) return r
                                }, e.getWindowsVersionName = function(e) {
                                    switch (e) {
                                        case "NT":
                                            return "NT";
                                        case "XP":
                                            return "XP";
                                        case "NT 5.0":
                                            return "2000";
                                        case "NT 5.1":
                                            return "XP";
                                        case "NT 5.2":
                                            return "2003";
                                        case "NT 6.0":
                                            return "Vista";
                                        case "NT 6.1":
                                            return "7";
                                        case "NT 6.2":
                                            return "8";
                                        case "NT 6.3":
                                            return "8.1";
                                        case "NT 10.0":
                                            return "10";
                                        default:
                                            return
                                    }
                                }, e.getMacOSVersionName = function(e) {
                                    var t = e.split(".").splice(0, 2).map(function(e) {
                                        return parseInt(e, 10) || 0
                                    });
                                    if (t.push(0), 10 === t[0]) switch (t[1]) {
                                        case 5:
                                            return "Leopard";
                                        case 6:
                                            return "Snow Leopard";
                                        case 7:
                                            return "Lion";
                                        case 8:
                                            return "Mountain Lion";
                                        case 9:
                                            return "Mavericks";
                                        case 10:
                                            return "Yosemite";
                                        case 11:
                                            return "El Capitan";
                                        case 12:
                                            return "Sierra";
                                        case 13:
                                            return "High Sierra";
                                        case 14:
                                            return "Mojave";
                                        case 15:
                                            return "Catalina";
                                        default:
                                            return
                                    }
                                }, e.getAndroidVersionName = function(e) {
                                    var t = e.split(".").splice(0, 2).map(function(e) {
                                        return parseInt(e, 10) || 0
                                    });
                                    if (t.push(0), !(1 === t[0] && t[1] < 5)) return 1 === t[0] && t[1] < 6 ? "Cupcake" : 1 === t[0] && t[1] >= 6 ? "Donut" : 2 === t[0] && t[1] < 2 ? "Eclair" : 2 === t[0] && 2 === t[1] ? "Froyo" : 2 === t[0] && t[1] > 2 ? "Gingerbread" : 3 === t[0] ? "Honeycomb" : 4 === t[0] && t[1] < 1 ? "Ice Cream Sandwich" : 4 === t[0] && t[1] < 4 ? "Jelly Bean" : 4 === t[0] && t[1] >= 4 ? "KitKat" : 5 === t[0] ? "Lollipop" : 6 === t[0] ? "Marshmallow" : 7 === t[0] ? "Nougat" : 8 === t[0] ? "Oreo" : 9 === t[0] ? "Pie" : void 0
                                }, e.getVersionPrecision = function(e) {
                                    return e.split(".").length
                                }, e.compareVersions = function(t, r, n) {
                                    void 0 === n && (n = !1);
                                    var i = e.getVersionPrecision(t),
                                        s = e.getVersionPrecision(r),
                                        o = Math.max(i, s),
                                        a = 0,
                                        u = e.map([t, r], function(t) {
                                            var r = o - e.getVersionPrecision(t),
                                                n = t + new Array(r + 1).join(".0");
                                            return e.map(n.split("."), function(e) {
                                                return new Array(20 - e.length).join("0") + e
                                            }).reverse()
                                        });
                                    for (n && (a = o - Math.min(i, s)), o -= 1; o >= a;) {
                                        if (u[0][o] > u[1][o]) return 1;
                                        if (u[0][o] === u[1][o]) {
                                            if (o === a) return 0;
                                            o -= 1
                                        } else if (u[0][o] < u[1][o]) return -1
                                    }
                                }, e.map = function(e, t) {
                                    var r, n = [];
                                    if (Array.prototype.map) return Array.prototype.map.call(e, t);
                                    for (r = 0; r < e.length; r += 1) n.push(t(e[r]));
                                    return n
                                }, e.find = function(e, t) {
                                    var r, n;
                                    if (Array.prototype.find) return Array.prototype.find.call(e, t);
                                    for (r = 0, n = e.length; r < n; r += 1) {
                                        var i = e[r];
                                        if (t(i, r)) return i
                                    }
                                }, e.assign = function(e) {
                                    for (var t, r, n = e, i = arguments.length, s = new Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++) s[o - 1] = arguments[o];
                                    if (Object.assign) return Object.assign.apply(Object, [e].concat(s));
                                    var a = function() {
                                        var e = s[t];
                                        "object" == typeof e && null !== e && Object.keys(e).forEach(function(t) {
                                            n[t] = e[t]
                                        })
                                    };
                                    for (t = 0, r = s.length; t < r; t += 1) a();
                                    return e
                                }, e.getBrowserAlias = function(e) {
                                    return n.BROWSER_ALIASES_MAP[e]
                                }, e.getBrowserTypeByAlias = function(e) {
                                    return n.BROWSER_MAP[e] || ""
                                }, e
                            }();
                        t.default = i, e.exports = t.default
                    },
                    18: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.ENGINE_MAP = t.OS_MAP = t.PLATFORMS_MAP = t.BROWSER_MAP = t.BROWSER_ALIASES_MAP = void 0, t.BROWSER_ALIASES_MAP = {
                            "Amazon Silk": "amazon_silk",
                            "Android Browser": "android",
                            Bada: "bada",
                            BlackBerry: "blackberry",
                            Chrome: "chrome",
                            Chromium: "chromium",
                            Electron: "electron",
                            Epiphany: "epiphany",
                            Firefox: "firefox",
                            Focus: "focus",
                            Generic: "generic",
                            "Google Search": "google_search",
                            Googlebot: "googlebot",
                            "Internet Explorer": "ie",
                            "K-Meleon": "k_meleon",
                            Maxthon: "maxthon",
                            "Microsoft Edge": "edge",
                            "MZ Browser": "mz",
                            "NAVER Whale Browser": "naver",
                            Opera: "opera",
                            "Opera Coast": "opera_coast",
                            PhantomJS: "phantomjs",
                            Puffin: "puffin",
                            QupZilla: "qupzilla",
                            QQ: "qq",
                            QQLite: "qqlite",
                            Safari: "safari",
                            Sailfish: "sailfish",
                            "Samsung Internet for Android": "samsung_internet",
                            SeaMonkey: "seamonkey",
                            Sleipnir: "sleipnir",
                            Swing: "swing",
                            Tizen: "tizen",
                            "UC Browser": "uc",
                            Vivaldi: "vivaldi",
                            "WebOS Browser": "webos",
                            WeChat: "wechat",
                            "Yandex Browser": "yandex",
                            Roku: "roku"
                        }, t.BROWSER_MAP = {
                            amazon_silk: "Amazon Silk",
                            android: "Android Browser",
                            bada: "Bada",
                            blackberry: "BlackBerry",
                            chrome: "Chrome",
                            chromium: "Chromium",
                            electron: "Electron",
                            epiphany: "Epiphany",
                            firefox: "Firefox",
                            focus: "Focus",
                            generic: "Generic",
                            googlebot: "Googlebot",
                            google_search: "Google Search",
                            ie: "Internet Explorer",
                            k_meleon: "K-Meleon",
                            maxthon: "Maxthon",
                            edge: "Microsoft Edge",
                            mz: "MZ Browser",
                            naver: "NAVER Whale Browser",
                            opera: "Opera",
                            opera_coast: "Opera Coast",
                            phantomjs: "PhantomJS",
                            puffin: "Puffin",
                            qupzilla: "QupZilla",
                            qq: "QQ Browser",
                            qqlite: "QQ Browser Lite",
                            safari: "Safari",
                            sailfish: "Sailfish",
                            samsung_internet: "Samsung Internet for Android",
                            seamonkey: "SeaMonkey",
                            sleipnir: "Sleipnir",
                            swing: "Swing",
                            tizen: "Tizen",
                            uc: "UC Browser",
                            vivaldi: "Vivaldi",
                            webos: "WebOS Browser",
                            wechat: "WeChat",
                            yandex: "Yandex Browser"
                        }, t.PLATFORMS_MAP = {
                            tablet: "tablet",
                            mobile: "mobile",
                            desktop: "desktop",
                            tv: "tv"
                        }, t.OS_MAP = {
                            WindowsPhone: "Windows Phone",
                            Windows: "Windows",
                            MacOS: "macOS",
                            iOS: "iOS",
                            Android: "Android",
                            WebOS: "WebOS",
                            BlackBerry: "BlackBerry",
                            Bada: "Bada",
                            Tizen: "Tizen",
                            Linux: "Linux",
                            ChromeOS: "Chrome OS",
                            PlayStation4: "PlayStation 4",
                            Roku: "Roku"
                        }, t.ENGINE_MAP = {
                            EdgeHTML: "EdgeHTML",
                            Blink: "Blink",
                            Trident: "Trident",
                            Presto: "Presto",
                            Gecko: "Gecko",
                            WebKit: "WebKit"
                        }
                    },
                    90: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n, i = (n = r(91)) && n.__esModule ? n : {
                                default: n
                            },
                            s = r(18);

                        function o(e, t) {
                            for (var r = 0; r < t.length; r++) {
                                var n = t[r];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
                            }
                        }
                        var a = function() {
                            function e() {}
                            var t, r;
                            return e.getParser = function(e, t) {
                                if (void 0 === t && (t = !1), "string" != typeof e) throw new Error("UserAgent should be a string");
                                return new i.default(e, t)
                            }, e.parse = function(e) {
                                return new i.default(e).getResult()
                            }, t = e, r = [{
                                key: "BROWSER_MAP",
                                get: function() {
                                    return s.BROWSER_MAP
                                }
                            }, {
                                key: "ENGINE_MAP",
                                get: function() {
                                    return s.ENGINE_MAP
                                }
                            }, {
                                key: "OS_MAP",
                                get: function() {
                                    return s.OS_MAP
                                }
                            }, {
                                key: "PLATFORMS_MAP",
                                get: function() {
                                    return s.PLATFORMS_MAP
                                }
                            }], null && o(t.prototype, null), r && o(t, r), e
                        }();
                        t.default = a, e.exports = t.default
                    },
                    91: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n = u(r(92)),
                            i = u(r(93)),
                            s = u(r(94)),
                            o = u(r(95)),
                            a = u(r(17));

                        function u(e) {
                            return e && e.__esModule ? e : {
                                default: e
                            }
                        }
                        var d = function() {
                            function e(e, t) {
                                if (void 0 === t && (t = !1), null == e || "" === e) throw new Error("UserAgent parameter can't be empty");
                                this._ua = e, this.parsedResult = {}, !0 !== t && this.parse()
                            }
                            var t = e.prototype;
                            return t.getUA = function() {
                                return this._ua
                            }, t.test = function(e) {
                                return e.test(this._ua)
                            }, t.parseBrowser = function() {
                                var e = this;
                                this.parsedResult.browser = {};
                                var t = a.default.find(n.default, function(t) {
                                    if ("function" == typeof t.test) return t.test(e);
                                    if (t.test instanceof Array) return t.test.some(function(t) {
                                        return e.test(t)
                                    });
                                    throw new Error("Browser's test function is not valid")
                                });
                                return t && (this.parsedResult.browser = t.describe(this.getUA())), this.parsedResult.browser
                            }, t.getBrowser = function() {
                                return this.parsedResult.browser ? this.parsedResult.browser : this.parseBrowser()
                            }, t.getBrowserName = function(e) {
                                return e ? String(this.getBrowser().name).toLowerCase() || "" : this.getBrowser().name || ""
                            }, t.getBrowserVersion = function() {
                                return this.getBrowser().version
                            }, t.getOS = function() {
                                return this.parsedResult.os ? this.parsedResult.os : this.parseOS()
                            }, t.parseOS = function() {
                                var e = this;
                                this.parsedResult.os = {};
                                var t = a.default.find(i.default, function(t) {
                                    if ("function" == typeof t.test) return t.test(e);
                                    if (t.test instanceof Array) return t.test.some(function(t) {
                                        return e.test(t)
                                    });
                                    throw new Error("Browser's test function is not valid")
                                });
                                return t && (this.parsedResult.os = t.describe(this.getUA())), this.parsedResult.os
                            }, t.getOSName = function(e) {
                                var t = this.getOS().name;
                                return e ? String(t).toLowerCase() || "" : t || ""
                            }, t.getOSVersion = function() {
                                return this.getOS().version
                            }, t.getPlatform = function() {
                                return this.parsedResult.platform ? this.parsedResult.platform : this.parsePlatform()
                            }, t.getPlatformType = function(e) {
                                void 0 === e && (e = !1);
                                var t = this.getPlatform().type;
                                return e ? String(t).toLowerCase() || "" : t || ""
                            }, t.parsePlatform = function() {
                                var e = this;
                                this.parsedResult.platform = {};
                                var t = a.default.find(s.default, function(t) {
                                    if ("function" == typeof t.test) return t.test(e);
                                    if (t.test instanceof Array) return t.test.some(function(t) {
                                        return e.test(t)
                                    });
                                    throw new Error("Browser's test function is not valid")
                                });
                                return t && (this.parsedResult.platform = t.describe(this.getUA())), this.parsedResult.platform
                            }, t.getEngine = function() {
                                return this.parsedResult.engine ? this.parsedResult.engine : this.parseEngine()
                            }, t.getEngineName = function(e) {
                                return e ? String(this.getEngine().name).toLowerCase() || "" : this.getEngine().name || ""
                            }, t.parseEngine = function() {
                                var e = this;
                                this.parsedResult.engine = {};
                                var t = a.default.find(o.default, function(t) {
                                    if ("function" == typeof t.test) return t.test(e);
                                    if (t.test instanceof Array) return t.test.some(function(t) {
                                        return e.test(t)
                                    });
                                    throw new Error("Browser's test function is not valid")
                                });
                                return t && (this.parsedResult.engine = t.describe(this.getUA())), this.parsedResult.engine
                            }, t.parse = function() {
                                return this.parseBrowser(), this.parseOS(), this.parsePlatform(), this.parseEngine(), this
                            }, t.getResult = function() {
                                return a.default.assign({}, this.parsedResult)
                            }, t.satisfies = function(e) {
                                var t = this,
                                    r = {},
                                    n = 0,
                                    i = {},
                                    s = 0;
                                if (Object.keys(e).forEach(function(t) {
                                        var o = e[t];
                                        "string" == typeof o ? (i[t] = o, s += 1) : "object" == typeof o && (r[t] = o, n += 1)
                                    }), n > 0) {
                                    var o = Object.keys(r),
                                        u = a.default.find(o, function(e) {
                                            return t.isOS(e)
                                        });
                                    if (u) {
                                        var d = this.satisfies(r[u]);
                                        if (void 0 !== d) return d
                                    }
                                    var c = a.default.find(o, function(e) {
                                        return t.isPlatform(e)
                                    });
                                    if (c) {
                                        var f = this.satisfies(r[c]);
                                        if (void 0 !== f) return f
                                    }
                                }
                                if (s > 0) {
                                    var l = Object.keys(i),
                                        h = a.default.find(l, function(e) {
                                            return t.isBrowser(e, !0)
                                        });
                                    if (void 0 !== h) return this.compareVersion(i[h])
                                }
                            }, t.isBrowser = function(e, t) {
                                void 0 === t && (t = !1);
                                var r = this.getBrowserName().toLowerCase(),
                                    n = e.toLowerCase(),
                                    i = a.default.getBrowserTypeByAlias(n);
                                return t && i && (n = i.toLowerCase()), n === r
                            }, t.compareVersion = function(e) {
                                var t = [0],
                                    r = e,
                                    n = !1,
                                    i = this.getBrowserVersion();
                                if ("string" == typeof i) return ">" === e[0] || "<" === e[0] ? (r = e.substr(1), "=" === e[1] ? (n = !0, r = e.substr(2)) : t = [], ">" === e[0] ? t.push(1) : t.push(-1)) : "=" === e[0] ? r = e.substr(1) : "~" === e[0] && (n = !0, r = e.substr(1)), t.indexOf(a.default.compareVersions(i, r, n)) > -1
                            }, t.isOS = function(e) {
                                return this.getOSName(!0) === String(e).toLowerCase()
                            }, t.isPlatform = function(e) {
                                return this.getPlatformType(!0) === String(e).toLowerCase()
                            }, t.isEngine = function(e) {
                                return this.getEngineName(!0) === String(e).toLowerCase()
                            }, t.is = function(e) {
                                return this.isBrowser(e) || this.isOS(e) || this.isPlatform(e)
                            }, t.some = function(e) {
                                var t = this;
                                return void 0 === e && (e = []), e.some(function(e) {
                                    return t.is(e)
                                })
                            }, e
                        }();
                        t.default = d, e.exports = t.default
                    },
                    92: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n, i = (n = r(17)) && n.__esModule ? n : {
                                default: n
                            },
                            s = /version\/(\d+(\.?_?\d+)+)/i,
                            o = [{
                                test: [/googlebot/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Googlebot"
                                        },
                                        r = i.default.getFirstMatch(/googlebot\/(\d+(\.\d+))/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/opera/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Opera"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:opera)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/opr\/|opios/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Opera"
                                        },
                                        r = i.default.getFirstMatch(/(?:opr|opios)[\s\/](\S+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/SamsungBrowser/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Samsung Internet for Android"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/Whale/i],
                                describe: function(e) {
                                    var t = {
                                            name: "NAVER Whale Browser"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:whale)[\s\/](\d+(?:\.\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/MZBrowser/i],
                                describe: function(e) {
                                    var t = {
                                            name: "MZ Browser"
                                        },
                                        r = i.default.getFirstMatch(/(?:MZBrowser)[\s\/](\d+(?:\.\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/focus/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Focus"
                                        },
                                        r = i.default.getFirstMatch(/(?:focus)[\s\/](\d+(?:\.\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/swing/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Swing"
                                        },
                                        r = i.default.getFirstMatch(/(?:swing)[\s\/](\d+(?:\.\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/coast/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Opera Coast"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:coast)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/yabrowser/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Yandex Browser"
                                        },
                                        r = i.default.getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/ucbrowser/i],
                                describe: function(e) {
                                    var t = {
                                            name: "UC Browser"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:ucbrowser)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/Maxthon|mxios/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Maxthon"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:Maxthon|mxios)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/epiphany/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Epiphany"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:epiphany)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/puffin/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Puffin"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:puffin)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/sleipnir/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Sleipnir"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:sleipnir)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/k-meleon/i],
                                describe: function(e) {
                                    var t = {
                                            name: "K-Meleon"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/(?:k-meleon)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/micromessenger/i],
                                describe: function(e) {
                                    var t = {
                                            name: "WeChat"
                                        },
                                        r = i.default.getFirstMatch(/(?:micromessenger)[\s\/](\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/qqbrowser/i],
                                describe: function(e) {
                                    var t = {
                                            name: /qqbrowserlite/i.test(e) ? "QQ Browser Lite" : "QQ Browser"
                                        },
                                        r = i.default.getFirstMatch(/(?:qqbrowserlite|qqbrowser)[\/](\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/msie|trident/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Internet Explorer"
                                        },
                                        r = i.default.getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/\sedg\//i],
                                describe: function(e) {
                                    var t = {
                                            name: "Microsoft Edge"
                                        },
                                        r = i.default.getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/edg([ea]|ios)/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Microsoft Edge"
                                        },
                                        r = i.default.getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/vivaldi/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Vivaldi"
                                        },
                                        r = i.default.getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/seamonkey/i],
                                describe: function(e) {
                                    var t = {
                                            name: "SeaMonkey"
                                        },
                                        r = i.default.getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/sailfish/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Sailfish"
                                        },
                                        r = i.default.getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/silk/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Amazon Silk"
                                        },
                                        r = i.default.getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/phantom/i],
                                describe: function(e) {
                                    var t = {
                                            name: "PhantomJS"
                                        },
                                        r = i.default.getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/slimerjs/i],
                                describe: function(e) {
                                    var t = {
                                            name: "SlimerJS"
                                        },
                                        r = i.default.getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
                                describe: function(e) {
                                    var t = {
                                            name: "BlackBerry"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/(web|hpw)[o0]s/i],
                                describe: function(e) {
                                    var t = {
                                            name: "WebOS Browser"
                                        },
                                        r = i.default.getFirstMatch(s, e) || i.default.getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/bada/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Bada"
                                        },
                                        r = i.default.getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/tizen/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Tizen"
                                        },
                                        r = i.default.getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/qupzilla/i],
                                describe: function(e) {
                                    var t = {
                                            name: "QupZilla"
                                        },
                                        r = i.default.getFirstMatch(/(?:qupzilla)[\s\/](\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/firefox|iceweasel|fxios/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Firefox"
                                        },
                                        r = i.default.getFirstMatch(/(?:firefox|iceweasel|fxios)[\s\/](\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/electron/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Electron"
                                        },
                                        r = i.default.getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/chromium/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Chromium"
                                        },
                                        r = i.default.getFirstMatch(/(?:chromium)[\s\/](\d+(\.?_?\d+)+)/i, e) || i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/chrome|crios|crmo/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Chrome"
                                        },
                                        r = i.default.getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/GSA/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Google Search"
                                        },
                                        r = i.default.getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: function(e) {
                                    var t = !e.test(/like android/i),
                                        r = e.test(/android/i);
                                    return t && r
                                },
                                describe: function(e) {
                                    var t = {
                                            name: "Android Browser"
                                        },
                                        r = i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/playstation 4/i],
                                describe: function(e) {
                                    var t = {
                                            name: "PlayStation 4"
                                        },
                                        r = i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/safari|applewebkit/i],
                                describe: function(e) {
                                    var t = {
                                            name: "Safari"
                                        },
                                        r = i.default.getFirstMatch(s, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/.*/i],
                                describe: function(e) {
                                    var t = -1 !== e.search("\\(") ? /^(.*)\/(.*)[ \t]\((.*)/ : /^(.*)\/(.*) /;
                                    return {
                                        name: i.default.getFirstMatch(t, e),
                                        version: i.default.getSecondMatch(t, e)
                                    }
                                }
                            }];
                        t.default = o, e.exports = t.default
                    },
                    93: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n, i = (n = r(17)) && n.__esModule ? n : {
                                default: n
                            },
                            s = r(18),
                            o = [{
                                test: [/Roku\/DVP/],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/Roku\/DVP-(\d+\.\d+)/i, e);
                                    return {
                                        name: s.OS_MAP.Roku,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/windows phone/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i, e);
                                    return {
                                        name: s.OS_MAP.WindowsPhone,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/windows /i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i, e),
                                        r = i.default.getWindowsVersionName(t);
                                    return {
                                        name: s.OS_MAP.Windows,
                                        version: t,
                                        versionName: r
                                    }
                                }
                            }, {
                                test: [/Macintosh(.*?) FxiOS(.*?) Version\//],
                                describe: function(e) {
                                    var t = i.default.getSecondMatch(/(Version\/)(\d[\d.]+)/, e);
                                    return {
                                        name: s.OS_MAP.iOS,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/macintosh/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/mac os x (\d+(\.?_?\d+)+)/i, e).replace(/[_\s]/g, "."),
                                        r = i.default.getMacOSVersionName(t),
                                        n = {
                                            name: s.OS_MAP.MacOS,
                                            version: t
                                        };
                                    return r && (n.versionName = r), n
                                }
                            }, {
                                test: [/(ipod|iphone|ipad)/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i, e).replace(/[_\s]/g, ".");
                                    return {
                                        name: s.OS_MAP.iOS,
                                        version: t
                                    }
                                }
                            }, {
                                test: function(e) {
                                    var t = !e.test(/like android/i),
                                        r = e.test(/android/i);
                                    return t && r
                                },
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/android[\s\/-](\d+(\.\d+)*)/i, e),
                                        r = i.default.getAndroidVersionName(t),
                                        n = {
                                            name: s.OS_MAP.Android,
                                            version: t
                                        };
                                    return r && (n.versionName = r), n
                                }
                            }, {
                                test: [/(web|hpw)[o0]s/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/(?:web|hpw)[o0]s\/(\d+(\.\d+)*)/i, e),
                                        r = {
                                            name: s.OS_MAP.WebOS
                                        };
                                    return t && t.length && (r.version = t), r
                                }
                            }, {
                                test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i, e) || i.default.getFirstMatch(/blackberry\d+\/(\d+([_\s]\d+)*)/i, e) || i.default.getFirstMatch(/\bbb(\d+)/i, e);
                                    return {
                                        name: s.OS_MAP.BlackBerry,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/bada/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/bada\/(\d+(\.\d+)*)/i, e);
                                    return {
                                        name: s.OS_MAP.Bada,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/tizen/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i, e);
                                    return {
                                        name: s.OS_MAP.Tizen,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/linux/i],
                                describe: function() {
                                    return {
                                        name: s.OS_MAP.Linux
                                    }
                                }
                            }, {
                                test: [/CrOS/],
                                describe: function() {
                                    return {
                                        name: s.OS_MAP.ChromeOS
                                    }
                                }
                            }, {
                                test: [/PlayStation 4/],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/PlayStation 4[\/\s](\d+(\.\d+)*)/i, e);
                                    return {
                                        name: s.OS_MAP.PlayStation4,
                                        version: t
                                    }
                                }
                            }];
                        t.default = o, e.exports = t.default
                    },
                    94: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n, i = (n = r(17)) && n.__esModule ? n : {
                                default: n
                            },
                            s = r(18),
                            o = [{
                                test: [/googlebot/i],
                                describe: function() {
                                    return {
                                        type: "bot",
                                        vendor: "Google"
                                    }
                                }
                            }, {
                                test: [/huawei/i],
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/(can-l01)/i, e) && "Nova",
                                        r = {
                                            type: s.PLATFORMS_MAP.mobile,
                                            vendor: "Huawei"
                                        };
                                    return t && (r.model = t), r
                                }
                            }, {
                                test: [/nexus\s*(?:7|8|9|10).*/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet,
                                        vendor: "Nexus"
                                    }
                                }
                            }, {
                                test: [/ipad/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet,
                                        vendor: "Apple",
                                        model: "iPad"
                                    }
                                }
                            }, {
                                test: [/Macintosh(.*?) FxiOS(.*?) Version\//],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet,
                                        vendor: "Apple",
                                        model: "iPad"
                                    }
                                }
                            }, {
                                test: [/kftt build/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet,
                                        vendor: "Amazon",
                                        model: "Kindle Fire HD 7"
                                    }
                                }
                            }, {
                                test: [/silk/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet,
                                        vendor: "Amazon"
                                    }
                                }
                            }, {
                                test: [/tablet(?! pc)/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet
                                    }
                                }
                            }, {
                                test: function(e) {
                                    var t = e.test(/ipod|iphone/i),
                                        r = e.test(/like (ipod|iphone)/i);
                                    return t && !r
                                },
                                describe: function(e) {
                                    var t = i.default.getFirstMatch(/(ipod|iphone)/i, e);
                                    return {
                                        type: s.PLATFORMS_MAP.mobile,
                                        vendor: "Apple",
                                        model: t
                                    }
                                }
                            }, {
                                test: [/nexus\s*[0-6].*/i, /galaxy nexus/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile,
                                        vendor: "Nexus"
                                    }
                                }
                            }, {
                                test: [/[^-]mobi/i],
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "blackberry" === e.getBrowserName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile,
                                        vendor: "BlackBerry"
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "bada" === e.getBrowserName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "windows phone" === e.getBrowserName()
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile,
                                        vendor: "Microsoft"
                                    }
                                }
                            }, {
                                test: function(e) {
                                    var t = Number(String(e.getOSVersion()).split(".")[0]);
                                    return "android" === e.getOSName(!0) && t >= 3
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tablet
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "android" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.mobile
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "macos" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.desktop,
                                        vendor: "Apple"
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "windows" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.desktop
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "linux" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.desktop
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "playstation 4" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tv
                                    }
                                }
                            }, {
                                test: function(e) {
                                    return "roku" === e.getOSName(!0)
                                },
                                describe: function() {
                                    return {
                                        type: s.PLATFORMS_MAP.tv
                                    }
                                }
                            }];
                        t.default = o, e.exports = t.default
                    },
                    95: function(e, t, r) {
                        "use strict";
                        t.__esModule = !0, t.default = void 0;
                        var n, i = (n = r(17)) && n.__esModule ? n : {
                                default: n
                            },
                            s = r(18),
                            o = [{
                                test: function(e) {
                                    return "microsoft edge" === e.getBrowserName(!0)
                                },
                                describe: function(e) {
                                    if (/\sedg\//i.test(e)) return {
                                        name: s.ENGINE_MAP.Blink
                                    };
                                    var t = i.default.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i, e);
                                    return {
                                        name: s.ENGINE_MAP.EdgeHTML,
                                        version: t
                                    }
                                }
                            }, {
                                test: [/trident/i],
                                describe: function(e) {
                                    var t = {
                                            name: s.ENGINE_MAP.Trident
                                        },
                                        r = i.default.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: function(e) {
                                    return e.test(/presto/i)
                                },
                                describe: function(e) {
                                    var t = {
                                            name: s.ENGINE_MAP.Presto
                                        },
                                        r = i.default.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: function(e) {
                                    var t = e.test(/gecko/i),
                                        r = e.test(/like gecko/i);
                                    return t && !r
                                },
                                describe: function(e) {
                                    var t = {
                                            name: s.ENGINE_MAP.Gecko
                                        },
                                        r = i.default.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }, {
                                test: [/(apple)?webkit\/537\.36/i],
                                describe: function() {
                                    return {
                                        name: s.ENGINE_MAP.Blink
                                    }
                                }
                            }, {
                                test: [/(apple)?webkit/i],
                                describe: function(e) {
                                    var t = {
                                            name: s.ENGINE_MAP.WebKit
                                        },
                                        r = i.default.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i, e);
                                    return r && (t.version = r), t
                                }
                            }];
                        t.default = o, e.exports = t.default
                    }
                })
            });
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
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("debug"),
                r = "mediasoup-client";
            class t {
                constructor(t) {
                    t ? (this._debug = e.default(`${r}:${t}`), this._warn = e.default(`${r}:WARN:${t}`), this._error = e.default(`${r}:ERROR:${t}`)) : (this._debug = e.default(r), this._warn = e.default(`${r}:WARN`), this._error = e.default(`${r}:ERROR`)), this._debug.log = console.info.bind(console), this._warn.log = console.warn.bind(console), this._error.log = console.error.bind(console)
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
            exports.Logger = t;
        }, {
            "debug": "BYFN"
        }],
        "p8GN": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            class r extends Error {
                constructor(t) {
                    super(t), this.name = "UnsupportedError", Error.hasOwnProperty("captureStackTrace") ? Error.captureStackTrace(this, r) : this.stack = new Error(t).stack
                }
            }
            exports.UnsupportedError = r;
            class t extends Error {
                constructor(r) {
                    super(r), this.name = "InvalidStateError", Error.hasOwnProperty("captureStackTrace") ? Error.captureStackTrace(this, t) : this.stack = new Error(r).stack
                }
            }
            exports.InvalidStateError = t;
        }, {}],
        "AoQt": [function(require, module, exports) {
            const e = require("debug")("h264-profile-level-id");
            e.log = console.info.bind(console);
            const r = 1,
                l = 2,
                o = 3,
                s = 4,
                t = 5;
            exports.ProfileConstrainedBaseline = 1, exports.ProfileBaseline = 2, exports.ProfileMain = 3, exports.ProfileConstrainedHigh = 4, exports.ProfileHigh = 5;
            const i = 0,
                n = 10,
                p = 11,
                f = 12,
                a = 13,
                c = 20,
                d = 21,
                v = 22,
                u = 30,
                x = 31,
                L = 32,
                w = 40,
                _ = 41,
                h = 42,
                P = 50,
                g = 51,
                I = 52;
            exports.Level1_b = i, exports.Level1 = n, exports.Level1_1 = 11, exports.Level1_2 = 12, exports.Level1_3 = 13, exports.Level2 = 20, exports.Level2_1 = 21, exports.Level2_2 = 22, exports.Level3 = 30, exports.Level3_1 = 31, exports.Level3_2 = 32, exports.Level4 = 40, exports.Level4_1 = 41, exports.Level4_2 = 42, exports.Level5 = 50, exports.Level5_1 = 51, exports.Level5_2 = 52;
            class b {
                constructor(e, r) {
                    this.profile = e, this.level = r
                }
            }
            exports.ProfileLevelId = b;
            const m = new b(1, 31),
                k = 16;
            class S {
                constructor(e) {
                    this._mask = ~z("x", e), this._maskedValue = z("1", e)
                }
                isMatch(e) {
                    return this._maskedValue === (e & this._mask)
                }
            }
            class T {
                constructor(e, r, l) {
                    this.profile_idc = e, this.profile_iop = r, this.profile = l
                }
            }
            const y = [new T(66, new S("x1xx0000"), 1), new T(77, new S("1xxx0000"), 1), new T(88, new S("11xx0000"), 1), new T(66, new S("x0xx0000"), 2), new T(88, new S("10xx0000"), 2), new T(77, new S("0x0x0000"), 3), new T(100, new S("00000000"), 5), new T(100, new S("00001100"), 4)];

            function z(e, r) {
                return (r[0] === e) << 7 | (r[1] === e) << 6 | (r[2] === e) << 5 | (r[3] === e) << 4 | (r[4] === e) << 3 | (r[5] === e) << 2 | (r[6] === e) << 1 | (r[7] === e) << 0
            }

            function A(e, r) {
                return e === i ? r !== n && r !== i : r === i ? e !== n : e < r
            }

            function B(e, r) {
                return A(e, r) ? e : r
            }

            function E(e = {}) {
                const r = e["level-asymmetry-allowed"];
                return 1 === r || "1" === r
            }
            exports.parseProfileLevelId = function(r) {
                if ("string" != typeof r || 6 !== r.length) return null;
                const l = parseInt(r, 16);
                if (0 === l) return null;
                const o = 255 & l,
                    s = l >> 8 & 255,
                    t = l >> 16 & 255;
                let p;
                switch (o) {
                    case 11:
                        p = 0 != (16 & s) ? i : 11;
                        break;
                    case n:
                    case 12:
                    case 13:
                    case 20:
                    case 21:
                    case 22:
                    case 30:
                    case 31:
                    case 32:
                    case 40:
                    case 41:
                    case 42:
                    case 50:
                    case 51:
                    case 52:
                        p = o;
                        break;
                    default:
                        return e("parseProfileLevelId() | unrecognized level_idc:%s", o), null
                }
                for (const e of y)
                    if (t === e.profile_idc && e.profile_iop.isMatch(s)) return new b(e.profile, p);
                return e("parseProfileLevelId() | unrecognized profile_idc/profile_iop combination"), null
            }, exports.profileLevelIdToString = function(r) {
                if (r.level == i) switch (r.profile) {
                    case 1:
                        return "42f00b";
                    case 2:
                        return "42100b";
                    case 3:
                        return "4d100b";
                    default:
                        return e("profileLevelIdToString() | Level 1_b not is allowed for profile:%s", r.profile), null
                }
                let l;
                switch (r.profile) {
                    case 1:
                        l = "42e0";
                        break;
                    case 2:
                        l = "4200";
                        break;
                    case 3:
                        l = "4d00";
                        break;
                    case 4:
                        l = "640c";
                        break;
                    case 5:
                        l = "6400";
                        break;
                    default:
                        return e("profileLevelIdToString() | unrecognized profile:%s", r.profile), null
                }
                let o = r.level.toString(16);
                return 1 === o.length && (o = `0${o}`), `${l}${o}`
            }, exports.parseSdpProfileLevelId = function(e = {}) {
                const r = e["profile-level-id"];
                return r ? exports.parseProfileLevelId(r) : m
            }, exports.isSameProfile = function(e = {}, r = {}) {
                const l = exports.parseSdpProfileLevelId(e),
                    o = exports.parseSdpProfileLevelId(r);
                return Boolean(l && o && l.profile === o.profile)
            }, exports.generateProfileLevelIdForAnswer = function(r = {}, l = {}) {
                if (!r["profile-level-id"] && !l["profile-level-id"]) return e("generateProfileLevelIdForAnswer() | no profile-level-id in local and remote params"), null;
                const o = exports.parseSdpProfileLevelId(r),
                    s = exports.parseSdpProfileLevelId(l);
                if (!o) throw new TypeError("invalid local_profile_level_id");
                if (!s) throw new TypeError("invalid remote_profile_level_id");
                if (o.profile !== s.profile) throw new TypeError("H264 Profile mismatch");
                const t = E(r) && E(l),
                    i = o.level,
                    n = B(i, s.level),
                    p = t ? i : n;
                return e("generateProfileLevelIdForAnswer() | result: [profile:%s, level:%s]", o.profile, p), exports.profileLevelIdToString(new b(o.profile, p))
            };
        }, {
            "debug": "BYFN"
        }],
        "FOZT": [function(require, module, exports) {
            "use strict";

            function e(e) {
                return "object" != typeof e ? {} : JSON.parse(JSON.stringify(e))
            }

            function t() {
                return Math.round(1e7 * Math.random())
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            }), exports.clone = e, exports.generateRandomNumber = t;
        }, {}],
        "alA0": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("h264-profile-level-id"),
                r = require("./utils"),
                t = "probator",
                o = 1234,
                n = 127;

            function a(e) {
                if ("object" != typeof e) throw new TypeError("caps is not an object");
                if (e.codecs && !Array.isArray(e.codecs)) throw new TypeError("caps.codecs is not an array");
                e.codecs || (e.codecs = []);
                for (const r of e.codecs) i(r);
                if (e.headerExtensions && !Array.isArray(e.headerExtensions)) throw new TypeError("caps.headerExtensions is not an array");
                e.headerExtensions || (e.headerExtensions = []);
                for (const r of e.headerExtensions) s(r)
            }

            function i(e) {
                const r = new RegExp("^(audio|video)/(.+)", "i");
                if ("object" != typeof e) throw new TypeError("codec is not an object");
                if (!e.mimeType || "string" != typeof e.mimeType) throw new TypeError("missing codec.mimeType");
                const t = r.exec(e.mimeType);
                if (!t) throw new TypeError("invalid codec.mimeType");
                if (e.kind = t[1].toLowerCase(), e.preferredPayloadType && "number" != typeof e.preferredPayloadType) throw new TypeError("invalid codec.preferredPayloadType");
                if ("number" != typeof e.clockRate) throw new TypeError("missing codec.clockRate");
                "audio" === e.kind ? "number" != typeof e.channels && (e.channels = 1) : delete e.channels, e.parameters && "object" == typeof e.parameters || (e.parameters = {});
                for (const o of Object.keys(e.parameters)) {
                    let r = e.parameters[o];
                    if (void 0 === r && (e.parameters[o] = "", r = ""), "string" != typeof r && "number" != typeof r) throw new TypeError(`invalid codec parameter [key:${o}s, value:${r}]`);
                    if ("apt" === o && "number" != typeof r) throw new TypeError("invalid codec apt parameter")
                }
                e.rtcpFeedback && Array.isArray(e.rtcpFeedback) || (e.rtcpFeedback = []);
                for (const o of e.rtcpFeedback) c(o)
            }

            function c(e) {
                if ("object" != typeof e) throw new TypeError("fb is not an object");
                if (!e.type || "string" != typeof e.type) throw new TypeError("missing fb.type");
                e.parameter && "string" == typeof e.parameter || (e.parameter = "")
            }

            function s(e) {
                if ("object" != typeof e) throw new TypeError("ext is not an object");
                if (e.kind && "string" == typeof e.kind || (e.kind = ""), "" !== e.kind && "audio" !== e.kind && "video" !== e.kind) throw new TypeError("invalid ext.kind");
                if (!e.uri || "string" != typeof e.uri) throw new TypeError("missing ext.uri");
                if ("number" != typeof e.preferredId) throw new TypeError("missing ext.preferredId");
                if (e.preferredEncrypt && "boolean" != typeof e.preferredEncrypt) throw new TypeError("invalid ext.preferredEncrypt");
                if (e.preferredEncrypt || (e.preferredEncrypt = !1), e.direction && "string" != typeof e.direction) throw new TypeError("invalid ext.direction");
                e.direction || (e.direction = "sendrecv")
            }

            function p(e) {
                if ("object" != typeof e) throw new TypeError("params is not an object");
                if (e.mid && "string" != typeof e.mid) throw new TypeError("params.mid is not a string");
                if (!Array.isArray(e.codecs)) throw new TypeError("missing params.codecs");
                for (const r of e.codecs) d(r);
                if (e.headerExtensions && !Array.isArray(e.headerExtensions)) throw new TypeError("params.headerExtensions is not an array");
                e.headerExtensions || (e.headerExtensions = []);
                for (const r of e.headerExtensions) y(r);
                if (e.encodings && !Array.isArray(e.encodings)) throw new TypeError("params.encodings is not an array");
                e.encodings || (e.encodings = []);
                for (const r of e.encodings) f(r);
                if (e.rtcp && "object" != typeof e.rtcp) throw new TypeError("params.rtcp is not an object");
                e.rtcp || (e.rtcp = {}), m(e.rtcp)
            }

            function d(e) {
                const r = new RegExp("^(audio|video)/(.+)", "i");
                if ("object" != typeof e) throw new TypeError("codec is not an object");
                if (!e.mimeType || "string" != typeof e.mimeType) throw new TypeError("missing codec.mimeType");
                const t = r.exec(e.mimeType);
                if (!t) throw new TypeError("invalid codec.mimeType");
                if ("number" != typeof e.payloadType) throw new TypeError("missing codec.payloadType");
                if ("number" != typeof e.clockRate) throw new TypeError("missing codec.clockRate");
                "audio" === t[1].toLowerCase() ? "number" != typeof e.channels && (e.channels = 1) : delete e.channels, e.parameters && "object" == typeof e.parameters || (e.parameters = {});
                for (const o of Object.keys(e.parameters)) {
                    let r = e.parameters[o];
                    if (void 0 === r && (e.parameters[o] = "", r = ""), "string" != typeof r && "number" != typeof r) throw new TypeError(`invalid codec parameter [key:${o}s, value:${r}]`);
                    if ("apt" === o && "number" != typeof r) throw new TypeError("invalid codec apt parameter")
                }
                e.rtcpFeedback && Array.isArray(e.rtcpFeedback) || (e.rtcpFeedback = []);
                for (const o of e.rtcpFeedback) c(o)
            }

            function y(e) {
                if ("object" != typeof e) throw new TypeError("ext is not an object");
                if (!e.uri || "string" != typeof e.uri) throw new TypeError("missing ext.uri");
                if ("number" != typeof e.id) throw new TypeError("missing ext.id");
                if (e.encrypt && "boolean" != typeof e.encrypt) throw new TypeError("invalid ext.encrypt");
                e.encrypt || (e.encrypt = !1), e.parameters && "object" == typeof e.parameters || (e.parameters = {});
                for (const r of Object.keys(e.parameters)) {
                    let t = e.parameters[r];
                    if (void 0 === t && (e.parameters[r] = "", t = ""), "string" != typeof t && "number" != typeof t) throw new TypeError("invalid header extension parameter")
                }
            }

            function f(e) {
                if ("object" != typeof e) throw new TypeError("encoding is not an object");
                if (e.ssrc && "number" != typeof e.ssrc) throw new TypeError("invalid encoding.ssrc");
                if (e.rid && "string" != typeof e.rid) throw new TypeError("invalid encoding.rid");
                if (e.rtx && "object" != typeof e.rtx) throw new TypeError("invalid encoding.rtx");
                if (e.rtx && "number" != typeof e.rtx.ssrc) throw new TypeError("missing encoding.rtx.ssrc");
                if (e.dtx && "boolean" == typeof e.dtx || (e.dtx = !1), e.scalabilityMode && "string" != typeof e.scalabilityMode) throw new TypeError("invalid encoding.scalabilityMode")
            }

            function m(e) {
                if ("object" != typeof e) throw new TypeError("rtcp is not an object");
                if (e.cname && "string" != typeof e.cname) throw new TypeError("invalid rtcp.cname");
                e.reducedSize && "boolean" == typeof e.reducedSize || (e.reducedSize = !0)
            }

            function l(e) {
                if ("object" != typeof e) throw new TypeError("caps is not an object");
                if (!e.numStreams || "object" != typeof e.numStreams) throw new TypeError("missing caps.numStreams");
                w(e.numStreams)
            }

            function w(e) {
                if ("object" != typeof e) throw new TypeError("numStreams is not an object");
                if ("number" != typeof e.OS) throw new TypeError("missing numStreams.OS");
                if ("number" != typeof e.MIS) throw new TypeError("missing numStreams.MIS")
            }

            function h(e) {
                if ("object" != typeof e) throw new TypeError("params is not an object");
                if ("number" != typeof e.port) throw new TypeError("missing params.port");
                if ("number" != typeof e.OS) throw new TypeError("missing params.OS");
                if ("number" != typeof e.MIS) throw new TypeError("missing params.MIS");
                if ("number" != typeof e.maxMessageSize) throw new TypeError("missing params.maxMessageSize")
            }

            function u(e) {
                if ("object" != typeof e) throw new TypeError("params is not an object");
                if ("number" != typeof e.streamId) throw new TypeError("missing params.streamId");
                let r = !1;
                if ("boolean" == typeof e.ordered ? r = !0 : e.ordered = !0, e.maxPacketLifeTime && "number" != typeof e.maxPacketLifeTime) throw new TypeError("invalid params.maxPacketLifeTime");
                if (e.maxRetransmits && "number" != typeof e.maxRetransmits) throw new TypeError("invalid params.maxRetransmits");
                if (e.maxPacketLifeTime && e.maxRetransmits) throw new TypeError("cannot provide both maxPacketLifeTime and maxRetransmits");
                if (r && e.ordered && (e.maxPacketLifeTime || e.maxRetransmits)) throw new TypeError("cannot be ordered with maxPacketLifeTime or maxRetransmits");
                if (r || !e.maxPacketLifeTime && !e.maxRetransmits || (e.ordered = !1), e.priority && "string" != typeof e.priority) throw new TypeError("invalid params.priority");
                if (e.label && "string" != typeof e.label) throw new TypeError("invalid params.label");
                if (e.protocol && "string" != typeof e.protocol) throw new TypeError("invalid params.protocol")
            }

            function T(e, r) {
                const t = {
                    codecs: [],
                    headerExtensions: []
                };
                for (const o of r.codecs || []) {
                    if (R(o)) continue;
                    const r = (e.codecs || []).find(e => j(e, o, {
                        strict: !0,
                        modify: !0
                    }));
                    if (!r) continue;
                    const n = {
                        mimeType: r.mimeType,
                        kind: r.kind,
                        clockRate: r.clockRate,
                        channels: r.channels,
                        localPayloadType: r.preferredPayloadType,
                        localRtxPayloadType: void 0,
                        remotePayloadType: o.preferredPayloadType,
                        remoteRtxPayloadType: void 0,
                        localParameters: r.parameters,
                        remoteParameters: o.parameters,
                        rtcpFeedback: F(r, o)
                    };
                    t.codecs.push(n)
                }
                for (const o of t.codecs) {
                    const t = e.codecs.find(e => R(e) && e.parameters.apt === o.localPayloadType),
                        n = r.codecs.find(e => R(e) && e.parameters.apt === o.remotePayloadType);
                    t && n && (o.localRtxPayloadType = t.preferredPayloadType, o.remoteRtxPayloadType = n.preferredPayloadType)
                }
                for (const o of r.headerExtensions) {
                    const r = e.headerExtensions.find(e => S(e, o));
                    if (!r) continue;
                    const n = {
                        kind: o.kind,
                        uri: o.uri,
                        sendId: r.preferredId,
                        recvId: o.preferredId,
                        encrypt: r.preferredEncrypt,
                        direction: "sendrecv"
                    };
                    switch (o.direction) {
                        case "sendrecv":
                            n.direction = "sendrecv";
                            break;
                        case "recvonly":
                            n.direction = "sendonly";
                            break;
                        case "sendonly":
                            n.direction = "recvonly";
                            break;
                        case "inactive":
                            n.direction = "inactive"
                    }
                    t.headerExtensions.push(n)
                }
                return t
            }

            function b(e) {
                const r = {
                    codecs: [],
                    headerExtensions: []
                };
                for (const t of e.codecs) {
                    const e = {
                        mimeType: t.mimeType,
                        kind: t.kind,
                        preferredPayloadType: t.remotePayloadType,
                        clockRate: t.clockRate,
                        channels: t.channels,
                        parameters: t.localParameters,
                        rtcpFeedback: t.rtcpFeedback
                    };
                    if (r.codecs.push(e), !t.remoteRtxPayloadType) continue;
                    const o = {
                        mimeType: `${t.kind}/rtx`,
                        kind: t.kind,
                        preferredPayloadType: t.remoteRtxPayloadType,
                        clockRate: t.clockRate,
                        parameters: {
                            apt: t.remotePayloadType
                        },
                        rtcpFeedback: []
                    };
                    r.codecs.push(o)
                }
                for (const t of e.headerExtensions) {
                    if ("sendrecv" !== t.direction && "recvonly" !== t.direction) continue;
                    const e = {
                        kind: t.kind,
                        uri: t.uri,
                        preferredId: t.recvId,
                        preferredEncrypt: t.encrypt,
                        direction: t.direction
                    };
                    r.headerExtensions.push(e)
                }
                return r
            }

            function x(e, r) {
                const t = {
                    mid: void 0,
                    codecs: [],
                    headerExtensions: [],
                    encodings: [],
                    rtcp: {}
                };
                for (const o of r.codecs) {
                    if (o.kind !== e) continue;
                    const r = {
                        mimeType: o.mimeType,
                        payloadType: o.localPayloadType,
                        clockRate: o.clockRate,
                        channels: o.channels,
                        parameters: o.localParameters,
                        rtcpFeedback: o.rtcpFeedback
                    };
                    if (t.codecs.push(r), o.localRtxPayloadType) {
                        const e = {
                            mimeType: `${o.kind}/rtx`,
                            payloadType: o.localRtxPayloadType,
                            clockRate: o.clockRate,
                            parameters: {
                                apt: o.localPayloadType
                            },
                            rtcpFeedback: []
                        };
                        t.codecs.push(e)
                    }
                }
                for (const o of r.headerExtensions) {
                    if (o.kind && o.kind !== e || "sendrecv" !== o.direction && "sendonly" !== o.direction) continue;
                    const r = {
                        uri: o.uri,
                        id: o.sendId,
                        encrypt: o.encrypt,
                        parameters: {}
                    };
                    t.headerExtensions.push(r)
                }
                return t
            }

            function E(e, r) {
                const t = {
                    mid: void 0,
                    codecs: [],
                    headerExtensions: [],
                    encodings: [],
                    rtcp: {}
                };
                for (const o of r.codecs) {
                    if (o.kind !== e) continue;
                    const r = {
                        mimeType: o.mimeType,
                        payloadType: o.localPayloadType,
                        clockRate: o.clockRate,
                        channels: o.channels,
                        parameters: o.remoteParameters,
                        rtcpFeedback: o.rtcpFeedback
                    };
                    if (t.codecs.push(r), o.localRtxPayloadType) {
                        const e = {
                            mimeType: `${o.kind}/rtx`,
                            payloadType: o.localRtxPayloadType,
                            clockRate: o.clockRate,
                            parameters: {
                                apt: o.localPayloadType
                            },
                            rtcpFeedback: []
                        };
                        t.codecs.push(e)
                    }
                }
                for (const o of r.headerExtensions) {
                    if (o.kind && o.kind !== e || "sendrecv" !== o.direction && "sendonly" !== o.direction) continue;
                    const r = {
                        uri: o.uri,
                        id: o.sendId,
                        encrypt: o.encrypt,
                        parameters: {}
                    };
                    t.headerExtensions.push(r)
                }
                if (t.headerExtensions.some(e => "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01" === e.uri))
                    for (const o of t.codecs) o.rtcpFeedback = (o.rtcpFeedback || []).filter(e => "goog-remb" !== e.type);
                else if (t.headerExtensions.some(e => "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time" === e.uri))
                    for (const o of t.codecs) o.rtcpFeedback = (o.rtcpFeedback || []).filter(e => "transport-cc" !== e.type);
                else
                    for (const o of t.codecs) o.rtcpFeedback = (o.rtcpFeedback || []).filter(e => "transport-cc" !== e.type && "goog-remb" !== e.type);
                return t
            }

            function k(e, r) {
                const t = [];
                if (r) {
                    for (let o = 0; o < e.length; ++o)
                        if (j(e[o], r)) {
                            t.push(e[o]), R(e[o + 1]) && t.push(e[o + 1]);
                            break
                        } if (0 === t.length) throw new TypeError("no matching codec found")
                } else t.push(e[0]), R(e[1]) && t.push(e[1]);
                return t
            }

            function g(e) {
                p(e = r.clone(e));
                const a = {
                    mid: t,
                    codecs: [],
                    headerExtensions: [],
                    encodings: [{
                        ssrc: o
                    }],
                    rtcp: {
                        cname: "probator"
                    }
                };
                return a.codecs.push(e.codecs[0]), a.codecs[0].payloadType = n, a.headerExtensions = e.headerExtensions, a
            }

            function v(e, r) {
                return r.codecs.some(r => r.kind === e)
            }

            function P(e, r) {
                if (p(e), 0 === e.codecs.length) return !1;
                const t = e.codecs[0];
                return r.codecs.some(e => e.remotePayloadType === t.payloadType)
            }

            function R(e) {
                return !!e && /.+\/rtx$/i.test(e.mimeType)
            }

            function j(r, t, {
                strict: o = !1,
                modify: n = !1
            } = {}) {
                const a = r.mimeType.toLowerCase();
                if (a !== t.mimeType.toLowerCase()) return !1;
                if (r.clockRate !== t.clockRate) return !1;
                if (r.channels !== t.channels) return !1;
                switch (a) {
                    case "video/h264":
                        if ((r.parameters["packetization-mode"] || 0) !== (t.parameters["packetization-mode"] || 0)) return !1;
                        if (o) {
                            if (!e.isSameProfile(r.parameters, t.parameters)) return !1;
                            let o;
                            try {
                                o = e.generateProfileLevelIdForAnswer(r.parameters, t.parameters)
                            } catch (i) {
                                return !1
                            }
                            n && (o ? r.parameters["profile-level-id"] = o : delete r.parameters["profile-level-id"])
                        }
                        break;
                    case "video/vp9":
                        if (o) {
                            if ((r.parameters["profile-id"] || 0) !== (t.parameters["profile-id"] || 0)) return !1
                        }
                }
                return !0
            }

            function S(e, r) {
                return (!e.kind || !r.kind || e.kind === r.kind) && e.uri === r.uri
            }

            function F(e, r) {
                const t = [];
                for (const o of e.rtcpFeedback || []) {
                    const e = (r.rtcpFeedback || []).find(e => e.type === o.type && (e.parameter === o.parameter || !e.parameter && !o.parameter));
                    e && t.push(e)
                }
                return t
            }
            exports.validateRtpCapabilities = a, exports.validateRtpCodecCapability = i, exports.validateRtcpFeedback = c, exports.validateRtpHeaderExtension = s, exports.validateRtpParameters = p, exports.validateRtpCodecParameters = d, exports.validateRtpHeaderExtensionParameters = y, exports.validateRtpEncodingParameters = f, exports.validateRtcpParameters = m, exports.validateSctpCapabilities = l, exports.validateNumSctpStreams = w, exports.validateSctpParameters = h, exports.validateSctpStreamParameters = u, exports.getExtendedRtpCapabilities = T, exports.getRecvRtpCapabilities = b, exports.getSendingRtpParameters = x, exports.getSendingRemoteRtpParameters = E, exports.reduceCodecs = k, exports.generateProbatorRtpParameters = g, exports.canSend = v, exports.canReceive = P;
        }, {
            "h264-profile-level-id": "AoQt",
            "./utils": "FOZT"
        }],
        "wXtN": [function(require, module, exports) {
            "use strict";
            var e = this && this.__awaiter || function(e, s, t, r) {
                return new(t || (t = Promise))(function(o, i) {
                    function n(e) {
                        try {
                            d(r.next(e))
                        } catch (s) {
                            i(s)
                        }
                    }

                    function c(e) {
                        try {
                            d(r.throw(e))
                        } catch (s) {
                            i(s)
                        }
                    }

                    function d(e) {
                        var s;
                        e.done ? o(e.value) : (s = e.value, s instanceof t ? s : new t(function(e) {
                            e(s)
                        })).then(n, c)
                    }
                    d((r = r.apply(e, s || [])).next())
                })
            };
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            class s {
                constructor({
                    ClosedErrorClass: e,
                    StoppedErrorClass: s
                } = {
                    ClosedErrorClass: Error,
                    StoppedErrorClass: Error
                }) {
                    this._closed = !1, this._pendingTasks = [], this._ClosedErrorClass = Error, this._StoppedErrorClass = Error, this._ClosedErrorClass = e, this._StoppedErrorClass = s
                }
                close() {
                    this._closed = !0
                }
                push(s) {
                    return e(this, void 0, void 0, function*() {
                        if ("function" != typeof s) throw new TypeError("given task is not a function");
                        return new Promise((e, t) => {
                            const r = {
                                execute: s,
                                resolve: e,
                                reject: t,
                                stopped: !1
                            };
                            this._pendingTasks.push(r), 1 === this._pendingTasks.length && this._next()
                        })
                    })
                }
                stop() {
                    for (const e of this._pendingTasks) e.stopped = !0, e.reject(new this._StoppedErrorClass("AwaitQueue stopped"));
                    this._pendingTasks.length = 0
                }
                _next() {
                    return e(this, void 0, void 0, function*() {
                        const e = this._pendingTasks[0];
                        e && (yield this._executeTask(e), this._pendingTasks.shift(), this._next())
                    })
                }
                _executeTask(s) {
                    return e(this, void 0, void 0, function*() {
                        if (this._closed) s.reject(new this._ClosedErrorClass("AwaitQueue closed"));
                        else if (!s.stopped) try {
                            const t = yield s.execute();
                            if (this._closed) return void s.reject(new this._ClosedErrorClass("AwaitQueue closed"));
                            if (s.stopped) return;
                            s.resolve(t)
                        } catch (e) {
                            if (this._closed) return void s.reject(new this._ClosedErrorClass("AwaitQueue closed"));
                            if (s.stopped) return;
                            s.reject(e)
                        }
                    })
                }
            }
            exports.AwaitQueue = s;
        }, {}],
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
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("events"),
                t = require("./Logger"),
                r = new t.Logger("EnhancedEventEmitter");
            class s extends e.EventEmitter {
                constructor() {
                    super(), this.setMaxListeners(1 / 0)
                }
                safeEmit(e, ...t) {
                    const s = this.listenerCount(e);
                    try {
                        return this.emit(e, ...t)
                    } catch (n) {
                        return r.error("safeEmit() | event listener threw an error [event:%s]:%o", e, n), Boolean(s)
                    }
                }
                async safeEmitAsPromise(e, ...t) {
                    return new Promise((r, s) => this.safeEmit(e, ...t, r, s))
                }
            }
            exports.EnhancedEventEmitter = s;
        }, {
            "events": "vY5P",
            "./Logger": "p5bA"
        }],
        "oKFT": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("./Logger"),
                t = require("./EnhancedEventEmitter"),
                r = require("./errors"),
                s = new e.Logger("Producer");
            class a extends t.EnhancedEventEmitter {
                constructor({
                    id: e,
                    localId: t,
                    rtpSender: r,
                    track: a,
                    rtpParameters: i,
                    stopTracks: d,
                    disableTrackOnPause: c,
                    zeroRtpOnPause: o,
                    appData: n
                }) {
                    super(), this._closed = !1, s.debug("constructor()"), this._id = e, this._localId = t, this._rtpSender = r, this._track = a, this._kind = a.kind, this._rtpParameters = i, this._paused = !!c && !a.enabled, this._maxSpatialLayer = void 0, this._stopTracks = d, this._disableTrackOnPause = c, this._zeroRtpOnPause = o, this._appData = n, this._onTrackEnded = this._onTrackEnded.bind(this), this._handleTrack()
                }
                get id() {
                    return this._id
                }
                get localId() {
                    return this._localId
                }
                get closed() {
                    return this._closed
                }
                get kind() {
                    return this._kind
                }
                get rtpSender() {
                    return this._rtpSender
                }
                get track() {
                    return this._track
                }
                get rtpParameters() {
                    return this._rtpParameters
                }
                get paused() {
                    return this._paused
                }
                get maxSpatialLayer() {
                    return this._maxSpatialLayer
                }
                get appData() {
                    return this._appData
                }
                set appData(e) {
                    throw new Error("cannot override appData object")
                }
                close() {
                    this._closed || (s.debug("close()"), this._closed = !0, this._destroyTrack(), this.emit("@close"))
                }
                transportClosed() {
                    this._closed || (s.debug("transportClosed()"), this._closed = !0, this._destroyTrack(), this.safeEmit("transportclose"))
                }
                async getStats() {
                    if (this._closed) throw new r.InvalidStateError("closed");
                    return this.safeEmitAsPromise("@getstats")
                }
                pause() {
                    s.debug("pause()"), this._closed ? s.error("pause() | Producer closed") : (this._paused = !0, this._track && this._disableTrackOnPause && (this._track.enabled = !1), this._zeroRtpOnPause && this.safeEmitAsPromise("@replacetrack", null).catch(() => {}))
                }
                resume() {
                    s.debug("resume()"), this._closed ? s.error("resume() | Producer closed") : (this._paused = !1, this._track && this._disableTrackOnPause && (this._track.enabled = !0), this._zeroRtpOnPause && this.safeEmitAsPromise("@replacetrack", this._track).catch(() => {}))
                }
                async replaceTrack({
                    track: e
                }) {
                    if (s.debug("replaceTrack() [track:%o]", e), this._closed) {
                        if (e && this._stopTracks) try {
                            e.stop()
                        } catch (t) {}
                        throw new r.InvalidStateError("closed")
                    }
                    if (e && "ended" === e.readyState) throw new r.InvalidStateError("track ended");
                    e !== this._track ? (this._zeroRtpOnPause && this._paused || await this.safeEmitAsPromise("@replacetrack", e), this._destroyTrack(), this._track = e, this._track && this._disableTrackOnPause && (this._paused ? this._paused && (this._track.enabled = !1) : this._track.enabled = !0), this._handleTrack()) : s.debug("replaceTrack() | same track, ignored")
                }
                async setMaxSpatialLayer(e) {
                    if (this._closed) throw new r.InvalidStateError("closed");
                    if ("video" !== this._kind) throw new r.UnsupportedError("not a video Producer");
                    if ("number" != typeof e) throw new TypeError("invalid spatialLayer");
                    e !== this._maxSpatialLayer && (await this.safeEmitAsPromise("@setmaxspatiallayer", e), this._maxSpatialLayer = e)
                }
                async setRtpEncodingParameters(e) {
                    if (this._closed) throw new r.InvalidStateError("closed");
                    if ("object" != typeof e) throw new TypeError("invalid params");
                    await this.safeEmitAsPromise("@setrtpencodingparameters", e)
                }
                _onTrackEnded() {
                    s.debug('track "ended" event'), this.safeEmit("trackended")
                }
                _handleTrack() {
                    this._track && this._track.addEventListener("ended", this._onTrackEnded)
                }
                _destroyTrack() {
                    if (this._track) try {
                        this._track.removeEventListener("ended", this._onTrackEnded), this._stopTracks && this._track.stop()
                    } catch (e) {}
                }
            }
            exports.Producer = a;
        }, {
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd",
            "./errors": "p8GN"
        }],
        "nZfe": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("./Logger"),
                t = require("./EnhancedEventEmitter"),
                r = require("./errors"),
                s = new e.Logger("Consumer");
            class a extends t.EnhancedEventEmitter {
                constructor({
                    id: e,
                    localId: t,
                    producerId: r,
                    rtpReceiver: a,
                    track: d,
                    rtpParameters: i,
                    appData: c
                }) {
                    super(), this._closed = !1, s.debug("constructor()"), this._id = e, this._localId = t, this._producerId = r, this._rtpReceiver = a, this._track = d, this._rtpParameters = i, this._paused = !d.enabled, this._appData = c, this._onTrackEnded = this._onTrackEnded.bind(this), this._handleTrack()
                }
                get id() {
                    return this._id
                }
                get localId() {
                    return this._localId
                }
                get producerId() {
                    return this._producerId
                }
                get closed() {
                    return this._closed
                }
                get kind() {
                    return this._track.kind
                }
                get rtpReceiver() {
                    return this._rtpReceiver
                }
                get track() {
                    return this._track
                }
                get rtpParameters() {
                    return this._rtpParameters
                }
                get paused() {
                    return this._paused
                }
                get appData() {
                    return this._appData
                }
                set appData(e) {
                    throw new Error("cannot override appData object")
                }
                close() {
                    this._closed || (s.debug("close()"), this._closed = !0, this._destroyTrack(), this.emit("@close"))
                }
                transportClosed() {
                    this._closed || (s.debug("transportClosed()"), this._closed = !0, this._destroyTrack(), this.safeEmit("transportclose"))
                }
                async getStats() {
                    if (this._closed) throw new r.InvalidStateError("closed");
                    return this.safeEmitAsPromise("@getstats")
                }
                pause() {
                    s.debug("pause()"), this._closed ? s.error("pause() | Consumer closed") : (this._paused = !0, this._track.enabled = !1)
                }
                resume() {
                    s.debug("resume()"), this._closed ? s.error("resume() | Consumer closed") : (this._paused = !1, this._track.enabled = !0)
                }
                _onTrackEnded() {
                    s.debug('track "ended" event'), this.safeEmit("trackended")
                }
                _handleTrack() {
                    this._track.addEventListener("ended", this._onTrackEnded)
                }
                _destroyTrack() {
                    try {
                        this._track.removeEventListener("ended", this._onTrackEnded), this._track.stop()
                    } catch (e) {}
                }
            }
            exports.Consumer = a;
        }, {
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd",
            "./errors": "p8GN"
        }],
        "lgs9": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("./Logger"),
                t = require("./EnhancedEventEmitter"),
                a = require("./errors"),
                r = new e.Logger("DataProducer");
            class s extends t.EnhancedEventEmitter {
                constructor({
                    id: e,
                    dataChannel: t,
                    sctpStreamParameters: a,
                    appData: s
                }) {
                    super(), this._closed = !1, r.debug("constructor()"), this._id = e, this._dataChannel = t, this._sctpStreamParameters = a, this._appData = s, this._handleDataChannel()
                }
                get id() {
                    return this._id
                }
                get closed() {
                    return this._closed
                }
                get sctpStreamParameters() {
                    return this._sctpStreamParameters
                }
                get readyState() {
                    return this._dataChannel.readyState
                }
                get label() {
                    return this._dataChannel.label
                }
                get protocol() {
                    return this._dataChannel.protocol
                }
                get bufferedAmount() {
                    return this._dataChannel.bufferedAmount
                }
                get bufferedAmountLowThreshold() {
                    return this._dataChannel.bufferedAmountLowThreshold
                }
                set bufferedAmountLowThreshold(e) {
                    this._dataChannel.bufferedAmountLowThreshold = e
                }
                get appData() {
                    return this._appData
                }
                set appData(e) {
                    throw new Error("cannot override appData object")
                }
                close() {
                    this._closed || (r.debug("close()"), this._closed = !0, this._dataChannel.close(), this.emit("@close"))
                }
                transportClosed() {
                    this._closed || (r.debug("transportClosed()"), this._closed = !0, this._dataChannel.close(), this.safeEmit("transportclose"))
                }
                send(e) {
                    if (r.debug("send()"), this._closed) throw new a.InvalidStateError("closed");
                    this._dataChannel.send(e)
                }
                _handleDataChannel() {
                    this._dataChannel.addEventListener("open", () => {
                        this._closed || (r.debug('DataChannel "open" event'), this.safeEmit("open"))
                    }), this._dataChannel.addEventListener("error", e => {
                        if (this._closed) return;
                        let {
                            error: t
                        } = e;
                        t || (t = new Error("unknown DataChannel error")), "sctp-failure" === t.errorDetail ? r.error("DataChannel SCTP error [sctpCauseCode:%s]: %s", t.sctpCauseCode, t.message) : r.error('DataChannel "error" event: %o', t), this.safeEmit("error", t)
                    }), this._dataChannel.addEventListener("close", () => {
                        this._closed || (r.warn('DataChannel "close" event'), this._closed = !0, this.emit("@close"), this.safeEmit("close"))
                    }), this._dataChannel.addEventListener("message", () => {
                        this._closed || r.warn('DataChannel "message" event in a DataProducer, message discarded')
                    }), this._dataChannel.addEventListener("bufferedamountlow", () => {
                        this._closed || this.safeEmit("bufferedamountlow")
                    })
                }
            }
            exports.DataProducer = s;
        }, {
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd",
            "./errors": "p8GN"
        }],
        "ui0n": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("./Logger"),
                t = require("./EnhancedEventEmitter"),
                a = new e.Logger("DataConsumer");
            class r extends t.EnhancedEventEmitter {
                constructor({
                    id: e,
                    dataProducerId: t,
                    dataChannel: r,
                    sctpStreamParameters: s,
                    appData: n
                }) {
                    super(), this._closed = !1, a.debug("constructor()"), this._id = e, this._dataProducerId = t, this._dataChannel = r, this._sctpStreamParameters = s, this._appData = n, this._handleDataChannel()
                }
                get id() {
                    return this._id
                }
                get dataProducerId() {
                    return this._dataProducerId
                }
                get closed() {
                    return this._closed
                }
                get sctpStreamParameters() {
                    return this._sctpStreamParameters
                }
                get readyState() {
                    return this._dataChannel.readyState
                }
                get label() {
                    return this._dataChannel.label
                }
                get protocol() {
                    return this._dataChannel.protocol
                }
                get binaryType() {
                    return this._dataChannel.binaryType
                }
                set binaryType(e) {
                    this._dataChannel.binaryType = e
                }
                get appData() {
                    return this._appData
                }
                set appData(e) {
                    throw new Error("cannot override appData object")
                }
                close() {
                    this._closed || (a.debug("close()"), this._closed = !0, this._dataChannel.close(), this.emit("@close"))
                }
                transportClosed() {
                    this._closed || (a.debug("transportClosed()"), this._closed = !0, this._dataChannel.close(), this.safeEmit("transportclose"))
                }
                _handleDataChannel() {
                    this._dataChannel.addEventListener("open", () => {
                        this._closed || (a.debug('DataChannel "open" event'), this.safeEmit("open"))
                    }), this._dataChannel.addEventListener("error", e => {
                        if (this._closed) return;
                        let {
                            error: t
                        } = e;
                        t || (t = new Error("unknown DataChannel error")), "sctp-failure" === t.errorDetail ? a.error("DataChannel SCTP error [sctpCauseCode:%s]: %s", t.sctpCauseCode, t.message) : a.error('DataChannel "error" event: %o', t), this.safeEmit("error", t)
                    }), this._dataChannel.addEventListener("close", () => {
                        this._closed || (a.warn('DataChannel "close" event'), this._closed = !0, this.emit("@close"), this.safeEmit("close"))
                    }), this._dataChannel.addEventListener("message", e => {
                        this._closed || this.safeEmit("message", e.data)
                    })
                }
            }
            exports.DataConsumer = r;
        }, {
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd"
        }],
        "bVaN": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("awaitqueue"),
                t = require("./Logger"),
                r = require("./EnhancedEventEmitter"),
                a = require("./errors"),
                s = require("./utils"),
                o = require("./ortc"),
                n = require("./Producer"),
                i = require("./Consumer"),
                c = require("./DataProducer"),
                d = require("./DataConsumer"),
                h = new t.Logger("Transport");
            class p extends r.EnhancedEventEmitter {
                constructor({
                    direction: t,
                    id: r,
                    iceParameters: o,
                    iceCandidates: n,
                    dtlsParameters: i,
                    sctpParameters: c,
                    iceServers: d,
                    iceTransportPolicy: p,
                    additionalSettings: l,
                    proprietaryConstraints: u,
                    appData: w,
                    handlerFactory: m,
                    extendedRtpCapabilities: _,
                    canProduceByKind: y
                }) {
                    super(), this._closed = !1, this._connectionState = "new", this._producers = new Map, this._consumers = new Map, this._dataProducers = new Map, this._dataConsumers = new Map, this._probatorConsumerCreated = !1, this._awaitQueue = new e.AwaitQueue({
                        ClosedErrorClass: a.InvalidStateError
                    }), h.debug("constructor() [id:%s, direction:%s]", r, t), this._id = r, this._direction = t, this._extendedRtpCapabilities = _, this._canProduceByKind = y, this._maxSctpMessageSize = c ? c.maxMessageSize : null, delete(l = s.clone(l)).iceServers, delete l.iceTransportPolicy, delete l.bundlePolicy, delete l.rtcpMuxPolicy, delete l.sdpSemantics, this._handler = m(), this._handler.run({
                        direction: t,
                        iceParameters: o,
                        iceCandidates: n,
                        dtlsParameters: i,
                        sctpParameters: c,
                        iceServers: d,
                        iceTransportPolicy: p,
                        additionalSettings: l,
                        proprietaryConstraints: u,
                        extendedRtpCapabilities: _
                    }), this._appData = w, this._handleHandler()
                }
                get id() {
                    return this._id
                }
                get closed() {
                    return this._closed
                }
                get direction() {
                    return this._direction
                }
                get handler() {
                    return this._handler
                }
                get connectionState() {
                    return this._connectionState
                }
                get appData() {
                    return this._appData
                }
                set appData(e) {
                    throw new Error("cannot override appData object")
                }
                close() {
                    if (!this._closed) {
                        h.debug("close()"), this._closed = !0, this._awaitQueue.close(), this._handler.close();
                        for (const e of this._producers.values()) e.transportClosed();
                        this._producers.clear();
                        for (const e of this._consumers.values()) e.transportClosed();
                        this._consumers.clear();
                        for (const e of this._dataProducers.values()) e.transportClosed();
                        this._dataProducers.clear();
                        for (const e of this._dataConsumers.values()) e.transportClosed();
                        this._dataConsumers.clear()
                    }
                }
                async getStats() {
                    if (this._closed) throw new a.InvalidStateError("closed");
                    return this._handler.getTransportStats()
                }
                async restartIce({
                    iceParameters: e
                }) {
                    if (h.debug("restartIce()"), this._closed) throw new a.InvalidStateError("closed");
                    if (!e) throw new TypeError("missing iceParameters");
                    return this._awaitQueue.push(async () => this._handler.restartIce(e))
                }
                async updateIceServers({
                    iceServers: e
                } = {}) {
                    if (h.debug("updateIceServers()"), this._closed) throw new a.InvalidStateError("closed");
                    if (!Array.isArray(e)) throw new TypeError("missing iceServers");
                    return this._awaitQueue.push(async () => this._handler.updateIceServers(e))
                }
                async produce({
                    track: e,
                    encodings: t,
                    codecOptions: r,
                    codec: s,
                    stopTracks: i = !0,
                    disableTrackOnPause: c = !0,
                    zeroRtpOnPause: d = !1,
                    appData: p = {}
                } = {}) {
                    if (h.debug("produce() [track:%o]", e), !e) throw new TypeError("missing track");
                    if ("send" !== this._direction) throw new a.UnsupportedError("not a sending Transport");
                    if (!this._canProduceByKind[e.kind]) throw new a.UnsupportedError(`cannot produce ${e.kind}`);
                    if ("ended" === e.readyState) throw new a.InvalidStateError("track ended");
                    if (0 === this.listenerCount("connect") && "new" === this._connectionState) throw new TypeError('no "connect" listener set into this transport');
                    if (0 === this.listenerCount("produce")) throw new TypeError('no "produce" listener set into this transport');
                    if (p && "object" != typeof p) throw new TypeError("if given, appData must be an object");
                    return this._awaitQueue.push(async () => {
                        let a;
                        if (t && !Array.isArray(t)) throw TypeError("encodings must be an array");
                        t && 0 === t.length ? a = void 0 : t && (a = t.map(e => {
                            const t = {
                                active: !0
                            };
                            return !1 === e.active && (t.active = !1), "number" == typeof e.maxBitrate && (t.maxBitrate = e.maxBitrate), "number" == typeof e.maxFramerate && (t.maxFramerate = e.maxFramerate), "number" == typeof e.scaleResolutionDownBy && (t.scaleResolutionDownBy = e.scaleResolutionDownBy), "boolean" == typeof e.dtx && (t.dtx = e.dtx), "string" == typeof e.scalabilityMode && (t.scalabilityMode = e.scalabilityMode), "string" == typeof e.priority && (t.priority = e.priority), "string" == typeof e.networkPriority && (t.networkPriority = e.networkPriority), t
                        }));
                        const {
                            localId: h,
                            rtpParameters: l,
                            rtpSender: u
                        } = await this._handler.send({
                            track: e,
                            encodings: a,
                            codecOptions: r,
                            codec: s
                        });
                        try {
                            o.validateRtpParameters(l);
                            const {
                                id: t
                            } = await this.safeEmitAsPromise("produce", {
                                kind: e.kind,
                                rtpParameters: l,
                                appData: p
                            }), r = new n.Producer({
                                id: t,
                                localId: h,
                                rtpSender: u,
                                track: e,
                                rtpParameters: l,
                                stopTracks: i,
                                disableTrackOnPause: c,
                                zeroRtpOnPause: d,
                                appData: p
                            });
                            return this._producers.set(r.id, r), this._handleProducer(r), r
                        } catch (w) {
                            throw this._handler.stopSending(h).catch(() => {}), w
                        }
                    }).catch(t => {
                        if (i) try {
                            e.stop()
                        } catch (r) {}
                        throw t
                    })
                }
                async consume({
                    id: e,
                    producerId: t,
                    kind: r,
                    rtpParameters: s,
                    appData: n = {}
                }) {
                    if (h.debug("consume()"), this._closed) throw new a.InvalidStateError("closed");
                    if ("recv" !== this._direction) throw new a.UnsupportedError("not a receiving Transport");
                    if ("string" != typeof e) throw new TypeError("missing id");
                    if ("string" != typeof t) throw new TypeError("missing producerId");
                    if ("audio" !== r && "video" !== r) throw new TypeError(`invalid kind '${r}'`);
                    if (0 === this.listenerCount("connect") && "new" === this._connectionState) throw new TypeError('no "connect" listener set into this transport');
                    if (n && "object" != typeof n) throw new TypeError("if given, appData must be an object");
                    return this._awaitQueue.push(async () => {
                        if (!o.canReceive(s, this._extendedRtpCapabilities)) throw new a.UnsupportedError("cannot consume this Producer");
                        const {
                            localId: c,
                            rtpReceiver: d,
                            track: p
                        } = await this._handler.receive({
                            trackId: e,
                            kind: r,
                            rtpParameters: s
                        }), l = new i.Consumer({
                            id: e,
                            localId: c,
                            producerId: t,
                            rtpReceiver: d,
                            track: p,
                            rtpParameters: s,
                            appData: n
                        });
                        if (this._consumers.set(l.id, l), this._handleConsumer(l), !this._probatorConsumerCreated && "video" === r) try {
                            const e = o.generateProbatorRtpParameters(l.rtpParameters);
                            await this._handler.receive({
                                trackId: "probator",
                                kind: "video",
                                rtpParameters: e
                            }), h.debug("consume() | Consumer for RTP probation created"), this._probatorConsumerCreated = !0
                        } catch (u) {
                            h.error("consume() | failed to create Consumer for RTP probation:%o", u)
                        }
                        return l
                    })
                }
                async produceData({
                    ordered: e = !0,
                    maxPacketLifeTime: t,
                    maxRetransmits: r,
                    priority: s = "low",
                    label: n = "",
                    protocol: i = "",
                    appData: d = {}
                } = {}) {
                    if (h.debug("produceData()"), "send" !== this._direction) throw new a.UnsupportedError("not a sending Transport");
                    if (!this._maxSctpMessageSize) throw new a.UnsupportedError("SCTP not enabled by remote Transport");
                    if (!["very-low", "low", "medium", "high"].includes(s)) throw new TypeError("wrong priority");
                    if (0 === this.listenerCount("connect") && "new" === this._connectionState) throw new TypeError('no "connect" listener set into this transport');
                    if (0 === this.listenerCount("producedata")) throw new TypeError('no "producedata" listener set into this transport');
                    if (d && "object" != typeof d) throw new TypeError("if given, appData must be an object");
                    return (t || r) && (e = !1), this._awaitQueue.push(async () => {
                        const {
                            dataChannel: a,
                            sctpStreamParameters: h
                        } = await this._handler.sendDataChannel({
                            ordered: e,
                            maxPacketLifeTime: t,
                            maxRetransmits: r,
                            priority: s,
                            label: n,
                            protocol: i
                        });
                        o.validateSctpStreamParameters(h);
                        const {
                            id: p
                        } = await this.safeEmitAsPromise("producedata", {
                            sctpStreamParameters: h,
                            label: n,
                            protocol: i,
                            appData: d
                        }), l = new c.DataProducer({
                            id: p,
                            dataChannel: a,
                            sctpStreamParameters: h,
                            appData: d
                        });
                        return this._dataProducers.set(l.id, l), this._handleDataProducer(l), l
                    })
                }
                async consumeData({
                    id: e,
                    dataProducerId: t,
                    sctpStreamParameters: r,
                    label: s = "",
                    protocol: n = "",
                    appData: i = {}
                }) {
                    if (h.debug("consumeData()"), this._closed) throw new a.InvalidStateError("closed");
                    if ("recv" !== this._direction) throw new a.UnsupportedError("not a receiving Transport");
                    if (!this._maxSctpMessageSize) throw new a.UnsupportedError("SCTP not enabled by remote Transport");
                    if ("string" != typeof e) throw new TypeError("missing id");
                    if ("string" != typeof t) throw new TypeError("missing dataProducerId");
                    if (0 === this.listenerCount("connect") && "new" === this._connectionState) throw new TypeError('no "connect" listener set into this transport');
                    if (i && "object" != typeof i) throw new TypeError("if given, appData must be an object");
                    return o.validateSctpStreamParameters(r), this._awaitQueue.push(async () => {
                        const {
                            dataChannel: a
                        } = await this._handler.receiveDataChannel({
                            sctpStreamParameters: r,
                            label: s,
                            protocol: n
                        }), o = new d.DataConsumer({
                            id: e,
                            dataProducerId: t,
                            dataChannel: a,
                            sctpStreamParameters: r,
                            appData: i
                        });
                        return this._dataConsumers.set(o.id, o), this._handleDataConsumer(o), o
                    })
                }
                _handleHandler() {
                    const e = this._handler;
                    e.on("@connect", ({
                        dtlsParameters: e
                    }, t, r) => {
                        this._closed ? r(new a.InvalidStateError("closed")) : this.safeEmit("connect", {
                            dtlsParameters: e
                        }, t, r)
                    }), e.on("@connectionstatechange", e => {
                        e !== this._connectionState && (h.debug("connection state changed to %s", e), this._connectionState = e, this._closed || this.safeEmit("connectionstatechange", e))
                    })
                }
                _handleProducer(e) {
                    e.on("@close", () => {
                        this._producers.delete(e.id), this._closed || this._awaitQueue.push(async () => this._handler.stopSending(e.localId)).catch(e => h.warn("producer.close() failed:%o", e))
                    }), e.on("@replacetrack", (t, r, a) => {
                        this._awaitQueue.push(async () => this._handler.replaceTrack(e.localId, t)).then(r).catch(a)
                    }), e.on("@setmaxspatiallayer", (t, r, a) => {
                        this._awaitQueue.push(async () => this._handler.setMaxSpatialLayer(e.localId, t)).then(r).catch(a)
                    }), e.on("@setrtpencodingparameters", (t, r, a) => {
                        this._awaitQueue.push(async () => this._handler.setRtpEncodingParameters(e.localId, t)).then(r).catch(a)
                    }), e.on("@getstats", (t, r) => {
                        if (this._closed) return r(new a.InvalidStateError("closed"));
                        this._handler.getSenderStats(e.localId).then(t).catch(r)
                    })
                }
                _handleConsumer(e) {
                    e.on("@close", () => {
                        this._consumers.delete(e.id), this._closed || this._awaitQueue.push(async () => this._handler.stopReceiving(e.localId)).catch(() => {})
                    }), e.on("@getstats", (t, r) => {
                        if (this._closed) return r(new a.InvalidStateError("closed"));
                        this._handler.getReceiverStats(e.localId).then(t).catch(r)
                    })
                }
                _handleDataProducer(e) {
                    e.on("@close", () => {
                        this._dataProducers.delete(e.id)
                    })
                }
                _handleDataConsumer(e) {
                    e.on("@close", () => {
                        this._dataConsumers.delete(e.id)
                    })
                }
            }
            exports.Transport = p;
        }, {
            "awaitqueue": "wXtN",
            "./Logger": "p5bA",
            "./EnhancedEventEmitter": "Oomd",
            "./errors": "p8GN",
            "./utils": "FOZT",
            "./ortc": "alA0",
            "./Producer": "oKFT",
            "./Consumer": "nZfe",
            "./DataProducer": "lgs9",
            "./DataConsumer": "ui0n"
        }],
        "dlbw": [function(require, module, exports) {
            var e = module.exports = {
                v: [{
                    name: "version",
                    reg: /^(\d*)$/
                }],
                o: [{
                    name: "origin",
                    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
                    names: ["username", "sessionId", "sessionVersion", "netType", "ipVer", "address"],
                    format: "%s %s %d %s IP%d %s"
                }],
                s: [{
                    name: "name"
                }],
                i: [{
                    name: "description"
                }],
                u: [{
                    name: "uri"
                }],
                e: [{
                    name: "email"
                }],
                p: [{
                    name: "phone"
                }],
                z: [{
                    name: "timezones"
                }],
                r: [{
                    name: "repeats"
                }],
                t: [{
                    name: "timing",
                    reg: /^(\d*) (\d*)/,
                    names: ["start", "stop"],
                    format: "%d %d"
                }],
                c: [{
                    name: "connection",
                    reg: /^IN IP(\d) (\S*)/,
                    names: ["version", "ip"],
                    format: "IN IP%d %s"
                }],
                b: [{
                    push: "bandwidth",
                    reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
                    names: ["type", "limit"],
                    format: "%s:%s"
                }],
                m: [{
                    reg: /^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,
                    names: ["type", "port", "protocol", "payloads"],
                    format: "%s %d %s %s"
                }],
                a: [{
                    push: "rtp",
                    reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
                    names: ["payload", "codec", "rate", "encoding"],
                    format: function(e) {
                        return e.encoding ? "rtpmap:%d %s/%s/%s" : e.rate ? "rtpmap:%d %s/%s" : "rtpmap:%d %s"
                    }
                }, {
                    push: "fmtp",
                    reg: /^fmtp:(\d*) ([\S| ]*)/,
                    names: ["payload", "config"],
                    format: "fmtp:%d %s"
                }, {
                    name: "control",
                    reg: /^control:(.*)/,
                    format: "control:%s"
                }, {
                    name: "rtcp",
                    reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
                    names: ["port", "netType", "ipVer", "address"],
                    format: function(e) {
                        return null != e.address ? "rtcp:%d %s IP%d %s" : "rtcp:%d"
                    }
                }, {
                    push: "rtcpFbTrrInt",
                    reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
                    names: ["payload", "value"],
                    format: "rtcp-fb:%d trr-int %d"
                }, {
                    push: "rtcpFb",
                    reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
                    names: ["payload", "type", "subtype"],
                    format: function(e) {
                        return null != e.subtype ? "rtcp-fb:%s %s %s" : "rtcp-fb:%s %s"
                    }
                }, {
                    push: "ext",
                    reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
                    names: ["value", "direction", "encrypt-uri", "uri", "config"],
                    format: function(e) {
                        return "extmap:%d" + (e.direction ? "/%s" : "%v") + (e["encrypt-uri"] ? " %s" : "%v") + " %s" + (e.config ? " %s" : "")
                    }
                }, {
                    name: "extmapAllowMixed",
                    reg: /^(extmap-allow-mixed)/
                }, {
                    push: "crypto",
                    reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
                    names: ["id", "suite", "config", "sessionConfig"],
                    format: function(e) {
                        return null != e.sessionConfig ? "crypto:%d %s %s %s" : "crypto:%d %s %s"
                    }
                }, {
                    name: "setup",
                    reg: /^setup:(\w*)/,
                    format: "setup:%s"
                }, {
                    name: "connectionType",
                    reg: /^connection:(new|existing)/,
                    format: "connection:%s"
                }, {
                    name: "mid",
                    reg: /^mid:([^\s]*)/,
                    format: "mid:%s"
                }, {
                    name: "msid",
                    reg: /^msid:(.*)/,
                    format: "msid:%s"
                }, {
                    name: "ptime",
                    reg: /^ptime:(\d*(?:\.\d*)*)/,
                    format: "ptime:%d"
                }, {
                    name: "maxptime",
                    reg: /^maxptime:(\d*(?:\.\d*)*)/,
                    format: "maxptime:%d"
                }, {
                    name: "direction",
                    reg: /^(sendrecv|recvonly|sendonly|inactive)/
                }, {
                    name: "icelite",
                    reg: /^(ice-lite)/
                }, {
                    name: "iceUfrag",
                    reg: /^ice-ufrag:(\S*)/,
                    format: "ice-ufrag:%s"
                }, {
                    name: "icePwd",
                    reg: /^ice-pwd:(\S*)/,
                    format: "ice-pwd:%s"
                }, {
                    name: "fingerprint",
                    reg: /^fingerprint:(\S*) (\S*)/,
                    names: ["type", "hash"],
                    format: "fingerprint:%s %s"
                }, {
                    push: "candidates",
                    reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
                    names: ["foundation", "component", "transport", "priority", "ip", "port", "type", "raddr", "rport", "tcptype", "generation", "network-id", "network-cost"],
                    format: function(e) {
                        var r = "candidate:%s %d %s %d %s %d typ %s";
                        return r += null != e.raddr ? " raddr %s rport %d" : "%v%v", r += null != e.tcptype ? " tcptype %s" : "%v", null != e.generation && (r += " generation %d"), r += null != e["network-id"] ? " network-id %d" : "%v", r += null != e["network-cost"] ? " network-cost %d" : "%v"
                    }
                }, {
                    name: "endOfCandidates",
                    reg: /^(end-of-candidates)/
                }, {
                    name: "remoteCandidates",
                    reg: /^remote-candidates:(.*)/,
                    format: "remote-candidates:%s"
                }, {
                    name: "iceOptions",
                    reg: /^ice-options:(\S*)/,
                    format: "ice-options:%s"
                }, {
                    push: "ssrcs",
                    reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
                    names: ["id", "attribute", "value"],
                    format: function(e) {
                        var r = "ssrc:%d";
                        return null != e.attribute && (r += " %s", null != e.value && (r += ":%s")), r
                    }
                }, {
                    push: "ssrcGroups",
                    reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
                    names: ["semantics", "ssrcs"],
                    format: "ssrc-group:%s %s"
                }, {
                    name: "msidSemantic",
                    reg: /^msid-semantic:\s?(\w*) (\S*)/,
                    names: ["semantic", "token"],
                    format: "msid-semantic: %s %s"
                }, {
                    push: "groups",
                    reg: /^group:(\w*) (.*)/,
                    names: ["type", "mids"],
                    format: "group:%s %s"
                }, {
                    name: "rtcpMux",
                    reg: /^(rtcp-mux)/
                }, {
                    name: "rtcpRsize",
                    reg: /^(rtcp-rsize)/
                }, {
                    name: "sctpmap",
                    reg: /^sctpmap:([\w_\/]*) (\S*)(?: (\S*))?/,
                    names: ["sctpmapNumber", "app", "maxMessageSize"],
                    format: function(e) {
                        return null != e.maxMessageSize ? "sctpmap:%s %s %s" : "sctpmap:%s %s"
                    }
                }, {
                    name: "xGoogleFlag",
                    reg: /^x-google-flag:([^\s]*)/,
                    format: "x-google-flag:%s"
                }, {
                    push: "rids",
                    reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
                    names: ["id", "direction", "params"],
                    format: function(e) {
                        return e.params ? "rid:%s %s %s" : "rid:%s %s"
                    }
                }, {
                    push: "imageattrs",
                    reg: new RegExp("^imageattr:(\\d+|\\*)[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?"),
                    names: ["pt", "dir1", "attrs1", "dir2", "attrs2"],
                    format: function(e) {
                        return "imageattr:%s %s %s" + (e.dir2 ? " %s %s" : "")
                    }
                }, {
                    name: "simulcast",
                    reg: new RegExp("^simulcast:(send|recv) ([a-zA-Z0-9\\-_~;,]+)(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?$"),
                    names: ["dir1", "list1", "dir2", "list2"],
                    format: function(e) {
                        return "simulcast:%s %s" + (e.dir2 ? " %s %s" : "")
                    }
                }, {
                    name: "simulcast_03",
                    reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
                    names: ["value"],
                    format: "simulcast: %s"
                }, {
                    name: "framerate",
                    reg: /^framerate:(\d+(?:$|\.\d+))/,
                    format: "framerate:%s"
                }, {
                    name: "sourceFilter",
                    reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
                    names: ["filterMode", "netType", "addressTypes", "destAddress", "srcList"],
                    format: "source-filter: %s %s %s %s %s"
                }, {
                    name: "bundleOnly",
                    reg: /^(bundle-only)/
                }, {
                    name: "label",
                    reg: /^label:(.+)/,
                    format: "label:%s"
                }, {
                    name: "sctpPort",
                    reg: /^sctp-port:(\d+)$/,
                    format: "sctp-port:%s"
                }, {
                    name: "maxMessageSize",
                    reg: /^max-message-size:(\d+)$/,
                    format: "max-message-size:%s"
                }, {
                    push: "tsRefClocks",
                    reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
                    names: ["clksrc", "clksrcExt"],
                    format: function(e) {
                        return "ts-refclk:%s" + (null != e.clksrcExt ? "=%s" : "")
                    }
                }, {
                    name: "mediaClk",
                    reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
                    names: ["id", "mediaClockName", "mediaClockValue", "rateNumerator", "rateDenominator"],
                    format: function(e) {
                        var r = "mediaclk:";
                        return r += null != e.id ? "id=%s %s" : "%v%s", r += null != e.mediaClockValue ? "=%s" : "", r += null != e.rateNumerator ? " rate=%s" : "", r += null != e.rateDenominator ? "/%s" : ""
                    }
                }, {
                    name: "keywords",
                    reg: /^keywds:(.+)$/,
                    format: "keywds:%s"
                }, {
                    name: "content",
                    reg: /^content:(.+)/,
                    format: "content:%s"
                }, {
                    name: "bfcpFloorCtrl",
                    reg: /^floorctrl:(c-only|s-only|c-s)/,
                    format: "floorctrl:%s"
                }, {
                    name: "bfcpConfId",
                    reg: /^confid:(\d+)/,
                    format: "confid:%s"
                }, {
                    name: "bfcpUserId",
                    reg: /^userid:(\d+)/,
                    format: "userid:%s"
                }, {
                    name: "bfcpFloorId",
                    reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
                    names: ["id", "mStream"],
                    format: "floorid:%s mstrm:%s"
                }, {
                    push: "invalid",
                    names: ["value"]
                }]
            };
            Object.keys(e).forEach(function(r) {
                e[r].forEach(function(e) {
                    e.reg || (e.reg = /(.*)/), e.format || (e.format = "%s")
                })
            });
        }, {}],
        "gZPd": [function(require, module, exports) {
            var r = function(r) {
                    return String(Number(r)) === r ? Number(r) : r
                },
                t = function(t, e, n, s) {
                    if (s && !n) e[s] = r(t[1]);
                    else
                        for (var a = 0; a < n.length; a += 1) null != t[a + 1] && (e[n[a]] = r(t[a + 1]))
                },
                e = function(r, e, n) {
                    var s = r.name && r.names;
                    r.push && !e[r.push] ? e[r.push] = [] : s && !e[r.name] && (e[r.name] = {});
                    var a = r.push ? {} : s ? e[r.name] : e;
                    t(n.match(r.reg), a, r.names, r.name), r.push && e[r.push].push(a)
                },
                n = require("./grammar"),
                s = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
            exports.parse = function(r) {
                var t = {},
                    a = [],
                    p = t;
                return r.split(/(\r\n|\r|\n)/).filter(s).forEach(function(r) {
                    var t = r[0],
                        s = r.slice(2);
                    "m" === t && (a.push({
                        rtp: [],
                        fmtp: []
                    }), p = a[a.length - 1]);
                    for (var u = 0; u < (n[t] || []).length; u += 1) {
                        var i = n[t][u];
                        if (i.reg.test(s)) return e(i, p, s)
                    }
                }), t.media = a, t
            };
            var a = function(t, e) {
                var n = e.split(/=(.+)/, 2);
                return 2 === n.length ? t[n[0]] = r(n[1]) : 1 === n.length && e.length > 1 && (t[n[0]] = void 0), t
            };
            exports.parseParams = function(r) {
                return r.split(/;\s?/).reduce(a, {})
            }, exports.parseFmtpConfig = exports.parseParams, exports.parsePayloads = function(r) {
                return r.toString().split(" ").map(Number)
            }, exports.parseRemoteCandidates = function(t) {
                for (var e = [], n = t.split(" ").map(r), s = 0; s < n.length; s += 3) e.push({
                    component: n[s],
                    ip: n[s + 1],
                    port: n[s + 2]
                });
                return e
            }, exports.parseImageAttributes = function(r) {
                return r.split(" ").map(function(r) {
                    return r.substring(1, r.length - 1).split(",").reduce(a, {})
                })
            }, exports.parseSimulcastStreamList = function(t) {
                return t.split(";").map(function(t) {
                    return t.split(",").map(function(t) {
                        var e, n = !1;
                        return "~" !== t[0] ? e = r(t) : (e = r(t.substring(1, t.length)), n = !0), {
                            scid: e,
                            paused: n
                        }
                    })
                })
            };
        }, {
            "./grammar": "dlbw"
        }],
        "WHEy": [function(require, module, exports) {
            var n = require("./grammar"),
                r = /%[sdv%]/g,
                a = function(n) {
                    var a = 1,
                        u = arguments,
                        e = u.length;
                    return n.replace(r, function(n) {
                        if (a >= e) return n;
                        var r = u[a];
                        switch (a += 1, n) {
                            case "%%":
                                return "%";
                            case "%s":
                                return String(r);
                            case "%d":
                                return Number(r);
                            case "%v":
                                return ""
                        }
                    })
                },
                u = function(n, r, u) {
                    var e = [n + "=" + (r.format instanceof Function ? r.format(r.push ? u : u[r.name]) : r.format)];
                    if (r.names)
                        for (var o = 0; o < r.names.length; o += 1) {
                            var s = r.names[o];
                            r.name ? e.push(u[r.name][s]) : e.push(u[r.names[o]])
                        } else e.push(u[r.name]);
                    return a.apply(null, e)
                },
                e = ["v", "o", "s", "i", "u", "e", "p", "c", "b", "t", "r", "z", "a"],
                o = ["i", "c", "b", "a"];
            module.exports = function(r, a) {
                a = a || {}, null == r.version && (r.version = 0), null == r.name && (r.name = " "), r.media.forEach(function(n) {
                    null == n.payloads && (n.payloads = "")
                });
                var s = a.outerOrder || e,
                    t = a.innerOrder || o,
                    i = [];
                return s.forEach(function(a) {
                    n[a].forEach(function(n) {
                        n.name in r && null != r[n.name] ? i.push(u(a, n, r)) : n.push in r && null != r[n.push] && r[n.push].forEach(function(r) {
                            i.push(u(a, n, r))
                        })
                    })
                }), r.media.forEach(function(r) {
                    i.push(u("m", n.m[0], r)), t.forEach(function(a) {
                        n[a].forEach(function(n) {
                            n.name in r && null != r[n.name] ? i.push(u(a, n, r)) : n.push in r && null != r[n.push] && r[n.push].forEach(function(r) {
                                i.push(u(a, n, r))
                            })
                        })
                    })
                }), i.join("\r\n") + "\r\n"
            };
        }, {
            "./grammar": "dlbw"
        }],
        "tbaU": [function(require, module, exports) {
            var e = require("./parser"),
                r = require("./writer");
            exports.write = r, exports.parse = e.parse, exports.parseParams = e.parseParams, exports.parseFmtpConfig = e.parseFmtpConfig, exports.parsePayloads = e.parsePayloads, exports.parseRemoteCandidates = e.parseRemoteCandidates, exports.parseImageAttributes = e.parseImageAttributes, exports.parseSimulcastStreamList = e.parseSimulcastStreamList;
        }, {
            "./parser": "gZPd",
            "./writer": "WHEy"
        }],
        "FBSL": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform");

            function t({
                sdpObject: t
            }) {
                const o = new Map,
                    r = [];
                let a = !1,
                    s = !1;
                for (const n of t.media) {
                    const t = n.type;
                    switch (t) {
                        case "audio":
                            if (a) continue;
                            a = !0;
                            break;
                        case "video":
                            if (s) continue;
                            s = !0;
                            break;
                        default:
                            continue
                    }
                    for (const e of n.rtp) {
                        const r = {
                            kind: t,
                            mimeType: `${t}/${e.codec}`,
                            preferredPayloadType: e.payload,
                            clockRate: e.rate,
                            channels: e.encoding,
                            parameters: {},
                            rtcpFeedback: []
                        };
                        o.set(r.preferredPayloadType, r)
                    }
                    for (const r of n.fmtp || []) {
                        const t = e.parseParams(r.config),
                            a = o.get(r.payload);
                        a && (t && t["profile-level-id"] && (t["profile-level-id"] = String(t["profile-level-id"])), a.parameters = t)
                    }
                    for (const e of n.rtcpFb || []) {
                        const t = o.get(e.payload);
                        if (!t) continue;
                        const r = {
                            type: e.type,
                            parameter: e.subtype
                        };
                        r.parameter || delete r.parameter, t.rtcpFeedback.push(r)
                    }
                    for (const e of n.ext || []) {
                        if (e["encrypt-uri"]) continue;
                        const o = {
                            kind: t,
                            uri: e.uri,
                            preferredId: e.value
                        };
                        r.push(o)
                    }
                }
                return {
                    codecs: Array.from(o.values()),
                    headerExtensions: r
                }
            }

            function o({
                sdpObject: e
            }) {
                const t = (e.media || []).find(e => e.iceUfrag && 0 !== e.port);
                if (!t) throw new Error("no active media section found");
                const o = t.fingerprint || e.fingerprint;
                let r;
                switch (t.setup) {
                    case "active":
                        r = "client";
                        break;
                    case "passive":
                        r = "server";
                        break;
                    case "actpass":
                        r = "auto"
                }
                return {
                    role: r,
                    fingerprints: [{
                        algorithm: o.type,
                        value: o.hash
                    }]
                }
            }

            function r({
                offerMediaObject: e
            }) {
                const t = (e.ssrcs || []).find(e => "cname" === e.attribute);
                return t ? t.value : ""
            }

            function a({
                offerRtpParameters: t,
                answerMediaObject: o
            }) {
                for (const r of t.codecs) {
                    const t = r.mimeType.toLowerCase();
                    if ("audio/opus" !== t) continue;
                    if (!(o.rtp || []).find(e => e.payload === r.payloadType)) continue;
                    o.fmtp = o.fmtp || [];
                    let a = o.fmtp.find(e => e.payload === r.payloadType);
                    a || (a = {
                        payload: r.payloadType,
                        config: ""
                    }, o.fmtp.push(a));
                    const s = e.parseParams(a.config);
                    switch (t) {
                        case "audio/opus": {
                            const e = r.parameters["sprop-stereo"];
                            void 0 !== e && (s.stereo = e ? 1 : 0);
                            break
                        }
                    }
                    a.config = "";
                    for (const e of Object.keys(s)) a.config && (a.config += ";"), a.config += `${e}=${s[e]}`
                }
            }
            exports.extractRtpCapabilities = t, exports.extractDtlsParameters = o, exports.getCname = r, exports.applyCodecParameters = a;
        }, {
            "sdp-transform": "tbaU"
        }],
        "Dujs": [function(require, module, exports) {
            "use strict";

            function s({
                offerMediaObject: s
            }) {
                const t = new Set;
                for (const n of s.ssrcs || []) {
                    const s = n.id;
                    t.add(s)
                }
                if (0 === t.size) throw new Error("no a=ssrc lines found");
                const r = new Map;
                for (const n of s.ssrcGroups || []) {
                    if ("FID" !== n.semantics) continue;
                    let [s, e] = n.ssrcs.split(/\s+/);
                    s = Number(s), e = Number(e), t.has(s) && (t.delete(s), t.delete(e), r.set(s, e))
                }
                for (const n of t) r.set(n, null);
                const e = [];
                for (const [n, o] of r) {
                    const s = {
                        ssrc: n
                    };
                    o && (s.rtx = {
                        ssrc: o
                    }), e.push(s)
                }
                return e
            }

            function t({
                offerMediaObject: s,
                numStreams: t
            }) {
                if (t <= 1) throw new TypeError("numStreams must be greater than 1");
                const r = (s.ssrcs || []).find(s => "msid" === s.attribute);
                if (!r) throw new Error("a=ssrc line with msid information not found");
                const [e, n] = r.value.split(" ")[0], o = r.id;
                let c;
                (s.ssrcGroups || []).some(s => {
                    if ("FID" !== s.semantics) return !1;
                    const t = s.ssrcs.split(/\s+/);
                    return Number(t[0]) === o && (c = Number(t[1]), !0)
                });
                const i = s.ssrcs.find(s => "cname" === s.attribute);
                if (!i) throw new Error("a=ssrc line with cname information not found");
                const u = i.value,
                    a = [],
                    f = [];
                for (let d = 0; d < t; ++d) a.push(o + d), c && f.push(c + d);
                s.ssrcGroups = [], s.ssrcs = [], s.ssrcGroups.push({
                    semantics: "SIM",
                    ssrcs: a.join(" ")
                });
                for (let d = 0; d < a.length; ++d) {
                    const t = a[d];
                    s.ssrcs.push({
                        id: t,
                        attribute: "cname",
                        value: u
                    }), s.ssrcs.push({
                        id: t,
                        attribute: "msid",
                        value: `${e} ${n}`
                    })
                }
                for (let d = 0; d < f.length; ++d) {
                    const t = a[d],
                        r = f[d];
                    s.ssrcs.push({
                        id: r,
                        attribute: "cname",
                        value: u
                    }), s.ssrcs.push({
                        id: r,
                        attribute: "msid",
                        value: `${e} ${n}`
                    }), s.ssrcGroups.push({
                        semantics: "FID",
                        ssrcs: `${t} ${r}`
                    })
                }
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            }), exports.getRtpEncodings = s, exports.addLegacySimulcast = t;
        }, {}],
        "iuhH": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("../EnhancedEventEmitter");
            class t extends e.EnhancedEventEmitter {
                constructor() {
                    super()
                }
            }
            exports.HandlerInterface = t;
        }, {
            "../EnhancedEventEmitter": "Oomd"
        }],
        "f7De": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("../../utils");
            class t {
                constructor({
                    iceParameters: e,
                    iceCandidates: t,
                    dtlsParameters: s,
                    planB: i = !1
                }) {
                    if (this._mediaObject = {}, this._planB = i, e && this.setIceParameters(e), t) {
                        this._mediaObject.candidates = [];
                        for (const e of t) {
                            const t = {
                                component: 1
                            };
                            t.foundation = e.foundation, t.ip = e.ip, t.port = e.port, t.priority = e.priority, t.transport = e.protocol, t.type = e.type, e.tcpType && (t.tcptype = e.tcpType), this._mediaObject.candidates.push(t)
                        }
                        this._mediaObject.endOfCandidates = "end-of-candidates", this._mediaObject.iceOptions = "renomination"
                    }
                    s && this.setDtlsRole(s.role)
                }
                get mid() {
                    return String(this._mediaObject.mid)
                }
                get closed() {
                    return 0 === this._mediaObject.port
                }
                getObject() {
                    return this._mediaObject
                }
                setIceParameters(e) {
                    this._mediaObject.iceUfrag = e.usernameFragment, this._mediaObject.icePwd = e.password
                }
                disable() {
                    this._mediaObject.direction = "inactive", delete this._mediaObject.ext, delete this._mediaObject.ssrcs, delete this._mediaObject.ssrcGroups, delete this._mediaObject.simulcast, delete this._mediaObject.simulcast_03, delete this._mediaObject.rids
                }
                close() {
                    this._mediaObject.direction = "inactive", this._mediaObject.port = 0, delete this._mediaObject.ext, delete this._mediaObject.ssrcs, delete this._mediaObject.ssrcGroups, delete this._mediaObject.simulcast, delete this._mediaObject.simulcast_03, delete this._mediaObject.rids, delete this._mediaObject.extmapAllowMixed
                }
            }
            exports.MediaSection = t;
            class s extends t {
                constructor({
                    iceParameters: t,
                    iceCandidates: s,
                    dtlsParameters: i,
                    sctpParameters: c,
                    plainRtpParameters: r,
                    planB: d = !1,
                    offerMediaObject: o,
                    offerRtpParameters: p,
                    answerRtpParameters: m,
                    codecOptions: n,
                    extmapAllowMixed: h = !1
                }) {
                    switch (super({
                        iceParameters: t,
                        iceCandidates: s,
                        dtlsParameters: i,
                        planB: d
                    }), this._mediaObject.mid = String(o.mid), this._mediaObject.type = o.type, this._mediaObject.protocol = o.protocol, r ? (this._mediaObject.connection = {
                        ip: r.ip,
                        version: r.ipVersion
                    }, this._mediaObject.port = r.port) : (this._mediaObject.connection = {
                        ip: "127.0.0.1",
                        version: 4
                    }, this._mediaObject.port = 7), o.type) {
                        case "audio":
                        case "video":
                            this._mediaObject.direction = "recvonly", this._mediaObject.rtp = [], this._mediaObject.rtcpFb = [], this._mediaObject.fmtp = [];
                            for (const t of m.codecs) {
                                const s = {
                                    payload: t.payloadType,
                                    codec: a(t),
                                    rate: t.clockRate
                                };
                                t.channels > 1 && (s.encoding = t.channels), this._mediaObject.rtp.push(s);
                                const i = e.clone(t.parameters || {});
                                if (n) {
                                    const {
                                        opusStereo: e,
                                        opusFec: s,
                                        opusDtx: a,
                                        opusMaxPlaybackRate: c,
                                        opusPtime: r,
                                        videoGoogleStartBitrate: d,
                                        videoGoogleMaxBitrate: o,
                                        videoGoogleMinBitrate: m
                                    } = n, h = p.codecs.find(e => e.payloadType === t.payloadType);
                                    switch (t.mimeType.toLowerCase()) {
                                        case "audio/opus":
                                            void 0 !== e && (h.parameters["sprop-stereo"] = e ? 1 : 0, i.stereo = e ? 1 : 0), void 0 !== s && (h.parameters.useinbandfec = s ? 1 : 0, i.useinbandfec = s ? 1 : 0), void 0 !== a && (h.parameters.usedtx = a ? 1 : 0, i.usedtx = a ? 1 : 0), void 0 !== c && (i.maxplaybackrate = c), void 0 !== r && (h.parameters.ptime = r, i.ptime = r);
                                            break;
                                        case "video/vp8":
                                        case "video/vp9":
                                        case "video/h264":
                                        case "video/h265":
                                            void 0 !== d && (i["x-google-start-bitrate"] = d), void 0 !== o && (i["x-google-max-bitrate"] = o), void 0 !== m && (i["x-google-min-bitrate"] = m)
                                    }
                                }
                                const c = {
                                    payload: t.payloadType,
                                    config: ""
                                };
                                for (const e of Object.keys(i)) c.config && (c.config += ";"), c.config += `${e}=${i[e]}`;
                                c.config && this._mediaObject.fmtp.push(c);
                                for (const e of t.rtcpFeedback) this._mediaObject.rtcpFb.push({
                                    payload: t.payloadType,
                                    type: e.type,
                                    subtype: e.parameter
                                })
                            }
                            this._mediaObject.payloads = m.codecs.map(e => e.payloadType).join(" "), this._mediaObject.ext = [];
                            for (const e of m.headerExtensions) {
                                (o.ext || []).some(t => t.uri === e.uri) && this._mediaObject.ext.push({
                                    uri: e.uri,
                                    value: e.id
                                })
                            }
                            if (h && "extmap-allow-mixed" === o.extmapAllowMixed && (this._mediaObject.extmapAllowMixed = "extmap-allow-mixed"), o.simulcast) {
                                this._mediaObject.simulcast = {
                                    dir1: "recv",
                                    list1: o.simulcast.list1
                                }, this._mediaObject.rids = [];
                                for (const e of o.rids || []) "send" === e.direction && this._mediaObject.rids.push({
                                    id: e.id,
                                    direction: "recv"
                                })
                            } else if (o.simulcast_03) {
                                this._mediaObject.simulcast_03 = {
                                    value: o.simulcast_03.value.replace(/send/g, "recv")
                                }, this._mediaObject.rids = [];
                                for (const e of o.rids || []) "send" === e.direction && this._mediaObject.rids.push({
                                    id: e.id,
                                    direction: "recv"
                                })
                            }
                            this._mediaObject.rtcpMux = "rtcp-mux", this._mediaObject.rtcpRsize = "rtcp-rsize", this._planB && "video" === this._mediaObject.type && (this._mediaObject.xGoogleFlag = "conference");
                            break;
                        case "application":
                            "number" == typeof o.sctpPort ? (this._mediaObject.payloads = "webrtc-datachannel", this._mediaObject.sctpPort = c.port, this._mediaObject.maxMessageSize = c.maxMessageSize) : o.sctpmap && (this._mediaObject.payloads = c.port, this._mediaObject.sctpmap = {
                                app: "webrtc-datachannel",
                                sctpmapNumber: c.port,
                                maxMessageSize: c.maxMessageSize
                            })
                    }
                }
                setDtlsRole(e) {
                    switch (e) {
                        case "client":
                            this._mediaObject.setup = "active";
                            break;
                        case "server":
                            this._mediaObject.setup = "passive";
                            break;
                        case "auto":
                            this._mediaObject.setup = "actpass"
                    }
                }
            }
            exports.AnswerMediaSection = s;
            class i extends t {
                constructor({
                    iceParameters: e,
                    iceCandidates: t,
                    dtlsParameters: s,
                    sctpParameters: i,
                    plainRtpParameters: c,
                    planB: r = !1,
                    mid: d,
                    kind: o,
                    offerRtpParameters: p,
                    streamId: m,
                    trackId: n,
                    oldDataChannelSpec: h = !1
                }) {
                    switch (super({
                        iceParameters: e,
                        iceCandidates: t,
                        dtlsParameters: s,
                        planB: r
                    }), this._mediaObject.mid = String(d), this._mediaObject.type = o, c ? (this._mediaObject.connection = {
                        ip: c.ip,
                        version: c.ipVersion
                    }, this._mediaObject.protocol = "RTP/AVP", this._mediaObject.port = c.port) : (this._mediaObject.connection = {
                        ip: "127.0.0.1",
                        version: 4
                    }, this._mediaObject.protocol = i ? "UDP/DTLS/SCTP" : "UDP/TLS/RTP/SAVPF", this._mediaObject.port = 7), o) {
                        case "audio":
                        case "video": {
                            this._mediaObject.direction = "sendonly", this._mediaObject.rtp = [], this._mediaObject.rtcpFb = [], this._mediaObject.fmtp = [], this._planB || (this._mediaObject.msid = `${m||"-"} ${n}`);
                            for (const i of p.codecs) {
                                const e = {
                                    payload: i.payloadType,
                                    codec: a(i),
                                    rate: i.clockRate
                                };
                                i.channels > 1 && (e.encoding = i.channels), this._mediaObject.rtp.push(e);
                                const t = {
                                    payload: i.payloadType,
                                    config: ""
                                };
                                for (const s of Object.keys(i.parameters)) t.config && (t.config += ";"), t.config += `${s}=${i.parameters[s]}`;
                                t.config && this._mediaObject.fmtp.push(t);
                                for (const s of i.rtcpFeedback) this._mediaObject.rtcpFb.push({
                                    payload: i.payloadType,
                                    type: s.type,
                                    subtype: s.parameter
                                })
                            }
                            this._mediaObject.payloads = p.codecs.map(e => e.payloadType).join(" "), this._mediaObject.ext = [];
                            for (const i of p.headerExtensions) this._mediaObject.ext.push({
                                uri: i.uri,
                                value: i.id
                            });
                            this._mediaObject.rtcpMux = "rtcp-mux", this._mediaObject.rtcpRsize = "rtcp-rsize";
                            const e = p.encodings[0],
                                t = e.ssrc,
                                s = e.rtx && e.rtx.ssrc ? e.rtx.ssrc : void 0;
                            this._mediaObject.ssrcs = [], this._mediaObject.ssrcGroups = [], p.rtcp.cname && this._mediaObject.ssrcs.push({
                                id: t,
                                attribute: "cname",
                                value: p.rtcp.cname
                            }), this._planB && this._mediaObject.ssrcs.push({
                                id: t,
                                attribute: "msid",
                                value: `${m||"-"} ${n}`
                            }), s && (p.rtcp.cname && this._mediaObject.ssrcs.push({
                                id: s,
                                attribute: "cname",
                                value: p.rtcp.cname
                            }), this._planB && this._mediaObject.ssrcs.push({
                                id: s,
                                attribute: "msid",
                                value: `${m||"-"} ${n}`
                            }), this._mediaObject.ssrcGroups.push({
                                semantics: "FID",
                                ssrcs: `${t} ${s}`
                            }));
                            break
                        }
                        case "application":
                            h ? (this._mediaObject.payloads = i.port, this._mediaObject.sctpmap = {
                                app: "webrtc-datachannel",
                                sctpmapNumber: i.port,
                                maxMessageSize: i.maxMessageSize
                            }) : (this._mediaObject.payloads = "webrtc-datachannel", this._mediaObject.sctpPort = i.port, this._mediaObject.maxMessageSize = i.maxMessageSize)
                    }
                }
                setDtlsRole(e) {
                    this._mediaObject.setup = "actpass"
                }
                planBReceive({
                    offerRtpParameters: e,
                    streamId: t,
                    trackId: s
                }) {
                    const i = e.encodings[0],
                        a = i.ssrc,
                        c = i.rtx && i.rtx.ssrc ? i.rtx.ssrc : void 0;
                    e.rtcp.cname && this._mediaObject.ssrcs.push({
                        id: a,
                        attribute: "cname",
                        value: e.rtcp.cname
                    }), this._mediaObject.ssrcs.push({
                        id: a,
                        attribute: "msid",
                        value: `${t||"-"} ${s}`
                    }), c && (e.rtcp.cname && this._mediaObject.ssrcs.push({
                        id: c,
                        attribute: "cname",
                        value: e.rtcp.cname
                    }), this._mediaObject.ssrcs.push({
                        id: c,
                        attribute: "msid",
                        value: `${t||"-"} ${s}`
                    }), this._mediaObject.ssrcGroups.push({
                        semantics: "FID",
                        ssrcs: `${a} ${c}`
                    }))
                }
                planBStopReceiving({
                    offerRtpParameters: e
                }) {
                    const t = e.encodings[0],
                        s = t.ssrc,
                        i = t.rtx && t.rtx.ssrc ? t.rtx.ssrc : void 0;
                    this._mediaObject.ssrcs = this._mediaObject.ssrcs.filter(e => e.id !== s && e.id !== i), i && (this._mediaObject.ssrcGroups = this._mediaObject.ssrcGroups.filter(e => e.ssrcs !== `${s} ${i}`))
                }
            }

            function a(e) {
                const t = new RegExp("^(audio|video)/(.+)", "i").exec(e.mimeType);
                if (!t) throw new TypeError("invalid codec.mimeType");
                return t[2]
            }
            exports.OfferMediaSection = i;
        }, {
            "../../utils": "FOZT"
        }],
        "aH4R": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../../Logger"),
                i = require("./MediaSection"),
                s = new t.Logger("RemoteSdp");
            class a {
                constructor({
                    iceParameters: e,
                    iceCandidates: t,
                    dtlsParameters: i,
                    sctpParameters: s,
                    plainRtpParameters: a,
                    planB: r = !1
                }) {
                    if (this._mediaSections = [], this._midToIndex = new Map, this._iceParameters = e, this._iceCandidates = t, this._dtlsParameters = i, this._sctpParameters = s, this._plainRtpParameters = a, this._planB = r, this._sdpObject = {
                            version: 0,
                            origin: {
                                address: "0.0.0.0",
                                ipVer: 4,
                                netType: "IN",
                                sessionId: 1e4,
                                sessionVersion: 0,
                                username: "mediasoup-client"
                            },
                            name: "-",
                            timing: {
                                start: 0,
                                stop: 0
                            },
                            media: []
                        }, e && e.iceLite && (this._sdpObject.icelite = "ice-lite"), i) {
                        this._sdpObject.msidSemantic = {
                            semantic: "WMS",
                            token: "*"
                        };
                        const e = this._dtlsParameters.fingerprints.length;
                        this._sdpObject.fingerprint = {
                            type: i.fingerprints[e - 1].algorithm,
                            hash: i.fingerprints[e - 1].value
                        }, this._sdpObject.groups = [{
                            type: "BUNDLE",
                            mids: ""
                        }]
                    }
                    a && (this._sdpObject.origin.address = a.ip, this._sdpObject.origin.ipVer = a.ipVersion)
                }
                updateIceParameters(e) {
                    s.debug("updateIceParameters() [iceParameters:%o]", e), this._iceParameters = e, this._sdpObject.icelite = e.iceLite ? "ice-lite" : void 0;
                    for (const t of this._mediaSections) t.setIceParameters(e)
                }
                updateDtlsRole(e) {
                    s.debug("updateDtlsRole() [role:%s]", e), this._dtlsParameters.role = e;
                    for (const t of this._mediaSections) t.setDtlsRole(e)
                }
                getNextMediaSectionIdx() {
                    for (let e = 0; e < this._mediaSections.length; ++e) {
                        const t = this._mediaSections[e];
                        if (t.closed) return {
                            idx: e,
                            reuseMid: t.mid
                        }
                    }
                    return {
                        idx: this._mediaSections.length
                    }
                }
                send({
                    offerMediaObject: e,
                    reuseMid: t,
                    offerRtpParameters: s,
                    answerRtpParameters: a,
                    codecOptions: r,
                    extmapAllowMixed: d = !1
                }) {
                    const n = new i.AnswerMediaSection({
                        iceParameters: this._iceParameters,
                        iceCandidates: this._iceCandidates,
                        dtlsParameters: this._dtlsParameters,
                        plainRtpParameters: this._plainRtpParameters,
                        planB: this._planB,
                        offerMediaObject: e,
                        offerRtpParameters: s,
                        answerRtpParameters: a,
                        codecOptions: r,
                        extmapAllowMixed: d
                    });
                    t ? this._replaceMediaSection(n, t) : this._midToIndex.has(n.mid) ? this._replaceMediaSection(n) : this._addMediaSection(n)
                }
                receive({
                    mid: e,
                    kind: t,
                    offerRtpParameters: s,
                    streamId: a,
                    trackId: r
                }) {
                    const d = this._midToIndex.get(e);
                    let n;
                    void 0 !== d && (n = this._mediaSections[d]), n ? (n.planBReceive({
                        offerRtpParameters: s,
                        streamId: a,
                        trackId: r
                    }), this._replaceMediaSection(n)) : (n = new i.OfferMediaSection({
                        iceParameters: this._iceParameters,
                        iceCandidates: this._iceCandidates,
                        dtlsParameters: this._dtlsParameters,
                        plainRtpParameters: this._plainRtpParameters,
                        planB: this._planB,
                        mid: e,
                        kind: t,
                        offerRtpParameters: s,
                        streamId: a,
                        trackId: r
                    }), this._addMediaSection(n))
                }
                disableMediaSection(e) {
                    const t = this._midToIndex.get(e);
                    if (void 0 === t) throw new Error(`no media section found with mid '${e}'`);
                    this._mediaSections[t].disable()
                }
                closeMediaSection(e) {
                    const t = this._midToIndex.get(e);
                    if (void 0 === t) throw new Error(`no media section found with mid '${e}'`);
                    const i = this._mediaSections[t];
                    if (e === this._firstMid) return s.debug("closeMediaSection() | cannot close first media section, disabling it instead [mid:%s]", e), void this.disableMediaSection(e);
                    i.close(), this._regenerateBundleMids()
                }
                planBStopReceiving({
                    mid: e,
                    offerRtpParameters: t
                }) {
                    const i = this._midToIndex.get(e);
                    if (void 0 === i) throw new Error(`no media section found with mid '${e}'`);
                    const s = this._mediaSections[i];
                    s.planBStopReceiving({
                        offerRtpParameters: t
                    }), this._replaceMediaSection(s)
                }
                sendSctpAssociation({
                    offerMediaObject: e
                }) {
                    const t = new i.AnswerMediaSection({
                        iceParameters: this._iceParameters,
                        iceCandidates: this._iceCandidates,
                        dtlsParameters: this._dtlsParameters,
                        sctpParameters: this._sctpParameters,
                        plainRtpParameters: this._plainRtpParameters,
                        offerMediaObject: e
                    });
                    this._addMediaSection(t)
                }
                receiveSctpAssociation({
                    oldDataChannelSpec: e = !1
                } = {}) {
                    const t = new i.OfferMediaSection({
                        iceParameters: this._iceParameters,
                        iceCandidates: this._iceCandidates,
                        dtlsParameters: this._dtlsParameters,
                        sctpParameters: this._sctpParameters,
                        plainRtpParameters: this._plainRtpParameters,
                        mid: "datachannel",
                        kind: "application",
                        oldDataChannelSpec: e
                    });
                    this._addMediaSection(t)
                }
                getSdp() {
                    return this._sdpObject.origin.sessionVersion++, e.write(this._sdpObject)
                }
                _addMediaSection(e) {
                    this._firstMid || (this._firstMid = e.mid), this._mediaSections.push(e), this._midToIndex.set(e.mid, this._mediaSections.length - 1), this._sdpObject.media.push(e.getObject()), this._regenerateBundleMids()
                }
                _replaceMediaSection(e, t) {
                    if ("string" == typeof t) {
                        const i = this._midToIndex.get(t);
                        if (void 0 === i) throw new Error(`no media section found for reuseMid '${t}'`);
                        const s = this._mediaSections[i];
                        this._mediaSections[i] = e, this._midToIndex.delete(s.mid), this._midToIndex.set(e.mid, i), this._sdpObject.media[i] = e.getObject(), this._regenerateBundleMids()
                    } else {
                        const t = this._midToIndex.get(e.mid);
                        if (void 0 === t) throw new Error(`no media section found with mid '${e.mid}'`);
                        this._mediaSections[t] = e, this._sdpObject.media[t] = e.getObject()
                    }
                }
                _regenerateBundleMids() {
                    this._dtlsParameters && (this._sdpObject.groups[0].mids = this._mediaSections.filter(e => !e.closed).map(e => e.mid).join(" "))
                }
            }
            exports.RemoteSdp = a;
        }, {
            "sdp-transform": "tbaU",
            "../../Logger": "p5bA",
            "./MediaSection": "f7De"
        }],
        "QdG4": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = new RegExp("^[LS]([1-9]\\d{0,1})T([1-9]\\d{0,1})");

            function r(r) {
                const s = e.exec(r || "");
                return s ? {
                    spatialLayers: Number(s[1]),
                    temporalLayers: Number(s[2])
                } : {
                    spatialLayers: 1,
                    temporalLayers: 1
                }
            }
            exports.parse = r;
        }, {}],
        "vpFN": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                s = require("../utils"),
                i = require("../ortc"),
                a = require("./sdp/commonUtils"),
                r = require("./sdp/unifiedPlanUtils"),
                c = require("./HandlerInterface"),
                n = require("./sdp/RemoteSdp"),
                o = require("../scalabilityModes"),
                d = new t.Logger("Chrome74"),
                p = {
                    OS: 1024,
                    MIS: 1024
                };
            class l extends c.HandlerInterface {
                constructor() {
                    super(), this._mapMidTransceiver = new Map, this._sendStream = new MediaStream, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new l
                }
                get name() {
                    return "Chrome74"
                }
                close() {
                    if (d.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    d.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "unified-plan"
                    });
                    try {
                        t.addTransceiver("audio"), t.addTransceiver("video");
                        const r = await t.createOffer();
                        try {
                            t.close()
                        } catch (s) {}
                        const c = e.parse(r.sdp);
                        return a.extractRtpCapabilities({
                            sdpObject: c
                        })
                    } catch (s) {
                        try {
                            t.close()
                        } catch (i) {}
                        throw s
                    }
                }
                async getNativeSctpCapabilities() {
                    return d.debug("getNativeSctpCapabilities()"), {
                        numStreams: p
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: s,
                    dtlsParameters: a,
                    sctpParameters: r,
                    iceServers: c,
                    iceTransportPolicy: o,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: h
                }) {
                    d.debug("run()"), this._direction = e, this._remoteSdp = new n.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: s,
                        dtlsParameters: a,
                        sctpParameters: r
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", h),
                        video: i.getSendingRtpParameters("video", h)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", h),
                        video: i.getSendingRemoteRtpParameters("video", h)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: c || [],
                        iceTransportPolicy: o || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "unified-plan",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    d.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (d.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            d.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            d.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: c,
                    codecOptions: n,
                    codec: p
                }) {
                    this._assertSendDirection(), d.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), c && c.length > 1 && c.forEach((e, t) => {
                        e.rid = `r${t}`
                    });
                    const l = s.clone(this._sendingRtpParametersByKind[t.kind]);
                    l.codecs = i.reduceCodecs(l.codecs, p);
                    const h = s.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    h.codecs = i.reduceCodecs(h.codecs, p);
                    const m = this._remoteSdp.getNextMediaSectionIdx(),
                        g = this._pc.addTransceiver(t, {
                            direction: "sendonly",
                            streams: [this._sendStream],
                            sendEncodings: c
                        });
                    let _, f = await this._pc.createOffer(),
                        S = e.parse(f.sdp);
                    this._transportReady || await this._setupTransport({
                        localDtlsRole: "server",
                        localSdpObject: S
                    });
                    let u = !1;
                    const R = o.parse((c || [{}])[0].scalabilityMode);
                    c && 1 === c.length && R.spatialLayers > 1 && "video/vp9" === l.codecs[0].mimeType.toLowerCase() && (d.debug("send() | enabling legacy simulcast for VP9 SVC"), u = !0, _ = (S = e.parse(f.sdp)).media[m.idx], r.addLegacySimulcast({
                        offerMediaObject: _,
                        numStreams: R.spatialLayers
                    }), f = {
                        type: "offer",
                        sdp: e.write(S)
                    }), d.debug("send() | calling pc.setLocalDescription() [offer:%o]", f), await this._pc.setLocalDescription(f);
                    const w = g.mid;
                    if (l.mid = w, _ = (S = e.parse(this._pc.localDescription.sdp)).media[m.idx], l.rtcp.cname = a.getCname({
                            offerMediaObject: _
                        }), c)
                        if (1 === c.length) {
                            let e = r.getRtpEncodings({
                                offerMediaObject: _
                            });
                            Object.assign(e[0], c[0]), u && (e = [e[0]]), l.encodings = e
                        } else l.encodings = c;
                    else l.encodings = r.getRtpEncodings({
                        offerMediaObject: _
                    });
                    if (l.encodings.length > 1 && ("video/vp8" === l.codecs[0].mimeType.toLowerCase() || "video/h264" === l.codecs[0].mimeType.toLowerCase()))
                        for (const e of l.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: _,
                        reuseMid: m.reuseMid,
                        offerRtpParameters: l,
                        answerRtpParameters: h,
                        codecOptions: n,
                        extmapAllowMixed: !0
                    });
                    const v = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    return d.debug("send() | calling pc.setRemoteDescription() [answer:%o]", v), await this._pc.setRemoteDescription(v), this._mapMidTransceiver.set(w, g), {
                        localId: w,
                        rtpParameters: l,
                        rtpSender: g.sender
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), d.debug("stopSending() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    t.sender.replaceTrack(null), this._pc.removeTrack(t.sender), this._remoteSdp.closeMediaSection(t.mid);
                    const s = await this._pc.createOffer();
                    d.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", s), await this._pc.setLocalDescription(s);
                    const i = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? d.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : d.debug("replaceTrack() [localId:%s, no track]", e);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    await s.sender.replaceTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), d.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        e.active = s <= t
                    }), await s.sender.setParameters(i)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), d.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        i.encodings[s] = {
                            ...e,
                            ...t
                        }
                    }), await s.sender.setParameters(i)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.sender.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: s,
                    maxRetransmits: i,
                    label: a,
                    protocol: r,
                    priority: c
                }) {
                    this._assertSendDirection();
                    const n = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: s,
                        maxRetransmits: i,
                        protocol: r,
                        priority: c
                    };
                    d.debug("sendDataChannel() [options:%o]", n);
                    const o = this._pc.createDataChannel(a, n);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % p.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            s = e.parse(t.sdp),
                            i = s.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: s
                        }), d.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: i
                        });
                        const a = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setRemoteDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: o,
                        sctpStreamParameters: {
                            streamId: n.id,
                            ordered: n.ordered,
                            maxPacketLifeTime: n.maxPacketLifeTime,
                            maxRetransmits: n.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: s,
                    rtpParameters: i
                }) {
                    this._assertRecvDirection(), d.debug("receive() [trackId:%s, kind:%s]", t, s);
                    const r = i.mid || String(this._mapMidTransceiver.size);
                    this._remoteSdp.receive({
                        mid: r,
                        kind: s,
                        offerRtpParameters: i,
                        streamId: i.rtcp.cname,
                        trackId: t
                    });
                    const c = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", c), await this._pc.setRemoteDescription(c);
                    let n = await this._pc.createAnswer();
                    const o = e.parse(n.sdp),
                        p = o.media.find(e => String(e.mid) === r);
                    a.applyCodecParameters({
                        offerRtpParameters: i,
                        answerMediaObject: p
                    }), n = {
                        type: "answer",
                        sdp: e.write(o)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: o
                    }), d.debug("receive() | calling pc.setLocalDescription() [answer:%o]", n), await this._pc.setLocalDescription(n);
                    const l = this._pc.getTransceivers().find(e => e.mid === r);
                    if (!l) throw new Error("new RTCRtpTransceiver not found");
                    return this._mapMidTransceiver.set(r, l), {
                        localId: r,
                        track: l.receiver.track,
                        rtpReceiver: l.receiver
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), d.debug("stopReceiving() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    this._remoteSdp.closeMediaSection(t.mid);
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    d.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.receiver.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: s,
                    protocol: i
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: a,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n
                    } = t, o = {
                        negotiated: !0,
                        id: a,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n,
                        protocol: i
                    };
                    d.debug("receiveDataChannel() [options:%o]", o);
                    const p = this._pc.createDataChannel(s, o);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation();
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const s = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(s.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setLocalDescription(s), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: s
                }) {
                    s || (s = e.parse(this._pc.localDescription.sdp));
                    const i = a.extractDtlsParameters({
                        sdpObject: s
                    });
                    i.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: i
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Chrome74 = l;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/unifiedPlanUtils": "Dujs",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R",
            "../scalabilityModes": "QdG4"
        }],
        "wNnR": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                s = require("../utils"),
                i = require("../ortc"),
                a = require("./sdp/commonUtils"),
                r = require("./sdp/unifiedPlanUtils"),
                n = require("./HandlerInterface"),
                c = require("./sdp/RemoteSdp"),
                o = require("../scalabilityModes"),
                d = new t.Logger("Chrome70"),
                p = {
                    OS: 1024,
                    MIS: 1024
                };
            class l extends n.HandlerInterface {
                constructor() {
                    super(), this._mapMidTransceiver = new Map, this._sendStream = new MediaStream, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new l
                }
                get name() {
                    return "Chrome70"
                }
                close() {
                    if (d.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    d.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "unified-plan"
                    });
                    try {
                        t.addTransceiver("audio"), t.addTransceiver("video");
                        const r = await t.createOffer();
                        try {
                            t.close()
                        } catch (s) {}
                        const n = e.parse(r.sdp);
                        return a.extractRtpCapabilities({
                            sdpObject: n
                        })
                    } catch (s) {
                        try {
                            t.close()
                        } catch (i) {}
                        throw s
                    }
                }
                async getNativeSctpCapabilities() {
                    return d.debug("getNativeSctpCapabilities()"), {
                        numStreams: p
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: s,
                    dtlsParameters: a,
                    sctpParameters: r,
                    iceServers: n,
                    iceTransportPolicy: o,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: m
                }) {
                    d.debug("run()"), this._direction = e, this._remoteSdp = new c.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: s,
                        dtlsParameters: a,
                        sctpParameters: r
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", m),
                        video: i.getSendingRtpParameters("video", m)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", m),
                        video: i.getSendingRemoteRtpParameters("video", m)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: n || [],
                        iceTransportPolicy: o || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "unified-plan",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    d.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (d.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            d.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            d.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: n,
                    codecOptions: c,
                    codec: p
                }) {
                    this._assertSendDirection(), d.debug("send() [kind:%s, track.id:%s]", t.kind, t.id);
                    const l = s.clone(this._sendingRtpParametersByKind[t.kind]);
                    l.codecs = i.reduceCodecs(l.codecs, p);
                    const m = s.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    m.codecs = i.reduceCodecs(m.codecs, p);
                    const h = this._remoteSdp.getNextMediaSectionIdx(),
                        g = this._pc.addTransceiver(t, {
                            direction: "sendonly",
                            streams: [this._sendStream]
                        });
                    let f, _ = await this._pc.createOffer(),
                        u = e.parse(_.sdp);
                    this._transportReady || await this._setupTransport({
                        localDtlsRole: "server",
                        localSdpObject: u
                    }), n && n.length > 1 && (d.debug("send() | enabling legacy simulcast"), f = (u = e.parse(_.sdp)).media[h.idx], r.addLegacySimulcast({
                        offerMediaObject: f,
                        numStreams: n.length
                    }), _ = {
                        type: "offer",
                        sdp: e.write(u)
                    });
                    let S = !1;
                    const R = o.parse((n || [{}])[0].scalabilityMode);
                    if (n && 1 === n.length && R.spatialLayers > 1 && "video/vp9" === l.codecs[0].mimeType.toLowerCase() && (d.debug("send() | enabling legacy simulcast for VP9 SVC"), S = !0, f = (u = e.parse(_.sdp)).media[h.idx], r.addLegacySimulcast({
                            offerMediaObject: f,
                            numStreams: R.spatialLayers
                        }), _ = {
                            type: "offer",
                            sdp: e.write(u)
                        }), d.debug("send() | calling pc.setLocalDescription() [offer:%o]", _), await this._pc.setLocalDescription(_), n) {
                        d.debug("send() | applying given encodings");
                        const e = g.sender.getParameters();
                        for (let t = 0; t < (e.encodings || []).length; ++t) {
                            const s = e.encodings[t],
                                i = n[t];
                            if (!i) break;
                            e.encodings[t] = Object.assign(s, i)
                        }
                        await g.sender.setParameters(e)
                    }
                    const w = g.mid;
                    if (l.mid = w, f = (u = e.parse(this._pc.localDescription.sdp)).media[h.idx], l.rtcp.cname = a.getCname({
                            offerMediaObject: f
                        }), l.encodings = r.getRtpEncodings({
                            offerMediaObject: f
                        }), n)
                        for (let e = 0; e < l.encodings.length; ++e) n[e] && Object.assign(l.encodings[e], n[e]);
                    if (S && (l.encodings = [l.encodings[0]]), l.encodings.length > 1 && ("video/vp8" === l.codecs[0].mimeType.toLowerCase() || "video/h264" === l.codecs[0].mimeType.toLowerCase()))
                        for (const e of l.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: f,
                        reuseMid: h.reuseMid,
                        offerRtpParameters: l,
                        answerRtpParameters: m,
                        codecOptions: c
                    });
                    const v = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    return d.debug("send() | calling pc.setRemoteDescription() [answer:%o]", v), await this._pc.setRemoteDescription(v), this._mapMidTransceiver.set(w, g), {
                        localId: w,
                        rtpParameters: l,
                        rtpSender: g.sender
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), d.debug("stopSending() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    t.sender.replaceTrack(null), this._pc.removeTrack(t.sender), this._remoteSdp.closeMediaSection(t.mid);
                    const s = await this._pc.createOffer();
                    d.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", s), await this._pc.setLocalDescription(s);
                    const i = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? d.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : d.debug("replaceTrack() [localId:%s, no track]", e);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    await s.sender.replaceTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), d.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        e.active = s <= t
                    }), await s.sender.setParameters(i)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), d.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        i.encodings[s] = {
                            ...e,
                            ...t
                        }
                    }), await s.sender.setParameters(i)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.sender.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: s,
                    maxRetransmits: i,
                    label: a,
                    protocol: r,
                    priority: n
                }) {
                    this._assertSendDirection();
                    const c = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: s,
                        maxRetransmitTime: s,
                        maxRetransmits: i,
                        protocol: r,
                        priority: n
                    };
                    d.debug("sendDataChannel() [options:%o]", c);
                    const o = this._pc.createDataChannel(a, c);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % p.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            s = e.parse(t.sdp),
                            i = s.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: s
                        }), d.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: i
                        });
                        const a = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setRemoteDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: o,
                        sctpStreamParameters: {
                            streamId: c.id,
                            ordered: c.ordered,
                            maxPacketLifeTime: c.maxPacketLifeTime,
                            maxRetransmits: c.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: s,
                    rtpParameters: i
                }) {
                    this._assertRecvDirection(), d.debug("receive() [trackId:%s, kind:%s]", t, s);
                    const r = i.mid || String(this._mapMidTransceiver.size);
                    this._remoteSdp.receive({
                        mid: r,
                        kind: s,
                        offerRtpParameters: i,
                        streamId: i.rtcp.cname,
                        trackId: t
                    });
                    const n = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", n), await this._pc.setRemoteDescription(n);
                    let c = await this._pc.createAnswer();
                    const o = e.parse(c.sdp),
                        p = o.media.find(e => String(e.mid) === r);
                    a.applyCodecParameters({
                        offerRtpParameters: i,
                        answerMediaObject: p
                    }), c = {
                        type: "answer",
                        sdp: e.write(o)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: o
                    }), d.debug("receive() | calling pc.setLocalDescription() [answer:%o]", c), await this._pc.setLocalDescription(c);
                    const l = this._pc.getTransceivers().find(e => e.mid === r);
                    if (!l) throw new Error("new RTCRtpTransceiver not found");
                    return this._mapMidTransceiver.set(r, l), {
                        localId: r,
                        track: l.receiver.track,
                        rtpReceiver: l.receiver
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), d.debug("stopReceiving() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    this._remoteSdp.closeMediaSection(t.mid);
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    d.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.receiver.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: s,
                    protocol: i
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: a,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c
                    } = t, o = {
                        negotiated: !0,
                        id: a,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmitTime: n,
                        maxRetransmits: c,
                        protocol: i
                    };
                    d.debug("receiveDataChannel() [options:%o]", o);
                    const p = this._pc.createDataChannel(s, o);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation();
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const s = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(s.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setLocalDescription(s), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: s
                }) {
                    s || (s = e.parse(this._pc.localDescription.sdp));
                    const i = a.extractDtlsParameters({
                        sdpObject: s
                    });
                    i.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: i
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Chrome70 = l;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/unifiedPlanUtils": "Dujs",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R",
            "../scalabilityModes": "QdG4"
        }],
        "nNFi": [function(require, module, exports) {
            "use strict";

            function s({
                offerMediaObject: s,
                track: t
            }) {
                let r;
                const e = new Set;
                for (const o of s.ssrcs || []) {
                    if ("msid" !== o.attribute) continue;
                    if (o.value.split(" ")[1] === t.id) {
                        const s = o.id;
                        e.add(s), r || (r = s)
                    }
                }
                if (0 === e.size) throw new Error(`a=ssrc line with msid information not found [track.id:${t.id}]`);
                const i = new Map;
                for (const o of s.ssrcGroups || []) {
                    if ("FID" !== o.semantics) continue;
                    let [s, t] = o.ssrcs.split(/\s+/);
                    s = Number(s), t = Number(t), e.has(s) && (e.delete(s), e.delete(t), i.set(s, t))
                }
                for (const o of e) i.set(o, null);
                const n = [];
                for (const [o, c] of i) {
                    const s = {
                        ssrc: o
                    };
                    c && (s.rtx = {
                        ssrc: c
                    }), n.push(s)
                }
                return n
            }

            function t({
                offerMediaObject: s,
                track: t,
                numStreams: r
            }) {
                if (r <= 1) throw new TypeError("numStreams must be greater than 1");
                let e, i, n;
                if (!(s.ssrcs || []).find(s => {
                        if ("msid" !== s.attribute) return !1;
                        return s.value.split(" ")[1] === t.id && (e = s.id, n = s.value.split(" ")[0], !0)
                    })) throw new Error(`a=ssrc line with msid information not found [track.id:${t.id}]`);
                (s.ssrcGroups || []).some(s => {
                    if ("FID" !== s.semantics) return !1;
                    const t = s.ssrcs.split(/\s+/);
                    return Number(t[0]) === e && (i = Number(t[1]), !0)
                });
                const o = s.ssrcs.find(s => "cname" === s.attribute && s.id === e);
                if (!o) throw new Error(`a=ssrc line with cname information not found [track.id:${t.id}]`);
                const c = o.value,
                    u = [],
                    a = [];
                for (let d = 0; d < r; ++d) u.push(e + d), i && a.push(i + d);
                s.ssrcGroups = s.ssrcGroups || [], s.ssrcs = s.ssrcs || [], s.ssrcGroups.push({
                    semantics: "SIM",
                    ssrcs: u.join(" ")
                });
                for (let d = 0; d < u.length; ++d) {
                    const r = u[d];
                    s.ssrcs.push({
                        id: r,
                        attribute: "cname",
                        value: c
                    }), s.ssrcs.push({
                        id: r,
                        attribute: "msid",
                        value: `${n} ${t.id}`
                    })
                }
                for (let d = 0; d < a.length; ++d) {
                    const r = u[d],
                        e = a[d];
                    s.ssrcs.push({
                        id: e,
                        attribute: "cname",
                        value: c
                    }), s.ssrcs.push({
                        id: e,
                        attribute: "msid",
                        value: `${n} ${t.id}`
                    }), s.ssrcGroups.push({
                        semantics: "FID",
                        ssrcs: `${r} ${e}`
                    })
                }
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            }), exports.getRtpEncodings = s, exports.addLegacySimulcast = t;
        }, {}],
        "gY4Q": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                a = require("../utils"),
                s = require("../ortc"),
                i = require("./sdp/commonUtils"),
                r = require("./sdp/planBUtils"),
                n = require("./HandlerInterface"),
                c = require("./sdp/RemoteSdp"),
                o = new t.Logger("Chrome67"),
                d = {
                    OS: 1024,
                    MIS: 1024
                };
            class p extends n.HandlerInterface {
                constructor() {
                    super(), this._sendStream = new MediaStream, this._mapSendLocalIdRtpSender = new Map, this._nextSendLocalId = 0, this._mapRecvLocalIdInfo = new Map, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new p
                }
                get name() {
                    return "Chrome67"
                }
                close() {
                    if (o.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    o.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b"
                    });
                    try {
                        const r = await t.createOffer({
                            offerToReceiveAudio: !0,
                            offerToReceiveVideo: !0
                        });
                        try {
                            t.close()
                        } catch (a) {}
                        const n = e.parse(r.sdp);
                        return i.extractRtpCapabilities({
                            sdpObject: n
                        })
                    } catch (a) {
                        try {
                            t.close()
                        } catch (s) {}
                        throw a
                    }
                }
                async getNativeSctpCapabilities() {
                    return o.debug("getNativeSctpCapabilities()"), {
                        numStreams: d
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: a,
                    dtlsParameters: i,
                    sctpParameters: r,
                    iceServers: n,
                    iceTransportPolicy: d,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: h
                }) {
                    o.debug("run()"), this._direction = e, this._remoteSdp = new c.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: a,
                        dtlsParameters: i,
                        sctpParameters: r,
                        planB: !0
                    }), this._sendingRtpParametersByKind = {
                        audio: s.getSendingRtpParameters("audio", h),
                        video: s.getSendingRtpParameters("video", h)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: s.getSendingRemoteRtpParameters("audio", h),
                        video: s.getSendingRemoteRtpParameters("video", h)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: n || [],
                        iceTransportPolicy: d || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    o.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (o.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            o.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            o.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: n,
                    codecOptions: c,
                    codec: d
                }) {
                    this._assertSendDirection(), o.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), d && o.warn("send() | codec selection is not available in %s handler", this.name), this._sendStream.addTrack(t), this._pc.addTrack(t, this._sendStream);
                    let p, l = await this._pc.createOffer(),
                        h = e.parse(l.sdp);
                    const m = a.clone(this._sendingRtpParametersByKind[t.kind]);
                    m.codecs = s.reduceCodecs(m.codecs);
                    const g = a.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    if (g.codecs = s.reduceCodecs(g.codecs), this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: h
                        }), "video" === t.kind && n && n.length > 1 && (o.debug("send() | enabling simulcast"), p = (h = e.parse(l.sdp)).media.find(e => "video" === e.type), r.addLegacySimulcast({
                            offerMediaObject: p,
                            track: t,
                            numStreams: n.length
                        }), l = {
                            type: "offer",
                            sdp: e.write(h)
                        }), o.debug("send() | calling pc.setLocalDescription() [offer:%o]", l), await this._pc.setLocalDescription(l), p = (h = e.parse(this._pc.localDescription.sdp)).media.find(e => e.type === t.kind), m.rtcp.cname = i.getCname({
                            offerMediaObject: p
                        }), m.encodings = r.getRtpEncodings({
                            offerMediaObject: p,
                            track: t
                        }), n)
                        for (let e = 0; e < m.encodings.length; ++e) n[e] && Object.assign(m.encodings[e], n[e]);
                    if (m.encodings.length > 1 && "video/vp8" === m.codecs[0].mimeType.toLowerCase())
                        for (const e of m.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: p,
                        offerRtpParameters: m,
                        answerRtpParameters: g,
                        codecOptions: c
                    });
                    const S = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("send() | calling pc.setRemoteDescription() [answer:%o]", S), await this._pc.setRemoteDescription(S);
                    const _ = String(this._nextSendLocalId);
                    this._nextSendLocalId++;
                    const f = this._pc.getSenders().find(e => e.track === t);
                    return this._mapSendLocalIdRtpSender.set(_, f), {
                        localId: _,
                        rtpParameters: m,
                        rtpSender: f
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), o.debug("stopSending() [localId:%s]", e);
                    const t = this._mapSendLocalIdRtpSender.get(e);
                    if (!t) throw new Error("associated RTCRtpSender not found");
                    this._pc.removeTrack(t), t.track && this._sendStream.removeTrack(t.track), this._mapSendLocalIdRtpSender.delete(e);
                    const a = await this._pc.createOffer();
                    o.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", a);
                    try {
                        await this._pc.setLocalDescription(a)
                    } catch (i) {
                        if (0 === this._sendStream.getTracks().length) return void o.warn("stopSending() | ignoring expected error due no sending tracks: %s", i.toString());
                        throw i
                    }
                    if ("stable" === this._pc.signalingState) return;
                    const s = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setRemoteDescription(s)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? o.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : o.debug("replaceTrack() [localId:%s, no track]", e);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.track;
                    await a.replaceTrack(t), s && this._sendStream.removeTrack(s), t && this._sendStream.addTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), o.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.getParameters();
                    s.encodings.forEach((e, a) => {
                        e.active = a <= t
                    }), await a.setParameters(s)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), o.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.getParameters();
                    s.encodings.forEach((e, a) => {
                        s.encodings[a] = {
                            ...e,
                            ...t
                        }
                    }), await a.setParameters(s)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapSendLocalIdRtpSender.get(e);
                    if (!t) throw new Error("associated RTCRtpSender not found");
                    return t.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: a,
                    maxRetransmits: s,
                    label: i,
                    protocol: r,
                    priority: n
                }) {
                    this._assertSendDirection();
                    const c = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: a,
                        maxRetransmitTime: a,
                        maxRetransmits: s,
                        protocol: r,
                        priority: n
                    };
                    o.debug("sendDataChannel() [options:%o]", c);
                    const p = this._pc.createDataChannel(i, c);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % d.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            a = e.parse(t.sdp),
                            s = a.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: a
                        }), o.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: s
                        });
                        const i = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p,
                        sctpStreamParameters: {
                            streamId: c.id,
                            ordered: c.ordered,
                            maxPacketLifeTime: c.maxPacketLifeTime,
                            maxRetransmits: c.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: a,
                    rtpParameters: s
                }) {
                    this._assertRecvDirection(), o.debug("receive() [trackId:%s, kind:%s]", t, a);
                    const r = t,
                        n = a;
                    this._remoteSdp.receive({
                        mid: n,
                        kind: a,
                        offerRtpParameters: s,
                        streamId: s.rtcp.cname,
                        trackId: t
                    });
                    const c = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", c), await this._pc.setRemoteDescription(c);
                    let d = await this._pc.createAnswer();
                    const p = e.parse(d.sdp),
                        l = p.media.find(e => String(e.mid) === n);
                    i.applyCodecParameters({
                        offerRtpParameters: s,
                        answerMediaObject: l
                    }), d = {
                        type: "answer",
                        sdp: e.write(p)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: p
                    }), o.debug("receive() | calling pc.setLocalDescription() [answer:%o]", d), await this._pc.setLocalDescription(d);
                    const h = this._pc.getReceivers().find(e => e.track && e.track.id === r);
                    if (!h) throw new Error("new RTCRtpReceiver not");
                    return this._mapRecvLocalIdInfo.set(r, {
                        mid: n,
                        rtpParameters: s,
                        rtpReceiver: h
                    }), {
                        localId: r,
                        track: h.track,
                        rtpReceiver: h
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), o.debug("stopReceiving() [localId:%s]", e);
                    const {
                        mid: t,
                        rtpParameters: a
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    this._mapRecvLocalIdInfo.delete(e), this._remoteSdp.planBStopReceiving({
                        mid: t,
                        offerRtpParameters: a
                    });
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    o.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const {
                        rtpReceiver: t
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    if (!t) throw new Error("associated RTCRtpReceiver not found");
                    return t.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: a,
                    protocol: s
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c
                    } = t, d = {
                        negotiated: !0,
                        id: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmitTime: n,
                        maxRetransmits: c,
                        protocol: s
                    };
                    o.debug("receiveDataChannel() [options:%o]", d);
                    const p = this._pc.createDataChannel(a, d);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation({
                            oldDataChannelSpec: !0
                        });
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const a = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(a.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setLocalDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: a
                }) {
                    a || (a = e.parse(this._pc.localDescription.sdp));
                    const s = i.extractDtlsParameters({
                        sdpObject: a
                    });
                    s.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: s
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Chrome67 = p;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/planBUtils": "nNFi",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "PqYG": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                a = require("../errors"),
                s = require("../utils"),
                i = require("../ortc"),
                r = require("./sdp/commonUtils"),
                n = require("./sdp/planBUtils"),
                c = require("./HandlerInterface"),
                o = require("./sdp/RemoteSdp"),
                d = new t.Logger("Chrome55"),
                p = {
                    OS: 1024,
                    MIS: 1024
                };
            class l extends c.HandlerInterface {
                constructor() {
                    super(), this._sendStream = new MediaStream, this._mapSendLocalIdTrack = new Map, this._nextSendLocalId = 0, this._mapRecvLocalIdInfo = new Map, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new l
                }
                get name() {
                    return "Chrome55"
                }
                close() {
                    if (d.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    d.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b"
                    });
                    try {
                        const i = await t.createOffer({
                            offerToReceiveAudio: !0,
                            offerToReceiveVideo: !0
                        });
                        try {
                            t.close()
                        } catch (a) {}
                        const n = e.parse(i.sdp);
                        return r.extractRtpCapabilities({
                            sdpObject: n
                        })
                    } catch (a) {
                        try {
                            t.close()
                        } catch (s) {}
                        throw a
                    }
                }
                async getNativeSctpCapabilities() {
                    return d.debug("getNativeSctpCapabilities()"), {
                        numStreams: p
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: a,
                    dtlsParameters: s,
                    sctpParameters: r,
                    iceServers: n,
                    iceTransportPolicy: c,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: m
                }) {
                    d.debug("run()"), this._direction = e, this._remoteSdp = new o.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: a,
                        dtlsParameters: s,
                        sctpParameters: r,
                        planB: !0
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", m),
                        video: i.getSendingRtpParameters("video", m)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", m),
                        video: i.getSendingRemoteRtpParameters("video", m)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: n || [],
                        iceTransportPolicy: c || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    d.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (d.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            d.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            d.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: a,
                    codecOptions: c,
                    codec: o
                }) {
                    this._assertSendDirection(), d.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), o && d.warn("send() | codec selection is not available in %s handler", this.name), this._sendStream.addTrack(t), this._pc.addStream(this._sendStream);
                    let p, l = await this._pc.createOffer(),
                        m = e.parse(l.sdp);
                    const h = s.clone(this._sendingRtpParametersByKind[t.kind]);
                    h.codecs = i.reduceCodecs(h.codecs);
                    const g = s.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    if (g.codecs = i.reduceCodecs(g.codecs), this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: m
                        }), "video" === t.kind && a && a.length > 1 && (d.debug("send() | enabling simulcast"), p = (m = e.parse(l.sdp)).media.find(e => "video" === e.type), n.addLegacySimulcast({
                            offerMediaObject: p,
                            track: t,
                            numStreams: a.length
                        }), l = {
                            type: "offer",
                            sdp: e.write(m)
                        }), d.debug("send() | calling pc.setLocalDescription() [offer:%o]", l), await this._pc.setLocalDescription(l), p = (m = e.parse(this._pc.localDescription.sdp)).media.find(e => e.type === t.kind), h.rtcp.cname = r.getCname({
                            offerMediaObject: p
                        }), h.encodings = n.getRtpEncodings({
                            offerMediaObject: p,
                            track: t
                        }), a)
                        for (let e = 0; e < h.encodings.length; ++e) a[e] && Object.assign(h.encodings[e], a[e]);
                    if (h.encodings.length > 1 && "video/vp8" === h.codecs[0].mimeType.toLowerCase())
                        for (const e of h.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: p,
                        offerRtpParameters: h,
                        answerRtpParameters: g,
                        codecOptions: c
                    });
                    const S = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("send() | calling pc.setRemoteDescription() [answer:%o]", S), await this._pc.setRemoteDescription(S);
                    const _ = String(this._nextSendLocalId);
                    return this._nextSendLocalId++, this._mapSendLocalIdTrack.set(_, t), {
                        localId: _,
                        rtpParameters: h
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), d.debug("stopSending() [localId:%s]", e);
                    const t = this._mapSendLocalIdTrack.get(e);
                    if (!t) throw new Error("track not found");
                    this._mapSendLocalIdTrack.delete(e), this._sendStream.removeTrack(t), this._pc.addStream(this._sendStream);
                    const a = await this._pc.createOffer();
                    d.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", a);
                    try {
                        await this._pc.setLocalDescription(a)
                    } catch (i) {
                        if (0 === this._sendStream.getTracks().length) return void d.warn("stopSending() | ignoring expected error due no sending tracks: %s", i.toString());
                        throw i
                    }
                    if ("stable" === this._pc.signalingState) return;
                    const s = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setRemoteDescription(s)
                }
                async replaceTrack(e, t) {
                    throw new a.UnsupportedError("not implemented")
                }
                async setMaxSpatialLayer(e, t) {
                    throw new a.UnsupportedError(" not implemented")
                }
                async setRtpEncodingParameters(e, t) {
                    throw new a.UnsupportedError("not supported")
                }
                async getSenderStats(e) {
                    throw new a.UnsupportedError("not implemented")
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: a,
                    maxRetransmits: s,
                    label: i,
                    protocol: r,
                    priority: n
                }) {
                    this._assertSendDirection();
                    const c = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: a,
                        maxRetransmitTime: a,
                        maxRetransmits: s,
                        protocol: r,
                        priority: n
                    };
                    d.debug("sendDataChannel() [options:%o]", c);
                    const o = this._pc.createDataChannel(i, c);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % p.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            a = e.parse(t.sdp),
                            s = a.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: a
                        }), d.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: s
                        });
                        const i = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: o,
                        sctpStreamParameters: {
                            streamId: c.id,
                            ordered: c.ordered,
                            maxPacketLifeTime: c.maxPacketLifeTime,
                            maxRetransmits: c.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: a,
                    rtpParameters: s
                }) {
                    this._assertRecvDirection(), d.debug("receive() [trackId:%s, kind:%s]", t, a);
                    const i = t,
                        n = a,
                        c = s.rtcp.cname;
                    this._remoteSdp.receive({
                        mid: n,
                        kind: a,
                        offerRtpParameters: s,
                        streamId: c,
                        trackId: t
                    });
                    const o = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", o), await this._pc.setRemoteDescription(o);
                    let p = await this._pc.createAnswer();
                    const l = e.parse(p.sdp),
                        m = l.media.find(e => String(e.mid) === n);
                    r.applyCodecParameters({
                        offerRtpParameters: s,
                        answerMediaObject: m
                    }), p = {
                        type: "answer",
                        sdp: e.write(l)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: l
                    }), d.debug("receive() | calling pc.setLocalDescription() [answer:%o]", p), await this._pc.setLocalDescription(p);
                    const h = this._pc.getRemoteStreams().find(e => e.id === c).getTrackById(i);
                    if (!h) throw new Error("remote track not found");
                    return this._mapRecvLocalIdInfo.set(i, {
                        mid: n,
                        rtpParameters: s
                    }), {
                        localId: i,
                        track: h
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), d.debug("stopReceiving() [localId:%s]", e);
                    const {
                        mid: t,
                        rtpParameters: a
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    this._mapRecvLocalIdInfo.delete(e), this._remoteSdp.planBStopReceiving({
                        mid: t,
                        offerRtpParameters: a
                    });
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    d.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    throw new a.UnsupportedError("not implemented")
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: a,
                    protocol: s
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c
                    } = t, o = {
                        negotiated: !0,
                        id: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmitTime: n,
                        maxRetransmits: c,
                        protocol: s
                    };
                    d.debug("receiveDataChannel() [options:%o]", o);
                    const p = this._pc.createDataChannel(a, o);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation({
                            oldDataChannelSpec: !0
                        });
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const a = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(a.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setLocalDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: a
                }) {
                    a || (a = e.parse(this._pc.localDescription.sdp));
                    const s = r.extractDtlsParameters({
                        sdpObject: a
                    });
                    s.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: s
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Chrome55 = l;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../errors": "p8GN",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/planBUtils": "nNFi",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "sZJw": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                s = require("../errors"),
                a = require("../utils"),
                i = require("../ortc"),
                r = require("./sdp/commonUtils"),
                c = require("./sdp/unifiedPlanUtils"),
                n = require("./HandlerInterface"),
                o = require("./sdp/RemoteSdp"),
                d = new t.Logger("Firefox60"),
                p = {
                    OS: 16,
                    MIS: 2048
                };
            class l extends n.HandlerInterface {
                constructor() {
                    super(), this._mapMidTransceiver = new Map, this._sendStream = new MediaStream, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new l
                }
                get name() {
                    return "Firefox60"
                }
                close() {
                    if (d.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    d.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                            iceServers: [],
                            iceTransportPolicy: "all",
                            bundlePolicy: "max-bundle",
                            rtcpMuxPolicy: "require"
                        }),
                        s = document.createElement("canvas");
                    s.getContext("2d");
                    const a = s.captureStream().getVideoTracks()[0];
                    try {
                        t.addTransceiver("audio", {
                            direction: "sendrecv"
                        });
                        const n = t.addTransceiver(a, {
                                direction: "sendrecv"
                            }),
                            o = n.sender.getParameters(),
                            d = [{
                                rid: "r0",
                                maxBitrate: 1e5
                            }, {
                                rid: "r1",
                                maxBitrate: 5e5
                            }];
                        o.encodings = d, await n.sender.setParameters(o);
                        const p = await t.createOffer();
                        try {
                            s.remove()
                        } catch (i) {}
                        try {
                            a.stop()
                        } catch (i) {}
                        try {
                            t.close()
                        } catch (i) {}
                        const l = e.parse(p.sdp);
                        return r.extractRtpCapabilities({
                            sdpObject: l
                        })
                    } catch (i) {
                        try {
                            s.remove()
                        } catch (c) {}
                        try {
                            a.stop()
                        } catch (c) {}
                        try {
                            t.close()
                        } catch (c) {}
                        throw i
                    }
                }
                async getNativeSctpCapabilities() {
                    return d.debug("getNativeSctpCapabilities()"), {
                        numStreams: p
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: s,
                    dtlsParameters: a,
                    sctpParameters: r,
                    iceServers: c,
                    iceTransportPolicy: n,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: h
                }) {
                    d.debug("run()"), this._direction = e, this._remoteSdp = new o.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: s,
                        dtlsParameters: a,
                        sctpParameters: r
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", h),
                        video: i.getSendingRtpParameters("video", h)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", h),
                        video: i.getSendingRemoteRtpParameters("video", h)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: c || [],
                        iceTransportPolicy: n || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    throw new s.UnsupportedError("not supported")
                }
                async restartIce(e) {
                    if (d.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            d.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            d.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: s,
                    codecOptions: n,
                    codec: o
                }) {
                    let p;
                    this._assertSendDirection(), d.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), s && s.length > 1 && (s.forEach((e, t) => {
                        e.rid = `r${t}`
                    }), p = a.clone(s).reverse());
                    const l = a.clone(this._sendingRtpParametersByKind[t.kind]);
                    l.codecs = i.reduceCodecs(l.codecs, o);
                    const h = a.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    h.codecs = i.reduceCodecs(h.codecs, o);
                    const m = this._pc.addTransceiver(t, {
                        direction: "sendonly",
                        streams: [this._sendStream]
                    });
                    if (p) {
                        const e = m.sender.getParameters();
                        e.encodings = p, await m.sender.setParameters(e)
                    }
                    const g = await this._pc.createOffer();
                    let _ = e.parse(g.sdp);
                    this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: _
                    }), d.debug("send() | calling pc.setLocalDescription() [offer:%o]", g), await this._pc.setLocalDescription(g);
                    const f = m.mid;
                    l.mid = f;
                    const u = (_ = e.parse(this._pc.localDescription.sdp)).media[_.media.length - 1];
                    if (l.rtcp.cname = r.getCname({
                            offerMediaObject: u
                        }), s)
                        if (1 === s.length) {
                            const e = c.getRtpEncodings({
                                offerMediaObject: u
                            });
                            Object.assign(e[0], s[0]), l.encodings = e
                        } else l.encodings = s;
                    else l.encodings = c.getRtpEncodings({
                        offerMediaObject: u
                    });
                    if (l.encodings.length > 1 && ("video/vp8" === l.codecs[0].mimeType.toLowerCase() || "video/h264" === l.codecs[0].mimeType.toLowerCase()))
                        for (const e of l.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: u,
                        offerRtpParameters: l,
                        answerRtpParameters: h,
                        codecOptions: n,
                        extmapAllowMixed: !0
                    });
                    const S = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    return d.debug("send() | calling pc.setRemoteDescription() [answer:%o]", S), await this._pc.setRemoteDescription(S), this._mapMidTransceiver.set(f, m), {
                        localId: f,
                        rtpParameters: l,
                        rtpSender: m.sender
                    }
                }
                async stopSending(e) {
                    d.debug("stopSending() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated transceiver not found");
                    t.sender.replaceTrack(null), this._pc.removeTrack(t.sender), this._remoteSdp.disableMediaSection(t.mid);
                    const s = await this._pc.createOffer();
                    d.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", s), await this._pc.setLocalDescription(s);
                    const a = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setRemoteDescription(a)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? d.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : d.debug("replaceTrack() [localId:%s, no track]", e);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    await s.sender.replaceTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), d.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated transceiver not found");
                    const a = s.sender.getParameters();
                    t = a.encodings.length - 1 - t, a.encodings.forEach((e, s) => {
                        e.active = s >= t
                    }), await s.sender.setParameters(a)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), d.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const a = s.sender.getParameters();
                    a.encodings.forEach((e, s) => {
                        a.encodings[s] = {
                            ...e,
                            ...t
                        }
                    }), await s.sender.setParameters(a)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.sender.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: s,
                    maxRetransmits: a,
                    label: i,
                    protocol: r,
                    priority: c
                }) {
                    this._assertSendDirection();
                    const n = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: s,
                        maxRetransmits: a,
                        protocol: r,
                        priority: c
                    };
                    d.debug("sendDataChannel() [options:%o]", n);
                    const o = this._pc.createDataChannel(i, n);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % p.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            s = e.parse(t.sdp),
                            a = s.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: s
                        }), d.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: a
                        });
                        const i = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: o,
                        sctpStreamParameters: {
                            streamId: n.id,
                            ordered: n.ordered,
                            maxPacketLifeTime: n.maxPacketLifeTime,
                            maxRetransmits: n.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: s,
                    rtpParameters: a
                }) {
                    this._assertRecvDirection(), d.debug("receive() [trackId:%s, kind:%s]", t, s);
                    const i = a.mid || String(this._mapMidTransceiver.size);
                    this._remoteSdp.receive({
                        mid: i,
                        kind: s,
                        offerRtpParameters: a,
                        streamId: a.rtcp.cname,
                        trackId: t
                    });
                    const c = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", c), await this._pc.setRemoteDescription(c);
                    let n = await this._pc.createAnswer();
                    const o = e.parse(n.sdp),
                        p = o.media.find(e => String(e.mid) === i);
                    r.applyCodecParameters({
                        offerRtpParameters: a,
                        answerMediaObject: p
                    }), n = {
                        type: "answer",
                        sdp: e.write(o)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: o
                    }), d.debug("receive() | calling pc.setLocalDescription() [answer:%o]", n), await this._pc.setLocalDescription(n);
                    const l = this._pc.getTransceivers().find(e => e.mid === i);
                    if (!l) throw new Error("new RTCRtpTransceiver not found");
                    return this._mapMidTransceiver.set(i, l), {
                        localId: i,
                        track: l.receiver.track,
                        rtpReceiver: l.receiver
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), d.debug("stopReceiving() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    this._remoteSdp.closeMediaSection(t.mid);
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const a = await this._pc.createAnswer();
                    d.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", a), await this._pc.setLocalDescription(a)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.receiver.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: s,
                    protocol: a
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: i,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n
                    } = t, o = {
                        negotiated: !0,
                        id: i,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n,
                        protocol: a
                    };
                    d.debug("receiveDataChannel() [options:%o]", o);
                    const p = this._pc.createDataChannel(s, o);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation();
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const s = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(s.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setLocalDescription(s), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: s
                }) {
                    s || (s = e.parse(this._pc.localDescription.sdp));
                    const a = r.extractDtlsParameters({
                        sdpObject: s
                    });
                    a.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: a
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Firefox60 = l;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../errors": "p8GN",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/unifiedPlanUtils": "Dujs",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "qfh9": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                s = require("../utils"),
                i = require("../ortc"),
                a = require("./sdp/commonUtils"),
                r = require("./sdp/unifiedPlanUtils"),
                c = require("./HandlerInterface"),
                n = require("./sdp/RemoteSdp"),
                o = new t.Logger("Safari12"),
                d = {
                    OS: 1024,
                    MIS: 1024
                };
            class p extends c.HandlerInterface {
                constructor() {
                    super(), this._mapMidTransceiver = new Map, this._sendStream = new MediaStream, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new p
                }
                get name() {
                    return "Safari12"
                }
                close() {
                    if (o.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    o.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require"
                    });
                    try {
                        t.addTransceiver("audio"), t.addTransceiver("video");
                        const r = await t.createOffer();
                        try {
                            t.close()
                        } catch (s) {}
                        const c = e.parse(r.sdp);
                        return a.extractRtpCapabilities({
                            sdpObject: c
                        })
                    } catch (s) {
                        try {
                            t.close()
                        } catch (i) {}
                        throw s
                    }
                }
                async getNativeSctpCapabilities() {
                    return o.debug("getNativeSctpCapabilities()"), {
                        numStreams: d
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: s,
                    dtlsParameters: a,
                    sctpParameters: r,
                    iceServers: c,
                    iceTransportPolicy: d,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: h
                }) {
                    o.debug("run()"), this._direction = e, this._remoteSdp = new n.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: s,
                        dtlsParameters: a,
                        sctpParameters: r
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", h),
                        video: i.getSendingRtpParameters("video", h)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", h),
                        video: i.getSendingRemoteRtpParameters("video", h)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: c || [],
                        iceTransportPolicy: d || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    o.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (o.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            o.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            o.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: c,
                    codecOptions: n,
                    codec: d
                }) {
                    this._assertSendDirection(), o.debug("send() [kind:%s, track.id:%s]", t.kind, t.id);
                    const p = s.clone(this._sendingRtpParametersByKind[t.kind]);
                    p.codecs = i.reduceCodecs(p.codecs, d);
                    const l = s.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    l.codecs = i.reduceCodecs(l.codecs, d);
                    const h = this._remoteSdp.getNextMediaSectionIdx(),
                        m = this._pc.addTransceiver(t, {
                            direction: "sendonly",
                            streams: [this._sendStream]
                        });
                    let g, _ = await this._pc.createOffer(),
                        S = e.parse(_.sdp);
                    this._transportReady || await this._setupTransport({
                        localDtlsRole: "server",
                        localSdpObject: S
                    }), c && c.length > 1 && (o.debug("send() | enabling legacy simulcast"), g = (S = e.parse(_.sdp)).media[h.idx], r.addLegacySimulcast({
                        offerMediaObject: g,
                        numStreams: c.length
                    }), _ = {
                        type: "offer",
                        sdp: e.write(S)
                    }), o.debug("send() | calling pc.setLocalDescription() [offer:%o]", _), await this._pc.setLocalDescription(_);
                    const f = m.mid;
                    if (p.mid = f, g = (S = e.parse(this._pc.localDescription.sdp)).media[h.idx], p.rtcp.cname = a.getCname({
                            offerMediaObject: g
                        }), p.encodings = r.getRtpEncodings({
                            offerMediaObject: g
                        }), c)
                        for (let e = 0; e < p.encodings.length; ++e) c[e] && Object.assign(p.encodings[e], c[e]);
                    if (p.encodings.length > 1 && ("video/vp8" === p.codecs[0].mimeType.toLowerCase() || "video/h264" === p.codecs[0].mimeType.toLowerCase()))
                        for (const e of p.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: g,
                        reuseMid: h.reuseMid,
                        offerRtpParameters: p,
                        answerRtpParameters: l,
                        codecOptions: n
                    });
                    const u = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    return o.debug("send() | calling pc.setRemoteDescription() [answer:%o]", u), await this._pc.setRemoteDescription(u), this._mapMidTransceiver.set(f, m), {
                        localId: f,
                        rtpParameters: p,
                        rtpSender: m.sender
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), o.debug("stopSending() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    t.sender.replaceTrack(null), this._pc.removeTrack(t.sender), this._remoteSdp.closeMediaSection(t.mid);
                    const s = await this._pc.createOffer();
                    o.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", s), await this._pc.setLocalDescription(s);
                    const i = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? o.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : o.debug("replaceTrack() [localId:%s, no track]", e);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    await s.sender.replaceTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), o.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        e.active = s <= t
                    }), await s.sender.setParameters(i)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), o.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const s = this._mapMidTransceiver.get(e);
                    if (!s) throw new Error("associated RTCRtpTransceiver not found");
                    const i = s.sender.getParameters();
                    i.encodings.forEach((e, s) => {
                        i.encodings[s] = {
                            ...e,
                            ...t
                        }
                    }), await s.sender.setParameters(i)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.sender.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: s,
                    maxRetransmits: i,
                    label: a,
                    protocol: r,
                    priority: c
                }) {
                    this._assertSendDirection();
                    const n = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: s,
                        maxRetransmits: i,
                        protocol: r,
                        priority: c
                    };
                    o.debug("sendDataChannel() [options:%o]", n);
                    const p = this._pc.createDataChannel(a, n);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % d.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            s = e.parse(t.sdp),
                            i = s.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: s
                        }), o.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: i
                        });
                        const a = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setRemoteDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p,
                        sctpStreamParameters: {
                            streamId: n.id,
                            ordered: n.ordered,
                            maxPacketLifeTime: n.maxPacketLifeTime,
                            maxRetransmits: n.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: s,
                    rtpParameters: i
                }) {
                    this._assertRecvDirection(), o.debug("receive() [trackId:%s, kind:%s]", t, s);
                    const r = i.mid || String(this._mapMidTransceiver.size);
                    this._remoteSdp.receive({
                        mid: r,
                        kind: s,
                        offerRtpParameters: i,
                        streamId: i.rtcp.cname,
                        trackId: t
                    });
                    const c = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", c), await this._pc.setRemoteDescription(c);
                    let n = await this._pc.createAnswer();
                    const d = e.parse(n.sdp),
                        p = d.media.find(e => String(e.mid) === r);
                    a.applyCodecParameters({
                        offerRtpParameters: i,
                        answerMediaObject: p
                    }), n = {
                        type: "answer",
                        sdp: e.write(d)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: d
                    }), o.debug("receive() | calling pc.setLocalDescription() [answer:%o]", n), await this._pc.setLocalDescription(n);
                    const l = this._pc.getTransceivers().find(e => e.mid === r);
                    if (!l) throw new Error("new RTCRtpTransceiver not found");
                    return this._mapMidTransceiver.set(r, l), {
                        localId: r,
                        track: l.receiver.track,
                        rtpReceiver: l.receiver
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), o.debug("stopReceiving() [localId:%s]", e);
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    this._remoteSdp.closeMediaSection(t.mid);
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    o.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const t = this._mapMidTransceiver.get(e);
                    if (!t) throw new Error("associated RTCRtpTransceiver not found");
                    return t.receiver.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: s,
                    protocol: i
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: a,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n
                    } = t, d = {
                        negotiated: !0,
                        id: a,
                        ordered: r,
                        maxPacketLifeTime: c,
                        maxRetransmits: n,
                        protocol: i
                    };
                    o.debug("receiveDataChannel() [options:%o]", d);
                    const p = this._pc.createDataChannel(s, d);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation();
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const s = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(s.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setLocalDescription(s), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: s
                }) {
                    s || (s = e.parse(this._pc.localDescription.sdp));
                    const i = a.extractDtlsParameters({
                        sdpObject: s
                    });
                    i.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: i
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Safari12 = p;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/unifiedPlanUtils": "Dujs",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "LRIx": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                a = require("../utils"),
                s = require("../ortc"),
                i = require("./sdp/commonUtils"),
                r = require("./sdp/planBUtils"),
                n = require("./HandlerInterface"),
                c = require("./sdp/RemoteSdp"),
                o = new t.Logger("Safari11"),
                d = {
                    OS: 1024,
                    MIS: 1024
                };
            class p extends n.HandlerInterface {
                constructor() {
                    super(), this._sendStream = new MediaStream, this._mapSendLocalIdRtpSender = new Map, this._nextSendLocalId = 0, this._mapRecvLocalIdInfo = new Map, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new p
                }
                get name() {
                    return "Safari11"
                }
                close() {
                    if (o.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    o.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b"
                    });
                    try {
                        const r = await t.createOffer({
                            offerToReceiveAudio: !0,
                            offerToReceiveVideo: !0
                        });
                        try {
                            t.close()
                        } catch (a) {}
                        const n = e.parse(r.sdp);
                        return i.extractRtpCapabilities({
                            sdpObject: n
                        })
                    } catch (a) {
                        try {
                            t.close()
                        } catch (s) {}
                        throw a
                    }
                }
                async getNativeSctpCapabilities() {
                    return o.debug("getNativeSctpCapabilities()"), {
                        numStreams: d
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: a,
                    dtlsParameters: i,
                    sctpParameters: r,
                    iceServers: n,
                    iceTransportPolicy: d,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: h
                }) {
                    o.debug("run()"), this._direction = e, this._remoteSdp = new c.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: a,
                        dtlsParameters: i,
                        sctpParameters: r,
                        planB: !0
                    }), this._sendingRtpParametersByKind = {
                        audio: s.getSendingRtpParameters("audio", h),
                        video: s.getSendingRtpParameters("video", h)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: s.getSendingRemoteRtpParameters("audio", h),
                        video: s.getSendingRemoteRtpParameters("video", h)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: n || [],
                        iceTransportPolicy: d || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    o.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (o.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            o.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            o.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            o.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: n,
                    codecOptions: c,
                    codec: d
                }) {
                    this._assertSendDirection(), o.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), d && o.warn("send() | codec selection is not available in %s handler", this.name), this._sendStream.addTrack(t), this._pc.addTrack(t, this._sendStream);
                    let p, l = await this._pc.createOffer(),
                        h = e.parse(l.sdp);
                    const m = a.clone(this._sendingRtpParametersByKind[t.kind]);
                    m.codecs = s.reduceCodecs(m.codecs);
                    const g = a.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    if (g.codecs = s.reduceCodecs(g.codecs), this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: h
                        }), "video" === t.kind && n && n.length > 1 && (o.debug("send() | enabling simulcast"), p = (h = e.parse(l.sdp)).media.find(e => "video" === e.type), r.addLegacySimulcast({
                            offerMediaObject: p,
                            track: t,
                            numStreams: n.length
                        }), l = {
                            type: "offer",
                            sdp: e.write(h)
                        }), o.debug("send() | calling pc.setLocalDescription() [offer:%o]", l), await this._pc.setLocalDescription(l), p = (h = e.parse(this._pc.localDescription.sdp)).media.find(e => e.type === t.kind), m.rtcp.cname = i.getCname({
                            offerMediaObject: p
                        }), m.encodings = r.getRtpEncodings({
                            offerMediaObject: p,
                            track: t
                        }), n)
                        for (let e = 0; e < m.encodings.length; ++e) n[e] && Object.assign(m.encodings[e], n[e]);
                    if (m.encodings.length > 1 && "video/vp8" === m.codecs[0].mimeType.toLowerCase())
                        for (const e of m.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: p,
                        offerRtpParameters: m,
                        answerRtpParameters: g,
                        codecOptions: c
                    });
                    const S = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("send() | calling pc.setRemoteDescription() [answer:%o]", S), await this._pc.setRemoteDescription(S);
                    const _ = String(this._nextSendLocalId);
                    this._nextSendLocalId++;
                    const f = this._pc.getSenders().find(e => e.track === t);
                    return this._mapSendLocalIdRtpSender.set(_, f), {
                        localId: _,
                        rtpParameters: m,
                        rtpSender: f
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection();
                    const t = this._mapSendLocalIdRtpSender.get(e);
                    if (!t) throw new Error("associated RTCRtpSender not found");
                    t.track && this._sendStream.removeTrack(t.track), this._mapSendLocalIdRtpSender.delete(e);
                    const a = await this._pc.createOffer();
                    o.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", a);
                    try {
                        await this._pc.setLocalDescription(a)
                    } catch (i) {
                        if (0 === this._sendStream.getTracks().length) return void o.warn("stopSending() | ignoring expected error due no sending tracks: %s", i.toString());
                        throw i
                    }
                    if ("stable" === this._pc.signalingState) return;
                    const s = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setRemoteDescription(s)
                }
                async replaceTrack(e, t) {
                    this._assertSendDirection(), t ? o.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : o.debug("replaceTrack() [localId:%s, no track]", e);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.track;
                    await a.replaceTrack(t), s && this._sendStream.removeTrack(s), t && this._sendStream.addTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    this._assertSendDirection(), o.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.getParameters();
                    s.encodings.forEach((e, a) => {
                        e.active = a <= t
                    }), await a.setParameters(s)
                }
                async setRtpEncodingParameters(e, t) {
                    this._assertSendDirection(), o.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const a = this._mapSendLocalIdRtpSender.get(e);
                    if (!a) throw new Error("associated RTCRtpSender not found");
                    const s = a.getParameters();
                    s.encodings.forEach((e, a) => {
                        s.encodings[a] = {
                            ...e,
                            ...t
                        }
                    }), await a.setParameters(s)
                }
                async getSenderStats(e) {
                    this._assertSendDirection();
                    const t = this._mapSendLocalIdRtpSender.get(e);
                    if (!t) throw new Error("associated RTCRtpSender not found");
                    return t.getStats()
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: a,
                    maxRetransmits: s,
                    label: i,
                    protocol: r,
                    priority: n
                }) {
                    this._assertSendDirection();
                    const c = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: a,
                        maxRetransmits: s,
                        protocol: r,
                        priority: n
                    };
                    o.debug("sendDataChannel() [options:%o]", c);
                    const p = this._pc.createDataChannel(i, c);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % d.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            a = e.parse(t.sdp),
                            s = a.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: a
                        }), o.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: s
                        });
                        const i = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p,
                        sctpStreamParameters: {
                            streamId: c.id,
                            ordered: c.ordered,
                            maxPacketLifeTime: c.maxPacketLifeTime,
                            maxRetransmits: c.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: a,
                    rtpParameters: s
                }) {
                    this._assertRecvDirection(), o.debug("receive() [trackId:%s, kind:%s]", t, a);
                    const r = t,
                        n = a;
                    this._remoteSdp.receive({
                        mid: n,
                        kind: a,
                        offerRtpParameters: s,
                        streamId: s.rtcp.cname,
                        trackId: t
                    });
                    const c = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", c), await this._pc.setRemoteDescription(c);
                    let d = await this._pc.createAnswer();
                    const p = e.parse(d.sdp),
                        l = p.media.find(e => String(e.mid) === n);
                    i.applyCodecParameters({
                        offerRtpParameters: s,
                        answerMediaObject: l
                    }), d = {
                        type: "answer",
                        sdp: e.write(p)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: p
                    }), o.debug("receive() | calling pc.setLocalDescription() [answer:%o]", d), await this._pc.setLocalDescription(d);
                    const h = this._pc.getReceivers().find(e => e.track && e.track.id === r);
                    if (!h) throw new Error("new RTCRtpReceiver not");
                    return this._mapRecvLocalIdInfo.set(r, {
                        mid: n,
                        rtpParameters: s,
                        rtpReceiver: h
                    }), {
                        localId: r,
                        track: h.track,
                        rtpReceiver: h
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), o.debug("stopReceiving() [localId:%s]", e);
                    const {
                        mid: t,
                        rtpParameters: a
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    this._mapRecvLocalIdInfo.delete(e), this._remoteSdp.planBStopReceiving({
                        mid: t,
                        offerRtpParameters: a
                    });
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    o.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    o.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    this._assertRecvDirection();
                    const {
                        rtpReceiver: t
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    if (!t) throw new Error("associated RTCRtpReceiver not found");
                    return t.getStats()
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: a,
                    protocol: s
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c
                    } = t, d = {
                        negotiated: !0,
                        id: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c,
                        protocol: s
                    };
                    o.debug("receiveDataChannel() [options:%o]", d);
                    const p = this._pc.createDataChannel(a, d);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation({
                            oldDataChannelSpec: !0
                        });
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const a = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(a.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        o.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setLocalDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: a
                }) {
                    a || (a = e.parse(this._pc.localDescription.sdp));
                    const s = i.extractDtlsParameters({
                        sdpObject: a
                    });
                    s.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: s
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.Safari11 = p;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/planBUtils": "nNFi",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "AbBu": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("../../utils");

            function t() {
                const t = RTCRtpReceiver.getCapabilities(),
                    n = e.clone(t);
                for (const e of n.codecs) {
                    if (e.channels = e.numChannels, delete e.numChannels, e.mimeType = e.mimeType || `${e.kind}/${e.name}`, e.parameters) {
                        const t = e.parameters;
                        t.apt && (t.apt = Number(t.apt)), t["packetization-mode"] && (t["packetization-mode"] = Number(t["packetization-mode"]))
                    }
                    for (const t of e.rtcpFeedback || []) t.parameter || (t.parameter = "")
                }
                return n
            }

            function n(t) {
                const n = e.clone(t);
                n.mid && (n.muxId = n.mid, delete n.mid);
                for (const e of n.codecs) e.channels && (e.numChannels = e.channels, delete e.channels), e.mimeType && !e.name && (e.name = e.mimeType.split("/")[1]), delete e.mimeType;
                return n
            }
            exports.getCapabilities = t, exports.mangleRtpParameters = n;
        }, {
            "../../utils": "FOZT"
        }],
        "BDvo": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("../Logger"),
                t = require("../errors"),
                r = require("../utils"),
                s = require("../ortc"),
                a = require("./ortc/edgeUtils"),
                n = require("./HandlerInterface"),
                i = new e.Logger("Edge11");
            class c extends n.HandlerInterface {
                constructor() {
                    super(), this._rtpSenders = new Map, this._rtpReceivers = new Map, this._nextSendLocalId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new c
                }
                get name() {
                    return "Edge11"
                }
                close() {
                    i.debug("close()");
                    try {
                        this._iceGatherer.close()
                    } catch (e) {}
                    try {
                        this._iceTransport.stop()
                    } catch (e) {}
                    try {
                        this._dtlsTransport.stop()
                    } catch (e) {}
                    for (const t of this._rtpSenders.values()) try {
                        t.stop()
                    } catch (e) {}
                    for (const t of this._rtpReceivers.values()) try {
                        t.stop()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    return i.debug("getNativeRtpCapabilities()"), a.getCapabilities()
                }
                async getNativeSctpCapabilities() {
                    return i.debug("getNativeSctpCapabilities()"), {
                        numStreams: {
                            OS: 0,
                            MIS: 0
                        }
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: a,
                    dtlsParameters: n,
                    sctpParameters: c,
                    iceServers: o,
                    iceTransportPolicy: d,
                    additionalSettings: p,
                    proprietaryConstraints: h,
                    extendedRtpCapabilities: l
                }) {
                    i.debug("run()"), this._sendingRtpParametersByKind = {
                        audio: s.getSendingRtpParameters("audio", l),
                        video: s.getSendingRtpParameters("video", l)
                    }, this._remoteIceParameters = t, this._remoteIceCandidates = a, this._remoteDtlsParameters = n, this._cname = `CNAME-${r.generateRandomNumber()}`, this._setIceGatherer({
                        iceServers: o,
                        iceTransportPolicy: d
                    }), this._setIceTransport(), this._setDtlsTransport()
                }
                async updateIceServers(e) {
                    throw new t.UnsupportedError("not supported")
                }
                async restartIce(e) {
                    if (i.debug("restartIce()"), this._remoteIceParameters = e, this._transportReady) {
                        i.debug("restartIce() | calling iceTransport.start()"), this._iceTransport.start(this._iceGatherer, e, "controlling");
                        for (const e of this._remoteIceCandidates) this._iceTransport.addRemoteCandidate(e);
                        this._iceTransport.addRemoteCandidate({})
                    }
                }
                async getTransportStats() {
                    return this._iceTransport.getStats()
                }
                async send({
                    track: e,
                    encodings: t,
                    codecOptions: n,
                    codec: c
                }) {
                    i.debug("send() [kind:%s, track.id:%s]", e.kind, e.id), this._transportReady || await this._setupTransport({
                        localDtlsRole: "server"
                    }), i.debug("send() | calling new RTCRtpSender()");
                    const o = new RTCRtpSender(e, this._dtlsTransport),
                        d = r.clone(this._sendingRtpParametersByKind[e.kind]);
                    d.codecs = s.reduceCodecs(d.codecs, c);
                    const p = d.codecs.some(e => /.+\/rtx$/i.test(e.mimeType));
                    t || (t = [{}]);
                    for (const s of t) s.ssrc = r.generateRandomNumber(), p && (s.rtx = {
                        ssrc: r.generateRandomNumber()
                    });
                    d.encodings = t, d.rtcp = {
                        cname: this._cname,
                        reducedSize: !0,
                        mux: !0
                    };
                    const h = a.mangleRtpParameters(d);
                    i.debug("send() | calling rtpSender.send() [params:%o]", h), await o.send(h);
                    const l = String(this._nextSendLocalId);
                    return this._nextSendLocalId++, this._rtpSenders.set(l, o), {
                        localId: l,
                        rtpParameters: d,
                        rtpSender: o
                    }
                }
                async stopSending(e) {
                    i.debug("stopSending() [localId:%s]", e);
                    const t = this._rtpSenders.get(e);
                    if (!t) throw new Error("RTCRtpSender not found");
                    this._rtpSenders.delete(e);
                    try {
                        i.debug("stopSending() | calling rtpSender.stop()"), t.stop()
                    } catch (r) {
                        throw i.warn("stopSending() | rtpSender.stop() failed:%o", r), r
                    }
                }
                async replaceTrack(e, t) {
                    t ? i.debug("replaceTrack() [localId:%s, track.id:%s]", e, t.id) : i.debug("replaceTrack() [localId:%s, no track]", e);
                    const r = this._rtpSenders.get(e);
                    if (!r) throw new Error("RTCRtpSender not found");
                    r.setTrack(t)
                }
                async setMaxSpatialLayer(e, t) {
                    i.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", e, t);
                    const r = this._rtpSenders.get(e);
                    if (!r) throw new Error("RTCRtpSender not found");
                    const s = r.getParameters();
                    s.encodings.forEach((e, r) => {
                        e.active = r <= t
                    }), await r.setParameters(s)
                }
                async setRtpEncodingParameters(e, t) {
                    i.debug("setRtpEncodingParameters() [localId:%s, params:%o]", e, t);
                    const r = this._rtpSenders.get(e);
                    if (!r) throw new Error("RTCRtpSender not found");
                    const s = r.getParameters();
                    s.encodings.forEach((e, r) => {
                        s.encodings[r] = {
                            ...e,
                            ...t
                        }
                    }), await r.setParameters(s)
                }
                async getSenderStats(e) {
                    const t = this._rtpSenders.get(e);
                    if (!t) throw new Error("RTCRtpSender not found");
                    return t.getStats()
                }
                async sendDataChannel(e) {
                    throw new t.UnsupportedError("not implemented")
                }
                async receive({
                    trackId: e,
                    kind: t,
                    rtpParameters: r
                }) {
                    i.debug("receive() [trackId:%s, kind:%s]", e, t), this._transportReady || await this._setupTransport({
                        localDtlsRole: "server"
                    }), i.debug("receive() | calling new RTCRtpReceiver()");
                    const s = new RTCRtpReceiver(this._dtlsTransport, t);
                    s.addEventListener("error", e => {
                        i.error('rtpReceiver "error" event [event:%o]', e)
                    });
                    const n = a.mangleRtpParameters(r);
                    i.debug("receive() | calling rtpReceiver.receive() [params:%o]", n), await s.receive(n);
                    const c = e;
                    return this._rtpReceivers.set(c, s), {
                        localId: c,
                        track: s.track,
                        rtpReceiver: s
                    }
                }
                async stopReceiving(e) {
                    i.debug("stopReceiving() [localId:%s]", e);
                    const t = this._rtpReceivers.get(e);
                    if (!t) throw new Error("RTCRtpReceiver not found");
                    this._rtpReceivers.delete(e);
                    try {
                        i.debug("stopReceiving() | calling rtpReceiver.stop()"), t.stop()
                    } catch (r) {
                        i.warn("stopReceiving() | rtpReceiver.stop() failed:%o", r)
                    }
                }
                async getReceiverStats(e) {
                    const t = this._rtpReceivers.get(e);
                    if (!t) throw new Error("RTCRtpReceiver not found");
                    return t.getStats()
                }
                async receiveDataChannel(e) {
                    throw new t.UnsupportedError("not implemented")
                }
                _setIceGatherer({
                    iceServers: e,
                    iceTransportPolicy: t
                }) {
                    const r = new RTCIceGatherer({
                        iceServers: e || [],
                        gatherPolicy: t || "all"
                    });
                    r.addEventListener("error", e => {
                        i.error('iceGatherer "error" event [event:%o]', e)
                    });
                    try {
                        r.gather()
                    } catch (s) {
                        i.debug("_setIceGatherer() | iceGatherer.gather() failed: %s", s.toString())
                    }
                    this._iceGatherer = r
                }
                _setIceTransport() {
                    const e = new RTCIceTransport(this._iceGatherer);
                    e.addEventListener("statechange", () => {
                        switch (e.state) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    }), e.addEventListener("icestatechange", () => {
                        switch (e.state) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    }), e.addEventListener("candidatepairchange", e => {
                        i.debug('iceTransport "candidatepairchange" event [pair:%o]', e.pair)
                    }), this._iceTransport = e
                }
                _setDtlsTransport() {
                    const e = new RTCDtlsTransport(this._iceTransport);
                    e.addEventListener("statechange", () => {
                        i.debug('dtlsTransport "statechange" event [state:%s]', e.state)
                    }), e.addEventListener("dtlsstatechange", () => {
                        i.debug('dtlsTransport "dtlsstatechange" event [state:%s]', e.state), "closed" === e.state && this.emit("@connectionstatechange", "closed")
                    }), e.addEventListener("error", e => {
                        i.error('dtlsTransport "error" event [event:%o]', e)
                    }), this._dtlsTransport = e
                }
                async _setupTransport({
                    localDtlsRole: e
                }) {
                    i.debug("_setupTransport()");
                    const t = this._dtlsTransport.getLocalParameters();
                    t.role = e, await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: t
                    }), this._iceTransport.start(this._iceGatherer, this._remoteIceParameters, "controlling");
                    for (const r of this._remoteIceCandidates) this._iceTransport.addRemoteCandidate(r);
                    this._iceTransport.addRemoteCandidate({}), this._remoteDtlsParameters.fingerprints = this._remoteDtlsParameters.fingerprints.filter(e => "sha-256" === e.algorithm || "sha-384" === e.algorithm || "sha-512" === e.algorithm), this._dtlsTransport.start(this._remoteDtlsParameters), this._transportReady = !0
                }
            }
            exports.Edge11 = c;
        }, {
            "../Logger": "p5bA",
            "../errors": "p8GN",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./ortc/edgeUtils": "AbBu",
            "./HandlerInterface": "iuhH"
        }],
        "fsTO": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("sdp-transform"),
                t = require("../Logger"),
                a = require("../errors"),
                s = require("../utils"),
                i = require("../ortc"),
                r = require("./sdp/commonUtils"),
                n = require("./sdp/planBUtils"),
                c = require("./HandlerInterface"),
                o = require("./sdp/RemoteSdp"),
                d = new t.Logger("ReactNative"),
                p = {
                    OS: 1024,
                    MIS: 1024
                };
            class l extends c.HandlerInterface {
                constructor() {
                    super(), this._sendStream = new MediaStream, this._mapSendLocalIdTrack = new Map, this._nextSendLocalId = 0, this._mapRecvLocalIdInfo = new Map, this._hasDataChannelMediaSection = !1, this._nextSendSctpStreamId = 0, this._transportReady = !1
                }
                static createFactory() {
                    return () => new l
                }
                get name() {
                    return "ReactNative"
                }
                close() {
                    if (d.debug("close()"), this._pc) try {
                        this._pc.close()
                    } catch (e) {}
                }
                async getNativeRtpCapabilities() {
                    d.debug("getNativeRtpCapabilities()");
                    const t = new RTCPeerConnection({
                        iceServers: [],
                        iceTransportPolicy: "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b"
                    });
                    try {
                        const i = await t.createOffer({
                            offerToReceiveAudio: !0,
                            offerToReceiveVideo: !0
                        });
                        try {
                            t.close()
                        } catch (a) {}
                        const n = e.parse(i.sdp);
                        return r.extractRtpCapabilities({
                            sdpObject: n
                        })
                    } catch (a) {
                        try {
                            t.close()
                        } catch (s) {}
                        throw a
                    }
                }
                async getNativeSctpCapabilities() {
                    return d.debug("getNativeSctpCapabilities()"), {
                        numStreams: p
                    }
                }
                run({
                    direction: e,
                    iceParameters: t,
                    iceCandidates: a,
                    dtlsParameters: s,
                    sctpParameters: r,
                    iceServers: n,
                    iceTransportPolicy: c,
                    additionalSettings: p,
                    proprietaryConstraints: l,
                    extendedRtpCapabilities: m
                }) {
                    d.debug("run()"), this._direction = e, this._remoteSdp = new o.RemoteSdp({
                        iceParameters: t,
                        iceCandidates: a,
                        dtlsParameters: s,
                        sctpParameters: r,
                        planB: !0
                    }), this._sendingRtpParametersByKind = {
                        audio: i.getSendingRtpParameters("audio", m),
                        video: i.getSendingRtpParameters("video", m)
                    }, this._sendingRemoteRtpParametersByKind = {
                        audio: i.getSendingRemoteRtpParameters("audio", m),
                        video: i.getSendingRemoteRtpParameters("video", m)
                    }, this._pc = new RTCPeerConnection({
                        iceServers: n || [],
                        iceTransportPolicy: c || "all",
                        bundlePolicy: "max-bundle",
                        rtcpMuxPolicy: "require",
                        sdpSemantics: "plan-b",
                        ...p
                    }, l), this._pc.addEventListener("iceconnectionstatechange", () => {
                        switch (this._pc.iceConnectionState) {
                            case "checking":
                                this.emit("@connectionstatechange", "connecting");
                                break;
                            case "connected":
                            case "completed":
                                this.emit("@connectionstatechange", "connected");
                                break;
                            case "failed":
                                this.emit("@connectionstatechange", "failed");
                                break;
                            case "disconnected":
                                this.emit("@connectionstatechange", "disconnected");
                                break;
                            case "closed":
                                this.emit("@connectionstatechange", "closed")
                        }
                    })
                }
                async updateIceServers(e) {
                    d.debug("updateIceServers()");
                    const t = this._pc.getConfiguration();
                    t.iceServers = e, this._pc.setConfiguration(t)
                }
                async restartIce(e) {
                    if (d.debug("restartIce()"), this._remoteSdp.updateIceParameters(e), this._transportReady)
                        if ("send" === this._direction) {
                            const e = await this._pc.createOffer({
                                iceRestart: !0
                            });
                            d.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", e), await this._pc.setLocalDescription(e);
                            const t = {
                                type: "answer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", t), await this._pc.setRemoteDescription(t)
                        } else {
                            const e = {
                                type: "offer",
                                sdp: this._remoteSdp.getSdp()
                            };
                            d.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", e), await this._pc.setRemoteDescription(e);
                            const t = await this._pc.createAnswer();
                            d.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", t), await this._pc.setLocalDescription(t)
                        }
                }
                async getTransportStats() {
                    return this._pc.getStats()
                }
                async send({
                    track: t,
                    encodings: a,
                    codecOptions: c,
                    codec: o
                }) {
                    this._assertSendDirection(), d.debug("send() [kind:%s, track.id:%s]", t.kind, t.id), o && d.warn("send() | codec selection is not available in %s handler", this.name), this._sendStream.addTrack(t), this._pc.addStream(this._sendStream);
                    let p, l = await this._pc.createOffer(),
                        m = e.parse(l.sdp);
                    const h = s.clone(this._sendingRtpParametersByKind[t.kind]);
                    h.codecs = i.reduceCodecs(h.codecs);
                    const g = s.clone(this._sendingRemoteRtpParametersByKind[t.kind]);
                    if (g.codecs = i.reduceCodecs(g.codecs), this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: m
                        }), "video" === t.kind && a && a.length > 1 && (d.debug("send() | enabling simulcast"), p = (m = e.parse(l.sdp)).media.find(e => "video" === e.type), n.addLegacySimulcast({
                            offerMediaObject: p,
                            track: t,
                            numStreams: a.length
                        }), l = {
                            type: "offer",
                            sdp: e.write(m)
                        }), d.debug("send() | calling pc.setLocalDescription() [offer:%o]", l), await this._pc.setLocalDescription(l), p = (m = e.parse(this._pc.localDescription.sdp)).media.find(e => e.type === t.kind), h.rtcp.cname = r.getCname({
                            offerMediaObject: p
                        }), h.encodings = n.getRtpEncodings({
                            offerMediaObject: p,
                            track: t
                        }), a)
                        for (let e = 0; e < h.encodings.length; ++e) a[e] && Object.assign(h.encodings[e], a[e]);
                    if (h.encodings.length > 1 && ("video/vp8" === h.codecs[0].mimeType.toLowerCase() || "video/h264" === h.codecs[0].mimeType.toLowerCase()))
                        for (const e of h.encodings) e.scalabilityMode = "S1T3";
                    this._remoteSdp.send({
                        offerMediaObject: p,
                        offerRtpParameters: h,
                        answerRtpParameters: g,
                        codecOptions: c
                    });
                    const S = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("send() | calling pc.setRemoteDescription() [answer:%o]", S), await this._pc.setRemoteDescription(S);
                    const _ = String(this._nextSendLocalId);
                    return this._nextSendLocalId++, this._mapSendLocalIdTrack.set(_, t), {
                        localId: _,
                        rtpParameters: h
                    }
                }
                async stopSending(e) {
                    this._assertSendDirection(), d.debug("stopSending() [localId:%s]", e);
                    const t = this._mapSendLocalIdTrack.get(e);
                    if (!t) throw new Error("track not found");
                    this._mapSendLocalIdTrack.delete(e), this._sendStream.removeTrack(t), this._pc.addStream(this._sendStream);
                    const a = await this._pc.createOffer();
                    d.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", a);
                    try {
                        await this._pc.setLocalDescription(a)
                    } catch (i) {
                        if (0 === this._sendStream.getTracks().length) return void d.warn("stopSending() | ignoring expected error due no sending tracks: %s", i.toString());
                        throw i
                    }
                    if ("stable" === this._pc.signalingState) return;
                    const s = {
                        type: "answer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", s), await this._pc.setRemoteDescription(s)
                }
                async replaceTrack(e, t) {
                    throw new a.UnsupportedError("not implemented")
                }
                async setMaxSpatialLayer(e, t) {
                    throw new a.UnsupportedError("not implemented")
                }
                async setRtpEncodingParameters(e, t) {
                    throw new a.UnsupportedError("not implemented")
                }
                async getSenderStats(e) {
                    throw new a.UnsupportedError("not implemented")
                }
                async sendDataChannel({
                    ordered: t,
                    maxPacketLifeTime: a,
                    maxRetransmits: s,
                    label: i,
                    protocol: r,
                    priority: n
                }) {
                    this._assertSendDirection();
                    const c = {
                        negotiated: !0,
                        id: this._nextSendSctpStreamId,
                        ordered: t,
                        maxPacketLifeTime: a,
                        maxRetransmitTime: a,
                        maxRetransmits: s,
                        protocol: r,
                        priority: n
                    };
                    d.debug("sendDataChannel() [options:%o]", c);
                    const o = this._pc.createDataChannel(i, c);
                    if (this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % p.MIS, !this._hasDataChannelMediaSection) {
                        const t = await this._pc.createOffer(),
                            a = e.parse(t.sdp),
                            s = a.media.find(e => "application" === e.type);
                        this._transportReady || await this._setupTransport({
                            localDtlsRole: "server",
                            localSdpObject: a
                        }), d.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", t), await this._pc.setLocalDescription(t), this._remoteSdp.sendSctpAssociation({
                            offerMediaObject: s
                        });
                        const i = {
                            type: "answer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", i), await this._pc.setRemoteDescription(i), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: o,
                        sctpStreamParameters: {
                            streamId: c.id,
                            ordered: c.ordered,
                            maxPacketLifeTime: c.maxPacketLifeTime,
                            maxRetransmits: c.maxRetransmits
                        }
                    }
                }
                async receive({
                    trackId: t,
                    kind: a,
                    rtpParameters: i
                }) {
                    this._assertRecvDirection(), d.debug("receive() [trackId:%s, kind:%s]", t, a);
                    const n = t,
                        c = a;
                    let o = i.rtcp.cname;
                    d.debug("receive() | forcing a random remote streamId to avoid well known bug in react-native-webrtc"), o += `-hack-${s.generateRandomNumber()}`, this._remoteSdp.receive({
                        mid: c,
                        kind: a,
                        offerRtpParameters: i,
                        streamId: o,
                        trackId: t
                    });
                    const p = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", p), await this._pc.setRemoteDescription(p);
                    let l = await this._pc.createAnswer();
                    const m = e.parse(l.sdp),
                        h = m.media.find(e => String(e.mid) === c);
                    r.applyCodecParameters({
                        offerRtpParameters: i,
                        answerMediaObject: h
                    }), l = {
                        type: "answer",
                        sdp: e.write(m)
                    }, this._transportReady || await this._setupTransport({
                        localDtlsRole: "client",
                        localSdpObject: m
                    }), d.debug("receive() | calling pc.setLocalDescription() [answer:%o]", l), await this._pc.setLocalDescription(l);
                    const g = this._pc.getRemoteStreams().find(e => e.id === o).getTrackById(n);
                    if (!g) throw new Error("remote track not found");
                    return this._mapRecvLocalIdInfo.set(n, {
                        mid: c,
                        rtpParameters: i
                    }), {
                        localId: n,
                        track: g
                    }
                }
                async stopReceiving(e) {
                    this._assertRecvDirection(), d.debug("stopReceiving() [localId:%s]", e);
                    const {
                        mid: t,
                        rtpParameters: a
                    } = this._mapRecvLocalIdInfo.get(e) || {};
                    this._mapRecvLocalIdInfo.delete(e), this._remoteSdp.planBStopReceiving({
                        mid: t,
                        offerRtpParameters: a
                    });
                    const s = {
                        type: "offer",
                        sdp: this._remoteSdp.getSdp()
                    };
                    d.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", s), await this._pc.setRemoteDescription(s);
                    const i = await this._pc.createAnswer();
                    d.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", i), await this._pc.setLocalDescription(i)
                }
                async getReceiverStats(e) {
                    throw new a.UnsupportedError("not implemented")
                }
                async receiveDataChannel({
                    sctpStreamParameters: t,
                    label: a,
                    protocol: s
                }) {
                    this._assertRecvDirection();
                    const {
                        streamId: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmits: c
                    } = t, o = {
                        negotiated: !0,
                        id: i,
                        ordered: r,
                        maxPacketLifeTime: n,
                        maxRetransmitTime: n,
                        maxRetransmits: c,
                        protocol: s
                    };
                    d.debug("receiveDataChannel() [options:%o]", o);
                    const p = this._pc.createDataChannel(a, o);
                    if (!this._hasDataChannelMediaSection) {
                        this._remoteSdp.receiveSctpAssociation({
                            oldDataChannelSpec: !0
                        });
                        const t = {
                            type: "offer",
                            sdp: this._remoteSdp.getSdp()
                        };
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", t), await this._pc.setRemoteDescription(t);
                        const a = await this._pc.createAnswer();
                        if (!this._transportReady) {
                            const t = e.parse(a.sdp);
                            await this._setupTransport({
                                localDtlsRole: "client",
                                localSdpObject: t
                            })
                        }
                        d.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", a), await this._pc.setLocalDescription(a), this._hasDataChannelMediaSection = !0
                    }
                    return {
                        dataChannel: p
                    }
                }
                async _setupTransport({
                    localDtlsRole: t,
                    localSdpObject: a
                }) {
                    a || (a = e.parse(this._pc.localDescription.sdp));
                    const s = r.extractDtlsParameters({
                        sdpObject: a
                    });
                    s.role = t, this._remoteSdp.updateDtlsRole("client" === t ? "server" : "client"), await this.safeEmitAsPromise("@connect", {
                        dtlsParameters: s
                    }), this._transportReady = !0
                }
                _assertSendDirection() {
                    if ("send" !== this._direction) throw new Error('method can just be called for handlers with "send" direction')
                }
                _assertRecvDirection() {
                    if ("recv" !== this._direction) throw new Error('method can just be called for handlers with "recv" direction')
                }
            }
            exports.ReactNative = l;
        }, {
            "sdp-transform": "tbaU",
            "../Logger": "p5bA",
            "../errors": "p8GN",
            "../utils": "FOZT",
            "../ortc": "alA0",
            "./sdp/commonUtils": "FBSL",
            "./sdp/planBUtils": "nNFi",
            "./HandlerInterface": "iuhH",
            "./sdp/RemoteSdp": "aH4R"
        }],
        "tDuG": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("bowser"),
                r = require("./Logger"),
                t = require("./errors"),
                a = require("./ortc"),
                i = require("./Transport"),
                s = require("./handlers/Chrome74"),
                o = require("./handlers/Chrome70"),
                n = require("./handlers/Chrome67"),
                d = require("./handlers/Chrome55"),
                c = require("./handlers/Firefox60"),
                p = require("./handlers/Safari12"),
                h = require("./handlers/Safari11"),
                l = require("./handlers/Edge11"),
                u = require("./handlers/ReactNative"),
                m = new r.Logger("Device");

            function f() {
                if ("object" == typeof navigator && "ReactNative" === navigator.product) return "undefined" == typeof RTCPeerConnection ? void m.warn("this._detectDevice() | unsupported ReactNative without RTCPeerConnection") : (m.debug("this._detectDevice() | ReactNative handler chosen"), "ReactNative");
                if ("object" != typeof navigator || "string" != typeof navigator.userAgent) m.warn("this._detectDevice() | unknown device");
                else {
                    const r = navigator.userAgent,
                        t = e.getParser(r),
                        a = t.getEngine();
                    if (t.satisfies({
                            chrome: ">=74",
                            chromium: ">=74"
                        })) return "Chrome74";
                    if (t.satisfies({
                            chrome: ">=70",
                            chromium: ">=70"
                        })) return "Chrome70";
                    if (t.satisfies({
                            chrome: ">=67",
                            chromium: ">=67"
                        })) return "Chrome67";
                    if (t.satisfies({
                            chrome: ">=55",
                            chromium: ">=55"
                        })) return "Chrome55";
                    if (t.satisfies({
                            firefox: ">=60"
                        })) return "Firefox60";
                    if (t.satisfies({
                            safari: ">=12.0"
                        }) && "undefined" != typeof RTCRtpTransceiver && RTCRtpTransceiver.prototype.hasOwnProperty("currentDirection")) return "Safari12";
                    if (t.satisfies({
                            safari: ">=11"
                        })) return "Safari11";
                    if (t.satisfies({
                            "microsoft edge": ">=11"
                        }) && t.satisfies({
                            "microsoft edge": "<=18"
                        })) return "Edge11";
                    if (a.name && "blink" === a.name.toLowerCase()) {
                        const e = r.match(/(?:(?:Chrome|Chromium))[ \/](\w+)/i);
                        if (e) {
                            const r = Number(e[1]);
                            return r >= 74 ? "Chrome74" : r >= 70 ? "Chrome70" : r >= 67 ? "Chrome67" : "Chrome55"
                        }
                        return "Chrome74"
                    }
                    m.warn("this._detectDevice() | browser not supported [name:%s, version:%s]", t.getBrowserName(), t.getBrowserVersion())
                }
            }
            exports.detectDevice = f;
            class C {
                constructor({
                    handlerName: e,
                    handlerFactory: r,
                    Handler: a
                } = {}) {
                    if (this._loaded = !1, m.debug("constructor()"), a) {
                        if (m.warn("constructor() | Handler option is DEPRECATED, use handlerName or handlerFactory instead"), "string" != typeof a) throw new TypeError("non string Handler option no longer supported, use handlerFactory instead");
                        e = a
                    }
                    if (e && r) throw new TypeError("just one of handlerName or handlerInterface can be given");
                    if (r) this._handlerFactory = r;
                    else {
                        if (e) m.debug("constructor() | handler given: %s", e);
                        else {
                            if (!(e = f())) throw new t.UnsupportedError("device not supported");
                            m.debug("constructor() | detected handler: %s", e)
                        }
                        switch (e) {
                            case "Chrome74":
                                this._handlerFactory = s.Chrome74.createFactory();
                                break;
                            case "Chrome70":
                                this._handlerFactory = o.Chrome70.createFactory();
                                break;
                            case "Chrome67":
                                this._handlerFactory = n.Chrome67.createFactory();
                                break;
                            case "Chrome55":
                                this._handlerFactory = d.Chrome55.createFactory();
                                break;
                            case "Firefox60":
                                this._handlerFactory = c.Firefox60.createFactory();
                                break;
                            case "Safari12":
                                this._handlerFactory = p.Safari12.createFactory();
                                break;
                            case "Safari11":
                                this._handlerFactory = h.Safari11.createFactory();
                                break;
                            case "Edge11":
                                this._handlerFactory = l.Edge11.createFactory();
                                break;
                            case "ReactNative":
                                this._handlerFactory = u.ReactNative.createFactory();
                                break;
                            default:
                                throw new TypeError(`unknown handlerName "${e}"`)
                        }
                    }
                    const i = this._handlerFactory();
                    this._handlerName = i.name, i.close(), this._extendedRtpCapabilities = void 0, this._recvRtpCapabilities = void 0, this._canProduceByKind = {
                        audio: !1,
                        video: !1
                    }, this._sctpCapabilities = void 0
                }
                get handlerName() {
                    return this._handlerName
                }
                get loaded() {
                    return this._loaded
                }
                get rtpCapabilities() {
                    if (!this._loaded) throw new t.InvalidStateError("not loaded");
                    return this._recvRtpCapabilities
                }
                get sctpCapabilities() {
                    if (!this._loaded) throw new t.InvalidStateError("not loaded");
                    return this._sctpCapabilities
                }
                async load({
                    routerRtpCapabilities: e
                }) {
                    let r;
                    m.debug("load() [routerRtpCapabilities:%o]", e);
                    try {
                        if (this._loaded) throw new t.InvalidStateError("already loaded");
                        a.validateRtpCapabilities(e), r = this._handlerFactory();
                        const s = await r.getNativeRtpCapabilities();
                        m.debug("load() | got native RTP capabilities:%o", s), a.validateRtpCapabilities(s), this._extendedRtpCapabilities = a.getExtendedRtpCapabilities(s, e), m.debug("load() | got extended RTP capabilities:%o", this._extendedRtpCapabilities), this._canProduceByKind.audio = a.canSend("audio", this._extendedRtpCapabilities), this._canProduceByKind.video = a.canSend("video", this._extendedRtpCapabilities), this._recvRtpCapabilities = a.getRecvRtpCapabilities(this._extendedRtpCapabilities), a.validateRtpCapabilities(this._recvRtpCapabilities), m.debug("load() | got receiving RTP capabilities:%o", this._recvRtpCapabilities), this._sctpCapabilities = await r.getNativeSctpCapabilities(), m.debug("load() | got native SCTP capabilities:%o", this._sctpCapabilities), a.validateSctpCapabilities(this._sctpCapabilities), m.debug("load() succeeded"), this._loaded = !0, r.close()
                    } catch (i) {
                        throw r && r.close(), i
                    }
                }
                canProduce(e) {
                    if (!this._loaded) throw new t.InvalidStateError("not loaded");
                    if ("audio" !== e && "video" !== e) throw new TypeError(`invalid kind "${e}"`);
                    return this._canProduceByKind[e]
                }
                createSendTransport({
                    id: e,
                    iceParameters: r,
                    iceCandidates: t,
                    dtlsParameters: a,
                    sctpParameters: i,
                    iceServers: s,
                    iceTransportPolicy: o,
                    additionalSettings: n,
                    proprietaryConstraints: d,
                    appData: c = {}
                }) {
                    return m.debug("createSendTransport()"), this._createTransport({
                        direction: "send",
                        id: e,
                        iceParameters: r,
                        iceCandidates: t,
                        dtlsParameters: a,
                        sctpParameters: i,
                        iceServers: s,
                        iceTransportPolicy: o,
                        additionalSettings: n,
                        proprietaryConstraints: d,
                        appData: c
                    })
                }
                createRecvTransport({
                    id: e,
                    iceParameters: r,
                    iceCandidates: t,
                    dtlsParameters: a,
                    sctpParameters: i,
                    iceServers: s,
                    iceTransportPolicy: o,
                    additionalSettings: n,
                    proprietaryConstraints: d,
                    appData: c = {}
                }) {
                    return m.debug("createRecvTransport()"), this._createTransport({
                        direction: "recv",
                        id: e,
                        iceParameters: r,
                        iceCandidates: t,
                        dtlsParameters: a,
                        sctpParameters: i,
                        iceServers: s,
                        iceTransportPolicy: o,
                        additionalSettings: n,
                        proprietaryConstraints: d,
                        appData: c
                    })
                }
                _createTransport({
                    direction: e,
                    id: r,
                    iceParameters: a,
                    iceCandidates: s,
                    dtlsParameters: o,
                    sctpParameters: n,
                    iceServers: d,
                    iceTransportPolicy: c,
                    additionalSettings: p,
                    proprietaryConstraints: h,
                    appData: l = {}
                }) {
                    if (!this._loaded) throw new t.InvalidStateError("not loaded");
                    if ("string" != typeof r) throw new TypeError("missing id");
                    if ("object" != typeof a) throw new TypeError("missing iceParameters");
                    if (!Array.isArray(s)) throw new TypeError("missing iceCandidates");
                    if ("object" != typeof o) throw new TypeError("missing dtlsParameters");
                    if (n && "object" != typeof n) throw new TypeError("wrong sctpParameters");
                    if (l && "object" != typeof l) throw new TypeError("if given, appData must be an object");
                    return new i.Transport({
                        direction: e,
                        id: r,
                        iceParameters: a,
                        iceCandidates: s,
                        dtlsParameters: o,
                        sctpParameters: n,
                        iceServers: d,
                        iceTransportPolicy: c,
                        additionalSettings: p,
                        proprietaryConstraints: h,
                        appData: l,
                        handlerFactory: this._handlerFactory,
                        extendedRtpCapabilities: this._extendedRtpCapabilities,
                        canProduceByKind: this._canProduceByKind
                    })
                }
            }
            exports.Device = C;
        }, {
            "bowser": "eDg8",
            "./Logger": "p5bA",
            "./errors": "p8GN",
            "./ortc": "alA0",
            "./Transport": "bVaN",
            "./handlers/Chrome74": "vpFN",
            "./handlers/Chrome70": "wNnR",
            "./handlers/Chrome67": "gY4Q",
            "./handlers/Chrome55": "PqYG",
            "./handlers/Firefox60": "sZJw",
            "./handlers/Safari12": "qfh9",
            "./handlers/Safari11": "LRIx",
            "./handlers/Edge11": "BDvo",
            "./handlers/ReactNative": "fsTO"
        }],
        "eFF2": [function(require, module, exports) {
            "use strict";

            function r(r) {
                for (var e in r) exports.hasOwnProperty(e) || (exports[e] = r[e])
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            }), r(require("./Device")), r(require("./Transport")), r(require("./Producer")), r(require("./Consumer")), r(require("./DataProducer")), r(require("./DataConsumer")), r(require("./handlers/HandlerInterface")), r(require("./errors"));
        }, {
            "./Device": "tDuG",
            "./Transport": "bVaN",
            "./Producer": "oKFT",
            "./Consumer": "nZfe",
            "./DataProducer": "lgs9",
            "./DataConsumer": "ui0n",
            "./handlers/HandlerInterface": "iuhH",
            "./errors": "p8GN"
        }],
        "Focm": [function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            const e = require("./Device");
            exports.Device = e.Device, exports.detectDevice = e.detectDevice;
            const t = require("./types");
            exports.types = t, exports.version = "3.6.9";
            var r = require("./scalabilityModes");
            exports.parseScalabilityMode = r.parse;
        }, {
            "./Device": "tDuG",
            "./types": "eFF2",
            "./scalabilityModes": "QdG4"
        }]
    }, {}, ["Focm"], null)
//# sourceMappingURL=/index.js.map
export default module.exports;
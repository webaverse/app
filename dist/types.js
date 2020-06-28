var parcelRequire = function(e, r, t, n) {
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
    "eFF2": [function(require, module, exports) {
        var e = function(e, t, n) {
                return {
                    label: e,
                    asArgument: t,
                    asInjection: n
                }
            },
            t = function(e) {
                return Array.isArray(e)
            },
            n = function(e) {
                return "object" == typeof e
            },
            r = function(e) {
                return null == e
            },
            u = function(e) {
                return "number" == typeof e
            },
            o = function(e) {
                return Number.isInteger(e)
            },
            i = function(e) {
                return "string" == typeof e
            },
            f = function(e) {
                throw new Error("Type Error: " + e)
            },
            c = e("Identity", function(e) {
                return e
            }, function(e) {
                return e
            }),
            p = e("UInt", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt",
                    value: e
                };
                f("Expected Positive Integer for type Unsigned Int")
            }, function(e) {
                return e
            }),
            a = e("Int", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int",
                    value: e
                };
                f("Expected Integer for type Int")
            }, function(e) {
                return e
            }),
            s = e("UInt8", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt8",
                    value: e
                };
                f("Expected integer for UInt8")
            }, function(e) {
                return e
            }),
            l = e("Int8", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int8",
                    value: e
                };
                f("Expected positive integer for Int8")
            }, function(e) {
                return e
            }),
            d = e("UInt16", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt16",
                    value: e
                };
                f("Expected integer for UInt16")
            }, function(e) {
                return e
            }),
            v = e("Int16", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int16",
                    value: e
                };
                f("Expected positive integer for Int16")
            }, function(e) {
                return e
            }),
            x = e("UInt32", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt32",
                    value: e
                };
                f("Expected integer for UInt32")
            }, function(e) {
                return e
            }),
            y = e("Int32", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int32",
                    value: e
                };
                f("Expected positive integer for Int32")
            }, function(e) {
                return e
            }),
            I = e("UInt64", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt64",
                    value: e
                };
                f("Expected integer for UInt64")
            }, function(e) {
                return e
            }),
            m = e("Int64", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int64",
                    value: e
                };
                f("Expected positive integer for Int64")
            }, function(e) {
                return e
            }),
            g = e("UInt128", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt128",
                    value: e
                };
                f("Expected integer for UInt128")
            }, function(e) {
                return e
            }),
            E = e("Int128", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int128",
                    value: e
                };
                f("Expected positive integer for Int128")
            }, function(e) {
                return e
            }),
            U = e("UInt256", function(e) {
                if (u(e) && o(e)) return {
                    type: "UInt256",
                    value: e
                };
                f("Expected integer for UInt256")
            }, function(e) {
                return e
            }),
            A = e("Int256", function(e) {
                if (u(e) && o(e)) return {
                    type: "Int256",
                    value: e
                };
                f("Expected integer for Int256")
            }, function(e) {
                return e
            }),
            W = e("Word8", function(e) {
                if (u(e) && o(e)) return {
                    type: "Word8",
                    value: e
                };
                f("Expected positive number for Word8")
            }, function(e) {
                return e
            }),
            b = e("Word16", function(e) {
                if (u(e) && o(e)) return {
                    type: "Word16",
                    value: e
                };
                f("Expected positive number for Word16")
            }, function(e) {
                return e
            }),
            k = e("Word32", function(e) {
                if (u(e) && o(e)) return {
                    type: "Word32",
                    value: e
                };
                f("Expected positive number for Word32")
            }, function(e) {
                return e
            }),
            S = e("Word64", function(e) {
                if (u(e) && o(e)) return {
                    type: "Word64",
                    value: e
                };
                f("Expected positive number for Word64")
            }, function(e) {
                return e
            }),
            F = e("UFix64", function(e) {
                if (u(e)) return {
                    type: "UFix64",
                    value: e
                };
                f("Expected positive integer for UFix64")
            }, function(e) {
                return e
            }),
            O = e("Fix64", function(e) {
                if (u(e)) return {
                    type: "Fix64",
                    value: e
                };
                f("Expected integer for Fix64")
            }, function(e) {
                return e
            }),
            R = e("String", function(e) {
                if (i(e)) return {
                    type: "String",
                    value: e
                };
                f("Expected String for type String")
            }, function(e) {
                return e
            }),
            j = e("Character", function(e) {
                if (i(e)) return {
                    type: "Character",
                    value: e
                };
                f("Expected Character for type Character")
            }, function(e) {
                return e
            }),
            h = e("Bool", function(e) {
                if ("boolean" == typeof e) return {
                    type: "Bool",
                    value: e
                };
                f("Expected Boolean for type Bool")
            }, function(e) {
                return e
            }),
            B = e("Address", function(e) {
                if (i(e)) return {
                    type: "Address",
                    value: e
                };
                f("Expected Address for type Address")
            }, function(e) {
                return e
            }),
            C = e("Void", function(e) {
                if (!e || r(e)) return {
                    type: "Void"
                };
                f("Expected Void for type Void")
            }, function(e) {
                return e
            }),
            V = e("Reference", function(e) {
                if (n(e)) return {
                    type: "Reference",
                    value: e
                };
                f("Expected Object for type Reference")
            }, function(e) {
                return e
            }),
            D = function(n) {
                return void 0 === n && (n = []), e("Array", function(e) {
                    return {
                        type: "Array",
                        value: t(n) ? n.map(function(t, n) {
                            return t.asArgument(e[n])
                        }) : e.map(function(e) {
                            return n.asArgument(e)
                        })
                    }
                }, function(e) {
                    return e
                })
            };
        exports.Address = B, exports.Array = D, exports.Bool = h, exports.Character = j, exports.Dictionary = function(r) {
            return void 0 === r && (r = []), e("Dictionary", function(e) {
                if (n(e)) return {
                    type: "Dictionary",
                    value: t(r) ? r.map(function(t, n) {
                        return {
                            key: t.key.asArgument(e[n].key),
                            value: t.value.asArgument(e[n].value)
                        }
                    }) : t(e) ? e.map(function(e) {
                        return {
                            key: r.key.asArgument(e.key),
                            value: r.value.asArgument(e.value)
                        }
                    }) : [{
                        key: r.key.asArgument(e.key),
                        value: r.value.asArgument(e.value)
                    }]
                };
                f("Expected Object for type Dictionary")
            }, function(e) {
                return e
            })
        }, exports.Event = function(r, u) {
            return void 0 === u && (u = []), e("Event", function(e) {
                if (n(e)) return {
                    type: "Event",
                    value: {
                        id: r,
                        fields: t(u) ? u.map(function(t, n) {
                            return {
                                name: e.fields[n].name,
                                value: t.value.asArgument(e.fields[n].value)
                            }
                        }) : e.fields.map(function(e) {
                            return {
                                name: e.name,
                                value: u.value.asArgument(e.value)
                            }
                        })
                    }
                };
                f("Expected Object for type Event")
            }, function(e) {
                return e
            })
        }, exports.Fix64 = O, exports.Identity = c, exports.Int = a, exports.Int128 = E, exports.Int16 = v, exports.Int256 = A, exports.Int32 = y, exports.Int64 = m, exports.Int8 = l, exports.Optional = function(t) {
            return e("Optional", function(e) {
                return {
                    type: "Optional",
                    value: r(e) ? null : t.asArgument(e)
                }
            }, function(e) {
                return e
            })
        }, exports.Reference = V, exports.Resource = function(r, u) {
            return void 0 === u && (u = []), e("Resource", function(e) {
                if (n(e)) return {
                    type: "Resource",
                    value: {
                        id: r,
                        fields: t(u) ? u.map(function(t, n) {
                            return {
                                name: e.fields[n].name,
                                value: t.value.asArgument(e.fields[n].value)
                            }
                        }) : e.fields.map(function(e) {
                            return {
                                name: e.name,
                                value: u.value.asArgument(e.value)
                            }
                        })
                    }
                };
                f("Expected Object for type Resource")
            }, function(e) {
                return e
            })
        }, exports.String = R, exports.Struct = function(r, u) {
            return void 0 === u && (u = []), e("Struct", function(e) {
                if (n(e)) return {
                    type: "Struct",
                    value: {
                        id: r,
                        fields: t(u) ? u.map(function(t, n) {
                            return {
                                name: e.fields[n].name,
                                value: t.value.asArgument(e.fields[n].value)
                            }
                        }) : e.fields.map(function(e) {
                            return {
                                name: e.name,
                                value: u.value.asArgument(e.value)
                            }
                        })
                    }
                };
                f("Expected Object for type Struct")
            }, function(e) {
                return e
            })
        }, exports.UFix64 = F, exports.UInt = p, exports.UInt128 = g, exports.UInt16 = d, exports.UInt256 = U, exports.UInt32 = x, exports.UInt64 = I, exports.UInt8 = s, exports.Void = C, exports.Word16 = b, exports.Word32 = k, exports.Word64 = S, exports.Word8 = W, exports._Array = D;
    }, {}]
}, {}, ["eFF2"], null)
//# sourceMappingURL=/types.js.map

const x = (() => {
    const exports = {};
    const module = {exports};
    return parcelRequire.call(globalThis, "eFF2", module, exports);
})();
export default x;

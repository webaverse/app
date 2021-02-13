const ColorScheme = (function() {
  var ColorScheme,
    slice = [].slice;

  ColorScheme = (function() {
    var clone, l, len, ref, typeIsArray, word;

    typeIsArray = Array.isArray || function(value) {
      return {}.toString.call(value) === '[object Array]';
    };

    ColorScheme.SCHEMES = {};

    ref = "mono monochromatic contrast triade tetrade analogic".split(/\s+/);
    for (l = 0, len = ref.length; l < len; l++) {
      word = ref[l];
      ColorScheme.SCHEMES[word] = true;
    }

    ColorScheme.PRESETS = {
      "default": [-1, -1, 1, -0.7, 0.25, 1, 0.5, 1],
      pastel: [0.5, -0.9, 0.5, 0.5, 0.1, 0.9, 0.75, 0.75],
      soft: [0.3, -0.8, 0.3, 0.5, 0.1, 0.9, 0.5, 0.75],
      light: [0.25, 1, 0.5, 0.75, 0.1, 1, 0.5, 1],
      hard: [1, -1, 1, -0.6, 0.1, 1, 0.6, 1],
      pale: [0.1, -0.85, 0.1, 0.5, 0.1, 1, 0.1, 0.75]
    };

    ColorScheme.COLOR_WHEEL = {
      0: [255, 0, 0, 100],
      15: [255, 51, 0, 100],
      30: [255, 102, 0, 100],
      45: [255, 128, 0, 100],
      60: [255, 153, 0, 100],
      75: [255, 178, 0, 100],
      90: [255, 204, 0, 100],
      105: [255, 229, 0, 100],
      120: [255, 255, 0, 100],
      135: [204, 255, 0, 100],
      150: [153, 255, 0, 100],
      165: [51, 255, 0, 100],
      180: [0, 204, 0, 80],
      195: [0, 178, 102, 70],
      210: [0, 153, 153, 60],
      225: [0, 102, 178, 70],
      240: [0, 51, 204, 80],
      255: [25, 25, 178, 70],
      270: [51, 0, 153, 60],
      285: [64, 0, 153, 60],
      300: [102, 0, 153, 60],
      315: [153, 0, 153, 60],
      330: [204, 0, 153, 80],
      345: [229, 0, 102, 90]
    };

    function ColorScheme() {
      var colors, m;
      colors = [];
      for (m = 1; m <= 4; m++) {
        colors.push(new ColorScheme.mutablecolor(60));
      }
      this.col = colors;
      this._scheme = 'mono';
      this._distance = 0.5;
      this._web_safe = false;
      this._add_complement = false;
    }


    /*
    
    colors()
    
    Returns an array of 4, 8, 12 or 16 colors in RRGGBB hexidecimal notation
    (without a leading "#") depending on the color scheme and addComplement
    parameter. For each set of four, the first is usually the most saturated color,
    the second a darkened version, the third a pale version and fourth
    a less-pale version.
    
    For example: With a contrast scheme, "colors()" would return eight colors.
    Indexes 1 and 5 could be background colors, 2 and 6 could be foreground colors.
    
    Trust me, it's much better if you check out the Color Scheme web site, whose
    URL is listed in "Description"
     */

    ColorScheme.prototype.colors = function() {
      var dispatch, h, i, j, m, n, output, ref1, used_colors;
      used_colors = 1;
      h = this.col[0].get_hue();
      dispatch = {
        mono: (function(_this) {
          return function() {};
        })(this),
        contrast: (function(_this) {
          return function() {
            used_colors = 2;
            _this.col[1].set_hue(h);
            return _this.col[1].rotate(180);
          };
        })(this),
        triade: (function(_this) {
          return function() {
            var dif;
            used_colors = 3;
            dif = 60 * _this._distance;
            _this.col[1].set_hue(h);
            _this.col[1].rotate(180 - dif);
            _this.col[2].set_hue(h);
            return _this.col[2].rotate(180 + dif);
          };
        })(this),
        tetrade: (function(_this) {
          return function() {
            var dif;
            used_colors = 4;
            dif = 90 * _this._distance;
            _this.col[1].set_hue(h);
            _this.col[1].rotate(180);
            _this.col[2].set_hue(h);
            _this.col[2].rotate(180 + dif);
            _this.col[3].set_hue(h);
            return _this.col[3].rotate(dif);
          };
        })(this),
        analogic: (function(_this) {
          return function() {
            var dif;
            used_colors = _this._add_complement ? 4 : 3;
            dif = 60 * _this._distance;
            _this.col[1].set_hue(h);
            _this.col[1].rotate(dif);
            _this.col[2].set_hue(h);
            _this.col[2].rotate(360 - dif);
            _this.col[3].set_hue(h);
            return _this.col[3].rotate(180);
          };
        })(this)
      };
      dispatch['monochromatic'] = dispatch['mono'];
      if (dispatch[this._scheme] != null) {
        dispatch[this._scheme]();
      } else {
        throw "Unknown color scheme name: " + this._scheme;
      }
      output = [];
      for (i = m = 0, ref1 = used_colors - 1; 0 <= ref1 ? m <= ref1 : m >= ref1; i = 0 <= ref1 ? ++m : --m) {
        for (j = n = 0; n <= 3; j = ++n) {
          output[i * 4 + j] = this.col[i].get_hex(this._web_safe, j);
        }
      }
      return output;
    };


    /*
    
    colorset()
    
    Returns a list of lists of the colors in groups of four. This method simply
    allows you to reference a color in the scheme by its group isntead of its
    absolute index in the list of colors.  I am assuming that "colorset()"
    will make it easier to use this module with the templating systems that are
    out there.
    
    For example, if you were to follow the synopsis, say you wanted to retrieve
    the two darkest colors from the first two groups of the scheme, which is
    typically the second color in the group. You could retrieve them with
    "colors()"
    
        first_background  = (scheme.colors())[1];
        second_background = (scheme.colors())[5];
    
    Or, with this method,
    
        first_background  = (scheme.colorset())[0][1]
        second_background = (scheme.colorset())[1][1]
     */

    ColorScheme.prototype.colorset = function() {
      var flat_colors, grouped_colors;
      flat_colors = clone(this.colors());
      grouped_colors = [];
      while (flat_colors.length > 0) {
        grouped_colors.push(flat_colors.splice(0, 4));
      }
      return grouped_colors;
    };


    /*
    
    from_hue( degrees )
    
    Sets the base color hue, where 'degrees' is an integer. (Values greater than
    359 and less than 0 wrap back around the wheel.)
    
    The default base hue is 0, or bright red.
     */

    ColorScheme.prototype.from_hue = function(h) {
      if (h == null) {
        throw "from_hue needs an argument";
      }
      this.col[0].set_hue(h);
      return this;
    };

    ColorScheme.prototype.rgb2ryb = function() {
      var blue, green, iN, maxgreen, maxyellow, red, rgb, white, yellow;
      rgb = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if ((rgb[0] != null) && typeIsArray(rgb[0])) {
        rgb = rgb[0];
      }
      red = rgb[0], green = rgb[1], blue = rgb[2];
      white = Math.min(red, green, blue);
      red -= white;
      green -= white;
      blue -= white;
      maxgreen = Math.max(red, green, blue);
      yellow = Math.min(red, green);
      red -= yellow;
      green -= yellow;
      if (blue > 0 && green > 0) {
        blue /= 2;
        green /= 2;
      }
      yellow += green;
      blue += green;
      maxyellow = Math.max(red, yellow, blue);
      if (maxyellow > 0) {
        iN = maxgreen / maxyellow;
        red *= iN;
        yellow *= iN;
        blue *= iN;
      }
      red += white;
      yellow += white;
      blue += white;
      return [Math.floor(red), Math.floor(yellow), Math.floor(blue)];
    };

    ColorScheme.prototype.rgb2hsv = function() {
      var b, d, g, h, max, min, r, rgb, s, v;
      rgb = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if ((rgb[0] != null) && typeIsArray(rgb[0])) {
        rgb = rgb[0];
      }
      r = rgb[0], g = rgb[1], b = rgb[2];
      r /= 255;
      g /= 255;
      b /= 255;
      min = Math.min.apply(Math, [r, g, b]);
      max = Math.max.apply(Math, [r, g, b]);
      d = max - min;
      v = max;
      s;
      if (d > 0) {
        s = d / max;
      } else {
        return [0, 0, v];
      }
      h = (r === max ? (g - b) / d : (g === max ? 2 + (b - r) / d : 4 + (r - g) / d));
      h *= 60;
      h %= 360;
      return [h, s, v];
    };

    ColorScheme.prototype.rgbToHsv = function() {
      var b, d, g, h, max, min, r, rgb, s, v;
      rgb = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if ((rgb[0] != null) && typeIsArray(rgb[0])) {
        rgb = rgb[0];
      }
      r = rgb[0], g = rgb[1], b = rgb[2];
      r /= 255;
      g /= 255;
      b /= 255;
      max = Math.max(r, g, b);
      min = Math.min(r, g, b);
      h = void 0;
      s = void 0;
      v = max;
      d = max - min;
      s = max === 0 ? 0 : d / max;
      if (max === min) {
        h = 0;
      } else {
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
        }
        h /= 6;
      }
      return [h, s, v];
    };


    /*
    
    from_hex( color )
    
    Sets the base color to the given color, where 'color' is in the hexidecimal
    form RRGGBB. 'color' should not be preceded with a hash (#).
    
    The default base color is the equivalent of #ff0000, or bright red.
     */

    ColorScheme.prototype.from_hex = function(hex) {
      var b, g, h, h0, h1, h2, hsv, i1, i2, num, r, ref1, ref2, rgbcap, s, v;
      if (hex == null) {
        throw "from_hex needs an argument";
      }
      if (!/^([0-9A-F]{2}){3}$/im.test(hex)) {
        throw "from_hex(" + hex + ") - argument must be in the form of RRGGBB";
      }
      rgbcap = /(..)(..)(..)/.exec(hex).slice(1, 4);
      ref1 = (function() {
        var len1, m, results;
        results = [];
        for (m = 0, len1 = rgbcap.length; m < len1; m++) {
          num = rgbcap[m];
          results.push(parseInt(num, 16));
        }
        return results;
      })(), r = ref1[0], g = ref1[1], b = ref1[2];
      ref2 = this.rgb2ryb([r, g, b]), r = ref2[0], g = ref2[1], b = ref2[2];
      hsv = this.rgbToHsv(r, g, b);
      h0 = hsv[0];
      h1 = 0;
      h2 = 1000;
      i1 = null;
      i2 = null;
      h = null;
      s = null;
      v = null;
      h = hsv[0];
      s = hsv[1];
      v = hsv[2];
      this.from_hue(h * 360);
      this._set_variant_preset([s, v, s, v * 0.7, s * 0.25, 1, s * 0.5, 1]);
      return this;
    };


    /*
    
    add_complement( BOOLEAN )
    
    If BOOLEAN is true, an extra set of colors will be produced using the
    complement of the selected color.
    
    This only works with the analogic color scheme. The default is false.
     */

    ColorScheme.prototype.add_complement = function(b) {
      if (b == null) {
        throw "add_complement needs an argument";
      }
      this._add_complement = b;
      return this;
    };


    /*
    
    web_safe( BOOL )
    
    Sets whether the colors returned by L<"colors()"> or L<"colorset()"> will be
    web-safe.
    
    The default is false.
     */

    ColorScheme.prototype.web_safe = function(b) {
      if (b == null) {
        throw "web_safe needs an argument";
      }
      this._web_safe = b;
      return this;
    };


    /*
    
    distance( FLOAT )
    
    'FLOAT'> must be a value from 0 to 1. You might use this with the "triade"
    "tetrade" or "analogic" color schemes.
    
    The default is 0.5.
     */

    ColorScheme.prototype.distance = function(d) {
      if (d == null) {
        throw "distance needs an argument";
      }
      if (d < 0) {
        throw "distance(" + d + ") - argument must be >= 0";
      }
      if (d > 1) {
        throw "distance(" + d + ") - argument must be <= 1";
      }
      this._distance = d;
      return this;
    };


    /*
    
    scheme( name )
    
    'name' must be a valid color scheme name. See "Color Schemes". The default
    is "mono"
     */

    ColorScheme.prototype.scheme = function(name) {
      if (name == null) {
        return this._scheme;
      } else {
        if (ColorScheme.SCHEMES[name] == null) {
          throw "'" + name + "' isn't a valid scheme name";
        }
        this._scheme = name;
        return this;
      }
    };


    /*
    
    variation( name )
    
    'name' must be a valid color variation name. See "Color Variations"
     */

    ColorScheme.prototype.variation = function(v) {
      if (v == null) {
        throw "variation needs an argument";
      }
      if (ColorScheme.PRESETS[v] == null) {
        throw "'$v' isn't a valid variation name";
      }
      this._set_variant_preset(ColorScheme.PRESETS[v]);
      return this;
    };

    ColorScheme.prototype._set_variant_preset = function(p) {
      var i, m, results;
      results = [];
      for (i = m = 0; m <= 3; i = ++m) {
        results.push(this.col[i].set_variant_preset(p));
      }
      return results;
    };

    clone = function(obj) {
      var flags, key, newInstance;
      if ((obj == null) || typeof obj !== 'object') {
        return obj;
      }
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      if (obj instanceof RegExp) {
        flags = '';
        if (obj.global != null) {
          flags += 'g';
        }
        if (obj.ignoreCase != null) {
          flags += 'i';
        }
        if (obj.multiline != null) {
          flags += 'm';
        }
        if (obj.sticky != null) {
          flags += 'y';
        }
        return new RegExp(obj.source, flags);
      }
      newInstance = new obj.constructor();
      for (key in obj) {
        newInstance[key] = clone(obj[key]);
      }
      return newInstance;
    };

    ColorScheme.mutablecolor = (function() {
      mutablecolor.prototype.hue = 0;

      mutablecolor.prototype.saturation = [];

      mutablecolor.prototype.value = [];

      mutablecolor.prototype.base_red = 0;

      mutablecolor.prototype.base_green = 0;

      mutablecolor.prototype.base_saturation = 0;

      mutablecolor.prototype.base_value = 0;

      function mutablecolor(hue) {
        if (hue == null) {
          throw "No hue specified";
        }
        this.saturation = [];
        this.value = [];
        this.base_red = 0;
        this.base_green = 0;
        this.base_blue = 0;
        this.base_saturation = 0;
        this.base_value = 0;
        this.set_hue(hue);
        this.set_variant_preset(ColorScheme.PRESETS['default']);
      }

      mutablecolor.prototype.get_hue = function() {
        return this.hue;
      };

      mutablecolor.prototype.set_hue = function(h) {
        var avrg, color, colorset1, colorset2, d, derivative1, derivative2, en, i, k;
        avrg = function(a, b, k) {
          return a + Math.round((b - a) * k);
        };
        this.hue = Math.round(h % 360);
        d = this.hue % 15 + (this.hue - Math.floor(this.hue));
        k = d / 15;
        derivative1 = this.hue - Math.floor(d);
        derivative2 = (derivative1 + 15) % 360;
        if (derivative1 === 360) {
          derivative1 = 0;
        }
        if (derivative2 === 360) {
          derivative2 = 0;
        }
        colorset1 = ColorScheme.COLOR_WHEEL[derivative1];
        colorset2 = ColorScheme.COLOR_WHEEL[derivative2];
        en = {
          red: 0,
          green: 1,
          blue: 2,
          value: 3
        };
        for (color in en) {
          i = en[color];
          this["base_" + color] = avrg(colorset1[i], colorset2[i], k);
        }
        this.base_saturation = avrg(100, 100, k) / 100;
        return this.base_value /= 100;
      };

      mutablecolor.prototype.rotate = function(angle) {
        var newhue;
        newhue = (this.hue + angle) % 360;
        return this.set_hue(newhue);
      };

      mutablecolor.prototype.get_saturation = function(variation) {
        var s, x;
        x = this.saturation[variation];
        s = x < 0 ? -x * this.base_saturation : x;
        if (s > 1) {
          s = 1;
        }
        if (s < 0) {
          s = 0;
        }
        return s;
      };

      mutablecolor.prototype.get_value = function(variation) {
        var v, x;
        x = this.value[variation];
        v = x < 0 ? -x * this.base_value : x;
        if (v > 1) {
          v = 1;
        }
        if (v < 0) {
          v = 0;
        }
        return v;
      };

      mutablecolor.prototype.set_variant = function(variation, s, v) {
        this.saturation[variation] = s;
        return this.value[variation] = v;
      };

      mutablecolor.prototype.set_variant_preset = function(p) {
        var i, m, results;
        results = [];
        for (i = m = 0; m <= 3; i = ++m) {
          results.push(this.set_variant(i, p[2 * i], p[2 * i + 1]));
        }
        return results;
      };

      mutablecolor.prototype.get_hex = function(web_safe, variation) {
        var c, color, formatted, i, k, len1, len2, m, max, min, n, ref1, rgb, rgbVal, s, str, v;
        max = Math.max.apply(Math, (function() {
          var len1, m, ref1, results;
          ref1 = ['red', 'green', 'blue'];
          results = [];
          for (m = 0, len1 = ref1.length; m < len1; m++) {
            color = ref1[m];
            results.push(this["base_" + color]);
          }
          return results;
        }).call(this));
        min = Math.min.apply(Math, (function() {
          var len1, m, ref1, results;
          ref1 = ['red', 'green', 'blue'];
          results = [];
          for (m = 0, len1 = ref1.length; m < len1; m++) {
            color = ref1[m];
            results.push(this["base_" + color]);
          }
          return results;
        }).call(this));
        v = (variation < 0 ? this.base_value : this.get_value(variation)) * 255;
        s = variation < 0 ? this.base_saturation : this.get_saturation(variation);
        k = max > 0 ? v / max : 0;
        rgb = [];
        ref1 = ['red', 'green', 'blue'];
        for (m = 0, len1 = ref1.length; m < len1; m++) {
          color = ref1[m];
          rgbVal = Math.min.apply(Math, [255, Math.round(v - (v - this["base_" + color] * k) * s)]);
          rgb.push(rgbVal);
        }
        if (web_safe) {
          rgb = (function() {
            var len2, n, results;
            results = [];
            for (n = 0, len2 = rgb.length; n < len2; n++) {
              c = rgb[n];
              results.push(Math.round(c / 51) * 51);
            }
            return results;
          })();
        }
        formatted = "";
        for (n = 0, len2 = rgb.length; n < len2; n++) {
          i = rgb[n];
          str = i.toString(16);
          if (str.length < 2) {
            str = "0" + str;
          }
          formatted += str;
        }
        return formatted;
      };

      return mutablecolor;

    })();

    return ColorScheme;

  })();

  /* if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
    module.exports = ColorScheme;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return ColorScheme;
      });
    } else {
      window.ColorScheme = ColorScheme;
    }
  } */
  
  return ColorScheme;

}).call(this);

const colorScheme = new ColorScheme();
export default colorScheme;
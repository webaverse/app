import { ShaderChunk, UniformsUtils, MeshDepthMaterial, RGBADepthPacking, MeshDistanceMaterial, ShaderLib, DataTexture, Vector3, MeshStandardMaterial, DoubleSide, Mesh, CylinderBufferGeometry, Vector2 } from './three.module.js';

/**
 * Regular expression for matching the `void main() {` opener line in GLSL.
 * @type {RegExp}
 */
const voidMainRegExp = /\bvoid\s+main\s*\(\s*\)\s*{/g;

/**
 * Recursively expands all `#include <xyz>` statements within string of shader code.
 * Copied from three's WebGLProgram#parseIncludes for external use.
 *
 * @param {string} source - The GLSL source code to evaluate
 * @return {string} The GLSL code with all includes expanded
 */
function expandShaderIncludes( source ) {
  const pattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
  function replace(match, include) {
    let chunk = ShaderChunk[include];
    return chunk ? expandShaderIncludes(chunk) : match
  }
  return source.replace( pattern, replace )
}

// Local assign polyfill to avoid importing troika-core
const assign = Object.assign || function(/*target, ...sources*/) {
  let target = arguments[0];
  for (let i = 1, len = arguments.length; i < len; i++) {
    let source = arguments[i];
    if (source) {
      for (let prop in source) {
        if (source.hasOwnProperty(prop)) {
          target[prop] = source[prop];
        }
      }
    }
  }
  return target
};


const epoch = Date.now();
const CACHE = new WeakMap(); //threejs requires WeakMap internally so should be safe to assume support


/**
 * A utility for creating a custom shader material derived from another material's
 * shaders. This allows you to inject custom shader logic and transforms into the
 * builtin ThreeJS materials without having to recreate them from scratch.
 *
 * @param {THREE.Material} baseMaterial - the original material to derive from
 *
 * @param {Object} options - How the base material should be modified.
 * @param {Object} options.defines - Custom `defines` for the material
 * @param {Object} options.extensions - Custom `extensions` for the material, e.g. `{derivatives: true}`
 * @param {Object} options.uniforms - Custom `uniforms` for use in the modified shader. These can
 *        be accessed and manipulated via the resulting material's `uniforms` property, just like
 *        in a ShaderMaterial. You do not need to repeat the base material's own uniforms here.
 * @param {String} options.timeUniform - If specified, a uniform of this name will be injected into
 *        both shaders, and it will automatically be updated on each render frame with a number of
 *        elapsed milliseconds. The "zero" epoch time is not significant so don't rely on this as a
 *        true calendar time.
 * @param {String} options.vertexDefs - Custom GLSL code to inject into the vertex shader's top-level
 *        definitions, above the `void main()` function.
 * @param {String} options.vertexMainIntro - Custom GLSL code to inject at the top of the vertex
 *        shader's `void main` function.
 * @param {String} options.vertexMainOutro - Custom GLSL code to inject at the end of the vertex
 *        shader's `void main` function.
 * @param {String} options.vertexTransform - Custom GLSL code to manipulate the `position`, `normal`,
 *        and/or `uv` vertex attributes. This code will be wrapped within a standalone function with
 *        those attributes exposed by their normal names as read/write values.
 * @param {String} options.fragmentDefs - Custom GLSL code to inject into the fragment shader's top-level
 *        definitions, above the `void main()` function.
 * @param {String} options.fragmentMainIntro - Custom GLSL code to inject at the top of the fragment
 *        shader's `void main` function.
 * @param {String} options.fragmentMainOutro - Custom GLSL code to inject at the end of the fragment
 *        shader's `void main` function. You can manipulate `gl_FragColor` here but keep in mind it goes
 *        after any of ThreeJS's color postprocessing shader chunks (tonemapping, fog, etc.), so if you
 *        want those to apply to your changes use `fragmentColorTransform` instead.
 * @param {String} options.fragmentColorTransform - Custom GLSL code to manipulate the `gl_FragColor`
 *        output value. Will be injected near the end of the `void main` function, but before any
 *        of ThreeJS's color postprocessing shader chunks (tonemapping, fog, etc.), and before the
 *        `fragmentMainOutro`.
 * @param {function<{vertexShader,fragmentShader}>:{vertexShader,fragmentShader}} options.customRewriter - A function
 *        for performing custom rewrites of the full shader code. Useful if you need to do something
 *        special that's not covered by the other builtin options. This function will be executed before
 *        any other transforms are applied.
 *
 * @return {THREE.Material}
 *
 * The returned material will also have two new methods, `getDepthMaterial()` and `getDistanceMaterial()`,
 * which can be called to get a variant of the derived material for use in shadow casting. If the
 * target mesh is expected to cast shadows, then you can assign these to the mesh's `customDepthMaterial`
 * (for directional and spot lights) and/or `customDistanceMaterial` (for point lights) properties to
 * allow the cast shadow to honor your derived shader's vertex transforms and discarded fragments. These
 * will also set a custom `#define IS_DEPTH_MATERIAL` or `#define IS_DISTANCE_MATERIAL` that you can look
 * for in your derived shaders with `#ifdef` to customize their behavior for the depth or distance
 * scenarios, e.g. skipping antialiasing or expensive shader logic.
 */
function createDerivedMaterial(baseMaterial, options) {
  // First check the cache to see if we've already derived from this baseMaterial using
  // this unique set of options, and if so just return a clone instead of a new subclass
  // which is faster and allows their shader program to be shared when rendering.
  const optionsHash = getOptionsHash(options);
  let cached = CACHE.get(baseMaterial);
  if (!cached) {
    cached = Object.create(null);
    CACHE.set(baseMaterial, cached);
  }
  if (cached[optionsHash]) {
    return cached[optionsHash].clone()
  }

  // Even if baseMaterial is changing, use a consistent id in shader rewrites based on the
  // optionsHash. This makes it more likely that deriving from base materials of the same
  // type/class, e.g. multiple instances of MeshStandardMaterial, will produce identical
  // rewritten shader code so they can share a single WebGLProgram behind the scenes.
  const id = getIdForOptionsHash(optionsHash);
  const privateDerivedShadersProp = `_derivedShaders${id}`;
  const privateBeforeCompileProp = `_onBeforeCompile${id}`;
  let distanceMaterialTpl, depthMaterialTpl;

  // Private onBeforeCompile handler that injects the modified shaders and uniforms when
  // the renderer switches to this material's program
  function onBeforeCompile(shaderInfo) {
    baseMaterial.onBeforeCompile.call(this, shaderInfo);

    // Upgrade the shaders, caching the result
    const {vertex, fragment} = this[privateDerivedShadersProp] || (this[privateDerivedShadersProp] = {vertex: {}, fragment: {}});
    if (vertex.source !== shaderInfo.vertexShader || fragment.source !== shaderInfo.fragmentShader) {
      const upgraded = upgradeShaders(shaderInfo, options, id);
      vertex.source = shaderInfo.vertexShader;
      vertex.result = upgraded.vertexShader;
      fragment.source = shaderInfo.fragmentShader;
      fragment.result = upgraded.fragmentShader;
    }

    // Inject upgraded shaders and uniforms into the program
    shaderInfo.vertexShader = vertex.result;
    shaderInfo.fragmentShader = fragment.result;
    assign(shaderInfo.uniforms, this.uniforms);

    // Inject auto-updating time uniform if requested
    if (options.timeUniform) {
      shaderInfo.uniforms[options.timeUniform] = {
        get value() {return Date.now() - epoch}
      };
    }

    // Users can still add their own handlers on top of ours
    if (this[privateBeforeCompileProp]) {
      this[privateBeforeCompileProp](shaderInfo);
    }
  }

  function DerivedMaterial() {
    baseMaterial.constructor.apply(this, arguments);
    this._listeners = undefined; //don't inherit EventDispatcher listeners
  }
  DerivedMaterial.prototype = Object.create(baseMaterial, {
    constructor: {value: DerivedMaterial},
    isDerivedMaterial: {value: true},
    baseMaterial: {value: baseMaterial},

    onBeforeCompile: {
      get() {
        return onBeforeCompile
      },
      set(fn) {
        this[privateBeforeCompileProp] = fn;
      }
    },

    copy: {
      value: function (source) {
        baseMaterial.copy.call(this, source);
        if (!baseMaterial.isShaderMaterial && !baseMaterial.isDerivedMaterial) {
          this.extensions = assign({}, source.extensions);
          this.defines = assign({}, source.defines);
          this.uniforms = UniformsUtils.clone(source.uniforms);
        }
        return this
      }
    },

    /**
     * Utility to get a MeshDepthMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDepthMaterial: {value: function() {
      let depthMaterial = this._depthMaterial;
      if (!depthMaterial) {
        if (!depthMaterialTpl) {
          depthMaterialTpl = createDerivedMaterial(
            baseMaterial.isDerivedMaterial
              ? baseMaterial.getDepthMaterial()
              : new MeshDepthMaterial({depthPacking: RGBADepthPacking}),
            options
          );
          depthMaterialTpl.defines.IS_DEPTH_MATERIAL = '';
        }
        depthMaterial = this._depthMaterial = depthMaterialTpl.clone();
        depthMaterial.uniforms = this.uniforms; //automatically recieve same uniform values
      }
      return depthMaterial
    }},

    /**
     * Utility to get a MeshDistanceMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDistanceMaterial: {value: function() {
      let distanceMaterial = this._distanceMaterial;
      if (!distanceMaterial) {
        if (!distanceMaterialTpl) {
          distanceMaterialTpl = createDerivedMaterial(
            baseMaterial.isDerivedMaterial
              ? baseMaterial.getDistanceMaterial()
              : new MeshDistanceMaterial(),
            options
          );
          distanceMaterialTpl.defines.IS_DISTANCE_MATERIAL = '';
        }
        distanceMaterial = this._distanceMaterial = distanceMaterialTpl.clone();
        distanceMaterial.uniforms = this.uniforms; //automatically recieve same uniform values
      }
      return distanceMaterial
    }},

    dispose: {value() {
      const {_depthMaterial, _distanceMaterial} = this;
      if (_depthMaterial) _depthMaterial.dispose();
      if (_distanceMaterial) _distanceMaterial.dispose();
      baseMaterial.dispose.call(this);
    }}
  });

  const material = new DerivedMaterial();
  material.copy(baseMaterial);

  // Merge uniforms, defines, and extensions
  material.uniforms = assign(UniformsUtils.clone(baseMaterial.uniforms || {}), options.uniforms);
  material.defines = assign({}, baseMaterial.defines, options.defines);
  material.defines.TROIKA_DERIVED_MATERIAL = id; //force a program change from the base material
  material.extensions = assign({}, baseMaterial.extensions, options.extensions);

  cached[optionsHash] = material;
  return material.clone() //return a clone so changes made to it don't affect the cached object
}


function upgradeShaders({vertexShader, fragmentShader}, options, id) {
  let {
    vertexDefs,
    vertexMainIntro,
    vertexMainOutro,
    vertexTransform,
    fragmentDefs,
    fragmentMainIntro,
    fragmentMainOutro,
    fragmentColorTransform,
    customRewriter,
    timeUniform
  } = options;

  vertexDefs = vertexDefs || '';
  vertexMainIntro = vertexMainIntro || '';
  vertexMainOutro = vertexMainOutro || '';
  fragmentDefs = fragmentDefs || '';
  fragmentMainIntro = fragmentMainIntro || '';
  fragmentMainOutro = fragmentMainOutro || '';

  // Expand includes if needed
  if (vertexTransform || customRewriter) {
    vertexShader = expandShaderIncludes(vertexShader);
  }
  if (fragmentColorTransform || customRewriter) {
    // We need to be able to find postprocessing chunks after include expansion in order to
    // put them after the fragmentColorTransform, so mark them with comments first. Even if
    // this particular derivation doesn't have a fragmentColorTransform, other derivations may,
    // so we still mark them.
    fragmentShader = fragmentShader.replace(
      /^[ \t]*#include <((?:tonemapping|encodings|fog|premultiplied_alpha|dithering)_fragment)>/gm,
      '\n//!BEGIN_POST_CHUNK $1\n$&\n//!END_POST_CHUNK\n'
    );
    fragmentShader = expandShaderIncludes(fragmentShader);
  }

  // Apply custom rewriter function
  if (customRewriter) {
    let res = customRewriter({vertexShader, fragmentShader});
    vertexShader = res.vertexShader;
    fragmentShader = res.fragmentShader;
  }

  // The fragmentColorTransform needs to go before any postprocessing chunks, so extract
  // those and re-insert them into the outro in the correct place:
  if (fragmentColorTransform) {
    let postChunks = [];
    fragmentShader = fragmentShader.replace(
      /^\/\/!BEGIN_POST_CHUNK[^]+?^\/\/!END_POST_CHUNK/gm, // [^]+? = non-greedy match of any chars including newlines
      match => {
        postChunks.push(match);
        return ''
      }
    );
    fragmentMainOutro = `${fragmentColorTransform}\n${postChunks.join('\n')}\n${fragmentMainOutro}`;
  }

  // Inject auto-updating time uniform if requested
  if (timeUniform) {
    const code = `\nuniform float ${timeUniform};\n`;
    vertexDefs = code + vertexDefs;
    fragmentDefs = code + fragmentDefs;
  }

  // Inject a function for the vertexTransform and rename all usages of position/normal/uv
  if (vertexTransform) {
    vertexDefs = `${vertexDefs}
vec3 troika_position_${id};
vec3 troika_normal_${id};
vec2 troika_uv_${id};
void troikaVertexTransform${id}(inout vec3 position, inout vec3 normal, inout vec2 uv) {
  ${vertexTransform}
}
`;
    vertexMainIntro = `
troika_position_${id} = vec3(position);
troika_normal_${id} = vec3(normal);
troika_uv_${id} = vec2(uv);
troikaVertexTransform${id}(troika_position_${id}, troika_normal_${id}, troika_uv_${id});
${vertexMainIntro}
`;
    vertexShader = vertexShader.replace(/\b(position|normal|uv)\b/g, (match, match1, index, fullStr) => {
      return /\battribute\s+vec[23]\s+$/.test(fullStr.substr(0, index)) ? match1 : `troika_${match1}_${id}`
    });
  }

  // Inject defs and intro/outro snippets
  vertexShader = injectIntoShaderCode(vertexShader, id, vertexDefs, vertexMainIntro, vertexMainOutro);
  fragmentShader = injectIntoShaderCode(fragmentShader, id, fragmentDefs, fragmentMainIntro, fragmentMainOutro);

  return {
    vertexShader,
    fragmentShader
  }
}

function injectIntoShaderCode(shaderCode, id, defs, intro, outro) {
  if (intro || outro || defs) {
    shaderCode = shaderCode.replace(voidMainRegExp, `
${defs}
void troikaOrigMain${id}() {`
    );
    shaderCode += `
void main() {
  ${intro}
  troikaOrigMain${id}();
  ${outro}
}`;
  }
  return shaderCode
}

function getOptionsHash(options) {
  return JSON.stringify(options, optionsJsonReplacer)
}

function optionsJsonReplacer(key, value) {
  return key === 'uniforms' ? undefined : typeof value === 'function' ? value.toString() : value
}

let _idCtr = 0;
const optionsHashesToIds = new Map();
function getIdForOptionsHash(optionsHash) {
  let id = optionsHashesToIds.get(optionsHash);
  if (id == null) {
    optionsHashesToIds.set(optionsHash, (id = ++_idCtr));
  }
  return id
}

// Copied from threejs WebGLPrograms.js so we can resolve builtin materials to their shaders
// TODO how can we keep this from getting stale?
const MATERIAL_TYPES_TO_SHADERS = {
  MeshDepthMaterial: 'depth',
  MeshDistanceMaterial: 'distanceRGBA',
  MeshNormalMaterial: 'normal',
  MeshBasicMaterial: 'basic',
  MeshLambertMaterial: 'lambert',
  MeshPhongMaterial: 'phong',
  MeshToonMaterial: 'phong',
  MeshStandardMaterial: 'physical',
  MeshPhysicalMaterial: 'physical',
  MeshMatcapMaterial: 'matcap',
  LineBasicMaterial: 'basic',
  LineDashedMaterial: 'dashed',
  PointsMaterial: 'points',
  ShadowMaterial: 'shadow',
  SpriteMaterial: 'sprite'
};

/**
 * Given a Three.js `Material` instance, find the shaders/uniforms that will be
 * used to render that material.
 *
 * @param material - the Material instance
 * @return {object} - the material's shader info: `{uniforms:{}, fragmentShader:'', vertexShader:''}`
 */
function getShadersForMaterial(material) {
  let builtinType = MATERIAL_TYPES_TO_SHADERS[material.type];
  return builtinType ? ShaderLib[builtinType] : material //TODO fallback for unknown type?
}

/**
 * Find all uniforms and their types within a shader code string.
 *
 * @param {string} shader - The shader code to parse
 * @return {object} mapping of uniform names to their glsl type
 */
function getShaderUniformTypes(shader) {
  let uniformRE = /\buniform\s+(int|float|vec[234])\s+([A-Za-z_][\w]*)/g;
  let uniforms = Object.create(null);
  let match;
  while ((match = uniformRE.exec(shader)) !== null) {
    uniforms[match[2]] = match[1];
  }
  return uniforms
}

/**
 * @class ShaderFloatArray
 *
 * When writing a custom WebGL shader, sometimes you need to pass it an array of floating
 * point numbers that it can read from. Unfortunately this is very difficult to do in WebGL,
 * because:
 *
 *   - GLSL "array" uniforms can only be of a constant length.
 *   - Textures can only hold floating point numbers in WebGL1 if the `OES_texture_float`
 *     extension is available.
 *
 * ShaderFloatArray is an array-like abstraction that encodes its floating point data into
 * an RGBA texture's four Uint8 components, and provides the corresponding ThreeJS uniforms
 * and GLSL code for you to put in your custom shader to query the float values by array index.
 *
 * This should generally only be used within a fragment shader, as some environments (e.g. iOS)
 * only allow texture lookups in fragment shaders.
 *
 * TODO:
 *   - Fix texture to fill both dimensions so we don't easily hit max texture size limits
 *   - Use a float texture if the extension is available so we can skip the encoding process
 */
class ShaderFloatArray {
  constructor(name) {
    this.name = name;
    this.textureUniform = `dataTex_${name}`;
    this.textureSizeUniform = `dataTexSize_${name}`;
    this.multiplierUniform = `dataMultiplier_${name}`;

    /**
     * @property dataSizeUniform - the name of the GLSL uniform that will hold the
     * length of the data array.
     * @type {string}
     */
    this.dataSizeUniform = `dataSize_${name}`;

    /**
     * @property readFunction - the name of the GLSL function that should be called to
     * read data out of the array by index.
     * @type {string}
     */
    this.readFunction = `readData_${name}`;

    this._raw = new Float32Array(0);
    this._texture = new DataTexture(new Uint8Array(0), 0, 1);
    this._length = 0;
    this._multiplier = 1;
  }

  /**
   * @property length - the current length of the data array
   * @type {number}
   */
  set length(value) {
    if (value !== this._length) {
      // Find nearest power-of-2 that holds the new length
      const size = Math.pow(2, Math.ceil(Math.log2(value)));
      const raw = this._raw;
      if (size < raw.length) {
        this._raw = raw.subarray(0, size);
      }
      else if(size > raw.length) {
        this._raw = new Float32Array(size);
        this._raw.set(raw);
      }
      this._length = value;
    }
  }
  get length() {
    return this._length
  }

  /**
   * Add a value to the end of the data array
   * @param {number} value
   */
  push(value) {
    return this.set(this.length++, value)
  }

  /**
   * Replace the existing data with that from a new array
   * @param {ArrayLike<number>} array
   */
  setArray(array) {
    this.length = array.length;
    this._raw.set(array);
    this._needsRepack = true;
  }

  /**
   * Get the current value at index
   * @param {number} index
   * @return {number}
   */
  get(index) {
    return this._raw[index]
  }

  set(index, value) {
    if (index + 1 > this._length) {
      this.length = index + 1;
    }
    if (value !== this._raw[index]) {
      this._raw[index] = value;
      encodeFloatToFourInts(
        value / this._multiplier,
        this._texture.image.data,
        index * 4
      );
      this._needsMultCheck = true;
    }
  }

  /**
   * Make a copy of this ShaderFloatArray
   * @return {ShaderFloatArray}
   */
  clone() {
    const clone = new ShaderFloatArray(this.name);
    clone.setArray(this._raw);
    return clone
  }

  /**
   * Retrieve the set of Uniforms that must to be added to the target ShaderMaterial or
   * DerivedMaterial, to feed the GLSL code generated by {@link #getShaderHeaderCode}.
   * @return {Object}
   */
  getShaderUniforms() {
    const me = this;
    return {
      [this.textureUniform]: {get value() {
        me._sync();
        return me._texture
      }},
      [this.textureSizeUniform]: {get value() {
        me._sync();
        return me._texture.image.width
      }},
      [this.dataSizeUniform]: {get value() {
        me._sync();
        return me.length
      }},
      [this.multiplierUniform]: {get value() {
        me._sync();
        return me._multiplier
      }}
    }
  }

  /**
   * Retrieve the GLSL code that must be injected into the shader's definitions area to
   * enable reading from the data array. This exposes a function with a name matching
   * the {@link #readFunction} property, which other shader code can call to read values
   * from the array by their index.
   * @return {string}
   */
  getShaderHeaderCode() {
    const {textureUniform, textureSizeUniform, dataSizeUniform, multiplierUniform, readFunction} = this;
    return `
uniform sampler2D ${textureUniform};
uniform float ${textureSizeUniform};
uniform float ${dataSizeUniform};
uniform float ${multiplierUniform};

float ${readFunction}(float index) {
  vec2 texUV = vec2((index + 0.5) / ${textureSizeUniform}, 0.5);
  vec4 pixel = texture2D(${textureUniform}, texUV);
  return dot(pixel, 1.0 / vec4(1.0, 255.0, 65025.0, 16581375.0)) * ${multiplierUniform};
}
`
  }

  /**
   * @private Synchronize any pending changes to the underlying DataTexture
   */
  _sync() {
    const tex = this._texture;
    const raw = this._raw;
    let needsRepack = this._needsRepack;

    // If the size of the raw array changed, resize the texture to match
    if (raw.length !== tex.image.width) {
      tex.image = {
        data: new Uint8Array(raw.length * 4),
        width: raw.length,
        height: 1
      };
      needsRepack = true;
    }

    // If the values changed, check the multiplier. This should be a value by which
    // all the values are divided to constrain them to the [0,1] range required by
    // the Uint8 packing algorithm. We pick the nearest power of 2 that holds the
    // maximum value for greatest accuracy.
    if (needsRepack || this._needsMultCheck) {
      const maxVal = this._raw.reduce((a, b) => Math.max(a, b), 0);
      const mult = Math.pow(2, Math.ceil(Math.log2(maxVal)));
      if (mult !== this._multiplier) {
        this._multiplier = mult;
        needsRepack = true;
      }
      tex.needsUpdate = true;
      this._needsMultCheck = false;
    }

    // If things changed in a way we need to repack, do so
    if (needsRepack) {
      for (let i = 0, len = raw.length, mult = this._multiplier; i < len; i++) {
        encodeFloatToFourInts(raw[i] / mult, tex.image.data, i * 4);
      }
      this._needsRepack = false;
    }
  }
}



/**
 * Encode a floating point number into a set of four 8-bit integers.
 * Also see the companion decoder function #decodeFloatFromFourInts.
 *
 * This is adapted to JavaScript from the basic approach at
 * http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
 * but writes out integers in the range 0-255 instead of floats in the range 0-1
 * so they can be more easily used in a Uint8Array for standard WebGL rgba textures.
 *
 * Some precision will necessarily be lost during the encoding and decoding process.
 * Testing shows that the maximum precision error is ~1.18e-10 which should be good
 * enough for most cases.
 *
 * @param {Number} value - the floating point number to encode. Must be in the range [0, 1]
 *        otherwise the results will be incorrect.
 * @param {Array|Uint8Array} array - an array into which the four ints should be written
 * @param {Number} startIndex - index in the output array at which to start writing the ints
 * @return {Array|Uint8Array}
 */
function encodeFloatToFourInts(value, array, startIndex) {
  // This is adapted to JS from the basic approach at
  // http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
  // but writes to a Uint8Array instead of floats. Input values must be in
  // the range [0, 1]. The maximum error after encoding and decoding is ~1.18e-10
  let enc0 = 255 * value;
  let enc1 = 255 * (enc0 % 1);
  let enc2 = 255 * (enc1 % 1);
  let enc3 = 255 * (enc2 % 1);

  enc0 = enc0 & 255;
  enc1 = enc1 & 255;
  enc2 = enc2 & 255;
  enc3 = Math.round(enc3) & 255;

  array[startIndex] = enc0;
  array[startIndex + 1] = enc1;
  array[startIndex + 2] = enc2;
  array[startIndex + 3] = enc3;
  return array
}

/*
Input geometry is a cylinder with r=1, height in y dimension from 0 to 1,
divided into a reasonable number of height segments.
*/

const vertexDefs = `
uniform vec3 pointA;
uniform vec3 controlA;
uniform vec3 controlB;
uniform vec3 pointB;
uniform float radius;
varying float bezierT;

vec3 cubicBezier(vec3 p1, vec3 c1, vec3 c2, vec3 p2, float t) {
  float t2 = 1.0 - t;
  float b0 = t2 * t2 * t2;
  float b1 = 3.0 * t * t2 * t2;
  float b2 = 3.0 * t * t * t2;
  float b3 = t * t * t;
  return b0 * p1 + b1 * c1 + b2 * c2 + b3 * p2;
}

vec3 cubicBezierDerivative(vec3 p1, vec3 c1, vec3 c2, vec3 p2, float t) {
  float t2 = 1.0 - t;
  return -3.0 * p1 * t2 * t2 +
    c1 * (3.0 * t2 * t2 - 6.0 * t2 * t) +
    c2 * (6.0 * t2 * t - 3.0 * t * t) +
    3.0 * p2 * t * t;
}
`;

const vertexTransform = `
float t = position.y;
bezierT = t;
vec3 bezierCenterPos = cubicBezier(pointA, controlA, controlB, pointB, t);
vec3 bezierDir = normalize(cubicBezierDerivative(pointA, controlA, controlB, pointB, t));

// Make "sideways" always perpendicular to the camera ray; this ensures that any twists
// in the cylinder occur where you won't see them: 
vec3 viewDirection = normalMatrix * vec3(0.0, 0.0, 1.0);
if (bezierDir == viewDirection) {
  bezierDir = normalize(cubicBezierDerivative(pointA, controlA, controlB, pointB, t == 1.0 ? t - 0.0001 : t + 0.0001));
}
vec3 sideways = normalize(cross(bezierDir, viewDirection));
vec3 upish = normalize(cross(sideways, bezierDir));

// Build a matrix for transforming this disc in the cylinder:
mat4 discTx;
discTx[0].xyz = sideways * radius;
discTx[1].xyz = bezierDir * radius;
discTx[2].xyz = upish * radius;
discTx[3].xyz = bezierCenterPos;
discTx[3][3] = 1.0;

// Apply transform, ignoring original y
position = (discTx * vec4(position.x, 0.0, position.z, 1.0)).xyz;
normal = normalize(mat3(discTx) * normal);
`;

const fragmentDefs = `
uniform vec3 dashing;
varying float bezierT;
`;

const fragmentMainIntro = `
if (dashing.x + dashing.y > 0.0) {
  float dashFrac = mod(bezierT - dashing.z, dashing.x + dashing.y);
  if (dashFrac > dashing.x) {
    discard;
  }
}
`;

// Debugging: separate color for each of the 6 sides:
// const fragmentColorTransform = `
// float sideNum = floor(vUV.x * 6.0);
// vec3 mixColor = sideNum < 1.0 ? vec3(1.0, 0.0, 0.0) :
//   sideNum < 2.0 ? vec3(0.0, 1.0, 1.0) :
//   sideNum < 3.0 ? vec3(1.0, 1.0, 0.0) :
//   sideNum < 4.0 ? vec3(0.0, 0.0, 1.0) :
//   sideNum < 5.0 ? vec3(0.0, 1.0, 0.0) :
//   vec3(1.0, 0.0, 1.0);
// gl_FragColor.xyz = mix(gl_FragColor.xyz, mixColor, 0.5);
// `



function createBezierMeshMaterial(baseMaterial) {
  return createDerivedMaterial(
    baseMaterial,
    {
      uniforms: {
        pointA: {value: new Vector3()},
        controlA: {value: new Vector3()},
        controlB: {value: new Vector3()},
        pointB: {value: new Vector3()},
        radius: {value: 0.01},
        dashing: {value: new Vector3()} //on, off, offset
      },
      vertexDefs,
      vertexTransform,
      fragmentDefs,
      fragmentMainIntro
    }
  )
}

let geometry = null;

const defaultBaseMaterial = new MeshStandardMaterial({color: 0xffffff, side: DoubleSide});


/**
 * A ThreeJS `Mesh` that bends a tube shape along a 3D cubic bezier path. The bending is done
 * by deforming a straight cylindrical geometry in the vertex shader based on a set of four
 * control point uniforms. It patches the necessary GLSL into the mesh's assigned `material`
 * automatically.
 *
 * The cubiz bezier path is determined by its four `Vector3` properties:
 * - `pointA`
 * - `controlA`
 * - `controlB`
 * - `pointB`
 *
 * The tube's radius is controlled by its `radius` property, which defaults to `0.01`.
 *
 * You can also give the tube a dashed appearance with two properties:
 *
 * - `dashArray` - an array of two numbers, defining the length of "on" and "off" parts of
 *   the dash. Each is a 0-1 ratio of the entire path's length. (Actually this is the `t` length
 *   used as input to the cubic bezier function, not its visible length.)
 * - `dashOffset` - offset of where the dash starts. You can animate this to make the dashes move.
 *
 * Note that the dashes will appear like a hollow tube, not solid. This will be more apparent on
 * thicker tubes.
 *
 * TODO: proper geometry bounding sphere and raycasting
 * TODO: allow control of the geometry's segment counts
 */
class BezierMesh extends Mesh {
  static getGeometry() {
    return geometry || (geometry =
      new CylinderBufferGeometry(1, 1, 1, 6, 64).translate(0, 0.5, 0)
    )
  }

  constructor() {
    super(
      BezierMesh.getGeometry(),
      defaultBaseMaterial
    );

    this.pointA = new Vector3();
    this.controlA = new Vector3();
    this.controlB = new Vector3();
    this.pointB = new Vector3();
    this.radius = 0.01;
    this.dashArray = new Vector2();
    this.dashOffset = 0;

    // TODO - disabling frustum culling until I figure out how to customize the
    //  geometry's bounding sphere that gets used
    this.frustumCulled = false;
  }

  // Handler for automatically wrapping the base material with our upgrades. We do the wrapping
  // lazily on _read_ rather than write to avoid unnecessary wrapping on transient values.
  get material() {
    let derivedMaterial = this._derivedMaterial;
    const baseMaterial = this._baseMaterial || defaultBaseMaterial;
    if (!derivedMaterial || derivedMaterial.baseMaterial !== baseMaterial) {
      derivedMaterial = this._derivedMaterial = createBezierMeshMaterial(baseMaterial);
      // dispose the derived material when its base material is disposed:
      baseMaterial.addEventListener('dispose', function onDispose() {
        baseMaterial.removeEventListener('dispose', onDispose);
        derivedMaterial.dispose();
      });
    }
    return derivedMaterial
  }
  set material(baseMaterial) {
    this._baseMaterial = baseMaterial;
  }

  // Create and update material for shadows upon request:
  get customDepthMaterial() {
    return this.material.getDepthMaterial()
  }
  get customDistanceMaterial() {
    return this.material.getDistanceMaterial()
  }

  onBeforeRender(shaderInfo) {
    const {uniforms} = this.material;
    const {pointA, controlA, controlB, pointB, radius, dashArray, dashOffset} = this;
    uniforms.pointA.value.copy(pointA);
    uniforms.controlA.value.copy(controlA);
    uniforms.controlB.value.copy(controlB);
    uniforms.pointB.value.copy(pointB);
    uniforms.radius.value = radius;
    uniforms.dashing.value.set(dashArray.x, dashArray.y, dashOffset || 0);
  }

  raycast(raycaster, intersects) {
    // TODO - just fail for now
  }
}

export { BezierMesh, ShaderFloatArray, createDerivedMaterial, expandShaderIncludes, getShaderUniformTypes, getShadersForMaterial, voidMainRegExp };

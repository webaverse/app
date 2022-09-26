import * as THREE from 'three';
import {parser, generate} from '@shaderfrog/glsl-parser';

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const replaceStatementText = 'bool _webaverseShaderReplace = false;';
const appendMain = (shaderText, postfixLine) => {
  const replaceStatmentAst = parser.parse(replaceStatementText);

  const ast = parser.parse(shaderText);
  const {program} = ast;
  // console.log('got program', program);
  const mainProgram = program.find(p => p.type === 'function' && p.prototype.header.name.identifier === 'main');
  if (mainProgram) {
    const {body: {statements}} = mainProgram;
    statements.push(...replaceStatmentAst.program);
  }
  const s = generate(ast)
    .replace(replaceStatementText, postfixLine + '\n');
  // console.log('got o', ast, s);
  return s;
};

/* window.shaderText = `\
  ${THREE.ShaderChunk.common}
  uniform float iTime;
  varying vec2 uvs;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
  void main() {
    uvs = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vNormal = normal;
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    ${THREE.ShaderChunk.logdepthbuf_vertex}
  }
`; */

// memoize a function which takes a string and returns a string
const _memoize = fn => {
  const cache = new Map();
  return s => {
    let result = cache.get(s);
    if (result === undefined) {
      result = fn(s);
      cache.set(s, result);
    }
    return result;
  };
};

const formatVertexShader = _memoize(vertexShader => `\
${THREE.ShaderChunk.common}
${THREE.ShaderChunk.logdepthbuf_pars_vertex}
    
${appendMain(vertexShader, THREE.ShaderChunk.logdepthbuf_vertex)}
`);

const formatFragmentShader = _memoize(fragmentShader => `\
${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    
${appendMain(fragmentShader, THREE.ShaderChunk.logdepthbuf_fragment)}
`);

class WebaverseShaderMaterial extends THREE.ShaderMaterial {
  constructor(opts = {}) {
    if (opts.vertexShader !== undefined) {
      opts.vertexShader = formatVertexShader(opts.vertexShader);
    }
    if (opts.fragmentShader !== undefined) {
      opts.fragmentShader = formatFragmentShader(opts.fragmentShader);
    }
    super(opts);
  }
}
class WebaverseRawShaderMaterial extends THREE.RawShaderMaterial {
  constructor(opts = {}) {
    opts.vertexShader = formatVertexShader(opts.vertexShader);
    const lines = opts.vertexShader.split('\n');
    let firstNonPrecisionLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('precision')) {
        firstNonPrecisionLine = i;
        break;
      }
    }
    if (firstNonPrecisionLine !== -1 && !lines.some(l => l.trim().startsWith('#define USE_LOGDEPTHBUF'))) {
      lines.splice(firstNonPrecisionLine, 0, '#define USE_LOGDEPTHBUF');
      opts.vertexShader = lines.join('\n');
    }
    // opts.vertexShader = opts.vertexShader.replace('#define EPSILON 1e-6', '#define EPSILON 1e-6\n#define USE_LOGDEPTHBUF 1');
    opts.fragmentShader = formatFragmentShader(opts.fragmentShader);
    super(opts);
  }
}
export {
  WebaverseShaderMaterial,
  WebaverseRawShaderMaterial,
};

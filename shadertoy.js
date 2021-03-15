import * as THREE from './three.module.js';
import {scene, camera, renderer} from './app-object.js';
import runtime from './runtime.js';

const size = 1024;
const worldSize = 2;
const vertexShader = `#version 300 es
  precision highp float;

  in vec3 position;
  in vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const planeGeometry = new THREE.PlaneGeometry(2, 2);
const fakeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
class ShaderToyPass {
  constructor({type, is, code, os, renderTarget}, parent) {
    this.type = type;
    this.is = is;
    this.code = code;
    this.os = os;
    this.renderTarget = renderTarget;
    this.parent = parent;

    const uniforms = {
      modelViewMatrix: {
        value: new THREE.Matrix4().multiplyMatrices(fakeCamera.matrixWorldInverse, fakeCamera.matrixWorld),
      },
      projectionMatrix: {
        value: fakeCamera.projectionMatrix,
      },
      iResolution: {
        value: new THREE.Vector3(size, size, 1),
      },
      iTime: {
        value: parent.getITime(),
      },
      iFrame: {
        value: parent.getIFrame(),
      },
      iMouse: {
        value: new THREE.Vector4(0, 0, 0, 0),
      },
      iSampleRate: {
        value: 44100,
      },
    };
    for (const input of is) {
      let {channel, buffer} = input;
      if (!buffer.isTexture) {
        buffer = buffer.texture;
      }
      uniforms['iChannel' + channel] = {
        value: buffer,
      };
      if (!uniforms['iChannelResolution']) {
        uniforms['iChannelResolution'] = {
          value: [],
        };
      }
      uniforms['iChannelResolution'].value[channel] = new THREE.Vector3(buffer.image.width, buffer.image.height, 1);
    }
    this.mesh = new THREE.Mesh(
      planeGeometry,
      new THREE.RawShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader: `#version 300 es
          precision highp float;

          uniform vec3      iResolution;           // viewport resolution (in pixels)
          uniform float     iTime;                 // shader playback time (in seconds)
          uniform float     iTimeDelta;            // render time (in seconds)
          uniform int       iFrame;                // shader playback frame
          uniform float     iChannelTime[4];       // channel playback time (in seconds)
          uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
          uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
          uniform sampler2D iChannel0;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel1;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel2;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel3;          // input channel. XX = 2D/Cube
          uniform vec4      iDate;                 // (year, month, day, time in seconds)
          uniform float     iSampleRate;           // sound sample rate (i.e., 44100)
          in vec2 vUv;
          out vec4 fragColor;
          
          ${this.code}

          void main() {
            vec2 fragCoord = vUv * iResolution.xy;
            mainImage(fragColor, fragCoord);
            // fragColor = vec4(vUv, 0.0, 1.0);
          }
        `,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
  }
  update() {
    this.mesh.material.uniforms.iTime.value = this.parent.getITime();
    this.mesh.material.uniforms.iFrame.value = this.parent.getIFrame();
    // this.mesh.material.needsUpdate = true;
    
    {
      const [{buffer} = {}] = this.os;
      if (buffer) {
        // console.log('render buffer', buffer);
        renderer.setRenderTarget(buffer);
        // renderer.setClearColor(new THREE.Color(1, 0, 0), 1);
        renderer.clear();
        renderer.render(this.scene, fakeCamera);
        renderer.setRenderTarget(null);
      }
    }

    if (this.type === 'buffer') {
      
    } else if (this.type === 'image') {
      renderer.setRenderTarget(this.renderTarget);
      // renderer.setClearColor(new THREE.Color(1, 0, 0), 1);
      renderer.clear();
      renderer.render(this.scene, fakeCamera);
      renderer.setRenderTarget(null);
    } else {
      throw new Error('unknown pass type: ' + this.type);
    }
  }
}
let numRenderTargetMeshes = 0;
window.renderTargetMeshes = [];
const _addRenderTargetMesh = renderTarget => {
  const geometry = new THREE.PlaneBufferGeometry(worldSize, worldSize);
  /* const material = new THREE.ShaderMaterial({
  }); */
  const material = new THREE.MeshBasicMaterial({
    // color: 0xFF0000,
    map: renderTarget.texture,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-3 + numRenderTargetMeshes * worldSize, worldSize/2, -1);
  scene.add(mesh);
  renderTargetMeshes.push(mesh);
  // console.log('add mesh', renderTarget, mesh);
  
  numRenderTargetMeshes++;
};
class ShadertoyRenderer {
  constructor({shader}) {
    this.shader = shader;

    this.renderTarget = new THREE.WebGLRenderTarget(size, size);
    this.textures = {};
    this.buffers = {};
    this.now = performance.now();
    this.startTime = this.now;
    this.frame = 0;

    const _ensureInput = input => {
      const {id, type, filepath, sampler} = input;
      if (type === 'texture') {
        if (!this.textures[id]) {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          const promise = new Promise((accept, reject) => {
            img.addEventListener('load', () => {
              texture.needsUpdate = true;
              accept();
            });
            img.addEventListener('error', reject);
          });
          promises.push(promise);
          img.src = `https://https-shadertoy-com.proxy.exokit.org${filepath}`;
          const texture = new THREE.Texture(img);
          this.textures[id] = texture;
        }
        return this.textures[id];
      } else if (type === 'buffer') {
        if (!this.buffers[id]) {
          this.buffers[id] = new THREE.WebGLRenderTarget(size, size);
        }
        return this.buffers[id];
      } else {
        throw new Error('unknown input type: ' + type);
      }
    };

    const promises = [];
    this.renderPasses = [];
    let renderPassIos = [];
    const _initRenderPassIos = () => {
      renderPassIos = shader.renderpass.map(rp => {
        const {inputs, outputs} = rp;

        const is = [];
        for (const input of inputs) {
          const {channel} = input;
          const buffer = _ensureInput(input);
          const i = {
            channel,
            buffer,
          };
          is.push(i);
        }
        
        const os = [];
        for (const output of outputs) {
          const {id, channel} = output;
          const buffer = _ensureInput({
            id,
            type: 'buffer',
          });
          const o = {
            channel,
            buffer,
          };
          os.push(o);
        }
        
        return {
          is,
          os,
        };
      });
    };
    _initRenderPassIos();
    const _initRenderPasses = async () => {
      // wait for images to load
      await Promise.all(promises);
      
      for (const id in this.buffers) {
        _addRenderTargetMesh(this.buffers[id]);
      }
      _addRenderTargetMesh(this.renderTarget);
      
      for (let i = 0; i < shader.renderpass.length; i++) {
        const {type, code} = shader.renderpass[i];
        const {is, os} = renderPassIos[i];
        const renderPass = new ShaderToyPass({
          type,
          is,
          code,
          os,
          renderTarget: this.renderTarget,
        }, this);
        this.renderPasses.push(renderPass);
      }
    };
    _initRenderPasses();
    
    this.loadPromise = Promise.all(promises)
      .then(() => {});
  }
  getITime() {
    return (this.now - this.startTime)/1000;
  }
  getIFrame() {
    return this.frame;
  }
  waitForLoad() {
    return this.loadPromise;
  }
  update() {
    // console.log('update start');
    this.now = performance.now();
    this.frame++;
    for (const renderPass of this.renderPasses) {
      renderPass.update();
    }
    // console.log('update end');
  }
}

const shadertoyRenderers = [];
(async () => {
  const res = await fetch('./shaders.json');
  const shaders = await res.json();
  const shader = shaders.shaders.find(shader => shader.info.name === 'Fork LIC 2D / f avaer 088');
  shader.renderpass[0].code = `
    // bufA precomputation version of https://www.shadertoy.com/view/MslyD7#
    #define MODE 0 // 0: lines > 0: flownoise (see previous shaders)

    float line(vec2 p, vec2 a, vec2 b) 
    {
      vec2 pa = p - a, ba = b - a;
      vec2 d = pa - ba * clamp(dot(pa, ba)/dot(ba, ba) , 0., 1.); 
      return length(d);
    }

    void mainImage( out vec4 O, vec2 U ) // -------------------------------------------
    {
        float t = iTime; const float N=30.; 
        vec2 R = iResolution.xy;
        O = vec4(0);
        U /= 8.*R.y; 
    #if MODE==0   
    int n = 2; // try zero :-)
    for(int x=-n; x<=n; x++) 
      for(int y=-n; y<=n; y++) { 
    #endif        
        vec2 D, P,_P, 
    #if MODE>0
            P0 = U;
    #else
            P0 = ( ceil(U*64.)-.5 +vec2(x,y)/3. )/64.;
    #endif
            
        P=P0;
          
        for (float i=0.; i<1.; i+=1./N) {
                                                         // --- random field creation
            D = texture(iChannel0, fract( P*8.*R.y/R +.05*t )).xy;
                                                                   
        _P = P;
            P -= .1/200.* D*R.y/8.;                      // --- advection (to be LIC )

    #if MODE==0          
            O += smoothstep(.2,.0,line(U,_P,P)*R.y) *N * R.y/1e3
                 * (.5+.5*vec4(P-P0,0,0)*200.*8./11.3)
                ;
    #elif MODE==1          
          O +=   (.5+.5*vec4(P-P0,0,0)*200.*8./11.3)   // --- flow visualization 
                 * pow(texture(iChannel1,P.xy*8.*R.y/R+.00*t).r*1.15,3.) *2.
                 * (1.+1.*sin(2.*6.2832*i+10.*t))
                ;
    #elif MODE==2
          O += pow(texture(iChannel2,P.xy*8.*R.y/R+.00*t)*1.15,vec4(3));
    #elif MODE==3
            O += .1/length(fract(P * 8.*30.+.5*t)-.5);
    #endif  
        }
    #if MODE==0          
     }
    #endif
        
        O /= N;
        //O = .5+.5*vec4(D,0,0)*30.*.1* R.y /11.3; O=fract(O); 
        //O = abs(2.*O-1.);
        
        //O += .1/length(fract(P * 8.*30.)-.5) -O;
        
        O = texture(iChannel0, U / iResolution.xy);
    }
  `;
  shader.renderpass[1].code = `        
    // --- Simplex noise 2D from  Makio64 / Ashima  https://www.shadertoy.com/view/4sdGD8

    vec3 permute( vec3 x) { return mod( x*x*34.+x, 289.); }
    float noise2( vec2 v) {
        v *= 64./2.; // emulates 64x64 noise texture
        vec2 i = floor((v.x+v.y)*.36602540378443 + v),
            x0 = (i.x+i.y)*.211324865405187 + v - i;
        float s = step(x0.x,x0.y);
        vec2 j = vec2(1.-s,s),
            x1 = x0 - j + .211324865405187, 
            x3 = x0 - .577350269189626; 
        i = mod(i,289.);
        vec3 p = permute( permute( i.y + vec3(0, j.y, 1 ))+ i.x + vec3(0, j.x, 1 )   ),
             m = max( .5 - vec3(dot(x0,x0), dot(x1,x1), dot(x3,x3)), 0.),
             x = fract(p * .024390243902439) * 2. - 1.,
             h = abs(x) - .5,
            a0 = x - floor(x + .5);
        return .5 + 65. * dot( pow(m,vec3(4.))*(- 0.85373472095314*( a0*a0 + h*h )+1.79284291400159 ), 
                               a0 * vec3(x0.x,x1.x,x3.x) + h * vec3(x0.y,x1.y,x3.y));
    }

    void mainImage( out vec4 O, vec2 U ) // -------------------------------------------
    {
        vec2 R = iResolution.xy;
        
        if (iFrame>0 && texture(iChannel0,.5/R).xy==R) { // recompute at start + resize
            O = texture(iChannel0,U/R);
            return;
        }
        if (U==vec2(.5)) { O.xy = R; return; }
        
        float t = iTime;
        U /= 8.*R.y; 
        vec2 D, P0 =  U, P = P0;
        
        float T = noise2(P);
    #define dnoise2(i,j) T - noise2(P-vec2(i,j)/8./R.y)
      //D = vec2(dFdx(T), dFdy(T) );                 // hardware derivatives
        D = vec2(dnoise2(1,0), dnoise2(0,1) );       // software derivatives
        D = normalize(D)*5./R.y;                     // optional : no calm areas
        D = vec2(-D.y,D.x);                          // invicid noise: grad(D)=0

        O = vec4(D,0,0); // *30.*.1* R.y;
        
        O = vec4(1., 0., 0., 1.);
    }
  `;
  const shadertoyRenderer = new ShadertoyRenderer({shader});
  window.shadertoyRenderer = shadertoyRenderer;
  await shadertoyRenderer.waitForLoad();
  shadertoyRenderers.push(shadertoyRenderer);
})();

const shaderToy = {
  update() {
    for (const shadertoyRenderer of shadertoyRenderers) {
      shadertoyRenderer.update();
    }
  }
};
export default shaderToy;
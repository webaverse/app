import {
  AddEquation,
  Color,
  // CustomBlending,
  // DataTexture,
  // DepthTexture,
  DstAlphaFactor,
  DstColorFactor,
  FloatType,
  LinearFilter,
  // MathUtils,
  // MeshNormalMaterial,
  // NearestFilter,
  NoBlending,
  RGBAFormat,
  sRGBEncoding,
  // RepeatWrapping,
  ShaderMaterial,
  UniformsUtils,
  // UnsignedShortType,
  // Vector3,
  WebGLRenderTarget,
  ZeroFactor,
  // Scene,
} from 'three';
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
// import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
// import { SSAOShader } from 'three/examples/jsm/shaders/SSAOShader.js';
// import { SSAOBlurShader } from 'three/examples/jsm/shaders/SSAOShader.js';
// import { SSAODepthShader } from 'three/examples/jsm/shaders/SSAOShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

// const oldParentCache = new WeakMap();
// const oldMaterialCache = new WeakMap();

const zeroVector = new THREE.Vector3(0, 0, 0);
const vertexShader = `\
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

class SwirlMaterial extends THREE.ShaderMaterial {
  constructor() {
    const positionOffsetMax = 0.02;

    const fragmentShader = `\
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform vec2 uPosition;
			varying vec2 vUv;

			const float ROTATION = 2.0 / 360.0 * 2.0 * 3.14159;
			const float SCALE = 0.97;

			vec3 hueShift( vec3 color, float hueAdjust ){
        const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
        const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
        const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

        const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
        const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
        const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

        float   YPrime  = dot (color, kRGBToYPrime);
        float   I       = dot (color, kRGBToI);
        float   Q       = dot (color, kRGBToQ);
        float   hue     = atan (Q, I);
        float   chroma  = sqrt (I * I + Q * Q);

        hue += hueAdjust;

        Q = chroma * sin (hue);
        I = chroma * cos (hue);

        vec3    yIQ   = vec3 (YPrime, I, Q);

        return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
      }

			void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
				vec4 bg = texture(tDiffuse, fragCoord);
				vec2 fgCoord = fragCoord * vec2(2.0) - vec2(1.0);
				fgCoord += uPosition;
				fgCoord = mat2(cos(ROTATION), sin(ROTATION), -sin(ROTATION), cos(ROTATION)) * fgCoord;
				fgCoord *= SCALE;
				fgCoord = (fgCoord + vec2(1.0)) * vec2(0.5);
				vec4 fg = texture(tDiffuse, fgCoord);
				fragColor = mix(bg, fg, 0.5);
				
				fragColor.rgb = hueShift(fragColor.rgb, -0.01);

				// if (uTime > 1.) {
					fragColor.rgb *= 0.99;
				// }

				fragColor.a = 1.;
			}
			void main() {
				mainImage(gl_FragColor, vUv);
			}
		`;

    super({
      // defines: Object.assign( {}, SSAOShader.defines ),
      uniforms: {
        tDiffuse: {
          value: null,
          needsUpdate: false,
        },
        uTime: {
          value: 0,
          needsUpdate: false,
        },
        uPosition: {
          // value: new THREE.Vector2((Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1),
          value: new THREE.Vector2(positionOffsetMax, 0)
            .rotateAround(zeroVector, Math.random() * Math.PI * 2),
          needsUpdate: true,
        },
      },
      vertexShader,
      fragmentShader,
      blending: NoBlending,
      encoding: sRGBEncoding,
    });
  }
}

class OpenMaterial extends THREE.ShaderMaterial {
  constructor() {
    const fragmentShader = `\
      uniform sampler2D tDiffuse;
      uniform float uTime;
			varying vec2 vUv;

			void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
				vec4 bg = texture(tDiffuse, fragCoord);

				float distanceToMiddle = abs(fragCoord.y - 0.5);
				float middleFactor = pow(uTime * 0.3, 2.0);
				if (distanceToMiddle < middleFactor) {
					fragColor.rgb = bg.rgb;
					// fragColor.rgb = vec3(1.);
				} else {
					fragColor.rgb = vec3(0.);
				}

				fragColor.a = 1.;
			}
			void main() {
				mainImage(gl_FragColor, vUv);
			}
		`;

    super({
      // defines: Object.assign( {}, SSAOShader.defines ),
      uniforms: {
        tDiffuse: {
          value: null,
          needsUpdate: false,
        },
        uTime: {
          value: 0,
          needsUpdate: false,
        },
      },
      vertexShader,
      fragmentShader,
      blending: NoBlending,
      encoding: sRGBEncoding,
    });
  }
}

class SwirlPass extends Pass {
  constructor(scene, camera, width, height/*, depthPass */) {
    super();

    this.width = (width !== undefined) ? width : 512;
    this.height = (height !== undefined) ? height : 512;
    // this.depthPass = depthPass;

    this.clear = true;

    this.originalClearColor = new Color();

    const _makeRenderTarget = () => {
      return new WebGLRenderTarget(this.width, this.height, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: FloatType,
        encoding: sRGBEncoding,
      });
    };
    this.ssaoRenderTargets = [
      _makeRenderTarget(), // read buffer
      _makeRenderTarget(), // write buffer
    ];

    this.swirlMaterial = new SwirlMaterial();
    this.openMaterial = new OpenMaterial();

    // this.swirlMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;

    // material for rendering the depth

    this.copyMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blendSrc: DstColorFactor,
      blendDst: ZeroFactor,
      blendEquation: AddEquation,
      blendSrcAlpha: DstAlphaFactor,
      blendDstAlpha: ZeroFactor,
      blendEquationAlpha: AddEquation,
    });

    this.fsQuad = new FullScreenQuad(null);

    this.first = true;
    this.startTime = -1;
  }

  swapRenderTargets() {
    const [a, b] = this.ssaoRenderTargets;
    this.ssaoRenderTargets[0] = b;
    this.ssaoRenderTargets[1] = a;
  }

  dispose() {
    // dispose render targets

    this.beautyRenderTarget.dispose();
    // this.normalRenderTarget.dispose();
    this.ssaoRenderTargets[0].dispose();
    this.ssaoRenderTargets[1].dispose();
    // this.blurRenderTarget.dispose();

    // dispose materials

    // this.normalMaterial.dispose();
    this.swirlMaterial.dispose();
    this.copyMaterial.dispose();
    // this.depthRenderMaterial.dispose();

    // dipsose full screen quad

    this.fsQuad.dispose();
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    // render beauty

    // renderer.setRenderTarget( this.beautyRenderTarget );
    // renderer.clear();
    // renderer.render( this.scene, this.camera );

    const now = performance.now();
    if (this.first) {
      this.startTime = now;
    }
    const timeDiff = now - this.startTime;
    const timeDiffS = timeDiff / 1000;
    const uTime = timeDiffS;

    // render SSAO

    const openStartTime = 3;
    if (uTime < openStartTime) {
      this.swirlMaterial.uniforms.tDiffuse.value = this.first
        ? readBuffer.texture // screen
        : this.ssaoRenderTargets[0].texture; // feedback
      this.swirlMaterial.uniforms.tDiffuse.needsUpdate = true;

      this.swirlMaterial.uniforms.uTime.value = uTime;
      this.swirlMaterial.uniforms.uTime.needsUpdate = true;

      this.swirlMaterial.blending = NoBlending;
      this.renderPass(renderer, this.swirlMaterial, this.ssaoRenderTargets[1]);
    } else {
      this.openMaterial.uniforms.tDiffuse.value = readBuffer.texture; // screen
      this.openMaterial.uniforms.tDiffuse.needsUpdate = true;

      this.openMaterial.uniforms.uTime.value = uTime - openStartTime;
      this.openMaterial.uniforms.uTime.needsUpdate = true;

      this.openMaterial.blending = NoBlending;
      this.renderPass(renderer, this.openMaterial, this.ssaoRenderTargets[1]);
    }

    // render swirl
    this.copyMaterial.uniforms.tDiffuse.value = this.ssaoRenderTargets[1].texture;
    this.copyMaterial.uniforms.tDiffuse.needsUpdate = true;
    this.copyMaterial.blending = NoBlending;
    this.renderPass(renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer);

    this.swapRenderTargets();
    this.first = false;
  }

  renderPass(renderer, passMaterial, renderTarget, clearColor, clearAlpha) {
    // save original state
    renderer.getClearColor(this.originalClearColor);
    const originalClearAlpha = renderer.getClearAlpha();
    const originalAutoClear = renderer.autoClear;

    renderer.setRenderTarget(renderTarget);

    // setup pass state
    renderer.autoClear = false;
    if ((clearColor !== undefined) && (clearColor !== null)) {
      renderer.setClearColor(clearColor);
      renderer.setClearAlpha(clearAlpha || 0.0);
      renderer.clear();
    }

    this.fsQuad.material = passMaterial;
    this.fsQuad.render(renderer);

    // restore original state
    renderer.autoClear = originalAutoClear;
    renderer.setClearColor(this.originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
  }

  /* renderOverride( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

    renderer.getClearColor( this.originalClearColor );
    const originalClearAlpha = renderer.getClearAlpha();
    const originalAutoClear = renderer.autoClear;

    renderer.setRenderTarget( renderTarget );
    renderer.autoClear = false;

    clearColor = overrideMaterial.clearColor || clearColor;
    clearAlpha = overrideMaterial.clearAlpha || clearAlpha;

    if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

      renderer.setClearColor( clearColor );
      renderer.setClearAlpha( clearAlpha || 0.0 );
      renderer.clear();

    }

    const _recurse = o => {
      if (o.isMesh && o.customPostMaterial) {
        oldParentCache.set(o, o.parent);
        oldMaterialCache.set(o, o.material);

        o.material = o.customPostMaterial;
        this.customScene.add(o);
      }
      for (const child of o.children) {
        _recurse(child);
      }
    };
    _recurse(this.scene);
    renderer.render( this.customScene, this.camera );
    for (const child of this.customScene.children) {
      oldParentCache.get(child).add(child);
      child.material = oldMaterialCache.get(child);

      oldParentCache.delete(child);
      oldMaterialCache.delete(child);
    }

    this.scene.overrideMaterial = overrideMaterial;
    renderer.render( this.scene, this.camera );
    this.scene.overrideMaterial = null;

    // restore original state

    renderer.autoClear = originalAutoClear;
    renderer.setClearColor( this.originalClearColor );
    renderer.setClearAlpha( originalClearAlpha );

  } */

  setSize(width, height) {
    this.width = width;
    this.height = height;

    this.ssaoRenderTargets[0].setSize(width, height);
    this.ssaoRenderTargets[1].setSize(width, height);
  }
}

export { SwirlPass };

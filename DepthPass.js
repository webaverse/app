import {
  Color,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshNormalMaterial,
  NearestFilter,
  LinearFilter,
  NoBlending,
  RGBADepthPacking,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget,
  Scene,
  DepthTexture,
  UnsignedShortType,
  FloatType,
  RGBAFormat,
} from 'three';
import {Pass, FullScreenQuad} from 'three/examples/jsm/postprocessing/Pass.js';
// import { BokehShader } from './BokehShader.js';

const oldParentCache = new WeakMap();
const oldMaterialCache = new WeakMap();

/**
 * Depth-of-field post-process with bokeh shader
 */

const _makeNormalRenderTarget = (width, height) => {
  return new WebGLRenderTarget(width, height, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    depthTexture: new DepthTexture(width, height),
  });
};
class DepthPass extends Pass {
  constructor(scenes, camera, {width, height, onBeforeRenderScene}) {
    super();

    this.isDepthPass = true;

    this.scenes = scenes;
    this.camera = camera;
    this.width = width;
    this.height = height;
    this.onBeforeRenderScene = onBeforeRenderScene;

    /* this.beautyRenderTarget = new WebGLRenderTarget( this.width, this.height, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat
		} ); */

    // normal render target with depth buffer

    this.normalRenderTarget = _makeNormalRenderTarget(this.width, this.height);
    this.normalRenderTarget.name = 'DepthPass.normal';

    this.normalMaterial = new MeshNormalMaterial();
    this.normalMaterial.blending = NoBlending;

    this.customScene = new Scene();
    this.customScene.matrixWorldAutoUpdate = false;
    this._visibilityCache = new Map();
    this.originalClearColor = new Color();
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;

    this.normalRenderTarget.dispose();
    this.normalRenderTarget.depthTexture.dispose();

    this.normalRenderTarget.setSize(width, height);
    this.normalRenderTarget.depthTexture.image.width = width;
    this.normalRenderTarget.depthTexture.image.height = height;
  }

  renderOverride(
    renderer,
    overrideMaterial,
    renderTarget,
    clearColor,
    clearAlpha,
  ) {
    renderer.getClearColor(this.originalClearColor);
    const originalClearAlpha = renderer.getClearAlpha();
    const originalAutoClear = renderer.autoClear;

    renderer.setRenderTarget(renderTarget);
    renderer.autoClear = false;

    clearColor = overrideMaterial.clearColor || clearColor;
    clearAlpha = overrideMaterial.clearAlpha || clearAlpha;

    if (clearColor !== undefined && clearColor !== null) {
      renderer.setClearColor(clearColor);
      renderer.setClearAlpha(clearAlpha || 0.0);
      renderer.clear();
    }

    for (const scene of this.scenes) {
      const cachedNodes = [];
      const _recurse = o => {
        if (o.isMesh && o.customPostMaterial) {
          cachedNodes.push(o);
        } else {
          for (const child of o.children) {
            _recurse(child);
          }
        }
      };

      _recurse(scene);

      for (const o of cachedNodes) {
        oldParentCache.set(o, o.parent);
        oldMaterialCache.set(o, o.material);

        o.material = o.customPostMaterial;
        this.customScene.add(o);
      }
      {
        const pop = this.onBeforeRenderScene(scene);

        renderer.render(this.customScene, this.camera);

        pop();
      }

      {
        const pop = this.onBeforeRenderScene(scene);

        scene.overrideMaterial = overrideMaterial;
        renderer.render(scene, this.camera);
        scene.overrideMaterial = null;

        pop();
      }

      for (const child of cachedNodes) {
        oldParentCache.get(child).add(child);
        child.material = oldMaterialCache.get(child);

        oldParentCache.delete(child);
        oldMaterialCache.delete(child);
      }
    }

    // restore original state

    renderer.autoClear = originalAutoClear;
    renderer.setClearColor(this.originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
  }

  render(renderer, writeBuffer /*, readBuffer, deltaTime, maskActive */) {
    // render beauty

    // renderer.setRenderTarget( this.normalRenderTarget );
    // renderer.clear();
    // renderer.render( this.scene, this.camera );

    // render normals and depth (honor only meshes, points and lines do not contribute to SSAO)

    // this.overrideVisibility();
    this.renderOverride(
      renderer,
      this.normalMaterial,
      this.normalRenderTarget,
      0xffffff,
      1.0,
    );
    // this.restoreVisibility();
  }

  /* overrideVisibility() {

		const scene = this.scene;
		const cache = this._visibilityCache;
		const self = this;

		for (const scene of this.scenes) {
			scene.traverse( function ( object ) {

				cache.set( object, object.visible );

				if ( object.isPoints || object.isLine ) object.visible = false;

			} );
	  }

	}

	restoreVisibility() {

		const scene = this.scene;
		const cache = this._visibilityCache;

		for (const scene of this.scenes) {
			scene.traverse( function ( object ) {

				const visible = cache.get( object );
				object.visible = visible;

			} );
		}

		cache.clear();

	} */
}

export {DepthPass};

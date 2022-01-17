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
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
// import { BokehShader } from './BokehShader.js';

const oldParentCache = new WeakMap();
const oldMaterialCache = new WeakMap();

/**
 * Depth-of-field post-process with bokeh shader
 */

class DepthPass extends Pass {

	constructor( scene, camera, {width, height} ) {

		super();

    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    const depthTexture = new DepthTexture();
		// depthTexture.type = UnsignedShortType;

		/* this.beautyRenderTarget = new WebGLRenderTarget( this.width, this.height, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat
		} ); */

		// normal render target with depth buffer

		this.normalRenderTarget = new WebGLRenderTarget( this.width, this.height, {
			minFilter: NearestFilter,
			magFilter: NearestFilter,
			format: RGBAFormat,
			depthTexture: depthTexture
		} );

    this.normalMaterial = new MeshNormalMaterial();
		this.normalMaterial.blending = NoBlending;

    this.customScene = new Scene();
		this.customScene.autoUpdate = false;
    this._visibilityCache = new Map();
    this.originalClearColor = new Color();
	}

  renderOverride( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {
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
    _recurse(this.scene);
		for (const o of cachedNodes) {
			oldParentCache.set(o, o.parent);
			oldMaterialCache.set(o, o.material);

			o.material = o.customPostMaterial;
			this.customScene.add(o);
		}
    renderer.render( this.customScene, this.camera );

    this.scene.overrideMaterial = overrideMaterial;
    renderer.render( this.scene, this.camera );
    this.scene.overrideMaterial = null;

		for (const child of cachedNodes) {
      oldParentCache.get(child).add(child);
      child.material = oldMaterialCache.get(child);

      oldParentCache.delete(child);
      oldMaterialCache.delete(child);
    }

    // restore original state

    renderer.autoClear = originalAutoClear;
    renderer.setClearColor( this.originalClearColor );
    renderer.setClearAlpha( originalClearAlpha );
  }

	render( renderer, writeBuffer /*, readBuffer, deltaTime, maskActive */ ) {
		// render beauty

		// renderer.setRenderTarget( this.normalRenderTarget );
		// renderer.clear();
		// renderer.render( this.scene, this.camera );

		// render normals and depth (honor only meshes, points and lines do not contribute to SSAO)

		this.overrideVisibility();
		this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );
		this.restoreVisibility();
  }

  overrideVisibility() {

		const scene = this.scene;
		const cache = this._visibilityCache;

		scene.traverse( function ( object ) {

			cache.set( object, object.visible );

			if ( object.isPoints || object.isLine || object.isLowPriority ) object.visible = false;

		} );

	}

	restoreVisibility() {

		const scene = this.scene;
		const cache = this._visibilityCache;

		scene.traverse( function ( object ) {

			const visible = cache.get( object );
			object.visible = visible;

		} );

		cache.clear();

	}

}

export { DepthPass };

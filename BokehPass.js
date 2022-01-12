import {
	Color,
	MeshBasicMaterial,
	MeshDepthMaterial,
	NearestFilter,
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
import { BokehShader } from './BokehShader.js';

const _nop = () => {};

/**
 * Depth-of-field post-process with bokeh shader
 */

class BokehPass extends Pass {

	constructor( scene, camera, params ) {

		super();

		this.scene = scene;
		this.customScene = new Scene();
		this.camera = camera;

		const focus = ( params.focus !== undefined ) ? params.focus : 1.0;
		const aspect = ( params.aspect !== undefined ) ? params.aspect : camera.aspect;
		const aperture = ( params.aperture !== undefined ) ? params.aperture : 0.025;
		const maxblur = ( params.maxblur !== undefined ) ? params.maxblur : 1.0;

		// render targets

		const width = params.width || window.innerWidth || 1;
		const height = params.height || window.innerHeight || 1;

		const depthTexture = new DepthTexture();
		// depthTexture.type = UnsignedShortType;
		depthTexture.minFilter = NearestFilter;
		depthTexture.magFilter = NearestFilter;
		this.normalRenderTarget = new WebGLRenderTarget( width, height, {
			minFilter: NearestFilter,
			magFilter: NearestFilter,
			// type: FloatType,
			// format: RGBAFormat,
			depthTexture: depthTexture
		} );
		this.normalRenderTarget.texture.name = 'BokehPass.depth';

		// depth material

		this.materialDepth = new MeshBasicMaterial();
		this.materialDepth.depthPacking = RGBADepthPacking;
		this.materialDepth.blending = NoBlending;

		// bokeh material

		if ( BokehShader === undefined ) {

			console.error( 'THREE.BokehPass relies on BokehShader' );

		}

		const bokehShader = BokehShader;
		const bokehUniforms = UniformsUtils.clone( bokehShader.uniforms );

		bokehUniforms[ 'tDepth' ].value = this.normalRenderTarget.depthTexture;

		bokehUniforms[ 'focus' ].value = focus;
		bokehUniforms[ 'aspect' ].value = aspect;
		bokehUniforms[ 'aperture' ].value = aperture;
		bokehUniforms[ 'maxblur' ].value = maxblur;
		bokehUniforms[ 'nearClip' ].value = camera.near;
		bokehUniforms[ 'farClip' ].value = camera.far;

		this.materialBokeh = new ShaderMaterial( {
			defines: Object.assign( {}, bokehShader.defines ),
			uniforms: bokehUniforms,
			vertexShader: bokehShader.vertexShader,
			fragmentShader: bokehShader.fragmentShader
		} );

		this.uniforms = bokehUniforms;
		this.needsSwap = false;

		this.fsQuad = new FullScreenQuad( this.materialBokeh );

		this._oldClearColor = new Color();

	}

	render( renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/ ) {
		// Render depth into texture

		this.scene.overrideMaterial = this.materialDepth;

		renderer.getClearColor( this._oldClearColor );
		const oldClearAlpha = renderer.getClearAlpha();
		const oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor( 0xffffff );
		renderer.setClearAlpha( 1.0 );
		renderer.setRenderTarget( this.normalRenderTarget );
		renderer.clear();

		const _recurse = o => {
			if (o.isMesh && o.customDepthMaterial) {
        o.originalParent = o.parent;
				o.originalMaterial = o.material;
				o.material = o.customDepthMaterial;
        o.originalUpdateMatrix = o.updateMatrix;
        o.originalUpdateMatrixWorld = o.updateMatrixWorld;
				o.updateMatrix = _nop;
				o.updateMatrixWorld = _nop;
				this.customScene.add(o);
			}
      for (const child of o.children) {
				_recurse(child);
			}
		};
		_recurse(this.scene);
		renderer.render( this.customScene, this.camera );
		for (const child of this.customScene.children) {
			child.originalParent.add(child);
			child.material = child.originalMaterial;
			child.updateMatrix = child.originalUpdateMatrix;
			child.updateMatrixWorld = child.originalUpdateMatrixWorld;
		}

		renderer.render( this.scene, this.camera );

		// Render bokeh composite

		this.uniforms[ 'tColor' ].value = readBuffer.texture;
		this.uniforms[ 'nearClip' ].value = this.camera.near;
		this.uniforms[ 'farClip' ].value = this.camera.far;

		if ( this.renderToScreen ) {

			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );

		} else {

			renderer.setRenderTarget( writeBuffer );
			renderer.clear();
			this.fsQuad.render( renderer );

		}

		this.scene.overrideMaterial = null;
		renderer.setClearColor( this._oldClearColor );
		renderer.setClearAlpha( oldClearAlpha );
		renderer.autoClear = oldAutoClear;

	}

}

export { BokehPass };

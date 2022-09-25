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

const oldParentCache = new WeakMap();
const oldMaterialCache = new WeakMap();

/**
 * Depth-of-field post-process with bokeh shader
 */

class BokehPass extends Pass {

	constructor( scene, camera, params, depthPass ) {

		super();

		this.scene = scene;
		// this.customScene = new Scene();
		// this.customScene.matrixWorldAutoUpdate = false;
		this.camera = camera;
		this.depthPass = depthPass;

		const focus = ( params.focus !== undefined ) ? params.focus : 1.0;
		const aspect = ( params.aspect !== undefined ) ? params.aspect : camera.aspect;
		const aperture = ( params.aperture !== undefined ) ? params.aperture : 0.025;
		const maxblur = ( params.maxblur !== undefined ) ? params.maxblur : 1.0;

		// render targets

		// const width = params.width || window.innerWidth || 1;
		// const height = params.height || window.innerHeight || 1;

		// depth material

		/* this.materialDepth = new MeshBasicMaterial();
		this.materialDepth.depthPacking = RGBADepthPacking;
		this.materialDepth.blending = NoBlending; */

		// bokeh material

		if ( BokehShader === undefined ) {

			console.error( 'THREE.BokehPass relies on BokehShader' );

		}

		const bokehShader = BokehShader;
		const bokehUniforms = UniformsUtils.clone( bokehShader.uniforms );

		bokehUniforms[ 'tDepth' ].value = this.depthPass.normalRenderTarget.depthTexture;

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
		renderer.getClearColor( this._oldClearColor );
		const oldClearAlpha = renderer.getClearAlpha();
		const oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor( 0xffffff );
		renderer.setClearAlpha( 1.0 );

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

		// this.scene.overrideMaterial = null;
		renderer.setClearColor( this._oldClearColor );
		renderer.setClearAlpha( oldClearAlpha );
		renderer.autoClear = oldAutoClear;

	}

}

export { BokehPass };

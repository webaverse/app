import {
	AddEquation,
	Color,
	CustomBlending,
	DataTexture,
	DepthTexture,
	DstAlphaFactor,
	DstColorFactor,
	FloatType,
	LinearFilter,
	MathUtils,
	MeshNormalMaterial,
	NearestFilter,
	NoBlending,
	RGBAFormat,
	sRGBEncoding,
	RepeatWrapping,
	ShaderMaterial,
	UniformsUtils,
	UnsignedShortType,
	Vector3,
	WebGLRenderTarget,
	ZeroFactor,
	Scene,
} from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { SSAOShader, SSAOBlurShader, SSAODepthShader } from './SSAOShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

// const oldParentCache = new WeakMap();
// const oldMaterialCache = new WeakMap();

class SSAOPass extends Pass {

	constructor( scene, camera, width, height, depthPass ) {

		super();

		this.isSSAOPass = true;

		this.width = ( width !== undefined ) ? width : 512;
		this.height = ( height !== undefined ) ? height : 512;
		this.depthPass = depthPass;

		this.clear = true;

		this.camera = camera;
		this.scene = scene;
		this.customScene = new Scene();
		this.customScene.matrixWorldAutoUpdate = false;

		this.kernelRadius = 8;
		this.kernelSize = 32;
		this.kernel = [];
		this.noiseTexture = null;
		this.output = 0;

		// debug hack
		window.addEventListener('keydown', e => {
			if (e.which === 36) { // numpad 7
				const keys = Object.keys(SSAOPass.OUTPUT);
				this.output = (this.output + 1) % keys.length;
				console.log(keys[this.output]);
			}
		});


		this.minDistance = 0.005;
		this.maxDistance = 0.1;

		this._visibilityCache = new Map();

		//

		this.generateSampleKernel();
		this.generateRandomKernelRotations();

		// beauty render target

		// const depthTexture = new DepthTexture();
		// depthTexture.type = UnsignedShortType;

		this.beautyRenderTarget = new WebGLRenderTarget(this.width, this.height, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			// format: RGBAFormat,
			encoding: sRGBEncoding,
		});
		this.beautyRenderTarget.name = 'SSAO.beauty';

		// normal render target with depth buffer

		/* this.normalRenderTarget = new WebGLRenderTarget( this.width, this.height, {
			minFilter: NearestFilter,
			magFilter: NearestFilter,
			format: RGBAFormat,
			depthTexture: depthTexture
		} ); */

		// ssao render target

		this.ssaoRenderTarget = new WebGLRenderTarget(
			this.width,
			this.height,
			{
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				// format: RGBAFormat,
			}
		);
		this.ssaoRenderTarget.name = 'SSAO.ssao';

		this.blurRenderTarget = this.ssaoRenderTarget.clone();
		this.blurRenderTarget.name = 'SSAO.blur';

		// ssao material

		if ( SSAOShader === undefined ) {

			console.error( 'THREE.SSAOPass: The pass relies on SSAOShader.' );

		}

		this.ssaoMaterial = new ShaderMaterial( {
			defines: Object.assign( {}, SSAOShader.defines ),
			uniforms: UniformsUtils.clone( SSAOShader.uniforms ),
			vertexShader: SSAOShader.vertexShader,
			fragmentShader: SSAOShader.fragmentShader,
			blending: NoBlending,
		} );

		this.ssaoMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
		this.ssaoMaterial.uniforms[ 'tNormal' ].value = this.depthPass.normalRenderTarget.texture;
		this.ssaoMaterial.uniforms[ 'tDepth' ].value = this.depthPass.normalRenderTarget.depthTexture;
		this.ssaoMaterial.uniforms[ 'tNoise' ].value = this.noiseTexture;
		this.ssaoMaterial.uniforms[ 'kernel' ].value = this.kernel;
		this.ssaoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
		this.ssaoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
		this.ssaoMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );
		this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
		this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );

		// normal material

		this.normalMaterial = new MeshNormalMaterial();
		this.normalMaterial.blending = NoBlending;

		// blur material

		this.blurMaterial = new ShaderMaterial( {
			defines: Object.assign( {}, SSAOBlurShader.defines ),
			uniforms: UniformsUtils.clone( SSAOBlurShader.uniforms ),
			vertexShader: SSAOBlurShader.vertexShader,
			fragmentShader: SSAOBlurShader.fragmentShader
		} );
		this.blurMaterial.uniforms[ 'tDiffuse' ].value = this.ssaoRenderTarget.texture;
		this.blurMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );

		// material for rendering the depth

		this.depthRenderMaterial = new ShaderMaterial( {
			defines: Object.assign( {}, SSAODepthShader.defines ),
			uniforms: UniformsUtils.clone( SSAODepthShader.uniforms ),
			vertexShader: SSAODepthShader.vertexShader,
			fragmentShader: SSAODepthShader.fragmentShader,
			blending: NoBlending
		} );
		this.depthRenderMaterial.uniforms[ 'tDepth' ].value = this.depthPass.normalRenderTarget.depthTexture;
		this.depthRenderMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
		this.depthRenderMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;

		// material for rendering the content of a render target

		this.copyMaterial = new ShaderMaterial( {
			uniforms: UniformsUtils.clone( CopyShader.uniforms ),
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
		} );

		this.fsQuad = new FullScreenQuad( null );

		this.originalClearColor = new Color();

	}

	dispose() {

		// dispose render targets

		this.beautyRenderTarget.dispose();
		// this.normalRenderTarget.dispose();
		this.ssaoRenderTarget.dispose();
		this.blurRenderTarget.dispose();

		// dispose materials

		this.normalMaterial.dispose();
		this.blurMaterial.dispose();
		this.copyMaterial.dispose();
		this.depthRenderMaterial.dispose();

		// dipsose full screen quad

		this.fsQuad.dispose();

	}

	render( renderer, writeBuffer /*, readBuffer, deltaTime, maskActive */ ) {

		// render beauty

		renderer.setRenderTarget( this.beautyRenderTarget );
		renderer.clear();
		renderer.render( this.scene, this.camera );

		// render normals and depth (honor only meshes, points and lines do not contribute to SSAO)

		/* this.overrideVisibility();
		this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );
		this.restoreVisibility(); */

		// render SSAO

		this.ssaoMaterial.uniforms[ 'kernelRadius' ].value = this.kernelRadius;
		this.ssaoMaterial.uniforms[ 'minDistance' ].value = this.minDistance;
		this.ssaoMaterial.uniforms[ 'maxDistance' ].value = this.maxDistance;
		this.renderPass( renderer, this.ssaoMaterial, this.ssaoRenderTarget );

		// render blur

		this.renderPass( renderer, this.blurMaterial, this.blurRenderTarget );

		// output result to screen

		switch ( this.output ) {

			case SSAOPass.OUTPUT.SSAO:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.ssaoRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			case SSAOPass.OUTPUT.Blur:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.blurRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			case SSAOPass.OUTPUT.Beauty:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			case SSAOPass.OUTPUT.Depth:

				this.renderPass( renderer, this.depthRenderMaterial, this.renderToScreen ? null : writeBuffer );
				// this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.depthPass.normalRenderTarget.depthTexture;
				// this.copyMaterial.blending = NoBlending;
				// this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			case SSAOPass.OUTPUT.Normal:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.depthPass.normalRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			case SSAOPass.OUTPUT.Default:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.blurRenderTarget.texture;
				this.copyMaterial.blending = CustomBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			default:
				console.warn( 'THREE.SSAOPass: Unknown output type.' );

		}

	}

	renderPass( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

		// save original state
		renderer.getClearColor( this.originalClearColor );
		const originalClearAlpha = renderer.getClearAlpha();
		const originalAutoClear = renderer.autoClear;

		renderer.setRenderTarget( renderTarget );

		// setup pass state
		renderer.autoClear = false;
		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();

		}

		this.fsQuad.material = passMaterial;
		this.fsQuad.render( renderer );

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );

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

	setSize( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );
		this.ssaoRenderTarget.setSize( width, height );
		// this.normalRenderTarget.setSize( width, height );
		this.blurRenderTarget.setSize( width, height );

		this.ssaoMaterial.uniforms[ 'resolution' ].value.set( width, height );
		this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
		this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );

		this.blurMaterial.uniforms[ 'resolution' ].value.set( width, height );

	}

	generateSampleKernel() {

		const kernelSize = this.kernelSize;
		const kernel = this.kernel;

		for ( let i = 0; i < kernelSize; i ++ ) {

			const sample = new Vector3();
			sample.x = ( Math.random() * 2 ) - 1;
			sample.y = ( Math.random() * 2 ) - 1;
			sample.z = Math.random();

			sample.normalize();

			let scale = i / kernelSize;
			scale = MathUtils.lerp( 0.1, 1, scale * scale );
			sample.multiplyScalar( scale );

			kernel.push( sample );

		}

	}

	generateRandomKernelRotations() {

		const width = 4, height = 4;

		if ( SimplexNoise === undefined ) {

			console.error( 'THREE.SSAOPass: The pass relies on SimplexNoise.' );

		}

		const simplex = new SimplexNoise();

		const size = width * height;
		const data = new Float32Array( size * 4 );

		for ( let i = 0; i < size; i ++ ) {

			const stride = i * 4;

			const x = ( Math.random() * 2 ) - 1;
			const y = ( Math.random() * 2 ) - 1;
			const z = 0;

			const noise = simplex.noise3d( x, y, z );

			data[ stride ] = noise;
			data[ stride + 1 ] = noise;
			data[ stride + 2 ] = noise;
			data[ stride + 3 ] = 1;

		}

		this.noiseTexture = new DataTexture( data, width, height, RGBAFormat, FloatType );
		this.noiseTexture.wrapS = RepeatWrapping;
		this.noiseTexture.wrapT = RepeatWrapping;
		this.noiseTexture.needsUpdate = true;

	}

	/* overrideVisibility() {

		const scene = this.scene;
		const cache = this._visibilityCache;
		const self = this;

		scene.traverse( function ( object ) {

			cache.set( object, object.visible );

			if ( object.isPoints || object.isLine ) object.visible = false;

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

	} */

}

SSAOPass.OUTPUT = {
	'Default': 0,
	'SSAO': 1,
	'Blur': 2,
	'Beauty': 3,
	'Depth': 4,
	'Normal': 5
};

export { SSAOPass };

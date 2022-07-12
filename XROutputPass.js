import {
	WebGLRenderTarget,
	Scene
} from 'three';
import {
    scene,
    sceneHighPriority,
    sceneLowPriority,
    rootScene,
    camera,
  } from './renderer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

class XROutputPass extends Pass {

	constructor() {

		super();
	}

  swapBuffers(readBuffer, writeBuffer) {
    const tmp = readBuffer;
		readBuffer = writeBuffer;
		writeBuffer = tmp;
  }

	render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {

        const session = renderer.xr.getSession();


        if(session) {
            const xrLayer = session.renderState.baseLayer;
            const xrFramebuffer = xrLayer.framebuffer;

            const context = renderer.getContext();

            //const texture = renderTarget.texture;
            const renderTargetProperties = renderer.properties.get(renderTarget);
            // const textureProperties = renderer.properties.get(texture);

            //console.log(texture, renderTargetProperties, textureProperties);

            //const fbo = context.createFramebuffer();
            //const fbo2 = renderer.properties.get( renderTarget ).__webglFramebuffer;

            context.bindFramebuffer(context.READ_FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer);
					  context.bindFramebuffer(context.DRAW_FRAMEBUFFER, renderTargetProperties.__webglFramebuffer);

            //context.bindFramebuffer(context.FRAMEBUFFER, fbo);  

            //this.swapBuffers(fbo2, fbo);
            // context.framebufferTexture2D(
            //     context.FRAMEBUFFER,
            //     context.COLOR_ATTACHMENT0,
            //     context.TEXTURE_2D,
            //     renderer.properties.get(texture),
            //     0);

            //context.bindFramebuffer(context.READ_FRAMEBUFFER, fbo2);
            //context.bindFramebuffer(context.DRAW_FRAMEBUFFER, fbo);
            
            context.blitFramebuffer(0, 0, renderTarget.height, renderTarget.width,
               0, 0, renderTarget.height, renderTarget.width,
               context.COLOR_BUFFER_BIT, context.NEAREST);

            this.swapBuffers(context.DRAW_FRAMEBUFFER, xrFramebuffer);

            context.bindFramebuffer(context.DRAW_FRAMEBUFFER, null); // to canvas

            

            // context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);

            //console.log(readBuffer, renderTarget);
            //const oldReadFbo = context.getParameter(context.FRAMEBUFFER_BINDING);
            //const oldDrawFbo = context.getParameter(context.FRAMEBUFFER_BINDING);

            //context.bindFramebuffer(oldReadFbo, renderTarget.__webglFramebuffer);
            //console.log(oldReadFbo);
            // const framebuffer = renderTarget.__webglFramebuffer;
            // context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
            //  const data = new Uint8Array(renderTarget.width * renderTarget.height * 4);
            //  context.readPixels(0,0, renderTarget.width, renderTarget.height, context.RGBA, context.UNSIGNED_BYTE, data);
            //  console.log(data);
            // context.bindFramebuffer(context.READ_FRAMEBUFFER, framebuffer);
            // context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);
            
            // //console.log(context.READ_FRAMEBUFFER, renderTarget.__webglFramebuffer);


            // context.blitFramebuffer(0, 0, renderTarget.height, renderTarget.width,
            //     0, 0, renderTarget.height, renderTarget.width,
            //     context.COLOR_BUFFER_BIT, context.NEAREST);



            //context.bindFramebuffer(context.READ_FRAMEBUFFER, oldReadFbo);
            
            

            //context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);
            //context.clear(context.COLOR_BUFFER_BIT);
            //context.bindFramebuffer(context.DRAW_FRAMEBUFFER, oldDrawFbo);
            renderer.render(rootScene, camera);
        }


		
  }

}

export { XROutputPass };

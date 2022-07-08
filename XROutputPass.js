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


	render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {

        const session = renderer.xr.getSession();


        if(session) {
            const xrLayer = session.renderState.baseLayer;
            const xrFramebuffer = xrLayer.framebuffer;
            //console.log(xrLayer);

            

            

            const context = renderer.getContext();

            console.log(context);

            let framebuffer = renderer.properties.get( renderTarget ).__webglFramebuffer;

            

            context.bindFramebuffer(context.READ_FRAMEBUFFER, framebuffer);
            

            context.blitFramebuffer(0, 0, renderTarget.height, renderTarget.width,
                0, 0, renderTarget.height, renderTarget.width,
                context.COLOR_BUFFER_BIT, context.NEAREST);

            context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);

            //console.log(readBuffer, renderTarget);
            //const oldReadFbo = context.getParameter(context.FRAMEBUFFER_BINDING);
            //const oldDrawFbo = context.getParameter(context.FRAMEBUFFER_BINDING);

            //context.bindFramebuffer(oldReadFbo, renderTarget.__webglFramebuffer);
            //console.log(oldReadFbo);
            // const framebuffer = renderTarget.__webglFramebuffer;
            // context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
            // const data = new Uint8Array(renderTarget.width * renderTarget.height * 4);
            // context.readPixels(0,0,renderTarget.width,renderTarget.height,context.RGBA,context.UNSIGNED_BYTE,data);
            // context.bindFramebuffer(context.READ_FRAMEBUFFER, framebuffer);
            // context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);
            
            // //console.log(context.READ_FRAMEBUFFER, renderTarget.__webglFramebuffer);


            // context.blitFramebuffer(0, 0, renderTarget.height, renderTarget.width,
            //     0, 0, renderTarget.height, renderTarget.width,
            //     context.COLOR_BUFFER_BIT, context.NEAREST);



            //context.bindFramebuffer(context.READ_FRAMEBUFFER, oldReadFbo);
            
            

            context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);

            //renderer.setRenderTarget(renderTarget);
            //context.clear(context.COLOR_BUFFER_BIT);
            //context.bindFramebuffer(context.DRAW_FRAMEBUFFER, oldDrawFbo);
            renderer.render(rootScene, camera);
        }


		
  }

}

export { XROutputPass };

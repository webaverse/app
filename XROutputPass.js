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
            //  console.log(xrLayer);

            // const context = renderer.getContext();
            // const oldReadFbo = context.getParameter(context.FRAMEBUFFER_BINDING);
            // const oldDrawFbo = context.getParameter(context.FRAMEBUFFER_BINDING);

            // context.bindFramebuffer(context.READ_FRAMEBUFFER, renderTarget.__webglFramebuffer);

            // context.blitFramebuffer(0, 0, renderTarget.height, renderTarget.width,
            //     0, 0, renderTarget.height, renderTarget.width,
            //     context.COLOR_BUFFER_BIT, context.NEAREST);

            //     context.bindFramebuffer(context.READ_FRAMEBUFFER, oldReadFbo);

























            
            // context.bindFramebuffer(context.DRAW_FRAMEBUFFER, xrFramebuffer);

            // context.bindFramebuffer(context.DRAW_FRAMEBUFFER, oldDrawFbo);

            //renderer.setRenderTarget(renderTarget);
            renderer.clear();
            renderer.render(rootScene, camera);
        }


		
  }

}

export { XROutputPass };

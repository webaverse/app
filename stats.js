/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 */


export var Stats = function () {

	var msMin	= 100;
	var msMax	= 0;
	var frames  = 0;
	var beginTime = Date.now();
	var lastTime = beginTime;

	var container	= document.createElement( 'div' );
	container.style.cssText = 'width:120px;opacity:0.9;cursor:pointer';
	container.id = 'statsBox';

	var msDiv	= document.createElement( 'div' );
	msDiv.style.cssText = 'padding:0 3px 3px 3px;text-align:left;background-color:rgba(0,0,0,0.3);;';
	container.appendChild( msDiv );

	var msText	= document.createElement( 'div' );
	msText.style.cssText = 'color:white;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:15px';
	msText.innerHTML= 'Renderer Stats';
	msDiv.appendChild( msText );
	
	var msTexts	= [];
	var nLines	= 5;
	for(var i = 0; i < nLines; i++){
		msTexts[i]	= document.createElement( 'div' );
		msTexts[i].style.cssText = 'color:white;background-color:rgba(0,0,0,0.3);;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:15px';
		msDiv.appendChild( msTexts[i] );		
		msTexts[i].innerHTML= '-';
	}


	var lastTime	= Date.now();
	return {
		domElement: container,

		update: function(webGLRenderer){
			frames++;
		
	        if (Date.now() > lastTime + 1000) {


				var i	= 0;
				msTexts[i++].textContent = "FPS: "	+ Math.round((frames * 1000) / (Date.now() - lastTime));
				msTexts[i++].textContent = "== Memory =====";
				msTexts[i++].textContent = "Programs: "	+ webGLRenderer.info.programs.length;
				msTexts[i++].textContent = "Geometries: "+webGLRenderer.info.memory.geometries;
				msTexts[i++].textContent = "Textures: "	+ webGLRenderer.info.memory.textures;

				// msTexts[i++].textContent = "== Render ======";
				// msTexts[i++].textContent = "Calls: "	+ webGLRenderer.info.render.calls;
				// msTexts[i++].textContent = "Triangles: "	+ webGLRenderer.info.render.triangles;
				frames = 0;
				lastTime	= Date.now();
			}
		}
	}	
};
export default `
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying float vLife;
varying vec4 vFrame;
varying vec4 vColour;

uniform sampler2D tDepth;
uniform vec2 ScreenSize;
uniform float uSoft;

uniform float cameraNear;
uniform float cameraFar;

#ifdef USE_DEPTH
	float getDepth( const in vec2 screenPosition ) {
		return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
	}

	float getViewZ( const in float depth ) {
		return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
	}
#endif

void main() {
  if (vLife > 1.0 || vLife <= 0.0)
    discard; 

	#ifdef USE_DEPTH
		vec2 screenUV = gl_FragCoord.xy / ScreenSize;
		float fragmentLinearEyeDepth = getViewZ( gl_FragCoord.z );
		float linearEyeDepth = getViewZ( getDepth( screenUV ) );

		float diff = saturate( fragmentLinearEyeDepth - linearEyeDepth );
		if (diff < 0.)
			discard;
	#endif

	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	gl_FragColor = vec4( outgoingLight, diffuseColor.a ) * vColour;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

	#ifdef USE_DEPTH
		if (uSoft > 0.0) {
			float a = (fragmentLinearEyeDepth - linearEyeDepth);
			if (a > 0.0) {
				float b = saturate(a/uSoft);
				gl_FragColor.a *= b;
				// gl_FragColor = vec4(vec3(a), 1.0);
			}
		}
	#endif
}
`
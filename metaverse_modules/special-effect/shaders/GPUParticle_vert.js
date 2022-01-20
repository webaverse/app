export default `
uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

////////////////
// ATTRIBUTES //
////////////////
attribute vec2 lifetime; // start, life
attribute vec4 colour; // global tint, alpha

attribute vec3 translate; // world position
#ifdef USE_AXIS
  attribute vec3 up; // direction up
#endif
attribute vec4 size; // size, growth, expand, drag

// MOTION
attribute vec4 velocity; // velocity, drag
attribute vec4 acceleration; // acceleration gravity
attribute vec4 angularVelocity; // angle spin torque 

#ifdef USE_ORBIT
  attribute vec4 orbit; // x y z distance, cycles (packed)
#endif

//////////////
// UNIFORMS //
//////////////
uniform float ShaderClock;

#ifdef USE_FRAMES
  uniform float uCells;
  uniform float uFrames;
  uniform float uCycles;
  uniform float uOffset;
#endif

uniform vec4 uColorLife[16];
uniform vec2 uAlphaLife[16];
uniform vec2 uSizeLife[16];

#ifdef ANIMATE_VELOCITY
  uniform vec4 uVelocityLife[16];
#endif
#ifdef ANIMATE_ACCELERATION
  uniform vec4 uAccelerationLife[16];
#endif

#ifdef ANIMATE_SPIN
  uniform vec2 uSpinLife[16];
#endif

//////////////
// VARYINGS //
//////////////
varying vec4 vColour;
varying float vLife;

// #ifdef USE_FRAMES
varying vec4 vFrame; // Offset, YOffset, Increment Size (Square), frame
// #endif

#ifdef IS_MESH 
  varying vec2 vAngle;
#endif

////////////////////////////////

int keyVector(const vec4 keys[16], const float life) {
  return int(
    ceil(life-keys[1].w)
    +ceil(life-keys[2].w)
    +ceil(life-keys[3].w)
    +ceil(life-keys[4].w)
    +ceil(life-keys[5].w)
    +ceil(life-keys[6].w)
    +ceil(life-keys[7].w)
    +ceil(life-keys[8].w)
    +ceil(life-keys[9].w)
    +ceil(life-keys[10].w)
    +ceil(life-keys[11].w)
    +ceil(life-keys[12].w)
    +ceil(life-keys[13].w)
    +ceil(life-keys[14].w)
  );
}

int keyFloat(const vec2 keys[16], const float life) {
  // return 0;
  return int(
    ceil(life-keys[1].y)
    +ceil(life-keys[2].y)
    +ceil(life-keys[3].y)
    +ceil(life-keys[4].y)
    +ceil(life-keys[5].y)
    +ceil(life-keys[6].y)
    +ceil(life-keys[7].y)
    +ceil(life-keys[8].y)
    +ceil(life-keys[9].y)
    +ceil(life-keys[10].y)
    +ceil(life-keys[11].y)
    +ceil(life-keys[12].y)
    +ceil(life-keys[13].y)
    +ceil(life-keys[14].y)
  );
}

vec3 animateVector(const vec4 keys[16], const float life, const vec3 start) {
  int key = keyVector(keys, life);
  vec4 current = keys[key];
  vec4 next = keys[key+1];

  return start + mix(current.xyz, next.xyz, (life - current[3]) / (next[3] - current[3]));
}

float animateFloat(const vec2 keys[16], const float life, const float start) {
  int key = keyFloat(keys, life);
  vec2 current = keys[key];
  vec2 next = keys[key+1];

  return start + mix(current.x, next.x, (life - current[1]) / (next[1] - current[1]));
}

vec3 sumVector(const vec4 keys[16], const float life, const vec3 start) {
  int key = keyVector(keys, life);
  vec4 current = keys[key];
  vec4 next = keys[key+1];

  vec3 sum = start;
  for(int i=0;i<14;++i)
    sum += clamp(float(key-i), 0.0, 1.0) * keys[i].xyz * (keys[i+1].w - keys[i].w); // hopefully discards lookup because its a zero

  float stepLife = life - current[3];
  return sum + current.xyz * stepLife;
}

float sumFloat(const vec2 keys[16], const float life, const float start) {
  int key = keyFloat(keys, life);
  vec2 current = keys[key];
  vec2 next = keys[key+1];

  float sum = start;
  for(int i=0;i<14;++i)
    sum += clamp(float(key-i), 0.0, 1.0) * keys[i].x * (keys[i+1].y - keys[i].y); // hopefully discards lookup because its a zero

  return sum + current.x * (life - current.y);
}

vec4 quat_from_axis_angle(vec3 axis, float angle)
{ 
  vec4 qr;
  float half_angle = angle * 0.5;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle)
{ 
  vec4 q = quat_from_axis_angle(axis, angle);
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  //////////
  // LIFE //
  //////////
  float timeDiff = max(ShaderClock - lifetime.x, 0.0);
  #ifdef USE_LOOP
    float time = mod(timeDiff, lifetime.y);
  #else
    float time = timeDiff;
  #endif

  vLife = time / lifetime.y;  

  ////////////
  // COLORS //
  ////////////
  vec3 col = vec3(1.0);
  #ifdef ANIMATE_COLOR
    col = animateVector(uColorLife, vLife, vec3(0.0));
  #endif

  float alpha = 1.0;
  #ifdef ANIMATE_ALPHA
    alpha = animateFloat(uAlphaLife, vLife, 0.0);
  #endif
	vColour = vec4(col, alpha) * colour;

  ////////////
  // FORCES //
  ////////////
  vec3 acc = acceleration.xyz;
  #ifdef ANIMATE_ACCELERATION
    acc += animateVector(uAccelerationLife, vLife, vec3(0.0)); 
  #endif

  vec3 force = acc * time + velocity.xyz;
  #ifdef ANIMATE_VELOCITY
    force += sumVector(uVelocityLife, vLife, vec3(0.0));
  #endif

  if (velocity.w > 0.0)
    force *= (1.0 - exp(-velocity.w * time)) / velocity.w; // drag
  else
    force *= time;
    
  #ifdef USE_AXIS
    vec3 forward = vec3(0.0,0.0,1.0);
    vec3 right = cross(up.xyz, forward);
  #endif

  vec3 displacement = vec3(0.0);
  #ifdef USE_ORBIT
    vec3 orb = vec3(cos(vLife*PI2 * orbit.w) * orbit.x, sin(vLife*PI2 * orbit.w) * orbit.y, sin(vLife*PI2 * orbit.w) * orbit.z);
  #endif

  #ifdef USE_AXIS
    displacement += force.x * right + force.y * up + force.z * forward;
    #ifdef USE_ORBIT
      displacement += orb.x * right + orb.y * up + orb.z * forward;
    #endif
  #else
    displacement += force;
    #ifdef USE_ORBIT
      displacement += orb;
    #endif
  #endif

  //////////
  // SIZE //
  //////////
  float expand = size.y + size.z * time;
  float finalSize = size.x + expand * time;
  #ifdef ANIMATE_SIZE
    finalSize += animateFloat(uSizeLife, vLife, 0.0);
  #endif

  //////////////////
  // ORIENTATIONS //
  //////////////////  
  float tor = angularVelocity.z * time;
  float spn = tor * time + angularVelocity.y;

  if (angularVelocity.w > 0.0) 
    spn *= (1.0 - exp(-angularVelocity.w * time)) / angularVelocity.w;
  else 
    spn *= time;
  float rot = angularVelocity.x + spn;

  #ifdef ANIMATE_SPIN
    rot += animateFloat(uSpinLife, vLife, 0.0);
  #endif

  #ifdef USE_GRAVITY
    displacement -= vec3(0.0,acceleration.w * time * time,0.0);
  #endif

  #ifdef IS_SPRITE
    vec4 mvPosition = modelViewMatrix * vec4(translate + displacement, 1.0); //world-coords
    vec2 scale;
    scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
    scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
    scale *= max(finalSize,0.0);

    vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
    vec2 rotatedPosition;

    #ifndef USE_SIZEATTENUATION
      bool isPerspective = isPerspectiveMatrix( projectionMatrix );
      if ( isPerspective ) scale *= - mvPosition.z;
    #endif

    rotatedPosition.x = cos( rot ) * alignedPosition.x - sin( rot ) * alignedPosition.y;
    rotatedPosition.y = sin( rot ) * alignedPosition.x + cos( rot ) * alignedPosition.y;
    mvPosition.xy += rotatedPosition;
    gl_Position = projectionMatrix * mvPosition;
  #endif 

  #ifdef IS_WALLPAPER
    // vec3 p = (modelMatrix * vec4(position,1.0)).xyz;
    // vec3 cp = cameraPosition;
    // vec3 x = vec3(p.y - cp.y, cp.x - p.x, 0); // lock to the z Axis


    // vec3 dir = normalize(p - cp);
    
    // float angleY = atan2(dir.x, dir.z);
    // float c = cos(angleY);
    // float s = sin(angleY);

    // mat4 MV = mat4(modelViewMatrix);
    // MV[0][0] = 0.0; 
    // MV[0][1] = 0.0;
    // MV[0][2] = 1.0; 
  
    // MV[1][0] = 0.0; 
    // MV[1][1] = 1.0; 
    // MV[1][2] = 0.0; 
  
    // // MV[2][0] = 0.0; 
    // MV[2][1] = 0.0; 
    // // MV[2][2] = MV[2][2];
    
    // #ifndef USE_SIZEATTENUATION
    //   bool isPerspective = isPerspectiveMatrix( projectionMatrix );
    //   if ( isPerspective ) MV *= - mvPosition.z;
    // #endif      


    // vec4 mvPosition = MV * vec4(rotate_vertex_position(position * finalSize * 2.0, vec3(0.0,0.0,1.0), rot), 1.0);
    // // gl_Position = projectionMatrix * mvPosition + projectionMatrix * vec4(translate + displacement,1.0);
    // gl_Position = projectionMatrix * (modelViewMatrix * vec4(translate + displacement,1.0) + mvPosition);


    // VERTICAL ALIGNED, pretty hacky and could be optimized
    mat4 MVV = mat4(modelMatrix);
    vec3 target = (modelMatrix * vec4(vec3(0.0), 1.0)).xyz + translate + displacement;
    vec3 dir = normalize(cameraPosition-target);
    MVV[0].xyz = normalize(cross(vec3(0.0, 1.0, 0.0), dir));
    // MVV[1].xyz = vec3(0.0, 1.0, 0.0);
    MVV[2].xyz = dir;
    gl_Position = projectionMatrix * viewMatrix * vec4((MVV*vec4(position, 1.0)).xyz + translate + displacement,1.0);

  #endif

  #ifdef IS_BILLBOARD
    mat4 MV = mat4(modelViewMatrix);
    MV[0][0] = 1.0; 
    MV[0][1] = 0.0;
    MV[0][2] = 0.0; 
  
    // MV[1][0] = 0.0; 
    // MV[1][1] = 1.0; 
    // MV[1][2] = 0.0; 
  
    MV[2][0] = 0.0; 
    MV[2][1] = 0.0; 
    MV[2][2] = 1.0;

    #ifndef USE_SIZEATTENUATION
      bool isPerspective = isPerspectiveMatrix( projectionMatrix );
      if ( isPerspective ) MV *= - mvPosition.z;
    #endif

    vec4 mvPosition = MV * vec4(rotate_vertex_position(position * finalSize + translate, vec3(0.0,0.0,1.0), rot), 1.0) + modelMatrix * vec4(displacement, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // gl_Position = projectionMatrix * (modelViewMatrix * vec4(translate + displacement,1.0) + vec4(position.x, position.y, 0.0, 0.0));
  #endif

  #ifdef IS_MESH
    gl_Position = projectionMatrix * modelViewMatrix * vec4(rotate_vertex_position(position * finalSize, vec3(0.0,0.0,1.0), rot) + translate + displacement, 1.0);
  #endif

  #ifdef IS_POINTCLOUD

  #endif
  
  #ifdef USE_UV
    ////////////
    // FRAMES //
    ////////////
    #ifdef USE_FRAMES
      float cycleLife = vLife / (1.0 / uCycles);
      float frame = floor(cycleLife * uFrames) + uOffset;
    
      float inc = 1.0 / uCells;
      float xOffset = mod(frame, uCells) * inc;
      float yOffset = floor(frame / uCells) * inc;

      vFrame = vec4(xOffset, yOffset, inc, frame);
      vUv = vec2(uv.x * inc + xOffset, (1.0-uv.y) * -inc - yOffset);
    #else
      vUv = uv;
    #endif
  #endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}
`
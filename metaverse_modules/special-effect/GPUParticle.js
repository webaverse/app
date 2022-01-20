import {
  Mesh,
  Vector2,
  Vector4,
  NormalBlending,
  DoubleSide,
  ShaderMaterial,
  InstancedBufferGeometry,
  Vector3,
  Uniform,
  PlaneBufferGeometry,
  InstancedBufferAttribute,
  Texture,
  Color,
  AdditiveBlending,
  UniformsLib,
  SubtractiveBlending,
  MeshDepthMaterial,
  RGBADepthPacking,
  sRGBEncoding
} from 'three'

import { sampleTorus, sampleCylinder, sampleArea, sampleSphere, sampleRing } from './SpawnHelpers'

import fragmentShader from './shaders/GPUParticle_frag'
import vertexShader from './shaders/GPUParticle_vert'

import TextureCache from './TextureCache'
import { ShaderClock, ScreenSize } from './FXSystem'

function AnimationVectors(len = 4) {
  const arr = []
  for (let i = 0; i < 16; i++)
    if (len === 4)
      arr.push(new Vector4(0, 0, 0, 1))
    else if (len === 3)
      arr.push(new Vector3(0, 0, 1))
    else if (len === 2)
      arr.push(new Vector2(0, 1))
  return arr
}

const placeholder = new Texture()
placeholder.encoding = sRGBEncoding
const plane = new PlaneBufferGeometry(1, 1)
export default class Particle extends Mesh {
  parameters = {}

  emit(type, data) {
    this.dispatchEvent({ type, data })
  }

  on(type, callback) {
    const cb = e => callback(e.data)
    this.addEventListener(type, cb)
    return cb
  }

  once(type, callback) {
    const cb = e => {
      callback(e.data)
      this.removeEventListener(type, cb)
    }
    this.addEventListener(type, cb)
  }

  off(type, callback) {
    this.removeEventListener(type, callback)
  }

  setParameter(key, value) {
    const { parameters } = this
    if (value === null || value === undefined || value === "")
      delete parameters[key]
    else if (!Array.isArray(value))
      parameters[key] = Number(value)
    else
      for (let i = 0; i < value.length; i++)
        parameters[`${key}_${i}`] = Number(value[i])

    this.emit("parameter", key, value)
  }

  getParameter(key) {
    return this.parameters[key]
  }

  index = 0 // next particle index to spawn
  cluster = 1 // amount of particles to spawn per tick
  max = 30 // number of particles to spawn
  rate = 1 // delay between spawns
  texture = "/assets/textures/puff1.png" // texture to use for particle
  location = { // spawn shape details
    // type: "area",
    // min: new Vector3(-1, -1, -1),
    // max: new Vector3(1, 1, 1),

    // uniform: true,

    // type: "sphere",
    // minRadius: 0.7,
    // radius: 1,

    // type: "cylinder",
    // minRadius: 0.7,
    // radius: 1,
    // height: 3


    // type: "torus",
    // radius: 1,
    // minHeight: 0.1,
    // height: 0.3
  }
  direction = {
    fromCenter: false,
    randomCone: false,
    random: false,
    target: false
  }

  constructor(ctx) {
    super(ctx)

    const uColorLife = new Uniform(AnimationVectors())
    const uAlphaLife = new Uniform(AnimationVectors(2))
    const uSizeLife = new Uniform(AnimationVectors(2))
    const uSpinLife = new Uniform(AnimationVectors(2))
    const uVelocityLife = new Uniform(AnimationVectors())
    const uAccelerationLife = new Uniform(AnimationVectors())

    this.material = new ShaderMaterial({
      defines: {
        USE_SIZEATTENUATION: true,
        USE_DEPTH: false,
        USE_ORBIT: true,
        USE_FRAMES: true,
        USE_AXIS: false,
        USE_GRAVITY: true,
        USE_LOOP: true,
        ANIMATE_ACCELERATION: false,
        ANIMATE_VELOCITY: false,
        ANIMATE_SPIN: false,
        ANIMATE_SIZE: false,
        ANIMATE_COLOR: false,
        ANIMATE_ALPHA: false,
        IS_MESH: false,
        IS_BILLBOARD: false,
        IS_SPRITE: true,
      },
      uniforms: {
        ShaderClock,
        cameraNear: new Uniform(0.01),
        cameraFar: new Uniform(1000),
        alphaTest: new Uniform(0.8),
        ScreenSize,
        center: new Uniform(new Vector2(0.5, 0.5)),
        uFrames: new Uniform(1.0),
        uCells: new Uniform(1.0),
        uCycles: new Uniform(1.0),
        uOffset: new Uniform(0.0),
        diffuse: new Uniform(new Color("white")),
        opacity: new Uniform(1),
        map: new Uniform(placeholder),
        uSoft: new Uniform(0),
        uTimeScale: new Uniform(1),
        uAlphaLife,
        uColorLife,
        uSizeLife,
        uSpinLife,
        uAccelerationLife,
        uVelocityLife
      },
      fog: true,
      alphaTest: 0.8,
      transparent: true,
      side: DoubleSide,
      map: placeholder,
      fragmentShader,
      vertexShader
    })

    for (const key in UniformsLib.fog)
      this.material.uniforms[key] = new Uniform(UniformsLib.fog[key].value instanceof Object ? UniformsLib.fog[key].value.clone() : UniformsLib.fog[key].value)

    if (ctx && ctx.system)
      this.load(ctx.system)
    else
      this.setTexture(this.texture)
  }

  process = schema => {
    if (!(schema instanceof Object))
      return typeof schema === "string" ? this.parameters[schema.toLowerCase()] : schema

    if (Array.isArray(schema)) {
      let oldSchema = []
      for (const value of schema)
        if (typeof value === "string")
          oldSchema.push(this.parameters[value.toLowerCase()])
        else
          oldSchema.push(value)
      return oldSchema
    }

    const { random } = Math

    if (schema.start != null)
      if (Array.isArray(schema.start)) {
        let arr = []
        for (let i = 0; i < schema.start.length; i++)
          arr.push(schema.start[i] + random() * schema.noise[i])

        return arr
      }
      else
        return schema.start + random() * schema.noise
    else if (schema.mean != null)
      if (Array.isArray(schema.mean)) {
        let arr = []
        for (let i = 0; i < schema.mean.length; i++)
          arr.push(schema.mean[i] + random() * schema.delta[i] - schema.delta[i] / 2)

        return arr
      }
      else
        return schema.mean + random() * schema.delta - schema.delta / 2
    else if (schema.range != null) {
      const v = new Vector3(schema.range[0] + random() * schema.delta[0], schema.range[1] + random() * schema.delta[1], schema.range[2] + random() * schema.delta[2])
      v.normalize()

      v.multiplyScalar(schema.forceStart + random() * schema.forceEnd)
      return v.toArray()
    }
  }

  processAttributes(data) {
    const { _system, process } = this

    data.colour = data.colour.concat(process(_system.tint))
    data.colour.push(process(_system.alpha))

    const v = process(_system.velocity)
    const vc = process(_system.velocityOrigin)
    if (vc != null) {
      const p = new Vector3().fromArray([data.translate[data.translate.length - 3], data.translate[data.translate.length - 2], data.translate[data.translate.length - 1]]).normalize()
      const o = p.sub(new Vector3(0, 0, 0)).multiplyScalar(vc)
      v[0] += o.x
      v[1] += o.y
      v[2] += o.z
    }

    data.velocity = data.velocity.concat(v)
    data.velocity.push(process(_system.drag))

    data.acceleration = data.acceleration.concat(process(_system.acceleration))
    data.acceleration.push(process(_system.gravity))

    data.size.push(process(_system.size), process(_system.sizeVelocity), process(_system.sizeAcceleration), process(_system.sizeDrag))
    data.angularVelocity.push(process(_system.angle, true), process(_system.angularVelocity), process(_system.angularAcceleration), process(_system.angularDrag))

    data.orbit = data.orbit.concat(process(_system.orbit))
    data.orbit.push(process(_system.orbitCycles))
  }

  updateAttributes(index) {
    const { _system, process, geometry } = this

    const c = process(_system.tint)
    const alpha = process(_system.alpha)

    geometry.attributes.colour.array[index * 4 + 0] = c[0]
    geometry.attributes.colour.array[index * 4 + 1] = c[1]
    geometry.attributes.colour.array[index * 4 + 2] = c[2]
    geometry.attributes.colour.array[index * 4 + 3] = alpha
    geometry.attributes.colour.needsUpdate = true

    const v = process(_system.velocity)
    const vc = process(_system.velocityOrigin)
    if (vc != null) {
      const trans = geometry.attributes.translate.array
      const p = new Vector3().fromArray([trans[index * 3], trans[index * 3 + 1], trans[index * 3 + 2]]).normalize()
      const o = p.sub(new Vector3(0, 0, 0)).multiplyScalar(vc)
      v[0] += o.x
      v[1] += o.y
      v[2] += o.z
    }

    const drag = process(_system.drag)
    geometry.attributes.velocity.array[index * 4 + 0] = v[0]
    geometry.attributes.velocity.array[index * 4 + 1] = v[1]
    geometry.attributes.velocity.array[index * 4 + 2] = v[2]
    geometry.attributes.velocity.array[index * 4 + 3] = drag
    geometry.attributes.velocity.needsUpdate = true

    const a = process(_system.acceleration)
    const g = process(_system.gravity)
    geometry.attributes.acceleration.array[index * 4 + 0] = a[0]
    geometry.attributes.acceleration.array[index * 4 + 1] = a[1]
    geometry.attributes.acceleration.array[index * 4 + 2] = a[2]
    geometry.attributes.acceleration.array[index * 4 + 3] = g
    geometry.attributes.acceleration.needsUpdate = true

    const size = [process(_system.size), process(_system.sizeVelocity), process(_system.sizeAcceleration), process(_system.sizeDrag)]
    geometry.attributes.size.array[index * 4 + 0] = size[0]
    geometry.attributes.size.array[index * 4 + 1] = size[1]
    geometry.attributes.size.array[index * 4 + 2] = size[2]
    geometry.attributes.size.array[index * 4 + 3] = size[3]
    geometry.attributes.size.needsUpdate = true

    const aV = [process(_system.angle, true), process(_system.angularVelocity), process(_system.angularAcceleration), process(_system.angularDrag)]
    geometry.attributes.angularVelocity.array[index * 4 + 0] = aV[0]
    geometry.attributes.angularVelocity.array[index * 4 + 1] = aV[1]
    geometry.attributes.angularVelocity.array[index * 4 + 2] = aV[2]
    geometry.attributes.angularVelocity.array[index * 4 + 3] = aV[3]
    geometry.attributes.angularVelocity.needsUpdate = true

    const o = process(_system.orbit)
    const oC = process(_system.orbitCycles)
    geometry.attributes.orbit.array[index * 4 + 0] = o[0]
    geometry.attributes.orbit.array[index * 4 + 1] = o[1]
    geometry.attributes.orbit.array[index * 4 + 2] = o[2]
    geometry.attributes.orbit.array[index * 4 + 3] = oC
    geometry.attributes.orbit.needsUpdate = true
  }

  genLocation(index) {
    const { limit, location } = this
    const min = new Vector3().fromArray(location.min || [-1, -1, -1])
    const max = new Vector3().fromArray(location.max || [1, 1, 1])
    switch (location.type) {
      case "ring":
        return sampleRing(location.radius, index / limit)
      case "sphere":
        return sampleSphere(location.uniform, location.minRadius, location.radius)
      case "cylinder":
        const p = sampleCylinder(location.uniform, location.minRadius, location.radius, location.height)
        p.y += location.minHeight
        return p
      case "torus":
        return sampleTorus(location.uniform, location.radius, location.minHeight, location.height)
      default:
        return sampleArea(min, max)
    }
  }

  initialize() {
    if (this.geometry && this.geometry.dispose)
      this.geometry.dispose()

    const geometry = new InstancedBufferGeometry()
    geometry.setAttribute('position', plane.attributes.position)
    geometry.setAttribute('uv', plane.attributes.uv)
    geometry.setAttribute('normal', plane.attributes.normal)
    geometry.index = plane.index

    const data = {
      translate: [],
      acceleration: [],
      velocity: [],
      angularVelocity: [],

      size: [],
      colour: [],

      lifetime: [],
      up: [],
      orbit: []
    }

    const { loop, rate, burst, limit, material, _system } = this
    const start = (loop ? 0 : ShaderClock.value)

    for (let i = 0; i < limit; i++) {
      data.lifetime.push(start + rate * Math.floor(i / burst), this.process(_system.lifetime))
      const p = this.genLocation(i)
      data.translate.push(p.x, p.y, p.z)
      this.processAttributes(data)

      if (material.defines.USE_AXIS)
        data.up.push(0, 1, 0)
    }

    geometry.setAttribute("lifetime", new InstancedBufferAttribute(new Float32Array(data.lifetime), 2))
    geometry.setAttribute("colour", new InstancedBufferAttribute(new Float32Array(data.colour), 4))
    if (material.defines.USE_AXIS)
      geometry.setAttribute("up", new InstancedBufferAttribute(new Float32Array(data.up), 3))
    geometry.setAttribute("translate", new InstancedBufferAttribute(new Float32Array(data.translate), 3))
    geometry.setAttribute("size", new InstancedBufferAttribute(new Float32Array(data.size), 4))

    geometry.setAttribute('angularVelocity', new InstancedBufferAttribute(new Float32Array(data.angularVelocity), 4))
    geometry.setAttribute("velocity", new InstancedBufferAttribute(new Float32Array(data.velocity), 4))
    geometry.setAttribute('acceleration', new InstancedBufferAttribute(new Float32Array(data.acceleration), 4))
    if (material.defines.USE_ORBIT)
      geometry.setAttribute("orbit", new InstancedBufferAttribute(new Float32Array(data.orbit), 4))

    this.geometry = geometry
  }

  setTexture(src) {
    TextureCache.get(src).then(map => {
      this.texture = src
      this.material.map = map
      this.material.uniforms.map.value = map
      this.material.needsUpdate = true

      // if (this.material.depthWrite) { // TODO: Enable shadows on GPU particles
      //   this.customDepthMaterial = new MeshDepthMaterial( {
      //     depthPacking: RGBADepthPacking,
      //     map,
      //     alphaTest: this.material.alphaTest,
      //   })
      //   const uniforms = this.material.uniforms
      //   const defines = this.material.defines
      //   this.customDepthMaterial.onBeforeCompile = function(shader) {
      //     shader.uniforms = {...uniforms, ...shader.uniforms}
      //     shader.defines = {...defines}
      //     shader.vertexShader = `
      //     #include <common>
      //     #include <uv_pars_vertex>
      //     #include <displacementmap_pars_vertex>
      //     #include <morphtarget_pars_vertex>
      //     #include <skinning_pars_vertex>
      //     #include <logdepthbuf_pars_vertex>
      //     #include <clipping_planes_pars_vertex>
      //     // This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
      //     // Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
      //     // depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
      //     varying vec2 vHighPrecisionZW;
      //     void main() {
      //       #include <uv_vertex>
      //       #include <skinbase_vertex>
      //       #ifdef USE_DISPLACEMENTMAP
      //         #include <beginnormal_vertex>
      //         #include <morphnormal_vertex>
      //         #include <skinnormal_vertex>
      //       #endif
      //       #include <begin_vertex>
      //       #include <morphtarget_vertex>
      //       #include <skinning_vertex>
      //       #include <displacementmap_vertex>
      //       #include <project_vertex>
      //       #include <logdepthbuf_vertex>
      //       #include <clipping_planes_vertex>
      //       vHighPrecisionZW = gl_Position.zw;
      //     }`
      //   }
      //   console.log("Here")
      //   this.castShadow = true
      // }

      this.emit("loaded")
    })
  }

  loadKeyFrames(keyframes, target) {
    if (keyframes && keyframes.length)
      for (let i = 0; i < target.value.length; i++) {
        const value = target.value[i]
        let arr = []
        const len = keyframes.length
        if (i < keyframes.length)
          arr = [...this.process(keyframes[i].v), this.process(keyframes[i].t)]
        else
          arr = [...this.process(keyframes[len - 1].v), this.process(keyframes[len - 1].t)]
        value.fromArray(arr)
      }
  }

  load(json) {
    this._system = json
    const { process, material } = this
    this.loadKeyFrames(json.accelerationLife, material.uniforms.uAccelerationLife)
    material.defines.ANIMATE_ACCELERATION = json.accelerationLife.length ? true : false

    this.loadKeyFrames(json.velocityLife, material.uniforms.uVelocityLife)
    material.defines.ANIMATE_VELOCITY = json.velocityLife.length ? true : false

    this.loadKeyFrames(json.alphaLife, material.uniforms.uAlphaLife)
    material.defines.ANIMATE_ALPHA = json.alphaLife.length ? true : false

    this.loadKeyFrames(json.colorLife, material.uniforms.uColorLife)
    material.defines.ANIMATE_COLOR = json.colorLife.length ? true : false

    this.loadKeyFrames(json.angleLife, material.uniforms.uSpinLife)
    material.defines.ANIMATE_SPIN = json.angleLife.length ? true : false

    this.loadKeyFrames(json.sizeLife, material.uniforms.uSizeLife)
    material.defines.ANIMATE_SIZE = json.sizeLife.length ? true : false

    this.setTexture(json.texture)

    material.defines.IS_BILLBOARD = false
    material.defines.IS_WALLPAPER = false
    material.defines.IS_SPRITE = false
    material.defines.IS_MESH = false
    if (json.display === "Billboard")
      material.defines.IS_BILLBOARD = true
    else if (json.display === "Wallpaper")
      material.defines.IS_WALLPAPER = true
    else if (json.display === "Plane")
      material.defines.IS_MESH = true
    else if (json.display === "Sprite")
      material.defines.IS_SPRITE = true
    else
      material.defines.IS_MESH = true

    material.toneMapped = json.tone
    material.fog = json.fog
    material.transparent = json.transparent
    material.alphaTest = json.alphaTest
    material.uniforms.alphaTest.value = json.alphaTest
    material.depthWrite = json.depthWrite
    material.depthTest = json.depthTest

    if (json.blending === "Additive")
      this.material.blending = AdditiveBlending
    else if (json.blending === "Subtractive")
      this.material.blending = SubtractiveBlending
    else
      this.material.blending = NormalBlending

    material.uniforms.uFrames.value = json.frames
    material.uniforms.uCells.value = json.cells
    material.uniforms.uCycles.value = process(json.cycles)
    material.uniforms.uOffset.value = json.offset

    material.uniforms.center.value.set(json.centerX ?? 0.5, json.centerY ?? 0.5)

    const cycles = process(json.loop)
    material.defines.USE_LOOP = cycles ? false : true

    // TODO: Find depth map uniform, and add support here
    // const soft = process(json.soft)
    // material.uniforms.uSoft.value = soft
    // material.defines.USE_DEPTH = soft ? true : false

    this.location = { type: (json.shape || "area").toLowerCase(), uniform: json.uniform }
    if (this.location.type === "area")
      if (Array.isArray(json.area)) {
        this.location.min = [...process(json.area)]
        this.location.max = [...process(json.area)]
      }
      else {
        if (json.area.start) {
          this.location.min = [...json.area.start]
          this.location.max = [...json.area.start]
          for (let i = 0; i < json.area.noise.length; i++)
            this.location.max[i] += json.area.noise[i]
        }
        else if (json.area.mean) {
          this.location.min = [...json.area.mean]
          this.location.max = [...json.area.mean]
          for (let i = 0; i < json.area.delta.length; i++) {
            this.location.min[i] -= json.area.delta[i] / 2
            this.location.max[i] += json.area.delta[i] / 2
          }
        }
      }
    else if (this.location.type === "sphere") {
      this.location.minRadius = process(json.minRadius)
      this.location.radius = process(json.radius)
    }
    else if (this.location.type === "ring")
      this.location.radius = process(json.radius)
    else if (this.location.type === "cylinder" || this.location.type === "torus") {
      this.location.minRadius = process(json.minRadius)
      this.location.radius = process(json.radius)

      this.location.minHeight = process(json.minHeight)
      this.location.height = process(json.height)
    }

    this.soft = json.soft
    this.lifetime = json.lifetime
    this.burst = json.burst
    this.limit = json.limit
    this.rate = json.rate
    this.loop = cycles

    this.time = this.rate
    this.spawnIndex = 0
    // UNPACK SYSTEM HERE
    this.initialize()
    material.needsUpdate = true
    this.emit("loaded")
  }

  enable() {
    this.enabled = true
    this.time = this.rate
  }

  disable() {
    this.enabled = false
  }

  spawnParticle(amt, refresh = true) { // really shouldn't use this unless you are only spawning a couple
    const { geometry, limit } = this
    for (let i = 0; i < amt; i++) {
      geometry.attributes.lifetime.array[this.spawnIndex * 2] = ShaderClock.value
      geometry.attributes.lifetime.needsUpdate = true

      if (refresh) {
        const p = this.genLocation(this.spawnIndex)
        geometry.attributes.translate.array[this.spawnIndex * 3 + 0] = p.x
        geometry.attributes.translate.array[this.spawnIndex * 3 + 1] = p.y
        geometry.attributes.translate.array[this.spawnIndex * 3 + 2] = p.z
        geometry.attributes.translate.needsUpdate = true

        this.updateAttributes(this.spawnIndex)
      }

      this.spawnIndex = (this.spawnIndex + 1) % limit
    }
  }

  updateSystem(dt) {
    if (this.loop) {
      this.time -= dt
      const rate = this.rate
      const disabled = false//this.disabled
      const cluster = this.burst
      if (rate && this.time < 0 && !disabled) {
        this.spawnParticle(cluster || 1)
        this.time = this._system.rate
        this.loop -= 1
      }
    }
  }
}
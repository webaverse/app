import { Uniform, Vector2 } from 'three'
import Point from './Transform'
import GPUParticle from "./GPUParticle"

import _ from 'lodash'

const active = []

export const ShaderClock = new Uniform(0)
export const ScreenSize = new Uniform(new Vector2())

export const AnimStack = [] // runs as fast as possible, save for smooth animation


let lastNow = 0
export const update = () => {
  let now = window.performance.now()
  let dt = (now - lastNow) / 1000.0
  lastNow = now
  ShaderClock.value += dt
  for (let i = AnimStack.length - 1; i >= 0; i--)
    if (AnimStack[i](dt))
      AnimStack.splice(i, 1) // runs as fast as possible
}

AnimStack.push(dt => {
  if (active.length)
    for (const emitter of active)
      emitter.updateSystem(dt)
})

export default class FXSystem extends Point {
  enabled = false
  tracks = []
  _timeScale = 1

  parameters = {}

  setParameter(key, value) {
    const { parameters } = this
    if (value === null || value === undefined || value === "")
      delete parameters[key]
    else if (!Array.isArray(value))
      parameters[key] = Number(value)
    else
      for (let i = 0; i < value.length; i++)
        parameters[`${key}_${i}`] = Number(value[i])

    for (const child of this.children) {
      child.setParameter(key, value)
      // child.load(child._system)
    }

    this.emit("parameter", key, value)
  }

  getParameter(key) {
    return this.parameters[key]
  }

  constructor(ctx) {
    super(ctx)

    // if (ctx && ctx.system)
    //   this.load(ctx.system)

    this.disable()
  }

  get timeScale() {
    return this._timeScale
  }

  set timeScale(v) {
    for (const child of this.children)
      child.timeScale = v

    this._timeScale = v
  }

  addTrack(json) {
    const track = new GPUParticle({ system: json })
    if (this.enabled)
      track.enable()
    this.add(track)
  }

  loadSystem(json) {
    const { tracks } = json
    while (this.children.length)
      this.remove(this.children[this.children.length - 1])

    while (tracks.length < this.children.length)
      this.remove(this.children[this.children.length - 1])

    while (tracks.length > this.children.length)
      this.addTrack()

    for (let i = 0; i < tracks.length; i++)
      if (!_.isEqual(tracks[i], this.children[i]._system))
        this.children[i].load(tracks[i])
  }

  enable() {
    this.enabled = true

    for (const child of this.children)
      child.enable()

    if (!active.includes(this))
      active.push(this)

    console.log(this.children)
  }

  disable() {
    this.enabled = false
    if (active.includes(this))
      active.splice(active.indexOf(this), 1)
  }

  updateSystem(dt) {
    const t = dt * this.timeScale
    for (const child of this.children)
      child.updateSystem(t)
  }
}

import { Object3D, Box3, Vector3 } from "three"

// Props are Visuals Only
export default class Transform extends Object3D {
  constructor(ctx) {
    super(ctx)

    if (ctx?.on) {
      for (var event in ctx.on)
        this.on(event, ctx.on[event])
      delete ctx.on
    }
  }

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

  clone() {
    let children
    if (this.children.length > 0) {
      children = []
      this.children.forEach((child) => {
        children.push(child.clone())
      })
    }

    return new Object3D({
      children: children || [],
    })
  }

  getBox() {
    const box = new Box3()
    box.setFromObject(this)
    return box
  }

  getCenter() {
    const v = new Vector3()
    this.getBox().getCenter(v)
    return v
  }

  softRadius() {
    const box = this.getBox()
    const d = box.max.clone().sub(box.min)
    return Math.sqrt(d.x + d.z + d.y) / 2.0
  }

  dispose() {
    this.traverse(p => {
      if (p.type === "Mesh")
        p.material.dispose()
    })
  }
}

import { TextureLoader, sRGBEncoding, RepeatWrapping } from 'three'

const loader = new TextureLoader()
const cache = {}

export default class TextureCache {
  static key(key) {
    return cache[key]
  }
  static define(key, texture) {
    if (!cache[key])
      cache[key] = texture
  }

  static async load(key) {
    cache[key] = new Promise(res => {
      loader.load(key, texture => {
        cache[key] = texture
        texture.encoding = sRGBEncoding
        texture.flipY = true
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
        // console.log(texture)
        res(texture)
      })
    })
    return cache[key]
  }

  static async get(key) {
    if (cache[key] instanceof Promise)
      return await cache[key]
    else if (cache[key])
      return cache[key]
    return await TextureCache.load(key)
  }

  static cache() {
    return cache
  }
}

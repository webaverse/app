import FXSystem, { ScreenSize, update } from './FXSystem'
import metaversefile from 'metaversefile'
import system from './lib/dazed.json'

const {useApp, useInternals} = metaversefile

function loopFN(dt){
  update(dt)
  requestAnimationFrame(loopFN)
}
requestAnimationFrame(loopFN)

export default () => {
  const { renderer } = useInternals()

  if (renderer) {
    const containerElement = renderer.domElement
    const {width, height} = containerElement.getBoundingClientRect()
    ScreenSize.value.set(width, height)
    ScreenSize.needsUpdate = true
  }

  const app = useApp()
  const fx = new FXSystem()
  fx.loadSystem({tracks: system})
  fx.enable()
  app.add(fx)
  
  return app
}
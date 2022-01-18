import EventEmitter from 'events'

export class AnimNode extends EventEmitter {
  to = 0.1 // transition to this animation
  from = 0.1 // transition from previous animation, can be overridden
  anims = {} // a list of animations this animation plays {"Anim" : Loop:Boolean}

  start(prevNode)  {} // virtual method for overriding behavior, previous AnimNode is passed if available
  end(transitionData) {} // callback when the animation Node is deactivated
}

export default class AnimGraph extends EventEmitter {
  constructor(ctx={}){
    super(ctx)
    this._controller = ctx.controller
  }

  nodes = {} // stack of Animations that are live on the model

  context() { // virtual function to create context used when determining state
    return {} // returns an object to deconstruct for cleaner code
  }

  determine(dt) { // Logic deciding where the Animation should transition to (This is the "Graph", we could update it to JSON/GUI maybe but code is more precise)
    
  }
}
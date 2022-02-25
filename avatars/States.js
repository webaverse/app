import {Vector3, Object3D} from 'three'

class StateObj{
    constructor({ time= NaN, target, direction= new Vector3()}){
        this.time = time;
        this.animation = null;
        this.target = target
        this.animation = null;
        this.direction = direction;
    }
}

class StateMachine{
    constructor(){
        this.tracking = []; //we might want this in order
        this.states = {};
        // shared state
        this.states.jump = new StateObj();
        this.states.fly = new StateObj();
        this.states.use = new StateObj();
        this.states.sit = new StateObj({ target: new Object3D()});
        this.states.dance = new StateObj();
        this.states.crouch = new StateObj({time:crouchMaxTime});
        this.states.narutoRun = new StateObj({time:0});
        this.states.chargeJump = new StateObj();
        this.states.fallLoop = new StateObj({time:0});
        this.states.aim = new StateObj()
        // this.states.activate = new StateObj({time:0});
        // this.states.throw = new StateObj({time:0});
        // this.states.standCharge = new StateObj({time:0});
        // this.states.swordSideSlash = new StateObj({time:0});
        // this.states.swordTopDownSlash = new StateObj({time:0});

    }

    registerState(name, params){
        this.states[name] = new StateObj(params)
    }

    track(obj){
        this.tracking.push(obj);
    }
}
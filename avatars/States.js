import {Vector3, Object3D} from 'three'

class StateObj{
    constructor({ time= NaN, target, direction= new Vector3(), active=false} = {}){
        this.time = time;
        this.animation = null;
        this.target = target
        this.direction = direction;
        this.active = active;
    }
}

class StateMachine{
    constructor(){
        this.tracking = {};
        this.states = {};


        // shared state
        // this.states.jump = new StateObj();
        // this.states.fly = new StateObj();
        // this.states.use = new StateObj();
        // this.states.sit = new StateObj({ target: new Object3D()});
        // this.states.dance = new StateObj();
        // // this.states.crouch = new StateObj({time:crouchMaxTime});
        // this.states.narutoRun = new StateObj({time:0});
        // this.states.chargeJump = new StateObj();
        // this.states.fallLoop = new StateObj({time:0});
        // this.states.aim = new StateObj()
        // // this.states.activate = new StateObj({time:0});
        // // this.states.throw = new StateObj({time:0});
        // // this.states.standCharge = new StateObj({time:0});
        // // this.states.swordSideSlash = new StateObj({time:0});
        // // this.states.swordTopDownSlash = new StateObj({time:0});

    }

    //add object to state machine
    registerObj(name, obj){
        this.tracking[name] ??= {
            obj: obj,
            states: {},
            set registerState(params)  { //assign a state to a tracked object
                if(!params) return;
                const {name} = params;
                this.states[name] ??= new StateObj(params);
                this.states[name] = { ...this.states[name], ...params }
            },
            getState: function(state, active = false) {
                return active ? (this.states[state]?.active) : this.states[state];
            }
        };
        obj.tracker = this.getTracked(name);
    }

    getTracked(name){
        return this.tracking[name];
    }
    
    getState(name, state){
        const current = this.tracking[name];
        return current.states[state];
    }
}

const stateMachine = new StateMachine();

export default stateMachine;
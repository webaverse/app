import {Vector3, Object3D} from 'three'

class StateObj{
    constructor({ time= NaN, target, direction= new Vector3(), active=false} = {}){
        this.time = time;
        this.animation = null;
        this.animationFn = null;
        this.target = target
        this.direction = direction;
        this.active = active;
    }
}

class GraphNode{
    constructor(data=[], peers=[], directed=true){
        this.data = data.shift();
        this.siblings = data.map(d => {
            return new GraphNode(d);
        })
        this.peers = peers;
        this.directed = directed;
    }
    
}

class StateMachine{
    constructor(){
        this.tracking = new Map();
        this.states = {};
        this.graph = new Map();


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
        // this.tracking[name] ??= {
        this.tracking.has(name) || this.tracking.set(name, {
            id: crypto.randomUUID(),
            obj: obj,
            graph: new Map(),
            graphRoot:null,
            states: new Map(),
            registerState: function(params) { //assign a state to a tracked object
                if(!params) return;
                const {name:stateName} = params;
                const state = this.states.has(stateName) ? { ...this.states.get(stateName), ...params } : new StateObj(params);
                this.states.set(stateName, state);
                //add straight into graph if it's already active
                if (this.states.get(stateName).active){
                    const node = new GraphNode([stateName])
                    this.graph.set(stateName, node);
                }
            },
            getState: function(state, active = false) {
                // console.log(this.states.get(state)?.time)
                return active ? this.states.get(state)?.active : this.states.get(state);
            },
            deactivate:function(state){
                if (this.states.has(state)) this.states.get(state).active = false;
            },
            addToGraph:function(states=[]){
                const node = new GraphNode(states)
                this.graph.set(states[0], node);
                //do we want to add siblings to the graph var, or just look through their sublings list?
                // node.siblings.forEach(n => {
                //     this.graph.set(n)
                // }, this)
            }
        });
        obj.tracker = this.getTracked(name);
        
    }

    getTracked(name){
        return name ? this.tracking.get(name) : this.tracking;
    }

    untrack(name){
        return this.tracking.delete(name);
    }
    
    getState(name, state){
        const current = this.tracking.get(name);
        return current.states.get(state);
    }

    queueState(state){
        this.graph.set(state, new GraphNode([state]))
    }

    update(timestamp, timeDiff){
        this.tracking.forEach(tracked => {
            // tracked.states.forEach((state, key) => {
            //     if(!state.active) return;
            // })
            // console.log(tracked.graph, ` is active`)
            tracked.graph.forEach((node, key) => {
                const name = node.data;
                let curState = tracked.getState(name);
                if(!curState.active) return;
                // console.log(`${key} is active`, curState)
                curState.animationFn?.();
            })
        })
    }
}

const stateMachine = new StateMachine();

export default stateMachine;
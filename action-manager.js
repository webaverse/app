import { ConstructorFragment } from 'ethers/lib/utils';
import * as THREE from 'three';
import * as Z from 'zjs';
import {BinaryInterpolant, BiActionInterpolant, UniActionInterpolant, InfiniteActionInterpolant, PositionInterpolant, QuaternionInterpolant} from './interpolants.js';
import {
  actionsMapName,
  appsMapName,
  playersMapName,
  crouchMaxTime,
  activateMaxTime,
  // useMaxTime,
  aimTransitionMaxTime,
  avatarInterpolationFrameRate,
  avatarInterpolationTimeDelay,
  avatarInterpolationNumFrames,
  // groundFriction,
  // defaultVoicePackName,
  voiceEndpointBaseUrl,
  numLoadoutSlots,
} from './constants.js';
import metaversefile from 'metaversefile';
import physicsManager from './physics-manager.js';
import {makeId, clone, unFrustumCull, enableShadows} from './util.js';


const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const localVector = new THREE.Vector3();

const controlActionTypes = [
  'jump',
  'fallLoop',
  'land',
  'crouch',
  'fly',
  'sit',
  'swim',
];

const hurtAnimations = [
  'pain_arch',
  'pain_back',
];

const _getSession = () => {
  const renderer = getRenderer();
  const session = renderer.xr.getSession();
  return session;
};

const physicsScene = physicsManager.getScene();

class CharacterActions{
    constructor(character, avatar){
      //this.playerMap = new Z.Map();
      this.actions = new Z.Array();
      this.character = character;
      this.avatar = avatar;

      // actual actions
      this.faceposeActions = [];
      this.grabActions = [];

      this.chatAction = null;
      this.wearAction = null;
     

      this.jumpAction = null;
      this.doubleJumpAction = null;
      this.landAction = null;
      this.flyAction = null;
      this.swimAction = null;
      this.useAction = null;
      this.pickUpAction = null;
      this.narutoRunAction = null;
      this.sitAction = null;
      //this.sitAnimation = sitAction ? sitAction.animation : '';
      this.danceAction = null;
      //this.danceAnimation = danceAction ? danceAction.animation : '';
      this.emoteAction = null;
      //this.emoteAnimation = emoteAction ? emoteAction.animation : '';
      this.aimAction = null;
      this.crouchAction = null;
      this.wearAction = null;
      this.fallLoopAction = null; 
      this.hurtAction = null;

      // this.throwAction = player.getAction('throw');
      // this.chargeJump = player.getAction('chargeJump');
      // this.chargeJumpAnimation = chargeJump ? chargeJump.animation : '';
      // this.standCharge = player.getAction('standCharge');
      // this.standChargeAnimation = standCharge ? standCharge.animation : '';
      // this.fallLoopAnimation = fallLoopAction ? fallLoopAction.animation : '';
      // this.swordSideSlash = player.getAction('swordSideSlash');
      // this.swordSideSlashAnimation = swordSideSlash ? swordSideSlash.animation : '';
      // this.swordTopDownSlash = player.getAction('swordTopDownSlash');
      // this.swordTopDownSlashAnimation = swordTopDownSlash ? swordTopDownSlash.animation : '';
      

      

      this._interpolants = new UninterpolatedActions(this); // missing interpolatedActions
      //avatarBind?
    }

    // #region check what actually will be needed and what can be removed
    // #region get index of action
    findIndex(fn) {
        let i = 0;
        for (const action of this.actions) {
          if (fn(action)) {
            return i;
          }
          i++
        }
        return -1;
    }
    getIndex(type) {
        let i = 0;
        for (const action of this.actions) {
          if (action.type === type) {
            return i;
          }
          i++;
        }
        return -1;
    }
    indexOf(action) {
        let i = 0;
        for (const a of this.actions) {
          if (a === action) {
            return i;
          }
          i++;
        }
        return -1;
    }
    // #endregion

    // #region get a single action
    find(fn) {
        for (const action of this.actions) {
            if (fn(action)) {
            return action;
            }
        }
        return null;
    }
    get(type) {
        for (const action of this.actions) {
          if (action.type === type) {
            return action;
          }
        }
        return null;
    }
    getByActionId(actionId) {
        for (const action of this.actions) {
          if (action.actionId === actionId) {
            return action;
          }
        }
        return null;
    }
    // #endregion
    
    // #region get multiple actions
    getActionsByType(type) {
        const typedActions = Array.from(this.actions).filter(action => action.type === type);
        return typedActions;
    }
    getActions() {
        return this.actions;
    }
    getActionsArray() {
        return Array.from(this.actions);
        // check what isBound is in character controller
        return this.isBound() ? Array.from(this.actions) : [];
    }
    // #endregion
        
    // #region interaction actions array
    has(type) {
      //console.log('check')
        for (const action of this.actions) {
          if (action.type === type) {
            return true;
          }
        }
        return false;
    }
    add(action) {
        action = clone(action);
        action.actionId = makeId(5);
        this.actions.push([action]);
        return action;
    }
    remove(type) {
        let i = 0;
        for (const action of this.actions) {
          if (action.type === type) {
            this.actions.delete(i);
            break;
          }
          i++;
        }
    }
    removeAtIndex(index) {
        this.actions.delete(index);
    }
    clear() {
        const numActions = this.actions.length;
        for (let i = numActions - 1; i >= 0; i--) {
          this.removeActionIndex(i);
        }
    }
    setAsControl(action) {

        for (let i = 0; i < this.actions.length; i++) {
          const action = this.actions.get(i);
          const isControlAction = controlActionTypes.includes(action.type);
          if (isControlAction) {
            this.actions.delete(i);
            i--;
          }
        }
        this.actions.push([action]);
    }
    // #endregion
    // #endregion
    
    // #region new section: define actions here
    // usage example player.actions.grab(app,pos,quat,"left")
    // trying to think a way here to be useful not only for local player but for any mob
    // still need to debug, should we use left and right or just 1 action that holds both?
    grab(app, position, quaternion, hand = 'left'){
      console.log("grabs manager")

      app.updateMatrixWorld();
      app.savedRotation = app.rotation.clone();
      app.startQuaternion = quaternion.clone();

      this.grabActions.push({
        type: 'grab',
        hand,
        instanceId: app.instanceId,
        matrix: localMatrix.copy(app.matrixWorld)
        .premultiply(localMatrix2.compose(position, quaternion, localVector.set(1, 1, 1)).invert())
        .toArray()
      });

      physicsScene.disableAppPhysics(app);

      app.dispatchEvent({
        type: 'grabupdate',
        grab: true,
      });
    }

    // still need debug this one, should we consider in argument both hands?
    ungrab(){

      //const actions = [];
      //if (this.grabLeftAction) actions.push(this.grabLeftAction);
      //if (this.grabRightAction) actions.push(this.grabRightAction);
      this.grabActions.forEach(action => {
        const app = metaversefile.getAppByInstanceId(action.instanceId);
          physicsScene.enableAppPhysics(app)
          app.dispatchEvent({
          type: 'grabupdate',
          grab: false,
        });
      });

    }
    
    facepose(emotion, value = 0){
      this.faceposeActions.push({
        type: 'facepose',
        emotion,
        value
      })
    }
    wear(app, loadoutIndex, holdAnimation){
      const wearComponent = app.getComponent('wear');
      const holdAnimation = wearComponent? wearComponent.holdAnimation : null;
      this.wearAction = {
        type: 'wear',
        instanceId: app.instanceId,
        loadoutIndex,
        holdAnimation,
      };
      _addAction();
    }
    
    hurt(animation){
        //animation: Math.random() < 0.5 ? 'pain_arch' : 'pain_back',
    }
    // chat(text){

    // }
    use(instanceId,
        animation,
        animationCombo,
        animationEnvelope,
        ik,
        behavior,
        boneAttachment,
        index,
        position,
        quaternion,
        scale,){

    }
    firstperson(){

    }
    aim(instanceId,
        appAnimation,
        playerAnimation,
        boneAttachment,
        position,
        quaternion,
        scale,){

    }
    dance(animation){
        //dansu, powerup
    }
    sss(){

    }
    narutoRun(){

    }
    crouch(){

    }
    doubleJump(startPositionY){

    }
    activate(animationName){

    }
    pose(animation){

    }
    pickUp(instanceId){

    }
    cure(){

    }
    emote(emotion,value){
        
    }
    // #endregion

    _update(){
      const session = _getSession();
      this._interpolants.updateInterpolation();
      applyPlayerToAvatar(this, session, this.avatar, mirrors);
    }
    
}


class UninterpolatedActions{
  constructor(charActions) {
    this.init(charActions);
  }
  init(charActions) {
    const {character} = charActions;
    this.actionInterpolants = {
      crouch: new BiActionInterpolant(() => charActions.has('crouch'), 0, crouchMaxTime),
      activate: new UniActionInterpolant(() => charActions.has('activate'), 0, activateMaxTime),
      use: new InfiniteActionInterpolant(() => charActions.has('use'), 0),
      pickUp: new InfiniteActionInterpolant(() => charActions.has('pickUp'), 0),
      unuse: new InfiniteActionInterpolant(() => !charActions.has('use'), 0),
      aim: new InfiniteActionInterpolant(() => charActions.has('aim'), 0),
      aimRightTransition: new BiActionInterpolant(() => charActions.has('aim') && charActions.hands[0].enabled, 0, aimTransitionMaxTime),
      aimLeftTransition: new BiActionInterpolant(() => charActions.has('aim') && charActions.hands[1].enabled, 0, aimTransitionMaxTime),
      narutoRun: new InfiniteActionInterpolant(() => charActions.has('narutoRun'), 0),
      fly: new InfiniteActionInterpolant(() => charActions.has('fly'), 0),
      swim: new InfiniteActionInterpolant(() => charActions.has('swim'), 0),
      jump: new InfiniteActionInterpolant(() => charActions.has('jump'), 0),
      doubleJump: new InfiniteActionInterpolant(() => charActions.has('doubleJump'), 0),
      land: new InfiniteActionInterpolant(() => !charActions.has('jump') && !charActions.has('fallLoop') && !charActions.has('fly'), 0),
      dance: new BiActionInterpolant(() => charActions.has('dance'), 0, crouchMaxTime),
      emote: new BiActionInterpolant(() => charActions.has('emote'), 0, crouchMaxTime),
      movements: new InfiniteActionInterpolant(() => {
        const ioManager = metaversefile.useIoManager();
        return  ioManager.keys.up || ioManager.keys.down || ioManager.keys.left || ioManager.keys.right;
      }, 0),
      movementsTransition: new BiActionInterpolant(() => {
        const ioManager = metaversefile.useIoManager();
        return  ioManager.keys.up || ioManager.keys.down || ioManager.keys.left || ioManager.keys.right;
      }, 0, crouchMaxTime),
      sprint: new BiActionInterpolant(() => {
        const ioManager = metaversefile.useIoManager();
        return  ioManager.keys.shift;
      }, 0, crouchMaxTime),
      // throw: new UniActionInterpolant(() => this.hasAction('throw'), 0, throwMaxTime),
      // chargeJump: new InfiniteActionInterpolant(() => this.hasAction('chargeJump'), 0),
      // standCharge: new InfiniteActionInterpolant(() => this.hasAction('standCharge'), 0),
      fallLoop: new InfiniteActionInterpolant(() => charActions.has('fallLoop'), 0),
      fallLoopTransition: new BiActionInterpolant(() => charActions.has('fallLoop'), 0, 300),
      // swordSideSlash: new InfiniteActionInterpolant(() => this.hasAction('swordSideSlash'), 0),
      // swordTopDownSlash: new InfiniteActionInterpolant(() => this.hasAction('swordTopDownSlash'), 0),
      hurt: new InfiniteActionInterpolant(() => charActions.has('hurt'), 0),
    };
    this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(k => this.actionInterpolants[k]);

    this.avatarBinding = {
      position: character.position,
      quaternion: character.quaternion,
    };
  }
  updateInterpolation(timeDiff) {
    for (const actionInterpolant of this.actionInterpolantsArray) {
      actionInterpolant.update(timeDiff);
    }
  }
}

export const characterActions = (target) => {
  return new CharacterActions(target);
}
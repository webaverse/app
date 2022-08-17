import { ConstructorFragment } from 'ethers/lib/utils';
import * as Z from 'zjs';

class CharacterActions{
    constructor(){
        //this.playerMap = new Z.Map();
        this.actions = new Z.Array();
        //avatarBind?
    }

    // #region check what actually will be needed and what can be removed
    // #region get index of action
    findActionIndex(fn) {
        let i = 0;
        for (const action of this.actions) {
          if (fn(action)) {
            return i;
          }
          i++
        }
        return -1;
    }
    getActionIndex(type) {
        let i = 0;
        for (const action of this.actions) {
          if (action.type === type) {
            return i;
          }
          i++;
        }
        return -1;
    }
    indexOfAction(action) {
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
    findAction(fn) {
        for (const action of this.actions) {
            if (fn(action)) {
            return action;
            }
        }
        return null;
    }
    getAction(type) {
        for (const action of this.actions) {
          if (action.type === type) {
            return action;
          }
        }
        return null;
    }
    getActionByActionId(actionId) {
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
    hasAction(type) {
        for (const action of this.actions) {
          if (action.type === type) {
            return true;
          }
        }
        return false;
    }
    addAction(action) {
        action = clone(action);
        action.actionId = makeId(5);
        this.actions.push([action]);
        return action;
    }
    removeAction(type) {
        let i = 0;
        for (const action of this.actions) {
          if (action.type === type) {
            this.actions.delete(i);
            break;
          }
          i++;
        }
    }
    removeActionIndex(index) {
        this.actions.delete(index);
    }
    clearActions() {
        const numActions = this.actions.length;
        for (let i = numActions - 1; i >= 0; i--) {
          this.removeActionIndex(i);
        }
    }
    setControlAction(action) {

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
    //usage example player.actions.grab(objectId)
    startGrab(hand, instanceId, matrix){

    }
    endGrab(){
        
    }
    facepose(emotion, value){

    }
    wear(instanceId, loadoutIndex, holdAnimation){

    }
    hurt(animation){
        //animation: Math.random() < 0.5 ? 'pain_arch' : 'pain_back',
    }
    chat(text){

    }
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
    
}

class Action{
    constructor(){

    }
}

//const characterActions = new CharacterActions();

export {
  CharacterActions
}
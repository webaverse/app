export class AvatarCharacterFace {
    constructor(character) {
        this.character = character;
        this.mouthMovementState=null;
        this.mouthMovementStartTime=0;
        this.mouthMovementAttackTime=0;
        this.mouthMovementDecayTime=0;
        this.mouthMovementSustainTime=0;
        this.mouthMovementReleaseTime=0;
    }
    
    update(timestamp, timeDiffS) {
        if (!this.character.avatar) {
            return;
        }
        //#################################### manually set mouth movement ##########################################
        const _handleMouthMovementAttack=()=>{
            this.character.avatar.volume = ((timestamp/1000 - this.mouthMovementStartTime) / this.mouthMovementAttackTime)/12;
            if(timestamp/1000 - this.mouthMovementStartTime >= this.mouthMovementAttackTime){
                this.mouthMovementState = 'decay';
                this.mouthMovementStartTime = timestamp/1000;
            }
        }
        const _handleMouthMovementDecay=()=>{
            this.character.avatar.volume = (1 - ((timestamp/1000 - this.mouthMovementStartTime) / this.mouthMovementDecayTime) * 0.8)/12;
            if(timestamp/1000 - this.mouthMovementStartTime >= this.mouthMovementDecayTime){
                this.mouthMovementState='sustain';
                this.mouthMovementStartTime = timestamp/1000;
            }
        }
        const _handleMouthMovementSustain=()=>{
            if(timestamp/1000 - this.mouthMovementStartTime >= this.mouthMovementSustainTime){
                this.mouthMovementState='release';
                this.mouthMovementStartTime = timestamp/1000;
            } 
        }
        const _handleMouthMovementRelease=()=>{
            this.character.avatar.volume = (0.2 - ((timestamp/1000 - this.mouthMovementStartTime) / this.mouthMovementReleaseTime) * 0.2)/12;
            if(timestamp/1000 - this.mouthMovementStartTime >= this.mouthMovementReleaseTime){
                this.mouthMovementState=null;
                this.enableAudioWorkerSetVolume=false;
                this.mouthMovementStartTime = -1;
            }
        }
        const _handleMouthMovementInit = () =>{
            this.mouthMovementState = !this.enableAudioWorkerSetVolume ? 'attack' : null;
            this.mouthMovementStartTime = timestamp / 1000;
        }
        switch (this.mouthMovementState) {
            case 'attack': {
                _handleMouthMovementAttack();
                break;
            }
            case 'decay': {
                _handleMouthMovementDecay();
                break;
            }
            case 'sustain': {
                _handleMouthMovementSustain();
                break;
            }
            case 'release': {
                _handleMouthMovementRelease();
                break;
            }
            case 'init': {
                _handleMouthMovementInit();
                break;
            }
        }
    }
    setMouthMoving(attack, decay, sustain, release){
        this.mouthMovementState='init';
        this.enableAudioWorkerSetVolume=true;
        this.mouthMovementAttackTime=attack;
        this.mouthMovementDecayTime=decay;
        this.mouthMovementSustainTime=sustain;
        this.mouthMovementReleaseTime=release;
    }
    destroy() {
        // nothing
    }
  }
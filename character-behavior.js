class CharacterBehavior {
    constructor(player) {
        this.player = player;
        this.manuallySetMouthState=null;
        this.manuallySetMouthStartTime=0;
        this.manuallySetMouthAttackTime=0;
        this.manuallySetMouthDecayTime=0;
        this.manuallySetMouthSustainTime=0;
        this.manuallySetMouthReleaseTime=0;
    }
    
    update(timestamp, timeDiffS) {
        if (!this.player.avatar) {
            return;
        }
        //#################################### manually set mouth movement ##########################################
        const _handleMouthMovementAttack=()=>{
            this.player.avatar.volume = ((timestamp/1000 - this.manuallySetMouthStartTime) / this.manuallySetMouthAttackTime)/12;
            if(timestamp/1000 - this.manuallySetMouthStartTime >= this.manuallySetMouthAttackTime){
                this.manuallySetMouthState = 'decay';
                this.manuallySetMouthStartTime = timestamp/1000;
            }
        }
        const _handleMouthMovementDecay=()=>{
            this.player.avatar.volume = (1 - ((timestamp/1000 - this.manuallySetMouthStartTime) / this.manuallySetMouthDecayTime) * 0.8)/12;
            if(timestamp/1000 - this.manuallySetMouthStartTime >= this.manuallySetMouthDecayTime){
                this.manuallySetMouthState='sustain';
                this.manuallySetMouthStartTime = timestamp/1000;
            }
        }
        const _handleMouthMovementSustain=()=>{
            if(timestamp/1000 - this.manuallySetMouthStartTime >= this.manuallySetMouthSustainTime){
                this.manuallySetMouthState='release';
                this.manuallySetMouthStartTime = timestamp/1000;
            } 
        }
        const _handleMouthMovementRelease=()=>{
            this.player.avatar.volume = (0.2 - ((timestamp/1000 - this.manuallySetMouthStartTime) / this.manuallySetMouthReleaseTime) * 0.2)/12;
            if(timestamp/1000 - this.manuallySetMouthStartTime >= this.manuallySetMouthReleaseTime){
                this.manuallySetMouthState=null;
                this.player.avatar.manuallySetMouth=false;
                this.manuallySetMouthStartTime = -1;
            }
        }
        const _handleMouthMovementNull=()=>{
            this.manuallySetMouthState = this.player.avatar.manuallySetMouth ? 'attack' : null;
            this.manuallySetMouthStartTime = timestamp/1000;
        }
        switch (this.manuallySetMouthState) {
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
            case null: {
                _handleMouthMovementNull();
                break;
            }
        }
    }
    setMouthMoving(attack, decay, sustain, release){
        this.manuallySetMouthState=null;
        this.player.avatar.manuallySetMouth=true;
        this.manuallySetMouthAttackTime=attack;
        this.manuallySetMouthDecayTime=decay;
        this.manuallySetMouthSustainTime=sustain;
        this.manuallySetMouthReleaseTime=release;
    }
  }
  
  export {
    CharacterBehavior,
  };
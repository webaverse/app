import {NpcPlayer} from './character-controller.js';

class NpcManager extends EventTarget {
  constructor() {
    super();

    this.npcs = [];
  }

  createNpc({
    name,
    avatarApp,
    position,
    quaternion,
    scale,
  }) {
    const npcPlayer = new NpcPlayer();
    npcPlayer.name = name;

    let matrixNeedsUpdate = false;
    if (position) {
      npcPlayer.position.copy(position);
      matrixNeedsUpdate = true;
    }
    if (quaternion) {
      npcPlayer.quaternion.copy(quaternion);
      matrixNeedsUpdate = true;
    }
    if (scale) {
      npcPlayer.scale.copy(scale);
      matrixNeedsUpdate = true;
    }
    if (matrixNeedsUpdate) {
      npcPlayer.updateMatrixWorld();
    }

    npcPlayer.setAvatarApp(avatarApp);
    this.npcs.push(npcPlayer);

    this.dispatchEvent(new MessageEvent('npcadd', {
      data: {
        player: npcPlayer,
      },
    }));

    return npcPlayer;
  }

  destroyNpc(npcPlayer) {
    npcPlayer.destroy();

    const removeIndex = this.npcs.indexOf(npcPlayer);
    this.npcs.splice(removeIndex, 1);

    this.dispatchEvent(new MessageEvent('npcremove', {
      data: {
        player: npcPlayer,
      },
    }));
  }
}
const npcManager = new NpcManager();
export default npcManager;

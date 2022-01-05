
import gameManager from '../game';
import metaversefile from 'metaversefile';
export class HealthControl {
  constructor(isLocalPlayer) {
    this.health = 100;
    this.mana = 100;
    this.isLocalPlayer = isLocalPlayer;
    window.addEventListener('DOMContentLoaded', () => {
      this.display();
    });
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      console.log('player is incapacitated')
      // play death animation etc
    }
    // gameManager.playerDiorama.toggleShader();
    // window.dispatchEvent(new MessageEvent('playerHit'))
    this.display();
  }

  display() {
    if (this.isLocalPlayer) {
    document.getElementById('healthDisplay').innerHTML = `HP: ${this.health}`;
    document.getElementById('manaDisplay').innerHTML = `MP: ${this.mana}`;
  }
  }

  isDead() {
    return this.health < 1;
  }
}

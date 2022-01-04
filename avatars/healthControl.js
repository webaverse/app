
export class HealthControl {
  constructor() {
    this.health = 100;
    this.mana = 100;
  }

  takeDamage(damage) {
    console.log('damage');
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      // play death animation etc
    }
  }

  isDead() {
    return this.health < 1;
  }
}

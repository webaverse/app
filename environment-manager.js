class EnvironmentManager {
  constructor() {
    this.winds = [];
    
  }
  getWinds () {
    return this.winds;
  }
  setWinds (wind) {
    this.winds.push(wind);
  }
  removeWind (wind) {
    const index = this.winds.indexOf(wind);
    if (index > -1) {
        this.winds.splice(index, 1);
    }
  }
}

const environmentManager = new EnvironmentManager();

export {
    environmentManager,
};

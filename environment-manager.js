class EnvironmentManager {
  constructor() {
    this.windZones = [];
    
  }
  getWindZones () {
    return this.windZones;
  }
  addWindZone (wind) {
    this.windZones.push(wind);
  }
  removeWindZone (wind) {
    const index = this.windZones.indexOf(wind);
    if (index > -1) {
        this.windZones.splice(index, 1);
    }
  }
}

const environmentManager = new EnvironmentManager();

export {
    environmentManager,
};

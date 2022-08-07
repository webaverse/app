class SceneSettings {
  constructor(json) {
    this.allowFlying = json.allowFlying ?? true;
    this.allowNarutoRun = json.allowNarutoRun ?? true;
  }
}

class SceneSettingsManager {
  constructor() {
    this.sceneSettings = new SceneSettings({});
  }

  makeSceneSettings(json) {
    this.sceneSettings = new SceneSettings(json);
    return this.sceneSettings;
  }

  getSceneSettings() {
    return this.sceneSettings;
  }
}
const sceneSettingsManager = new SceneSettingsManager();
export default sceneSettingsManager;

class SceneSettingsManager {
  constructor() {
    this.sceneSettings = {};
  }

  makeSceneSettings(json) {
    this.sceneSettings = json || {};
  }

  getSceneSettings() {
    return this.sceneSettings;
  }
}

export const useSceneSettingsManager = (() => {
  let sceneSettingsManager;
  return () => {
    if (!sceneSettingsManager) {
      sceneSettingsManager = new SceneSettingsManager();
    }
    return sceneSettingsManager;
  };
})();

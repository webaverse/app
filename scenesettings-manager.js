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

  // traverse the scene to find scene settings from a scenesettings app
  findSceneSettings(scene) {
    const _recurse = (o) => {
      if (o.isApp) {
        return o.getSceneSettings();
      } else {
        for (const child of o.children) {
          const result = _recurse(child);
          if (result) {
            return result;
          }
        }
      }
    };
    for (const child of scene.children) {
      const result = _recurse(child);
      if (result) {
        return result;
      }
    }
  }
}

const sceneSettingsManager = new SceneSettingsManager();
export default sceneSettingsManager;

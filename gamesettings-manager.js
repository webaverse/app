class GameSettings {
  constructor(json) {
    this.allowFlying = json.allowFlying ?? true;
    this.allowNarutoRun = json.allowNarutoRun ?? true;
  }
}

class GameSettingsManager {
  constructor() {
    this.gameSettings = new GameSettings({});
  }

  makeGameSettings(json) {
    this.gameSettings = new GameSettings(json);
    return this.gameSettings;
  }

  getGameSettings() {
    return this.gameSettings;
  }
}
const gameSettingsManager = new GameSettingsManager();
export default gameSettingsManager;

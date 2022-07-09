class LoadingManager extends EventTarget {
  constructor() {
    super();
    this.progress = 0;
    this.totalAppCount = 0;
    this.loadedAppCount = 0;
    this.totalModuleCount = 0;
    this.loadedModuleCount = 0;
    this.appLoadedProgress = 0;
    this.moduleLoadedProgress = 0;
    this.isLoadStarted = true;
    this.isModuleLoaded = false;

    this.loadModuleWeight = 50;
    this.loadAppWeight = 50;
  }

  setModulePromises(modulePromises) {
    this.totalModuleCount = modulePromises.length;
    for (const p of modulePromises) {
      p.then(() => {
        this.loadedModuleCount++;
        console.log(`${this.loadedModuleCount} of ${this.totalModuleCount} modules are loaded`);
        this.loadingScreenOpen(true);
        this.calculateProgress();
        if (this.loadedModuleCount === this.totalModuleCount) this.isModuleLoaded = true;
      });
    }
  }

  setTotalAppsCount(count) {
    this.totalAppCount = count
  }

  // trackedAppAdded() {
  //   if (this.isLoadStarted) this.totalAppCount++;
  // }

  trackedAppLoaded() {
    if (!this.isLoadStarted) return;
    this.loadedAppCount++;
    console.log(`${this.loadedAppCount} of ${this.totalAppCount} apps are loaded`);
    this.calculateProgress();
  }

  startLoading() {
    this.loadingScreenOpen(true);
    this.isLoadStarted = true;
  }

  requestLoadEnd() {
    if (this.isModuleLoaded &&
            (this.totalAppCount === 0 || this.loadedAppCount >= this.totalAppCount)) this.endLoading();
  }

  endLoading() {
    this.isLoadStarted = false;
    this.totalAppCount = 0;
    this.loadedAppCount = 0;
    this.totalModuleCount = 0;
    this.loadedModuleCount = 0;
    this.progress = 0;
    console.log('load ended');
    this.loadingScreenProgress(100);
    setTimeout(() => {
      this.loadingScreenFullLoaded();
      this.loadingScreenOpen(false);
    }, 3000);
  }

  loadingScreenFullLoaded() {
    this.dispatchEvent(new MessageEvent('loadingscreenfullloaded'));
  }

  loadingScreenProgress(progress) {
    this.dispatchEvent(new MessageEvent('loadingscreenprogress', {
      data: {
        progress,
      },
    }));
  }

  loadingScreenOpen(isOpen) {
    this.dispatchEvent(new MessageEvent('loadingscreenopen', {
      data: {
        isOpen,
      },
    }));
  }

  calculateProgress() {
    if (!this.isModuleLoaded) {
      this.loadModuleWeight = 50;
      this.loadAppWeight = 50;
    } else {
      this.loadModuleWeight = 0;
      this.loadAppWeight = 100;
    }
    let progressApp = 0;
    let progressModule = 0;

    if (this.totalAppCount !== 0) {
      progressApp = (this.loadedAppCount * this.loadAppWeight) / this.totalAppCount;
    }

    if (this.totalModuleCount !== 0) {
      progressModule = (this.loadedModuleCount * this.loadModuleWeight) / this.totalModuleCount;
    }

    this.progress = progressApp + progressModule;

    this.loadingScreenProgress(this.progress);
    if (this.loadedAppCount >= this.totalAppCount && this.isModuleLoaded) {
      this.endLoading();
    }
  }
}

export const loadingManager = new LoadingManager();

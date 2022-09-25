class GPUTask {
  constructor(fn, parent) {
    this.fn = fn;
    this.parent = parent;

    this.live = true;
  }
  run() {
    this.live = false;
    this.fn();
  }
  cancel() {
    if (this.live) {
      this.live = false;
      this.parent.removeTask(this);
    }
  }
}
class GPUTaskManager {
  static numTasksPerTick = 4;
  constructor() {
    this.queue = [];
  }
  transact(fn) {
    const task = new GPUTask(fn, this);
    this.queue.push(task);
    return task;
  }
  update() {
    for (let i = 0; i < GPUTaskManager.numTasksPerTick; i++) {
      if (this.queue.length > 0) {
        const task = this.queue.shift();
        task.run();
      } else {
        break;
      }
    }
  }
  removeTask(task) {
    const index = this.queue.indexOf(task);
    this.queue.splice(index, 1);
  }
}

export {
  GPUTask,
  GPUTaskManager,
};

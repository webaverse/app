const geometryUtils = (() => {
  const scope = {};
  const NUM_WORKER = 4;
  scope.workers = [];
  scope.workingFlags = [];
  scope.resolves = [];
  scope.stagedRequests = [];

  for (let i = 0; i < NUM_WORKER; i++) {
    scope.workers.push(new Worker('./geometry-utils.worker.js', {type: 'module'}));
    scope.workingFlags.push(false);
    scope.resolves.push(() => {});

    scope.workers[i].onmessage = e => {
      if (e.data.message === 'generateChunk') {
        scope.resolves[e.data.workerIndex](e.data.output);
        if (scope.stagedRequests.length > 0) {
          const request = scope.stagedRequests.shift();
          scope.workers[e.data.workerIndex].postMessage({
            workerIndex: e.data.workerIndex,
            message: 'generateChunk',
            params: request.params
          });
          scope.resolves[e.data.workerIndex] = request.resolve;
        } else {
          scope.workingFlags[e.data.workerIndex] = false;
        }
      }
    }
  }

  scope.generateChunk = async (x, y, z, chunkSize, segment) => {
    return new Promise((resolve, reject) => {
      const idleWorkerIndex = scope.workingFlags.findIndex(e => e === false);
      if (idleWorkerIndex === -1) {
        scope.stagedRequests.push({params: [x, y, z, chunkSize, segment], resolve: resolve, reject: reject});
        // reject('no idle worker');
        return;
      }

      scope.workingFlags[idleWorkerIndex] = true;

      scope.workers[idleWorkerIndex].postMessage({
        workerIndex: idleWorkerIndex,
        message: 'generateChunk',
        params: [x, y, z, chunkSize, segment]
      });
      scope.resolves[idleWorkerIndex] = resolve;
    })
  }

  return scope;
})();

export default geometryUtils;

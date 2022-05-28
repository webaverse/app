import mobManager from '../mob-manager.js';

export default (app, component) => {
  mobManager.addMob(app);

  return {
    remove() {
      mobManager.removeMob(app);
    },
  };
};
import {notify} from '../../../notifications.js';

export default {
  changedAvatar: () => notify('All done!', 'Your avatar has been updated.'),
  notAllowed: () => notify('Oops!', "You can't do that right now."),

  cantEquip: () => notify(
    "Can't equip this item.",
    'Please select a different item.',
  ),

  changingAvatar: () => notify(
    'Getting changed.',
    'The system is updating your avatar.',
    Infinity,
  ),

  nothingToEquip: () => notify(
    'Nothing to equip.',
    'Please select an item to equip.',
  ),

  nothingToSpawn: () => notify(
    'Nothing to spawn.',
    'Please select an item to spawn.',
  ),
};

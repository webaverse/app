import * as Y from 'yjs';

let state = new Y.Doc();
export function getState() {
  return state;
}
export function setState(newState) {
  state = newState;
}
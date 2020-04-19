import reducer from './reducer';

function createStore(reducer) {
  let state;
  let listeners = [];

  function subscribe(listener) {
    listeners.push(listener);
  }

  function dispatch(action) {
    state = reducer(state, action);

    listeners.map(listener => listener())
  }
  
  function getState() {
    return state;
  }

  return {
    getState,
    dispatch,
    subscribe
  }
}

export default createStore(reducer);
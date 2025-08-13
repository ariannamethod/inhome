import {createRoot} from 'solid-js';
import {createStore, reconcile, unwrap, type SetStoreFunction} from 'solid-js/store';
import {State} from '../config/state';
import rootScope from '../lib/rootScope';

const [appState, _setAppState] = createRoot(() => createStore<State>({} as any));

const setAppState: SetStoreFunction<State> = ((...args: any[]) => {
  const key = args[0];

  (_setAppState as any)(...args);

  if(typeof key === 'object') {
    Object.keys(key).forEach((k) => {
      rootScope.managers.appStateManager.setByKey(
        k,
        unwrap(appState[k as keyof State])
      );
    });
  } else {
    rootScope.managers.appStateManager.setByKey(
      key as string,
      unwrap(appState[key as keyof State])
    );
  }
}) as SetStoreFunction<State>;

const setAppStateSilent = (key: any, value?: any) => {
  if(typeof(key) === 'object') {
    _setAppState(key);
    return;
  }

  _setAppState(key, reconcile(value));
};

const useAppState = () => [appState, setAppState] as const;

export {
  appState,
  useAppState,
  setAppState,
  setAppStateSilent
};

import {createMemo} from 'solid-js';
import {createStore, reconcile, produce} from 'solid-js/store';
import {ChatFull, UserFull} from '../layer';
import rootScope from '../lib/rootScope';
import type {AnyDialog} from '../lib/storages/dialogs';

type PeerFull = ChatFull | UserFull;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_LIMIT = 50;

const [state, setState] = createStore<{[peerId: PeerId]: PeerFull}>({});
const accessMap = new Map<PeerId, number>();

function removePeer(peerId: PeerId) {
  accessMap.delete(peerId);
  setState(produce((s) => {
    delete s[peerId];
  }));
}

export function clearFullPeersCache() {
  accessMap.clear();
  setState(reconcile({}, {merge: false}));
}

function evict() {
  const now = Date.now();
  // remove expired
  for(const [id, time] of accessMap) {
    if(now - time > CACHE_TTL) {
      removePeer(id);
    }
  }
  // remove least recently used if over limit
  if(accessMap.size > CACHE_LIMIT) {
    const sorted = [...accessMap.entries()].sort((a, b) => a[1] - b[1]);
    while(accessMap.size > CACHE_LIMIT && sorted.length) {
      const [id] = sorted.shift()!;
      removePeer(id);
    }
  }
}

const requestFullPeer = (peerId: PeerId) => {
  rootScope.managers.appProfileManager.getProfileByPeerId(peerId).then((fullPeer) => {
    setState(peerId, reconcile(fullPeer));
    accessMap.set(peerId, Date.now());
    evict();
  });
};

rootScope.addEventListener('peer_full_update', requestFullPeer);
rootScope.addEventListener('peer_deleted', removePeer);
rootScope.addEventListener('dialog_drop', (dialog: AnyDialog) => removePeer(dialog.peerId));
rootScope.managers.appImManager.addEventListener('peer_changed', clearFullPeersCache);

if(typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) clearFullPeersCache();
  });
}

export function useFullPeer(peerId: () => PeerId) {
  return createMemo(() => {
    const id = peerId();
    if(!id) return;

    evict();

    const ts = accessMap.get(id);
    if(ts && Date.now() - ts > CACHE_TTL) {
      removePeer(id);
    }

    let fullPeer = state[id];
    if(!fullPeer) {
      requestFullPeer(id);
      fullPeer = state[id];
    } else {
      accessMap.set(id, Date.now());
    }

    return fullPeer;
  });
}


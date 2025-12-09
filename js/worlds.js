// js/worlds.js
window.Worlds = (function () {
  const WORLD_STORE = 'worlds';
  const STATE_STORE = 'worldStates';

  async function listWorlds() {
    const worlds = await GameStorage.getAll(WORLD_STORE);
    worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    return worlds;
  }

  async function createWorld(name, seed) {
    const id = 'w_' + Date.now();
    const now = Date.now();
    const world = {
      id,
      name,
      seed,
      created: now,
      lastPlayed: now
    };
    await GameStorage.put(WORLD_STORE, world);
    return world;
  }

  async function deleteWorld(id) {
    await GameStorage.remove(WORLD_STORE, id);
    await GameStorage.remove(STATE_STORE, id);
  }

  async function getWorld(id) {
    return await GameStorage.get(WORLD_STORE, id);
  }

  async function touchWorld(id) {
    const world = await getWorld(id);
    if (!world) return;
    world.lastPlayed = Date.now();
    await GameStorage.put(WORLD_STORE, world);
  }

  async function saveWorldState(worldId, state) {
    await GameStorage.put(STATE_STORE, {
      worldId,
      state
    });
    await touchWorld(worldId);
  }

  async function loadWorldState(worldId) {
    const rec = await GameStorage.get(STATE_STORE, worldId);
    return rec ? rec.state : null;
  }

  return {
    listWorlds,
    createWorld,
    deleteWorld,
    getWorld,
    saveWorldState,
    loadWorldState,
    touchWorld
  };
})();

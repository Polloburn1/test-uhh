// js/ui_mainmenu.js
(async function () {
  const worldNameInput = document.getElementById('worldName');
  const worldSeedInput = document.getElementById('worldSeed');
  const worldListEl = document.getElementById('worldList');
  const createBtn = document.getElementById('createWorldBtn');

  async function refreshWorlds() {
    worldListEl.innerHTML = '';
    const worlds = await Worlds.listWorlds();
    if (!worlds.length) {
      const div = document.createElement('div');
      div.className = 'world-empty';
      div.textContent = 'No worlds yet. Create one above.';
      worldListEl.appendChild(div);
      return;
    }

    worlds.forEach(w => {
      const item = document.createElement('div');
      item.className = 'world-item';

      const meta = document.createElement('div');
      meta.className = 'world-meta';
      const created = w.created ? new Date(w.created).toLocaleString() : 'unknown';
      const last = w.lastPlayed ? new Date(w.lastPlayed).toLocaleString() : 'never';

      meta.innerHTML =
        `<strong>${w.name}</strong>` +
        `<small>Seed: ${w.seed}</small>` +
        `<small>Created: ${created}</small>` +
        `<small>Last played: ${last}</small>`;

      const actions = document.createElement('div');
      actions.className = 'world-actions';

      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.onclick = () => {
        window.location.href = 'game.html?worldId=' + encodeURIComponent(w.id);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'secondary';
      deleteBtn.onclick = async () => {
        if (confirm(`Delete world "${w.name}"?`)) {
          await Worlds.deleteWorld(w.id);
          refreshWorlds();
        }
      };

      actions.appendChild(playBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(meta);
      item.appendChild(actions);
      worldListEl.appendChild(item);
    });
  }

  createBtn.onclick = async () => {
    const name = worldNameInput.value.trim() || 'New World';
    let seed = worldSeedInput.value.trim();
    if (!seed) {
      seed = Math.floor(Math.random() * 1e9).toString();
    }
    await Worlds.createWorld(name, seed);
    worldNameInput.value = '';
    worldSeedInput.value = '';
    refreshWorlds();
  };

  await refreshWorlds();
})();

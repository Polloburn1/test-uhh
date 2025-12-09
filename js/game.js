// js/game.js
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const overlay = document.getElementById('overlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const saveQuitBtn = document.getElementById('saveQuitBtn');
  const quitBtn = document.getElementById('quitBtn');

  const topWorldName = document.getElementById('topWorldName');
  const topSeed = document.getElementById('topSeed');
  const topScore = document.getElementById('topScore');

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  const hostOfferBtn = document.getElementById('hostOfferBtn');
  const hostOfferBox = document.getElementById('hostOfferBox');
  const hostAnswerBox = document.getElementById('hostAnswerBox');
  const hostApplyAnswerBtn = document.getElementById('hostApplyAnswerBtn');

  const clientOfferBox = document.getElementById('clientOfferBox');
  const clientCreateAnswerBtn = document.getElementById('clientCreateAnswerBtn');
  const clientAnswerBox = document.getElementById('clientAnswerBox');

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  const worldId = getQueryParam('worldId');
  if (!worldId) {
    alert('No worldId specified, returning to title.');
    window.location.href = 'index.html';
    return;
  }

  let worldMeta = null;
  let player = null;
  let coins = [];
  let keys = {};
  let paused = false;

  let remotePlayer = {
    active: false,
    x: 0,
    y: 0,
    size: 20,
    score: 0,
    color: '#f97316'
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      togglePause();
    } else {
      keys[e.key] = true;
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  resumeBtn.onclick = () => togglePause();
  quitBtn.onclick = () => {
    window.location.href = 'index.html';
  };

  saveQuitBtn.onclick = async () => {
    const state = {
      player,
      coins
    };
    await Worlds.saveWorldState(worldId, state);
    window.location.href = 'index.html';
  };

  function togglePause() {
    paused = !paused;
    overlay.style.visibility = paused ? 'visible' : 'hidden';
  }

  function setNetStatus(connected) {
    if (connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Not connected';
    }
  }

  hostOfferBtn.onclick = async () => {
    hostOfferBox.value = 'Generating offer...';
    try {
      const sdp = await Net.hostCreateOffer();
      hostOfferBox.value = sdp;
    } catch (e) {
      hostOfferBox.value = 'Error creating offer. Check console.';
      console.error(e);
    }
  };

  hostApplyAnswerBtn.onclick = async () => {
    const answerStr = hostAnswerBox.value.trim();
    if (!answerStr) return alert('Paste the client answer first.');
    try {
      await Net.hostApplyAnswer(answerStr);
    } catch (e) {
      alert('Failed to apply answer. Check console.');
      console.error(e);
    }
  };

  clientCreateAnswerBtn.onclick = async () => {
    const offerStr = clientOfferBox.value.trim();
    if (!offerStr) return alert('Paste the host offer first.');
    clientAnswerBox.value = 'Generating answer...';
    try {
      const answer = await Net.clientCreateAnswer(offerStr);
      clientAnswerBox.value = answer;
    } catch (e) {
      clientAnswerBox.value = 'Error creating answer. Check console.';
      console.error(e);
    }
  };

  Net.onMessage(msg => {
    if (msg.type === 'state') {
      remotePlayer.active = true;
      remotePlayer.x = msg.x;
      remotePlayer.y = msg.y;
      remotePlayer.score = msg.score;
    }
  });

  setInterval(() => {
    setNetStatus(Net.isConnected());
  }, 500);

  function sendStateIfConnected() {
    if (!Net.isConnected() || !player) return;
    Net.send({
      type: 'state',
      x: player.x,
      y: player.y,
      score: player.score
    });
  }

  setInterval(sendStateIfConnected, 80);

  async function init() {
    worldMeta = await Worlds.getWorld(worldId);
    if (!worldMeta) {
      alert('World not found. Returning to title.');
      window.location.href = 'index.html';
      return;
    }

    topWorldName.textContent = worldMeta.name;
    topSeed.textContent = 'Seed ' + worldMeta.seed;

    const savedState = await Worlds.loadWorldState(worldId);
    if (savedState) {
      player = savedState.player;
      coins = savedState.coins;
      topScore.textContent = player.score;
    } else {
      const initial = WorldGen.generateWorld(
        worldMeta.seed.toString(),
        canvas.width,
        canvas.height
      );
      player = initial.player;
      coins = initial.coins;
      topScore.textContent = player.score;
    }

    await Worlds.touchWorld(worldId);
    requestAnimationFrame(loop);
  }

  function update() {
    if (paused || !player) return;

    if (keys['w']) player.y -= player.speed;
    if (keys['s']) player.y += player.speed;
    if (keys['a']) player.x -= player.speed;
    if (keys['d']) player.x += player.speed;

    player.x = Math.max(10, Math.min(canvas.width - player.size - 10, player.x));
    player.y = Math.max(30, Math.min(canvas.height - player.size - 10, player.y));

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (Math.abs(player.x - c.x) < 14 && Math.abs(player.y - c.y) < 14) {
        coins.splice(i, 1);
        player.score++;
        topScore.textContent = player.score;
      }
    }
  }

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#020617');
    grd.addColorStop(1, '#0f172a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 32, canvas.width, 1);
  }

  function draw() {
    if (!player) return;
    drawBackground();

    ctx.fillStyle = '#334155';
    for (let y = 40; y < canvas.height; y += 28) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    for (let x = 0; x < canvas.width; x += 28) {
      ctx.fillRect(x, 32, 1, canvas.height - 32);
    }

    ctx.fillStyle = '#facc15';
    coins.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.size, player.size, 6);
    ctx.fill();

    if (remotePlayer.active) {
      ctx.fillStyle = remotePlayer.color;
      ctx.beginPath();
      ctx.roundRect(remotePlayer.x, remotePlayer.y, remotePlayer.size, remotePlayer.size, 6);
      ctx.fill();

      ctx.fillStyle = '#e5e7eb';
      ctx.font = '11px system-ui';
      ctx.fillText('Peer', remotePlayer.x + remotePlayer.size / 2 - 12, remotePlayer.y - 4);
    }

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '13px system-ui';
    ctx.fillText('ESC = Menu | WASD to move', 12, 22);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  init();
})();

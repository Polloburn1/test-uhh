// js/worldgen.js
window.WorldGen = (function () {

  function mulberry32(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function seedToNumber(seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = (h * 31 + seedStr.charCodeAt(i)) | 0;
    }
    return Math.abs(h) || 1;
  }

  function generateWorld(seedStr, width, height) {
    const seedNum = seedToNumber(seedStr);
    const rand = mulberry32(seedNum);

    const player = {
      x: width * 0.2,
      y: height * 0.5,
      size: 20,
      speed: 4,
      score: 0,
      color: '#38bdf8'
    };

    const coins = [];
    const coinCount = 24;
    for (let i = 0; i < coinCount; i++) {
      coins.push({
        x: Math.floor(rand() * (width - 40)) + 20,
        y: Math.floor(rand() * (height - 60)) + 40,
        size: 10
      });
    }

    return { player, coins };
  }

  return {
    generateWorld
  };
})();

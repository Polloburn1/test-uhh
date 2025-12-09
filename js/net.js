// js/net.js
window.Net = (function () {
  let pc = null;
  let dataChannel = null;
  let onMessageHandler = null;

  const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  function log(...args) {
    console.log('[P2P]', ...args);
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // wait until gathering complete to read full SDP
      }
    };

    pc.onicegatheringstatechange = () => {
      log('ICE gathering state:', pc.iceGatheringState);
    };

    pc.onconnectionstatechange = () => {
      log('Connection state:', pc.connectionState);
    };

    pc.ondatachannel = (event) => {
      dataChannel = event.channel;
      setupDataChannel();
    };
  }

  function setupDataChannel() {
    if (!dataChannel) return;
    log('Data channel created:', dataChannel.label);

    dataChannel.onopen = () => {
      log('Data channel open');
    };

    dataChannel.onclose = () => {
      log('Data channel closed');
    };

    dataChannel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (onMessageHandler) onMessageHandler(msg);
      } catch (e) {
        console.warn('Invalid P2P message', e);
      }
    };
  }

  function waitForIceComplete() {
    return new Promise((resolve) => {
      if (!pc) return resolve();
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        pc.addEventListener('icegatheringstatechange', function handler() {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', handler);
            resolve();
          }
        });
      }
    });
  }

  async function hostCreateOffer() {
    createPeerConnection();

    dataChannel = pc.createDataChannel('game');
    setupDataChannel();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceComplete();

    const desc = pc.localDescription;
    return JSON.stringify(desc);
  }

  async function hostApplyAnswer(answerStr) {
    if (!pc) throw new Error('PeerConnection not created yet');
    const desc = JSON.parse(answerStr);
    await pc.setRemoteDescription(desc);
  }

  async function clientCreateAnswer(offerStr) {
    createPeerConnection();

    const offerDesc = JSON.parse(offerStr);
    await pc.setRemoteDescription(offerDesc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceComplete();

    const desc = pc.localDescription;
    return JSON.stringify(desc);
  }

  function send(msgObj) {
    if (!dataChannel || dataChannel.readyState !== 'open') return;
    try {
      dataChannel.send(JSON.stringify(msgObj));
    } catch (e) {
      console.warn('Send failed', e);
    }
  }

  function onMessage(fn) {
    onMessageHandler = fn;
  }

  function isConnected() {
    return dataChannel && dataChannel.readyState === 'open';
  }

  return {
    hostCreateOffer,
    hostApplyAnswer,
    clientCreateAnswer,
    send,
    onMessage,
    isConnected
  };
})();

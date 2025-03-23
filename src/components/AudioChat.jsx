import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const AudioChat = () => {
  const [myId, setMyId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const myAudio = useRef();
  const remoteAudio = useRef();
  const peerInstance = useRef(null);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setMyId(id));

    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        call.answer(stream);
        myAudio.current.srcObject = stream;
        call.on('stream', (remoteStream) => {
          remoteAudio.current.srcObject = remoteStream;
        });
      });
    });

    peerInstance.current = peer;
  }, []);

  const callPeer = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      myAudio.current.srcObject = stream;
      const call = peerInstance.current.call(remotePeerId, stream);
      call.on('stream', (remoteStream) => {
        remoteAudio.current.srcObject = remoteStream;
      });
    });
  };

  return (
    <div>
      <h2>Appel vocal pair à pair</h2>
      <p>Mon ID : <strong>{myId}</strong></p>
      <input
        placeholder="ID du correspondant"
        value={remotePeerId}
        onChange={(e) => setRemotePeerId(e.target.value)}
      />
      <button onClick={callPeer}>Appeler</button>
      <audio ref={myAudio} autoPlay muted />
      <audio ref={remoteAudio} autoPlay />
    </div>
  );
};

export default AudioChat;
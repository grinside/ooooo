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
    <div className="p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-xl font-bold mb-4">00000 - Appel Vocal P2P</h1>
      <p className="mb-2">Mon ID : <strong>{myId}</strong></p>
      <input
        className="border p-2 rounded w-full mb-2"
        placeholder="ID du correspondant"
        value={remotePeerId}
        onChange={(e) => setRemotePeerId(e.target.value)}
      />
      <button
        onClick={callPeer}
        className="bg-blue-500 text-white w-full p-2 rounded"
      >
        Appeler
      </button>
      <audio ref={myAudio} autoPlay muted className="hidden" />
      <audio ref={remoteAudio} autoPlay />
    </div>
  );
};

export default AudioChat;

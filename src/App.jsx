import React, { useState, useEffect } from 'react';
import UserCircle from './components/UserCircle';
import ExtendedCircle from './components/ExtendedCircle';
import ChatOverview from './components/ChatOverview';
import ChatBox from './components/ChatBox';
import { users } from './utils/data';
import Peer from 'peerjs';

function App() {
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [activeChat, setActiveChat] = useState(null);
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});

  useEffect(() => {
    const newPeer = new Peer(selectedUser.id, {
      host: '64.227.77.156', // remplace par ton IP publique ou localhost si local
      port: 9000,
      path: '/myapp'
    });

    newPeer.on('open', (id) => {
      console.log(`PeerJS connecté avec l'ID : ${id}`);
    });

    newPeer.on('connection', (conn) => {
      conn.on('data', (data) => {
        alert(`Message reçu de ${conn.peer} : ${data}`);
      });
    });

    setPeer(newPeer);
    return () => newPeer.destroy();
  }, [selectedUser]);

  return (
    <div className="app">
      <UserCircle user={selectedUser} setActiveChat={setActiveChat} />
      <ExtendedCircle user={selectedUser} />
      <ChatOverview user={selectedUser} setActiveChat={setActiveChat} />
      {activeChat && <ChatBox user={selectedUser} friend={activeChat} closeChat={() => setActiveChat(null)} peer={peer} />}
    </div>
  );
}

export default App;
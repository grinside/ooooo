import React, { useState } from 'react';
import UserCircle from './components/UserCircle';
import ExtendedCircle from './components/ExtendedCircle';
import ChatOverview from './components/ChatOverview';
import ChatBox from './components/ChatBox';
import { users } from './utils/data';

function App() {
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="app">
      <UserCircle user={selectedUser} setActiveChat={setActiveChat} />
      <ExtendedCircle user={selectedUser} />
      <ChatOverview user={selectedUser} setActiveChat={setActiveChat} />
      {activeChat && <ChatBox user={selectedUser} friend={activeChat} closeChat={() => setActiveChat(null)} />}
    </div>
  );
}

export default App;
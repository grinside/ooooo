import React from 'react';
import UserCircle from './components/UserCircle';
import ExtendedCircle from './components/ExtendedCircle';
import ChatOverview from './components/ChatOverview';

function App() {
  return (
    <div className="app">
      <UserCircle />
      <ExtendedCircle />
      <ChatOverview />
    </div>
  );
}

export default App;

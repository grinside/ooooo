import React, { useState } from 'react';
import AudioChat from './components/AudioChat';

function App() {
  const [view, setView] = useState('home');

  return (
    <div className="container">
      <h1>00000 - Réseau Social P2P</h1>
      <nav>
        <button onClick={() => setView('chat')}>Accéder au Chat</button>
        <button onClick={() => setView('peers')}>Voir les Connexions</button>
      </nav>
      <div style={{ marginTop: '1rem' }}>
        {view === 'chat' && <AudioChat />}
        {view === 'peers' && (
          <div>
            <p>Fonctionnalité de visualisation des connexions à venir.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
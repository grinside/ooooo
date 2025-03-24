import React, { useState, useEffect } from 'react';
import { saveData, loadData } from '../utils/storage';

function ChatBox({ user, friend, closeChat, peer }) {
  const chatKey = [user.id, friend.id].sort().join('-');
  const [messages, setMessages] = useState(loadData(chatKey) || []);
  const [input, setInput] = useState('');
  const [conn, setConn] = useState(null);

  useEffect(() => {
    if (peer && friend.id) {
      const connection = peer.connect(friend.id);
      connection.on('open', () => {
        console.log('Connexion établie avec', friend.id);
        setConn(connection);
      });
    }
  }, [peer, friend]);

  useEffect(() => {
    saveData(chatKey, messages);
  }, [messages]);

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage = { from: user.id, content: input };
      setMessages([...messages, newMessage]);
      if (conn) conn.send(input);
      setInput('');
    }
  };

  return (
    <div className="chat-box">
      <h3>Chat avec {friend.id}</h3>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}><strong>{msg.from}</strong>: {msg.content}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
      <button onClick={sendMessage}>Envoyer</button>
      <button onClick={closeChat}>Fermer</button>
    </div>
  );
}

export default ChatBox;

import React, { useState, useEffect } from 'react';
import { saveData, loadData } from '../utils/storage';

function ChatBox({ user, friend, closeChat }) {
  const chatKey = `chat-${user.id}-${friend.id}`;
  const [messages, setMessages] = useState(loadData(chatKey) || []);
  const [input, setInput] = useState('');

  useEffect(() => {
    saveData(chatKey, messages);
  }, [messages]);

  const sendMessage = () => {
    setMessages([...messages, { from: user.id, content: input }]);
    setInput('');
  };

  return (
    <div>
      <h3>Chat avec {friend.id}</h3>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.from}: {msg.content}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Envoyer</button>
      <button onClick={closeChat}>Fermer</button>
    </div>
  );
}

export default ChatBox;

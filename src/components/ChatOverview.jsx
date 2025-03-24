import React from 'react';
import { users } from '../utils/data';

function ChatOverview({ user, setActiveChat }) {
  return (
    <div>
      <h2>Chats Disponibles :</h2>
      {user.friends.map(id => {
        const friend = users.find(u => u.id === id);
        return (
          <div key={friend.id} onClick={() => setActiveChat(friend)}>
            Conversation avec {friend.id}
          </div>
        );
      })}
    </div>
  );
}

export default ChatOverview;
import React from 'react';
import { users } from '../utils/data';

function UserCircle({ user, setActiveChat }) {
  const directFriends = user.friends.map(id => users.find(u => u.id === id));

  return (
    <div>
      <h2>Amis directs :</h2>
      {directFriends.map(friend => (
        <div key={friend.id} onClick={() => setActiveChat(friend)}>
          {friend.id}
        </div>
      ))}
    </div>
  );
}

export default UserCircle;
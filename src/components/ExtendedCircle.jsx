import React from 'react';
import { users } from '../utils/data';

function ExtendedCircle({ user }) {
  const extendedFriends = user.friends.flatMap(id => {
    const friend = users.find(u => u.id === id);
    return friend ? friend.friends.map(fid => users.find(u => u.id === fid)) : [];
  });

  return (
    <div>
      <h2>Amis de mes amis :</h2>
      {extendedFriends.map(friend => (
        <div key={friend.id}>{friend.id}</div>
      ))}
    </div>
  );
}

export default ExtendedCircle;

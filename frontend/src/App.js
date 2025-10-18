import React, { useState } from 'react';
import Login from './components/Login';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import { getUser } from './api';

export default function App(){
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ps_user')); } catch(e){ return null; }
  });

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <header>
        <h1>Public Space</h1>
        <div>
          <button onClick={() => { localStorage.removeItem('ps_user'); setUser(null); }}>Logout</button>
        </div>
      </header>
      <main>
        <aside className="sidebar">
          <h3>Profile</h3>
          <p><strong>{user.username}</strong></p>
          <p>Friends: {user.friendCount ?? '—'}</p>
        </aside>
        <section className="content">
          <CreatePost user={user} onPosted={() => getUser(user.id).then(u => setUser(u))} />
          <Feed user={user} />
        </section>
      </main>
    </div>
  );
}

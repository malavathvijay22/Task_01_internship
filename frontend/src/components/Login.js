import React, { useState } from 'react';
import { signup, getUser } from '../api';

export default function Login({ onLogin }){
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function doSignup() {
    setLoading(true);
    const u = await signup(name.trim());
    const full = await getUser(u.id);
    onLogin(full);
    setLoading(false);
  }

  return (
    <div className="center">
      <h2>Welcome — pick a username</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="username" />
      <button disabled={!name || loading} onClick={doSignup}>Enter</button>
      <p className="hint">Tip: create two accounts to add as friends and test post limits.</p>
    </div>
  );
}

import React, { useState } from 'react';
import { createPost, getUser } from '../api';

export default function CreatePost({ user, onPosted }){
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  async function submit(e){
    e.preventDefault();
    const fd = new FormData();
    fd.append('userId', user.id);
    if (text) fd.append('text', text);
    if (file) fd.append('media', file);
    setStatus('Posting...');
    const res = await createPost(fd);
    if (res && res.error) setStatus(res.error);
    else { setStatus('Posted'); setText(''); setFile(null); onPosted && onPosted(); }
    setTimeout(()=>setStatus(''), 2000);
  }

  async function addAFriend(){
    const friendName = prompt('Friend username to add (must exist)');
    if (!friendName) return;
    const f = await fetch((process.env.REACT_APP_API_URL||'http://localhost:4000') + '/api/signup', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username: friendName})}).then(r=>r.json());
    await fetch((process.env.REACT_APP_API_URL||'http://localhost:4000') + '/api/friend', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({userId: user.id, friendId: f.id})});
    const updated = await getUser(user.id);
    localStorage.setItem('ps_user', JSON.stringify(updated));
    alert('Friend added — refresh sidebar shows count.');
  }

  return (
    <div className="create-post">
      <form onSubmit={submit}>
        <textarea placeholder={`What's up, ${user.username}?`} value={text} onChange={e=>setText(e.target.value)} />
        <div className="controls">
          <input type="file" accept="image/*,video/*" onChange={e=>setFile(e.target.files[0])} />
          <button type="submit">Post</button>
          <button type="button" onClick={addAFriend}>Add Friend (test)</button>
        </div>
      </form>
      <div className="status">{status}</div>
      <div className="rules">
        <small>Posting rules: 1/day by default. 2 friends => 2/day. &gt;10 friends => unlimited. 0 friends => cannot post.</small>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { likePost, commentPost, sharePost } from '../api';

export default function Post({ p, me, refresh }){
  const [comment, setComment] = useState('');

  async function doLike(){ await likePost(p.id, me.id); refresh(); }
  async function doComment(){ if (!comment) return; await commentPost(p.id, me.id, comment); setComment(''); refresh(); }
  async function doShare(){ await sharePost(p.id); refresh(); }

  return (
    <div className="post">
      <div className="post-header"><strong>{p.username}</strong> · <span>{new Date(p.created_at).toLocaleString()}</span></div>
      <div className="post-body">
        {p.text && <p>{p.text}</p>}
        {p.media_path && p.media_type === 'image' && <img src={(process.env.REACT_APP_API_URL||'http://localhost:4000') + p.media_path} alt="media" />}
        {p.media_path && p.media_type === 'video' && <video controls src={(process.env.REACT_APP_API_URL||'http://localhost:4000') + p.media_path} />}
      </div>
      <div className="post-actions">
        <button onClick={doLike}>Like ({p.likes})</button>
        <button onClick={doShare}>Share ({p.shares||0})</button>
      </div>
      <div className="post-comment">
        <input placeholder="Write a comment" value={comment} onChange={e=>setComment(e.target.value)} />
        <button onClick={doComment}>Comment</button>
      </div>
    </div>
  );
}

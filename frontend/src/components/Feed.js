import React, { useEffect, useState } from 'react';
import { getPosts } from '../api';
import Post from './Post';

export default function Feed({ user }){
  const [posts, setPosts] = useState([]);

  async function load(){
    const p = await getPosts();
    setPosts(p);
  }
  useEffect(()=>{ load(); const iv = setInterval(load, 5000); return ()=>clearInterval(iv); }, []);

  return (
    <div className="feed">
      {posts.map(p => <Post key={p.id} p={p} me={user} refresh={load} />)}
    </div>
  );
}

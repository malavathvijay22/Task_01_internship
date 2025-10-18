const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';
export async function signup(username) {
  const res = await fetch(API + '/api/signup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username }) });
  return res.json();
}
export async function addFriend(userId, friendId) {
  const res = await fetch(API + '/api/friend', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ userId, friendId }) });
  return res.json();
}
export async function getUser(id) { const r = await fetch(API + '/api/user/' + id); return r.json(); }
export async function createPost(formData) {
  const r = await fetch(API + '/api/posts', { method: 'POST', body: formData });
  return r.json();
}
export async function getPosts() { const r = await fetch(API + '/api/posts'); return r.json(); }
export async function likePost(id, userId) { const r = await fetch(API + '/api/posts/' + id + '/like', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId })}); return r.json(); }
export async function commentPost(id, userId, text) { const r = await fetch(API + '/api/posts/' + id + '/comment', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId, text })}); return r.json(); }
export async function sharePost(id) { const r = await fetch(API + '/api/posts/' + id + '/share', { method: 'POST' }); return r.json(); }

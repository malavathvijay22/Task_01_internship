// index.js — Express + Mongoose backend for Public Space (MongoDB Atlas)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const mongoose = require('mongoose');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('Set MONGO_URI environment variable to your Atlas connection string.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('Connected to MongoDB')).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const { Schema, model, Types } = mongoose;

const CommentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: null },
  mediaPath: { type: String, default: null },
  mediaType: { type: String, enum: ['image','video', null], default: null },
  createdAt: { type: Date, default: Date.now },
  shares: { type: Number, default: 0 },
  likes: [{ type: Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema]
});
const Post = model('Post', PostSchema);

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  friends: [{ type: Types.ObjectId, ref: 'User' }]
});
const User = model('User', UserSchema);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = shortid.generate();
    cb(null, id + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(UPLOAD_DIR));

function startOfToday() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}

app.post('/api/signup', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username });
    }
    res.json({ id: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/friend', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) return res.status(400).json({ error: 'userId and friendId required' });
    if (userId === friendId) return res.status(400).json({ error: 'cannot friend self' });

    const [u, f] = await Promise.all([User.findById(userId), User.findById(friendId)]);
    if (!u || !f) return res.status(404).json({ error: 'user or friend not found' });

    if (!u.friends.includes(f._id)) u.friends.push(f._id);
    if (!f.friends.includes(u._id)) f.friends.push(u._id);
    await u.save();
    await f.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({
      id: user._id,
      username: user.username,
      created_at: user.createdAt,
      friendCount: user.friends ? user.friends.length : 0,
      friends: user.friends || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', upload.single('media'), async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'user not found' });

    const friendCount = (user.friends || []).length;
    let allowed = 1;
    if (friendCount === 0) allowed = 0;
    else if (friendCount === 2) allowed = 2;
    else if (friendCount > 10) allowed = Infinity;

    const since = startOfToday();
    const todayCount = await Post.countDocuments({ userId: user._id, createdAt: { $gte: since } });

    if (todayCount >= allowed) {
      return res.status(403).json({ error: 'posting limit reached for today', allowed, todayCount });
    }

    let mediaPath = null;
    let mediaType = null;
    if (req.file) {
      mediaPath = '/uploads/' + path.basename(req.file.path);
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      userId: user._id,
      text: text || null,
      mediaPath,
      mediaType
    });

    const populated = await Post.findById(post._id).populate('userId', 'username').lean();
    res.json({
      id: populated._id,
      user_id: populated.userId._id,
      username: populated.userId.username,
      text: populated.text,
      media_path: populated.mediaPath,
      media_type: populated.mediaType,
      created_at: populated.createdAt,
      shares: populated.shares,
      likes: populated.likes.length,
      comments: populated.comments.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'username')
      .lean();

    const out = posts.map(p => ({
      id: p._id,
      user_id: p.userId._id,
      username: p.userId.username,
      text: p.text,
      media_path: p.mediaPath,
      media_type: p.mediaType,
      created_at: p.createdAt,
      shares: p.shares || 0,
      likes: (p.likes || []).length,
      comments: (p.comments || []).length
    }));
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });

    const uid = mongoose.Types.ObjectId(userId);
    const idx = post.likes.findIndex(l => l.equals(uid));
    if (idx >= 0) {
      post.likes.splice(idx, 1);
      await post.save();
      return res.json({ liked: false, likes: post.likes.length });
    } else {
      post.likes.push(uid);
      await post.save();
      return res.json({ liked: true, likes: post.likes.length });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ error: 'userId and text required' });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
    post.comments.push({ userId, text });
    await post.save();

    await post.populate({ path: 'comments.userId', select: 'username' });
    const comments = post.comments.map(c => ({
      id: c._id,
      userId: c.userId._id,
      username: c.userId.username,
      text: c.text,
      createdAt: c.createdAt
    }));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/share', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
    post.shares = (post.shares || 0) + 1;
    await post.save();
    res.json({ shares: post.shares });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend (Mongo) listening on', PORT));

import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { auth } from '../middleware/auth';

const router = express.Router();

// 게시글 스키마 정의
const postSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  content: z.string().min(1, { message: '내용을 입력해주세요.' }),
  isImportant: z.boolean().optional().default(false),
});

// 게시글 목록 조회 API
router.get('/posts', auth, async (req, res) => {
  try {
    const posts = await db.query(
      `SELECT p.*, u.username as "authorName"
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       ORDER BY p.is_important DESC, p.created_at DESC`
    );
    
    // snake_case에서 camelCase로 변환
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author_id,
      authorName: post.authorName,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      isImportant: post.is_important
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('게시글 목록 조회 에러:', error);
    res.status(500).json({ error: '게시글 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 게시글 상세 조회 API
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await db.query(
      `SELECT p.*, u.username as "authorName"
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (post.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    
    // snake_case에서 camelCase로 변환
    const formattedPost = {
      id: post[0].id,
      title: post[0].title,
      content: post[0].content,
      authorId: post[0].author_id,
      authorName: post[0].authorName,
      createdAt: post[0].created_at,
      updatedAt: post[0].updated_at,
      isImportant: post[0].is_important
    };
    
    res.json(formattedPost);
  } catch (error) {
    console.error('게시글 조회 에러:', error);
    res.status(500).json({ error: '게시글을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 게시글 작성 API
router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content, isImportant = false } = postSchema.parse(req.body);
    
    // 작성자 정보 확인
    if (!req.user?.id) {
      return res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
    }
    
    // 관리자만 중요 게시글 작성 가능
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'manager';
    const postImportant = isAdmin ? isImportant : false;
    
    const newPost = await db.query(
      `INSERT INTO posts (title, content, author_id, is_important, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title, content, req.user.id, postImportant]
    );
    
    // 작성자 정보 조회
    const user = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [req.user.id]
    );
    
    // 응답 데이터 구성
    const formattedPost = {
      id: newPost[0].id,
      title: newPost[0].title,
      content: newPost[0].content,
      authorId: newPost[0].author_id,
      authorName: user[0]?.username || 'Unknown',
      createdAt: newPost[0].created_at,
      updatedAt: newPost[0].updated_at,
      isImportant: newPost[0].is_important
    };
    
    res.status(201).json(formattedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('게시글 작성 에러:', error);
    res.status(500).json({ error: '게시글을 작성하는 중 오류가 발생했습니다.' });
  }
});

// 게시글 수정 API
router.put('/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isImportant } = postSchema.parse(req.body);
    
    // 게시글 존재 여부 확인
    const existingPost = await db.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    
    if (existingPost.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    
    // 작성자 또는 관리자만 수정 가능
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'manager';
    const isAuthor = existingPost[0].author_id === req.user.id;
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: '게시글을 수정할 권한이 없습니다.' });
    }
    
    // 관리자만 중요 게시글 설정 가능
    const postImportant = isAdmin ? (isImportant ?? existingPost[0].is_important) : existingPost[0].is_important;
    
    const updatedPost = await db.query(
      `UPDATE posts
       SET title = $1, content = $2, is_important = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, content, postImportant, id]
    );
    
    // 작성자 정보 조회
    const user = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [updatedPost[0].author_id]
    );
    
    // 응답 데이터 구성
    const formattedPost = {
      id: updatedPost[0].id,
      title: updatedPost[0].title,
      content: updatedPost[0].content,
      authorId: updatedPost[0].author_id,
      authorName: user[0]?.username || 'Unknown',
      createdAt: updatedPost[0].created_at,
      updatedAt: updatedPost[0].updated_at,
      isImportant: updatedPost[0].is_important
    };
    
    res.json(formattedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('게시글 수정 에러:', error);
    res.status(500).json({ error: '게시글을 수정하는 중 오류가 발생했습니다.' });
  }
});

// 게시글 삭제 API
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 게시글 존재 여부 확인
    const existingPost = await db.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    
    if (existingPost.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    
    // 작성자 또는 관리자만 삭제 가능
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'manager';
    const isAuthor = existingPost[0].author_id === req.user.id;
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: '게시글을 삭제할 권한이 없습니다.' });
    }
    
    await db.query(
      'DELETE FROM posts WHERE id = $1',
      [id]
    );
    
    res.status(204).end();
  } catch (error) {
    console.error('게시글 삭제 에러:', error);
    res.status(500).json({ error: '게시글을 삭제하는 중 오류가 발생했습니다.' });
  }
});

export default router; 
import { db } from '../db';

async function createPostsTable() {
  try {
    // 테이블이 이미 존재하는지 확인
    const tableExists = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'posts'
      )`
    );
    
    if (!tableExists[0].exists) {
      // 게시글 테이블 생성
      await db.query(`
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          is_important BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('게시글 테이블이 생성되었습니다.');
    } else {
      console.log('게시글 테이블이 이미 존재합니다.');
    }
  } catch (error) {
    console.error('게시글 테이블 생성 중 오류:', error);
  }
}

export { createPostsTable }; 
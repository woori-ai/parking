import { Sequelize } from 'sequelize';

// DATABASE_URL 환경 변수에서 연결 문자열 가져오기
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다. Railway 환경 변수를 확인하세요.');
}

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 연결 성공!');
    return true;
  } catch (error) {
    console.error('PostgreSQL 연결 실패:', error);
    return false;
  }
};

export default sequelize;

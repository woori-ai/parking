import { Sequelize } from 'sequelize';

console.log('>>> Attempting to read DATABASE_URL...');
const databaseUrl = process.env.DATABASE_URL;
console.log('>>> Read DATABASE_URL value:', databaseUrl);

if (!databaseUrl) {
  console.error('>>> ERROR: DATABASE_URL is missing or empty!');
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다. Railway 환경 변수를 확인하세요.');
}
console.log('>>> DATABASE_URL seems valid, creating Sequelize instance...');

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

console.log('>>> Sequelize instance created successfully.');

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

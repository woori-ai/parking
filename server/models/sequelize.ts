import { Sequelize } from 'sequelize';

// 개별 환경 변수 사용
const dbName = process.env.PGDATABASE;
const dbUser = process.env.PGUSER;
const dbHost = process.env.PGHOST;
const dbPassword = process.env.PGPASSWORD;
const dbPort = process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432;

// 필수 변수 확인
if (!dbName || !dbUser || !dbHost || !dbPassword) {
  throw new Error('데이터베이스 연결에 필요한 환경 변수(PGDATABASE, PGUSER, PGHOST, PGPASSWORD)가 모두 설정되지 않았습니다.');
}

console.log('>>> DATABASE_URL seems valid, creating Sequelize instance...');

// Sequelize 인스턴스 생성 (개별 변수 사용)
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
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

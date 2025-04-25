import { Sequelize } from 'sequelize';

// 개별 환경 변수 사용
console.log('>>> Reading PGDATABASE:', process.env.PGDATABASE);
const dbName = process.env.PGDATABASE;
console.log('>>> Reading PGUSER:', process.env.PGUSER);
const dbUser = process.env.PGUSER;
console.log('>>> Reading PGHOST:', process.env.PGHOST);
const dbHost = process.env.PGHOST;
console.log('>>> Reading PGPASSWORD:', process.env.PGPASSWORD ? '******' : 'undefined');
const dbPassword = process.env.PGPASSWORD;
console.log('>>> Reading PGPORT:', process.env.PGPORT);
const dbPort = process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432;

// 필수 변수 확인
if (!dbName || !dbUser || !dbHost || !dbPassword) {
  console.error('>>> ERROR: Missing required PG* environment variables!');
  throw new Error('데이터베이스 연결에 필요한 환경 변수(PGDATABASE, PGUSER, PGHOST, PGPASSWORD)가 모두 설정되지 않았습니다.');
}

console.log(`>>> Creating Sequelize with: user=${dbUser}, host=${dbHost}, port=${dbPort}, db=${dbName}`);

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

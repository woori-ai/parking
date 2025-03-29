#!/bin/bash
set -e

until node -e "const { Sequelize } = require('sequelize'); const sequelize = new Sequelize('postgresql://postgres:postgres@postgres:5432/parking_management', { dialect: 'postgres' }); sequelize.authenticate().then(() => { console.log('데이터베이스 연결 성공'); process.exit(0); }).catch(err => { console.error('데이터베이스 연결 실패:', err); process.exit(1); });"
do
  echo "데이터베이스 연결 대기 중..."
  sleep 2
done

echo "데이터베이스 연결 완료, 초기화 시작..."
npx tsx server/scripts/initDb.ts

# 앱 실행
npm run dev 
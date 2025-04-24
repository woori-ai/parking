#!/bin/bash
set -e

until node -e "const { Sequelize } = require('sequelize'); const sequelize = new Sequelize('postgresql://postgres:postgres@postgres:5432/parking_management', { dialect: 'postgres' }); sequelize.authenticate().then(() => { console.log('데이터베이스 연결 성공'); process.exit(0); }).catch(err => { console.error('데이터베이스 연결 실패:', err); process.exit(1); });"
do
  echo "데이터베이스 연결 대기 중..."
  sleep 2
done

echo "데이터베이스 연결 완료, 애플리케이션 시작..."
# 초기화 스크립트 호출 제거

# 앱 실행
npm run dev 
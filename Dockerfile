FROM node:18-alpine

WORKDIR /app

# 시스템 패키지 설치
RUN apk add --no-cache bash

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5000

# 데이터베이스 초기화 및 애플리케이션 실행
CMD /bin/bash -c 'until node -e "const { Sequelize } = require('\''sequelize'\''); const sequelize = new Sequelize('\''postgresql://postgres:postgres@postgres:5432/parking_management'\'', { dialect: '\''postgres'\'' }); sequelize.authenticate().then(() => { console.log('\''데이터베이스 연결 성공'\''); process.exit(0); }).catch(err => { console.error('\''데이터베이스 연결 실패:'\'' ,err); process.exit(1); });"; do echo "데이터베이스 연결 대기 중..."; sleep 2; done && echo "데이터베이스 초기화 시작..." && npx tsx server/scripts/initDb.ts && npm run dev' 
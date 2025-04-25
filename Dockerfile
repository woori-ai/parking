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

# 빌드된 애플리케이션 실행
CMD ["npm", "run", "start"] 
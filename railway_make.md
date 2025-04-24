# Railway 배포 가이드

## 1. Railway 계정 설정
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. GitHub 저장소와 Railway 연동

## 2. 프로젝트 배포

### 2.1 백엔드 배포
1. Railway 대시보드에서 "New Project" 선택
2. "Deploy from GitHub repo" 선택
3. ParkingManagement 저장소 선택
4. 서버 디렉토리(`server`)를 배포 대상으로 선택
5. 환경 변수 설정:
   ```
   DATABASE_URL=postgresql://...
   PORT=5000
   NODE_ENV=production
   ```

### 2.2 PostgreSQL 데이터베이스 설정
1. Railway 대시보드에서 "New" → "Database" → "PostgreSQL" 선택
2. 데이터베이스 생성
3. 생성된 데이터베이스 연결 정보를 백엔드 환경 변수에 설정

### 2.3 프론트엔드 배포
1. 새로운 서비스로 프론트엔드(`client` 디렉토리) 배포
2. 환경 변수 설정:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

## 3. 도메인 설정
- Railway가 자동으로 도메인 제공
- 필요한 경우 커스텀 도메인 설정 가능

## 4. 배포 후 확인사항
1. 백엔드 API 엔드포인트 접속 테스트
2. 프론트엔드 웹사이트 접속 테스트
3. 데이터베이스 연결 확인
4. 환경 변수가 올바르게 설정되었는지 확인

## 5. 문제 해결
- 로그 확인: Railway 대시보드의 "Logs" 섹션
- 환경 변수 확인: "Variables" 섹션
- 배포 상태 확인: "Deployments" 섹션 
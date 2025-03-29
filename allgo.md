# 주차 관리 시스템 프로젝트 분석

## 1. 프로젝트 개요

이 프로젝트는 주차 관리를 위한 웹 기반 시스템으로, TypeScript, React, Express 등의 기술을 사용하여 구현되어 있습니다. 시스템은 주차 관리, 방문자 관리, 직원 관리 등의 기능을 제공합니다.

## 2. 기술 스택

### 2.1 프론트엔드
- **React**: 사용자 인터페이스 구현
- **TypeScript**: 타입 안전성이 강화된 JavaScript
- **React Query**: 서버 상태 관리
- **Wouter**: 라우팅 라이브러리
- **Shadcn UI 컴포넌트**: UI 컴포넌트 (Radix UI 기반)
- **Tailwind CSS**: CSS 프레임워크

### 2.2 백엔드
- **Express**: Node.js 웹 프레임워크
- **TypeScript**: 서버 측 코드 작성
- **Drizzle ORM**: 데이터베이스 ORM
- **PostgreSQL**: 관계형 데이터베이스
- **Zod**: 데이터 검증 라이브러리

### 2.3 인프라
- **Docker**: 컨테이너화
- **도커 컴포즈**: 멀티 컨테이너 애플리케이션 실행

## 3. 프로젝트 구조

```
ParkingManagement/
├── client/               # 프론트엔드 코드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── contexts/     # React 컨텍스트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── lib/          # 유틸리티 함수
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── services/     # API 서비스
│   │   ├── types/        # 타입 정의
│   │   ├── App.tsx       # 애플리케이션 메인 컴포넌트
│   │   └── main.tsx      # 애플리케이션 진입점
│   └── index.html        # HTML 템플릿
├── server/               # 백엔드 코드
│   ├── models/           # 데이터 모델
│   ├── routes/           # API 라우트 정의
│   ├── scripts/          # 유틸리티 스크립트
│   ├── storage/          # 스토리지 관련 코드
│   ├── migration/        # 데이터베이스 마이그레이션
│   ├── app.ts            # Express 앱 설정
│   ├── index.ts          # 서버 진입점
│   ├── routes.ts         # 라우트 정의
│   ├── storage.ts        # 스토리지 구현
│   └── vite.ts           # Vite 개발 서버 설정
├── shared/               # 공유 코드
│   └── schema.ts         # 데이터베이스 스키마 및 타입 정의
├── Dockerfile            # Docker 이미지 정의
├── docker-compose.yml    # Docker 컴포즈 설정
├── package.json          # 프로젝트 의존성 및 스크립트
└── tsconfig.json         # TypeScript 설정
```

## 4. 기능 분석

### 4.1 인증 시스템
- 사용자 로그인/로그아웃 기능
- 역할 기반 접근 제어 (관리자, 매니저, 직원)
- 세션 관리

### 4.2 주차 관리
- 주차 기록 등록 및 조회
- 차량 입/출차 관리
- 차량 검색 기능

### 4.3 방문자 관리
- 방문자 예약 등록
- 방문자 차량 관리
- 방문 기록 조회

### 4.4 직원 관리
- 직원 계정 관리
- 직원 정보 조회 및 수정
- 등록 요청 처리

### 4.5 매니저 관리
- 매니저 작업 기록
- 출/퇴근 체크
- 업무 감독

### 4.6 게시판 기능
- 게시물 작성/조회/수정/삭제
- 댓글 기능
- 공지사항 및 일반 게시물 구분

### 4.7 도움말 시스템
- 업무 도움말 제공
- 문의 기능

### 4.8 채팅 시스템
- 사용자 간 메시지 교환
- 읽음 상태 관리

## 5. 데이터베이스 스키마

주요 테이블 구조는 다음과 같습니다:

1. **employees**: 직원 정보 저장
   - id, username, password, email, phone, carNumber, position, isAdmin

2. **registrationRequests**: 등록 요청 정보
   - id, username, password, email, phone, carNumber, position, requestDate

3. **admins**: 관리자 정보
   - id, username, password, phone

4. **managerWorks**: 매니저 작업 기록
   - id, employeeId, password, phone, isWorking, workCheck, workDate, workTime

5. **boards**: 게시판 정보
   - id, title, description, ownerId, ownerType, isManagerBoard, createdAt, updatedAt

6. **boardPosts**: 게시물 정보
   - id, boardId, title, content, authorId, authorType, createdAt, updatedAt

7. **parkingRecords**: 주차 기록
   - id, carNumber, inDate, inTime, outDate, outTime, entryTimestamp, exitTimestamp

8. **visitorReservations**: 방문자 예약 정보
   - id, visitorName, carNumber, visitDate, visitPurpose, contactNumber, inDate, inTime, outDate, outTime, registeredById

9. **chatMessages**: 채팅 메시지
   - id, senderId, receiverId, message, timestamp, isRead

10. **jobHelp**: 업무 도움말
    - id, title, content, createdBy, createdAt, updatedAt

## 6. API 구조

서버는 Express를 사용하여 RESTful API를 제공합니다. 주요 API 엔드포인트:

- `/api/session`: 세션 관리 (GET, POST, DELETE)
- `/api/employees`: 직원 관리
- `/api/registration`: 등록 요청 관리
- `/api/parking`: 주차 관리
- `/api/visitors`: 방문자 관리
- `/api/boards`: 게시판 관리
- `/api/chat`: 채팅 메시지 관리
- `/api/help`: 도움말 관리

## 7. 클라이언트 측 라우팅

React 애플리케이션에서 Wouter를 사용하여 다음과 같은 주요 경로를 정의합니다:

- `/login`: 로그인 페이지
- `/parking`: 주차 관리 페이지 (관리자/매니저)
- `/visitors`: 방문자 관리 페이지
- `/employees`: 직원 관리 페이지
- `/managers`: 매니저 관리 페이지
- `/registration-requests`: 등록 요청 페이지
- `/help`: 도움말 페이지
- `/board`: 게시판 페이지
- `/employee`: 직원 홈 페이지
- `/profile`: 프로필 페이지
- `/register-visitor`: 방문자 등록 페이지

## 8. 개발 및 배포 환경

### 8.1 개발 환경
- Vite: 개발 서버 및 빌드 도구
- TypeScript: 타입 체크 및 컴파일
- EsLint: 코드 품질 관리

### 8.2 배포 환경
- Docker: 애플리케이션 컨테이너화
- Docker Compose: 다중 컨테이너 조율
- Node.js: 서버 실행 환경
- PostgreSQL: 데이터 저장소

## 9. 결론 및 개선점

이 주차 관리 시스템은 직원, 방문자, 주차 관리를 위한 종합적인 솔루션을 제공합니다. 타입스크립트와 현대적인 웹 개발 스택을 활용하여 구현되어 있으며, Docker를 통해 배포가 용이합니다.

### 향후 개선 가능 영역:

1. **모바일 최적화**: 모바일 디바이스에서의 사용성 개선
2. **실시간 알림**: 웹소켓을 활용한 실시간 알림 시스템 구현
3. **보고서 및 통계**: 주차 데이터 분석 및 보고서 기능 추가
4. **결제 통합**: 주차 요금 결제 시스템 통합
5. **다국어 지원**: 다양한 언어 지원을 위한 국제화
6. **사용자 경험 개선**: UI/UX 개선 및 접근성 향상
7. **보안 강화**: 인증 및 권한 관리 시스템 강화
8. **테스트 추가**: 단위 테스트 및 통합 테스트 추가 
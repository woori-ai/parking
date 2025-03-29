import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, appCache } from "./storage";
import { z } from "zod";
import session from "express-session";
import { 
  loginSchema, 
  vehicleSearchSchema,
  insertEmployeeSchema,
  insertRegistrationRequestSchema,
  insertAdminSchema,
  insertManagerWorkSchema,
  insertParkingRecordSchema,
  insertVisitorReservationSchema,
  insertChatMessageSchema,
  insertJobHelpSchema,
  insertBoardSchema,
  insertBoardPostSchema
} from "@shared/schema";
import express from 'express';
import bcrypt from "bcrypt";

// Define interface for authenticated session
interface AuthenticatedSession extends session.Session {
  userId?: number;
  userRole?: "employee" | "admin";
  username?: string;
}

// Chat message type
type ChatMessagePayload = {
  senderId: number;
  receiverId: number;
  message: string;
};

export const boardRouter = express.Router();

// 게시판 목록 조회
boardRouter.get('/', async (req, res) => {
  try {
    const boards = await storage.getBoards();
    res.json(boards);
  } catch (error) {
    console.error('Error getting boards:', error);
    res.status(500).json({ error: 'Failed to get boards' });
  }
});

// 게시판 상세 조회
boardRouter.get('/:id', async (req, res) => {
  try {
    const board = await storage.getBoardById(parseInt(req.params.id));
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board);
  } catch (error) {
    console.error('Error getting board:', error);
    res.status(500).json({ error: 'Failed to get board' });
  }
});

// 사용자별 게시판 조회
boardRouter.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const ownerType = req.query.ownerType as 'employee' | 'manager';
    
    if (!ownerType || (ownerType !== 'employee' && ownerType !== 'manager')) {
      return res.status(400).json({ error: 'Invalid owner type' });
    }
    
    const board = await storage.getBoardByOwnerId(parseInt(ownerId));
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    res.json(board);
  } catch (error) {
    console.error('Error getting board by owner:', error);
    res.status(500).json({ error: 'Failed to get board by owner' });
  }
});

// 게시판 생성
boardRouter.post('/', async (req, res) => {
  try {
    const boardData = insertBoardSchema.parse(req.body);
    const board = await storage.createBoard(boardData);
    res.status(201).json(board);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// 게시판 수정
boardRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const boardData = req.body;
    
    const updatedBoard = await storage.updateBoard(parseInt(id), boardData);
    if (!updatedBoard) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    res.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// 게시판 삭제
boardRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteBoard(parseInt(id));
    
    if (!success) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

export const boardPostRouter = express.Router();

// 게시판의 게시글 목록 조회
boardPostRouter.get('/board/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const posts = await storage.getBoardPosts(parseInt(boardId));
    res.json(posts);
  } catch (error) {
    console.error('Error getting board posts:', error);
    res.status(500).json({ error: 'Failed to get board posts' });
  }
});

// 게시글 상세 조회
boardPostRouter.get('/:id', async (req, res) => {
  try {
    const post = await storage.getBoardPostById(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error getting board post:', error);
    res.status(500).json({ error: 'Failed to get board post' });
  }
});

// 게시글 생성
boardPostRouter.post('/', async (req, res) => {
  try {
    const postData = insertBoardPostSchema.parse(req.body);
    const post = await storage.createBoardPost(postData);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating board post:', error);
    res.status(500).json({ error: 'Failed to create board post' });
  }
});

// 게시글 수정
boardPostRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postData = req.body;
    
    const updatedPost = await storage.updateBoardPost(parseInt(id), postData);
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating board post:', error);
    res.status(500).json({ error: 'Failed to update board post' });
  }
});

// 게시글 삭제
boardPostRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteBoardPost(parseInt(id));
    
    if (!success) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting board post:', error);
    res.status(500).json({ error: 'Failed to delete board post' });
  }
});

export const router = express.Router();

// ... 기존 라우트 등록 ...

// 게시판 라우트 등록
router.use('/boards', boardRouter);
router.use('/board-posts', boardPostRouter);

// ... 기존 코드 ...

// 게시글 스키마 정의
const postSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  content: z.string().min(1, { message: '내용을 입력해주세요.' }),
  isImportant: z.boolean().optional().default(false),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // 캐시 시스템 활성화 로그
  console.log("🚀 캐시 시스템 활성화 (기본 TTL: 30초)");
  console.log("📊 캐시 사용량 및 성능을 모니터링합니다.");

  // 캐시 통계 관련 변수
  let cacheHits = 0;
  let cacheMisses = 0;

  // 원래 get 메서드 백업
  const originalGet = appCache.get;
  
  // 캐시 통계를 위해 get 메서드 오버라이드
  appCache.get = function(key: string): any | null {
    const value = originalGet.call(this, key);
    if (value !== null) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
    return value;
  };
  
  // 매 5분마다 캐시 성능 통계 출력
  setInterval(() => {
    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests * 100).toFixed(2) : 0;
    
    console.log(`===== 캐시 성능 통계 =====`);
    console.log(`총 캐시 요청: ${totalRequests}`);
    console.log(`캐시 적중: ${cacheHits}, 캐시 미스: ${cacheMisses}`);
    console.log(`캐시 적중률: ${hitRate}%`);
    console.log(`===========================`);
  }, 5 * 60 * 1000); // 5분마다

  // Session setup
  app.use(
    session({
      secret: "parking-management-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 쿠키 전송 (프로덕션)
        httpOnly: true, // JavaScript에서 쿠키에 접근 불가
        sameSite: 'lax', // CSRF 방지
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      }
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    const session = req.session as AuthenticatedSession;
    if (!session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // 세션 정보를 req.user로 설정하여 다른 미들웨어/라우트 핸들러에서 사용할 수 있게 함
    (req as any).user = {
      id: session.userId,
      role: session.userRole,
      username: session.username
    };
    
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    const session = req.session as AuthenticatedSession;
    if (!session.userId || session.userRole !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };
  
  const requireManagerOrAdmin = (req: Request, res: Response, next: Function) => {
    const session = req.session as AuthenticatedSession;
    if (!session.userId || session.userRole !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      // 요청 데이터 파싱
      const { username, password } = req.body;
      
      console.log('로그인 시도:', username);
      
      // validateCredentials 메서드를 사용하여 사용자 인증
      const { user, role } = await storage.validateCredentials(username, password);
      
      if (user && role) {
        // 세션 설정
        const session = req.session as AuthenticatedSession;
        session.userId = user.id;
        session.userRole = role;
        session.username = user.username;
        
        console.log(`로그인 성공: ${username}, 역할: ${role}`);
        
        // 성공 응답
        return res.status(200).json({ 
          id: user.id, 
          username: user.username, 
          role: role 
        });
      }
      
      // 인증 실패
      console.log('로그인 실패: 잘못된 인증 정보');
      return res.status(401).json({ message: "Invalid credentials" });
    } catch (err) {
      console.error('로그인 오류:', err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/session", (req, res) => {
    const session = req.session as AuthenticatedSession;
    if (session.userId) {
      return res.status(200).json({
        userId: session.userId,
        role: session.userRole,
        username: session.username
      });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Employee routes
  app.get("/api/employees", requireAdmin, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "employees:all";
      let employees = appCache.get(cacheKey);

      if (!employees) {
        console.log("캐시 미스: 사원 목록");
        employees = await storage.getEmployees();
        appCache.set(cacheKey, employees);
      } else {
        console.log("캐시 히트: 사원 목록");
      }

      res.status(200).json(employees);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const session = req.session as AuthenticatedSession;
      
      // 세션에 userId가 없으면 인증되지 않은 것으로 처리
      if (!session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Employees can only access their own data unless they are admins
      if (session.userRole === "employee" && session.userId.toString() !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // 캐시에서 데이터 조회
      const cacheKey = `employees:${id}`;
      let employee = appCache.get(cacheKey);

      if (!employee) {
        console.log(`캐시 미스: 사원 정보 (ID: ${id})`);
        // ID를 숫자로 변환하여 전달
        employee = await storage.getEmployeeById(parseInt(id));
        if (employee) {
          appCache.set(cacheKey, employee);
        }
      } else {
        console.log(`캐시 히트: 사원 정보 (ID: ${id})`);
      }
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.status(200).json(employee);
    } catch (err) {
      console.error("Error fetching employee:", err);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireAdmin, async (req, res) => {
    try {
      console.log("Creating employee with data:", req.body);
      const data = insertEmployeeSchema.parse(req.body);
      console.log("Parsed data:", data);
      const employee = await storage.createEmployee(data);

      // 캐시 무효화
      appCache.invalidatePattern("employees:");
      console.log("캐시 무효화: 사원 목록 및 상세 정보");

      res.status(201).json(employee);
    } catch (err) {
      console.error("Error creating employee:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      
      // 사용자 이름 중복 오류 처리
      if (err instanceof Error && err.message === "Username already exists") {
        return res.status(400).json({ message: "이미 존재하는 사용자 이름입니다." });
      }
      
      // 차량 번호 중복 오류 처리
      if (err instanceof Error && err.message === "Car number already exists") {
        return res.status(400).json({ message: "이미 등록된 차량 번호입니다." });
      }
      
      // MongoDB 유효성 검사 오류 처리
      if (err instanceof Error && err.message.includes("validation failed")) {
        return res.status(400).json({ message: "입력 데이터가 유효하지 않습니다. 모든 필수 필드를 입력해주세요." });
      }
      
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = req.session as AuthenticatedSession;
      
      // Employees can only update their own data unless they are admins
      if (session.userRole === "employee" && session.userId !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = req.body;
      
      // Non-admins cannot change isAdmin status
      if (session.userRole !== "admin") {
        delete data.isAdmin;
      }
      
      const employee = await storage.updateEmployee(id, data);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // 캐시 무효화 - 해당 사원 및 전체 목록
      appCache.invalidate(`employees:${id}`);
      appCache.invalidate("employees:all");
      console.log(`캐시 무효화: 사원 정보 (ID: ${id}) 및 목록`);
      
      res.status(200).json(employee);
    } catch (err) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // 캐시 무효화 - 해당 사원 및 전체 목록
      appCache.invalidate(`employees:${id}`);
      appCache.invalidate("employees:all");
      console.log(`캐시 무효화: 사원 정보 (ID: ${id}) 및 목록`);
      
      res.status(200).json({ message: "Employee deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Registration request routes
  app.post("/api/register", async (req, res) => {
    try {
      const data = insertRegistrationRequestSchema.parse(req.body);
      
      // Check if username already exists
      const existingEmployee = await storage.getEmployeeByUsername(data.username);
      if (existingEmployee) {
        return res.status(400).json({ message: "아이디가 이미 사용 중입니다." });
      }
      
      // 차량 번호 중복 확인
      const existingCarNumber = await storage.getEmployeeByCarNumber(data.carNumber);
      if (existingCarNumber) {
        return res.status(400).json({ message: "이미 등록된 차량 번호입니다." });
      }

      // 가입 신청 대신 바로 직원 테이블에 저장
      const employee = await storage.createEmployee({
        username: data.username,
        password: data.password,
        email: data.email || '',
        phone: data.phone,
        carNumber: data.carNumber,
        position: data.position || '',
        isAdmin: false
      });
      
      // 캐시 무효화 - 사원 목록
      appCache.invalidate("employees:all");
      console.log("캐시 무효화: 사원 목록");
      
      // 즉시 응답
      res.status(201).json({
        ...employee,
        message: "사원 등록이 완료되었습니다. 로그인 화면으로 이동합니다."
      });
    } catch (err) {
      console.error("Error creating employee:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "사원 등록에 실패했습니다." });
    }
  });

  app.get("/api/registration-requests", requireAdmin, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "registration-requests:all";
      let requests = appCache.get(cacheKey);

      if (!requests) {
        console.log("캐시 미스: 등록 요청 목록");
        requests = await storage.getRegistrationRequests();
        appCache.set(cacheKey, requests);
      } else {
        console.log("캐시 히트: 등록 요청 목록");
      }
      
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch registration requests" });
    }
  });

  app.post("/api/registration-requests/:id/approve", requireAdmin, async (req, res) => {
    try {
      // parseInt 제거하고 문자열 ID 그대로 사용
      const id = req.params.id;
      const employee = await storage.approveRegistrationRequest(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Registration request not found" });
      }
      
      // 캐시 무효화 - 등록 요청 목록 및 사원 목록
      appCache.invalidate("registration-requests:all");
      appCache.invalidate("employees:all");
      console.log("캐시 무효화: 등록 요청 목록 및 사원 목록");
      
      // 즉시 응답
      res.status(200).json({ message: "Registration approved", employee });
    } catch (err) {
      console.error("Error approving registration request:", err);
      res.status(500).json({ message: "Failed to approve registration request" });
    }
  });

  app.delete("/api/registration-requests/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRegistrationRequest(id);
      
      if (!success) {
        return res.status(404).json({ message: "Registration request not found" });
      }
      
      // 캐시 무효화 - 등록 요청 목록
      appCache.invalidate("registration-requests:all");
      console.log("캐시 무효화: 등록 요청 목록");
      
      res.status(200).json({ message: "Registration request rejected" });
    } catch (err) {
      res.status(500).json({ message: "Failed to reject registration request" });
    }
  });

  // Admin routes
  app.get("/api/admins", requireAdmin, async (req, res) => {
    try {
      const admins = await storage.getAdmins();
      res.status(200).json(admins);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.post("/api/admins", requireAdmin, async (req, res) => {
    try {
      // 사원 ID 가져오기
      const { employeeId } = req.body;
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }
      
      // 해당 사원 정보 가져오기
      const employee = await storage.getEmployeeById(parseInt(employeeId));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // 이미 관리자로 등록되어 있는지 확인
      const existingAdmin = await storage.getAdminByUsername(employee.username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists with this username" });
      }
      
      // 사원 정보를 바탕으로 관리자 생성
      const adminData = {
        username: employee.username,
        password: employee.password,
        phone: employee.phone
      };
      
      const admin = await storage.createAdmin(adminData);
      res.status(201).json(admin);
    } catch (err) {
      console.error("Admin creation error:", err);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  app.put("/api/admins/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const admin = await storage.updateAdmin(id, data);
      
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      res.status(200).json(admin);
    } catch (err) {
      res.status(500).json({ message: "Failed to update admin" });
    }
  });

  app.delete("/api/admins/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting superadmin
      const admin = await storage.getAdminByUsername("superadmin");
      if (admin && admin.id === id) {
        return res.status(403).json({ message: "Cannot delete superadmin" });
      }
      
      const success = await storage.deleteAdmin(id);
      
      if (!success) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      res.status(200).json({ message: "Admin deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete admin" });
    }
  });

  // Manager work routes
  app.get("/api/manager-works", requireAdmin, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "manager-works:all";
      let works = appCache.get(cacheKey);

      if (!works) {
        console.log("캐시 미스: 주차 담당자 목록");
        works = await storage.getManagerWorks();
        appCache.set(cacheKey, works);
      } else {
        console.log("캐시 히트: 주차 담당자 목록");
      }
      
      res.status(200).json(works);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch manager works" });
    }
  });

  app.get("/api/active-managers", requireAuth, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "active-managers:all";
      let managers = appCache.get(cacheKey);

      if (!managers) {
        console.log("캐시 미스: 활성 주차 담당자 목록");
        managers = await storage.getActiveManagers();
        appCache.set(cacheKey, managers);
      } else {
        console.log("캐시 히트: 활성 주차 담당자 목록");
      }
      
      res.status(200).json(managers);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch active managers" });
    }
  });

  app.post("/api/manager-works", requireAdmin, async (req, res) => {
    try {
      const data = insertManagerWorkSchema.parse(req.body);
      const work = await storage.createManagerWork(data);
      
      // 캐시 무효화 - 주차 담당자 목록 및 활성 담당자 목록
      appCache.invalidate("manager-works:all");
      appCache.invalidate("active-managers:all");
      console.log("캐시 무효화: 주차 담당자 목록 및 활성 담당자 목록");
      
      res.status(201).json(work);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create manager work" });
    }
  });

  app.put("/api/manager-works/:id", requireAuth, async (req, res) => {
    try {
      // ID를 숫자로 변환
      const id = parseInt(req.params.id);
      const session = req.session as AuthenticatedSession;
      
      // 자신의 정보만 수정 가능하거나 관리자인 경우 수정 가능
      if (session.userRole !== 'admin' && session.userId !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = req.body;
      const work = await storage.updateManagerWork(id, data);
      
      if (!work) {
        return res.status(404).json({ message: "Manager work not found" });
      }
      
      // 캐시 무효화 - 해당 주차 담당자, 전체 목록 및 활성 담당자 목록
      appCache.invalidate(`manager-works:${id}`);
      appCache.invalidate("manager-works:all");
      appCache.invalidate("active-managers:all");
      console.log(`캐시 무효화: 주차 담당자 정보 (ID: ${id}), 목록 및 활성 담당자`);
      
      res.status(200).json(work);
    } catch (err) {
      console.error("Error updating manager work:", err);
      res.status(500).json({ message: "Failed to update manager work" });
    }
  });

  app.delete("/api/manager-works/:id", requireAdmin, async (req, res) => {
    try {
      // ID를 숫자로 변환
      const id = parseInt(req.params.id);
      const success = await storage.deleteManagerWork(id);
      
      if (!success) {
        return res.status(404).json({ message: "Manager work not found" });
      }
      
      // 캐시 무효화 - 해당 주차 담당자, 전체 목록 및 활성 담당자 목록
      appCache.invalidate(`manager-works:${id}`);
      appCache.invalidate("manager-works:all");
      appCache.invalidate("active-managers:all");
      console.log(`캐시 무효화: 주차 담당자 정보 (ID: ${id}), 목록 및 활성 담당자`);
      
      res.status(200).json({ message: "Manager work deleted successfully" });
    } catch (err) {
      console.error("Error deleting manager work:", err);
      res.status(500).json({ message: "Failed to delete manager work" });
    }
  });

  // Parking routes
  app.get("/api/parking", requireAuth, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "parking:all";
      let records = appCache.get(cacheKey);

      if (!records) {
        console.log("캐시 미스: 주차 기록 목록");
        records = await storage.getParkingRecords();
        // TTL 60초로 설정
        appCache.set(cacheKey, records);
        console.log("주차 기록 목록 캐시 저장 (60초)");
      } else {
        console.log("캐시 히트: 주차 기록 목록");
      }
      
      res.status(200).json(records);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch parking records" });
    }
  });

  app.get("/api/parking/current", requireAuth, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "parking:current";
      let vehicles = appCache.get(cacheKey);

      if (!vehicles) {
        console.log("캐시 미스: 현재 주차 차량");
        // 실제 데이터베이스에서 현재 주차된 차량 조회
        vehicles = await storage.getCurrentlyParkedVehicles();
        // TTL 30초로 설정
        appCache.set(cacheKey, vehicles);
        console.log("현재 주차 차량 캐시 저장 (30초)");
      } else {
        console.log("캐시 히트: 현재 주차 차량");
      }
      
      res.status(200).json(vehicles);
    } catch (err) {
      console.error("Error fetching parked vehicles:", err);
      res.status(500).json({ message: "Failed to fetch currently parked vehicles" });
    }
  });

  app.get("/api/parking/search", requireAuth, async (req, res) => {
    try {
      const carNumber = req.query.carNumber as string;
      
      if (!carNumber || carNumber.length < 2) {
        return res.status(400).json({ message: "Car number must be at least 2 characters" });
      }
      
      // 캐시에서 데이터 조회 (차량 번호별로 캐시)
      const cacheKey = `parking:search:${carNumber}`;
      let records = appCache.get(cacheKey);

      if (!records) {
        console.log(`캐시 미스: 차량 검색 (번호: ${carNumber})`);
        console.log("Searching for car number:", carNumber);
        records = await storage.getParkingRecordsByCarNumber(carNumber);
        console.log("Found records:", records);
        // TTL 60초로 설정
        appCache.set(cacheKey, records);
        console.log(`차량 검색 결과 캐시 저장 (60초)`);
      } else {
        console.log(`캐시 히트: 차량 검색 (번호: ${carNumber})`);
      }
      
      res.status(200).json(records);
    } catch (err) {
      console.error("Error searching for parking records:", err);
      res.status(500).json({ message: "Failed to search parking records" });
    }
  });

  app.post("/api/parking", requireManagerOrAdmin, async (req, res) => {
    try {
      const data = insertParkingRecordSchema.parse(req.body);
      
      // Set entry timestamp if recording entry
      const entryData = {
        ...data,
        entryTimestamp: data.inDate && data.inTime && !data.outDate && !data.outTime ? new Date() : null
      };
      
      const record = await storage.createParkingRecord(entryData);
      
      // 캐시 무효화 - 주차 관련 모든 캐시
      appCache.invalidatePattern("parking:");
      console.log("캐시 무효화: 주차 관련 모든 데이터");
      
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create parking record" });
    }
  });

  app.put("/api/parking/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      // Set exit timestamp if recording exit
      if (data.outDate && data.outTime) {
        data.exitTimestamp = new Date();
      }
      
      const record = await storage.updateParkingRecord(id, data);
      
      if (!record) {
        return res.status(404).json({ message: "Parking record not found" });
      }
      
      // 캐시 무효화 - 주차 관련 모든 캐시
      appCache.invalidatePattern("parking:");
      console.log("캐시 무효화: 주차 관련 모든 데이터");
      
      res.status(200).json(record);
    } catch (err) {
      res.status(500).json({ message: "Failed to update parking record" });
    }
  });

  // Visitor reservation routes
  app.get("/api/visitor-reservations", requireAuth, async (req, res) => {
    try {
      // 캐시에서 데이터 조회
      const cacheKey = "visitor-reservations:all";
      let reservations = appCache.get(cacheKey);

      if (!reservations) {
        console.log("캐시 미스: 방문 예약 목록");
        // 실제 데이터베이스에서 가져오기
        reservations = await storage.getVisitorReservations();
        appCache.set(cacheKey, reservations);
      } else {
        console.log("캐시 히트: 방문 예약 목록");
      }
      
      res.status(200).json(reservations);
    } catch (err) {
      console.error("Error fetching visitor reservations:", err);
      res.status(500).json({ message: "Failed to fetch visitor reservations" });
    }
  });

  app.get("/api/visitor-reservations/date/:date?", requireAuth, async (req, res) => {
    try {
      const date = req.params.date || req.query.date as string;
      console.log("Visitor reservations date request:", date);
      
      // 캐시에서 데이터 조회 (날짜별로 캐시)
      const cacheKey = `visitor-reservations:date:${date}`;
      let reservations = appCache.get(cacheKey);

      if (!reservations) {
        console.log(`캐시 미스: 방문 예약 (날짜: ${date})`);
        // 실제 데이터베이스에서 지정된 날짜의 예약 가져오기
        reservations = await storage.getVisitorReservationsByDate(date);
        appCache.set(cacheKey, reservations);
      } else {
        console.log(`캐시 히트: 방문 예약 (날짜: ${date})`);
      }
      
      res.status(200).json(reservations);
    } catch (err) {
      console.error("Error fetching visitor reservations:", err);
      res.status(500).json({ message: "Failed to fetch visitor reservations by date" });
    }
  });

  app.post("/api/visitor-reservations", requireAuth, async (req, res) => {
    try {
      const session = req.session as AuthenticatedSession;
      
      // session.userId가 문자열인 경우 숫자로 변환
      const userId = typeof session.userId === 'string' ? parseInt(session.userId) : session.userId;
      
      const data = insertVisitorReservationSchema.parse({
        ...req.body,
        registeredById: userId
      });
      
      const reservation = await storage.createVisitorReservation(data);
      
      // 캐시 무효화 - 방문 예약 관련 모든 캐시
      appCache.invalidatePattern("visitor-reservations:");
      console.log("캐시 무효화: 방문 예약 관련 모든 데이터");
      
      res.status(201).json(reservation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error creating visitor reservation:", err);
      res.status(500).json({ message: "Failed to create visitor reservation" });
    }
  });

  app.put("/api/visitor-reservations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = req.session as AuthenticatedSession;
      const reservation = await storage.getVisitorReservationById(id);
      
      // Only allow creators, admins, and managers to update reservations
      if (!reservation) {
        return res.status(404).json({ message: "Visitor reservation not found" });
      }
      
      if (session.userRole === "employee" && reservation.registeredById !== session.userId) {
        return res.status(403).json({ message: "You can only update your own reservations" });
      }
      
      // Managers and admins can update any reservation
      
      const data = req.body;
      const updatedReservation = await storage.updateVisitorReservation(id, data);
      
      // 캐시 무효화 - 방문 예약 관련 모든 캐시
      appCache.invalidatePattern("visitor-reservations:");
      console.log("캐시 무효화: 방문 예약 관련 모든 데이터");
      
      res.status(200).json(updatedReservation);
    } catch (err) {
      res.status(500).json({ message: "Failed to update visitor reservation" });
    }
  });

  app.delete("/api/visitor-reservations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = req.session as AuthenticatedSession;
      const reservation = await storage.getVisitorReservationById(id);
      
      // Only allow creators, admins, and managers to delete reservations
      if (!reservation) {
        return res.status(404).json({ message: "Visitor reservation not found" });
      }
      
      if (session.userRole === "employee" && reservation.registeredById !== session.userId) {
        return res.status(403).json({ message: "You can only delete your own reservations" });
      }
      
      // Managers and admins can delete any reservation
      
      const success = await storage.deleteVisitorReservation(id);
      
      // 캐시 무효화 - 방문 예약 관련 모든 캐시
      appCache.invalidatePattern("visitor-reservations:");
      console.log("캐시 무효화: 방문 예약 관련 모든 데이터");
      
      res.status(200).json({ message: "Visitor reservation deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete visitor reservation" });
    }
  });

  // 주차 관리자 정보 조회 API 추가
  app.get("/api/manager-works/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const session = req.session as AuthenticatedSession;
      
      // 자신의 정보만 조회 가능하거나 관리자인 경우 조회 가능
      if (session.userRole !== 'admin' && session.userId !== Number(id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // 캐시에서 데이터 조회
      const cacheKey = `manager-works:${id}`;
      let managerWork = appCache.get(cacheKey);

      if (!managerWork) {
        console.log(`캐시 미스: 주차 담당자 정보 (ID: ${id})`);
        // 주차 관리자 정보 조회
        const managerWorks = await storage.getManagerWorks();
        managerWork = managerWorks.find(manager => manager.id.toString() === id);
        
        if (managerWork) {
          appCache.set(cacheKey, managerWork);
        }
      } else {
        console.log(`캐시 히트: 주차 담당자 정보 (ID: ${id})`);
      }
      
      if (!managerWork) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      res.status(200).json(managerWork);
    } catch (err) {
      console.error("Error fetching manager work:", err);
      res.status(500).json({ message: "Failed to fetch manager work" });
    }
  });

  // 캐시 통계 확인 API (Admin 전용)
  app.get("/api/admin/cache-stats", requireAdmin, (req, res) => {
    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests * 100).toFixed(2) : 0;
    
    res.status(200).json({
      cacheHits,
      cacheMisses,
      totalRequests,
      hitRate: `${hitRate}%`,
      timestamp: new Date().toISOString()
    });
  });
  
  // 캐시 초기화 API (Admin 전용)
  app.post("/api/admin/clear-cache", requireAdmin, (req, res) => {
    const pattern = req.body.pattern || '';
    
    if (pattern) {
      appCache.invalidatePattern(pattern);
      console.log(`캐시 부분 초기화: ${pattern}`);
      return res.status(200).json({ message: `Cache partially cleared with pattern: ${pattern}` });
    } else {
      // 모든 키에 대해 패턴 초기화
      appCache.invalidatePattern('');
      cacheHits = 0;
      cacheMisses = 0;
      console.log(`캐시 전체 초기화 완료`);
      return res.status(200).json({ message: 'All cache cleared' });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getAllPosts();
      
      res.json(posts);
    } catch (error) {
      console.error('게시글 목록 조회 에러:', error);
      res.status(500).json({ error: '게시글 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  app.get("/api/posts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const post = await storage.getPostById(id);
      
      if (!post) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('게시글 조회 에러:', error);
      res.status(500).json({ error: '게시글을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  app.post("/api/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, content, isImportant = false } = postSchema.parse(req.body);
      
      // 작성자 정보 확인
      if (!(req as any).user?.id) {
        return res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
      }
      
      // 관리자만 중요 게시글 작성 가능
      const isAdmin = (req as any).user.role === 'admin';
      const postImportant = isAdmin ? isImportant : false;
      
      const newPost = await storage.createPost({
        title,
        content,
        authorId: (req as any).user.id,
        isImportant: postImportant
      });
      
      res.status(201).json(newPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('게시글 작성 에러:', error);
      res.status(500).json({ error: '게시글을 작성하는 중 오류가 발생했습니다.' });
    }
  });

  app.put("/api/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, isImportant } = postSchema.parse(req.body);
      
      // 게시글 존재 여부 확인
      const existingPost = await storage.getPostById(id);
      
      if (!existingPost) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      
      // 작성자 또는 관리자만 수정 가능
      const isAdmin = (req as any).user.role === 'admin';
      const isAuthor = existingPost.authorId === (req as any).user.id.toString();
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ error: '게시글을 수정할 권한이 없습니다.' });
      }
      
      // 관리자만 중요 게시글 설정 가능
      const postImportant = isAdmin 
        ? (isImportant !== undefined ? isImportant : existingPost.isImportant) 
        : existingPost.isImportant;
      
      const updatedPost = await storage.updatePost(id, {
        title,
        content,
        isImportant: postImportant
      });
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('게시글 수정 에러:', error);
      res.status(500).json({ error: '게시글을 수정하는 중 오류가 발생했습니다.' });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 게시글 존재 여부 확인
      const existingPost = await storage.getPostById(id);
      
      if (!existingPost) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      
      // 작성자 또는 관리자만 삭제 가능
      const isAdmin = (req as any).user.role === 'admin';
      const isAuthor = existingPost.authorId === (req as any).user.id.toString();
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ error: '게시글을 삭제할 권한이 없습니다.' });
      }
      
      await storage.deletePost(id);
      
      res.status(204).end();
    } catch (error) {
      console.error('게시글 삭제 에러:', error);
      res.status(500).json({ error: '게시글을 삭제하는 중 오류가 발생했습니다.' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

import {
  Employee, InsertEmployee,
  RegistrationRequest, InsertRegistrationRequest,
  Admin, InsertAdmin,
  ManagerWork, InsertManagerWork,
  ParkingRecord, InsertParkingRecord,
  VisitorReservation, InsertVisitorReservation,
  ChatMessage, InsertChatMessage,
  JobHelp, InsertJobHelp
} from "@shared/schema";

// 간단한 캐시 클래스 구현
class Cache {
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private ttl: number; // Time To Live (밀리초)

  constructor(ttlSeconds = 60) {
    this.ttl = ttlSeconds * 1000;
    
    // 5분마다 만료된 캐시 데이터 정리
    setInterval(() => this.clearExpiredCache(), 5 * 60 * 1000);
  }

  // 캐시에서 데이터 가져오기
  get(key: string): any | null {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return null;
    }
    
    // 캐시 유효 시간 확인
    if (Date.now() - cachedItem.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }

  // 캐시에 데이터 저장
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 캐시 삭제
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // 특정 접두어로 시작하는 모든 캐시 삭제 (관련 캐시 일괄 무효화)
  invalidatePattern(prefix: string): void {
    // Array.from으로 배열로 변환하여 반복자 문제 해결
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  // 만료된 캐시 정리
  private clearExpiredCache(): void {
    const now = Date.now();
    // Array.from으로 배열로 변환하여 반복자 문제 해결
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    });
  }
}

export interface IStorage {
  // Employee operations
  getEmployeeById(id: string | number): Promise<Employee | undefined>;
  getEmployeeByUsername(username: string): Promise<Employee | undefined>;
  getEmployeeByCarNumber(carNumber: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Registration requests
  getRegistrationRequests(): Promise<RegistrationRequest[]>;
  createRegistrationRequest(request: InsertRegistrationRequest): Promise<RegistrationRequest>;
  deleteRegistrationRequest(id: number): Promise<boolean>;
  approveRegistrationRequest(id: string | number): Promise<Employee | undefined>;

  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined>;
  deleteAdmin(id: number): Promise<boolean>;

  // Manager work operations
  getManagerWorks(): Promise<ManagerWork[]>;
  getActiveManagers(): Promise<ManagerWork[]>;
  createManagerWork(work: InsertManagerWork): Promise<ManagerWork>;
  updateManagerWork(id: number, work: Partial<ManagerWork>): Promise<ManagerWork | undefined>;
  deleteManagerWork(id: number): Promise<boolean>;

  // Parking operations
  getParkingRecords(): Promise<ParkingRecord[]>;
  getParkingRecordById(id: number): Promise<ParkingRecord | undefined>;
  getParkingRecordsByCarNumber(carNumber: string): Promise<ParkingRecord[]>;
  getCurrentlyParkedVehicles(): Promise<ParkingRecord[]>;
  createParkingRecord(record: InsertParkingRecord): Promise<ParkingRecord>;
  updateParkingRecord(id: number, record: Partial<ParkingRecord>): Promise<ParkingRecord | undefined>;
  
  // Visitor reservations
  getVisitorReservations(): Promise<VisitorReservation[]>;
  getVisitorReservationById(id: number): Promise<VisitorReservation | undefined>;
  getVisitorReservationsByDate(date: string): Promise<VisitorReservation[]>;
  createVisitorReservation(reservation: InsertVisitorReservation): Promise<VisitorReservation>;
  updateVisitorReservation(id: number, reservation: Partial<VisitorReservation>): Promise<VisitorReservation | undefined>;
  deleteVisitorReservation(id: number): Promise<boolean>;

  // Chat operations
  getChatMessages(senderId: number, receiverId: number): Promise<ChatMessage[]>;
  getUnreadMessageCount(receiverId: number): Promise<number>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(receiverId: number, senderId: number): Promise<boolean>;

  // Job help operations
  getJobHelp(): Promise<JobHelp[]>;
  getJobHelpById(id: number): Promise<JobHelp | undefined>;
  createJobHelp(help: InsertJobHelp): Promise<JobHelp>;
  updateJobHelp(id: number, help: Partial<JobHelp>): Promise<JobHelp | undefined>;
  deleteJobHelp(id: number): Promise<boolean>;

  // Post operations
  getAllPosts(): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: UpdatePost): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;

  // Board operations
  getBoards(): Promise<any[]>;
  getBoardById(id: number): Promise<any | undefined>;
  getBoardByOwnerId(ownerId: number): Promise<any[]>;
  createBoard(board: any): Promise<any>;
  updateBoard(id: number, board: any): Promise<any | undefined>;
  deleteBoard(id: number): Promise<boolean>;

  // Board post operations
  getBoardPosts(boardId: number): Promise<any[]>;
  getBoardPostById(id: number): Promise<any | undefined>;
  createBoardPost(post: any): Promise<any>;
  updateBoardPost(id: number, post: any): Promise<any | undefined>;
  deleteBoardPost(id: number): Promise<boolean>;

  // Auth operations
  validateCredentials(username: string, password: string): Promise<{ user: Employee | Admin | ManagerWork | undefined, role: "employee" | "admin" | "superadmin" | "manager" | undefined }>;
}

// 공유 캐시 인스턴스 생성 (30초 TTL)
export const appCache = new Cache(30);

// 게시글 인터페이스 정의
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
  isImportant: boolean;
}

interface InsertPost {
  title: string;
  content: string;
  authorId: string;
  isImportant?: boolean;
}

interface UpdatePost {
  title?: string;
  content?: string;
  isImportant?: boolean;
}

// PostgreSQL 저장소 클래스 가져오기
import { PostgresStorage } from './storage/PostgresStorage';

// PostgreSQL 저장소 사용
export const storage = new PostgresStorage();

// 게시글 관련 클래스 정의 제거 (기존 클래스 정의 전체를 삭제)

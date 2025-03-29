import mongoose, { Schema, Document } from 'mongoose';
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

// 게시판 관련 인터페이스 정의
export interface BoardPost {
  id: string;
  title: string;
  content: string;
  authorId: string | number; // 작성자 ID
  authorType: 'employee' | 'manager'; // 작성자 타입
  createdAt: Date;
  updatedAt: Date;
  boardId: string; // 게시판 ID
}

export interface InsertBoardPost {
  title: string;
  content: string;
  authorId: string | number;
  authorType: 'employee' | 'manager';
  boardId: string;
}

export interface Board {
  id: string;
  name: string;
  ownerId: string | number; // 게시판 소유자 ID
  ownerType: 'employee' | 'manager'; // 소유자 타입
  isManagerBoard: boolean; // 관리자 게시판 여부
  createdAt: Date;
}

export interface InsertBoard {
  name: string;
  ownerId: string | number;
  ownerType: 'employee' | 'manager';
  isManagerBoard: boolean;
}

// MongoDB 연결 설정
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/parking_management';
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 인터페이스 정의 - Omit을 사용하여 id 필드 충돌 해결
export interface EmployeeDocument extends Omit<Employee, 'id'>, Document {}
export interface RegistrationRequestDocument extends Omit<RegistrationRequest, 'id'>, Document {}
export interface AdminDocument extends Omit<Admin, 'id'>, Document {}
export interface ManagerWorkDocument extends Omit<ManagerWork, 'id'>, Document {}
export interface ParkingRecordDocument extends Omit<ParkingRecord, 'id'>, Document {}
export interface VisitorReservationDocument extends Omit<VisitorReservation, 'id'>, Document {}
export interface ChatMessageDocument extends Omit<ChatMessage, 'id'>, Document {}
export interface JobHelpDocument extends Omit<JobHelp, 'id'>, Document {}
export interface BoardDocument extends Omit<Board, 'id'>, Document {}
export interface BoardPostDocument extends Omit<BoardPost, 'id'>, Document {}

// 스키마 정의
const EmployeeSchema = new Schema<EmployeeDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, default: '' },
  phone: { type: String, required: true },
  carNumber: { type: String, required: true },
  position: { type: String, required: true, default: '' },
  isAdmin: { type: Boolean, default: false }
});

const RegistrationRequestSchema = new Schema<RegistrationRequestDocument>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  carNumber: { type: String, required: true },
  position: { type: String, required: true },
  requestDate: { type: Date, default: Date.now }
});

const AdminSchema = new Schema<AdminDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true }
});

const ManagerWorkSchema = new Schema<ManagerWorkDocument>({
  employeeId: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isWorking: { type: Boolean, default: true },
  workCheck: { type: Boolean, default: false },
  workDate: { type: String, required: true },
  workTime: { type: String, required: true }
});

const ParkingRecordSchema = new Schema<ParkingRecordDocument>({
  carNumber: { type: String, required: true },
  inDate: { type: String, default: null },
  inTime: { type: String, default: null },
  outDate: { type: String, default: null },
  outTime: { type: String, default: null },
  entryTimestamp: { type: Date, default: null },
  exitTimestamp: { type: Date, default: null }
});

const VisitorReservationSchema = new Schema<VisitorReservationDocument>({
  visitorName: { type: String, default: null },
  carNumber: { type: String, required: true },
  visitDate: { type: String, required: true },
  visitPurpose: { type: String, required: true },
  contactNumber: { type: String, default: null },
  inDate: { type: String, default: null },
  inTime: { type: String, default: null },
  outDate: { type: String, default: null },
  outTime: { type: String, default: null },
  registeredById: { type: Number, required: true }
});

const ChatMessageSchema = new Schema<ChatMessageDocument>({
  senderId: { type: Schema.Types.Mixed, required: true },
  receiverId: { type: Schema.Types.Mixed, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const JobHelpSchema = new Schema<JobHelpDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 게시판 스키마 정의
const BoardSchema = new Schema<BoardDocument>({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.Mixed, required: true }, // 문자열 또는 숫자 ID
  ownerType: { type: String, enum: ['employee', 'manager'], required: true },
  isManagerBoard: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// 게시글 스키마 정의
const BoardPostSchema = new Schema<BoardPostDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.Mixed, required: true }, // 문자열 또는 숫자 ID
  authorType: { type: String, enum: ['employee', 'manager'], required: true },
  boardId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 모델 생성
export const EmployeeModel = mongoose.model<EmployeeDocument>('Employee', EmployeeSchema);
export const RegistrationRequestModel = mongoose.model<RegistrationRequestDocument>('RegistrationRequest', RegistrationRequestSchema);
export const AdminModel = mongoose.model<AdminDocument>('Admin', AdminSchema);
export const ManagerWorkModel = mongoose.model<ManagerWorkDocument>('ManagerWork', ManagerWorkSchema);
export const ParkingRecordModel = mongoose.model<ParkingRecordDocument>('ParkingRecord', ParkingRecordSchema);
export const VisitorReservationModel = mongoose.model<VisitorReservationDocument>('VisitorReservation', VisitorReservationSchema);
export const ChatMessageModel = mongoose.model<ChatMessageDocument>('ChatMessage', ChatMessageSchema);
export const JobHelpModel = mongoose.model<JobHelpDocument>('JobHelp', JobHelpSchema);
export const BoardModel = mongoose.model<BoardDocument>('Board', BoardSchema);
export const BoardPostModel = mongoose.model<BoardPostDocument>('BoardPost', BoardPostSchema); 
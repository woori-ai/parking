import { IStorage } from '../storage';
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

import {
  EmployeeModel,
  RegistrationRequestModel,
  AdminModel,
  ManagerWorkModel,
  ParkingRecordModel,
  VisitorReservationModel,
  ChatMessageModel,
  JobHelpModel,
  connectDB,
  BoardModel,
  BoardPostModel,
  Board, InsertBoard,
  BoardPost, InsertBoardPost
} from '../models/mongoose';

export interface IBoardStorage {
  getBoards(): Promise<Board[]>;
  getBoardById(id: string): Promise<Board | undefined>;
  getBoardByOwnerId(ownerId: string | number, ownerType: 'employee' | 'manager'): Promise<Board | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<Board>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<boolean>;
  getBoardPosts(boardId: string): Promise<BoardPost[]>;
  getBoardPostById(id: string): Promise<BoardPost | undefined>;
  createBoardPost(post: InsertBoardPost): Promise<BoardPost>;
  updateBoardPost(id: string, post: Partial<BoardPost>): Promise<BoardPost | undefined>;
  deleteBoardPost(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage, IBoardStorage {
  constructor() {
    // MongoDB 연결
    connectDB();
    
    // 초기 데이터 설정
    this.initializeData();
  }
  
  private async initializeData() {
    // superadmin 계정이 없으면 생성
    const superadminExists = await AdminModel.findOne({ username: 'superadmin' });
    if (!superadminExists) {
      await AdminModel.create({
        username: "superadmin",
        password: "admin123",
        phone: "010-0000-0000"
      });
    }
    
    // 주차 관리자 계정이 없으면 생성
    const managerExists = await ManagerWorkModel.findOne({ employeeId: 'kimbanjang' });
    if (!managerExists) {
      await ManagerWorkModel.create({
        employeeId: "kimbanjang",
        password: "manager123",
        phone: "010-1111-2222",
        isWorking: true,
        workCheck: false,
        workDate: new Date().toISOString().split('T')[0],
        workTime: "09:00-18:00"
      });
    }
    
    // 테스트용 사원 계정 생성
    const employee1Exists = await EmployeeModel.findOne({ username: 'employee1' });
    if (!employee1Exists) {
      await EmployeeModel.create({
        username: "employee1",
        password: "employee123",
        email: "employee1@example.com",
        phone: "010-1234-5678",
        carNumber: "12가3456",
        position: "사원",
        isAdmin: false
      });
    }
    
    const employee2Exists = await EmployeeModel.findOne({ username: 'employee2' });
    if (!employee2Exists) {
      await EmployeeModel.create({
        username: "employee2",
        password: "employee123",
        email: "employee2@example.com",
        phone: "010-2345-6789",
        carNumber: "34나5678",
        position: "대리",
        isAdmin: false
      });
    }
    
    const adminEmployeeExists = await EmployeeModel.findOne({ username: 'adminemployee' });
    if (!adminEmployeeExists) {
      await EmployeeModel.create({
        username: "adminemployee",
        password: "admin123",
        email: "adminemployee@example.com",
        phone: "010-3456-7890",
        carNumber: "56다7890",
        position: "과장",
        isAdmin: true
      });
    }
    
    // 주차 관리자 공용 게시판 생성
    const managerBoardExists = await BoardModel.findOne({ isManagerBoard: true });
    if (!managerBoardExists) {
      await BoardModel.create({
        name: "주차 관리자 게시판",
        ownerId: "manager",
        ownerType: "manager",
        isManagerBoard: true,
        createdAt: new Date()
      });
    }
  }

  // Employee operations
  async getEmployeeById(id: string | number): Promise<Employee | undefined> {
    try {
      const idString = typeof id === 'number' ? id.toString() : id;
      const employee = await EmployeeModel.findById(idString);
      return employee ? this.convertToEmployee(employee) : undefined;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      return undefined;
    }
  }

  async getEmployeeByUsername(username: string): Promise<Employee | undefined> {
    const employee = await EmployeeModel.findOne({ username });
    return employee ? this.convertToEmployee(employee) : undefined;
  }

  async getEmployeeByCarNumber(carNumber: string): Promise<Employee | undefined> {
    const employee = await EmployeeModel.findOne({ carNumber });
    return employee ? this.convertToEmployee(employee) : undefined;
  }

  async getEmployees(): Promise<Employee[]> {
    const employees = await EmployeeModel.find();
    return employees.map(employee => this.convertToEmployee(employee));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      console.log("Creating employee in MongoDB:", employee);
      
      // 사용자 이름 중복 체크
      const existingEmployee = await EmployeeModel.findOne({ username: employee.username });
      if (existingEmployee) {
        console.error("Username already exists:", employee.username);
        throw new Error("Username already exists");
      }
      
      // 차량 번호 중복 체크
      const existingCarNumber = await EmployeeModel.findOne({ carNumber: employee.carNumber });
      if (existingCarNumber) {
        console.error("Car number already exists:", employee.carNumber);
        throw new Error("Car number already exists");
      }
      
      // 빈 문자열 필드에 기본값 설정
      const employeeData = {
        ...employee,
        email: employee.email || '기본 이메일',
        position: employee.position || '사원'
      };
      
      const newEmployee = await EmployeeModel.create(employeeData);
      console.log("Employee created successfully:", newEmployee);
      return this.convertToEmployee(newEmployee);
    } catch (error) {
      console.error("Error in createEmployee:", error);
      throw error;
    }
  }

  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined> {
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(id, employee, { new: true });
    return updatedEmployee ? this.convertToEmployee(updatedEmployee) : undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await EmployeeModel.findByIdAndDelete(id);
    return !!result;
  }

  // Registration requests
  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    const requests = await RegistrationRequestModel.find();
    return requests.map(request => this.convertToRegistrationRequest(request));
  }

  async createRegistrationRequest(request: InsertRegistrationRequest): Promise<RegistrationRequest> {
    const newRequest = await RegistrationRequestModel.create({
      ...request,
      requestDate: new Date()
    });
    return this.convertToRegistrationRequest(newRequest);
  }

  async deleteRegistrationRequest(id: number): Promise<boolean> {
    const result = await RegistrationRequestModel.findByIdAndDelete(id);
    return !!result;
  }

  async approveRegistrationRequest(id: string | number): Promise<Employee | undefined> {
    try {
      // MongoDB에서는 _id 필드를 사용하므로 해당 필드로 조회
      const request = await RegistrationRequestModel.findById(id);
      if (!request) return undefined;

      // Create employee from request
      const employee: InsertEmployee = {
        username: request.username,
        password: request.password,
        email: request.email || '기본 이메일',
        phone: request.phone,
        carNumber: request.carNumber,
        position: request.position || '사원',
        isAdmin: false
      };

      // 직원 생성 및 요청 삭제
      const newEmployee = await this.createEmployee(employee);
      await RegistrationRequestModel.findByIdAndDelete(id);
      
      return newEmployee;
    } catch (error) {
      console.error("Error in approveRegistrationRequest:", error);
      throw error;
    }
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const admin = await AdminModel.findOne({ username });
    return admin ? this.convertToAdmin(admin) : undefined;
  }

  async getAdmins(): Promise<Admin[]> {
    const admins = await AdminModel.find();
    return admins.map(admin => this.convertToAdmin(admin));
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin = await AdminModel.create(admin);
    return this.convertToAdmin(newAdmin);
  }

  async updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined> {
    const updatedAdmin = await AdminModel.findByIdAndUpdate(id, admin, { new: true });
    return updatedAdmin ? this.convertToAdmin(updatedAdmin) : undefined;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    const result = await AdminModel.findByIdAndDelete(id);
    return !!result;
  }

  // Manager work operations
  async getManagerWorks(): Promise<ManagerWork[]> {
    const managerWorks = await ManagerWorkModel.find();
    return managerWorks.map(work => this.convertToManagerWork(work));
  }

  async getActiveManagers(): Promise<(ManagerWork & { employee?: Employee })[]> {
    const activeManagers = await ManagerWorkModel.find({ $or: [{ isWorking: true }, { isWorking: { $exists: false } }] });
    
    return Promise.all(activeManagers.map(async (manager) => {
      const managerWork = this.convertToManagerWork(manager);
      
      // employeeId가 숫자인 경우 숫자로 변환하여 직원 정보 조회
      if (!isNaN(Number(manager.employeeId))) {
        const employee = await this.getEmployeeById(Number(manager.employeeId));
        return { ...managerWork, employee };
      }
      
      // employeeId가 사용자명인 경우 이름으로 직원 정보 조회
      const employee = await this.getEmployeeByUsername(manager.employeeId);
      return { ...managerWork, employee };
    }));
  }

  async createManagerWork(work: InsertManagerWork): Promise<ManagerWork> {
    const newWork = await ManagerWorkModel.create({
      ...work,
      isWorking: work.isWorking ?? true,
      workCheck: work.workCheck ?? false
    });
    return this.convertToManagerWork(newWork);
  }

  async updateManagerWork(id: string | number, work: Partial<ManagerWork>): Promise<ManagerWork | undefined> {
    try {
      // MongoDB에서는 _id 필드를 사용하므로 해당 필드로 조회
      const idString = typeof id === 'number' ? id.toString() : id;
      const managerWork = await ManagerWorkModel.findOne({ _id: idString });
      if (!managerWork) return undefined;
      
      // 업데이트할 필드 설정
      if (work.employeeId !== undefined) managerWork.employeeId = work.employeeId;
      if (work.password !== undefined) managerWork.password = work.password;
      if (work.phone !== undefined) managerWork.phone = work.phone;
      if (work.isWorking !== undefined) managerWork.isWorking = work.isWorking;
      if (work.workCheck !== undefined) managerWork.workCheck = work.workCheck;
      if (work.workDate !== undefined) managerWork.workDate = work.workDate;
      if (work.workTime !== undefined) managerWork.workTime = work.workTime;
      
      // 저장
      const updatedWork = await managerWork.save();
      return this.convertToManagerWork(updatedWork);
    } catch (error) {
      console.error('Error updating manager work:', error);
      return undefined;
    }
  }

  async deleteManagerWork(id: string | number): Promise<boolean> {
    try {
      const idString = typeof id === 'number' ? id.toString() : id;
      const result = await ManagerWorkModel.findOneAndDelete({ _id: idString });
      return !!result;
    } catch (error) {
      console.error('Error deleting manager work:', error);
      return false;
    }
  }

  // Parking operations
  async getParkingRecords(): Promise<ParkingRecord[]> {
    const records = await ParkingRecordModel.find();
    return records.map(record => this.convertToParkingRecord(record));
  }

  async getParkingRecordById(id: number): Promise<ParkingRecord | undefined> {
    const record = await ParkingRecordModel.findById(id);
    return record ? this.convertToParkingRecord(record) : undefined;
  }

  async getParkingRecordsByCarNumber(carNumber: string): Promise<ParkingRecord[]> {
    const records = await ParkingRecordModel.find({ 
      carNumber: { $regex: carNumber, $options: 'i' } 
    });
    return records.map(record => this.convertToParkingRecord(record));
  }

  async getCurrentlyParkedVehicles(): Promise<ParkingRecord[]> {
    const records = await ParkingRecordModel.find({ 
      entryTimestamp: { $ne: null }, 
      exitTimestamp: null 
    });
    return records.map(record => this.convertToParkingRecord(record));
  }

  async createParkingRecord(record: InsertParkingRecord): Promise<ParkingRecord> {
    const newRecord = await ParkingRecordModel.create({
      carNumber: record.carNumber,
      inDate: record.inDate ?? null,
      inTime: record.inTime ?? null,
      outDate: record.outDate ?? null,
      outTime: record.outTime ?? null,
      entryTimestamp: record.inDate && record.inTime ? new Date() : null,
      exitTimestamp: record.outDate && record.outTime ? new Date() : null
    });
    return this.convertToParkingRecord(newRecord);
  }

  async updateParkingRecord(id: number, record: Partial<ParkingRecord>): Promise<ParkingRecord | undefined> {
    // If setting outDate and outTime, also update exitTimestamp
    if (record.outDate && record.outTime) {
      const existingRecord = await ParkingRecordModel.findById(id);
      if (existingRecord && !existingRecord.exitTimestamp) {
        record.exitTimestamp = new Date();
      }
    }

    const updatedRecord = await ParkingRecordModel.findByIdAndUpdate(id, record, { new: true });
    return updatedRecord ? this.convertToParkingRecord(updatedRecord) : undefined;
  }

  // Visitor reservations
  async getVisitorReservations(): Promise<VisitorReservation[]> {
    const reservations = await VisitorReservationModel.find();
    return reservations.map(reservation => this.convertToVisitorReservation(reservation));
  }

  async getVisitorReservationById(id: number): Promise<VisitorReservation | undefined> {
    const reservation = await VisitorReservationModel.findById(id);
    return reservation ? this.convertToVisitorReservation(reservation) : undefined;
  }

  async getVisitorReservationsByDate(date: string): Promise<VisitorReservation[]> {
    const reservations = await VisitorReservationModel.find({ visitDate: date });
    return reservations.map(reservation => this.convertToVisitorReservation(reservation));
  }

  async createVisitorReservation(reservation: InsertVisitorReservation): Promise<VisitorReservation> {
    const newReservation = await VisitorReservationModel.create({
      ...reservation,
      inDate: reservation.inDate ?? null,
      inTime: reservation.inTime ?? null,
      outDate: reservation.outDate ?? null,
      outTime: reservation.outTime ?? null,
      visitorName: reservation.visitorName ?? null,
      contactNumber: reservation.contactNumber ?? null
    });
    return this.convertToVisitorReservation(newReservation);
  }

  async updateVisitorReservation(id: number, reservation: Partial<VisitorReservation>): Promise<VisitorReservation | undefined> {
    const updatedReservation = await VisitorReservationModel.findByIdAndUpdate(id, reservation, { new: true });
    return updatedReservation ? this.convertToVisitorReservation(updatedReservation) : undefined;
  }

  async deleteVisitorReservation(id: number): Promise<boolean> {
    const result = await VisitorReservationModel.findByIdAndDelete(id);
    return !!result;
  }

  // Chat operations
  async getChatMessages(senderId: number, receiverId: number): Promise<ChatMessage[]> {
    const messages = await ChatMessageModel.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timestamp: 1 });
    return messages.map(message => this.convertToChatMessage(message));
  }

  async getUnreadMessageCount(receiverId: number): Promise<number> {
    return await ChatMessageModel.countDocuments({ 
      receiverId, 
      isRead: false 
    });
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage = await ChatMessageModel.create({
      ...message,
      timestamp: new Date(),
      isRead: false
    });
    return this.convertToChatMessage(newMessage);
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<boolean> {
    const result = await ChatMessageModel.updateMany(
      { receiverId, senderId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount > 0;
  }

  // Job help operations
  async getJobHelp(): Promise<JobHelp[]> {
    const helps = await JobHelpModel.find();
    return helps.map(help => this.convertToJobHelp(help));
  }

  async getJobHelpById(id: number): Promise<JobHelp | undefined> {
    const help = await JobHelpModel.findById(id);
    return help ? this.convertToJobHelp(help) : undefined;
  }

  async createJobHelp(help: InsertJobHelp): Promise<JobHelp> {
    const now = new Date();
    const newHelp = await JobHelpModel.create({
      ...help,
      createdAt: now,
      updatedAt: now
    });
    return this.convertToJobHelp(newHelp);
  }

  async updateJobHelp(id: number, help: Partial<JobHelp>): Promise<JobHelp | undefined> {
    const updatedHelp = await JobHelpModel.findByIdAndUpdate(
      id, 
      { ...help, updatedAt: new Date() }, 
      { new: true }
    );
    return updatedHelp ? this.convertToJobHelp(updatedHelp) : undefined;
  }

  async deleteJobHelp(id: number): Promise<boolean> {
    const result = await JobHelpModel.findByIdAndDelete(id);
    return !!result;
  }

  // Auth operations
  async validateCredentials(username: string, password: string): Promise<{ user: Employee | Admin | ManagerWork | undefined, role: "employee" | "admin" | "superadmin" | "manager" | undefined }> {
    // Check if it's a superadmin
    const superadmin = await AdminModel.findOne({ 
      username, 
      password, 
      $and: [{ username: "superadmin" }]
    });
    
    if (superadmin) {
      return { user: this.convertToAdmin(superadmin), role: "superadmin" };
    }

    // Check if it's an admin
    const admin = await AdminModel.findOne({ 
      username, 
      password, 
      $and: [{ username: { $ne: "superadmin" } }]
    });
    
    if (admin) {
      return { user: this.convertToAdmin(admin), role: "admin" };
    }

    // Check if it's an employee with admin rights
    const employeeAdmin = await EmployeeModel.findOne({ 
      username, 
      password, 
      isAdmin: true 
    });

    if (employeeAdmin) {
      return { user: this.convertToEmployee(employeeAdmin), role: "admin" };
    }

    // Check if it's a regular employee
    const employee = await EmployeeModel.findOne({ 
      username, 
      password, 
      isAdmin: false 
    });

    if (employee) {
      return { user: this.convertToEmployee(employee), role: "employee" };
    }

    // Check if it's a parking manager
    const parkingManager = await ManagerWorkModel.findOne({ 
      employeeId: username, 
      password 
    });

    if (parkingManager) {
      return { user: this.convertToManagerWork(parkingManager), role: "manager" };
    }

    return { user: undefined, role: undefined };
  }

  // Helper methods to convert MongoDB documents to our schema types
  private convertToEmployee(doc: any): Employee {
    return {
      id: doc._id.toString(),
      username: doc.username,
      password: doc.password,
      email: doc.email,
      phone: doc.phone,
      carNumber: doc.carNumber,
      position: doc.position,
      isAdmin: doc.isAdmin
    };
  }

  private convertToRegistrationRequest(doc: any): RegistrationRequest {
    return {
      id: doc._id.toString(),
      username: doc.username,
      password: doc.password,
      email: doc.email,
      phone: doc.phone,
      carNumber: doc.carNumber,
      position: doc.position,
      requestDate: doc.requestDate
    };
  }

  private convertToAdmin(doc: any): Admin {
    return {
      id: doc._id.toString(),
      username: doc.username,
      password: doc.password,
      phone: doc.phone
    };
  }

  private convertToManagerWork(doc: any): ManagerWork {
    return {
      id: doc._id.toString(),
      employeeId: doc.employeeId,
      password: doc.password,
      phone: doc.phone,
      isWorking: doc.isWorking,
      workCheck: doc.workCheck,
      workDate: doc.workDate,
      workTime: doc.workTime
    };
  }

  private convertToParkingRecord(doc: any): ParkingRecord {
    return {
      id: doc._id.toString(),
      carNumber: doc.carNumber,
      inDate: doc.inDate,
      inTime: doc.inTime,
      outDate: doc.outDate,
      outTime: doc.outTime,
      entryTimestamp: doc.entryTimestamp,
      exitTimestamp: doc.exitTimestamp
    };
  }

  private convertToVisitorReservation(doc: any): VisitorReservation {
    return {
      id: doc._id.toString(),
      visitorName: doc.visitorName,
      carNumber: doc.carNumber,
      visitDate: doc.visitDate,
      visitPurpose: doc.visitPurpose,
      contactNumber: doc.contactNumber,
      inDate: doc.inDate,
      inTime: doc.inTime,
      outDate: doc.outDate,
      outTime: doc.outTime,
      registeredById: doc.registeredById
    };
  }

  private convertToChatMessage(doc: any): ChatMessage {
    return {
      id: doc._id.toString(),
      senderId: doc.senderId,
      receiverId: doc.receiverId,
      message: doc.message,
      timestamp: doc.timestamp,
      isRead: doc.isRead
    };
  }

  private convertToJobHelp(doc: any): JobHelp {
    return {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  // 게시판 관련 메서드 구현
  async getBoards(): Promise<Board[]> {
    const boards = await BoardModel.find();
    return boards.map(board => this.convertToBoard(board));
  }

  async getBoardById(id: string): Promise<Board | undefined> {
    const board = await BoardModel.findById(id);
    return board ? this.convertToBoard(board) : undefined;
  }

  async getBoardByOwnerId(ownerId: string | number, ownerType: 'employee' | 'manager'): Promise<Board | undefined> {
    // 공용 게시판 찾기 (모든 사용자가 접근 가능)
    let board = await BoardModel.findOne({ isManagerBoard: true });
    
    // 공용 게시판이 없으면 생성
    if (!board) {
      board = await BoardModel.create({
        name: "공용 게시판",
        ownerId: "system",
        ownerType: "manager",
        isManagerBoard: true,
        createdAt: new Date()
      });
    }
    
    return this.convertToBoard(board);
  }

  async createBoard(board: InsertBoard): Promise<Board> {
    const newBoard = await BoardModel.create({
      ...board,
      createdAt: new Date()
    });
    return this.convertToBoard(newBoard);
  }

  async updateBoard(id: string, board: Partial<Board>): Promise<Board | undefined> {
    const updatedBoard = await BoardModel.findByIdAndUpdate(id, board, { new: true });
    return updatedBoard ? this.convertToBoard(updatedBoard) : undefined;
  }

  async deleteBoard(id: string): Promise<boolean> {
    // 게시판 삭제 시 해당 게시판의 모든 게시글도 삭제
    await BoardPostModel.deleteMany({ boardId: id });
    const result = await BoardModel.findByIdAndDelete(id);
    return !!result;
  }

  // 게시글 관련 메서드 구현
  async getBoardPosts(boardId: string): Promise<BoardPost[]> {
    const posts = await BoardPostModel.find({ boardId }).sort({ createdAt: -1 });
    return posts.map(post => this.convertToBoardPost(post));
  }

  async getBoardPostById(id: string): Promise<BoardPost | undefined> {
    const post = await BoardPostModel.findById(id);
    return post ? this.convertToBoardPost(post) : undefined;
  }

  async createBoardPost(post: InsertBoardPost): Promise<BoardPost> {
    const now = new Date();
    const newPost = await BoardPostModel.create({
      ...post,
      createdAt: now,
      updatedAt: now
    });
    return this.convertToBoardPost(newPost);
  }

  async updateBoardPost(id: string, post: Partial<BoardPost>): Promise<BoardPost | undefined> {
    const updatedPost = await BoardPostModel.findByIdAndUpdate(
      id,
      { ...post, updatedAt: new Date() },
      { new: true }
    );
    return updatedPost ? this.convertToBoardPost(updatedPost) : undefined;
  }

  async deleteBoardPost(id: string): Promise<boolean> {
    const result = await BoardPostModel.findByIdAndDelete(id);
    return !!result;
  }

  // 변환 메서드
  private convertToBoard(doc: any): Board {
    return {
      id: doc._id.toString(),
      name: doc.name,
      ownerId: doc.ownerId,
      ownerType: doc.ownerType,
      isManagerBoard: doc.isManagerBoard,
      createdAt: doc.createdAt
    };
  }

  private convertToBoardPost(doc: any): BoardPost {
    return {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      authorId: doc.authorId,
      authorType: doc.authorType,
      boardId: doc.boardId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
} 
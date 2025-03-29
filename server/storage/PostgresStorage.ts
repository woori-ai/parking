import { IStorage } from '../storage';
import { appCache } from '../storage';
import {
  Employee as EmployeeType,
  InsertEmployee,
  RegistrationRequest as RegistrationRequestType,
  InsertRegistrationRequest,
  Admin as AdminType,
  InsertAdmin,
  ManagerWork as ManagerWorkType,
  InsertManagerWork,
  ParkingRecord as ParkingRecordType,
  InsertParkingRecord,
  VisitorReservation as VisitorReservationType,
  InsertVisitorReservation,
  ChatMessage as ChatMessageType,
  InsertChatMessage,
  JobHelp as JobHelpType,
  InsertJobHelp,
  Board as BoardType,
  InsertBoard,
  BoardPost as BoardPostType,
  InsertBoardPost
} from '@shared/schema';

import {
  Employee,
  RegistrationRequest,
  Admin,
  ManagerWork,
  ParkingRecord,
  VisitorReservation,
  ChatMessage,
  JobHelp,
  Board,
  BoardPost,
  sequelize
} from '../models';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

export class PostgresStorage implements IStorage {
  // Employee operations
  async getEmployeeById(id: string | number): Promise<EmployeeType | undefined> {
    // 캐시 키 생성
    const cacheKey = `employees:${id}`;
    
    // 캐시에서 먼저 조회
    const cachedEmployee = appCache.get(cacheKey);
    if (cachedEmployee) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedEmployee;
    }
    
    // 캐시에 없으면 DB에서 조회
    const employee = await Employee.findByPk(id);
    const result = employee?.toJSON() as EmployeeType | undefined;
    
    // 결과가 있으면 캐시에 저장
    if (result) {
      appCache.set(cacheKey, result);
    }
    
    return result;
  }

  async getEmployeeByUsername(username: string): Promise<EmployeeType | undefined> {
    // 캐시 키 생성
    const cacheKey = `employees:username:${username}`;
    
    // 캐시에서 먼저 조회
    const cachedEmployee = appCache.get(cacheKey);
    if (cachedEmployee) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedEmployee;
    }
    
    // 캐시에 없으면 DB에서 조회
    const employee = await Employee.findOne({ where: { username } });
    const result = employee?.toJSON() as EmployeeType | undefined;
    
    // 결과가 있으면 캐시에 저장
    if (result) {
      appCache.set(cacheKey, result);
    }
    
    return result;
  }

  async getEmployeeByCarNumber(carNumber: string): Promise<EmployeeType | undefined> {
    const employee = await Employee.findOne({ where: { carNumber } });
    return employee?.toJSON() as EmployeeType | undefined;
  }

  async getEmployees(): Promise<EmployeeType[]> {
    // 캐시 키 생성
    const cacheKey = `employees:all`;
    
    // 캐시에서 먼저 조회
    const cachedEmployees = appCache.get(cacheKey);
    if (cachedEmployees) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedEmployees;
    }
    
    // 캐시에 없으면 DB에서 조회
    const employees = await Employee.findAll();
    const result = employees.map(employee => employee.toJSON() as EmployeeType);
    
    // 결과가 있으면 캐시에 저장
    appCache.set(cacheKey, result);
    
    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<EmployeeType> {
    // 비밀번호 해싱을 제거하고 평문으로 저장
    // const hashedPassword = await bcrypt.hash(employee.password, 10);
    
    const newEmployee = await Employee.create({
      ...employee,
      password: employee.password // 평문 비밀번호 저장
    });
    
    // 직원 캐시 무효화
    appCache.invalidatePattern('employees:');
    appCache.invalidate('employees:all');
    console.log("사원 캐시 무효화 (storage): 사원 생성");
    
    return newEmployee.toJSON() as EmployeeType;
  }

  async updateEmployee(id: number, employee: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
    // 비밀번호 해싱 부분 제거 (평문으로 저장)
    // if (employee.password) {
    //   employee.password = await bcrypt.hash(employee.password, 10);
    // }
    
    const [updated] = await Employee.update(employee, {
      where: { id }
    });
    
    if (updated === 0) {
      return undefined;
    }
    
    // 해당 직원 캐시 무효화
    appCache.invalidate(`employees:${id}`);
    appCache.invalidatePattern(`employees:username:`);
    appCache.invalidate('employees:all');
    console.log(`사원 캐시 무효화 (storage): 사원 수정 (ID: ${id})`);
    
    const updatedEmployee = await Employee.findByPk(id);
    return updatedEmployee?.toJSON() as EmployeeType;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const deleted = await Employee.destroy({
      where: { id }
    });
    
    // 캐시 무효화
    appCache.invalidate(`employees:${id}`);
    appCache.invalidatePattern(`employees:username:`);
    appCache.invalidate('employees:all');
    console.log(`사원 캐시 무효화 (storage): 사원 삭제 (ID: ${id})`);
    
    return deleted > 0;
  }

  // Registration requests
  async getRegistrationRequests(): Promise<RegistrationRequestType[]> {
    const requests = await RegistrationRequest.findAll();
    return requests.map(request => request.toJSON() as RegistrationRequestType);
  }

  async createRegistrationRequest(request: InsertRegistrationRequest): Promise<RegistrationRequestType> {
    // 비밀번호 해싱을 제거하고 평문으로 저장
    // const hashedPassword = await bcrypt.hash(request.password, 10);
    const newRequest = await RegistrationRequest.create({
      ...request,
      password: request.password // 평문 비밀번호 저장
    });
    return newRequest.toJSON() as RegistrationRequestType;
  }

  async deleteRegistrationRequest(id: number): Promise<boolean> {
    const deleted = await RegistrationRequest.destroy({
      where: { id }
    });
    return deleted > 0;
  }

  async approveRegistrationRequest(id: string | number): Promise<EmployeeType | undefined> {
    const request = await RegistrationRequest.findByPk(id);
    if (!request) return undefined;

    const requestData = request.toJSON();
    
    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 직원 생성
      const employee = await Employee.create({
        username: requestData.username,
        password: requestData.password, // 이미 해싱된 비밀번호
        email: requestData.email,
        phone: requestData.phone,
        carNumber: requestData.carNumber,
        position: requestData.position,
        isAdmin: false
      }, { transaction });

      // 등록 요청 삭제
      await RegistrationRequest.destroy({
        where: { id },
        transaction
      });

      // 트랜잭션 커밋
      await transaction.commit();
      
      return employee.toJSON() as EmployeeType;
    } catch (error) {
      // 오류 발생 시 롤백
      await transaction.rollback();
      console.error('Registration request approval failed:', error);
      return undefined;
    }
  }

  // Admin operations (이제 employee 테이블만 사용하므로 비활성화)
  async getAdminByUsername(username: string): Promise<AdminType | undefined> {
    // 더 이상 사용하지 않음
    console.log('getAdminByUsername: 이제 Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블을 확인하세요.');
    return undefined;
  }

  async getAdmins(): Promise<AdminType[]> {
    // 더 이상 사용하지 않음
    console.log('getAdmins: 이제 Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블에서 isAdmin=true인 계정을 확인하세요.');
    return [];
  }

  async createAdmin(admin: InsertAdmin): Promise<AdminType> {
    // 더 이상 사용하지 않음
    console.log('createAdmin: 이제 Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블에 isAdmin=true인 계정을 생성하세요.');
    throw new Error('Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블에 isAdmin=true인 계정을 생성하세요.');
  }

  async updateAdmin(id: number, admin: Partial<AdminType>): Promise<AdminType | undefined> {
    // 더 이상 사용하지 않음
    console.log('updateAdmin: 이제 Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블의 계정을 업데이트하세요.');
    return undefined;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    // 더 이상 사용하지 않음
    console.log('deleteAdmin: 이제 Admin 계정은 더 이상 사용하지 않습니다. Employees 테이블의 계정을 삭제하세요.');
    return false;
  }

  // Manager work operations (이제 employee 테이블만 사용하므로 비활성화)
  async getManagerWorks(): Promise<ManagerWorkType[]> {
    // 더 이상 사용하지 않음
    console.log('getManagerWorks: 이제 ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블을 확인하세요.');
    return [];
  }

  async getActiveManagers(): Promise<ManagerWorkType[]> {
    // 더 이상 사용하지 않음
    console.log('getActiveManagers: 이제 ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블을 확인하세요.');
    return [];
  }

  async createManagerWork(work: InsertManagerWork): Promise<ManagerWorkType> {
    // 더 이상 사용하지 않음
    console.log('createManagerWork: 이제 ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블에 계정을 생성하세요.');
    throw new Error('ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블에 계정을 생성하세요.');
  }

  async updateManagerWork(id: number, work: Partial<ManagerWorkType>): Promise<ManagerWorkType | undefined> {
    // 더 이상 사용하지 않음
    console.log('updateManagerWork: 이제 ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블의 계정을 업데이트하세요.');
    return undefined;
  }

  async deleteManagerWork(id: number): Promise<boolean> {
    // 더 이상 사용하지 않음
    console.log('deleteManagerWork: 이제 ManagerWork는 더 이상 사용하지 않습니다. Employees 테이블의 계정을 삭제하세요.');
    return false;
  }

  // Parking operations
  async getParkingRecords(): Promise<ParkingRecordType[]> {
    const records = await ParkingRecord.findAll();
    return records.map(record => record.toJSON() as ParkingRecordType);
  }

  async getParkingRecordById(id: number): Promise<ParkingRecordType | undefined> {
    const record = await ParkingRecord.findByPk(id);
    return record?.toJSON() as ParkingRecordType | undefined;
  }

  async getParkingRecordsByCarNumber(carNumber: string): Promise<ParkingRecordType[]> {
    const records = await ParkingRecord.findAll({
      where: { carNumber }
    });
    return records.map(record => record.toJSON() as ParkingRecordType);
  }

  async getCurrentlyParkedVehicles(): Promise<ParkingRecordType[]> {
    // 캐시 키 생성
    const cacheKey = 'parking:current';
    
    // 캐시에서 먼저 조회
    const cachedVehicles = appCache.get(cacheKey);
    if (cachedVehicles) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedVehicles;
    }
    
    // 캐시에 없으면 DB에서 조회
    const vehicles = await ParkingRecord.findAll({
      where: {
        outDate: null,
        outTime: null
      }
    });
    
    const result = vehicles.map(vehicle => vehicle.toJSON() as ParkingRecordType);
    
    // 결과를 캐시에 저장 (주차 상태는 자주 변경될 수 있으므로 짧은 TTL을 가진 캐시에 저장됨)
    appCache.set(cacheKey, result);
    
    return result;
  }

  async createParkingRecord(record: InsertParkingRecord): Promise<ParkingRecordType> {
    const newRecord = await ParkingRecord.create(record);
    
    // 주차 캐시 무효화
    appCache.invalidate('parking:current');
    
    return newRecord.toJSON() as ParkingRecordType;
  }

  async updateParkingRecord(id: number, record: Partial<ParkingRecordType>): Promise<ParkingRecordType | undefined> {
    const [updated] = await ParkingRecord.update(record, {
      where: { id }
    });
    
    if (updated === 0) {
      return undefined;
    }
    
    // 주차 캐시 무효화
    appCache.invalidate('parking:current');
    
    const updatedRecord = await ParkingRecord.findByPk(id);
    return updatedRecord?.toJSON() as ParkingRecordType;
  }

  // Visitor reservations
  async getVisitorReservations(): Promise<VisitorReservationType[]> {
    // 캐시 키 생성
    const cacheKey = 'visitor:reservations';
    
    // 캐시에서 먼저 조회
    const cachedReservations = appCache.get(cacheKey);
    if (cachedReservations) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedReservations;
    }
    
    // 캐시에 없으면 DB에서 조회
    const reservations = await VisitorReservation.findAll();
    const result = reservations.map(reservation => reservation.toJSON() as VisitorReservationType);
    
    // 결과를 캐시에 저장
    appCache.set(cacheKey, result);
    
    return result;
  }

  async getVisitorReservationById(id: number): Promise<VisitorReservationType | undefined> {
    const reservation = await VisitorReservation.findByPk(id);
    return reservation?.toJSON() as VisitorReservationType | undefined;
  }

  async getVisitorReservationsByDate(date: string): Promise<VisitorReservationType[]> {
    // 캐시 키 생성
    const cacheKey = `visitor:reservations:date:${date}`;
    
    // 캐시에서 먼저 조회
    const cachedReservations = appCache.get(cacheKey);
    if (cachedReservations) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedReservations;
    }
    
    // 캐시에 없으면 DB에서 조회
    const reservations = await VisitorReservation.findAll({
      where: {
        visitDate: date
      }
    });
    
    const result = reservations.map(reservation => reservation.toJSON() as VisitorReservationType);
    
    // 결과를 캐시에 저장
    appCache.set(cacheKey, result);
    
    return result;
  }

  async createVisitorReservation(reservation: InsertVisitorReservation): Promise<VisitorReservationType> {
    const newReservation = await VisitorReservation.create(reservation);
    
    // 방문 예약 캐시 무효화
    appCache.invalidate('visitor:reservations');
    appCache.invalidatePattern('visitor:reservations:date:');
    
    return newReservation.toJSON() as VisitorReservationType;
  }

  async updateVisitorReservation(id: number, reservation: Partial<VisitorReservationType>): Promise<VisitorReservationType | undefined> {
    const [updated] = await VisitorReservation.update(reservation, {
      where: { id }
    });
    
    if (updated === 0) {
      return undefined;
    }
    
    // 방문 예약 캐시 무효화
    appCache.invalidate('visitor:reservations');
    appCache.invalidatePattern('visitor:reservations:date:');
    
    const updatedReservation = await VisitorReservation.findByPk(id);
    return updatedReservation?.toJSON() as VisitorReservationType;
  }

  async deleteVisitorReservation(id: number): Promise<boolean> {
    const deleted = await VisitorReservation.destroy({
      where: { id }
    });
    
    // 방문 예약 캐시 무효화
    appCache.invalidate('visitor:reservations');
    appCache.invalidatePattern('visitor:reservations:date:');
    
    return deleted > 0;
  }

  // Chat operations
  async getChatMessages(senderId: number, receiverId: number): Promise<ChatMessageType[]> {
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      },
      order: [['timestamp', 'ASC']]
    });
    return messages.map(message => message.toJSON() as ChatMessageType);
  }

  async getUnreadMessageCount(receiverId: number): Promise<number> {
    const count = await ChatMessage.count({
      where: {
        receiverId,
        isRead: false
      }
    });
    return count;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessageType> {
    const newMessage = await ChatMessage.create(message);
    return newMessage.toJSON() as ChatMessageType;
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<boolean> {
    const [updated] = await ChatMessage.update(
      { isRead: true },
      {
        where: {
          receiverId,
          senderId,
          isRead: false
        }
      }
    );
    return updated > 0;
  }

  // Job help operations
  async getJobHelp(): Promise<JobHelpType[]> {
    const helps = await JobHelp.findAll();
    return helps.map(help => help.toJSON() as JobHelpType);
  }

  async getJobHelpById(id: number): Promise<JobHelpType | undefined> {
    const help = await JobHelp.findByPk(id);
    return help?.toJSON() as JobHelpType | undefined;
  }

  async createJobHelp(help: InsertJobHelp): Promise<JobHelpType> {
    const newHelp = await JobHelp.create(help);
    return newHelp.toJSON() as JobHelpType;
  }

  async updateJobHelp(id: number, help: Partial<JobHelpType>): Promise<JobHelpType | undefined> {
    const [updated] = await JobHelp.update(help, {
      where: { id }
    });
    
    if (updated) {
      const updatedHelp = await JobHelp.findByPk(id);
      return updatedHelp?.toJSON() as JobHelpType;
    }
    return undefined;
  }

  async deleteJobHelp(id: number): Promise<boolean> {
    const deleted = await JobHelp.destroy({
      where: { id }
    });
    return deleted > 0;
  }

  // Board operations
  async getBoards(): Promise<BoardType[]> {
    // 캐시 키 생성
    const cacheKey = 'boards';
    
    // 캐시에서 먼저 조회
    const cachedBoards = appCache.get(cacheKey);
    if (cachedBoards) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedBoards;
    }
    
    // 캐시에 없으면 DB에서 조회
    const boards = await Board.findAll();
    const result = boards.map(board => board.toJSON() as BoardType);
    
    // 결과를 캐시에 저장
    appCache.set(cacheKey, result);
    
    return result;
  }

  async getBoardById(id: number): Promise<BoardType | undefined> {
    const board = await Board.findByPk(id);
    return board?.toJSON() as BoardType | undefined;
  }

  async getBoardByOwnerId(ownerId: number): Promise<BoardType[]> {
    const boards = await Board.findAll({
      where: { ownerId }
    });
    return boards.map(board => board.toJSON() as BoardType);
  }

  async createBoard(board: InsertBoard): Promise<BoardType> {
    const newBoard = await Board.create(board);
    
    // 게시판 캐시 무효화
    appCache.invalidate('boards');
    
    return newBoard.toJSON() as BoardType;
  }

  async updateBoard(id: number, board: Partial<BoardType>): Promise<BoardType | undefined> {
    const [updated] = await Board.update(board, {
      where: { id }
    });
    
    if (updated === 0) {
      return undefined;
    }
    
    // 게시판 캐시 무효화
    appCache.invalidate('boards');
    
    const updatedBoard = await Board.findByPk(id);
    return updatedBoard?.toJSON() as BoardType;
  }

  async deleteBoard(id: number): Promise<boolean> {
    const deleted = await Board.destroy({
      where: { id }
    });
    
    // 게시판 캐시 무효화
    appCache.invalidate('boards');
    
    return deleted > 0;
  }

  // Board post operations
  async getBoardPosts(boardId: number): Promise<BoardPostType[]> {
    // 캐시 키 생성
    const cacheKey = `board:posts:${boardId}`;
    
    // 캐시에서 먼저 조회
    const cachedPosts = appCache.get(cacheKey);
    if (cachedPosts) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedPosts;
    }
    
    // 캐시에 없으면 DB에서 조회
    const posts = await BoardPost.findAll({
      where: { boardId }
    });
    
    const result = posts.map(post => post.toJSON() as BoardPostType);
    
    // 결과를 캐시에 저장
    appCache.set(cacheKey, result);
    
    return result;
  }

  async getBoardPostById(id: number): Promise<BoardPostType | undefined> {
    const post = await BoardPost.findByPk(id);
    return post?.toJSON() as BoardPostType | undefined;
  }

  async createBoardPost(post: InsertBoardPost): Promise<BoardPostType> {
    const newPost = await BoardPost.create(post);
    
    // 게시글 캐시 무효화
    appCache.invalidate(`board:posts:${post.boardId}`);
    
    return newPost.toJSON() as BoardPostType;
  }

  async updateBoardPost(id: number, post: Partial<BoardPostType>): Promise<BoardPostType | undefined> {
    const [updated] = await BoardPost.update(post, {
      where: { id }
    });
    
    if (updated === 0) {
      return undefined;
    }
    
    // 먼저 기존 게시글을 조회하여 boardId 확인
    const existingPost = await BoardPost.findByPk(id);
    if (existingPost) {
      // 게시글 캐시 무효화
      appCache.invalidate(`board:posts:${existingPost.get('boardId')}`);
      
      // boardId가 변경된 경우 새 boardId의 캐시도 무효화
      if (post.boardId && post.boardId !== existingPost.get('boardId')) {
        appCache.invalidate(`board:posts:${post.boardId}`);
      }
    }
    
    const updatedPost = await BoardPost.findByPk(id);
    return updatedPost?.toJSON() as BoardPostType;
  }

  async deleteBoardPost(id: number): Promise<boolean> {
    // 먼저 기존 게시글을 조회하여 boardId 확인
    const existingPost = await BoardPost.findByPk(id);
    let boardId;
    
    if (existingPost) {
      boardId = existingPost.get('boardId');
    }
    
    const deleted = await BoardPost.destroy({
      where: { id }
    });
    
    // 게시글 캐시 무효화
    if (boardId) {
      appCache.invalidate(`board:posts:${boardId}`);
    }
    
    return deleted > 0;
  }

  // Auth operations
  async validateCredentials(username: string, password: string): Promise<{ user: EmployeeType | undefined, role: "employee" | "admin" | undefined }> {
    try {
      console.log('validateCredentials 호출됨:', { username, passwordLength: password?.length });
      
      // 직원 확인
      const employee = await Employee.findOne({ where: { username } });
      
      if (employee) {
        const employeeData = employee.toJSON() as EmployeeType;
        console.log('사용자 찾음:', { 
          id: employeeData.id, 
          username: employeeData.username, 
          passwordHash: employeeData.password.substring(0, 10) + '...' 
        });
        
        // 매개변수 검증
        if (!password || !employeeData.password) {
          console.error('비밀번호 또는 해시가 없음:', { password: !!password, hash: !!employeeData.password });
          return { user: undefined, role: undefined };
        }
        
        // 평문 비밀번호 비교 추가
        if (password === employeeData.password) {
          console.log('평문 비밀번호 일치');
          const role = employeeData.isAdmin ? "admin" : "employee";
          return { user: employeeData, role };
        }
        
        try {
          console.log('bcrypt.compare 시도:', { password: password?.length > 0, hash: employeeData.password?.length > 0 });
          const isValid = await bcrypt.compare(password, employeeData.password);
          console.log('비밀번호 검증 결과:', isValid);
          if (isValid) {
            const role = employeeData.isAdmin ? "admin" : "employee";
            return { user: employeeData, role };
          }
        } catch (bcryptError) {
          console.error('Employee bcrypt.compare error:', bcryptError);
          console.error('Error details:', { password: typeof password, passwordLength: password?.length, hash: typeof employeeData.password, hashLength: employeeData.password?.length });
        }
      } else {
        console.log('해당 사용자를 찾을 수 없음:', username);
      }

      return { user: undefined, role: undefined };
    } catch (error) {
      console.error('validateCredentials error:', error);
      return { user: undefined, role: undefined };
    }
  }

  // Posts operations
  async getAllPosts(): Promise<any[]> {
    try {
      await this.ensurePostsTable();
      await this.ensureAdminEmployee();
      
      // 게시글 목록 조회 (작성자 정보 포함)
      const result = await sequelize.query(`
        SELECT p.*, e.username as author_name
        FROM posts p
        LEFT JOIN employees e ON p.author_id = e.id
        ORDER BY p.is_important DESC, p.created_at DESC
      `, { type: 'SELECT' });
      
      console.log('게시글 조회 결과:', result);
      
      // 결과를 캐멀 케이스로 변환
      return (result as any[]).map((post: any) => ({
        id: post.id?.toString(),
        title: post.title,
        content: post.content,
        authorId: post.author_id?.toString(),
        authorName: post.author_name || '알 수 없음',
        isImportant: post.is_important,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }));
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }

  async getPostById(id: string): Promise<any | undefined> {
    try {
      await this.ensurePostsTable();
      await this.ensureAdminEmployee();
      
      // 특정 게시글 조회 (작성자 정보 포함)
      const result = await sequelize.query(`
        SELECT p.*, e.username as author_name
        FROM posts p
        LEFT JOIN employees e ON p.author_id = e.id
        WHERE p.id = :id
      `, {
        replacements: { id },
        type: 'SELECT'
      });
      
      if ((result as any[]).length === 0) {
        return undefined;
      }
      
      const post = (result as any[])[0];
      
      // 결과를 캐멀 케이스로 변환
      return {
        id: post.id?.toString(),
        title: post.title,
        content: post.content,
        authorId: post.author_id?.toString(),
        authorName: post.author_name || '알 수 없음',
        isImportant: post.is_important,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      };
    } catch (error) {
      console.error(`Error getting post by id ${id}:`, error);
      return undefined;
    }
  }

  async createPost(post: any): Promise<any> {
    try {
      await this.ensurePostsTable();
      await this.ensureAdminEmployee();
      
      // 게시글 생성
      const result = await sequelize.query(`
        INSERT INTO posts (title, content, author_id, is_important)
        VALUES (:title, :content, :authorId, :isImportant)
        RETURNING *
      `, {
        replacements: {
          title: post.title,
          content: post.content,
          authorId: post.authorId,
          isImportant: post.isImportant || false
        },
        type: 'INSERT'
      });
      
      const insertedId = (result as any[])[0][0]?.id;
      
      // 작성자 정보 가져오기
      const authorResult = await sequelize.query(`
        SELECT username FROM employees WHERE id = :authorId
      `, {
        replacements: { authorId: post.authorId },
        type: 'SELECT'
      });
      
      const authorName = authorResult.length > 0 ? authorResult[0].username : '알 수 없음';
      
      // 생성된 게시글 반환
      return {
        id: insertedId?.toString(),
        title: post.title,
        content: post.content,
        authorId: post.authorId?.toString(),
        authorName: authorName,
        isImportant: post.isImportant || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(id: string, post: any): Promise<any | undefined> {
    try {
      await this.ensurePostsTable();
      
      // 게시글 존재 여부 확인
      const existingPost = await this.getPostById(id);
      if (!existingPost) {
        return undefined;
      }
      
      // 게시글 업데이트
      const updateFields = [];
      const replacements: any = { id };
      
      if (post.title !== undefined) {
        updateFields.push('title = :title');
        replacements.title = post.title;
      }
      
      if (post.content !== undefined) {
        updateFields.push('content = :content');
        replacements.content = post.content;
      }
      
      if (post.isImportant !== undefined) {
        updateFields.push('is_important = :isImportant');
        replacements.isImportant = post.isImportant;
      }
      
      updateFields.push('updated_at = NOW()');
      
      if (updateFields.length === 0) {
        return existingPost;
      }
      
      await sequelize.query(`
        UPDATE posts
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        type: 'UPDATE'
      });
      
      // 업데이트된 게시글 반환
      return {
        ...existingPost,
        ...(post.title !== undefined && { title: post.title }),
        ...(post.content !== undefined && { content: post.content }),
        ...(post.isImportant !== undefined && { isImportant: post.isImportant }),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      return undefined;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      await this.ensurePostsTable();
      
      // 게시글 삭제
      const result = await sequelize.query(`
        DELETE FROM posts
        WHERE id = :id
      `, {
        replacements: { id },
        type: 'DELETE'
      });
      
      return (result as any)[1] > 0;
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      return false;
    }
  }

  private async ensurePostsTable(): Promise<void> {
    try {
      // 테이블이 이미 존재하는지 확인
      const tableExists = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'posts'
        )
      `, { type: 'SELECT' });
      
      if (!(tableExists as any[])[0]?.exists) {
        // 게시글 테이블 생성
        await sequelize.query(`
          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            is_important BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        console.log('게시글 테이블이 생성되었습니다.');
      }
    } catch (error) {
      console.error('게시글 테이블 확인/생성 중 오류:', error);
      throw error;
    }
  }

  private async ensureAdminEmployee(): Promise<void> {
    try {
      // admin 계정이 존재하는지 확인
      const adminExists = await Employee.findOne({ where: { username: 'admin' } });
      
      if (!adminExists) {
        // 기본 관리자 계정 생성 (평문 비밀번호 사용)
        // const hashedPassword = await bcrypt.hash('1234', 10);
        await Employee.create({
          username: 'admin',
          password: '1234', // 평문 비밀번호
          email: 'admin@parkingmanagement.com',
          phone: '010-0000-0000',
          carNumber: 'ADMIN-0000',
          position: '관리자',
          isAdmin: true
        });
        
        console.log('기본 관리자 계정이 추가되었습니다.');
      }
    } catch (error) {
      console.error('관리자 계정 확인/생성 중 오류:', error);
      throw error;
    }
  }
}

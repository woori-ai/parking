import bcrypt from 'bcrypt';
import { Sequelize, DataTypes } from 'sequelize';

// Docker 네트워크 내에서는 postgres를 서비스 이름으로 사용
const sequelize = new Sequelize('postgresql://postgres:postgres@postgres:5432/parking_management', {
  dialect: 'postgres',
  logging: console.log
});

async function initDatabase() {
  try {
    // 데이터베이스 테이블 생성 (force: true는 기존 테이블을 삭제하고 다시 생성)
    console.log('데이터베이스 테이블 생성 중...');
    await sequelize.authenticate();
    console.log('PostgreSQL 연결 성공!');
    
    // Admin 모델 정의
    const Admin = sequelize.define('Admin', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      tableName: 'admins',
      timestamps: true,
      underscored: true,
    });

    // Employee 모델 정의
    const Employee = sequelize.define('Employee', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      carNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'car_number',
      },
      position: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_admin',
      },
    }, {
      tableName: 'employees',
      timestamps: true,
      underscored: true,
    });

    // ManagerWork 모델 정의
    const ManagerWork = sequelize.define('ManagerWork', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      employeeId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'employee_id',
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isWorking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_working',
      },
      workCheck: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'work_check',
      },
      workDate: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'work_date',
      },
      workTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'work_time',
      },
    }, {
      tableName: 'manager_works',
      timestamps: true,
      underscored: true,
    });

    // VisitorReservation 모델 정의
    const VisitorReservation = sequelize.define('VisitorReservation', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      visitorName: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        field: 'visitor_name',
      },
      carNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'car_number',
      },
      visitDate: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'visit_date',
      },
      visitPurpose: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'visit_purpose',
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        field: 'contact_number',
      },
      inDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'in_date',
      },
      inTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'in_time',
      },
      outDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'out_date',
      },
      outTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'out_time',
      },
      registeredById: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'registered_by_id',
      },
    }, {
      tableName: 'visitor_reservations',
      timestamps: true,
      underscored: true,
    });

    // ParkingRecord 모델 정의
    const ParkingRecord = sequelize.define('ParkingRecord', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      carNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'car_number',
      },
      carType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'car_type',
      },
      inDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'in_date',
      },
      inTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'in_time',
      },
      outDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'out_date',
      },
      outTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'out_time',
      },
      parkingSpot: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'parking_spot',
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'employee_id',
      },
      visitorName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'visitor_name',
      },
      entryTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'entry_timestamp',
      },
      exitTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'exit_timestamp',
      },
    }, {
      tableName: 'parking_records',
      timestamps: true,
      underscored: true,
    });

    // ChatMessage 모델 정의
    const ChatMessage = sequelize.define('ChatMessage', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id',
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'receiver_id',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_read',
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'chat_messages',
      timestamps: true,
      underscored: true,
    });

    // JobHelp 모델 정의
    const JobHelp = sequelize.define('JobHelp', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
      },
    }, {
      tableName: 'job_helps',
      timestamps: true,
      underscored: true,
    });

    // Board 모델 정의
    const Board = sequelize.define('Board', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'owner_id',
      },
      ownerType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'owner_type',
      },
      isManagerBoard: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_manager_board',
      },
    }, {
      tableName: 'boards',
      timestamps: true,
      underscored: true,
    });

    // BoardPost 모델 정의
    const BoardPost = sequelize.define('BoardPost', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      boardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'board_id',
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
      },
    }, {
      tableName: 'board_posts',
      timestamps: true,
      underscored: true,
    });

    // RegistrationRequest 모델 정의
    const RegistrationRequest = sequelize.define('RegistrationRequest', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      carNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'car_number',
      },
      position: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      requestDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'request_date',
      },
    }, {
      tableName: 'registration_requests',
      timestamps: true,
      underscored: true,
    });
    
    // 테이블 동기화
    await sequelize.sync({ force: true });
    
    // 관리자 계정 생성
    console.log('관리자 계정 생성 중...');
    const hashedPassword = await bcrypt.hash('1234', 10);
    
    // 관리자 계정을 Employee 테이블에 생성 (isAdmin = true)
    await Employee.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@parkingmanagement.com', 
      phone: '010-1234-5678',
      carNumber: 'ADMIN-001',
      position: '관리자',
      isAdmin: true
    });
    
    console.log('데이터베이스 초기화 완료!');
    console.log('관리자 계정이 Employee 테이블에 생성되었습니다.');
    console.log('- 아이디: admin');
    console.log('- 비밀번호: 1234');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
    process.exit(1);
  }
}

initDatabase();

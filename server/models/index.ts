import sequelize, { testConnection } from './sequelize';
import Employee from './employee';
import RegistrationRequest from './registrationRequest';
import Admin from './admin';
import ManagerWork from './managerWork';
import ParkingRecord from './parkingRecord';
import VisitorReservation from './visitorReservation';
import ChatMessage from './chatMessage';
import JobHelp from './jobHelp';
import Board from './board';
import BoardPost from './boardPost';

// 모델 간 관계 설정 (필요한 경우)
// 예: Employee.hasMany(ParkingRecord, { foreignKey: 'employeeId' });

// 데이터베이스 동기화 함수
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('데이터베이스 동기화 완료');
    return true;
  } catch (error) {
    console.error('데이터베이스 동기화 실패:', error);
    return false;
  }
};

export {
  sequelize,
  testConnection,
  Employee,
  RegistrationRequest,
  Admin,
  ManagerWork,
  ParkingRecord,
  VisitorReservation,
  ChatMessage,
  JobHelp,
  Board,
  BoardPost
};

import { 
  Employee, 
  Admin, 
  ParkingRecord, 
  VisitorReservation, 
  RegistrationRequest,
  ManagerWork,
  ChatMessage,
  JobHelp
} from "@shared/schema";

export type AuthUser = {
  id: number;
  username: string;
  role: 'employee' | 'admin' | 'superadmin';
};

export type ModalAction = 'entry' | 'exit';

export type FormMode = 'create' | 'edit';

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
};

export type VehicleSearchResult = {
  id: number;
  carNumber: string;
  type: 'employee' | 'visitor';
  owner: string;
  status: 'parked' | 'not_parked';
  timestamp: string | null;
  parkingRecordId?: number;
  isUnregistered?: boolean;
  visitPurpose?: string;
};

export type ChatUserInfo = {
  id: number;
  username: string;
  role: string;
  isOnline?: boolean;
  unreadCount?: number;
};

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export type MenuItem = {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
  badge?: number | null;
};

// 기존 타입들 내보내기
export type {
  Employee,
  Admin,
  ParkingRecord,
  VisitorReservation,
  RegistrationRequest,
  ManagerWork,
  ChatMessage,
  JobHelp
};

import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

// 인터페이스를 사용하여 Employee 타입 정의
interface EmployeeAttributes {
  id: number;
  username: string;
  password: string;
  email: string;
  phone: string;
  carNumber: string;
  position: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 인터페이스를 확장한 모델 클래스 정의
class Employee extends Model<EmployeeAttributes> implements EmployeeAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public email!: string;
  public phone!: string;
  public carNumber!: string;
  public position!: string;
  public isAdmin!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Employee.init(
  {
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
      allowNull: false,
      defaultValue: false,
      field: 'is_admin',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    }
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    underscored: true,
  }
);

export default Employee;

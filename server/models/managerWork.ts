import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

class ManagerWork extends Model {
  public id!: number;
  public employeeId!: string;
  public password!: string;
  public phone!: string;
  public isWorking!: boolean;
  public workCheck!: boolean;
  public workDate!: string;
  public workTime!: string;

  // 타임스탬프
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ManagerWork.init(
  {
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
      allowNull: false,
      defaultValue: false,
      field: 'is_working',
    },
    workCheck: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
      allowNull: false,
      field: 'work_time',
    },
  },
  {
    sequelize,
    modelName: 'ManagerWork',
    tableName: 'manager_works',
    timestamps: true,
    underscored: true,
  }
);

export default ManagerWork;

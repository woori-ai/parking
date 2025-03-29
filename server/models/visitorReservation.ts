import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

class VisitorReservation extends Model {
  public id!: number;
  public visitorName!: string;
  public carNumber!: string;
  public visitDate!: string;
  public visitPurpose!: string;
  public contactNumber!: string;
  public inDate!: string | null;
  public inTime!: string | null;
  public outDate!: string | null;
  public outTime!: string | null;
  public registeredById!: number;

  // 타임스탬프
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VisitorReservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    visitorName: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
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
  },
  {
    sequelize,
    modelName: 'VisitorReservation',
    tableName: 'visitor_reservations',
    timestamps: true,
    underscored: true,
  }
);

export default VisitorReservation;

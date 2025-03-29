import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

class ParkingRecord extends Model {
  public id!: number;
  public carNumber!: string;
  public inDate!: string | null;
  public inTime!: string | null;
  public outDate!: string | null;
  public outTime!: string | null;
  public entryTimestamp!: Date | null;
  public exitTimestamp!: Date | null;

  // 타임스탬프
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParkingRecord.init(
  {
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
  },
  {
    sequelize,
    modelName: 'ParkingRecord',
    tableName: 'parking_records',
    timestamps: true,
    underscored: true,
  }
);

export default ParkingRecord;

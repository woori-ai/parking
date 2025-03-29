import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

class RegistrationRequest extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public email!: string;
  public phone!: string;
  public carNumber!: string;
  public position!: string;
  public requestDate!: Date;

  // 타임스탬프
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RegistrationRequest.init(
  {
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
  },
  {
    sequelize,
    modelName: 'RegistrationRequest',
    tableName: 'registration_requests',
    timestamps: true,
    underscored: true,
  }
);

export default RegistrationRequest;

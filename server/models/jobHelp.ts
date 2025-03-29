import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';

class JobHelp extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public createdBy!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

JobHelp.init(
  {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'JobHelp',
    tableName: 'job_help',
    timestamps: true,
    underscored: true,
  }
);

export default JobHelp;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserRanking = sequelize.define('UserRanking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    overallRank: {
        type: DataTypes.INTEGER,
        field: 'overall_rank'
    },
    categoryRank: {
        type: DataTypes.INTEGER,
        field: 'category_rank'
    },
    totalUsers: {
        type: DataTypes.INTEGER,
        field: 'total_users'
    },
    percentile: {
        type: DataTypes.DECIMAL(5, 2)
    },
    category: {
        type: DataTypes.STRING(50)
    }
}, {
    tableName: 'user_rankings',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
});

// Define associations
User.hasOne(UserRanking, { foreignKey: 'userId', as: 'ranking' });
UserRanking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = UserRanking;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const PerformanceMetric = sequelize.define('PerformanceMetric', {
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
    fitnessIndex: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        field: 'fitness_index'
    },
    consistencyScore: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'consistency_score'
    },
    performanceScore: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'performance_score'
    },
    varietyScore: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'variety_score'
    },
    intensityScore: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'intensity_score'
    },
    weeklyChange: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'weekly_change'
    },
    monthlyChange: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'monthly_change'
    },
    workoutData: {
        type: DataTypes.JSON,
        field: 'workout_data'
    },
    caloriesPredicted: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'calories_predicted'
    },
    workoutType: {
        type: DataTypes.STRING(100),
        field: 'workout_type'
    },
    duration: {
        type: DataTypes.INTEGER, // minutes
        field: 'duration_minutes'
    }
}, {
    tableName: 'performance_metrics',
    timestamps: true,
    createdAt: 'recorded_at',
    updatedAt: false
});

// Define associations
User.hasMany(PerformanceMetric, { foreignKey: 'userId', as: 'metrics' });
PerformanceMetric.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = PerformanceMetric;

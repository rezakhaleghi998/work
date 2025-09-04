const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING(50),
        field: 'last_name'
    },
    height: {
        type: DataTypes.DECIMAL(5, 2)
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2)
    },
    age: {
        type: DataTypes.INTEGER
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other')
    },
    metabolicRate: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'metabolic_rate'
    },
    efficiencyGrade: {
        type: DataTypes.STRING(5),
        field: 'efficiency_grade'
    },
    lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = User;

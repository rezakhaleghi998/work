const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    // Production PostgreSQL on Render
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
} else {
    // Development SQLite
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './fitness_tracker.db',
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
}

// Test connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established successfully');
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });

module.exports = sequelize;

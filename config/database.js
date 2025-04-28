const { Sequelize } = require('sequelize');
const rateLimit = require('express-rate-limit');

const DB_NAME = process.env.DB_NAME || 'todo_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || 'db'; // Mặc định là 'db' khi chạy docker-compose

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: console.log,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    },
    timezone: '+07:00'
});

// Áp dụng rate limit cho các route khác
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10000, // tăng lên 1000 request/phút
  message: 'Too many requests, please try again later.'
});

module.exports = sequelize; 
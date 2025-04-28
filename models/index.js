const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) user.password = await bcrypt.hash(user.password, 10);
        }
    }
});

User.prototype.checkPassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

const Todo = sequelize.define('Todo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    task: { type: DataTypes.STRING, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    category: { type: DataTypes.ENUM('work', 'personal', 'shopping'), allowNull: false },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'todos'
});

User.hasMany(Todo, { foreignKey: 'userId' });
Todo.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Todo }; 
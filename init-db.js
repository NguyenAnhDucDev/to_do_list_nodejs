const { sequelize, User, Todo } = require('./models');

async function initializeDatabase() {
    try {
        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync all models
        await sequelize.sync({ force: true }); // This will drop all tables and recreate them
        console.log('All models were synchronized successfully.');

        // Create some initial data if needed
        const user = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123'
        });

        await Todo.create({
            task: 'Welcome to Todo List',
            completed: false,
            category: 'personal',
            priority: 'medium',
            due_date: new Date(),
            userId: user.id
        });

        console.log('Initial data has been created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to initialize database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 
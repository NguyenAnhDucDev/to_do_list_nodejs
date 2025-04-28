const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const sequelize = require('./config/database');
const { User, Todo } = require('./models');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const helmetCsp = require('helmet-csp');
const http = require('http');
const io = require('socket.io');
const winston = require('winston');
const prometheusMiddleware = require('express-prometheus-middleware');

const app = express();
const server = http.createServer(app);
const ioServer = io(server);

// Security middleware
app.use(helmet());
app.use(helmetCsp({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(morgan('dev'));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001',
    credentials: true
}));

// Cookie parser middleware
app.use(cookieParser());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
});
app.use(sessionMiddleware);

// Chia sẻ session cho socket.io
ioServer.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        console.log('Attempting to register user:', username);
        const user = await User.create({ username, password, email });
        console.log('User registered successfully:', user.username);
        res.redirect('/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { error: 'Username or email already exists' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log('Attempting login for username:', username);
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            console.log('User not found');
            return res.render('login', { error: 'Invalid username or password' });
        }

        const isValidPassword = await user.checkPassword(password);
        if (!isValidPassword) {
            console.log('Invalid password');
            return res.render('login', { error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        console.log('Login successful for user:', username);
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred during login. Please try again.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Todo routes
app.get('/', requireAuth, async (req, res) => {
    const filters = {
        category: req.query.category,
        completed: req.query.completed === 'true' ? true : 
                  req.query.completed === 'false' ? false : undefined,
        search: req.query.search,
        priority: req.query.priority
    };

    try {
        const where = { userId: req.session.userId };
        
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.completed !== undefined) {
            where.completed = filters.completed;
        }
        if (filters.search) {
            where.task = {
                [sequelize.Op.like]: `%${filters.search}%`
            };
        }
        if (filters.priority) {
            where.priority = filters.priority;
        }

        const todos = await Todo.findAll({
            where,
            order: [
                ['due_date', 'ASC'],
                ['priority', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        res.render('index', { 
            todos,
            username: req.session.username,
            filters
        });
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.render('index', { todos: [], username: req.session.username, filters });
    }
});

app.post('/todos', requireAuth, async (req, res) => {
    const { task, category, priority, due_date } = req.body;
    if (task && task.trim() !== '' && category && due_date) {
        try {
            await Todo.create({
                task: task.trim(),
                category,
                priority,
                due_date,
                userId: req.session.userId
            });
        } catch (err) {
            console.error('Error adding todo:', err);
        }
    }
    res.redirect('/');
});

app.post('/todos/:id/edit', requireAuth, async (req, res) => {
    const { task, category, due_date, priority } = req.body;
    const id = req.params.id;
    try {
        await Todo.update({
            task,
            category,
            due_date,
            priority
        }, {
            where: { id, userId: req.session.userId }
        });
    } catch (err) {
        console.error('Error updating todo:', err);
    }
    res.redirect('/');
});

app.post('/todos/:id/toggle', requireAuth, async (req, res) => {
    const id = req.params.id;
    try {
        const todo = await Todo.findOne({ where: { id, userId: req.session.userId } });
        if (todo) {
            await todo.update({ completed: !todo.completed });
        }
    } catch (err) {
        console.error('Error toggling todo:', err);
    }
    res.redirect('/');
});

app.post('/todos/:id/delete', requireAuth, async (req, res) => {
    const id = req.params.id;
    try {
        await Todo.destroy({
            where: { id, userId: req.session.userId }
        });
    } catch (err) {
        console.error('Error deleting todo:', err);
    }
    res.redirect('/');
});

// Socket.IO: Lấy danh sách todos cho user hiện tại
ioServer.on('connection', (socket) => {
    // Lấy tất cả todos của user
    socket.on('getTodos', async () => {
        try {
            const userId = socket.request.session?.userId;
            if (!userId) return;
            const todos = await Todo.findAll({ where: { userId } });
            socket.emit('todos', todos);
        } catch (err) {
            console.error('Error fetching todos via socket:', err);
        }
    });

    // Lấy các task cần hoàn thiện (chưa completed)
    socket.on('getIncompleteTodos', async () => {
        try {
            const userId = socket.request.session?.userId;
            if (!userId) return;
            const todos = await Todo.findAll({ where: { userId, completed: false } });
            socket.emit('incompleteTodos', todos);
        } catch (err) {
            console.error('Error fetching incomplete todos via socket:', err);
        }
    });

    // Tạo todo mới
    socket.on('createTodo', async (todoData) => {
        try {
            console.log('Dữ liệu nhận được từ client:', todoData);
            const userId = socket.request.session && socket.request.session.userId;
            if (!userId) {
                socket.emit('todoError', 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!');
                return;
            }
            let dueDateValue = todoData.due_date;
            if (!dueDateValue || dueDateValue === 'Invalid Date') {
                socket.emit('todoError', 'Ngày hạn không hợp lệ hoặc bị thiếu!');
                return;
            }
            dueDateValue = String(dueDateValue);
            console.log('Giá trị due_date nhận ở server (sau ép kiểu):', dueDateValue, typeof dueDateValue);
            const todo = await Todo.create({
                task: todoData.task,
                category: todoData.category,
                due_date: dueDateValue,
                priority: todoData.priority,
                completed: false,
                userId: userId
            });
            socket.emit('todoCreated', todo);
            socket.broadcast.emit('todoCreated', todo);
        } catch (error) {
            console.error('Error creating todo:', error);
            socket.emit('todoError', 'Không thể thêm task mới. Vui lòng thử lại!');
        }
    });

    // Sửa todo
    socket.on('updateTodo', async (data) => {
        try {
            const userId = socket.request.session?.userId;
            if (!userId) return;
            const todo = await Todo.findOne({ where: { id: data.id, userId } });
            if (todo) {
                await todo.update({
                    task: data.task ?? todo.task,
                    category: data.category ?? todo.category,
                    priority: data.priority ?? todo.priority,
                    due_date: data.due_date ?? todo.due_date,
                    completed: typeof data.completed === 'boolean' ? data.completed : todo.completed
                });
                ioServer.emit('todoUpdated', todo);
            }
        } catch (err) {
            console.error('Error updating todo via socket:', err);
        }
    });

    // Xóa todo
    socket.on('deleteTodo', async (todoId) => {
        try {
            const userId = socket.request.session?.userId;
            if (!userId) return;
            const todo = await Todo.findOne({ where: { id: todoId, userId } });
            if (todo) {
                await todo.destroy();
                ioServer.emit('todoDeleted', todoId);
            }
        } catch (err) {
            console.error('Error deleting todo via socket:', err);
        }
    });
});

// Winston logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// Prometheus monitoring
app.use(prometheusMiddleware({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5],
}));

// Sync database and start server
const PORT = process.env.PORT || 3001;
sequelize.authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('Database synchronized successfully');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    }); 
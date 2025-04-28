// Connect to Socket.IO server
const socket = io();

// DOM Elements
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todo-list');

// Handle form submission
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(todoForm);
    const todo = {
        task: formData.get('task'),
        category: formData.get('category'),
        due_date: formData.get('due_date'),
        priority: formData.get('priority')
    };
    console.log('Dữ liệu gửi lên server:', todo);
    if (!todo.due_date) {
        alert('Bạn phải chọn ngày hạn!');
        return;
    }

    // Emit create todo event
    socket.emit('createTodo', todo);
    
    // Reset form
    todoForm.reset();
});

// Handle todo creation
socket.on('todoCreated', (todo) => {
    const todoElement = createTodoElement(todo);
    todoList.insertBefore(todoElement, todoList.firstChild);
});

// Handle todo update
socket.on('todoUpdated', (todo) => {
    const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
    if (todoElement) {
        const updatedElement = createTodoElement(todo);
        todoElement.replaceWith(updatedElement);
    }
});

// Handle todo deletion
socket.on('todoDeleted', (todoId) => {
    const todoElement = document.querySelector(`[data-id="${todoId}"]`);
    if (todoElement) {
        todoElement.remove();
    }
});

// Handle todo error
socket.on('todoError', (message) => {
    alert(message); // Hoặc thay bằng hiển thị ra giao diện đẹp hơn
});

// Create todo element
function createTodoElement(todo) {
    const todoElement = document.createElement('div');
    todoElement.className = 'todo-item';
    todoElement.setAttribute('data-id', todo.id);

    todoElement.innerHTML = `
        <div class="todo-content">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.task}</span>
            <span class="todo-category">${todo.category}</span>
            <span class="todo-priority ${todo.priority}">${todo.priority}</span>
            ${todo.due_date ? `<span class="todo-due-date">${formatDate(todo.due_date)}</span>` : ''}
        </div>
        <div class="todo-actions">
            <button class="edit-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const checkbox = todoElement.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
        socket.emit('updateTodo', { id: todo.id, completed: checkbox.checked });
    });

    const editBtn = todoElement.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        const newTask = prompt('Edit task:', todo.task);
        if (newTask && newTask !== todo.task) {
            socket.emit('updateTodo', { id: todo.id, task: newTask });
        }
    });

    const deleteBtn = todoElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this todo?')) {
            socket.emit('deleteTodo', todo.id);
        }
    });

    return todoElement;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export functions for use in other scripts
window.todoSocket = {
    updateTodo,
    createTodo,
    deleteTodo
}; 
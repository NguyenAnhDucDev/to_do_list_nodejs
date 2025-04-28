// Đơn vị test mẫu cho Todo model
const { Todo } = require('../models');

describe('Todo Model', () => {
  it('should be defined', () => {
    expect(Todo).toBeDefined();
  });

  it('should have required fields', () => {
    const fields = ['task', 'completed', 'category', 'priority', 'due_date', 'userId'];
    fields.forEach(field => {
      expect(Todo.rawAttributes[field]).toBeDefined();
    });
  });
}); 
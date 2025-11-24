const express = require('express');
const router = express.Router();
const Todo = require('../models/todo');

// GET /api/todos
router.get('/', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

// POST /api/todos
router.post('/', async (req, res) => {
  const { title } = req.body;
  const todo = new Todo({ title });
  await todo.save();
  res.status(201).json(todo);
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const todo = await Todo.findByIdAndUpdate(id, updates, { new: true });
  res.json(todo);
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await Todo.findByIdAndDelete(id);
  res.status(204).send();
});

module.exports = router;

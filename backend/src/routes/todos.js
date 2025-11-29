const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('./auth');

// GET /api/todos
// GET /api/todos - returns embedded todos for the authenticated user
router.get('/', auth.authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('todos');
  if (!user) return res.status(404).json({ error: 'User not found' });
  // return todos sorted by createdAt desc
  const todos = (user.todos || []).slice().sort((a, b) => b.createdAt - a.createdAt);
  res.json(todos);
});

// GET /api/todos/completed - return completed activity snapshots stored for user
router.get('/completed', auth.authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('completedActivities');
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Filter out snapshots that correspond to recurring activities (they should not be recoverable)
  const raw = (user.completedActivities || []).slice();
  const filtered = raw.filter(snap => {
    try {
      if (!snap || !snap.originalId) return true
      // if the original activity still exists and is recurring, exclude the snapshot
      const orig = user.todos && Array.isArray(user.todos) ? user.todos.find(t => String(t._id) === String(snap.originalId)) : null
      if (orig && orig.recurring) return false
      return true
    } catch (_) { return true }
  })
  const list = filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  res.json(list);
});

// POST /api/todos
// POST /api/todos - create todo for authenticated user
// POST /api/todos - create embedded todo inside authenticated user's document
router.post('/', auth.authMiddleware, async (req, res) => {
  const { title, description, name, recurring, weekdays, dueDate, color, parentId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const todo = {
    title,
    description: description || '',
    parentId: parentId || null,
    name: name || '',
    recurring: !!recurring,
    weekdays: Array.isArray(weekdays) ? weekdays : [],
    dueDate: dueDate ? new Date(dueDate) : undefined,
    color: color || '#000000'
  };
  user.todos.push(todo);
  await user.save();
  // return the newly created subdoc (it's the last one)
  res.status(201).json(user.todos[user.todos.length - 1]);
});

// PUT /api/todos/:id
// PUT /api/todos/:id - update only if the todo belongs to the authenticated user
// PUT /api/todos/:id - update embedded todo owned by authenticated user
router.put('/:id', auth.authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const todo = user.todos.id(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  // apply allowed updates
  const wasCompleted = !!todo.completed;
  Object.assign(todo, updates);

  // handle transition of completed flag: add snapshot on false->true, remove snapshots on true->false
  try {
    const nowCompleted = !!todo.completed;
    // remove any existing snapshots for this todo to avoid duplicates
    if (!Array.isArray(user.completedActivities)) user.completedActivities = [];
    user.completedActivities = user.completedActivities.filter(a => String(a.originalId) !== String(todo._id));

    if (!wasCompleted && nowCompleted) {
      // Do not store snapshots for recurring activities; they should not be recoverable
      if (!todo.recurring) {
        const snapshot = {
          originalId: todo._id,
          title: todo.title || '',
          description: todo.description || '',
          completedAt: new Date(),
          cardId: todo.parentId || null,
          cardTitle: null,
          cardColor: null
        };
        try {
          // attempt to infer card title/color from other todos
          const cardObj = user.todos.find(c => String(c._id) === String(snapshot.cardId));
          if (cardObj) {
            snapshot.cardTitle = cardObj.title || null;
            snapshot.cardColor = cardObj.color || null;
          }
        } catch (_) {}
        // push latest snapshot to the front
        user.completedActivities.unshift(snapshot);
        // keep a reasonable cap
        if (user.completedActivities.length > 200) user.completedActivities = user.completedActivities.slice(0, 200);
      }
    }
    // if was completed and now un-completed, we've already removed existing snapshots above
  } catch (e) {
    console.error('Failed to update completed snapshots', e);
  }

  await user.save();
  // If the todo was just completed and is recurring, create the next occurrence
  let newTodo = null;
  try {
    const nowCompleted = !!todo.completed;
    if (!wasCompleted && nowCompleted && todo.recurring) {
      // helper: map weekdays strings to numbers and compute next occurrence
      function weekdayStringToNumber(s) {
        const map = { dom:0, seg:1, ter:2, qua:3, qui:4, sex:5, sab:6 };
        return map[String(s).toLowerCase()] ?? null;
      }
      function getNextDueForWeekdays(baseDate, weekdaysArr) {
        if (!Array.isArray(weekdaysArr) || weekdaysArr.length === 0) return null;
        const nums = weekdaysArr.map(weekdayStringToNumber).filter(n => n !== null);
        if (nums.length === 0) return null;
        const base = new Date(baseDate);
        const hour = base.getHours();
        const minute = base.getMinutes();
        const second = base.getSeconds();
        for (let i = 1; i <= 14; i++) {
          const cand = new Date(base);
          cand.setDate(base.getDate() + i);
          if (nums.includes(cand.getDay())) {
            cand.setHours(hour, minute, second, 0);
            return cand;
          }
        }
        return null;
      }

      let nextDue = null;
      if (Array.isArray(todo.weekdays) && todo.weekdays.length > 0) {
        nextDue = getNextDueForWeekdays(todo.dueDate || new Date(), todo.weekdays);
      }
      if (!nextDue) {
        nextDue = todo.dueDate ? new Date(todo.dueDate) : new Date();
        nextDue.setDate(nextDue.getDate() + 1);
      }

      const created = {
        title: todo.title,
        description: todo.description || '',
        parentId: todo.parentId || null,
        name: todo.name || '',
        recurring: true,
        weekdays: Array.isArray(todo.weekdays) ? todo.weekdays : [],
        dueDate: nextDue,
        color: todo.color || '#000000'
      };
      user.todos.push(created);
      await user.save();
      newTodo = user.todos[user.todos.length - 1];
    }
  } catch (e) {
    console.error('Failed to create next recurring occurrence', e);
  }

  // respond with the updated todo and optional newly created occurrence
  res.json({ updated: todo, newTodo });
});

// DELETE /api/todos/:id
// DELETE /api/todos/:id - delete only if owned by authenticated user
// DELETE /api/todos/:id - remove embedded todo
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const todo = user.todos.id(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  todo.remove();
  await user.save();
  res.status(204).send();
});

module.exports = router;

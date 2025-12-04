const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('./auth');
const { DateTime } = require('luxon');
const { sendEmail } = require('../utils/email');

// Helper: parse a client `datetime-local` style string (YYYY-MM-DDTHH:mm or with :ss)
// as local time (so it won't be interpreted as UTC). If input is already a
// Date or contains timezone info, fall back to `new Date()`.
function parseLocalDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  // match YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (datetime-local inputs)
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = m[6] ? parseInt(m[6], 10) : 0;
    // Interpret the client-provided local datetime as America/Sao_Paulo
    const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: 'America/Sao_Paulo' });
    return dt.isValid ? dt.toJSDate() : null;
  }
  // Try ISO parsing with Luxon; it will respect timezone info if present
  const iso = String(input);
  let dt = DateTime.fromISO(iso);
  if (dt.isValid) return dt.toJSDate();
  // Fallback to JS Date parsing as last resort
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

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
  const user = await User.findById(req.user.id).select('completedActivities todos');
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Return snapshots in reverse chronological order. Include snapshots for
  // recurring activities as well (the frontend uses these for display; it can
  // choose whether to allow recovery).
  const raw = (user.completedActivities || []).slice();
  const list = raw.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  res.json(list);
});

// POST /api/todos
// POST /api/todos - create todo for authenticated user
// POST /api/todos - create embedded todo inside authenticated user's document
router.post('/', auth.authMiddleware, async (req, res) => {
  const { title, description, name, recurring, weekdays, dueDate, color, parentId, reminder, reminderDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // reminders are mutually exclusive with recurring activities
  if (reminder && recurring) return res.status(400).json({ error: 'A todo cannot be both recurring and a reminder' });

  const parsedReminderDate = reminder ? (reminderDate ? parseLocalDate(reminderDate) : null) : null;
  if (reminder && !parsedReminderDate) return res.status(400).json({ error: 'Reminder requires a valid date/time' });

  const todo = {
    title,
    description: description || '',
    parentId: parentId || null,
    name: name || '',
    recurring: !!recurring,
    reminder: !!reminder,
    reminderDate: parsedReminderDate || undefined,
    weekdays: Array.isArray(weekdays) ? weekdays : [],
    dueDate: dueDate ? parseLocalDate(dueDate) : undefined,
    color: color || '#000000'
  };
  user.todos.push(todo);
  await user.save();
  // return the newly created subdoc (it's the last one)
  const created = user.todos[user.todos.length - 1];

  // Created normally; reminders are handled by the scheduled scanner (`overdueScanner`)
  // so we should not send the email or remove the todo here. The scanner will
  // send the email at the proper time and move the item to completed snapshots.
  res.status(201).json(created);
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
  let createdSnapshot = null;
  // If client sent a dueDate from a datetime-local input (no timezone),
  // parse it as local time to avoid unintended UTC shifts.
  try {
    if (updates && updates.dueDate) {
      const parsed = parseLocalDate(updates.dueDate);
      if (parsed) updates.dueDate = parsed;
      else delete updates.dueDate;
    }
    // parse reminderDate if provided
    if (updates && typeof updates.reminderDate !== 'undefined' && updates.reminderDate) {
      const parsedRem = parseLocalDate(updates.reminderDate);
      if (parsedRem) updates.reminderDate = parsedRem;
      else delete updates.reminderDate;
    }
    // Prevent marking reminders as completed
    if (updates && updates.completed && todo.reminder) {
      return res.status(400).json({ error: 'Reminders cannot be marked as completed' });
    }
  } catch (_) {}

  Object.assign(todo, updates);

  // handle transition of completed flag: add snapshot on false->true, remove snapshots on true->false
  try {
    const nowCompleted = !!todo.completed;
    // remove any existing snapshots for this todo to avoid duplicates
    if (!Array.isArray(user.completedActivities)) user.completedActivities = [];
    user.completedActivities = user.completedActivities.filter(a => String(a.originalId) !== String(todo._id));

    if (!wasCompleted && nowCompleted) {
      // Store a snapshot of the completed activity so it appears in the
      // "completed activities" list. We store snapshots for both recurring
      // and non-recurring activities (the frontend will decide whether to
      // allow recovery for recurring items).
      const snapshot = {
        originalId: todo._id,
        title: todo.title || '',
        description: todo.description || '',
        completedAt: new Date(),
        cardId: todo.parentId || null,
        cardTitle: null,
        cardColor: null,
        recurring: !!todo.recurring,
        // whether this completed snapshot can be recovered back into active todos
        // recurring activities should not be recoverable because completing them
        // generates the next occurrence immediately
        recoverable: !todo.recurring
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
      if (!Array.isArray(user.completedActivities)) user.completedActivities = [];
      user.completedActivities.unshift(snapshot);
      createdSnapshot = snapshot;
      // keep a reasonable cap
      if (user.completedActivities.length > 200) user.completedActivities = user.completedActivities.slice(0, 200);
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
        // Use Luxon in America/Sao_Paulo to compute next occurrence consistently
        const baseDT = DateTime.fromJSDate(baseDate instanceof Date ? baseDate : new Date(), { zone: 'America/Sao_Paulo' });
        const hour = baseDT.hour;
        const minute = baseDT.minute;
        const second = baseDT.second;
        for (let i = 1; i <= 14; i++) {
          const cand = baseDT.plus({ days: i });
          // Luxon weekday: 1 (Mon) ... 7 (Sun). Our map uses 0 (Sun) ... 6 (Sat).
          const candWeekNum = cand.weekday % 7; // converts 7->0 for Sunday
          if (nums.includes(candWeekNum)) {
            const final = cand.set({ hour, minute, second, millisecond: 0 });
            return final.toJSDate();
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
  // include the created snapshot (if any) so clients can update UI immediately
  res.json({ updated: todo, newTodo, snapshot: createdSnapshot });
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
  // Remove embedded todo from the user's todos array.
  try {
    user.todos = (user.todos || []).filter(t => String(t._id) !== String(id));
    await user.save();
  } catch (err) {
    console.error('Failed to remove todo', err);
    return res.status(500).json({ error: 'Failed to remove todo' });
  }
  res.status(204).send();
});

module.exports = router;

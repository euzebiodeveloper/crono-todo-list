const Todo = require('../models/todo');
const User = require('../models/user');
const { sendEmail } = require('../utils/email');
const quotes = require('../utils/quotes');

const ONE_MIN = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const MAX_SENDS = 2;

function pickQuote() {
  const idx = Math.floor(Math.random() * quotes.length);
  return quotes[idx];
}

function formatDateBrazil(date) {
  if (!date) return 'Sem data';
  return new Date(date).toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function weekdayStringToNumber(s) {
  if (!s) return null
  const map = { dom:0, seg:1, ter:2, qua:3, qui:4, sex:5, sab:6 }
  return map[String(s).toLowerCase()] ?? null
}

function getNextDueForWeekdays(baseDate, weekdaysArr) {
  try {
    if (!Array.isArray(weekdaysArr) || weekdaysArr.length === 0) return null
    const nums = weekdaysArr.map(weekdayStringToNumber).filter(n => n !== null)
    if (nums.length === 0) return null
    const base = new Date(baseDate)
    // preserve time of day from baseDate
    const hour = base.getHours()
    const minute = base.getMinutes()
    const second = base.getSeconds()
    for (let i = 1; i <= 14; i++) { // look ahead up to 2 weeks for safety
      const cand = new Date(base)
      cand.setDate(base.getDate() + i)
      if (nums.includes(cand.getDay())) {
        cand.setHours(hour, minute, second, 0)
        return cand
      }
    }
    return null
  } catch (e) {
    return null
  }
}

async function processTodoItem(todo) {
  try {
    // Determine card/title info
    // determine card title: prefer explicit parent, otherwise use todo.name as legacy fallback
    let cardTitle = null;
    if (todo.parentId) {
      const parent = await Todo.findById(todo.parentId).lean();
      if (parent) cardTitle = parent.title || parent.name || null;
    }
    if (!cardTitle && (todo.name && String(todo.name).trim() !== '')) {
      cardTitle = todo.name;
    }

    const subject = todo.reminder ? `Lembrete: ${todo.title || todo.name || 'Atividade'}` : `Atividade expirada: ${todo.title || todo.name || 'Atividade'}`;
    const dueDateStr = formatDateBrazil(todo.dueDate);
    const quote = pickQuote();
    const recurringNote = todo.recurring ? '<p><strong>Esta é uma atividade recorrente.</strong></p>' : '';
    const intro = todo.reminder ? '<p>Este é um lembrete sobre sua atividade.</p>' : '<p>Sua atividade está expirada.</p>';
    const html = `${intro}
      <p><strong>Cartão:</strong> ${cardTitle || '—'}</p>
      <p><strong>Atividade:</strong> ${todo.title || todo.name || '—'}</p>
      <p><strong>Data:</strong> ${dueDateStr}</p>
      ${recurringNote}
      <hr/>
      <p><em>${quote}</em></p>`;

    // For top-level todos, we need the owner's email — assume todo.user points to a User
    const user = await User.findById(todo.user).lean();
    if (!user || !user.email) return;

    await sendEmail(user.email, subject, html);

    // If this todo is a reminder, after sending the reminder email we should
    // remove the todo and add a completed snapshot to the user's completedActivities
    if (todo.reminder) {
      try {
        const userDoc = await User.findById(todo.user);
        if (userDoc) {
          // build snapshot
          const snapshot = {
            originalId: todo._id,
            title: todo.title || todo.name || '',
            description: todo.description || '',
            completedAt: new Date(),
            cardId: todo.parentId || null,
            cardTitle: null,
            cardColor: null,
            recurring: !!todo.recurring,
            recoverable: false
          };
          try {
            const cardObj = await Todo.findById(snapshot.cardId).lean();
            if (cardObj) {
              snapshot.cardTitle = cardObj.title || null;
              snapshot.cardColor = cardObj.color || null;
            }
          } catch (_) {}

          userDoc.completedActivities = userDoc.completedActivities || [];
          userDoc.completedActivities.unshift(snapshot);
          if (userDoc.completedActivities.length > 200) userDoc.completedActivities = userDoc.completedActivities.slice(0, 200);

          // remove the top-level todo
          await Todo.findByIdAndDelete(todo._id);

          await userDoc.save();
          return;
        }
      } catch (err) {
        console.error('Failed to record reminder snapshot for top-level todo', err);
      }
    }

    // update todo counters and handle recurring behavior
    const prevCount = todo.overdueEmailCount || 0;
    const newCount = prevCount + 1;

    if (todo.recurring) {
      if (newCount > MAX_SENDS) {
        // exceeded allowed misses — delete the recurring todo
        await Todo.findByIdAndDelete(todo._id);
        return;
      }

      // reset for next occurrence: compute next due date respecting `weekdays` if present
      let nextDue = null
      if (Array.isArray(todo.weekdays) && todo.weekdays.length > 0) {
        nextDue = getNextDueForWeekdays(todo.dueDate || new Date(), todo.weekdays)
      }
      if (!nextDue) {
        nextDue = todo.dueDate ? new Date(todo.dueDate) : new Date()
        nextDue.setDate(nextDue.getDate() + 1)
      }
      await Todo.findByIdAndUpdate(todo._id, {
        $set: { dueDate: nextDue, overdueEmailCount: 0, lastOverdueEmailAt: null }
      });
      return;
    }

    // non-recurring: increment counters and set last sent
    await Todo.findByIdAndUpdate(todo._id, {
      $inc: { overdueEmailCount: 1 },
      $set: { lastOverdueEmailAt: new Date(), reminderSentAt: todo.reminder ? new Date() : (todo.reminderSentAt || null) }
    });
  } catch (err) {
    console.error('Failed to process todo item', err);
  }
}

async function processEmbeddedTodo(user, todo, userDoc) {
  try {
    // for embedded todos use same fallback logic
    let cardTitle = null;
    if (todo.parentId) {
      const parent = await Todo.findById(todo.parentId).lean();
      if (parent) cardTitle = parent.title || parent.name || null;
    }
    if (!cardTitle && (todo.name && String(todo.name).trim() !== '')) {
      cardTitle = todo.name;
    }

    const subject = todo.reminder ? `Lembrete: ${todo.title || todo.name || 'Atividade'}` : `Atividade expirada: ${todo.title || todo.name || 'Atividade'}`;
    const dueDateStr = formatDateBrazil(todo.dueDate);
    const quote = pickQuote();
    const recurringNote = todo.recurring ? '<p><strong>Esta é uma atividade recorrente.</strong></p>' : '';
    const intro = todo.reminder ? '<p>Este é um lembrete sobre sua atividade.</p>' : '<p>Sua atividade está expirada.</p>';
    const html = `${intro}
      <p><strong>Cartão:</strong> ${cardTitle || '—'}</p>
      <p><strong>Atividade:</strong> ${todo.title || todo.name || '—'}</p>
      <p><strong>Data:</strong> ${dueDateStr}</p>
      ${recurringNote}
      <hr/>
      <p><em>${quote}</em></p>`;

    if (!user.email) return;

    await sendEmail(user.email, subject, html);

    const prevCount = todo.overdueEmailCount || 0;
    const newCount = prevCount + 1;

    if (todo.recurring) {
      if (newCount > MAX_SENDS) {
        // remove this embedded todo from user.todos
        userDoc.todos = userDoc.todos.filter(x => String(x._id) !== String(todo._id));
        await userDoc.save();
        return;
      }

      // advance dueDate respecting weekdays if present, otherwise +1 day
      let nextDue = null
      if (Array.isArray(todo.weekdays) && todo.weekdays.length > 0) {
        nextDue = getNextDueForWeekdays(todo.dueDate || new Date(), todo.weekdays)
      }
      if (!nextDue) {
        nextDue = todo.dueDate ? new Date(todo.dueDate) : new Date()
        nextDue.setDate(nextDue.getDate() + 1)
      }
      const sub = userDoc.todos.id(todo._id);
      if (sub) {
        sub.dueDate = nextDue;
        sub.overdueEmailCount = 0;
        sub.lastOverdueEmailAt = null;
      }
      await userDoc.save();
      return;
    }

    // non-recurring embedded todo: if it's a reminder, record snapshot and remove it;
    // otherwise increment counters and set last sent
    if (todo.reminder) {
      try {
        // mark when reminder was sent
        todo.reminderSentAt = new Date();

        const snapshot = {
          originalId: todo._id,
          title: todo.title || todo.name || '',
          description: todo.description || '',
          completedAt: new Date(),
          cardId: todo.parentId || null,
          cardTitle: null,
          cardColor: null,
          recurring: !!todo.recurring,
          recoverable: false
        };
        try {
          const parent = await Todo.findById(snapshot.cardId).lean();
          if (parent) {
            snapshot.cardTitle = parent.title || null;
            snapshot.cardColor = parent.color || null;
          }
        } catch (_) {}

        userDoc.completedActivities = userDoc.completedActivities || [];
        userDoc.completedActivities.unshift(snapshot);
        if (userDoc.completedActivities.length > 200) userDoc.completedActivities = userDoc.completedActivities.slice(0, 200);

        // remove embedded todo
        userDoc.todos = (userDoc.todos || []).filter(x => String(x._id) !== String(todo._id));
        await userDoc.save();
        return;
      } catch (err) {
        console.error('Failed to record reminder snapshot for embedded todo', err);
      }
    }

    if (!todo.overdueEmailCount) todo.overdueEmailCount = 0;
    todo.overdueEmailCount += 1;
    todo.lastOverdueEmailAt = new Date();

    await userDoc.save();
    return;
  } catch (err) {
    console.error('Failed to process embedded todo', err);
  }
}

async function scanOnce() {
  const now = Date.now();
  const oneMinuteAgo = new Date(now - ONE_MIN);

  // 1) Top-level todos in Todo collection
  try {
    const candidates = await Todo.find({
      completed: false,
      dueDate: { $lte: oneMinuteAgo }
    }).lean();

    for (const t of candidates) {
      const count = t.overdueEmailCount || 0;
      const lastSent = t.lastOverdueEmailAt ? new Date(t.lastOverdueEmailAt) : null;

      if (count >= MAX_SENDS) continue;
      if (lastSent && (now - lastSent.getTime()) < ONE_DAY) continue; // wait 24h

      await processTodoItem(t);
    }
  } catch (err) {
    console.error('Error scanning top-level todos', err);
  }

  // 2) Embedded todos inside User.todos
  try {
    const users = await User.find({}).exec();
    for (const user of users) {
      const userDoc = user; // mongoose document
      const todos = user.todos || [];
      for (const t of todos) {
        if (t.completed) continue;
        if (!t.dueDate) continue;
        const due = new Date(t.dueDate).getTime();
        if (due > now - ONE_MIN) continue; // not expired long enough

        // If this embedded todo references a top-level todo document, prefer
        // the top-level document to avoid sending duplicate emails for the
        // same logical activity (some users may have both embedded and
        // top-level representations). If the referenced top-level todo
        // exists, skip the embedded one — the top-level scanner handles it.
        try {
          if (t.parentId) {
            const linked = await Todo.findById(t.parentId).lean();
            if (linked) continue;
          }
        } catch (_) {}

        const count = t.overdueEmailCount || 0;
        const lastSent = t.lastOverdueEmailAt ? new Date(t.lastOverdueEmailAt) : null;
        if (count >= MAX_SENDS) continue;
        if (lastSent && (now - lastSent.getTime()) < ONE_DAY) continue;

        await processEmbeddedTodo(user, t, userDoc);
      }
    }
  } catch (err) {
    console.error('Error scanning embedded todos', err);
  }
}

let intervalId = null;

function start() {
  // run immediately, then every 1 minute
  scanOnce().catch(e => console.error('Initial scan failed', e));
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    scanOnce().catch(err => console.error('Scheduled scan failed', err));
  }, ONE_MIN);
}

function stop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

module.exports = { start, stop, scanOnce };

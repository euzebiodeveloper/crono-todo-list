require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const todosRouter = require('./src/routes/todos');
const authRouter = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/todos', todosRouter);
app.use('/api/auth', authRouter);

app.get('/', (req, res) => res.send('Crono Todo List API'));

async function start() {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not set. The server requires an explicit MONGO_URI to avoid accidental use of the default "test" DB. Example: mongodb://localhost:27017/crono-todo-list');
      process.exit(1);
    }

    // If URI has no database path (for example ends with '/?query' or has no path),
    // append the application DB name 'crono-todo-list' before any query string.
    const queryIndex = mongoUri.indexOf('?');
    const queryPart = queryIndex !== -1 ? mongoUri.slice(queryIndex) : '';
    let uriWithoutQuery = queryIndex !== -1 ? mongoUri.slice(0, queryIndex) : mongoUri;
    const parts = uriWithoutQuery.split('/');
    if (parts.length <= 3 || parts[3] === '') {
      uriWithoutQuery = uriWithoutQuery.replace(/\/?$/, '') + '/crono-todo-list';
      mongoUri = uriWithoutQuery + queryPart;
      console.warn('MONGO_URI did not include a database name. Appending default DB name:', mongoUri);
    }

    // Prevent accidental usage of a remote/prod cluster during development.
    // If NODE_ENV !== 'production' and the host doesn't look like localhost and
    // ALLOW_REMOTE_DB is not explicitly set, refuse to connect.
    const hostPart = mongoUri.replace(/^mongodb(\+srv)?:\/\//, '').split('/')[0];
    const isLocal = hostPart.startsWith('localhost') || hostPart.startsWith('127.0.0.1');
    if (process.env.NODE_ENV !== 'production' && !isLocal && process.env.ALLOW_REMOTE_DB !== '1') {
      console.error('Refusing to connect to remote MongoDB while NODE_ENV!=production. Set ALLOW_REMOTE_DB=1 to override if you really intend to use the remote DB in development.');
      console.error('Detected host:', hostPart);
      process.exit(1);
    }

    // detect explicit (or accidental) 'test' database and refuse to start to
    // avoid accidental data writes. Ask developer to set MONGO_URI properly.
    const dbName = mongoUri.split('/').pop().split('?')[0];

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    // start background jobs
    try {
      const overdueScanner = require('./src/jobs/overdueScanner');
      overdueScanner.start();
    } catch (err) {
      console.error('Failed to start overdueScanner job:', err);
    }

    app.listen(PORT, () => { });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const todosRouter = require('./src/routes/todos');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/todos', todosRouter);

app.get('/', (req, res) => res.send('Crono Todo List API'));

async function start() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crono-todo';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

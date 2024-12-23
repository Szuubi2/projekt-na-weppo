import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Projekt z weppo');
});

app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
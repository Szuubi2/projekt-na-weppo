import express from 'express';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
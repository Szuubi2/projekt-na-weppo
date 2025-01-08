import express from 'express';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({extended:true}));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/add-new-product', (req, res) => {
  res.render('add-product-form');
});

app.post('/add-new-product', (req, res) => {
  const { name, price, description } = req.body;

  const newProduct = {
    name,
    price,
    description
  };
  
  // dodać logikę zapisywania produktu do bazy danych
  console.log('Dodano nowy produkt:', newProduct);
  
  res.redirect('/');
});


app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
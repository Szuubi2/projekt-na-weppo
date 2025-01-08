import express from 'express';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({extended:true}));


// tu na razie tak poki nie mamy baz danych zeby cos wyswietlic 
let products = [];

app.get('/', (req, res) => {
  res.render('index', { products });
});

app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find(p => p.id == productId); // Wyszukaj produkt po ID, pozniej w bazie danych 
  //na razie z tej tablicy products na gorze 

  res.render('product-detail', { product });
});


app.get('/add-new-product', (req, res) => {
  res.render('add-product-form');
});

app.post('/add-new-product', (req, res) => {
  const { id, name, price, description } = req.body;
  // jakos sprawdzic czy id juz istnieje zeby sie nie powtorzylo albo juz przy wpisywaniu??
  const newProduct = {
    id,
    name,
    price,
    description
  };
  
  // dodać logikę zapisywania produktu do bazy danych, na razie tak:
  products.push(newProduct);

  console.log('Dodano nowy produkt:', newProduct);
  
  res.redirect('/');
});


app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
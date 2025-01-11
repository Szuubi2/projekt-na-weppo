import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

// zmienic na jakis sensowny
app.use(cookieParser('your_secret_key'));

// tu na razie tak poki nie mamy baz danych zeby cos wyswietlic 
let products = [];

function authorize(req, res, next) {
  if (req.signedCookies.user) {
    req.user = JSON.parse(req.signedCookies.user);
    // zapisujemy w req informacje o userze z ciastka ( nazwe i role )
    next();
  } else {
    res.redirect('/login'); 
  }
}

// strona główna
app.get('/', (req, res) => {
  const user = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null; // info z ciastka
  res.render('index', { products, user });
});

app.get('/my-account', authorize, (req, res) => {
  const { username, role } = req.user;

  if (role === 'admin') {
    res.render('admin-account', { username, role });
  } 
  else if (role === 'user') {
    res.render('user-account', { username, role });
  } 
  else {
    res.redirect('/login'); 
  }
});

// strona logowania
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

// na razie zeby sie zalogowac jako user to nazwa i haslo to "user" a jako admin to username i haslo sa "admin"
// pozniej zrobi sie rejestracje i bazy, w tym ifie bedzie sprawdzanie czy taki uzytkownik istnieje
  if (username == 'user' && password == 'user' || username == 'admin' && password == 'admin') { // poprawne dane
    // pozniej tu sprawdizmy role ('user' lub 'admin') w bazie po nazwie uzytkownika, na razie role = username
    var role = username;
    const userData = { username, role };
    res.cookie('user', JSON.stringify(userData), { signed: true });
    console.log('wydano ciastko dla', userData);
    res.redirect('/');
  }
  else {
    res.render( 'login', { message : "Zła nazwa logowania lub hasło" });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/'); 
});

// strona konkretnego produktu
app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find(p => p.id == productId); // Wyszukaj produkt po ID, pozniej w bazie danych 
  //na razie z tej tablicy products na gorze 

  res.render('product-details', { product });
});

// dodawanie nowego produktu na sprzedaz przez admina
app.get('/add-new-product', authorize, (req, res) => {
  if (req.user.role === 'admin') { 
    res.render('add-product-form');
  } else {
    res.redirect('/'); 
  }
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

app.post('/delete-product/:id', authorize, (req, res) => {
  if (req.user.role === 'admin') {
    const productId = req.params.id;
    // Usuń produkt z listy, pozniej z bazy 
    products = products.filter(product => product.id != productId);
    console.log(`Produkt o ID ${productId} został usunięty przez ${req.user.username}`);
    res.redirect('/');
  }
});

app.get('/edit-product/:id', authorize, (req, res) => {
  if (req.user.role === 'admin') {
    const productId = req.params.id;
    const product = products.find(p => p.id == productId); // pozniej szukamy info o produkcie w bazie
    res.render('edit-product-form', { product });
  }
});

app.post('/edit-product/:id',(req, res) => {
    const productId = req.params.id;
    const productIndex = products.findIndex(p => p.id == productId);

    var edited_product = req.body;
    edited_product.id = productId;
    products[productIndex] = edited_product;

    console.log(`Produkt o ID ${productId} został zaktualizowany`);
    res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
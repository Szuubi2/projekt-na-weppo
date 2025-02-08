import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import pool from './db_pool.js'
import bcrypt from 'bcrypt';
import { insertProductWithoutImage, getProductsByName, getProductById } from './db_utils/products_utils.js';
import { insertOrder, insertOrderDetails } from './db_utils/products_utils.js';
import { updateProductById } from './db_utils/products_utils.js';


const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

// zmienic na jakis sensowny
app.use(cookieParser('your_secret_key'));

app.use(session({
  secret: 'your_session_secret', // tez zmienic?
  resave: false,
  saveUninitialized: true
}));


// tu na razie tak poki nie mamy baz danych zeby cos wyswietlic 
let products = [{ 
  id : 1, 
  name : 'kwiat', 
  price : 100,
  description : 'ladny'
}, 
{ 
  id : 2, 
  name : 'kwiat', 
  price : 100,
  description : 'ladny'
}, 
{ 
  id : 3, 
  name : 'kwiat', 
  price : 100,
  description : 'ladny'
},
{ 
  id : 4, 
  name : 'kwiat', 
  price : 100,
  description : 'ladny'
},
{ 
  id : 5, 
  name : 'kwiat', 
  price : 100,
  description : 'ladny'
}];





function authorize(req, res, next) {
  if (req.signedCookies.user) {
    req.user = JSON.parse(req.signedCookies.user);
    // zapisujemy w req informacje o userze z ciastka ( nazwe i role )
    next();
  } else {
    req.user = { username: 'guest', role: 'guest' };;  
    next(); 
  }
}

// search bar
app.get('/', async (req, res) => {
  const user = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
  const message = req.session.message || null;
  req.session.message = null;
  const searchBarContent = req.query.search || ""; 

  getProductsByName(searchBarContent).then((products) => {
    if (searchBarContent && products.length === 0) {
      return res.render('index', { products: [], user, message: `Brak wyników wyszukiwania dla "${searchBarContent}"` });
    }
    res.render('index', { products, user, message });
  });
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

app.get('/cart', (req, res) => {
  const cartItems = req.session.cart;
  const message = req.session.message || null; 
  req.session.message = null; 
  res.render('cart', { cartItems, message });
});

app.get('/checkout', authorize, (req, res) => {
  const { username, role } = req.user;
  const cartItems = req.session.cart;

  if (role === 'user') {
    res.render('checkout', { username, cartItems });  
  } 
  else{
    res.render('cart', {cartItems, message: "Please log in to proceed"});
  }

});


app.post('/place-order', async (req, res) => {
  const { productId, productName, productPrice, productQuantity, username } = req.body;

  try {
      // assume we have user id from the cookie
      const userId = req.user ? req.user.id : 1; // default userId = 1, if user not found

      // create an order (with "pending" status)
      const orderId = await insertOrder(userId, 'pending');
      
      // save in OrderDetails
      for (let i = 0; i < productId.length; i++) {
          await insertOrderDetails(
              orderId,
              parseInt(productId[i], 10),
              parseInt(productQuantity[i], 10),
              parseFloat(productPrice[i])
          );
          console.log(`Zamówienie ${orderId}: Produkt ${productName[i]} został dodany`);
      }

      req.session.cart = [];  // clear the cart after placing an order
      res.redirect(`/thank-you?username=${username}&orderId=${orderId}`);
  } catch (error) {
      console.error('Błąd podczas składania zamówienia:', error);
      res.status(500).send('Błąd serwera podczas składania zamówienia');
  }
});


app.get('/thank-you', (req, res) => {
  const { orderId, username } = req.query;
  res.render('thank-you', { orderId, username });
});






// =============================================================================================
// register, log in, log out

// create account
app.get('/create-account', (req, res) => {
  res.render('create-account-form');
});

app.post('/create-account', (req, res) => {
  console.log('nowy uzytkownik', req.body.username);
  // pozniej zapisac te dane w bazie 
  res.redirect('/');
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
    res.render( 'login', { message : "Zły login lub hasło" });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/'); 
});





//=============================================================================



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

app.post('/add-new-product', authorize, async (req, res) => {
  try { 
    let { name, description, price, stockquantity } = req.body;

    const newProduct = {
      name : name,
      description : description,
      price : price,
      stockquantity : stockquantity
    };
    
    // check if identical product already exists in db
    const existingProduct = await pool.query(
      'SELECT * FROM products WHERE name = $1 AND description = $2',
      [name, description]
    );

    if (existingProduct.rows.length > 0) {
      req.session.message = `Produkt "${name}" już istnieje!`;
      return res.redirect('/add-new-product');
    }

    // find 1st available id
    const missingIdResult = await pool.query(`
      SELECT MIN(t1.id + 1) AS first_available_id
      FROM products t1
      LEFT JOIN products t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL;
    `);

    const firstAvailableId = missingIdResult.rows[0].first_available_id || 1; // Jeśli brak rekordów, zaczynamy od 1

    // if product is unique, add product to db
    await insertProductWithoutImage( firstAvailableId, name, description, price, stockquantity );
    console.log('Dodano nowy produkt:', newProduct);
    
    req.session.message = "Produkt dodany";
    res.redirect('/');
  } catch (error) {
    console.error('Błąd przy dodawaniu produktu: ', error);
    res.status(500).send('Błąd serwera');
  }
});

app.post('/delete-product/:id', authorize, async (req, res) => {
  if (req.user.role === 'admin') {
    const productId = req.params.id;

    try {
      const result = await pool.query('DELETE FROM Products WHERE Id = $1 RETURNING *', [productId]);

      if (result.rowCount === 0) {
        req.session.message = `Produkt o ID ${productId} nie istnieje.`;
      } else {
        req.session.message = `Produkt o ID ${productId} został usunięty.`;
      }
    } catch (error) {
      console.error('Błąd podczas usuwania produktu:', error);
      req.session.message = 'Wystąpił błąd podczas usuwania produktu.';
    }

    res.redirect('/');
  } else {
    res.status(403).send('Brak uprawnień.');
  }
});

app.get('/edit-product/:id', authorize, async (req, res) => {
  if (req.user.role === 'admin') {
    const productId = req.params.id;
    try {
      const product = await getProductById(productId);
      if (!product) {
        req.session.message = "Produkt nie istnieje";
        return res.redirect('/');
      }
      res.render('edit-product-form', { product });
    } catch (error) {
      console.error("Błąd przy pobieraniu produktu: ", error);
      res.status(500).send("Błąd serwera");
    }
  } else {
    res.status(403).send("Brak uprawnień.");
  }
});

app.post('/edit-product/:id', authorize, async (req, res) => {
  if (req.user.role === 'admin') {
    const productId = req.params.id;
    const { name, description, price, stockquantity } = req.body;  // edited product

    try {
      await updateProductById(productId, { name, description, price, stockquantity });
      console.log(`Produkt o ID ${productId} został zaktualizowany w bazie`);
      req.session.message = "Produkt zaktualizowany!";
    } catch (error) {
      console.error("Błąd przy aktualizacji produktu: ", error);
      req.session.message = "Błąd podczas aktualizacji produktu.";
    }
    res.redirect('/');
  } else {
    res.status(403).send("Brak uprawnień.");
  }
});

// now with debilo-odpornosc!
// user cannot add more items than are available in stock
app.post('/add-to-cart/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const product = await getProductById(productId);
    if (!product) {
      req.session.message = "Nie znaleziono produktu.";
      return res.redirect('/');
    }
    if (product.stock <= 0) {
      req.session.message = "Out of stock";
      return res.redirect('/');
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const cartItem = req.session.cart.find(item => item.id === productId);
    if (cartItem) {
      //console.log(cartItem.quantity, product.stockquantity, "\n");
      if (cartItem.quantity < product.stockquantity) {
        cartItem.quantity += 1;
      } else {
        req.session.message = "No more available in stock";
        return res.redirect('/');
      }
    } else {
      req.session.cart.push({ id: productId, quantity: 1, price: product.price, name: product.name });
    }

    req.session.message = "Produkt dodany do koszyka!";
  } catch (error) {
    console.error("Błąd przy dodawaniu do koszyka: ", error);
    req.session.message = "Błąd serwera.";
  }
  res.redirect('/');
});


app.post('/remove-from-cart/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);

  const productIndex = req.session.cart.findIndex(item => item.id === productId);
  
  req.session.cart.splice(productIndex, 1);

  req.session.message = "Produkt usunięty z koszyka!";
  console.log("Usunięto produkt", productId);
  res.redirect('/cart');
})


app.listen(3000, () => {
  console.log('Server na http://localhost:3000/');
});
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import pool from './db_pool.js'
import bcrypt from 'bcrypt';
import { insertProductWithoutImage, getProductsByName, getProductById } from './db_utils/products_utils.js';
import { insertOrder, insertOrderDetails } from './db_utils/products_utils.js';
import { updateProductById } from './db_utils/products_utils.js';
import { updateProductStock } from './db_utils/products_utils.js';
import { insertUser, deleteUser } from './db_utils/products_utils.js';




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

  if (!productId || productId.length === 0) {
    return res.status(400).send('Nie można złożyć zamówienia – brak produktów w koszyku.');
  }

  try {
      // get user from the cookie
      const user = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
      
      // check if user is logged in
      if (!user || !user.username) {
          return res.status(401).send('Musisz być zalogowany, aby złożyć zamówienie.');
      }

      // get user id from db 
      const userResult = await pool.query(
          'SELECT Id FROM Users WHERE Name = $1',
          [user.username]
      );

      if (userResult.rows.length === 0) {
          return res.status(404).send('Użytkownik nie istnieje.');
      }

      const userId = userResult.rows[0].id;

      // create an order (with "pending" status)
      const orderId = await insertOrder(userId, 'pending');

      // save in OrderDetails
      for (let i = 0; i < productId.length; i++) {
          const id = parseInt(productId[i], 10);
          const quantity = parseInt(productQuantity[i], 10);
          const price = parseFloat(productPrice[i]);

          await insertOrderDetails(orderId, id, quantity, price);
          console.log(`🛒 Zamówienie ${orderId}: Dodano produkt ${productName[i]} (ID: ${id})`);

          // update stock quantity in db
          await updateProductStock(id, quantity);
      }

      req.session.cart = []; // clear the cart after placing an order
      res.redirect(`/thank-you?username=${username}&orderId=${orderId}`);
  } catch (error) {
      console.error('❌ Błąd podczas składania zamówienia:', error);
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

app.post('/create-account', authorize, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const address = email;
    
    // search for first available id
    const missingIdResult = await pool.query(`
      SELECT MIN(t1.id + 1) AS first_available_id
      FROM users t1
      LEFT JOIN users t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL;
    `);

    const firstAvailableId = missingIdResult.rows[0].first_available_id || 1; // if no records, start from 1
    // add new user
    await insertUser(firstAvailableId, username, password, address);
    
    console.log('Dodano nowego użytkownika:', { username, address });
    req.session.message = "Użytkownik dodany";
    res.redirect('/');
  } catch (error) {
    console.error('Błąd przy dodawaniu użytkownika: ', error);
    res.status(500).send('Błąd serwera');
  }
});



// login page
app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // check if login is as admin or casual user
    // (admin is not in db)
    if (username === 'admin' && password === 'admin') {
      const adminData = { userId: 0, username, role: 'admin' };
      res.cookie('user', JSON.stringify(adminData), { signed: true });
      console.log('✅Zalogowano jako ADMIN');
      return res.redirect('/');
    }

    // if not admin, search in db for the user
    const query = `SELECT id, name, passwordhash FROM users WHERE name = $1;`;
    const result = await pool.query(query, [username]);

    if (result.rowCount === 0) {
      return res.render('login', { message: 'Zły login lub hasło' });
    }

    const user = result.rows[0];

    // password verification
    const isMatch = await bcrypt.compare(password, user.passwordhash);
    if (!isMatch) {
      return res.render('login', { message: 'Zły login lub hasło' });
    }

    // create cookie with user data
    const userData = { userId: user.id, username: user.name, role: 'user' };
    res.cookie('user', JSON.stringify(userData), { signed: true });

    console.log(`✅ Zalogowano jako ${user.name} (ID: ${user.id})`);
    res.redirect('/');
  } catch (error) {
    console.error('❌ Błąd podczas logowania:', error.message);
    res.status(500).send('Błąd serwera podczas logowania');
  }
});


app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/'); 
});




//=============================================================================
// each product page


app.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // get product from db by id
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);

    // check if product exists
    if (productResult.rows.length === 0) {
      return res.status(404).render('error', { message: 'Produkt nie istnieje' });
    }

    const product = productResult.rows[0]; // 1st query result

    res.render('product-details', { product });
  } catch (error) {
    console.error('Błąd pobierania produktu:', error);
    res.status(500).send('Błąd serwera');
  }
});








// =============================================================================
// admin privileges: product modifications 


// add new product
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







// ==============================================================================
// user: cart



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








// some tests

//insertUser(4, 'newuser', 'haslo123', 'email@example.com');
//insertUser(3, 'pwaw8', '2137', 'test@example.com');
//deleteUser (4); // lub nick
//insertUser(7, 'user7', 'haslo7', 'email7@example.com');




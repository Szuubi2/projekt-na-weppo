const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes');
const session = require('express-session');

dotenv.config();

const app = express();

app.use(session({
  secret: 'secret', // powinno być ukryte (np. w .env) 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the API. Use /auth/register or /auth/login for authentication.');
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


/*
rejestracja i logowanie działają, wylogowanie mówi, że działa, ale nie działa

żeby przetestować: w drugim terminalu trzeba wpisać np:

REGISTER:
curl -X POST http:/register 
-H "Content-Type: application/json" 
-d '{"username": "postgres", "email": "test@example.com", "password": "password"}'

LOGIN:
curl -X POST http://localhost:3000/auth/login 
-H "Content-Type: application/json" 
-d '{"email": "test@example.com", "password": "password"}' \
-c cookies.txt

LOGOUT:
curl -X POST http://localhost:3000/auth/logout \
-b cookies.txt

TEST po wylogowaniu (powinno wypisać access denied a tak nie robi póki co):
curl -X GET http://localhost:3000/auth/protected \
-b cookies.txt

*/


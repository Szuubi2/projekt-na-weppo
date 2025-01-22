## Instalacja
Pobrac PostgreSQL
Pobrac pgAdmin4
https://www.youtube.com/watch?v=UGfteFq_6Co
postgres haslo postgres najlepiej
Stworzyc serwer, zalogowac sie do pgAdmin4 jako superuser (postgres)

## Tworzenie Uzytkownika weppoAdmin
Stworzyc uzytkownika weppoAdmin
w pgAdmin4
Object -> Login/Group roles -> dac nazwe, haslo i privilages (Can login? i Create Databases? trzeba zaznaczyc)
https://www.youtube.com/watch?v=oNJpktM65eY
weppoAdmin haslo weppoAdmin najlepiej

## Tworzenie bazy danych
Na pasku po lewej stronie pgAdmin4 klikamy prawym na "Databases" -> Create i ustawiamy nazwe na "weppoSklep" i wlasciciela na "weppoAdmin"
Reszta ustawien moze byc domyslna

## Tworzenie tabelek w bazie danych
Tam gdzie sie kwerendy dla bazy danych weppoSklep pisze:

CREATE TABLE Products (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Price DECIMAL(10, 2) NOT NULL,
    StockQuantity INT NOT NULL,
    Image BYTEA
);

CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    PasswordHash TEXT NOT NULL,
    Address TEXT
);

CREATE TABLE Orders (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE OrderDetails (
    Id SERIAL PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE Products TO "weppoAdmin";
GRANT ALL PRIVILEGES ON TABLE Users TO "weppoAdmin";
GRANT ALL PRIVILEGES ON TABLE Orders TO "weppoAdmin";
GRANT ALL PRIVILEGES ON TABLE OrderDetails TO "weppoAdmin";
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "weppoAdmin";



Jak sie nie wysypuje stronka to znaczy ze dziala

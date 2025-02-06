import pool from '../db_pool.js';


export async function insertProductWithoutImage(productName, description, price, stockQuantity) {
        const query = `
            INSERT INTO Products (Name, Description, Price, StockQuantity)
            VALUES ($1, $2, $3, $4)
            RETURNING Id;
        `;

        const values = [productName, description, price, stockQuantity];

        try {
            const res = await pool.query(query, values);
            return;
        } catch (err) {
            console.error('Error fetching products:', err.message);
            throw err;
        }
}

export const getProductsByName = async (productName) => {
    const query = `
        SELECT * FROM Products
        WHERE Name ILIKE '%' || $1 || '%';
    `;

    try {
        const res = await pool.query(query, [`%${productName}%`]);
        return res.rows;
    } catch (err) {
        console.error('Error fetching products:', err.message);
        throw err;
    }
};

export const getProductById = async (productId) => {
    const query = `
        SELECT * FROM Products
        WHERE Id = $1;
    `;

    try {
        const res = await pool.query(query, [productId]);
        return res.rows.length > 0 ? res.rows[0] : null; // null if product doesnt exist
    } catch (err) {
        console.error('Error fetching products:', err.message);
        throw err;
    }
};



export const insertOrder = async (userId, status) => {
    const query = `
        INSERT INTO Orders (UserId, Status)
        VALUES ($1, $2)
        RETURNING Id;
    `;

    const values = [userId, status];

    try {
        const res = await pool.query(query, values);
        return res.rows[0].id;  // returns the id of the new order
    } catch (err) {
        console.error('Błąd podczas zapisywania zamówienia:', err.message);
        throw err;
    }
};



export const insertOrderDetails = async (orderId, productId, quantity, unitPrice) => {
    const query = `
        INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
        VALUES ($1, $2, $3, $4);
    `;

    const values = [orderId, productId, quantity, unitPrice];

    try {
        await pool.query(query, values);
    } catch (err) {
        console.error('Błąd podczas zapisywania szczegółów zamówienia:', err.message);
        throw err;
    }
};

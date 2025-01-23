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


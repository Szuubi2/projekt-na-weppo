import pool from '../db_pool.js';
import bcrypt from 'bcrypt';


// Product


export async function insertProductWithoutImage(id, productName, description, price, stockQuantity) {
        const query = `
            INSERT INTO Products (Id, Name, Description, Price, StockQuantity)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING Id;
        `;

        const values = [id, productName, description, price, stockQuantity];

        try {
            const res = await pool.query(query, values);
            return res.rows[0].id;
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


export const updateProductById = async (id, updatedProduct) => {
    const { name, description, price, stockquantity } = updatedProduct;
  
    try {
      const result = await pool.query(
        'UPDATE products SET name = $1, description = $2, price = $3, stockquantity = $4 WHERE id = $5 RETURNING *',
        [name, description, price, stockquantity, id] 
      );
       
      if (result.rowCount === 0) {
        throw new Error(`Produkt o ID ${id} nie istnieje.`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Błąd podczas aktualizacji produktu:', error);
      throw error;
    }
  };





// Order



export const insertOrder = async (userId, status) => {
    const query = `
        INSERT INTO Orders (UserId, Status)
        VALUES ($1, $2)
        RETURNING Id;
    `;

    try {
        const result = await pool.query(query, [userId, status]);
        return result.rows[0].id;
    } catch (err) {
        console.error('❌ Błąd podczas zapisywania zamówienia:', err.message);
        throw err;
    }
};


export const insertOrderDetails = async (orderId, productId, quantity, unitPrice) => {
    const query = `
        INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
        VALUES ($1, $2, $3, $4);
    `;

    try {
        await pool.query(query, [orderId, productId, quantity, unitPrice]);
    } catch (err) {
        console.error('❌ Błąd podczas zapisywania szczegółów zamówienia:', err.message);
        throw err;
    }
};


export const updateProductStock = async (productId, quantity) => {
    const query = `
        UPDATE Products 
        SET StockQuantity = StockQuantity - $1 
        WHERE Id = $2;
    `;

    try {
        await pool.query(query, [quantity, productId]);
        console.log(`✅ Zaktualizowano stan magazynowy dla produktu ID ${productId}`);
    } catch (err) {
        console.error('❌ Błąd podczas aktualizacji stanu magazynowego:', err.message);
        throw err;
    }
};

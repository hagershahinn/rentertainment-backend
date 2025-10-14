const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.database);

class Database {
  async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.log('db error:', error.message);
      throw error;
    }
  }

  async getTop5RentedFilms() {
    const sql = `
      SELECT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category,
             COUNT(r.rental_id) as rental_count
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name
      ORDER BY rental_count DESC
      LIMIT 5
    `;
    return this.query(sql);
  }

  async getTop5Actors() {
    const sql = `
      SELECT a.actor_id, CONCAT(a.first_name, ' ', a.last_name) as name,
             COUNT(r.rental_id) as total_rentals
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      JOIN film f ON fa.film_id = f.film_id
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY a.actor_id, a.first_name, a.last_name
      ORDER BY total_rentals DESC
      LIMIT 5
    `;
    return this.query(sql);
  }

  async getAllFilms() {
    const sql = `
      SELECT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      ORDER BY f.title
    `;
    return this.query(sql);
  }

  async getFilmDetails(filmId) {
    const sql = `
      SELECT f.film_id, f.title, f.description, f.release_year, 
             f.rental_duration, f.rental_rate, f.length, 
             f.replacement_cost, f.rating, f.special_features,
             c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      WHERE f.film_id = ?
    `;
    const result = await this.query(sql, [filmId]);
    return result[0];
  }

  async getFilmActors(filmId) {
    const sql = `
      SELECT a.actor_id, CONCAT(a.first_name, ' ', a.last_name) as name
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      WHERE fa.film_id = ?
    `;
    return this.query(sql, [filmId]);
  }

  async getActorDetails(actorId) {
    const sql = `
      SELECT a.actor_id, CONCAT(a.first_name, ' ', a.last_name) as name,
             COUNT(r.rental_id) as total_rentals
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      JOIN film f ON fa.film_id = f.film_id
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      WHERE a.actor_id = ?
      GROUP BY a.actor_id, a.first_name, a.last_name
    `;
    const result = await this.query(sql, [actorId]);
    return result[0];
  }

  async getActorTopFilms(actorId) {
    const sql = `
      SELECT f.film_id, f.title, f.description, f.rating, c.name as category,
             COUNT(r.rental_id) as rental_count
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      JOIN film f ON fa.film_id = f.film_id
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      WHERE a.actor_id = ?
      GROUP BY f.film_id, f.title, f.description, f.rating, c.name
      ORDER BY rental_count DESC
      LIMIT 5
    `;
    return this.query(sql, [actorId]);
  }

  async searchFilms(query) {
    const sql = `
      SELECT DISTINCT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN film_actor fa ON f.film_id = fa.film_id
      LEFT JOIN actor a ON fa.actor_id = a.actor_id
      WHERE f.title LIKE ? 
         OR c.name LIKE ?
         OR CONCAT(a.first_name, ' ', a.last_name) LIKE ?
      ORDER BY f.title
      LIMIT 50
    `;
    const searchTerm = `%${query}%`;
    return this.query(sql, [searchTerm, searchTerm, searchTerm]);
  }

  async searchFilmsByGenre(genre) {
    const sql = `
      SELECT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      WHERE c.name LIKE ?
      ORDER BY f.title
    `;
    const searchTerm = `%${genre}%`;
    return this.query(sql, [searchTerm]);
  }

  async searchFilmsByActor(actorName) {
    const sql = `
      SELECT DISTINCT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      JOIN film_actor fa ON f.film_id = fa.film_id
      JOIN actor a ON fa.actor_id = a.actor_id
      WHERE CONCAT(a.first_name, ' ', a.last_name) LIKE ?
      ORDER BY f.title
    `;
    const searchTerm = `%${actorName}%`;
    return this.query(sql, [searchTerm]);
  }

  async getAllCustomers(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    const safeLimit = parseInt(limit) || 20;
    const safeOffset = parseInt(offset) || 0;
    
    let sql, params;
    
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      const searchId = parseInt(search);
      
      if (!isNaN(searchId)) {
        sql = `
          SELECT customer_id, first_name, last_name, email, active
          FROM customer
          WHERE customer_id = ${searchId} 
             OR first_name LIKE ? 
             OR last_name LIKE ?
             OR CONCAT(first_name, ' ', last_name) LIKE ?
          ORDER BY last_name
          LIMIT ${safeLimit} OFFSET ${safeOffset}
        `;
        params = [searchTerm, searchTerm, searchTerm];
      } else {
        sql = `
          SELECT customer_id, first_name, last_name, email, active
          FROM customer
          WHERE first_name LIKE ? 
             OR last_name LIKE ?
             OR CONCAT(first_name, ' ', last_name) LIKE ?
          ORDER BY last_name
          LIMIT ${safeLimit} OFFSET ${safeOffset}
        `;
        params = [searchTerm, searchTerm, searchTerm];
      }
    } else {
      sql = `
        SELECT customer_id, first_name, last_name, email, active
        FROM customer
        ORDER BY last_name
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;
      params = [];
    }
    
    return this.query(sql, params);
  }

  async getCustomerCount(search = '') {
    let sql, params;
    
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      const searchId = parseInt(search);
      
      if (!isNaN(searchId)) {
        sql = `SELECT COUNT(*) as total FROM customer 
               WHERE customer_id = ${searchId} 
                  OR first_name LIKE ? 
                  OR last_name LIKE ?
                  OR CONCAT(first_name, ' ', last_name) LIKE ?`;
        params = [searchTerm, searchTerm, searchTerm];
      } else {
        sql = `SELECT COUNT(*) as total FROM customer 
               WHERE first_name LIKE ? 
                  OR last_name LIKE ?
                  OR CONCAT(first_name, ' ', last_name) LIKE ?`;
        params = [searchTerm, searchTerm, searchTerm];
      }
    } else {
      sql = `SELECT COUNT(*) as total FROM customer`;
      params = [];
    }
    
    const result = await this.query(sql, params);
    return result[0].total;
  }

  async getCustomerById(customerId) {
    const sql = `
      SELECT customer_id, first_name, last_name, email, active
      FROM customer
      WHERE customer_id = ?
    `;
    const result = await this.query(sql, [customerId]);
    return result[0];
  }

  async getCustomerRentals(customerId) {
    const sql = `
      SELECT r.rental_id, r.rental_date, r.return_date, f.title, f.film_id
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      WHERE r.customer_id = ?
      ORDER BY r.rental_date DESC
    `;
    return this.query(sql, [customerId]);
  }

  async findCustomerByEmail(email) {
    const sql = `SELECT * FROM customer WHERE email = ? LIMIT 1`;
    const result = await this.query(sql, [email]);
    return result[0];
  }

  async createCustomer(customerData) {
    try {
      const addressSql = `SELECT address_id FROM address LIMIT 1`;
      const addresses = await this.query(addressSql);
      const addressId = addresses[0]?.address_id || 1;

      const sql = `
        INSERT INTO customer (store_id, first_name, last_name, email, address_id, active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        customerData.store_id || 1,
        customerData.first_name,
        customerData.last_name,
        customerData.email,
        addressId,
        customerData.active !== undefined ? customerData.active : 1
      ];
      
      const result = await this.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error in createCustomer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId, customerData) {
    const sql = `
      UPDATE customer
      SET first_name = ?, last_name = ?, email = ?, active = ?
      WHERE customer_id = ?
    `;
    return this.query(sql, [
      customerData.first_name,
      customerData.last_name,
      customerData.email,
      customerData.active,
      customerId
    ]);
  }

  async deleteCustomer(customerId) {
    const sql = `DELETE FROM customer WHERE customer_id = ?`;
    return this.query(sql, [customerId]);
  }

  async getRentalById(rentalId) {
    const sql = `SELECT * FROM rental WHERE rental_id = ?`;
    const result = await this.query(sql, [rentalId]);
    return result[0];
  }

  async returnRental(rentalId) {
    const sql = `
      UPDATE rental
      SET return_date = NOW()
      WHERE rental_id = ?
    `;
    return this.query(sql, [rentalId]);
  }

  async rentFilm(filmId, customerId) {
    const existingRentalSql = `
      SELECT r.rental_id, f.title
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      WHERE r.customer_id = ? 
        AND i.film_id = ? 
        AND r.return_date IS NULL
      LIMIT 1
    `;
    const existingRental = await this.query(existingRentalSql, [customerId, filmId]);
    
    if (existingRental.length > 0) {
      return { 
        success: false, 
        alreadyRented: true,
        message: `This movie is already rented. Please return "${existingRental[0].title}" before renting it again.`
      };
    }
    
    const inventorySql = `
      SELECT i.inventory_id
      FROM inventory i
      WHERE i.film_id = ?
      LIMIT 1
    `;
    const inventory = await this.query(inventorySql, [filmId]);
    
    if (inventory.length === 0) {
      return { 
        success: false, 
        message: 'No inventory - unable to rent' 
      };
    }
    
    try {
      const rentalSql = `
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
        VALUES (NOW(), ?, ?, 1)
      `;
      await this.query(rentalSql, [inventory[0].inventory_id, customerId]);
      return { success: true, message: 'Movie rented successfully' };
    } catch (error) {
      console.log('Rental insert error:', error.message);
      return { 
        success: false, 
        message: 'Failed to create rental record' 
      };
    }
  }
}

module.exports = new Database();

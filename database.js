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
      SELECT f.*, c.name as category
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
      SELECT f.film_id, f.title, f.description, f.release_year, f.rating, f.length, c.name as category
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      WHERE f.title LIKE ?
      ORDER BY f.title
      LIMIT 20
    `;
    const searchTerm = `%${query}%`;
    return this.query(sql, [searchTerm]);
  }

  async getAllCustomers() {
    const sql = `
      SELECT customer_id, first_name, last_name, email
      FROM customer
      ORDER BY last_name
      LIMIT 50
    `;
    return this.query(sql);
  }

  async rentFilm(filmId, customerInfo) {
    const sql = `
      INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
      VALUES (NOW(), 1, 1, 1)
    `;
    const result = await this.query(sql);
    return result;
  }
}

module.exports = new Database();

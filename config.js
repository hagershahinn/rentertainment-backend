require('dotenv').config();

module.exports = {
  database: {
    host: 'localhost',
    user: 'root',                    
    password: 'NewPassword123!',  // XAMPP MySQL has no password by default
    database: 'sakila',
    port: 3306,
  },
  server: {
    port: 3001,
    environment: 'development'
  }
}; 
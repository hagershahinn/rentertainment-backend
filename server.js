const express = require('express');
const cors = require('cors');
const database = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/films/top-rented', async (req, res) => {
  try {
    const films = await database.getTop5RentedFilms();
    res.json({ success: true, data: films });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting films' });
  }
});

app.get('/api/actors/top-actors', async (req, res) => {
  try {
    const actors = await database.getTop5Actors();
    res.json({ success: true, data: actors });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting actors' });
  }
});

app.get('/api/films/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === '') {
      return res.json({ success: true, data: [] });
    }
    const films = await database.searchFilms(query);
    res.json({ success: true, data: films || [] });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error searching films' });
  }
});

app.get('/api/films/search-by-genre', async (req, res) => {
  try {
    const genre = req.query.genre;
    const films = await database.searchFilmsByGenre(genre);
    res.json({ success: true, data: films });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error searching films by genre' });
  }
});

app.get('/api/films/search-by-actor', async (req, res) => {
  try {
    const actorName = req.query.actor;
    const films = await database.searchFilmsByActor(actorName);
    res.json({ success: true, data: films });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error searching films by actor' });
  }
});

app.get('/api/films', async (req, res) => {
  try {
    const films = await database.getAllFilms();
    res.json({ success: true, data: films });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting films' });
  }
});

app.get('/api/films/:id', async (req, res) => {
  try {
    const filmId = req.params.id;
    if (!filmId || isNaN(filmId)) {
      return res.json({ success: false, message: 'Invalid film ID' });
    }
    const film = await database.getFilmDetails(filmId);
    if (!film) {
      return res.json({ success: false, message: 'Film not found' });
    }
    const actors = await database.getFilmActors(filmId);
    res.json({ success: true, data: { film, actors: actors || [] } });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting film details' });
  }
});

app.get('/api/actors/:id', async (req, res) => {
  try {
    const actorId = req.params.id;
    if (!actorId || isNaN(actorId)) {
      return res.json({ success: false, message: 'Invalid actor ID' });
    }
    const actor = await database.getActorDetails(actorId);
    if (!actor) {
      return res.json({ success: false, message: 'Actor not found' });
    }
    const topFilms = await database.getActorTopFilms(actorId);
    res.json({ success: true, data: { actor, topFilms: topFilms || [] } });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting actor details' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    
    const customers = await database.getAllCustomers(page, limit, search);
    const total = await database.getCustomerCount(search);
    
    res.json({ 
      success: true, 
      data: customers,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting customers' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId || isNaN(customerId)) {
      return res.json({ success: false, message: 'Invalid customer ID' });
    }
    const customer = await database.getCustomerById(customerId);
    if (!customer) {
      return res.json({ success: false, message: 'Customer not found' });
    }
    const rentals = await database.getCustomerRentals(customerId);
    
    res.json({ 
      success: true, 
      data: { customer, rentals: rentals || [] } 
    });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting customer details' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customerData = req.body;
    
    if (!customerData.first_name || !customerData.first_name.trim()) {
      return res.json({ success: false, message: 'First name is required' });
    }
    if (!customerData.last_name || !customerData.last_name.trim()) {
      return res.json({ success: false, message: 'Last name is required' });
    }
    if (!customerData.email || !customerData.email.trim()) {
      return res.json({ success: false, message: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      return res.json({ success: false, message: 'Invalid email format' });
    }
    
    const existingCustomer = await database.findCustomerByEmail(customerData.email);
    if (existingCustomer) {
      return res.json({ success: false, message: 'A customer with this email already exists' });
    }
    
    const result = await database.createCustomer(customerData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error creating customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const customerData = req.body;
    
    if (!customerId || isNaN(customerId)) {
      return res.json({ success: false, message: 'Invalid customer ID' });
    }
    
    if (!customerData.first_name || !customerData.first_name.trim()) {
      return res.json({ success: false, message: 'First name is required' });
    }
    if (!customerData.last_name || !customerData.last_name.trim()) {
      return res.json({ success: false, message: 'Last name is required' });
    }
    if (!customerData.email || !customerData.email.trim()) {
      return res.json({ success: false, message: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      return res.json({ success: false, message: 'Invalid email format' });
    }
    
    const customer = await database.getCustomerById(customerId);
    if (!customer) {
      return res.json({ success: false, message: 'Customer not found' });
    }
    
    const existingCustomer = await database.findCustomerByEmail(customerData.email);
    if (existingCustomer && existingCustomer.customer_id != customerId) {
      return res.json({ success: false, message: 'A customer with this email already exists' });
    }
    
    await database.updateCustomer(customerId, customerData);
    res.json({ success: true, message: 'customer updated' });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error updating customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    
    if (!customerId || isNaN(customerId)) {
      return res.json({ success: false, message: 'Invalid customer ID' });
    }
    
    const customer = await database.getCustomerById(customerId);
    if (!customer) {
      return res.json({ success: false, message: 'Customer not found' });
    }
    
    const rentals = await database.getCustomerRentals(customerId);
    const activeRentals = rentals.filter(r => !r.return_date);
    if (activeRentals.length > 0) {
      return res.json({ 
        success: false, 
        message: `Cannot delete customer with ${activeRentals.length} active rental(s). Please return all movies first.` 
      });
    }
    
    await database.deleteCustomer(customerId);
    res.json({ success: true, message: 'customer deleted' });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error deleting customer' });
  }
});

app.put('/api/rentals/:id/return', async (req, res) => {
  try {
    const rentalId = req.params.id;
    
    if (!rentalId || isNaN(rentalId)) {
      return res.json({ success: false, message: 'Invalid rental ID' });
    }
    
    const rental = await database.getRentalById(rentalId);
    if (!rental) {
      return res.json({ success: false, message: 'Rental not found' });
    }
    
    if (rental.return_date) {
      return res.json({ success: false, message: 'This rental has already been returned' });
    }
    
    await database.returnRental(rentalId);
    res.json({ success: true, message: 'rental returned' });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error returning rental' });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const { filmId, customerInfo } = req.body;
    
    if (!filmId || isNaN(filmId)) {
      return res.json({ success: false, message: 'Valid film ID is required' });
    }
    
    const film = await database.getFilmDetails(filmId);
    if (!film) {
      return res.json({ success: false, message: 'Film not found' });
    }
    
    if (!customerInfo || !customerInfo.email) {
      return res.json({ success: false, message: 'customer email required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      return res.json({ success: false, message: 'Invalid email format' });
    }

    let customer = await database.findCustomerByEmail(customerInfo.email);
    
    if (!customer) {
      if (!customerInfo.firstName || !customerInfo.lastName) {
        return res.json({ 
          success: false, 
          needsMoreInfo: true,
          message: 'customer not found - please provide first and last name' 
        });
      }
      
      const newCustomerResult = await database.createCustomer({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email
      });
      
      customer = await database.findCustomerByEmail(customerInfo.email);
    }
    
    const result = await database.rentFilm(filmId, customer.customer_id);
    
    if (!result.success) {
      return res.json({ 
        success: false, 
        message: result.message,
        alreadyRented: result.alreadyRented || false
      });
    }
    
    res.json({ success: true, data: result, customer: customer });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: error.message || 'error renting film' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

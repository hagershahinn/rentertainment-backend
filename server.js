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
    const films = await database.searchFilms(query);
    res.json({ success: true, data: films });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error searching films' });
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
    const film = await database.getFilmDetails(filmId);
    const actors = await database.getFilmActors(filmId);
    res.json({ success: true, data: { film, actors } });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting film details' });
  }
});

app.get('/api/actors/:id', async (req, res) => {
  try {
    const actorId = req.params.id;
    const actor = await database.getActorDetails(actorId);
    const topFilms = await database.getActorTopFilms(actorId);
    res.json({ success: true, data: { actor, topFilms } });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting actor details' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await database.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error getting customers' });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const { filmId, customerId } = req.body;
    const result = await database.rentFilm(filmId, customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.log('error:', error.message);
    res.json({ success: false, message: 'error renting film' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

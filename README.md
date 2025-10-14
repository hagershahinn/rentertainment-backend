# Rentertainment Backend

Backend for my movie rental app

## Technologies Used

- Node.js
- Express.js
- MySQL
- Sakila Database

## How to run

1. Clone this repo
2. npm install
3. npm start

Runs on port 3001

## Database stuff

You need MySQL with the sakila database. Just import the sql files

Dont forget to change the password in config.js

## API stuff

- GET /api/films - gets movies
- GET /api/films/search?q=query - search movies
- GET /api/films/:id - movie details
- GET /api/actors - actors
- GET /api/actors/:id - actor details
- POST /api/rentals - rent movie

## If it breaks

Port 3001 busy: lsof -ti:3001 | xargs kill -9
Database error: check mysql
Module errors: npm install

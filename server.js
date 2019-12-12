'use strict';
let lat;
let lng;

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const GEOCODE_API_Key = process.env.GOOGLE_API_KEY;
const superagent = require('superagent');
app.use(cors());
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));

// LOCATION DATA

function FormattedData(query, location) {
  console.log(location)
  this.search_query = query;
  this.formatted_query = location.formatted_address;
  this.latitude = location.geometry.location.lat;
  this.longitude = location.geometry.location.lng;
}

app.get('/location', (request, response) => {
  const search_query = request.query.data;
  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${search_query}&key=${process.env.GEOCODING_API_KEY}`;

  superagent.get(urlToVisit).then(responseFromSuper => {
    //console.log('stuff', responseFromSuper.body);

    const geoData = responseFromSuper.body;

    const location = geoData.results[0];


    response.send(new FormattedData(search_query, location));
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  });
})

// WEATHER DATA

function WeatherGetter(weatherValue) {
  this.forecast = weatherValue.summary;
  this.time = new Date(weatherValue.time * 1000).toDateString();
}
app.get('/weather', (request, response) => {
  const weather_query = request.query.data

  const urlToVisit = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${weather_query.latitude},${weather_query.longitude}`;
  superagent.get(urlToVisit).then(responseFromSuper => {
    //console.log('stuff', responseFromSuper.body);
    const darkskyData = responseFromSuper.body;
    const dailyData = darkskyData.daily.data.map(value => new WeatherGetter(value));
    response.send(dailyData);
  }).catch (error => {
    console.error(error);
    response.status(500).send(error.message);
  });
})

// console.log('LOCATIONS END FIRING');




// EVENT DATA
function Eventbrite(eventObj) {
  this.name = eventObj.title
  this.summary = eventObj.description
  this.link = eventObj.url
  this.event_date = eventObj.start_time
}
app.get('/events', (request, response) => {
  const event_query = request.query.data
  const urlToVisit = `http://api.eventful.com/json/events/search?location=${event_query.formatted_query}&date=Future&app_key=${process.env.EVENT_API_KEY}`;
  console.log(urlToVisit);
  superagent.get(urlToVisit).then(responseFromSuper => {
    const body = JSON.parse(responseFromSuper.text);
    const events = body.events.event;
    const normalizedEvents = events.map(eventObj => new Eventbrite(eventObj));
    response.send(normalizedEvents);
  }).catch(error => console.log(error))
})

app.listen(PORT, () => {

  console.log('Port is working and listening  on port ' + PORT);
});


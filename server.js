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
  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GOOGLE_API_KEY}`;

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

/// WEATHER ////

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
  this.name = eventObj.name.text
  this.summary = eventObj.description.text
  this.link = eventObj.url
  this.event_date = eventObj.start.local
}
app.get('/events', (request, response) => {
  const event_query = request.query.data
  const urlToVisit = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${event_query.longitude}&location.latitude=${event_query.latitude}&token=${process.env.EVENT_API_KEY}`;
  // console.log(urlToVisit);
  superagent.get(urlToVisit).then(responseFromSuper => {
    // console.log('things', responseFromSuper.body.events[0])
    const body = responseFromSuper.body;
    const events = body.events;
    const normalizedEvents = events.map(eventObj => new Eventbrite(eventObj));
    response.send(normalizedEvents);
  })
})

app.listen(PORT, () => {

  console.log('Port is working and listening  on port ' + PORT);
});


'use strict'

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');

const app = express();
app.use(cors());

//postgres client
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));

const PORT = process.env.PORT;

// Constructor Functions

//location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

//weather
function Day(summary, time) {
  this.forecast = summary;
  this.time = new Date(time * 1000).toDateString();
}

// Events
function Event(link, name, event_date, summary) {
  this.link = link;
  this.name = name;
  this.event_date = new Date(event_date).toDateString();
  this.summary = summary;
}

// TARGET LOCATION from API 

app.get('/location', (request, response) => {
  const searchQuery = request.query.data;

  client.query(`SELECT * FROM locations WHERE search_query=$1`, [searchQuery]).then(sqlResult => {

    //if stuff:
    if (sqlResult.rowCount > 0) {
      console.log('Found data in database')
      response.send(sqlResult.rows[0]);
    } else {

      console.log('nothing found in database, asking google')
      const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

      superagent.get(urlToVisit).then(responseFromSuper => {

        const geoData = responseFromSuper.body;
        const specificGeoData = geoData.results[0];
        console.log(geoData);
        const formatted = specificGeoData.formatted_address;

        const lat = specificGeoData.geometry.location.lat;
        const lng = specificGeoData.geometry.location.lng;

        const newLocation = new Location(searchQuery, formatted, lat, lng);

        const sqlQueryInsert = `INSERT INTO locations
        (search_query, formatted_query, latitude, longitude)
        VALUES
        ($1, $2, $3, $4)`;

        const valuesArray = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];




        client.query(sqlQueryInsert, valuesArray);

        response.send(newLocation);

      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })

    }
  })
})


// TARGET WEATHER from API 

app.get('/weather', getWeather)

function getWeather(request, response) {

  const localData = request.query.data;


  client.query(`SELECT * FROM weather WHERE search_query=$1`, [localData.search_query]).then(sqlResult => {


    if (sqlResult.rowCount > 0) {
      console.log('found weather stuff in database')

      response.send(sqlResult.rows[0]);
      console.log(sqlResult.rows);

    } else {
      console.log('did not find in database, googling now!');

      const urlDarkSky = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;


      superagent.get(urlDarkSky).then(responseFromSuper => {

        const weatherData = responseFromSuper.body;
        const eightDays = weatherData.daily.data;
        const formattedDays = eightDays.map(day => new Day(day.summary, day.time));



        formattedDays.forEach(day => {

          const sqlQueryInsert = `INSERT INTO weather
      (search_query, forecast, time)
      VALUES
      ($1, $2, $3)`;

          const valuesArray = [localData.search_query, day.forecast, day.time];
          client.query(sqlQueryInsert, valuesArray);
          console.log('accessing values array', valuesArray);
        })


        response.send(formattedDays)
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })
    }
  });
}


// EVENTBRITE from API 

app.get('/events', getEvents)

function getEvents(request, response) {

  let eventData = request.query.data;


  client.query(`SELECT * FROM events WHERE search_query=$1`, [eventData.search_query]).then(sqlResult => {

    if (sqlResult.rowCount === 0) {
      console.log('data from internet');

      const urlfromEventbrite = `http://api.eventful.com/json/events/search?location=${eventData.formatted_query}&date=Future&app_key=${process.env.EVENTBRITE_API_KEY}`;
      console.log(urlfromEventbrite)
      superagent.get(urlfromEventbrite).then(responseFromSuper => {

        //console.log('message=============================',responseFromSuper.body)
        //const eventbriteData = responseFromSuper.body.events;
        const eventbriteData = responseFromSuper.res.text;
        console.log('hello', eventbriteData)
        const formattedEvents = eventbriteData.map(event => new Event(event.url, event.name.text, event.start.local, event.description.text));

        response.send(formattedEvents);


        formattedEvents.forEach(event => {
          const insertEvent = `
          INSERT INTO events
          (name, search_query, link, event_date, summary)
          VALUE
          ($1, $2, $3, $4, $5);`
          client.query(insertEvent, [event.name, eventData.search_query, event.link, event.event_date, event.summary]);
        });

      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })

    } else {
      console.log('data already exists in event database');
      'use the data that exists in the db';
      response.send(sqlResult.rows);
    }
  });
}



app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});
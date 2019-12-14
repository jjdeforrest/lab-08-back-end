"use strict";

const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
require("dotenv").config();
const pg = require("pg");

const app = express();
app.use(cors());

//postgres client
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on("error", error => console.error(error));

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

app.get("/location", (request, response) => {
  const searchQuery = request.query.data;

  client
    .query(`SELECT * FROM locations WHERE search_query=$1`, [searchQuery])
    .then(sqlResult => {
      //if stuff:
      if (sqlResult.rowCount > 0) {
        response.send(sqlResult.rows[0]);
      } else {
        const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

        superagent
          .get(urlToVisit)
          .then(responseFromSuper => {
            const geoData = responseFromSuper.body;
            const specificGeoData = geoData.results[0];

            const formatted = specificGeoData.formatted_address;

            const lat = specificGeoData.geometry.location.lat;
            const lng = specificGeoData.geometry.location.lng;

            const newLocation = new Location(searchQuery, formatted, lat, lng);

            const sqlQueryInsert = `INSERT INTO locations
        (search_query, formatted_query, latitude, longitude)
        VALUES
        ($1, $2, $3, $4)`;

            const valuesArray = [
              newLocation.search_query,
              newLocation.formatted_query,
              newLocation.latitude,
              newLocation.longitude
            ];

            client.query(sqlQueryInsert, valuesArray);

            response.send(newLocation);
          })
          .catch(error => {
            response.status(500).send(error.message);
            console.error(error);
          });
      }
    });
});

// TARGET WEATHER from API

function Weather(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}

app.get("/weather", getWeather);

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  superagent
    .get(url)
    .then(data => {
      const weather = data.body.daily.data.map(obj => {
        let weather = obj.summary;
        let weathertime = new Date(obj.time * 1000).toDateString();
        return new Weather(weather, weathertime);
      });
      response.status(200).send(weather);
    })
    .catch(err => {
      console.error(err);
      response.status(500).send("Status 500: Internal Server Error");
    });
}

// EVENTBRITE from API

app.get("/events", getEvents);

function getEvents(request, response) {
  let eventData = request.query.data;

  client
    .query(`SELECT * FROM events WHERE search_query=$1`, [
      eventData.search_query
    ])
    .then(sqlResult => {
      if (sqlResult.rowCount === 0) {
        const urlfromEventbrite = `http://api.eventful.com/json/events/search?location=${eventData.formatted_query}&date=Future&app_key=${process.env.EVENTBRITE_API_KEY}`;
        superagent
          .get(urlfromEventbrite)
          .then(responseFromSuper => {
            const eventbriteData = JSON.parse(responseFromSuper.text);
            const formattedEvents = eventbriteData.events.event.map(
              event =>
                new Event(
                  event.url,
                  event.title,
                  event.start_time,
                  event.description
                )
            );

            response.send(formattedEvents);

            formattedEvents.forEach(event => {
              const insertEvent = `
          INSERT INTO events
          (name, search_query, link, event_date, summary)
          VALUE
          ($1, $2, $3, $4, $5);`;
              client.query(insertEvent, [
                event.name,
                eventData.search_query,
                event.link,
                event.event_date,
                event.summary
              ]);
            });
          })
          .catch(error => {
            response.status(500).send(error.message);
            console.error(error);
          });
      } else {
        response.send(sqlResult.rows);
      }
    });
}

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});

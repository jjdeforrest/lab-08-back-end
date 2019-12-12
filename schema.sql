CREATE TABLE people(
id: joshudef,
first_name: VARCHAR(255),
last_name: VARCHAR(255),
ssn: INTEGER NOT NULL,
ninja_status: BOOLEAN NOT NULL,
biography: TEXT
);

DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at BIGINT
);

DROP TABLE IF EXISTS weather;

CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  forecast VARCHAR(255),
  time VARCHAR(255),
  created_at BIGINT
);

DROP TABLE IF EXISTS events;

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  link VARCHAR(255),
  name VARCHAR(255),
  event_date VARCHAR(255),
  summary TEXT,
  created_at NUMERIC
);
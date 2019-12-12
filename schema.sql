CREATE TABLE people(
id: joshudef,
first_name: VARCHAR(255),
last_name: VARCHAR(255),
ssn: INTEGER NOT NULL,
ninja_status: BOOLEAN NOT NULL,
biography: TEXT
);

INSERT INTO people(
  first_name, last_name, ssn, ninja_status, biography
) VALUES (
  'Flibbity', 
  'Jibbity',
  1,
  TRUE,
  'flibbity jibbity jibbited excitedly across the hills and ways'
);

INSERT INTO people(
  first_name, last_name, ssn, ninja_status, biography
) VALUES (
  'happy', 
  'bappy',
  2,
  TRUE,
  'joppity boppity boppited excitedly across the hills and ways'
);
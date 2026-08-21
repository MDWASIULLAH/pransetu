-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";

-- Enable uuid-ossp for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";

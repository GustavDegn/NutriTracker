// Importerer dotenv-modulet, der hjælper med at indlæse miljøvariabler fra en .env-fil
import dotenv from 'dotenv';
// Konfigurerer dotenv til at indlæse variabler fra en specifik fil, '.env.development'
dotenv.config({ path: './.env.development' });

// Definerer en konfigurationsobjekt for at opsætte databaseforbindelse
const config = {
  // Brugernavn til Azure SQL-databasen hentes fra miljøvariablerne
  user: process.env.AZURE_SQL_USER,
  // Adgangskode til Azure SQL-databasen hentes fra miljøvariablerne
  password: process.env.AZURE_SQL_PASSWORD,
  // Navnet på Azure SQL-databasen hentes fra miljøvariablerne
  database: process.env.AZURE_SQL_DATABASE,
  // Servernavnet til Azure SQL-databasen hentes fra miljøvariablerne
  server: process.env.AZURE_SQL_SERVER,
  // Portnummer til forbindelsen konverteres fra en streng til et heltal
  port: parseInt(process.env.AZURE_SQL_PORT, 10),
  // Ekstra forbindelsesmuligheder
  options: {
    encrypt: true, // Angiver at forbindelsen skal være krypteret
    // Bestemmer om servercertifikatet skal stoles på baseret på miljøet
    trustServerCertificate: process.env.NODE_ENV !== 'production'
  },
  // Konfiguration af forbindelsespoolen
  pool: {
    max: 10, // Maksimalt antal forbindelser i poolen
    min: 0,  // Minimum antal forbindelser i poolen
    idleTimeoutMillis: 100000 // Maksimal tid en forbindelse må være inaktiv før frigivelse
  }
};

// Eksporterer konfigurationsobjektet for brug i andre dele af applikationen
export default config;


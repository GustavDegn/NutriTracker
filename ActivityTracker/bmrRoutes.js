// Importerer Express-modulet til at oprette og håndtere en webserver
import express from 'express';
// Importerer databasekonfigurationsmodulet for at få adgang til databasen
import database from '../config/database.js';
// Opretter en ny router-instance fra Express, som tillader definition af ruter
const router = express.Router();

// Definerer en ny rute for HTTP POST-anmodninger til '/add'
router.post('/add', async (req, res) => {
    // Tjekker om brugeren er logget ind ved at se på sessionen
    if (!req.session.userId) {
        // Sender en 403-forbudt status og en fejlmeddelelse hvis brugeren ikke er logget ind
        return res.status(403).send('You must be logged in to perform this action.');
    }

    try {
        // Uddrager BMR-data (Basal Metabolic Rate) fra forespørgselens krop
        const { weight, age, gender, bmr } = req.body;

        // Bruger brugerId fra sessionen, forudsat at sessionen er korrekt konfigureret
        const UserId = req.session.userId;

        // Indsætter BMR-dataene i databasen ved hjælp af en metode fra databasemodulet
        const result = await database.addBMR(UserId, weight, age, gender, bmr);
        // Sender en 201-oprettet status og en besked om succes samt de indsatte data
        res.status(201).json({ message: "BMR added successfully", data: result });
    } catch (error) {
        // Logger en fejlmeddelelse i konsollen, hvis der opstår en fejl
        console.error('Failed to add BMR data:', error);
        // Sender en 500-serverfejlstatus og fejlmeddelelsen
        res.status(500).send(error.message);
    }
});

// Eksporterer routeren for at den kan anvendes andre steder i applikationen
export default router;





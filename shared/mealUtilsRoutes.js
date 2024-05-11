// Importerer Express-modulet og databasekonfigurationsfilen.
import express from 'express';
import database from '../config/database.js';

// Opretter en ny router-instance.
const router = express.Router();

// Definerer en GET-route på stien '/save' for at hente gemte måltider for en bestemt bruger.
router.get('/save', async (req, res) => {
    // Antager at brugerens ID er gemt i sessionen og tilgænger det.
    const userId = req.session.userId;
    
    // Tjekker om brugeren er logget ind ved at kontrollere, om et bruger-ID er tilgængeligt.
    if (!userId) {
        // Sender en HTTP 403-fejl tilbage, hvis brugeren ikke er logget ind.
        return res.status(403).send('User not logged in');
    }
  
    try {
        // Kalder funktionen getMealsByUserId fra database-modulet for at hente måltider baseret på brugerens ID.
        const meals = await database.getMealsByUserId(userId);
        // Tjekker om der blev fundet nogen måltider.
        if (meals.length > 0) {
            // Sender de fundne måltider tilbage som et JSON-respons.
            res.json(meals);
        } else {
            // Sender en HTTP 404-fejl tilbage, hvis ingen måltider blev fundet for den givne bruger.
            res.status(404).send('No meals found for this user');
        }
    } catch (error) {
        // Logger eventuelle fejl til konsollen og sender en HTTP 500-fejl tilbage, hvis der opstår en serverfejl.
        console.error('Failed to fetch meals:', error);
        res.status(500).send('Server error');
    }
});

// Eksporterer routeren, så den kan anvendes i andre dele af applikationen.
export default router;

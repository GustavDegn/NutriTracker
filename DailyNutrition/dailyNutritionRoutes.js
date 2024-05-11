// Importerer Express frameworket og databasekonfiguration.
import express from 'express';
import database from '../config/database.js';  // Sørg for at stien er korrekt

const router = express.Router();  // Opretter en ny router instance.

// Route til at hente kaloriedata for en bruger.
router.get('/calories', async (req, res) => {
    const userId = req.session.userId;  // Henter brugerens ID fra sessionen.
    const viewType = req.query.viewType || 'daily';  // Bestemmer visningstype, standard er 'daily'.
    const startDate = req.query.startDate;  // Startdato for forespørgslen.
    const endDate = req.query.endDate;  // Slutdato for forespørgslen.

    console.log(`Fetching calories for user ${userId} with view type ${viewType} from ${startDate} to ${endDate}`);  // Logger detaljer om forespørgslen.

    // Forsøger at hente kaloriedata og håndtere svar.
    try {
        const caloriesData = await database.getCaloriesIntake(userId, startDate, endDate, viewType);
        if (caloriesData.length > 0) {
            res.json({ userId, caloriesData });  // Sender data tilbage som JSON hvis data findes.
        } else {
            // Sender standarddata hvis ingen data findes.
            res.json({ userId, caloriesData: [{ TotalCalories: 0 }] });
        }
    } catch (error) {
        console.error('Error fetching calories intake:', error);  // Logger en fejlmeddelelse.
        res.status(500).send('Server error');  // Sender fejlrespons.
    }
});

// Route til at hente data om vandindtag.
router.get('/water/intake', async (req, res) => {
    const userId = req.session.userId;  // Henter brugerens ID fra sessionen.
    const viewType = req.query.viewType || 'daily';  // Bestemmer visningstype, standard er 'daily'.
    const startDate = req.query.startDate;  // Startdato for forespørgslen.
    const endDate = req.query.endDate;  // Slutdato for forespørgslen.

    if (!userId) {
        return res.status(403).send('User not logged in');  // Sender en 403 status hvis brugeren ikke er logget ind.
    }

    try {
        const waterIntake = await database.getTotalWaterIntake(userId, startDate, endDate, viewType);
        if (waterIntake.length > 0) {
            res.json({ userId, waterIntake });  // Sender data som JSON hvis data findes.
        } else {
            // Sender standarddata hvis ingen data findes.
            res.json({ userId, waterIntake: [{ TotalLiters: 0 }] });
        }
    } catch (error) {
        console.error('Error fetching water intake:', error);  // Logger en fejlmeddelelse.
        res.status(500).send('Server error');  // Sender fejlrespons.
    }
});

// Route til at hente data om kalorier forbrændt.
router.get('/calories-burned', async (req, res) => {
    const userId = req.session.userId;  // Henter brugerens ID fra sessionen.
    if (!userId) {
      return res.status(403).send('User not logged in');  // Sender en 403 status hvis brugeren ikke er logget ind.
    }
  
    const viewType = req.query.viewType || 'daily';  // Bestemmer visningstype, standard er 'daily'.
    const startDate = req.query.startDate;  // Startdato for forespørgslen.
    const endDate = req.query.endDate;  // Slutdato for forespørgslen.
  
    try {
      const caloriesBurnedData = await database.getTotalCaloriesBurned(userId, startDate, endDate, viewType);
      if (caloriesBurnedData.length > 0) {
        res.json(caloriesBurnedData);  // Sender data som JSON hvis data findes.
      } else {
        // Sender standarddata hvis ingen data findes.
        res.json({ userId, caloriesBurned: [{ TotalCaloriesBurned: 0 }] });
      }
    } catch (error) {
      console.error('Error fetching calories burned data:', error);  // Logger en fejlmeddelelse.
      res.status(500).send('Server error');  // Sender fejlrespons.
    }
});

// Eksporterer routeren så den kan bruges i andre dele af applikationen.
export default router;


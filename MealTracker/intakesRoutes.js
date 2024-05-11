// Importerer Express og databasekonfigurationsmodulet.
import express from 'express';
import database from '../config/database.js';
const router = express.Router();

// POST-route til registrering af måltidsintag.
router.post('/record', async (req, res) => {
    const userId = req.session.userId;  // Henter bruger-ID fra sessionen.
    if (!userId) {
        return res.status(403).send('User not logged in');  // Sender fejl hvis brugeren ikke er logget ind.
    }

    // Uddrager måltidsdata fra request body.
    const { MealID, MealName, MealWeight, ConsumptionTime, Latitude, Longitude } = req.body;
    try {
        // Tilføjer måltidsintag i databasen og returnerer resultatet.
        const mealIntake = await database.addRecordIntake(userId, MealID, MealName, MealWeight, ConsumptionTime, Latitude, Longitude);
        res.status(201).json({ message: "Meal intake registered successfully", mealIntake });
    } catch (error) {
        console.error('Error registering meal intake:', error);
        res.status(500).send('Server error');  // Sender serverfejl hvis noget går galt.
    }
});

// PUT-route til opdatering af et specifikt måltidsintag.
router.put('/update/:intakeId', async (req, res) => {
    const { intakeId } = req.params;  // Henter intakeId fra URL.
    const userId = req.session.userId;  // Sikrer at brugeren er autentificeret.
    const { MealWeight, MealName, ConsumptionTime } = req.body;  // Uddrager opdateringsdata fra request body.

    if (!userId) {
        return res.status(403).send('User not logged in');  // Sikrer at brugeren er logget ind.
    }

    try {
        // Opdaterer måltidsintag i databasen.
        const rowsAffected = await database.updateMealIntake(intakeId, userId, { MealWeight, MealName, ConsumptionTime });
  
        if (rowsAffected > 0) {
            console.log("Meal intake updated successfully");
            res.status(200).json({ message: "Meal intake updated successfully" });
        } else {
            res.status(404).send('No record found or user not authorized to update this record');  // Sender fejl hvis ingen post findes eller brugeren ikke har tilladelse.
        }
    } catch (error) {
        console.error('Error updating meal intake:', error);
        res.status(500).send('Server error');  // Håndterer serverfejl.
    }
});

// DELETE-route til sletning af et måltidsintag.
router.delete('/delete/:intakeId', async (req, res) => {
    const userId = req.session.userId;  // Henter brugerens ID fra sessionen.
    const { intakeId } = req.params;  // Henter intakeId fra URL.

    if (!userId) {
      return res.status(403).send('User not logged in');  // Sikrer at brugeren er logget ind.
    }
  
    try {
      const rowsDeleted = await database.deleteMealIntake(userId, intakeId);
      if (rowsDeleted > 0) {
        res.json({ success: true, message: 'Meal intake deleted successfully' });
      } else {
        res.status(404).send('Meal intake not found or not authorized to delete');  // Sender fejl hvis ingen post findes eller brugeren ikke har tilladelse til at slette.
      }
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).send(`Server error: ${error.message}`);  // Håndterer serverfejl.
    }
});

// GET-route til at hente alle måltidsintag for en bruger.
router.get('/mealIntakes', async (req, res) => {
    const userId = req.session.userId;  // Henter brugerens ID fra sessionen.
  
    if (!userId) {
        return res.status(403).send('User not logged in');  // Sikrer at brugeren er logget ind.
    }
  
    try {
        const meals = await database.getAllMealIntakes(userId);  // Henter alle måltidsintag for brugeren.
        res.json(meals.length > 0 ? meals : []);  // Sender måltidsintag eller et tomt array hvis ingen findes.
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Server error');  // Håndterer serverfejl.
    }
});

// Eksporterer routeren for anvendelse i andre dele af applikationen.
export default router;




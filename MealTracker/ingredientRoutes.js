// Importerer nødvendige biblioteker og konfigurationer.
import express from 'express';
import database from '../config/database.js';

// Initialiserer en ny Express router.
const router = express.Router();

// Endpoint til at hente ernæringsoplysninger for en specifik ingrediens.
router.get('/ingredientDetails', async (req, res) => {
    const ingredientName = req.query.IngredientName; // Henter ingrediensnavnet fra query-parameteret.

    // Validerer om ingrediensnavnet er til stede.
    if (!ingredientName) {
        return res.status(400).send('Ingredient name is required.');
    }

    try {
        // Henter ingrediensdetaljer fra databasen.
        const ingredientDetails = await database.getIngredientDetailsByName(ingredientName);
        if (ingredientDetails) {
            // Sender ingrediensdetaljerne tilbage med status 200, hvis de findes.
            res.status(200).json(ingredientDetails);
        } else {
            // Sender en 404 status, hvis ingrediensen ikke findes.
            res.status(404).send("Ingredient not found.");
        }
    } catch (error) {
        // Logger fejl og sender en serverfejlmeddelelse.
        console.error('Error fetching ingredient details:', error);
        res.status(500).send('Server error: ' + error.message);
    }
});

// Endpoint til registrering af en ny ingrediens.
router.post('/registerIngredient', async (req, res) => {
    // Tjekker om brugeren er logget ind.
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to perform this action.');
    }

    // Uddrager data fra request body.
    const { IngredientName, Quantity, IntakeDateTime, Protein, Fat, Fibers, Calories, Latitude, Longitude } = req.body;
    const UserId = req.session.userId;

    try {
        // Tilføjer en ny ingrediens til databasen.
        const result = await database.addIngredient(
            UserId, IngredientName, Quantity, IntakeDateTime, Protein, Fat, Fibers, Calories, Latitude, Longitude
        );
        // Bekræfter succesfuld registrering med tilhørende data.
        res.status(201).json({ message: "Intake registered successfully", data: result });
    } catch (error) {
        // Logger fejl og sender en serverfejlmeddelelse.
        console.error('Error registering ingredient intake:', error);
        res.status(500).send('Server error: ' + error.message);
    }
});

// Endpoint til at hente alle ingrediensintag for en bruger.
router.get('/ingredientIntakes', async (req, res) => {
    const userId = req.session.userId;

    // Tjekker om brugeren er logget ind.
    if (!userId) {
        return res.status(403).send('User not logged in');
    }

    try {
        // Henter alle ingrediensintag fra databasen.
        const ingredientIntakes = await database.getAllIngredientIntakes(userId);
        // Returnerer ingrediensintag eller et tomt array, hvis ingen findes.
        res.json(ingredientIntakes.length > 0 ? ingredientIntakes : []);
    } catch (error) {
        // Logger fejl og sender en serverfejlmeddelelse.
        console.error('Server error:', error);
        res.status(500).send('Server error');
    }
});

// Endpoint til at opdatere et specifikt ingrediensindtag.
router.put('/updateIngredient/:intakeId', async (req, res) => {
    const { intakeId } = req.params;
    const userId = req.session.userId;
    const { Quantity, IntakeDateTime, IngredientName } = req.body;

    // Tjekker om brugeren er logget ind.
    if (!userId) {
      return res.status(403).send('User not logged in');
    }
  
    try {
      // Opdaterer ingrediensindtaget i databasen.
      const rowsAffected = await database.updateIndividualIntake(intakeId, userId, { Quantity, IntakeDateTime, IngredientName });
      if (rowsAffected > 0) {
        // Bekræfter succesfuld opdatering.
        res.status(200).json({ message: "Ingredient intake updated successfully" });
      } else {
        // Returnerer en 404 status, hvis intet indtag er fundet eller brugeren ikke har rettigheder til opdatering.
        res.status(404).send('No ingredient intake found or not authorized to update');
      }
    } catch (error) {
      // Logger fejl og sender en serverfejlmeddelelse.
      console.error('Error updating ingredient intake:', error);
      res.status(500).send('Server error');
    }
});

// Endpoint til at slette et specifikt ingrediensindtag.
router.delete('/deleteIngredient/:intakeId', async (req, res) => {
    const userId = req.session.userId;
    const { intakeId } = req.params;

    // Tjekker om brugeren er logget ind.
    if (!userId) {
        return res.status(403).send('User not logged in');
    }

    try {
        // Sletter ingrediensindtaget i databasen.
        const rowsDeleted = await database.deleteIndividualIntake(userId, intakeId);
        if (rowsDeleted > 0) {
            // Bekræfter succesfuld sletning.
            res.json({ success: true, message: 'Ingredient intake deleted successfully' });
        } else {
            // Returnerer en 404 status, hvis intet indtag er fundet eller brugeren ikke har rettigheder til at slette.
            res.status(404).send('Ingredient intake not found or not authorized to delete');
        }
    } catch (error) {
        // Logger fejl og sender en serverfejlmeddelelse.
        console.error('Server error:', error);
        res.status(500).send('Server error');
    }
});

// Eksporterer routeren for at gøre den tilgængelig i andre dele af applikationen.
export default router;



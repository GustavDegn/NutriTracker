// Importerer nødvendige moduler: Express og en databasekonfiguration.
import express from 'express';
import database from '../config/database.js';

// Opretter en ny router ved hjælp af Express.
const router = express.Router();

// POST-route til at oprette et nyt måltid i databasen.
router.post('/create', async (req, res) => {
  try {
    // Uddrager måltidsdata fra requestens body.
    const {UserId, MealName, totalKcal, totalProtein, totalFat, totalFibers, totalkJ, Ingredients} = req.body;

    // Indsætter det nye måltid i databasen og gemmer resultatet.
    const result = await database.addMeal(UserId, MealName, totalKcal, totalProtein, totalFat, totalFibers, totalkJ, Ingredients);
    
    // Sender et svar tilbage med statuskoden 201 (Created), inklusiv resultatet af databasen.
    res.status(201).json(result);
  } catch (error) {
    // Logger en fejl og sender en fejlmeddelelse tilbage med statuskode 500 (Internal Server Error).
    console.error('Error creating the meal:', error);
    res.status(500).send(error.message);
  }
});

// GET-route til at hente gemte måltider baseret på brugerens ID.
router.get('/save', async (req, res) => {
  const userId = req.session.userId;  // Antager, at brugerens ID er gemt i sessionen.

  // Tjekker om brugeren er logget ind.
  if (!userId) {
      return res.status(403).send('User not logged in'); // Returnerer statuskode 403 (Forbidden), hvis ikke logget ind.
  }

  try {
      const meals = await database.getMealsByUserId(userId); // Henter måltider fra databasen baseret på brugerens ID.
      if (meals.length > 0) {
          res.json(meals); // Returnerer måltiderne som JSON, hvis der findes nogle.
      } else {
          res.status(404).send('No meals found for this user'); // Returnerer statuskode 404 (Not Found), hvis ingen måltider findes.
      }
  } catch (error) {
      console.error('Failed to fetch meals:', error); // Logger en fejl og sender en fejlmeddelelse tilbage med statuskode 500.
      res.status(500).send('Server error');
  }
});

// DELETE-route til at slette et måltid baseret på dets MealID.
router.delete('/delete/:mealId', async (req, res) => {
  const mealId = parseInt(req.params.mealId, 10); // Konverterer mealId fra URL-parameter til et heltal.

  // Tjekker om et gyldigt mealId er angivet.
  if (!mealId) {
      return res.status(400).send('Invalid meal ID provided'); // Returnerer statuskode 400 (Bad Request), hvis mealId er ugyldigt.
  }

  try {
      const result = await database.deleteMeal(mealId); // Forsøger at slette måltidet fra databasen.
      if (result.affectedRows === 0) { // Tjekker om databasen faktisk har slettet et måltid.
          return res.status(404).send('Meal not found'); // Returnerer statuskode 404, hvis måltidet ikke findes.
      }
      res.send('Meal deleted successfully'); // Bekræfter at måltidet er slettet succesfuldt.
  } catch (error) {
      console.error('Error deleting the meal:', error); // Logger en fejl og sender en fejlmeddelelse tilbage med statuskode 500.
      res.status(500).send('Server error');
  }
});

// Eksporterer routeren for at gøre den tilgængelig i andre filer.
export default router;

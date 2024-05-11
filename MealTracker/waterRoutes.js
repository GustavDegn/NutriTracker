// Importerer nødvendige moduler: Express og database konfigurationsmodulet.
import express from 'express';
import database from '../config/database.js';  // Sørg for at stien til din database modul er korrekt

const router = express.Router();

// POST-route til registrering af vandindtag.
router.post('/addWater', async (req, res) => {
  // Tjekker om brugeren er logget ind.
  if (!req.session.userId) {
      return res.status(403).send('You must be logged in to perform this action.');
  }

  // Uddrager data fra request body.
  const { WaterDateTime, Liter, Latitude, Longitude } = req.body;

  // Validerer de nødvendige data.
  if (!WaterDateTime || Liter === undefined) {
      return res.status(400).send('WaterDateTime and Liter are required.');
  }

  // Henter brugerens ID fra sessionen.
  const UserId = req.session.userId;
  try {
    // Tilføjer vandindtaget i databasen og gemmer resultatet.
    const result = await database.addWaterIntake(UserId, WaterDateTime, Liter, Latitude, Longitude);
    res.status(201).json({ message: "Water intake registered successfully", result });
  } catch (error) {
    console.error('Error registering water intake:', error);
    res.status(500).send('Server error');
  }
});

// GET-route til at hente alle vandindtag for en bruger.
router.get('/waterIntakes', async (req, res) => {
  const userId = req.session.userId;

  // Tjekker om brugeren er logget ind.
  if (!userId) {
      return res.status(403).send('User not logged in');
  }

  try {
      // Henter alle vandindtag fra databasen.
      const waterIntakes = await database.getAllWaterIntakes(userId);
      res.json(waterIntakes.length > 0 ? waterIntakes : []);
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).send('Server error');
  }
});

// PUT-route til opdatering af et specifikt vandindtag.
router.put('/updateWater/:waterIntakeId', async (req, res) => {
  const { waterIntakeId } = req.params;
  const userId = req.session.userId;
  const { Liter, WaterDateTime } = req.body;

  if (!userId) {
    return res.status(403).send('User not logged in');
  }

  try {
    // Opdaterer det specifikke vandindtag i databasen.
    const rowsAffected = await database.updateWaterIntake(waterIntakeId, userId, { Liter, WaterDateTime });
    if (rowsAffected > 0) {
      res.status(200).json({ message: "Water intake updated successfully" });
    } else {
      res.status(404).send('No water intake found or not authorized to update');
    }
  } catch (error) {
    console.error('Error updating water intake:', error);
    res.status(500).send('Server error');
  }
});

// DELETE-route til sletning af et specifikt vandindtag.
router.delete('/deleteWater/:waterIntakeId', async (req, res) => {
  const userId = req.session.userId;
  const { waterIntakeId } = req.params;

  if (!userId) {
      return res.status(403).send('User not logged in');
  }

  try {
      // Sletter det specifikke vandindtag fra databasen.
      const rowsDeleted = await database.deleteWaterIntake(userId, waterIntakeId);
      if (rowsDeleted > 0) {
          res.json({ success: true, message: 'Water intake deleted successfully' });
      } else {
          res.status(404).send('Water intake not found or not authorized to delete');
      }
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).send('Server error');
  }
});

// Eksporterer routeren så den kan bruges i andre dele af applikationen.
export default router;

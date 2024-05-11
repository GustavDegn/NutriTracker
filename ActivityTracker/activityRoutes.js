import express from 'express';
import database from '../config/database.js';  

const router = express.Router();  // Initialiserer en ny instance af express.Router for at håndtere API routes

// Endpoint til at hente specifik aktivitetsdata baseret på aktivitetsnavn
router.get('/', async (req, res) => {
    const activityName = req.query.activityName;  // Henter aktivitetsnavnet fra query-parametrene i URL'en
    console.log('Received request for activity:', activityName);  // Logger modtagelsen af forespørgslen med aktivitetsnavnet

    try {
        const activity = await database.getActivityByName(activityName);  // Foretager databaseopslag for at finde aktiviteten
        console.log('Database response:', activity);  // Logger hvad databasen returnerer
        if (activity) {
            res.json(activity);  // Sender aktivitetsdataen som JSON hvis aktiviteten findes
        } else {
            console.log('No activity found for:', activityName);  // Logger hvis aktiviteten ikke findes i databasen
            res.status(404).send('Activity not found');  // Sender en 404 ikke fundet status
        }
    } catch (error) {
        console.error('Error fetching activity:', error);  // Logger fejl hvis databaseopslaget fejler
        res.status(500).send('Server error');  // Sender en 500 serverfejl status
    }
});

// Endpoint til at tilføje en ny aktivitet
router.post('/add', async (req, res) => {
    // Tjekker om brugeren er logget ind ved at kontrollere sessionens userId
    if (!req.session.userId) {
        console.log('User not logged in');
        return res.status(403).send('User not logged in');  // Sender en 403 forbudt status hvis brugeren ikke er logget ind
    }

    // Uddrager data fra anmodningskroppen
    const { ActivityType, DurationMinutes, CaloriesBurned } = req.body;
    const ActivityDateTime = new Date();  // Opretter en tidsstempel for registreringstidspunktet af aktiviteten

    try {
        // Tilføjer aktivitetsdataen til databasen
        const addedActivity = await database.addActivity(
            req.session.userId,
            ActivityType,
            DurationMinutes,
            CaloriesBurned,
            ActivityDateTime,
        );
        console.log('Activity added:', addedActivity);  // Logger den tilføjede aktivitet
        res.status(201).json({
            message: "Activity successfully added",
            activity: addedActivity  // Sender succesmeddelelse og den tilføjede aktivitetsdata
        });
    } catch (error) {
        console.error('Error adding activity:', error);  // Logger eventuelle fejl ved tilføjelse
        res.status(500).send('Server error');  // Sender en 500 serverfejl status
    }
});

// Endpoint til at hente alle aktiviteter for en specifik bruger
router.get('/activities', async (req, res) => {
    if (!req.session || !req.session.userId) {  
        return res.status(403).send('You must be logged in to view activities.');  // Sikrer at brugeren er logget ind
    }

    const userId = req.session.userId;  // Henter brugerens ID fra sessionen

    try {
        const activities = await database.getActivitiesByUserId(userId);  // Henter alle aktiviteter tilknyttet brugerens ID
        if (activities.length > 0) {
            res.json(activities);  // Sender aktivitetsdataene hvis der findes nogen
        } else {
            res.status(404).send('No activities found for this user');  // Sender en 404 hvis ingen aktiviteter findes
        }
    } catch (error) {
        console.error('Error fetching activities by user ID:', error);  // Logger fejl
        res.status(500).send('Server error');  // Sender en 500 serverfejl status
    }
});

// Endpoint til at beregne kalorier brændt fra en aktivitet
router.get('/calculate', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to perform this action.');  // Kontrollerer at brugeren er logget ind
    }

    const { activityName, durationMinutes } = req.query;  // Henter aktivitetsnavn og varighed fra forespørgslen

    if (!durationMinutes) {
        return res.status(400).send('Duration is required');  // Validerer at varigheden er angivet
    }

    try {
        const activity = await database.getActivityByName(activityName);  // Søger efter aktiviteten i databasen
        if (activity) {
            const caloriesBurned = (activity.CaloriesBurned / 60) * durationMinutes;  // Beregner kalorier brændt
            res.json({
                activityType: activity.ActivityType,
                durationMinutes,
                caloriesBurned: Math.round(caloriesBurned)  // Afrunder og sender resultatet
            });
        } else {
            res.status(404).send('Activity not found');  // Sender en 404 hvis aktiviteten ikke findes
        }
    } catch (error) {
        console.error('Error fetching activity:', error);  // Logger fejl
        res.status(500).send('Server error');  // Sender en 500 serverfejl status
    }
});

export default router;

// Importerer nødvendige biblioteker for at oprette og håndtere en webserver
import express from 'express';
import session from 'express-session';
import userRouter from './User/userRoutes.js';
import mealsRouter from './MealCreator/mealCreatorRoutes.js';
import intakesRouter from './MealTracker/intakesRoutes.js';
import ingredientRouter from './MealTracker/ingredientRoutes.js';
import waterRouter from './MealTracker/waterRoutes.js';
import activityRouter from './ActivityTracker/activityRoutes.js';
import bmrRouter from './ActivityTracker/bmrRoutes.js';
import nutriRoutes from './DailyNutrition/dailyNutritionRoutes.js';
import saveMealsRoutes from './shared/mealUtilsRoutes.js';

// Initialiserer en Express-applikation
const app = express();
const port = 3000; // Definerer portnummeret, hvor serveren vil lytte

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Middleware til at parse JSON og URL-kodede bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware til at betjene statiske filer fra definerede stier
app.use(express.static('./public'));
app.use(express.static('./User'));
app.use(express.static('./MealCreator'));
app.use(express.static('./MealTracker'));
app.use(express.static('./ActivityTracker'));
app.use(express.static('./DailyNutrition'));
app.use(express.static('./shared'));

// Opsætter specifikke ruter for forskellige funktioner og betjener deres statiske filer
app.use('/user', userRouter);
app.use('/meals', mealsRouter);
app.use('/intakes', intakesRouter);
app.use('/ingredient', ingredientRouter);
app.use('/water', waterRouter);
app.use('/saveMeals', saveMealsRoutes);
app.use('/activity', activityRouter);
app.use('/bmr', bmrRouter);
app.use('/nutrition', nutriRoutes);

// Definerer et API-endepunkt til at søge efter produkter
app.get('/search', async (req, res) => {
    const productName = req.query.productName;
    const apiUrl = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${encodeURIComponent(productName)}`;
    const apiKey = process.env.EXTERNAL_API_KEY; // Husk at tilføje denne nøgle til .env-filen

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'X-API-Key': apiKey,
            },
        });

        if (!apiResponse.ok) {
            throw new Error(`HTTP-fejlstatus: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        console.error('Fejl:', error);
        res.status(500).send('Serverfejl');
    }
});

// Definerer et API-endepunkt til at hente oplysninger om fødevaresammensætning
app.get('/FoodCompSpecs', async (req, res) => {
    const itemID = req.query.itemID;
    const sortKey = req.query.sortKey;
    const apiUrl = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${itemID}/BySortKey/${sortKey}`;
    const apiKey = process.env.EXTERNAL_API_KEY; // Anvendes fra .env-filen

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'X-API-Key': apiKey,
            },
        });

        if (!apiResponse.ok) {
            throw new Error(`HTTP-fejlstatus: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        console.error('Fejl:', error);
        res.status(500).send('Serverfejl');
    }
});

// Definerer rod-endepunktet og sender en velkomstbesked
app.get('/', (req, res) => {
    res.send('Velkommen til min Node.js server!');
});

// Starter serveren og logger en besked om at serveren kører
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Eksporterer appen for at gøre den tilgængelig for andre moduler
export default app;

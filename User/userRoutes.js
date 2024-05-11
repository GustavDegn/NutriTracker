// Importerer nødvendige biblioteker og moduler
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/database.js'; // Importerer database konfigurationsmodul, sørg for sti korrekthed

// Opretter en ny router objekt fra Express til at håndtere brugerruter
const router = express.Router();

// Route for at registrere nye brugere
router.post('/register', async (req, res) => {
    // Uddrager brugerdata fra forespørgselslegemet
    const { username, password, email, age, weight, gender } = req.body;

    // Tjekker for nødvendige felter
    if (!username || !password || !email) {
        return res.status(400).send('Username, password, and email are required.');
    }

    // Validerer alder og vægt
    const ageInt = parseInt(age, 10);
    if (isNaN(ageInt) || ageInt <= 0) {
        return res.status(400).send('Invalid age. Age must be a positive integer.');
    }

    const weightDecimal = parseFloat(weight);
    if (isNaN(weightDecimal) || weightDecimal <= 0) {
        return res.status(400).send('Invalid weight. Weight must be a positive number.');
    }

    try {
        // Tjekker om brugernavnet allerede findes
        const existingUsers = await db.query('SELECT * FROM dbo.Users WHERE Username = @username', { username });
        if (existingUsers.length > 0) {
            return res.status(409).send('Username is already in use.');
        }

        // Krypterer brugerens adgangskode
        const hashedPassword = await bcrypt.hash(password, 10);

        // Indsætter den nye bruger i databasen og henter den nyoprettede brugers ID
        const insertResult = await db.query('INSERT INTO dbo.Users (Username, PasswordHash, Email, Age, Gender, Weight) OUTPUT Inserted.UserID VALUES (@username, @passwordHash, @email, @age, @gender, @weight)', {
            username,
            passwordHash: hashedPassword,
            email,
            age: ageInt,
            gender,
            weight: weightDecimal
        });

        // Antager at UserID returneres i insertResult
        const newUserId = insertResult.recordset[0].UserID;

        // Gemmer userId i sessionen
        req.session.userId = newUserId;

        // Sender respons tilbage til klienten med besked om at brugeren er oprettet
        res.status(201).json({
            message: 'User created successfully.',
            userId: newUserId  // Sender eventuelt det nye bruger-ID tilbage
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('An error occurred on the server.');
    }
});

// Route for brugerlogin
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Henter brugeroplysninger baseret på brugernavnet
        const result = await db.query("SELECT UserId, PasswordHash FROM Users WHERE Username = @username", { username });

        if (result.recordset.length > 0) {
            const { UserId, PasswordHash } = result.recordset[0];
            const isValid = await bcrypt.compare(password, PasswordHash); // Validerer adgangskoden
            
            if (isValid) {
                req.session.userId = UserId;  // Sætter bruger-ID i sessionen
                res.json({ UserId: UserId });  // Sender bruger-ID tilbage til klienten
            } else {
                res.status(401).send('Authentication failed');  // Ugyldig adgangskode
            }
        } else {
            res.status(404).send('User not found');  // Ingen bruger fundet med det givne brugernavn
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route til at hente brugeroplysninger
router.get('/details/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Henter brugeroplysninger baseret på brugerens ID
        const result = await db.query('SELECT Username, Email, Age, Weight, Gender FROM dbo.Users WHERE UserID = @UserID', { UserID: id });
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);  // Returnerer brugeroplysninger som JSON
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).send('Server error');
    }
});

// Route til at slette en bruger
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM dbo.Users WHERE UserID = @UserID', { UserID: id });
      if (result.rowsAffected[0] === 0) {
        return res.status(404).send('Bruger ikke fundet');
      }
      res.status(200).send('Bruger slettet');
    } catch (error) {
      console.error('Fejl ved sletning af bruger:', error);
      res.status(500).json({ success: false, message: 'Serverfejl' });
    }
  });

// Route til at opdatere brugeroplysninger
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { alder, vægt, køn } = req.body;

    const ageInt = parseInt(alder, 10);
    const weightDecimal = parseFloat(vægt);

    if (isNaN(ageInt) || isNaN(weightDecimal)) {
        return res.status(400).send('Invalid input data.');
    }

    try {
        const result = await db.query('UPDATE dbo.Users SET Age = @Age, Weight = @Weight, Gender = @Gender WHERE UserID = @UserID', {
            UserID: id,
            Age: ageInt,
            Weight: weightDecimal,
            Gender: køn
        });
        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('User not found');
        }
        res.status(200).send('User info updated');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Server error');
    }
});

// Route for brugerlogud
router.post('/logout', function(req, res) {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction failed', err);
            return res.status(500).send('Logout failed');
        }
        res.status(200).send('Logout successful');
    });
});

// Eksporterer routeren for at gøre den tilgængelig for andre dele af applikationen
export default router;


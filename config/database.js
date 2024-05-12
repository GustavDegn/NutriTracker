// Importerer 'mssql' modulet for at oprette og håndtere forbindelser til en MSSQL-database
import sql from 'mssql';
// Importerer konfigurationsindstillinger fra en lokal fil
import config from './config.js';

// Eksporterer en klasse 'Database' for at centralisere databasetilgange
export class Database {
  constructor() {
    // Initialiserer en forbindelsespool når klassen instansieres
    this.poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('Connected to MSSQL'); // Logger ved vellykket forbindelse
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed', err); // Logger og afslutter ved fejl
        process.exit(1);
      });
  }

  // Asynkron metode til at hente en bruger baseret på brugernavn
  async getUserByUsername(username) {
    console.log('Attempting to fetch user with username:', username); // Logger operationen
    const sqlQuery = "SELECT * FROM Users WHERE Username = @username";
    const parameters = { username }; // Definerer parametre for sikker indsættelse af variabler i forespørgslen
    try {
      const result = await this.query(sqlQuery, parameters);
      console.log('Query result object:', result);
      if (result.recordset && result.recordset.length > 0) {
        console.log('User found:', result.recordset[0]);
        return result.recordset[0]; // Returnerer den fundne bruger
      } else {
        console.log('No user found with that username.');
        return null; // Returnerer null hvis ingen bruger findes
      }
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error; // Kaster fejlen videre
    }
  }

  // En hjælpemetode til at udføre SQL-forespørgsler med parametre
  async query(sqlQuery, parameters = {}) {
    const pool = await this.poolPromise;
    const request = pool.request(); // Opretter en ny forespørgsel

    // Tilføjer parametre til forespørgslen
    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, this.getParameterType(value), value);
      console.log(`Parameter set: ${key}, Value: ${value}`);
    }

    try {
      const result = await request.query(sqlQuery); // Udfører forespørgslen
      return result; // Returnerer resultatsættet
    } catch (error) {
      console.error('SQL query error:', error);
      throw error; // Kaster fejlen videre
    }
  }

  // Bestemmer datatypen for SQL parametre baseret på JavaScript datatyper
  getParameterType(value) {
    if (value === null) {
      return sql.NVarChar;
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? sql.Int : sql.Decimal;
    } else if (typeof value === 'boolean') {
      return sql.Bit;
    } else if (value instanceof Date) {
      return sql.DateTime;
    } else {
      return sql.NVarChar;
    }
  }

  async query(sqlQuery, parameters = {}) {
    const pool = await this.poolPromise;
    const request = pool.request();

    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, this.getParameterType(value), value);
    }

    try {
      const result = await request.query(sqlQuery);
      return result;
    } catch (error) {
      console.error('SQL query error:', error);
      throw error; 
    }
  }

// Metoden tilføjer en aktivitet til databasen med bruger-id, aktivitetstype, varighed, forbrændte kalorier og tidspunkt
async addActivity(UserId, ActivityType, DurationMinutes, CaloriesBurned, ActivityDateTime) {
  const pool = await this.poolPromise;
  const request = pool.request();
  // Indsætter inputparametre i SQL-forespørgslen
  request.input('UserId', sql.Int, UserId);
  request.input('ActivityType', sql.NVarChar, ActivityType);
  request.input('DurationMinutes', sql.Decimal(10, 2), DurationMinutes);
  request.input('CaloriesBurned', sql.Decimal(10, 2), CaloriesBurned);
  request.input('ActivityDateTime', sql.DateTime2, ActivityDateTime);
  
  // SQL-query for at indsætte data i databasen og returnere den indsatte række
  const insertQuery = `
    INSERT INTO dbo.ActivityTracker (UserID, ActivityType, DurationMinutes, CaloriesBurned, ActivityDateTime)
    OUTPUT Inserted.ActivityID, Inserted.UserId, Inserted.ActivityType, Inserted.DurationMinutes, Inserted.CaloriesBurned, Inserted.ActivityDateTime
    VALUES (@UserId, @ActivityType, @DurationMinutes, @CaloriesBurned, @ActivityDateTime)
  `;

  try {
    const result = await request.query(insertQuery);
    return result.recordset[0];  // Returnerer den indsættede aktivitet
  } catch (error) {
    console.error('Error in addActivity:', error);
    throw error;
  }
}

// Henter en aktivitet baseret på navnet
async getActivityByName(activityName) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('ActivityName', sql.NVarChar, activityName);
  const sqlQuery = 'SELECT * FROM Activities WHERE ActivityType = @ActivityName';
  const result = await request.query(sqlQuery);
  console.log('Query result:', result);
  return result.recordset.length > 0 ? result.recordset[0] : null;
}

// Henter alle aktiviteter for en bruger baseret på bruger-id
async getActivitiesByUserId(UserId) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, UserId);
  const result = await request.query(`
      SELECT * FROM ActivityTracker WHERE UserId = @UserId
  `);
  return result.recordset; // Returnerer alle fundne aktiviteter for brugeren
}

// Tilføjer et måltid med detaljeret information om kalorier, proteiner, fedt, fibre, energi og ingredienser
async addMeal(UserId, MealName, totalKcal, totalProtein, totalFat, totalFibers, totalkJ, Ingredients) {
  const pool = await this.poolPromise;
  const request = pool.request();
  
  request.input('UserId', sql.Int, UserId);
  request.input('MealName', sql.NVarChar, MealName);
  request.input('totalKcal', sql.Int, totalKcal);
  request.input('totalProtein', sql.Int, totalProtein);
  request.input('totalFat', sql.Int, totalFat);
  request.input('totalFibers', sql.Int, totalFibers);
  request.input('totalkJ', sql.Int, totalkJ);
  request.input('Ingredients', sql.NVarChar(sql.MAX), Ingredients);  // Gemmer en JSON-streng med ingredienser
  
  const insertQuery = `
    INSERT INTO dbo.Meals (UserId, MealName, totalKcal, totalProtein, totalFat, totalFibers, totalkJ, Ingredients)
    OUTPUT Inserted.MealID, Inserted.UserId, Inserted.MealName, Inserted.totalKcal, Inserted.totalProtein, Inserted.totalFat, Inserted.totalFibers, Inserted.totalkJ, Inserted.Ingredients
    VALUES (@UserId, @MealName, @totalKcal, @totalProtein, @totalFat, @totalFibers, @totalkJ, @Ingredients)
  `;
  try {
    const result = await request.query(insertQuery);
    return result.recordset[0]; // Returnerer det indsættede måltid med alle detaljer
  } catch (error) {
    console.error('Error in addMeal:', error);
    throw error;
  }
}

// Henter detaljer for en ingrediens baseret på navnet
async getIngredientDetailsByName(IngredientName) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('IngredientName', sql.NVarChar, IngredientName);

  const query = `
      SELECT IngredientName, Protein, Fat, Fiber, Calories
      FROM dbo.Ingredients
      WHERE IngredientName = @IngredientName;
  `;

  try {
      const result = await request.query(query);
      console.log(`Query result for ${IngredientName}:`, result); // Detaljeret log

      if (result.recordset.length > 0) {
          return result.recordset[0]; // Returnerer den fundne ingrediens direkte
      } else {
          return null; // Returnerer null hvis ingen ingrediens findes
      }
  } catch (error) {
      console.error(`Error fetching details for ${IngredientName}:`, error);
      throw error; // Kaster fejlen videre til håndtering i API-laget
  }
}

// Tilføjer en ingrediens med detaljerede ernæringsdata og geolokationsinformation
async addIngredient(UserID, IngredientName, Quantity, IntakeDateTime, Protein, Fat, Fibers, Calories, Latitude, Longitude) {
  const pool = await this.poolPromise;
  const request = pool.request();
  
  // Definerer inputparametre for SQL-query
  request.input('UserID', sql.Int, UserID);
  request.input('IngredientName', sql.NVarChar, IngredientName);
  request.input('Quantity', sql.Decimal(18, 2), Quantity);
  request.input('IntakeDateTime', sql.DateTime2, new Date(IntakeDateTime));
  request.input('Protein', sql.Decimal(18, 2), Protein);
  request.input('Fat', sql.Decimal(18, 2), Fat);
  request.input('Fibers', sql.Decimal(18, 2), Fibers);
  request.input('Calories', sql.Decimal(18, 2), Calories);
  request.input('Latitude', sql.Float, Latitude);
  request.input('Longitude', sql.Float, Longitude);

  // SQL-query der indsætter data og returnerer de indsatte data
  const insertQuery = `
      INSERT INTO dbo.IndividualIntakes
      (UserID, IngredientName, Quantity, IntakeDateTime, Protein, Fat, Fibers, Calories, Latitude, Longitude)
      OUTPUT Inserted.IntakeID, Inserted.Protein, Inserted.Fat, Inserted.Fibers, Inserted.Calories
      VALUES (@UserID, @IngredientName, @Quantity, @IntakeDateTime, @Protein, @Fat, @Fibers, @Calories, @Latitude, @Longitude)
  `;

  try {
    const result = await request.query(insertQuery);
    console.log('Insert result:', result);
    return result.recordset[0]; // Returnerer den indsættede ingrediens med detaljer
  } catch (error) {
    console.error('Error adding ingredient intake:', error);
    throw error; // Fejlhåndtering
  }
}

// Funktion til at tilføje en vandindtagelsespost i databasen for en specifik bruger
async addWaterIntake(UserId, WaterDateTime, Liter, Latitude, Longitude) {
  try {
    // Venter på forbindelsespuljen til databasen og opretter en ny forespørgsel
    const pool = await this.poolPromise;
    const request = pool.request();

    // Indsætter inputparametre i SQL-forespørgslen
    request.input('UserId', sql.Int, UserId);
    request.input('WaterDateTime', sql.DateTime2, WaterDateTime);
    request.input('Liter', sql.Decimal(10, 2), Liter);
    request.input('Latitude', sql.Float, Latitude);  // Sikrer korrekt datatype
    request.input('Longitude', sql.Float, Longitude);  // Sikrer korrekt datatype

    // Udfører SQL-forespørgslen for at indsætte vandindtag og returnere det unikke ID
    const result = await request.query(`
        INSERT INTO dbo.WaterIntakes (UserId, WaterDateTime, Liter, Latitude, Longitude)
        VALUES (@UserId, @WaterDateTime, @Liter, @Latitude, @Longitude);
        SELECT SCOPE_IDENTITY() as WaterIntakeId;
    `);

    // Returnerer det genererede ID for vandindtaget og successtatus
    return { WaterIntakeId: result.recordset[0].WaterIntakeId, success: true };
  } catch (err) {
    console.error('Failed to add water intake:', err);
    return { success: false, error: err.message }; // Håndterer eventuelle fejl
  }
}

// Funktion til at tilføje en BMR (Basal Metabolic Rate) beregning for en bruger
async addBMR(UserId, weight, age, gender, bmr) {
  const pool = await this.poolPromise;
  const request = pool.request();
  // Indsætter inputparametre og deres datatyper i forespørgslen
  request.input('UserId', sql.Int, UserId);
  request.input('Weight', sql.Float, weight);
  request.input('Age', sql.Int, age);
  request.input('Gender', sql.VarChar, gender);
  request.input('BMR', sql.Float, bmr);

  // SQL-forespørgsel til indsættelse af BMR-beregning
  const insertQuery = `
      INSERT INTO dbo.BMR_Calculations (UserId, Weight, Age, Gender, BMR)
      OUTPUT Inserted.ID, Inserted.UserId, Inserted.Weight, Inserted.Age, Inserted.Gender, Inserted.BMR
      VALUES (@UserId, @Weight, @Age, @Gender, @BMR);
  `;

  try {
    const result = await request.query(insertQuery);
    return result.recordset[0]; // Returnerer den indsatte BMR-beregning
  } catch (error) {
    console.error('Error in addBMR:', error);  
    console.log('SQL Query:', insertQuery);  // Logger SQL-forespørgslen for fejlsøgning
    throw error;
  }
}

// Funktion til at hente alle BMR-beregninger for en specifik bruger
async getBMRByUserId(UserId) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, UserId);

  // Udfører forespørgsel for at hente BMR-beregninger baseret på bruger-ID
  const result = await request.query(`
      SELECT ID, Weight, Age, Gender, BMR 
      FROM dbo.BMR_Calculations 
      WHERE UserID = @UserId
  `);
  return result.recordset; // Returnerer resultatsættet med BMR-data
}

// Funktion til at hente alle måltider for en bruger baseret på bruger-ID
async getMealsByUserId(userId) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);

  const query = 'SELECT * FROM dbo.Meals WHERE UserID = @UserId';
  const result = await request.query(query);
  return result.recordset; // Returnerer alle måltider for brugeren
}

// Funktion til at slette et måltid baseret på måltidets ID
async deleteMeal(mealId) {
  const pool = await this.poolPromise;
  const request = pool.request();

  const deleteQuery = 'DELETE FROM dbo.Meals WHERE MealID = @MealID';
  request.input('MealID', sql.Int, mealId);

  const result = await request.query(deleteQuery);
  return result; // Returnerer resultatet af sletteoperationen
}

// Funktion til at tilføje en indtagelsespost for et måltid
async addRecordIntake(userId, mealId, mealName, mealWeight, consumptionTime, latitude, longitude) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('MealId', sql.Int, mealId);
  request.input('MealName', sql.NVarChar, mealName);  // Tilføjer måltidets navn til parametrene
  request.input('MealWeight', sql.Decimal(10, 2), mealWeight);
  request.input('ConsumptionTime', sql.DateTime2, consumptionTime);
  request.input('Latitude', sql.Float, latitude);
  request.input('Longitude', sql.Float, longitude);

  // SQL-forespørgsel til indsættelse af måltidsindtagelsespost, inkluderer beregning af næringsstoffer baseret på vægt
  const query = `
  INSERT INTO IntakeRecords (UserID, MealID, MealName, ConsumptionTime, MealWeight, Calories, Protein, Fat, Fibers, Latitude, Longitude)
  OUTPUT INSERTED.*
  VALUES 
  (@UserId, @MealId, @MealName, @ConsumptionTime, @MealWeight, 
  (SELECT totalKcal * @MealWeight / 100 FROM Meals WHERE MealID = @MealId),
  (SELECT totalProtein * @MealWeight / 100 FROM Meals WHERE MealID = @MealId),
  (SELECT totalFat * @MealWeight / 100 FROM Meals WHERE MealID = @MealId),
  (SELECT totalFibers * @MealWeight / 100 FROM Meals WHERE MealID = @MealId), @Latitude, @Longitude)
  `;

  try {
      const result = await request.query(query);
      return result.recordset.length > 0 ? result.recordset[0] : null; // Returnerer den indsatte post, hvis tilgængelig
  } catch (error) {
      console.error('Error adding meal intake:', error);
      throw error;
  }
}

  // Metode til at hente alle måltidsindtagelser for en bestemt bruger
  async getAllMealIntakes(userId) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('UserId', sql.Int, userId);

    const query = `
      SELECT 
        IR.IntakeID, IR.UserID, IR.MealID, IR.ConsumptionTime, IR.MealWeight, 
        IR.Calories, IR.Protein, IR.Fat, IR.Fibers, IR.Latitude, IR.Longitude, M.MealName
      FROM 
        IntakeRecords IR
      INNER JOIN 
        Meals M ON IR.MealID = M.MealID
      WHERE 
        IR.UserID = @UserId
      ORDER BY 
        IR.ConsumptionTime DESC;
    `;

    try {
      const result = await request.query(query);
      return result.recordset; // Returnerer alle måltidsindtagelser for brugeren
    } catch (error) {
      console.error('Error fetching meal intakes:', error);
      throw error; // Kaster en fejl, der skal håndteres af kaldende funktion
    }
  }

  // Metode til at hente alle vandindtagelser for en bruger
  async getAllWaterIntakes(userId) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('UserId', sql.Int, userId);

    const query = `
      SELECT 
        WaterIntakeID, UserID, WaterDateTime, Liter, Latitude, Longitude
      FROM 
        dbo.WaterIntakes
      WHERE 
        UserID = @UserId
      ORDER BY 
        WaterDateTime DESC;
    `;

    try {
      const result = await request.query(query);
      return result.recordset; // Returnerer alle vandindtagelser for brugeren
    } catch (error) {
      console.error('Error fetching water intakes:', error);
      throw error;
    }
  }

  // Metode til at hente alle ingrediensindtagelser for en bruger
  async getAllIngredientIntakes(userId) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('UserId', sql.Int, userId);

    const query = `
      SELECT 
        IntakeID, UserID, IngredientName, Quantity, IntakeDateTime, Calories,
        Protein, Fat, Fibers, Latitude, Longitude
      FROM 
        dbo.IndividualIntakes
      WHERE 
        UserID = @UserId
      ORDER BY 
        IntakeDateTime DESC;
    `;

    try {
      const result = await request.query(query);
      return result.recordset; // Returnerer alle ingrediensindtagelser for brugeren
    } catch (error) {
      console.error('Error fetching ingredient intakes:', error);
      throw error;
    }
  }

  // Metode til at opdatere en måltidsindtagelse
  async updateMealIntake(intakeId, userId, { MealWeight, MealName, ConsumptionTime }) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('IntakeID', sql.Int, intakeId);
    request.input('UserId', sql.Int, userId);
    request.input('MealWeight', sql.Decimal(10, 2), MealWeight);
    request.input('MealName', sql.NVarChar, MealName);
    request.input('ConsumptionTime', sql.DateTime2, ConsumptionTime);

    const query = `
      UPDATE IntakeRecords
      SET 
        MealWeight = @MealWeight,
        MealName = @MealName,
        ConsumptionTime = @ConsumptionTime
      WHERE IntakeID = @IntakeID AND UserID = @UserId;
    `;

    try {
      const result = await request.query(query);
      return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

  // Metode til at opdatere en vandindtagelse
  async updateWaterIntake(waterIntakeId, userId, { Liter, WaterDateTime }) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('WaterIntakeId', sql.Int, waterIntakeId);
    request.input('UserId', sql.Int, userId);
    request.input('Liter', sql.Decimal(10, 2), Liter);
    request.input('WaterDateTime', sql.DateTime2, WaterDateTime);

    const query = `
      UPDATE WaterIntakes
      SET Liter = @Liter, WaterDateTime = @WaterDateTime
      WHERE WaterIntakeID = @WaterIntakeId AND UserID = @UserId;
    `;

    try {
      const result = await request.query(query);
      return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker
    } catch (error) {
      console.error('Error updating water intake:', error);
      throw error;
    }
  }

  // Metode til at opdatere en ingrediensindtagelse
  async updateIndividualIntake(intakeId, userId, { Quantity, IntakeDateTime, IngredientName }) {
    const pool = await this.poolPromise;
    const request = pool.request();
    request.input('IntakeId', sql.Int, intakeId);
    request.input('UserId', sql.Int, userId);
    request.input('Quantity', sql.Decimal(10, 2), Quantity);
    request.input('IntakeDateTime', sql.DateTime2, IntakeDateTime);
    request.input('IngredientName', sql.NVarChar, IngredientName);

    const query = `
      UPDATE IndividualIntakes
      SET Quantity = @Quantity, IntakeDateTime = @IntakeDateTime, IngredientName = @IngredientName
      WHERE IntakeID = @IntakeId AND UserID = @UserId;
    `;

    try {
      const result = await request.query(query);
      return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

// Funktion til at slette en måltidsindtagelsespost for en bruger
async deleteMealIntake(userId, intakeId) {
  const pool = await this.poolPromise; // Venter på forbindelsespuljen
  const request = pool.request(); // Opretter en ny forespørgsel
  // Angiver parametre for den SQL-forespørgsel, der skal udføres
  request.input('IntakeId', sql.Int, intakeId);
  request.input('UserId', sql.Int, userId);

  // SQL-forespørgsel til at slette en måltidsindtagelse
  const query = `
    DELETE FROM IntakeRecords WHERE IntakeID = @IntakeId AND UserID = @UserId;
  `;

  try {
    const result = await request.query(query); // Udfører forespørgslen
    return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker, bør være 0 eller 1
  } catch (error) {
    console.error('Error deleting meal intake:', error);
    throw error; // Kaster en fejl videre, som skal håndteres af kaldende funktion
  }
}

// Funktion til at slette en vandindtagelsespost
async deleteWaterIntake(userId, waterIntakeId) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('WaterIntakeId', sql.Int, waterIntakeId);
  request.input('UserId', sql.Int, userId);

  // SQL-forespørgsel til at slette en vandindtagelse
  const query = `DELETE FROM WaterIntakes WHERE WaterIntakeID = @WaterIntakeId AND UserID = @UserId;`;

  try {
    const result = await request.query(query);
    return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker
  } catch (error) {
    console.error('Error deleting water intake:', error);
    throw error;
  }
}

// Funktion til at slette en ingrediensindtagelsespost
async deleteIndividualIntake(userId, intakeId) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('IntakeId', sql.Int, intakeId);
  request.input('UserId', sql.Int, userId);

  // SQL-forespørgsel til at slette en ingrediensindtagelse
  const query = `DELETE FROM IndividualIntakes WHERE IntakeID = @IntakeId AND UserID = @UserId;`;

  try {
    const result = await request.query(query);
    return result.rowsAffected[0]; // Returnerer antallet af påvirkede rækker
  } catch (error) {
    console.error('Error deleting ingredient intake:', error);
    throw error;
  }
}

async getCaloriesIntake(userId, startDate, endDate, viewType) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('StartDate', sql.DateTime2, startDate);
  request.input('EndDate', sql.DateTime2, endDate);

  let query = `
      -- Selecting and aggregating calories from IntakeRecords
      SELECT 
          FORMAT(ConsumptionTime, 'yyyy-MM-ddTHH:mm:ss') AS DateTime,
          SUM(Calories) AS Calories
      FROM 
          IntakeRecords
      WHERE 
          UserID = @UserId AND 
          ConsumptionTime BETWEEN @StartDate AND @EndDate
      GROUP BY 
          FORMAT(ConsumptionTime, 'yyyy-MM-ddTHH:mm:ss')
      UNION ALL
      -- Selecting and aggregating calories from IndividualIntakes
      SELECT 
          FORMAT(IntakeDateTime, 'yyyy-MM-ddTHH:mm:ss') AS DateTime,
          SUM(Calories) AS Calories  -- Direct sum of Calories
      FROM 
          IndividualIntakes
      WHERE 
          UserID = @UserId AND 
          IntakeDateTime BETWEEN @StartDate AND @EndDate
      GROUP BY 
          FORMAT(IntakeDateTime, 'yyyy-MM-ddTHH:mm:ss')
      ORDER BY 
          DateTime;
  `;

  try {
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error('Error fetching combined calories intake data:', error);
      throw error;
  }
}

// Funktion til at hente det totale vandindtag inden for en bestemt periode og gruppere det baseret på visningstype
async getTotalWaterIntake(userId, startDate, endDate, viewType) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('StartDate', sql.DateTime2, startDate);
  request.input('EndDate', sql.DateTime2, endDate);

  let query = `
      SELECT 
          FORMAT(WaterDateTime, 'yyyy-MM-ddTHH:mm:ss') AS DateTime,
          Liter
      FROM 
          WaterIntakes
      WHERE 
          UserID = @UserId AND 
          WaterDateTime BETWEEN @StartDate AND @EndDate
      ORDER BY 
          WaterDateTime;
  `;

  try {
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error('Error fetching water intake:', error);
      throw error;
  }
}

// Funktion til at hente det totale antal forbrændte kalorier for en bruger inden for en bestemt periode og gruppere det baseret på visningstype
async getTotalCaloriesBurned(userId, startDate, endDate, viewType) {
  const pool = await this.poolPromise;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('StartDate', sql.DateTime2, startDate);
  request.input('EndDate', sql.DateTime2, endDate);

  let query = `
      SELECT 
          FORMAT(ActivityDateTime, 'yyyy-MM-ddTHH:mm:ss') AS DateTime,
          CaloriesBurned
      FROM 
          ActivityTracker
      WHERE 
          UserID = @UserId AND 
          ActivityDateTime BETWEEN @StartDate AND @EndDate
      ORDER BY 
          ActivityDateTime;
  `;

  try {
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error('Error fetching calories burned data:', error);
      throw error;
    }
  }
}

// Eksporterer en instans af Database-klassen for at gøre den tilgængelig for andre dele af applikationen
export default new Database();

// Tilføjer en event listener, der afventer at hele dokumentets indhold er indlæst.
document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication(); // Kalder funktionen for at kontrollere brugerens autentifikation.
});

// Funktion til at kontrollere, om en bruger er logget ind ved at tjekke session storage.
function checkUserAuthentication() {
    const userId = sessionStorage.getItem('UserId'); // Henter brugerens ID fra session storage.
    if (!userId) {
        window.location.href = '/login.html'; // Omdirigerer til login siden, hvis ingen bruger er logget ind.
    }
    // Her kunne man tilføje en serververifikation af brugerens ID, hvis det er nødvendigt.
}

// Funktion til at opdatere dashboardet baseret på valgt visningstype ('daily' eller 'monthly').
function updateDashboard(viewType) {
    const now = new Date(); // Gemmer den aktuelle dato og tid.
    // Sætter slutdatoen til slutningen af den aktuelle dag.
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(); 

    // Bestemmer startdatoen baseret på den valgte visningstype.
    const startDate = viewType === 'daily' ?
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() : // Starten af i dag
        new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(); // Starten af måneden, 30 dage siden

    console.log(`Fetching data from ${startDate} to ${endDate} for viewType: ${viewType}`);

    // Udfører API-kald uden caching for at sikre friske data.
    Promise.all([
        fetch(`/nutrition/calories?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json()),
        fetch(`nutrition/water/intake?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json()),
        fetch(`/nutrition/calories-burned?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json())
    ]).then(([caloriesData, waterData, burnedData]) => {
        // Beregner det totale kalorieindtag fra data.
        let totalCalories = caloriesData.caloriesData.reduce((sum, record) => sum + record.TotalCalories, 0);
        document.getElementById('energy-today').textContent = `${totalCalories} kcal`;

        // Beregner det totale vandindtag fra data og viser det med én decimal.
        let totalWater = waterData.waterIntake.reduce((sum, record) => sum + record.TotalLiters, 0);
        document.getElementById('water-today').textContent = `${totalWater.toFixed(1)} L`;

        // Beregner det totale antal forbrændte kalorier fra data.
        let totalCaloriesBurned = burnedData.reduce((sum, record) => sum + record.CaloriesBurned, 0);
        document.getElementById('calories-burned').textContent = `${totalCaloriesBurned} kcal`;

        // Beregner den kaloriske balance og viser denne.
        let caloricBalance = totalCalories - totalCaloriesBurned;
        document.getElementById('caloric-balance').textContent = `${caloricBalance} kcal`;
    }).catch(error => {
        console.error('Error fetching dashboard data:', error); // Logger fejl, hvis API-kaldene mislykkes.
        // Sætter alle værdier til 0 ved fejl.
        document.getElementById('energy-today').textContent = '0';
        document.getElementById('water-today').textContent = '0';
        document.getElementById('calories-burned').textContent = '0';
        document.getElementById('caloric-balance').textContent = '0';
    });
}

// Tilføjer en event listener til 'viewType' vælgeren, der opdaterer dashboardet, når brugeren vælger en ny visningstype.
document.getElementById('viewType').addEventListener('change', function() {
    updateDashboard(this.value);
});

updateDashboard('daily'); // Initialiserer dashboardet med daglig visning som standard.





// Tilføjer en event listener til 'document' objektet for at lytte efter hændelsen 'DOMContentLoaded'.
// Denne hændelse udløses, når hele dokumentets HTML er fuldstændigt indlæst, uden at vente på stilarter, billeder og underframes.
document.addEventListener('DOMContentLoaded', function() {
    // Når dokumentet er indlæst, kaldes funktionen checkUserAuthentication.
    checkUserAuthentication(); // Funktionen tjekker, om brugeren er logget ind.
});

// Funktionen checkUserAuthentication tjekker, om en bruger er autentificeret ved at søge efter en brugeridentifikator i session storage.
function checkUserAuthentication() {
    const userId = sessionStorage.getItem('UserId'); // Henter brugerens ID fra browserens session storage.
    if (!userId) {
        // Hvis der ikke findes et bruger ID i session storage, omdirigeres brugeren til login-siden.
        window.location.href = '/login.html';
    }
}

// Funktionen updateDashboard opdaterer dashboardet baseret på en visningstype ('daily' eller 'monthly').
function updateDashboard(viewType) {
    const now = new Date(); // Opretter et nyt Date objekt med den aktuelle dato og tid.
    let startDate, endDate;
    
    // Baseret på den angivne visningstype, sætter funktionen start- og slutdatoen for den periode, data skal vises for.
    if (viewType === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);  // Starten af dagen (midnat).
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);  // Slutningen af dagen (lige før midnat den følgende dag).
    } else if (viewType === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);  // Starten af måneden.
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);  // Slutningen af måneden (sidste sekund i måneden).
    }

    // Konverterer start- og slutdato til ISO-string format for brug i API kald.
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();

    // Udfører parallelle API-kald for at hente data om kalorier, vandindtag og forbrændte kalorier.
    Promise.all([
        fetch(`/nutrition/calories?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json()),
        fetch(`/nutrition/water/intake?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json()),
        fetch(`/nutrition/calories-burned?viewType=${viewType}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-cache" }).then(response => response.json())
    ]).then(([caloriesData, waterData, burnedData]) => {
        // Når data er hentet, vises det i konsollen.
        console.log('Fetched Calories Data:', caloriesData);
        console.log('Fetched Water Data:', waterData);
        console.log('Fetched Burned Calories Data:', burnedData);
        // Kald funktionen renderTable for at vise dataene i en tabel.
        renderTable(viewType, caloriesData, waterData, burnedData, now);
    }).catch(error => {
        // Håndterer eventuelle fejl under datahentningen og viser en fejlmeddelelse i tabellen.
        console.error('Error fetching dashboard data:', error);
        document.getElementById('data-table').innerHTML = '<tr><td colspan="5">Error loading data</td></tr>';
    });
}

// Funktionen renderTable genererer og indsætter HTML for en tabel baseret på hentede data.
function renderTable(viewType, caloriesData, waterData, burnedData, now) {
    const table = document.getElementById('data-table'); // Finder tabelelementet i DOM'en.
    // Initialiserer tabellens header.
    table.innerHTML = '<tr><th>Dato/tid</th><th>Energiindtag (kcal)</th><th>Vandindtag(L)</th><th>Forbrænding (kcal)</th><th>Kalorieoverskud/underskud (kcal)</th></tr>';

    let startDate = new Date(now.getFullYear(), now.getMonth(), viewType === 'daily' ? now.getDate() : 1);
    let endDate = viewType === 'daily' ? new Date(startDate.getTime() + 86400000) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Genererer et array af dato/tidsstrenge for hvert interval baseret på visningstypen.
    const intervals = [];
    while (startDate < endDate) {
        intervals.push(startDate.toISOString());
        startDate = new Date(startDate.getTime() + (viewType === 'daily' ? 3600000 : 86400000)); // Inkrementerer med en time for daglig visning, med en dag for månedlig visning.
    }

    // Aggregerer data for hvert interval.
    const aggregateData = (data, dateTimeField) => {
        return data.reduce((acc, item) => {
            const dateKey = item[dateTimeField].slice(0, viewType === 'daily' ? 13 : 10); // Skærer til time eller dags præcision.
            acc[dateKey] = (acc[dateKey] || 0) + item.Calories || item.Liter || item.CaloriesBurned;
            return acc;
        }, {});
    };
    const caloriesByInterval = aggregateData(caloriesData.caloriesData, 'DateTime');
    const waterByInterval = aggregateData(waterData.waterIntake, 'DateTime');
    const burnedByInterval = aggregateData(burnedData.caloriesBurnedData, 'DateTime');

    // Bygger tabelrækker baseret på intervaller.
    intervals.forEach(interval => {
        const dateKey = interval.slice(0, viewType === 'daily' ? 13 : 10);
        const calories = caloriesByInterval[dateKey] || 0;
        const water = waterByInterval[dateKey] || 0;
        const burned = burnedByInterval[dateKey] || 0;
        const balance = calories - burned; // Beregner kaloriebalance.

        table.innerHTML += `<tr>
            <td>${dateKey.replace('T', ' ')}</td>
            <td>${calories} kcal</td>
            <td>${water.toFixed(1)} L</td>
            <td>${burned} kcal</td>
            <td>${balance} kcal</td>
        </tr>`;
    });
}

// Tilføjer en event listener til elementet med id 'viewType', som lytter efter ændringer.
// Når værdien ændres, kaldes funktionen updateDashboard med den nye visningstype.
document.getElementById('viewType').addEventListener('change', function() {
    updateDashboard(this.value);
});

updateDashboard('daily'); // Initialiserer dashboardet med den daglige visning.






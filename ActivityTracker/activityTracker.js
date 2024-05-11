// Registrerer en funktion, der kører når DOM-træet er fuldt indlæst
document.addEventListener('DOMContentLoaded', function() {
    // Finder og gemmer referencer til HTML-elementer ved hjælp af deres ID
    const activityList = document.getElementById('activityList');
    const bmrResult = document.getElementById('bmrResult');

    // Funktion til at tjekke brugerens autentificering i session storage
    function checkUserAuthentication() {
        const userId = sessionStorage.getItem('UserId');
        if (!userId) {
            window.location.href = '/login.html'; // Omdirigerer til login, hvis brugeren ikke er logget ind
        }
    }

    // Udfører tjek for brugerens autentificering
    checkUserAuthentication();

    // Funktion til at hente brugerens aktiviteter fra serveren
    function fetchUserActivities() {
        fetch('/activity/activities', { // Laver en GET-anmodning til serveren
            method: 'GET',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch activities'); // Håndterer fejl ved dårligt svar fra serveren
            }
            return response.json();
        })
        .then(activities => {
            updateActivitiesDisplay(activities); // Opdaterer visningen af aktiviteter
        })
        .catch(error => {
            console.error('Error fetching activities:', error); // Logger eventuelle fejl ved hentning
        });
    }

    // Henter aktiviteter når siden er indlæst
    fetchUserActivities();

    // Funktion til at formatere en dato streng til dansk datoformat
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('da-DK', { // Benytter dansk lokalitet
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Funktion til at opdatere visningen af aktiviteter i HTML
    function updateActivitiesDisplay(activities) {
        activityList.innerHTML = ''; // Tømmer listen før opdatering
        activities.forEach(activity => {
            const row = activityList.insertRow();
            const formattedDate = formatDate(activity.ActivityDateTime);
            row.innerHTML = `<td>${activity.ActivityType}</td><td>${activity.DurationMinutes}</td><td>${activity.CaloriesBurned}</td><td>${formattedDate}</td>`; // Tilføjer hver aktivitet til tabellen
        });
    }

    // Funktion til at indlæse og vise BMR-data
    function loadAndDisplayBMR() {
        const bmrData = JSON.parse(sessionStorage.getItem('BMR')) || []; // Henter BMR fra session storage eller initialiserer tom liste
        updateBMR(bmrData);
    }

    // Funktion til at opdatere visningen af BMR-data i HTML
    function updateBMR(bmrData) {
        bmrResult.innerHTML = ''; // Tømmer tidligere BMR-data fra visningen
        if (bmrData.length > 0) {
            bmrData.forEach(bmr => {
                const row = bmrResult.insertRow();
                row.innerHTML = `<td>${bmr.weight}</td><td>${bmr.age}</td><td>${bmr.gender}</td><td>${bmr.bmr}</td>`; // Tilføjer BMR-data til tabellen
            });
        } else {
            bmrResult.innerHTML = '<tr><td colspan="4">No BMR data found.</td></tr>'; // Viser meddelelse hvis ingen BMR-data er tilgængelige
        }
    }

    // Funktion til at beregne og tilføje kalorier brugt ved aktivitet
    const calculateCaloriesButton = document.getElementById('calculateCalories');
    calculateCaloriesButton.addEventListener('click', function() {
        const activityName = document.getElementById('activityName').value.trim();
        const duration = document.getElementById('activityDuration').value.trim();
        if (!activityName || !duration) {
            alert('Please fill in both the activity name and duration.');
            return;
        }

        fetch(`/activity/calculate?activityName=${encodeURIComponent(activityName)}&durationMinutes=${encodeURIComponent(duration)}`)
        .then(response => response.json())
        .then(data => {
            const row = activityList.insertRow();
            row.innerHTML = `<td>${activityName}</td><td>${duration}</td><td>${data.caloriesBurned}</td>`;
            addActivity(activityName, duration, data.caloriesBurned); // Tilføjer aktivitet til serveren
        })
        .catch(error => {
            console.error('Error calculating calories:', error);
            alert(error.message);
        });
    });

    // Funktion til at tilføje en aktivitet til serveren
    function addActivity(activityName, duration, caloriesBurned) {
        const activityData = {
            ActivityType: activityName,
            DurationMinutes: parseFloat(duration),
            CaloriesBurned: parseFloat(caloriesBurned),
            ActivityDateTime: new Date().toISOString() // Sætter tidspunktet for aktiviteten
        };

        fetch('/activity/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(activityData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save activity'); // Håndterer fejl hvis aktiviteten ikke kan gemmes
            }
            return response.json();
        })
        .then(addedActivity => {
            alert('Activity saved successfully!');
            fetchUserActivities();  // Opdaterer listen med aktiviteter efter tilføjelse
        })
        .catch(error => {
            console.error('Error adding activity:', error);
            alert(error.message);
        });
    }

    // Funktion til at beregne BMR baseret på vægt, alder og køn
    function calculateBMR(weight, age, gender) {
        // Beregninger afhængig af køn og alder
        if (gender === 'male') {
            if (age < 3) return 0.249 * weight - 0.13;
            if (age >= 3 && age <= 10) return 0.095 * weight + 2.11;
            if (age >= 11 && age <= 18) return 0.074 * weight + 2.75;
            if (age >= 19 && age <= 30) return 0.064 * weight + 2.84;
            if (age >= 31 && age <= 60) return 0.0485 * weight + 3.67;
            if (age >= 61 && age <= 75) return 0.0499 * weight + 2.93;
            if (age > 75) return 0.035 * weight + 3.43;
        } else if (gender === 'female') {
            if (age < 3) return 0.244 * weight - 0.13;
            if (age >= 3 && age <= 10) return 0.085 * weight + 2.03;
            if (age >= 11 && age <= 18) return 0.056 * weight + 2.90;
            if (age >= 19 && age <= 30) return 0.0615 * weight + 2.08;
            if (age >= 31 && age <= 60) return 0.0364 * weight + 3.47;
            if (age >= 61 && age <= 75) return 0.0386 * weight + 2.88;
            if (age > 75) return 0.0410 * weight + 2.61;
        }
        throw new Error('Invalid age or gender'); // Fejlhåndtering hvis input er ugyldigt
    }

    // Tilføj eventlistener til 'calculateBMR' knappen
    document.getElementById('calculateBMR').addEventListener('click', async function() {
        const userId = sessionStorage.getItem('UserId');
        const weight = parseFloat(document.getElementById('weight').value);
        const age = parseInt(document.getElementById('age').value);
        const gender = document.getElementById('gender').value;

        if (!userId) {
            alert('User not logged in'); // Sikrer at brugeren er logget ind
            return;
        }

        if (!weight || !age || !gender) {
            alert('All fields are required'); // Sikrer at alle felter er udfyldt
            return;
        }

        const bmr = calculateBMR(weight, age, gender); // Beregner BMR
        const BMRData = {
            UserId: userId,
            weight,
            age,
            gender,
            bmr
        };

        let BMRS = JSON.parse(sessionStorage.getItem('BMR')) || [];
        BMRS.push(BMRData); // Tilføjer den nye BMR til listen i session storage
        sessionStorage.setItem('BMR', JSON.stringify(BMRS)); // Opdaterer session storage
        updateBMR(BMRS); // Opdaterer BMR-visningen
    });

    // Indlæser og viser BMR-data ved sideindlæsning
    loadAndDisplayBMR();
});


































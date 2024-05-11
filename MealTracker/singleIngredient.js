// Lytter efter DOMContentLoaded-eventet for at sikre, at hele dokumentet er indlæst, før scriptet udføres.
document.addEventListener('DOMContentLoaded', function () {
    // Henter formularelementet via dets ID.
    const form = document.getElementById('singleIngredientForm');
    
    // Tilføjer en event listener til formen for at håndtere indsendelsen.
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Forhindrer formularens standard submit handling.

        // Henter data fra formularfelter og trimmer whitespace fra strengen for ingrediensnavnet.
        const ingredientName = document.getElementById('ingredient').value.trim();
        const weight = parseFloat(document.getElementById('quantity').value); // Konverterer vægtinput til et flydende tal.
        const time = document.getElementById('intakeTime').value || new Date().toISOString(); // Bruger indtastet tid eller nuværende tidspunkt.

        // Validerer inputdataene.
        if (!ingredientName || isNaN(weight) || weight <= 0) {
            alert('Please enter a valid ingredient name and weight.'); // Viser en fejlmeddelelse, hvis valideringen fejler.
            return;
        }

        // Funktion til at hente geolokationsdata, derefter henter ingrediensdetaljer og registrerer indtaget.
        getGeolocation(async locationData => {
            console.log("Retrieved location data:", locationData); // Logger lokationsdata for fejlsøgning.

            // Tjekker om nødvendige geolokationsdata er tilgængelige.
            if (locationData.latitude == null || locationData.longitude == null) {
                alert('Geolocation data is missing.'); // Viser en fejlmeddelelse hvis geolokationsdata mangler.
                return;
            }

            try {
                // Sender en GET-request for at hente detaljer om ingrediensen baseret på navn.
                const detailsResponse = await fetch(`/ingredient/ingredientDetails?IngredientName=${encodeURIComponent(ingredientName)}`, {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json'}
                });

                // Tjekker svarstatus og kaster en fejl hvis anmodningen fejlede.
                if (!detailsResponse.ok) {
                    throw new Error('Failed to fetch ingredient details: ' + await detailsResponse.text());
                }

                const details = await detailsResponse.json(); // Konverterer svaret til JSON.
                const scalingFactor = weight / 100; // Skalering baseret på vægt (næringsoplysninger er per 100 gram).

                // Forbereder data til at sende i POST-request.
                const bodyData = {
                    IngredientName: ingredientName,
                    Quantity: weight,
                    IntakeDateTime: time,
                    Protein: (details.Protein * scalingFactor).toFixed(2),
                    Fat: (details.Fat * scalingFactor).toFixed(2),
                    Fibers: (details.Fiber * scalingFactor).toFixed(2),
                    Calories: (details.Calories * scalingFactor).toFixed(2),
                    Latitude: locationData.latitude,
                    Longitude: locationData.longitude
                };

                // Sender en POST-request for at registrere ingrediensindtaget.
                const registerResponse = await fetch('/ingredient/registerIngredient', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(bodyData)
                });

                // Håndterer svaret og viser en succesmeddelelse eller kaster en fejl.
                if (!registerResponse.ok) {
                    throw new Error('Failed to register intake: ' + await registerResponse.text());
                }

                const registerResult = await registerResponse.json();
                alert('Intake registered successfully!'); // Viser en succesmeddelelse til brugeren.
                console.log(registerResult);

                // Opdaterer session storage og brugergrænsefladen.
                updateUI(bodyData);
            } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message); // Viser en fejlmeddelelse hvis en fejl opstår.
            }
        });
    });
});

// Funktion til at opdatere brugergrænsefladen og gemme data i session storage.
function updateUI(data) {
    let intakes = JSON.parse(sessionStorage.getItem('intakes')) || []; // Henter eksisterende indtag fra session storage eller starter med et tomt array.
    intakes.push({
        type: 'ingredient',
        ingredientName: data.IngredientName,
        quantity: data.Quantity,
        intakeTime: data.IntakeDateTime,
        protein: data.Protein,
        fat: data.Fat,
        fibers: data.Fibers,
        calories: data.Calories,
        latitude: data.Latitude,
        longitude: data.Longitude
    });
    sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer den opdaterede liste tilbage i session storage.
    opdaterIndtag(); // Sikrer at denne funktion er korrekt defineret for at opfriske de viste indtag.
}




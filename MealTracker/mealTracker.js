// Funktion til at nulstille indtag i session-lageret
function clearIntakes() {
    sessionStorage.setItem('intakes', JSON.stringify([])); // Gemmer et tomt array som 'intakes'
}

// Hovedfunktion, der udføres, når dokumentet er fuldt indlæst
document.addEventListener('DOMContentLoaded', async function() {
    checkUserAuthentication(); // Tjekker om brugeren er autentificeret
    console.log("Current UserId in storage:", sessionStorage.getItem('UserId')); // Logger brugerens ID fra session-lageret
    await indlæsMåltider(); // Asynkron indlæsning af måltider fra serveren
    clearIntakes(); // Nulstiller indtagene før nye data hentes
    initializeDateTimeFields();
    // Henter måltider, vand- og ingrediensindtag parallelt
    await Promise.all([fetchMeals(), fetchWaterIntakes(), fetchIngredientIntakes()]);
    opdaterIndtag(); // Opdaterer visning af indtag
});

// Kontrollerer om brugeren er logget ind ved at tjekke for 'UserId' i session-lageret
function checkUserAuthentication() {
    const userId = sessionStorage.getItem('UserId');
    if (!userId) {
        window.location.href = '/login.html'; // Omdirigerer til login-side hvis ikke logget ind
    }
    // Her kan en server-side verifikation tilføjes om nødvendigt
}

// Funktion til at initialisere dato- og tidsfelter på websiden
function initializeDateTimeFields() {
    // Finder alle inputfelter af typen 'datetime-local' i dokumentet
    const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    // Opretter et nyt Date-objekt, der repræsenterer det nuværende tidspunkt
    const now = new Date();
    // Beregner tidszonen forskel i millisekunder
    const timeZoneOffset = now.getTimezoneOffset() * 60000; // Konverterer offset til millisekunder
    // Justerer den nuværende tid til lokal tid og konverterer til ISO-format, trimmer til dato og tid (uden sekunder)
    const localISOTime = new Date(now - timeZoneOffset).toISOString().slice(0, 16); // Justerer for tidszone
    
    // Løber igennem hver dato- og tidsinput og sætter dens værdi til den justerede lokale ISO-tid
    dateTimeInputs.forEach(input => {
        input.value = localISOTime;
    });
}

// Henter måltidsindtag fra serveren
function fetchMeals() {
    fetch('/intakes/mealIntakes', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
    })
    .then(response => response.json())
    .then(meals => {
        let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
        meals.forEach(meal => {
            intakes.push({
                intakeId: meal.IntakeID,
                type: 'meal',
                mealName: meal.MealName,
                portionWeight: meal.MealWeight,
                kcal: meal.Calories,
                protein: meal.Protein,
                fat: meal.Fat,
                fibers: meal.Fibers,
                consumptionTime: meal.ConsumptionTime,
                latitude: meal.Latitude,
                longitude: meal.Longitude
            });
        });
        sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Opdaterer intakes i session-lageret
        opdaterIndtag(); // Opdaterer visningen efter hentning af data
    })
    .catch(error => console.error('Failed to load meals:', error)); // Fejlhåndtering ved indlæsningsfejl
}

// Henter vandindtag fra serveren
function fetchWaterIntakes() {
    fetch('/water/waterIntakes', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
    })
    .then(response => response.json())
    .then(waters => {
        let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
        waters.forEach(water => {
            intakes.push({
                waterintakeId: water.WaterIntakeID,
                type: 'water',
                liquidAmount: water.Liter,
                consumptionTime: water.WaterDateTime,
                kcal: 0, // Vand har typisk ingen kalorier
                protein: 0,
                fat: 0,
                fibers: 0,
                latitude: water.Latitude,
                longitude: water.Longitude
            });
        });
        sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Opdaterer intakes i session-lageret
        opdaterIndtag(); // Opdaterer visningen efter hentning af data
    })
    .catch(error => console.error('Failed to load water intakes:', error)); // Fejlhåndtering ved indlæsningsfejl
}

// Henter indtag af ingredienser fra serveren
function fetchIngredientIntakes() {
    fetch('/ingredient/ingredientIntakes', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
    })
    .then(response => response.json())
    .then(ingredients => {
        let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
        ingredients.forEach(ingredient => {
            intakes.push({
                intakeId: ingredient.IntakeID,
                type: 'ingredient',
                ingredientName: ingredient.IngredientName,
                quantity: ingredient.Quantity,
                intakeTime: ingredient.IntakeDateTime,
                protein: ingredient.Protein,
                fat: ingredient.Fat,
                fibers: ingredient.Fibers,
                calories: ingredient.Calories,
                latitude: ingredient.Latitude,
                longitude: ingredient.Longitude
            });
        });
        sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Opdaterer intakes i session-lageret
        opdaterIndtag(); // Opdaterer visningen efter hentning af data
    })
    .catch(error => console.error('Failed to load ingredient intakes:', error)); // Fejlhåndtering ved indlæsningsfejl
}

// Funktion til at hente geolokationsdata
function getGeolocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                console.error('Error getting location:', error);
                alert('Unable to retrieve your location');
                callback({
                    latitude: null,
                    longitude: null
                });
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
        callback({
            latitude: null,
            longitude: null
        });
    }
}

// Asynkron funktion til at indlæse måltider fra serveren
function indlæsMåltider() {
    fetch('/saveMeals/save', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch meals: ${response.status}`);
        }
        return response.json();
    })
    .then(meals => {
        sessionStorage.setItem('meals', JSON.stringify(meals)); // Gemmer hentede måltider i session-lageret
        const valgteMåltider = document.getElementById('valgAfMåltid');
        if (!valgteMåltider) {
            throw new Error("Element 'valgAfMåltid' was not found on the page");
        }
        valgteMåltider.innerHTML = ''; // Nulstiller elementets indhold
        meals.forEach(meal => {
            const option = document.createElement('option');
            option.value = meal.MealID;
            option.textContent = meal.MealName;
            valgteMåltider.appendChild(option); // Tilføjer hvert måltid som en mulighed i dropdown-menuen
        });
    })
    .catch(error => {
        console.error('Error loading meals:', error); // Fejlhåndtering ved indlæsningsfejl
    });
}

// Funktion til at opdatere visningen af måltidsindtag
function opdaterMåltidsIndtag() {
    const mealSelect = document.getElementById('valgAfMåltid');
    if (!mealSelect) {
        console.error("Meal select dropdown not found.");
        return;
    }

    const mealNameSelected = mealSelect.options[mealSelect.selectedIndex].text;
    const userId = sessionStorage.getItem('UserId');
    const portionWeightInput = document.getElementById('portionWeight');
    if (!portionWeightInput) {
        console.error("portionWeight input not found.");
        alert("Meal weight input field missing on the page.");
        return;
    }

    const portionWeight = parseFloat(portionWeightInput.value);
    if (isNaN(portionWeight) || portionWeight <= 0) {
        alert("Please enter a valid weight for the meal.");
        return;
    }

    const consumptionTimeInput = document.getElementById('consumptionTime');
    if (!consumptionTimeInput) {
        console.error("Consumption time input not found.");
        alert("Consumption time input field missing on the page.");
        return;
    }
    const consumptionTime = consumptionTimeInput.value;
    const meals = JSON.parse(sessionStorage.getItem('meals')) || [];
    const mealInfo = meals.find(meal => meal.MealName === mealNameSelected);

    if (!mealInfo) {
        console.error("Meal information not found for:", mealNameSelected);
        alert("Selected meal information not found. Please check the meal selection.");
        return;
    }

    // Henter geolokationsdata og optager derefter indtaget
    getGeolocation(locationData => {
        console.log("Retrieved location data:", locationData);  // Debugging af hentning af geolokationsdata
        if (locationData.latitude && locationData.longitude) {
            const intakeDetails = {
                UserId: parseInt(userId, 10),
                MealID: mealInfo.MealID,
                MealName: mealInfo.MealName,
                MealWeight: portionWeight,
                ConsumptionTime: consumptionTime,
                Calories: mealInfo.totalKcal * (portionWeight / 100),
                Protein: mealInfo.totalProtein * (portionWeight / 100),
                Fat: mealInfo.totalFat * (portionWeight / 100),
                Fibers: mealInfo.totalFibers * (portionWeight / 100),
                Latitude: locationData.latitude,
                Longitude: locationData.longitude
            };

            // Sender data til serveren
            fetch('/intakes/record', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(intakeDetails),
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to record meal intake: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log('Intake recorded successfully:', result);
                alert('Meal intake recorded successfully.');
                let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
                const mealData = {
                    type: 'meal',
                    mealName: mealNameSelected,
                    portionWeight: result.mealIntake.MealWeight,
                    kcal: result.mealIntake.Calories,
                    protein: result.mealIntake.Protein,
                    fat: result.mealIntake.Fat,
                    fibers: result.mealIntake.Fibers,
                    consumptionTime: result.mealIntake.ConsumptionTime,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                };
                intakes.push(mealData);
                sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer opdateret liste af indtag
                opdaterIndtag(); // Opdaterer visningen
            })
            .catch(error => {
                console.error('Error recording meal intake:', error);
                alert('Error recording meal intake: ' + error.message);
            });
        } else {
            alert('Geolocation data is missing.');
        }
    });
}

function opdaterVæskeIndtag() {
    let liquidAmount = document.getElementById('liquidAmount').value;
    let liquidIntakeTime = document.getElementById('liquidIntakeTime').value;

    // Validerer mængden af væske
    let parsedLiquidAmount = parseFloat(liquidAmount);
    if (isNaN(parsedLiquidAmount) || parsedLiquidAmount <= 0) {
        alert('Please enter a valid amount of water in liters.');
        return;
    }

    // Henter geolokationsdata og sender indtagsdetaljer
    getGeolocation(locationData => {
        if (locationData.latitude && locationData.longitude) {
            let intakeDetails = {
                UserId: sessionStorage.getItem('UserId'),
                WaterDateTime: liquidIntakeTime,
                Liter: parsedLiquidAmount,
                Latitude: locationData.latitude,
                Longitude: locationData.longitude
            };

            fetch('/water/addWater', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(intakeDetails),
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to register water intake: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Water intake registered successfully:', data);
                alert('Water intake registered successfully.');
                let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
                intakes.push({
                    type: 'water',
                    liquidAmount: parsedLiquidAmount.toFixed(2),
                    consumptionTime: liquidIntakeTime,
                    kcal: 0, // Vand har ingen kalorier
                    protein: 0,
                    fat: 0,
                    fibers: 0,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                });
                sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer opdateret liste af indtag
                opdaterIndtag(); // Opdaterer visningen
            })
            .catch(error => {
                console.error('Error registering water intake:', error);
                alert('Error registering water intake: ' + error.message);
            });
        } else {
            alert('Geolocation data is missing.');
        }
    });
}

// Gemmer indtag
function gemIndtag(intake) {
    let intakes = JSON.parse(sessionStorage.getItem('intakes')) || []; // Henter eksisterende indtag
    intakes.push(intake); // Tilføjer de nye indtag
    sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer indtag i lokal storage
}

// Funktion til at formatere datoer til dansk format med tid
function formatDate(dateString) {
    const date = new Date(dateString);
    // Returnerer datoen i formatet DD-MM-ÅÅÅÅ HH:MM
    return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Funktion til at opdatere og vise indtag i brugergrænsefladen
function opdaterIndtag() {
    // Henter den gemte liste af indtag fra session storage
    let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
    // Finder elementet, hvor indtag skal vises
    let intakeDisplay = document.getElementById('intakeDisplay');
    // Nulstiller indholdet i display-elementet før ny visning
    intakeDisplay.innerHTML = '';

    // Går igennem hvert indtag i listen
    intakes.forEach((intake, index) => {
        if (!intake) {
            console.error('Invalid intake data:', intake);
            return; // Hvis data ikke er gyldige, springes dette indtag over
        }

        // Forbereder variabler til beskrivelse og detaljer
        let description, details, locationInfo = '';

        // Formatterer geolokationsinformation, hvis den er tilgængelig
        if (typeof intake.latitude === 'number' && typeof intake.longitude === 'number') {
            locationInfo = `Location: ${intake.latitude.toFixed(6)}, ${intake.longitude.toFixed(6)}`;
        } else {
            locationInfo = "Location: Not available";
        }

       // Skifter mellem forskellige typer af indtag
       switch (intake.type) {
        case 'meal':
            description = `<ul class="intakeDescription">
                               <li class="intakeDetail">${intake.mealName} ${intake.portionWeight}g</li>
                               <li class="intakeDetail">Date: ${formatDate(intake.consumptionTime)}</li>
                               <li class="intakeDetail">${locationInfo}</li>
                           </ul>`;
            details = `<div class="infoBox kcal">${intake.kcal} kcal</div>
                       <div class="infoBox protein">${intake.protein} g protein</div>
                       <div class="infoBox fat">${intake.fat} g fedt</div>
                       <div class="infoBox fibers">${intake.fibers} g fibre</div>`;
            break;
        case 'water':
            description = `<ul class="intakeDescription">
                               <li class="intakeDetail">Water: ${intake.liquidAmount} liters</li>
                               <li class="intakeDetail">Date: ${formatDate(intake.consumptionTime)}</li>
                               <li class="intakeDetail">${locationInfo}</li>
                           </ul>`;
            details = `<div class="infoBox kcal">0 kcal</div>
                       <div class="infoBox protein">0 g protein</div>
                       <div class="infoBox fat">0 g fedt</div>
                       <div class="infoBox fibers">0 g fibre</div>`;
            break;
        case 'ingredient':
            description = `<ul class="intakeDescription">
                               <li class="intakeDetail">${intake.ingredientName}, ${intake.quantity}g</li>
                               <li class="intakeDetail">Date: ${formatDate(intake.intakeTime)}</li>
                               <li class="intakeDetail">${locationInfo}</li>
                           </ul>`;
            details = `<div class="infoBox kcal">${intake.calories} kcal</div>
                       <div class="infoBox protein">${intake.protein} g protein</div>
                       <div class="infoBox fat">${intake.fat} g fedt</div>
                       <div class="infoBox fibers">${intake.fibers} g fibre</div>`;
            break;
    }

        // Opretter et nyt DIV-element til at vise indtaget
        let indtagsDiv = document.createElement('div');
        indtagsDiv.innerHTML = `
            <div class="intakeRow">
                <span class="intake-description">${description}</span>
                <div class="infoBoxContainer">${details}</div>
                <div class="intake-actions">
                    <button class="iconButton edit" onclick="redigerIndtag(${index})">✏️</button>
                    <button class="iconButton delete" onclick="sletIndtag(${index})">🗑️</button>
                </div>
            </div>
        `;
        // Tilføjer det nye element til visningen
        intakeDisplay.appendChild(indtagsDiv);
    });
}

// Sletter et indtag baseret på index
function sletIndtag(index) {
    let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
    if (index >= 0 && index < intakes.length) {
        const intake = intakes[index];
        let url;
        // Sætter den korrekte URL baseret på typen af indtag
        switch (intake.type) {
            case 'meal':
                url = `/intakes/delete/${intake.intakeId}`; // Endpoint til sletning af måltider
                break;
            case 'water':
                url = `/water/deleteWater/${intake.waterintakeId}`; // Endpoint til sletning af vandindtag
                break;
            case 'ingredient':
                url = `/ingredient/deleteIngredient/${intake.intakeId}`; // Endpoint til sletning af ingredienser
                break;
            default:
                console.error("Invalid intake type for deletion.");
                return;
        }

        // Udfører sletningsoperationen
        fetch(url, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include' // Antager session-baseret autentifikation
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete intake: ${response.statusText}`);
            }
            return response.json();
        })
        .then(() => {
            alert('Intake deleted successfully.');
            // Fjerner indtaget fra arrayet og opdaterer sessionStorage
            intakes.splice(index, 1);
            sessionStorage.setItem('intakes', JSON.stringify(intakes));
            opdaterIndtag(); // Opdaterer visningen
        })
        .catch(error => {
            console.error('Error deleting intake:', error);
            alert('Error deleting intake: ' + error.message);
        });
    } else {
        alert("Invalid index. No intake found to delete.");
    }
}

// Redigerer et indtag baseret på index
function redigerIndtag(index) {
    let intakes = JSON.parse(sessionStorage.getItem('intakes')) || [];
    if (index >= 0 && index < intakes.length) {
        let intake = intakes[index];

        switch (intake.type) {
            case 'meal':
                editMealIntake(index, intake, intakes);
                break;
            case 'water':
                editWaterIntake(index, intake, intakes);
                break;
            case 'ingredient':
                editIngredientIntake(index, intake, intakes);
                break;
            default:
                alert("Invalid intake type for editing.");
                break;
        }

        // Gemmer de opdaterede indtag i session-lageret og opdaterer brugergrænsefladen
        sessionStorage.setItem('intakes', JSON.stringify(intakes));
        opdaterIndtag();
    } else {
        alert("Invalid index for editing.");
    }
}

// Håndterer redigering af måltidsindtag
function editMealIntake(index, intake, intakes) {
    let newMealName = prompt("Enter new meal name:", intake.mealName);
    let newMealWeight = parseFloat(prompt("Enter new meal weight (in grams):", intake.portionWeight));
    let newConsumptionTime = prompt("Enter new consumption time (YYYY-MM-DDTHH:MM):", intake.consumptionTime);

    if (newMealName && newMealWeight && !isNaN(newMealWeight) && newMealWeight > 0 && newConsumptionTime) {
        let updatedMeal = {
            MealName: newMealName,
            MealWeight: newMealWeight,
            ConsumptionTime: newConsumptionTime
        };

        fetch(`/intakes/update/${intake.intakeId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedMeal),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update meal intake: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Meal intake updated successfully.');
            intakes[index] = {
                ...intake,
                mealName: newMealName,
                portionWeight: newMealWeight,
                consumptionTime: newConsumptionTime
            };
            sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer opdateret liste af indtag
            opdaterIndtag(); // Opdaterer visningen
        })
        .catch(error => {
            console.error('Error updating meal intake:', error);
            alert('Error updating meal intake: ' + error.message);
        });
    } else {
        alert("Invalid input for meal details.");
    }
}

// Håndterer redigering af vandindtag
function editWaterIntake(index, intake, intakes) {
    let newLiquidAmount = parseFloat(prompt("Enter new water amount (in liters):", intake.liquidAmount));
    let newWaterDateTime = prompt("Enter new water date time (YYYY-MM-DDTHH:MM):", intake.consumptionTime);

    if (!isNaN(newLiquidAmount) && newLiquidAmount > 0 && newWaterDateTime) {
        fetch(`/water/updateWater/${intake.waterintakeId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                Liter: newLiquidAmount,
                WaterDateTime: newWaterDateTime
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update water intake: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Water intake updated successfully.');
            intakes[index] = {
                ...intake,
                liquidAmount: newLiquidAmount,
                consumptionTime: newWaterDateTime
            };
            sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer opdateret liste af indtag
            opdaterIndtag(); // Opdaterer visningen
        })
        .catch(error => {
            console.error('Error updating water intake:', error);
            alert('Error updating water intake: ' + error.message);
        });
    } else {
        alert("Invalid input for water details.");
    }
}

// Håndterer redigering af ingrediensindtag
function editIngredientIntake(index, intake, intakes) {
    let newIngredientName = prompt("Enter new ingredient name:", intake.ingredientName);
    let newQuantity = parseFloat(prompt("Enter new quantity (in grams):", intake.quantity));
    let newIntakeDateTime = prompt("Enter new intake time (YYYY-MM-DDTHH:MM):", intake.intakeTime);

    if (!isNaN(newQuantity) && newQuantity > 0 && newIntakeDateTime && newIngredientName) {
        fetch(`/ingredient/updateIngredient/${intake.intakeId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                Quantity: newQuantity,
                IntakeDateTime: newIntakeDateTime,
                IngredientName: newIngredientName
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update ingredient intake: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Ingredient intake updated successfully.');
            intakes[index] = {
                ...intake,
                ingredientName: newIngredientName,
                quantity: newQuantity,
                intakeTime: newIntakeDateTime
            };
            sessionStorage.setItem('intakes', JSON.stringify(intakes)); // Gemmer opdateret liste af indtag
            opdaterIndtag(); // Opdaterer visningen
        })
        .catch(error => {
            console.error('Error updating ingredient intake:', error);
            alert('Error updating ingredient intake: ' + error.message);
        });
    } else {
        alert("Invalid input for ingredient name, quantity, or time.");
    }

// Gemmer den opdaterede liste af indtag i lokal storage
sessionStorage.setItem('intakes', JSON.stringify(intakes));

// Opdaterer visningen af indtag på brugergrænsefladen
opdaterIndtag();
}

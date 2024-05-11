// Tilføjer en event listener til DOMContentLoaded for at sikre, at handlinger initialiseres, når dokumentet er indlæst.
document.addEventListener('DOMContentLoaded', function() {
  fetchMealsAndUpdateUI(); // Henter måltider fra serveren og opdaterer brugergrænsefladen.
  checkUserAuthentication(); // Kontrollerer brugerens autentifikation.

  // Tilknytter en event listener til 'tilføjIngrediens' knappen
  let addButton = document.getElementById('tilføjIngrediens');
  if (addButton) {
      addButton.addEventListener('click', tilføjIngrediens); // Hvis knappen findes, tilføjes klik-event til at tilføje en ingrediens.
  }

  // Tilknytter event listener til formularen for måltidsoprettelse
  const form = document.getElementById('mealCreatorFunktioner2'); // Sørg for, at dette ID stemmer overens med din forms ID.
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Forhindrer standard form indsendelse.
      opretMåltid(); // Kalder funktionen for at oprette et måltid.
    });
  }
});

// Funktion til at kontrollere brugerens autentifikation.
function checkUserAuthentication() {
  const userId = sessionStorage.getItem('UserId'); // Henter UserId fra sessionStorage.
  if (!userId) {
      window.location.href = '/login.html'; // Omdirigerer til login siden, hvis brugeren ikke er logget ind.
  }
}

// Funktion til at hente måltider fra serveren og opdatere UI.
function fetchMealsAndUpdateUI() {
  fetch('/saveMeals/save', { method: 'GET' })  // Kontroller, at endpointet er korrekt.
  .then(response => {
      if (response.ok) return response.json(); // Hvis forespørgslen lykkes, parse responsen som JSON.
      throw new Error('Failed to fetch meals'); // Kaster en fejl, hvis forespørgslen mislykkes.
  })
  .then(fetchedMeals => {
      meals = fetchedMeals; // Gemmer hentede måltider i den globale array.
      updateMealsDisplay(meals); // Opdaterer visningen af måltider.
  })
  .catch(error => {
      console.error('Error fetching meals:', error); // Logger en fejl, hvis der opstår en fejl.
  });
}

// Funktion til at opdatere visningen af måltider i brugergrænsefladen.
function updateMealsDisplay(meals) {
  const måltidsListe = document.getElementById('måltidsListe');
  måltidsListe.innerHTML = ''; // Clears the content of the meal list

  meals.forEach((meal) => {
    const mealDiv = document.createElement('div'); // Creates a new div element for each meal
    mealDiv.className = 'oprettedeMåltider'; // Adds a class to the div element

    // Adding buttons aligned to the right of the bullet points
    mealDiv.innerHTML = `
      <ul>
        <li>${meal.MealName}</li>
        <li>Total Kalorier: ${meal.totalKcal}</li>
      </ul>
      <div class="mealActions">
        <button class="buttonDelete" onclick="sletMåltid(${meal.MealID})">🗑️</button>
        <button class="buttonOverview" onclick="oversigtIngredienser(${meal.MealID})">📖</button>
      </div>
    `;
    måltidsListe.appendChild(mealDiv); // Appends the new div element to the meal list
  });
}

// Vi opretter arrays for at holde styr på ingredienser og måltider, samt en variabel for redigering af et måltid.
let måltidsIngredienser = [];
let meals = [];

// Funktion til at tilføje en ingrediens.
function tilføjIngrediens() {
  let ingrediensNavn = prompt("Hvilken ingrediens vil du tilføje?"); // Viser en prompt til brugeren for at indtaste navnet på en ingrediens.
  if (!ingrediensNavn) return;  // Afslutter funktionen, hvis der ikke indtastes noget.

  fetch(`/search?productName=${encodeURIComponent(ingrediensNavn)}`) // Udfører en GET-forespørgsel til serveren med produktets navn.
      .then(response => {
          if (!response.ok) throw new Error('Failed to fetch ingredients'); // Kaster en fejl, hvis forespørgslen mislykkes.
          return response.json(); // Parser responsen som JSON.
      })
      .then(data => {
          if (data.length > 0) {
              const ingrediensOplysninger = data[0]; // Henter de første oplysninger om ingrediensen.
              console.log('Received ingredient information:', ingrediensOplysninger); // Logger oplysningerne til konsollen.
              let weight = prompt("Indtast vægten i gram for ingrediensen:"); // Prompter brugeren til at indtaste vægten for ingrediensen.
              weight = parseFloat(weight); // Konverterer vægten til et tal.
              if (!isNaN(weight) && weight > 0) {
                  // Tilføjer vægten til ingrediensens oplysninger.
                  ingrediensOplysninger.weight = weight;
                  hentOplysninger(ingrediensOplysninger.foodID, weight); // Henter yderligere oplysninger baseret på ingrediensens ID og vægt.
                  opdaterIngrediensListe(ingrediensOplysninger); // Opdaterer listen over ingredienser med de nye oplysninger.
              } else {
                  alert("Indtastet vægt er ikke gyldig. Prøv igen."); // Viser en fejlmeddelelse, hvis vægten er ugyldig.
              }
          } else {
              alert("Ingen ingredienser fundet med det navn."); // Viser en fejlmeddelelse, hvis der ikke findes nogen ingredienser med det angivne navn.
          }
      })
      .catch(error => {
          console.error('Error retrieving the ingredient:', error); // Logger en fejl, hvis der opstår en fejl under hentningen.
          alert("Fejl ved hentning af ingrediensen."); // Viser en fejlmeddelelse til brugeren.
      });
}

// Funktion til at opdatere listen over ingredienser i brugergrænsefladen.
function opdaterIngrediensListe(ingrediensOplysninger) {
  const ingrediensContainer = document.getElementById('ingrediensContainer'); // Henter containeren for ingredienser.
  const ingrediensDiv = document.createElement('div'); // Opretter et nyt div-element.
  ingrediensDiv.textContent = `${ingrediensOplysninger.foodName} - `; // Tilføjer navnet på ingrediensen til div-elementet.
  ingrediensContainer.appendChild(ingrediensDiv); // Tilføjer det nye div-element til containeren.
  
  måltidsIngredienser.push(ingrediensOplysninger); // Tilføjer den nye ingrediens til den lokale liste.
  
  // Opdaterer sessionStorage med den opdaterede liste.
  sessionStorage.setItem('måltidsIngredienser', JSON.stringify(måltidsIngredienser));
}

// Funktion til at hente nøgleværdien for sorteringsparametre baseret på et givet nøgletal.
function getSortKeyName(sortKey) {
  switch(sortKey) {
    case 1030: return 'Kcal';
    case 1110: return 'Protein';
    case 1310: return 'Fat';
    case 1240: return 'Fibers';
    case 1010: return 'kJ';   
    case 1210: return 'Kulhydrat';   
    case 1610: return 'Tørstof';
    case 1620: return 'Vand'; 
    default: return 'Unknown'; // Returnerer 'Unknown' hvis nøgletallet ikke genkendes.
  }
}

// Funktion til at hente yderligere ernæringsoplysninger for en ingrediens baseret på dens ID og vægt.
function hentOplysninger(itemID, weight) {
  const sortKeys = [1030, 1110, 1310, 1240, 1010, 1210, 1610, 1620]; // Liste over nøgletal for ernæringsoplysninger.
  sortKeys.forEach(sortKey => {
    fetch(`/foodCompSpecs?itemID=${encodeURIComponent(itemID)}&sortKey=${encodeURIComponent(sortKey)}`) // Udfører en GET-forespørgsel til serveren med itemID og sortKey.
      .then(response => response.json()) // Parser responsen som JSON.
      .then(data => {
        if (data && data.length > 0) {
          const nutrient = parseFloat(data[0].resVal); // Parser næringsværdien som et tal.
          const nutrientName = getSortKeyName(sortKey); // Henter navnet på næringsstoffet baseret på nøgletallet.
          const adjustedNutrientValue = (nutrient / 100) * weight; // Justerer næringsværdien baseret på vægten.
          opdaterIngrediensNæring(itemID, nutrientName, adjustedNutrientValue); // Opdaterer ernæringsoplysningerne for ingrediensen.
        }
      })
      .catch(error => {
        console.error('An error occurred:', error); // Logger en fejl, hvis der opstår en fejl.
      });
  });
}

// Funktion til at opdatere ernæringsoplysningerne for en ingrediens i den lokale datastruktur.
function opdaterIngrediensNæring(itemID, nutrientName, nutrient) {
  let ingrediensIndex = måltidsIngredienser.findIndex(ing => ing.foodID === itemID); // Finder indexet for ingrediensen i listen.
  if (ingrediensIndex !== -1) {
      // Tjekker, om objektet for næringsstoffer eksisterer, hvis ikke, initialiserer det.
      if (!måltidsIngredienser[ingrediensIndex].nutrients) {
          måltidsIngredienser[ingrediensIndex].nutrients = {};
      }
      måltidsIngredienser[ingrediensIndex].nutrients[nutrientName] = nutrient; // Tilføjer eller opdaterer næringsstoffet i objektet.
      opdaterIngrediensVisning(ingrediensIndex); // Opdaterer visningen af ingrediensen i brugergrænsefladen.
  }
}

// Funktion til at opdatere visningen af en ingrediens i brugergrænsefladen.
function opdaterIngrediensVisning(index) {
  const ingrediensContainer = document.getElementById('ingrediensContainer'); // Henter containeren for ingredienser.
  const ingrediensDivs = ingrediensContainer.getElementsByTagName('div'); // Henter alle div-elementer i containeren.
  if (ingrediensDivs[index]) {
    const ingredient = måltidsIngredienser[index]; // Henter ingrediensen fra listen baseret på index.
    let nutrientString = `${ingredient.foodName} - `; // Starter strengen med navnet på ingrediensen.
    if (ingredient.nutrients) {
      nutrientString += `Kcal: ${ingredient.nutrients.Kcal || '0'}, `; // Tilføjer kalorieindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Protein: ${ingredient.nutrients.Protein || '0'}, `; // Tilføjer proteinindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Fat: ${ingredient.nutrients.Fat || '0'}, `; // Tilføjer fedtindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Fibers: ${ingredient.nutrients.Fibers || '0'}, `; // Tilføjer fiberindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `kJ: ${ingredient.nutrients.kJ || '0'}, `; // Tilføjer energiindholdet i kJ til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Kulhydrat: ${ingredient.nutrients.Kulhydrat || '0'}, `; // Tilføjer kulhydratindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Tørstof: ${ingredient.nutrients.Tørstof || '0'}, `; // Tilføjer tørstofindholdet til strengen, eller '0' hvis det ikke findes.
      nutrientString += `Vand: ${ingredient.nutrients.Vand || '0'}, `; // Tilføjer vandindholdet til strengen, eller '0' hvis det ikke findes.
    } else {
      nutrientString += 'No nutritional data available'; // Tilføjer en tekst, hvis der ikke findes ernæringsdata.
    }
    ingrediensDivs[index].textContent = nutrientString; // Opdaterer teksten i det tilsvarende div-element med den fulde streng.
  }
}

// Funktion til at nulstille listen over ingredienser både visuelt og i den lokale datastruktur.
function nulstilIngredienser() {
  // Tømmer den visuelle liste over ingredienser
  const ingrediensContainer = document.getElementById('ingrediensContainer'); // Henter containeren for ingredienser.
  ingrediensContainer.innerHTML = ''; // Tømmer indholdet i containeren.

  // Tømmer den lokale datastruktur
  måltidsIngredienser = []; // Nulstiller listen over ingredienser.

  // Fjerner ingredienser fra sessionStorage
  sessionStorage.removeItem('måltidsIngredienser'); // Fjerner den gemte liste fra sessionStorage.
}

// Funktion til at oprette et nyt måltid.
function opretMåltid() {
  let UserId = sessionStorage.getItem('UserId'); // Henter UserId fra sessionStorage.
  let MealName = document.getElementById('MealName').value; // Henter værdien af måltidsnavnet fra inputfeltet.
  let totalKcal = måltidsIngredienser.reduce((sum, ingredient) => sum + (ingredient.nutrients['Kcal'] || 0), 0); // Beregner den samlede mængde kalorier.
  let totalProtein = måltidsIngredienser.reduce((sum, ingredient) => sum + (ingredient.nutrients['Protein'] || 0), 0); // Beregner den samlede mængde protein.
  let totalFat = måltidsIngredienser.reduce((sum, ingredient) => sum + (ingredient.nutrients['Fat'] || 0), 0); // Beregner den samlede mængde fedt.
  let totalFibers = måltidsIngredienser.reduce((sum, ingredient) => sum + (ingredient.nutrients['Fibers'] || 0), 0); // Beregner den samlede mængde fibre.
  let totalkJ = måltidsIngredienser.reduce((sum, ingredient) => sum + (ingredient.nutrients['kJ'] || 0), 0); // Beregner den samlede mængde energi i kJ.
  
  // Udtrækker både navne på ingredienser og deres respektive vægte
  let Ingredients = måltidsIngredienser.map(ingredient => ({
    name: ingredient.foodName,
    weight: ingredient.weight
  }));
  

  let måltidsData = {
    UserId: UserId, // Brugerens ID
    MealName: MealName, // Navnet på måltidet
    Ingredients: JSON.stringify(Ingredients), // Gemmer ingredienser som en JSON-streng
    totalKcal: totalKcal, // Den samlede mængde kalorier
    totalProtein: totalProtein, // Den samlede mængde protein
    totalFat: totalFat, // Den samlede mængde fedt
    totalFibers: totalFibers, // Den samlede mængde fibre
    totalkJ: totalkJ // Den samlede mængde energi i kJ
  };

  fetch('/meals/create', {
    method: 'POST', // Specificerer HTTP-metoden som 'POST'.
    headers: { 'Content-Type': 'application/json' }, // Angiver indholdstypen for anmodningen.
    body: JSON.stringify(måltidsData) // Sender måltidsdataene som en JSON-streng.
  })
  .then(response => {
    if (response.ok) return response.json(); // Hvis forespørgslen lykkes, parse responsen som JSON.
    throw new Error('Failed to save meal'); // Kaster en fejl, hvis forespørgslen mislykkes.
  })
  .then(data => {
    console.log('Meal saved:', data); // Logger beskeden til konsollen, når måltidet er gemt.
    fetchMealsAndUpdateUI(); // Genindlæser alle måltider for at opdatere listen.
    nulstilIngredienser();  // Nulstiller ingredienslisten efter måltidet er oprettet.
  })
  .catch(error => {
    console.error('Error saving the meal:', error); // Logger en fejl, hvis der opstår en fejl under gemningen.
  });
}

// Funktion til at slette et måltid.
function sletMåltid(mealId) {
  fetch(`/meals/delete/${mealId}`, {
      method: 'DELETE' // Specificerer HTTP-metoden som 'DELETE'.
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to delete meal'); // Kaster en fejl, hvis forespørgslen mislykkes.
      }
      return response.text(); // eller response.json(), hvis din server sender JSON.
  })
  .then(() => {
      console.log('Meal deleted successfully'); // Logger beskeden til konsollen, når måltidet er slettet succesfuldt.
      fetchMealsAndUpdateUI(); // Genhenter måltider for at opdatere listen.
  })
  .catch(error => {
      console.error('Error deleting the meal:', error); // Logger en fejl, hvis der opstår en fejl under sletningen.
  });
}

// Funktion til at vise en oversigt over ingredienser for et bestemt måltid.
function oversigtIngredienser(mealId) {
  // Finder måltidet ved hjælp af ID
  const meal = meals.find(meal => meal.MealID === mealId);
  if (!meal) {
    alert("Meal data not found!"); // Viser en fejlmeddelelse, hvis måltidsdata ikke findes.
    return;
  }

  // Parser ingrediensernes JSON for at oprette en læsbar liste over ingredienser med deres vægte
  let ingredientsDetail = meal.Ingredients ? JSON.parse(meal.Ingredients).map(ing => `${ing.name} (${ing.weight}g)`).join(', ') : 'No ingredients listed'; // Tjekker, om der er angivet ingredienser, og opretter en streng med detaljer.

  // Forbereder teksten med ernæringsdetaljer til visning i en advarsel
  let nutrientDetails = `Total Kalorier: ${meal.totalKcal || 0}, Total Protein: ${meal.totalProtein || 0}, Total Fedt: ${meal.totalFat || 0}, Total Fibre: ${meal.totalFibers || 0}`; // Opretter en streng med ernæringsoplysninger for måltidet.

  // Viser alle måltidsoplysninger i en advarsel
  alert(`${meal.MealName}:\n${nutrientDetails}\nIngredienser: ${ingredientsDetail}`); // Viser en sammensat besked med måltidsnavn, ernæringsdetaljer og ingrediensliste.
}

// Funktion til at opdatere visningen af måltider i brugergrænsefladen.
function opdaterMåltider() {
  let måltidsListe = document.getElementById('måltidsListe'); // Henter elementet for måltidslisten.
  måltidsListe.innerHTML = ''; // Nulstiller indholdet i måltidslisten.
  meals.forEach((meal, index) => {
    let mealDiv = document.createElement('div'); // Opretter et nyt div-element for hvert måltid.
    mealDiv.className = 'oprettedeMåltider'; // Tilføjer en klasse til div-elementet.

    mealDiv.innerHTML = `
      <div class="mealItem">${meal.MealName}</div>
      <div class="mealItem">${meal.totalKcal}</div>
      <div class="mealItem ${colorClass}">${ingredientCount}</div>
      <div class="mealActions">
        <button class="buttonEdit" onclick="redigerMåltid(${index})">✏️</button>
        <button class="buttonDelete" onclick="sletMåltid(${index})">🗑️</button>
        <button class="buttonOverview" onclick="oversigtIngredienser(${index})">📖</button>
      </div>
    `;
    måltidsListe.appendChild(mealDiv); // Tilføjer det nye div-element til måltidslisten.
  });
  // Gemmer den opdaterede måltidsliste i session storage.
  sessionStorage.setItem('meals', JSON.stringify(meals)); // Gemmer den opdaterede liste af måltider som en JSON-streng i sessionStorage.
}


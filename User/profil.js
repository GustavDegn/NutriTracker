// Tilføjer en event listener til 'DOMContentLoaded'-eventet for at sikre, at hele HTML-dokumentet er indlæst før JavaScript-koden udføres.
document.addEventListener('DOMContentLoaded', function() {
    // Henter registreringsformularen via dens ID.
    const form = document.getElementById('registerForm');
  
    // Tilføjer en event listener til formularen for at håndtere 'submit'-eventet.
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Forhindrer formularens standardindsendelsesadfærd.
  
        // Opretter et FormData-objekt baseret på formularen, hvilket hjælper med at håndtere formdata nemt.
        const formData = new FormData(form);
        // Konverterer FormData-objektet til et almindeligt JavaScript-objekt.
        const data = Object.fromEntries(formData.entries());
  
        // Validerer og konverterer alder til et tal.
        data.age = Number(data.age);
        // Validerer alder for at sikre, at det er et gyldigt tal og større end 0.
        if (isNaN(data.age) || data.age <= 0) {
            alert('Please enter a valid age.'); // Viser en fejlmeddelelse, hvis alderen ikke er gyldig.
            return; // Stopper yderligere udførelse, hvis alderen ikke er gyldig.
        }
  
        // Validerer og konverterer vægt til et tal.
        data.weight = Number(data.weight);
        // Validerer vægt for at sikre, at det er et gyldigt tal og større end 0.
        if (isNaN(data.weight) || data.weight <= 0) {
            alert('Please enter a valid weight.'); // Viser en fejlmeddelelse, hvis vægten ikke er gyldig.
            return; // Stopper yderligere udførelse, hvis vægten ikke er gyldig.
        }
  
        // Logger data, der sendes til serveren, til konsollen for fejlfinding.
        console.log("Data being sent to the server:", JSON.stringify(data));
  
        // Udfører en POST-anmodning til serveren for at registrere brugeren.
        fetch('/user/register', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json', // Sætter indholdstypen til JSON.
          },
          body: JSON.stringify(data) // Sender data som en JSON-streng.
        })
        .then(response => {
            // Tjekker om responsen er OK og indholdstypen er JSON.
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
                return response.json(); // Parser svaret som JSON.
            } else if (response.ok && contentType && !contentType.includes('application/json')) {
                // Håndterer tilfælde hvor svaret er OK, men ikke i JSON-format.
                return response.text().then(text => ({ message: text }));
            } else {
                // Kaster en fejl hvis svaret ikke er OK.
                return response.text().then(text => { throw new Error(text) });
            }
        })
        .then(responseData => {
            // Logger den vellykkede registrering og viser en bekræftelsesbesked.
            console.log('Registration successful:', responseData);
            alert('Registration successful! Message: ' + responseData.message);
        })
        .catch((error) => {
            // Logger fejl og viser en fejlmeddelelse hvis registreringen mislykkes.
            console.error('Registration failed:', error);
            alert('Registration failed: ' + error.message);
        });    
    });
  });
  

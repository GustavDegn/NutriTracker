// Lytter til 'DOMContentLoaded'-event for at sikre, at HTML-indholdet er fuldt indlæst før JavaScript-koden udføres.
document.addEventListener('DOMContentLoaded', function() {
    // Henter formularelementet og elementet til at vise log ind-fejl.
    const form = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Tilføjer en event listener til formen, der aktiveres ved submit.
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Forhindrer formen i at blive indsendt på den traditionelle måde.

        // Henter brugernavn og adgangskode fra formularen og fjerner overflødige mellemrum.
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Grundlæggende validering på klient-siden for at sikre, at både brugernavn og adgangskode er indtastet.
        if (!username || !password) {
            loginError.textContent = 'Both username and password are required.';
            return; // Afslutter funktionen hvis valideringen fejler.
        }

        // Udfører en POST-anmodning til serveren for at logge ind.
        fetch('/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }) // Sender brugernavn og adgangskode som JSON.
        })
        .then(response => {
            if (!response.ok) {
                // Antager at serveren svarer med en ikke-200 HTTP statuskode, hvis log ind er mislykket.
                throw new Error('Login failed. Please check your credentials and try again.');
            }
            return response.json(); // Parser svaret som JSON.
        })
        .then(data => {
            if (data.UserId) {
                // Gemmer brugerens ID i sessionStorage for at bevare sessionstaten.
                sessionStorage.setItem('UserId', data.UserId);
                console.log("UserId set in session storage:", data.UserId);

                // Omdirigerer brugeren til siden 'Meal Creator'.
                window.location.href = '/mealcreator.html'; 
            } else {
                // Håndterer tilfælde hvor backenden ikke returnerer et UserId.
                throw new Error('Login failed. User ID not provided.');
            }
        })
        .catch(error => {
            console.error('Login failed:', error); // Logger fejlen i konsollen.
            // Opdaterer brugergrænsefladen for at vise log ind-fejlen.
            loginError.textContent = 'Login failed: ' + error.message;
        });
    });
});


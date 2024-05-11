// Lytter til 'DOMContentLoaded'-eventet, som udløses når hele HTML-dokumentet er indlæst.
document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication(); // Kalder funktionen til at tjekke brugerens autentifikation.
});

// Funktion til at tjekke om brugeren er autentificeret ved at søge efter 'UserId' i sessionStorage.
function checkUserAuthentication() {
    const userId = sessionStorage.getItem('UserId');
    if (!userId) {
        window.location.href = '/login.html'; // Omdirigerer til login-siden, hvis ingen bruger er logget ind.
    }
    // Valgfrit: Her kunne man tilføje server-validering af userId hvis nødvendigt.
}

// Funktion til at hente brugerdetaljer fra serveren via en GET-anmodning.
function fetchUserDetails(UserId) {
    fetch(`/user/details/${UserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
    })
    .then(data => {
        // Sætter formularfelterne med data hentet fra serveren.
        document.getElementById('age').value = data.Age || '';
        document.getElementById('weight').value = data.Weight || '';
        document.getElementById('gender').value = data.Gender || '';
    })
    .catch(error => {
        console.error('Failed to fetch user details:', error);
        alert('Failed to fetch user details: ' + error.message);
    });
}

// En anden 'DOMContentLoaded' event listener til at initialisere yderligere funktionaliteter.
document.addEventListener('DOMContentLoaded', function() {
    const UserId = sessionStorage.getItem('UserId');

    console.log("Current UserId in storage:", UserId);

    if (!UserId) {
        console.error("No user logged in");
        alert("You are not logged in or your session has expired. Redirecting to login.");
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    } else {
        fetchUserDetails(UserId);
        setupProfileEventListeners(UserId);
    }
});

// Funktion til at opsætte event listeners for brugerprofil-interaktioner.
function setupProfileEventListeners(UserId) {
    document.getElementById('updateProfile').addEventListener('click', () => {
        updateUserDetails(UserId);
    });

    document.getElementById('deleteProfile').addEventListener('click', () => {
        deleteProfile(UserId);
    });
}

// Funktion til at opdatere brugerdetaljer via en PUT-anmodning.
function updateUserDetails(UserId) {
    const userData = {
        alder: document.getElementById('age').value,
        vægt: document.getElementById('weight').value,
        køn: document.getElementById('gender').value
    };

    fetch(`/user/update/${UserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        alert("Profile updated successfully.");
    })
    .catch(error => {
        console.error('Error updating user:', error);
        alert('Failed to update profile: ' + error.message);
    });
}

// Funktion til at slette en brugerprofil.
function deleteProfile(UserId) {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        fetch(`/user/${UserId}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            sessionStorage.removeItem('UserId');
            alert("Profile deleted successfully.");
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            alert('Failed to delete user: ' + error.message);
        });
    }
}

// Funktion til at håndtere logud-proceduren.
document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/user/logout', {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Logout failed.');
        }
        sessionStorage.clear();
        return response.text();
    })
    .then(() => {
        window.location.href = '/login.html';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Logout failed: ' + error.message);
    });
});




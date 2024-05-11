// Importer Chai biblioteket for at håndtere bekræftelser (assertions) i test.
import * as chai from 'chai';
const { expect } = chai;
// Importer supertest til at udføre HTTP-anmodninger i testmiljø.
import request from 'supertest';
// Importer Express app'en, som skal testes.
import app from '../api/server.js';
// Definer en test suite for bruger-relaterede ruter.
describe('User Routes', function() {
    // Definer en test for registrering af en ny bruger.
    it('should register a new user', function(done) {
        this.timeout(5000);  
        // Send en POST-anmodning til brugerregistreringsendpointet.
        request(app)
            .post('/user/register')
            .send({
                username: 'testbruger2',
                password: 'testpassword2',
                email: 'test2@example.com',
                age: 26,
                weight: 71,
                gender: 'Male'
            })
            .expect(201)  // Tjek at HTTP statuskoden er 201 for succesfuld oprettelse.
            .end(function(err, res) {
                if (err) return done(err); // Håndter eventuelle fejl under testen.
                // Bekræft at responsen er et objekt.
                expect(res.body).to.be.an('object');
                // Bekræft at responsen indeholder en besked om succes.
                expect(res.body.message).to.equal('User created successfully.');
                done(); // Signalér at testen er færdig.
            });
    });
});

// Definer en anden test suite for bruger-relaterede ruter.
describe('User Routes', function() {
    // Definer en test for sletning af en eksisterende bruger.
    it('should delete an existing user', function(done) {
        // Du skal håndtere autentifikation her, evt. ved at logge ind først eller mocke sessionen.
        request(app)
            .delete('/user/6')  
            .expect(200)  // Tjek at HTTP statuskoden er 200 for succesfuld sletning.
            .end(function(err, res) {
                if (err) return done(err); // Håndter eventuelle fejl.
                // Bekræft at respons-teksten indikerer en succesfuld sletning.
                expect(res.text).to.equal('Bruger slettet');
                done(); // Afslut testen og signalér at den er gennemført.
            });
    });
});

const express = require('express');
const {PORT = 3000} = process.env;
const {generate, validate} = require('./cd-keygen');
const app  = express();

app.get('/generate', (req,res) => res.send(generate()));

app.get('/validate', (req,res) => res.send(`${req.query.key} is ${validate(req.query.key)? 'a VALID': 'an INVALID' }  CD key.`));

app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running on port: ${PORT}...`));

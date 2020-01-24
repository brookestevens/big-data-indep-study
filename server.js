
const path = require('path');
const port = process.env.PORT || 3000;
const express = require('express');
const app = express();

//serve the directories
app.use('/public', express.static(__dirname + '/public'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use('/js', express.static(__dirname + '/public/js'));

/*
    SERVE static pages
*/

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname,'/public/index.html'));
})

app.get('/music', (req, res) =>{
    res.sendFile(path.join(__dirname,'/public/music.html'));
})

app.get('/genome', (req, res) =>{
    res.sendFile(path.join(__dirname,'/public/genome.html'));
})


/*
    ROUTES for App
*/

app.listen(port, () => console.log(`App is listening on port 3000!`));

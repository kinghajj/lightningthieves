var spawn   = require('child_process').spawn,
    fs      = require('fs'),
    path    = require('path'),
    app     = require('http').createServer(http_handler),
    io      = require('socket.io').listen(app),
    url     = require('url');

/* Remote JSON API tracking.
 */

var tracked_jsons = [
    {
        name: 'ktr',
        url:  'http://ltc.kattare.com/api.php?api_key=64b0fea666d47d5dd5ec5d609b0ae5925200626b495359c52ccdc18eb7ff3369'
    },
    {
        name: 'mtgox_btcusd',
        url:  'https://data.mtgox.com/api/2/BTCUSD/money/ticker'
    },
    {
        name: 'btce_ltcusd',
        url:  'https://btc-e.com/api/2/ltc_usd/ticker'
    },
    {
        name: 'btce_ltcbtc',
        url:  'https://btc-e.com/api/2/ltc_btc/ticker'
    },
    {
        name: 'gml_api',
        url:  'https://give-me-ltc.com/api'
    },
];

var server_fetch_delay = 60000 * 5;
var client_emit_delay  = 60000;

// I've had no luck using the native Node ways to fetch from HTTP, so, fuck it,
// just use curl. Always reliable!
function curl(url) {
    return spawn('curl', [url]);
}

// log any errors
function err_handler(err) {
    console.log(err);
}

// fetch and update tracked jsons
function fetch_loop() {
    for(var i in tracked_jsons) {
        var fetch = curl(tracked_jsons[i].url);
        fetch.on('error', err_handler);
        (function(i) {
            fetch.stdout.on('data', function(data) {
                tracked_jsons[i].last = JSON.parse(data);
            });
        })(i);
    }

    // try again after a certain delay
    setTimeout(fetch_loop, server_fetch_delay);
}

fetch_loop();

/* Socket.IO stuff.
 */

// periodically emit stats to clients
function socket_handler(socket) {
    // bundle the tracked jsons together with the current time
    var bundle = { now: (new Date()).getTime() };
    for(var i in tracked_jsons) {
        if(tracked_jsons[i].last) {
            bundle[tracked_jsons[i].name] = tracked_jsons[i].last;
        }
    }

    // emit them to the client
    socket.emit('news', bundle);

    // do it again a while later
    setTimeout(socket_handler, client_emit_delay, socket);
}
io.sockets.on('connection', socket_handler);

/* HTTP server logic.
 */

// HTTP server main logic
function http_handler(req, res) {
    req_url = url.parse(req.url);
    // redirect to main page
    if(req_url.pathname === '/') {
        req_url.pathname = '/lightningthieves.html';
    }
    // sanitize the path
    req_url.pathname = path.normalize(req_url.pathname);
    // try to load the file and serve it
    fs.readFile(__dirname + req_url.pathname, function(err, data) {
        if(err) {
            res.writeHead(500);
            return res.end('Error loading ' + req_url.pathname);
        }
        res.writeHead(200);
        res.end(data);
    });
}

/* Start the server.
 */

// start listening
var port = process.env.PORT || 5000;
app.listen(port);

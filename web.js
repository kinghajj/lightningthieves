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
var server_fetch_min_delay = 60000;
var last_fetch_time;
var client_emit_delay  = 60000;
var connection_count = 0;

// I've had no luck using the native Node ways to fetch from HTTP, so, fuck it,
// just use curl. Always reliable!
function curl(url) {
    return spawn('curl', [url]);
}

// log any errors
function err_handler(err) {
    console.log(err);
}

// fetch from the sources and update
function fetch(force) {
    // don't fetch too often, unless this is part of the main fetch loop.
    if(!force && last_fetch_time && (new Date()).getTime() - last_fetch_time < server_fetch_min_delay) {
        return;
    }

    for(var i in tracked_jsons) {
        var fetch = curl(tracked_jsons[i].url);
        fetch.on('error', err_handler);
        (function(i) {
            fetch.stdout.on('data', function(data) {
                tracked_jsons[i].last = JSON.parse(data);
            });
        })(i);
    }

    last_fetch_time = (new Date()).getTime();
}

// periodically fetch and update tracked jsons
function fetch_loop() {
    fetch(true);

    // try again after a certain delay
    setTimeout(fetch_loop, server_fetch_delay);
}

// begin the fetch loop
fetch_loop();

/* Socket.IO stuff.
 */

// bundle the source data and emit it to a socket.
function emit_bundle(socket) {
    // bundle the tracked jsons together with the current time
    var bundle = {
        now: (new Date()).getTime(),
        last_fetch_time: last_fetch_time,
        connection_count: connection_count,
    };
    for(var i in tracked_jsons) {
        if(tracked_jsons[i].last) {
            bundle[tracked_jsons[i].name] = tracked_jsons[i].last;
        }
    }

    // emit them to the client
    socket.emit('news', bundle);
}

// periodically emit data to clients.
function socket_loop(socket) {
    emit_bundle(socket);
    setTimeout(socket_loop, client_emit_delay, socket);
}

// set up socket then start the loop.
function socket_handler(socket) {
    connection_count++;
    socket.on('disconnect', function() {
        connection_count--;
    });
    socket.on('news', function() {
        emit_bundle(socket);
    });
    socket.on('fetch', function() {
        fetch();
        emit_bundle(socket);
    })
    socket_loop(socket);
}

// set up socket.io.
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

var spawn   = require('child_process').spawn,
    fs      = require('fs'),
    path    = require('path'),
    app     = require('http').createServer(http_handler),
    io      = require('socket.io').listen(app),
    url     = require('url');

var ktr_url       = 'http://ltc.kattare.com/api.php?api_key=64b0fea666d47d5dd5ec5d609b0ae5925200626b495359c52ccdc18eb7ff3369';
var mtgox_url     = 'https://data.mtgox.com/api/2/BTCUSD/money/ticker';
var btce_usd_url  = 'https://btc-e.com/api/2/ltc_usd/ticker';
var btce_btc_url  = 'https://btc-e.com/api/2/ltc_btc/ticker';

var server_fetch_delay = 60000;
var client_emit_delay  = 60000;

var last_ktr, last_mtgox, last_btce_usd, last_btce_btc;

// I've had no luck using the native Node ways to fetch from HTTP, so, fuck it,
// just use curl. Always reliable!
function curl(url) {
    return spawn('curl', [url]);
}

function fetch_loop() {
    // start fetching from the sources
    var ktr       = curl(ktr_url);
    var mtgox     = curl(mtgox_url);
    var btce_usd  = curl(btce_usd_url);
    var btce_btc  = curl(btce_btc_url);

    // log any errors
    function err_handler(err) {
        console.log(err);
    }
    ktr.on      ('error', err_handler);
    mtgox.on    ('error', err_handler);
    btce_usd.on ('error', err_handler);
    btce_btc.on ('error', err_handler);

    // cache the fetched data
    ktr.stdout.on      ('data', function(data) { last_ktr       = JSON.parse(data); });
    mtgox.stdout.on    ('data', function(data) { last_mtgox     = JSON.parse(data); });
    btce_usd.stdout.on ('data', function(data) { last_btce_usd  = JSON.parse(data); });
    btce_btc.stdout.on ('data', function(data) { last_btce_btc  = JSON.parse(data); });

    // try again after a certain delay
    setTimeout(fetch_loop, server_fetch_delay);
}

fetch_loop();

// periodically emit stats to clients
function socket_handler(socket) {
    // bundle the various stats and emit them to the client
    socket.emit('news', {'now':       (new Date()).getTime(),
                         'ktr':       last_ktr,
                         'mtgox':     last_mtgox,
                         'btce_usd':  last_btce_usd,
                         'btce_btc':  last_btce_btc});
    // do it again a while later
    setTimeout(socket_handler, client_emit_delay, socket);
}
io.sockets.on('connection', socket_handler);

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

// start listening
var port = process.env.PORT || 5000;
app.listen(port);

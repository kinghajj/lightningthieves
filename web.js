var spawn   = require('child_process').spawn,
    fs      = require('fs'),
    path    = require('path'),
    app     = require('http').createServer(http_handler),
    io      = require('socket.io').listen(app),
    url     = require('url');

var api_url = 'http://ltc.kattare.com/api.php?api_key=64b0fea666d47d5dd5ec5d609b0ae5925200626b495359c52ccdc18eb7ff3369';
var delay   = 60000;

// I've had no luck using the native Node ways to fetch from HTTP, so, fuck it,
// just use wget. Always reliable!
function curl(url) {
    return spawn('curl', [url]);
}

// periodically fetch stats and emit them to clients
function socket_handler(socket) {
    var fetch = curl(api_url)
    fetch.on('error', function(err) {
        socket.emit('errors', err);
    });
    fetch.stdout.on('data', function(data) {
        var pool_stats = JSON.parse(data);
        pool_stats.now = (new Date()).getTime();
        socket.emit('news', pool_stats);
        setTimeout(socket_handler, delay, socket);
    });
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

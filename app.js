var http = require('http');
var fs = require('fs');
var sql = require('mysql');
var urlParser = require('url');


function dbConnect (callback) {
    let sqlconn = sql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "servprogsolutionsRest"
    });
    
    sqlconn.connect(function (err) {
        if (err) throw err;
        console.log('connected :)');
        callback(sqlconn);
    });
}

var endpoints = new Map();

endpoints.set('/bookings/add', (req, urlQuery, sqlconn, callback) => {
    sqlconn.query(`INSERT INTO bookings (room_id, bookedBy, bookingDay) VALUES (${req.body.roomId}, ${req.body.bookedBy}, ${req.body.bookingDay})`, (err) => {
        if (err) throw err;
        callback();
    });
});

endpoints.set('/rooms', (req, urlQuery, sqlconn, callback) => {
    sqlconn.query(`SELECT * FROM rooms`, (err, results) => {
        if (err) throw err;
        callback(results);
    });
});

endpoints.set('/bookings', (req, urlQuery, sqlconn, callback) => {
    sqlconn.query(`SELECT * FROM bookings WHERE bookingDay = ${urlQuery.day ?? new Date().getDate()}`, (err, results) => {
        if (err) throw err;
        callback(results);
    });
});

const readBody = (req, res) => {
    let body = []
    return req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        if (body) req.body = JSON.parse(body);
        return handleRequest(req, res)
    })
}

const handleRequest = (req, res) => {
    var path = req.url.split('?')[0];
    var endpoint = endpoints.get(path);

    if (typeof endpoint === 'function') {
        let urlQuery = urlParser.parse(req.url, true).query
        dbConnect(con => authenticated(req.headers, con, res, () => {
            try {
                endpoint(req, urlQuery, con, data => {
                    if (typeof data !== 'undefined') {
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify(data));
                    }
                    return res.end();
                });
            } catch {
                res.writeHead(500);
                return res.end();
            }
        }));
        return;
    }

    if (path == '/') path = 'index.html';

    fs.readFile(`docs/${path}`, (err, data) => {
        if (err) {
            statusCode = 404;
            data = "404 not found";
        }

        res.write(data);
        return res.end();
    });
}

const authenticated = (headers, sqlconn, res, callback) => {
    sqlconn.query(`SELECT * FROM apikeys WHERE apikey = '${headers['token']}'`, (err, results) => {
        if (err) throw err;
        if (results.length > 0)
            callback();
        else{
            res.writeHead(401);
            return res.end();
        }
    });
}

http.createServer(readBody).listen(8080);
var http = require('http');
var fs = require('fs')

http.createServer(function (req, res) {
    var statusCode = 200;
    var path = req.url;
    if (path == "/") path = "index.html";
    fs.readFile(`docs/${path}`, (err, data) => {
        if(err){
            statusCode = 404;
            data = "404 not found";
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
}).listen(8080); //the server object listens on port 8080 
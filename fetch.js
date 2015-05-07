var _ = require('underscore'),
    async = require('async'),
    program = require('commander'),
    fs = require('fs'),
    path = require('path'),
    https = require('https');

var version;

program
    .version('0.0.0')
    .arguments('<version>')
    .action(function (v) {
        version = v;
    })
    .parse(process.argv);

var version = program.v || program.args[0];

if (!version) {
    console.log("Please specify a version to fetch!");
    process.exit();
}

console.log("Fetching ydn.db files for version " + version);

var url = 'https://www.googleapis.com/storage/v1/b/ydn-db-d1/o?prefix=' + version + '%2F';

https.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
        var items = JSON.parse(body).items,
            versionPrefix = version + '/';

        if (!items) {
            console.log("Version not found!");
            process.exit();
        }

        async.forEachLimit(items, 3, function(item, cb){
            var filename = item.name.slice(versionPrefix.length),
                file = fs.createWriteStream(path.join('ydn.db', filename));

            var request = https.get(item.mediaLink, function(response) {
                console.log('-> ' + filename);
                response.pipe(file);
                cb();
            });
        }, function(err){
            if (err) {
                console.log("Error!", err);
            } else {
                console.log("Done!");
            }
        });
    });
}).on('error', function(e) {
    console.log("Got error: ", e);
});
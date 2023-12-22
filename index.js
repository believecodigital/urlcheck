const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');
const readline = require('readline');
const xml2js = require('xml2js');

const ignore = ['&quot;','mailto','wp-content','wp-json','.jpg','.png','.gif','.webp','.svg','.pdf','.css','.js','.php','.ico','.xml','.txt','.ttf','.src']
const errs = ['301','302','404'];
var origin = null;
var scanned = [];
var timeouts = [];

// Async function which scrapes the data
async function findLinks(url) {
    // if there's any non-HTML pages, bail
    if (ignore.some(el => url.includes(el))) return;
    if (origin === null) {
        var match = url.match(/((https?):\/\/)([A-Za-z0-9\-\.]*)\//);
        if (match !== undefined && match[3] !== undefined) origin = match[3];
    }
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const linkItems = $("a");
        const externals = [];

        // if there are no links to follow, move along...
        if (linkItems !== null && linkItems.length > 0) {
            // loop through all the links available on the page
            linkItems.each((idx, el) => {
                // if links are in-domain or relative, queue for scanning
                var href = $(el)[0].attribs.href;
                if (href !== undefined && href !== null) {
                    // In case there are domain-less links, make sure they're accounted for
                    if (!href.includes('http')) {
                        // re-add the protocol and domain
                        href = 'https://' + origin + href;
                        // if not in the urls to scan list, add it
                        if (!scanned.includes(href)) scanned.push(href);
                    }

                    // if the url doesn't have the origin, it's worth checking
                    if (!href.includes(origin)) {
                        // External link, add to the queue so we can dump
                        externals.push(href);
                    }
                }
            });

            // Logs externals array to the console
            console.log(url);
            console.dir(externals);
        }
    } catch (err) {
        var doloop = "";
        // If there's no err code, something Really Bad™ happened
        if (err.code !== "ETIMEDOUT" && 
            err.code !== "ERR_BAD_REQUEST" && 
            err.code !== "ERR_BAD_RESPONSE" && 
            err.code !== "ECONNREFUSED" &&
            err.code !== "EPIPE" &&
            err.code !== "EADDRNOTAVAIL" &&
            err.code !== "ECONNRESET") {
            console.log(err);
            process.exit(1); // Stops the code
        }
        // If the connection is refused outright, abort scanning it
        if (err.code === "ECONNREFUSED" && 
            (url !== null && url !== "")) {
            console.log("Connection refused on " + url);
            url = "";
        }
        if ((err.response !== undefined && err.response.status !== undefined) && 
             errs.includes(err.response.status)) {
            // this is a 301,302, or 404 response, so skip
        }
        else {
            // it's not a fatal error, so we're going iterate on this URL
            doloop = url;
        }
        if (doloop !== "") {
            // does the URL already exist in the timeouts array?
            var index = timeouts.map(function(el){return el[0];}).indexOf(url);
            if (index !== -1) {
                // if it exists, add increment
                timeouts[index][1]++;
                // if we've already had 5 errors on this url, pass
                if (timeouts[index][1] > 5) {
                    console.log('Too many errors on ' + url);
                    url = '';
                }
            }
            else {
                // set first iteration
                timeouts.push([url,1]);
            }
    
            // Usually because we're hitting the server too hard, too fast
            // so delay 10s before asking again
            setTimeout(() => {
                findLinks(url);
              }, 10000);
        }
    }
}

// We're going to read files differently depending on the source
// If urls.txt exists, it's because we had to spider
if (fs.existsSync('urls.txt')) {
    var rd = readline.createInterface({
        input: fs.createReadStream('urls.txt'),
        console: false
    });
    
    rd.on('line', function(line) {
        if (!(ignore.some(el => line.includes(el))) && !scanned.includes(line)) scanned.push(line);
    });
    rd.on('close', function() {
        // First line is the base URL; use this to find the origin domain
        var match = (scanned.shift()).match(/((https?):\/\/)(.*)\//);
        // sort so output is less janky
        scanned.sort();
        // make sure there's a match
        if (match !== null && match[3] !== undefined) {
            origin = match[3];
            if (scanned !== null && scanned.length>0) {
                for (i in scanned) {
                    findLinks(scanned[i]);
                }
            }
        }
    });
}
else {
    // We have sitemaps, which are (presumably) all downloaded, so we'll 
    // scan them, once a time, get their URLs and look for links in those
    // We can't load all of these into the scanned array due to scoping 
    // with fs.readFile. But there's less of a chance of duplication when
    // using sitemaps.
    var files = fs.readdirSync(__dirname).filter(fn => fn.endsWith('.xml'));
    files.forEach((file) => {
        var parser = new xml2js.Parser();
        fs.readFile(__dirname + '/' + file, function(err, data) {
            parser.parseString(data, function (err, result) {
                if (result.urlset !== undefined) {
                    result.urlset.url.forEach((uri) => {
                        findLinks(uri.loc[0]);
                    });
                }
            });
        });
    });
}


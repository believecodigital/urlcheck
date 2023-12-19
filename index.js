const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');
const readline = require('readline');

const ext = ['.jpg','.png','.gif','.webp','.pdf','.css','.js','.php']
var origin = null;
var scanned = [];

// Async function which scrapes the data
async function findLinks(url) {
    // if there's any non-HTML pages, bail
    if (ext.some(el => url.includes(el))) return;
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
                // if the url doesn't have the origin, it's worth checking
                if (!href.includes(origin)) {
                    // External link, add to the queue so we can dump
                    externals.push(href);
                }
            });

            // Logs externals array to the console
            console.log(url);
            console.dir(externals);
        }
    } catch (err) {
        //console.log("Cannot load " + url);
    }
}

var rd = readline.createInterface({
    input: fs.createReadStream('urls.txt'),
    console: false
});

rd.on('line', function(line) {
    if (!scanned.includes(line)) scanned.push(line);
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


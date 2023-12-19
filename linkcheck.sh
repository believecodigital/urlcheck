#!/bin/bash

wget --spider --force-html -r -l5 $1 2>&1 | grep '^--' | awk '{print $3}' > urls.txt
node index.js > report.txt
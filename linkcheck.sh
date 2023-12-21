#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "You need to run this as ./linkcheck.sh <site url>"
    echo
    exit 1
fi

if ! command -v wget &> /dev/null
then
    echo "You must install wget for this script to work."
    exit 1
fi

if ! command -v node &> /dev/null
then
    echo "You must install Node for this script to work."
    exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies."
  npm install
else
  echo "Running updates." 
  npm update
fi

echo
echo Obtaining URLs for $1
echo This may take a while...
wget --spider --force-html -e robots=off -r -l5 $1 2>&1 | grep '^--' | awk '{print $3}' > urls.txt

echo Checking pages for off-domain links
node index.js > report.txt

echo Report complete, please check report.txt.
echo 
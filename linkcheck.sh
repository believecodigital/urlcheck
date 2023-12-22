#!/bin/bash

# Clean working files
rm *.txt
rm *.xml

if [ $# -eq 0 ]
  then
    echo
    echo "You need to run this as ./linkcheck.sh <site url>"
    echo
    exit 1
fi

if ! command -v wget &> /dev/null
then
    echo
    echo "You must install wget for this script to work."
    exit 1
fi

if ! command -v node &> /dev/null
then
    echo 
    echo "You must install Node for this script to work."
    echo
    exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies."
  npm install
fi

echo 
echo "Attempt to obtain $1/sitemap.xml"
if wget -q --method=HEAD $1/sitemap.xml;
  then
    wget -q $1/sitemap.xml

    if grep -q '.xml' sitemap.xml
      then
        echo "Sitemap contains sub-files." 
        cat sitemap.xml | sed 's/<loc>/\n<loc>/g' | egrep -o -- 'https:\/\/(.*)\.xml' | xargs wget -q 
    fi
  else
    echo 
    echo "No sitemap is available."   
    echo
    echo "Spidering $1 to obtain URLs."
    echo "This may take a while..."
    wget --spider --force-html -e robots=off -r -l5 -R 'jpg,gif,png,webp,svg,css,js,xml' $1 2>&1 | grep '^--' | awk '{print $3}' > urls.txt
fi

echo "Checking pages for off-domain links"
node index.js > report.txt

echo "Report complete, please check report.txt."
echo 

if grep -q wpengine.com report.txt
then
    echo "!!! WP Engine links are present on $1" 
    echo
fi

# Site External Link Check

*NOTE:* this is tool is not perfect. If it requires a fix, please propose
it and commit back to the line so everyone can benefit.

This script will crawl a provided URL, obtain all known URLs, and then scan
the list for off-domain URLs. This includes any links, either sourced from
content or configuration, that do not exactly match the domain under which
you're scanning. 

The intent of this script is to identify links that might have been created
using a development or staging instance that did not get properly changed
when the site went live, or if a migrated site ended up with incorrect 
links.

*NOTE:* This does not discriminate from an accidental staging URL and a 
legitimate external URL -- all reports should be scanned carefully. 

For example, if you're scanning example.com and there are links using 
dev.example.com, you will see the dev.example.com domains appear in 
the report. 

Usage: ./linkcheck.sh <site url>
Example: ./linkcheck.sh believeco.com

The output appears in report.txt, which has the format: 

    https://somedomain.com/page-uri
    [
        https://someotherdomain.com/page-uri1,
        https://someotherdomain.com/page-uri2,
        https://someotherdomain.com/page-uri3,
        https://someotherdomain.com/page-uri4,
        https://someotherdomain.com/page-uri5
    ]

Due to the asynchronous nature of the tool, pages are not sorted in any
manner, nor is there any deduplication -- you might see the same URL 
appear many times, especially if it appears in a site-wide element, like
a footer menu. 

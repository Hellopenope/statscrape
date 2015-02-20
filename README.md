# StatScrape

StatScrape is a NBA Roster and Stat Scraper built with Node.js, utilizing the Cheerio, Request, and Orchestrate npm's.

This version is set up to scrape each team's current roster and player's stats every 24 hours, automatically updating the database.

To run StatScrape as it is currently set up, you will first need an Orchestrate account, then you will insert your db key to access your specific collection.  Once that is set up, you can start it up by running `node statscrape.js` in the terminal.


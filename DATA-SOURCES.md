# Data Sources & Legal Compliance Document
**Date Checked:** September 1, 2026

## Home Depot
*   **Official URL:** homedepot.com
*   **Data Obtained:** None automatically.
*   **Method:** Manual user verification via `https://www.homedepot.com/s/{UPC}`
*   **Legal Note:** Home Depot Terms of Use expressly prohibit unauthorized bot scraping. Official Affiliate APIs (Impact) provide catalog data but not real-time store clearance pricing. Therefore, all pricing data is **USER ENTERED** and checked manually by the user via the provided deep-links.

## Lowe's
*   **Official URL:** lowes.com
*   **Data Obtained:** None automatically.
*   **Method:** Manual user verification via `https://www.lowes.com/search?searchTerm={UPC}`
*   **Legal Note:** Lowe's Azure API portal requires enterprise partnership. Unauthorized scraping is prohibited. Addressed via deep-link manual workflow.

## eBay (For Resale Estimates)
*   **Official URL:** ebay.com
*   **Data Obtained:** None automatically in V1.
*   **Method:** Manual search via `https://www.ebay.com/sch/i.html?_nkw={UPC}&LH_Sold=1`
*   **Legal Note:** eBay allows API access via their Browse API, but doing so requires an Application Access Token (Client Credentials grant). Putting this token in a browser PWA exposes it to theft. A secure implementation requires a backend server. Therefore, V1 relies on the user clicking the link, viewing sold prices, and typing them into the calculator.

## Algorithm Scoring
*   **Penny Score:** CALCULATED locally based on user-entered markdown percentages and price-endings (e.g., .01, .06).
*   **Resale Score:** CALCULATED locally based on user-entered potential sale price minus estimated fees and shipping. 

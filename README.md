# J-Watchlist

Basic stock watchlist using tastytrade's and polygon.io's APIs. I implemented both bonuses of streaming market data and an additional symbol chart view.

## Guide
First, make sure you have a tastytrade sandbox user and account.
To run, clone this repo and run:
```
npm i
npm run dev -- --open
```

This should start the app on `http://localhost:5173/login`. Login with your sandbox credentials.

## Considerations

There are some features I omitted for demoing purposes but in a production environment:

- Locale - Timezone, language, and currency would be very important for real trading scenarios. I would have the user object store locale info so then the rest of the app can use these global settings to do proper timezone, language,  and currency conversions.
- UI settings  - I would include a dark theme. 
- Monitoring - I would use Datadog to monitor route load and API call times. Sentry for any potential js errors.
- Testing - In production, I would include frontend unit and integration tests using tools like jest and puppeteer. These allow for testing individual functions or basic user flows, like clicking on the add symbol button and expecting to see a dropdown.
- 24h Price Chart - I decided to use polygon.io as they have a free REST endpoint to get historical candle data. In production, I would have access to paid streaming URLs so I can stream the candle data live.

## AI

I used AI tools to help with the more predictable and mundane tasks such as typing, tests, file skeletons, and integrating APIs and third-party libraries. I also used it to help me understand the technological domain of building a stock watchlist and what certain keywords mean, like candle. 

Architecture, file structure, UX/UI design, tool/library choice, and the features I picked was done with no AI.


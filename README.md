# J-Watchlist

Basic stock watchlist using tastytrade's and polygon.io's APIs. I implemented both bonuses of streaming market data and an additional symbol chart view. For the chart I used plotly.js.

## Guide
First, make sure you have a tastytrade sandbox user and account.

You can use the live deployed app here: https://j-watchlist.vercel.app/login

Otherwise to run locally, clone this repo and run:
```
npm i
npm run dev -- --open
```

This should start the app on `http://localhost:5173/login`. Login with your sandbox credentials.

## Considerations

There are some features I omitted for demoing purposes but in a production environment:

- Testing - I included a small suite for demo purposes in `src/lib/utils`. In production I would have unit, integration, and e2e tests for all user flows.
- Locale - I would have the user object store locale info so the app can use their specified language, currency, and timezone.
- Monitoring - I would use Datadog to monitor route load and API call times. Sentry for any potential js errors.
- 24h Price Chart - I decided to use polygon.io as they have a free REST endpoint to get historical candle data. In production, I would have access to paid streaming URLs so I can stream the candle data live.
- UI settings  - I would include a dark theme. 

## AI

I used AI tools to help with the more predictable tasks such as typing, tests, file skeletons, and integrating APIs and third-party libraries. It also helped me build out more complex UI quickly, like a live refresh button in the `/symbol` page and mini-library in `src/lib/components`.

Architecture, file structure, UX/UI design, tool/library choice, and the features I picked was done with no AI.


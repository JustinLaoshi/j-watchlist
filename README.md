# Stock Watchlist Application

A modern, real-time stock watchlist application built with SvelteKit and TypeScript. This application allows users to create and manage watchlists, track stock prices in real-time, and view detailed stock information with charts.

## Features

- 🔐 **User Authentication** - Secure login/logout with session management
- 📊 **Real-time Stock Data** - Live price updates via WebSocket streaming
- 📈 **Interactive Charts** - 24-hour price charts with SVG visualization
- 📋 **Watchlist Management** - Create, edit, and manage multiple watchlists
- 🔍 **Symbol Search** - Autocomplete search for stock symbols
- 📱 **Responsive Design** - Modern UI that works on all devices
- ⚡ **Fast Performance** - Built with SvelteKit for optimal performance

## Tech Stack

- **Frontend**: SvelteKit 5.0
- **Styling**: Tailwind CSS 4.0
- **Language**: TypeScript
- **State Management**: Svelte Stores
- **Real-time Data**: WebSocket streaming
- **Charts**: Custom SVG charts
- **Build Tool**: Vite

## Project Structure

```
src/
├── lib/
│   ├── api.ts                 # Typed API helpers (auth, watchlists, streaming, candles)
│   ├── stores/
│   │   ├── sessionStore.ts    # User session/token management
│   │   ├── watchlistsStore.ts # User's watchlists data
│   │   └── marketDataStore.ts # Real-time quotes/streaming data
│   └── types/
│       └── tastytrade.d.ts    # Custom TypeScript interfaces/types
├── routes/
│   ├── login.svelte           # Login page
│   ├── watchlists.svelte      # Watchlists dashboard/main page
│   └── symbol/
│       └── [symbol].svelte    # Symbol detail page with 24h chart
├── components/
│   ├── WatchlistTable.svelte      # Table of symbols, prices, actions
│   ├── SymbolSearch.svelte        # Search/autocomplete for adding symbols
│   ├── SymbolDetailChart.svelte   # Chart component for price history
│   ├── AddWatchlistModal.svelte   # Modal to create a new watchlist
│   └── AddSymbolModal.svelte      # Modal to add symbol to watchlist
└── app.css                  # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd j-watchlist
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://api.tastytrade.com
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Demo Credentials

For testing purposes, you can use these demo credentials:

- Email: `demo@example.com`
- Password: `password123`

## API Integration

The application is designed to work with the TastyTrade API, but can be easily adapted to work with other stock data providers. The API layer is fully typed and includes:

- **Authentication**: Login, logout, token refresh
- **Watchlists**: CRUD operations for watchlists and symbols
- **Market Data**: Real-time quotes and historical candle data
- **Symbol Search**: Autocomplete search functionality
- **DXLink Streaming**: Real-time price updates via TastyTrade's official DXLink protocol

### Streaming Implementation

The app implements TastyTrade's official DXLink streaming protocol:

1. **API Quote Token**: Gets a 24-hour valid quote token from `/api-quote-tokens`
2. **DXLink Handshake**: Follows the official protocol:
   - SETUP → AUTHORIZE → CHANNEL_REQUEST → FEED_SETUP → FEED_SUBSCRIPTION
3. **Keepalive**: Maintains connection with 30-second keepalive messages
4. **Event Processing**: Handles Quote, Trade, and Summary events
5. **Fallback**: Falls back to 5-second polling if streaming is unavailable

**Note**: Streaming requires a registered TastyTrade customer account. Users with only username/password registration will see an error message directing them to complete account opening.

## Key Components

### Stores

- **SessionStore**: Manages user authentication state and tokens
- **WatchlistsStore**: Handles watchlist CRUD operations and selection
- **MarketDataStore**: Manages real-time quotes and streaming data

### Components

- **WatchlistTable**: Displays symbols with real-time prices and actions
- **SymbolSearch**: Autocomplete search with debouncing
- **SymbolDetailChart**: SVG-based price charts
- **AddWatchlistModal**: Modal for creating new watchlists
- **AddSymbolModal**: Modal for adding symbols to watchlists

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check the project
- `npm run lint` - Lint the code
- `npm run format` - Format the code

### Code Style

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## Deployment

The application is configured for deployment on Vercel with the `@sveltejs/adapter-vercel` adapter.

To deploy:

1. Build the application:

```bash
npm run build
```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

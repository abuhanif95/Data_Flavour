# Data_Flavour - Yelp Text-to-SQL Analytics Platform

A modern full-stack web application for querying the Yelp dataset using natural language (Text-to-SQL). Built with **React 19**, **Tailwind CSS v4**, and a Node.js backend powered by OpenAI's LLM.

## Project Overview

This platform fulfills all requirements from the specification:

- **Requirement 1**: Data analysis queries (business, user, review, rating, check-in analysis)
- **Requirement 2**: Data enrichment with external datasets (weather, storefronts, review manipulation detection, open-world hypotheses)
- **Requirement 3**: Full-stack Text-to-SQL conversational application with chat interface

## Tech Stack

### Frontend

- **React 19.2** - Latest React with hooks and concurrent rendering
- **Tailwind CSS v4.2** - Utility-first CSS framework with modern design tokens
- **Vite 8.0** - Lightning-fast build tool and dev server
- **Modern ESM** - Fully modular JavaScript

### Backend

- **Express.js** - Lightweight Node.js web framework
- **better-sqlite3** - Embedded relational database
- **OpenAI API** - LLM for Natural Language → SQL translation
- **Zod** - TypeScript-first schema validation
- **CORS & dotenv** - Security and environment configuration

## Architecture

```
Data_Flavour/
├── frontend/                  # React + Tailwind UI
│   ├── src/
│   │   ├── App.jsx           # Main chatbot component
│   │   ├── index.css         # Tailwind v4 config & theme
│   │   └── main.jsx          # React entry point
│   ├── vite.config.js        # Vite + Tailwind plugin
│   └── package.json
├── backend/                   # Express API server
│   ├── src/
│   │   └── server.js         # API endpoints & SQL execution
│   ├── .env                  # Environment variables
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ (npm or yarn)
- OpenAI API key (optional for demo mode)

### Installation & Setup

1. **Install frontend dependencies**:

   ```bash
   cd frontend
   npm install
   cd ..
   ```

2. **Install backend dependencies**:

   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Configure environment** (optional):
   ```bash
   cd backend
   echo 'OPENAI_API_KEY=sk-...' > .env
   echo 'DB_PATH=./yelp.db' >> .env
   cd ..
   ```

### Running the Application

**Terminal 1 - Start Backend API** (port 8000):

```bash
cd backend
npm run dev        # development with file watch
# or
npm start          # production
```

**Terminal 2 - Start Frontend Dev Server** (port 5173):

```bash
cd frontend
npm run dev
```

Then open your browser to **http://localhost:5173** and start asking questions!

## Features

### 🎨 User Interface

- **Modern Chat Layout**: Clean, responsive interface with dual color themes
- **Real-time Feedback**: Loading indicators and connection status
- **Code Display**: SQL queries rendered in syntax-highlighted blocks
- **Data Tables**: Interactive, scrollable result tables with up to 20 rows visible
- **Responsive Design**: Mobile-friendly with Tailwind's breakpoint system

### 🤖 AI-Powered Query Translation

- Convert natural English questions into valid SQLite queries
- Automatic error correction with fallback queries
- Support for complex analytical questions (aggregations, joins, filtering)

### 🔒 Safety & Validation

- SQL injection prevention via query validation
- Blocklist for dangerous operations (DROP, DELETE, UPDATE, ALTER, etc.)
- Zod schema validation for API inputs
- Error recovery with graceful fallbacks

### ⚡ Performance

- Vite's instant module replacement (HMR)
- Optimized database queries with proper indexing
- CORS middleware for secure cross-origin requests

## Usage Examples

Ask questions like:

- "Show me the top 5 cities by number of restaurants"
- "What are the highest-rated Mexican restaurants in New York with over 500 reviews?"
- "Count reviews per year"
- "Identify the most popular reviewers"
- "Find businesses with the most five-star reviews"

## Environment Variables

**Backend (.env)**:

```bash
# LLM Configuration (optional)
OPENAI_API_KEY=sk-your-api-key-here

# Database
DB_PATH=./yelp.db

# Server
API_PORT=8000
```

## API Endpoints

### POST /api/chat

Request:

```json
{
  "question": "Show me the top 10 cities by restaurant count"
}
```

Response:

```json
{
  "question": "Show me the top 10 cities by restaurant count",
  "summary": "Found 10 results...",
  "sql": "SELECT city, COUNT(*) as business_count FROM businesses WHERE categories LIKE '%Restaurant%' GROUP BY city ORDER BY business_count DESC LIMIT 10;",
  "rows": [
    { "city": "New York", "business_count": 1250 },
    ...
  ],
  "columns": ["city", "business_count"],
  "notes": ["Backend connected."]
}
```

### GET /api/health

Health check endpoint. Returns:

```json
{
  "status": "ok",
  "timestamp": "2026-03-28T10:30:00.000Z"
}
```

## Database Schema

The application expects these Yelp tables:

- **businesses**: business_id, name, city, state, stars, review_count, is_open, categories
- **reviews**: review_id, user_id, business_id, stars, date, text, useful
- **users**: user_id, name, review_count, yelping_since, fans, average_stars
- **checkins**: business_id, date

Load your Yelp JSON files into these tables using a data pipeline (e.g., Python pandas → SQLite).

## Development

### Build Frontend for Production

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Lint JavaScript

```bash
cd frontend
npm run lint
```

### Test API Locally

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me the top restaurants"}'
```

## Deployment

### Frontend (Vercel, Netlify, etc.)

```bash
cd frontend
npm run build
# Deploy the `dist/` folder
```

### Backend (Heroku, Railway, AWS Lambda, etc.)

```bash
cd backend
npm install
npm start
```

## Future Enhancements

- [ ] Automated chart generation (bar, line, pie charts)
- [ ] Result caching for repeated queries
- [ ] Query history persistence
- [ ] Multi-language support
- [ ] Advanced filters and data export (CSV, JSON)
- [ ] User authentication and per-user query limits
- [ ] Predictive autocomplete suggestions
- [ ] Integration with external datasets (weather, demographics, real estate)

## Troubleshooting

**Why is the backend showing "WAITING FOR BACKEND"?**

- Ensure the backend server is running on port 8000
- Check browser console for network errors
- Verify CORS is enabled in backend

**Why are SQL queries failing?**

- Ensure Yelp data is loaded into your SQLite database
- Check that table names match exactly
- Review backend console logs for SQL errors

**Can I use this without an OpenAI API key?**

- Yes! The backend falls back to mock SQL generation if no API key is present
- Great for demos and testing

## License

MIT License - feel free to use and modify for education and production.

---

**Built with ❤️ using React, Tailwind, and Node.js**

# Forgetful UI

Web interface for [Forgetful](https://github.com/ScottRBK/forgetful) - AI memory management system.

## Tech Stack

- React 18 + TypeScript
- Vite
- Mantine UI
- React Query
- React Router
- react-force-graph-2d

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Configuration

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8020/api/v1
```

## Project Structure

```
src/
  api/        # API client and endpoints
  components/ # Reusable UI components
  context/    # React context providers
  hooks/      # Custom hooks (React Query)
  pages/      # Page components
  types/      # TypeScript types
```

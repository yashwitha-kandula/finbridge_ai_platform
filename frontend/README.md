# Frontend (React 18 + Vite)

## Run
```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173  (backend must be on :8000)
npm run build    # production build -> dist/
```
Set `VITE_API_URL` to point at a different backend.

## Structure
- `src/services/api.js` – one function per backend endpoint, with friendly errors when the backend is down
- `src/hooks/useFinance.jsx` – loads `/api/demo/dataset` once, then calls `/api/m2/analysis`, `/api/forecast` and `/api/goals/analyze`. It shares loading/error state with every page.
- `src/hooks/useTheme.js` + `components/ThemeSelector.jsx` – Light / Dark / **System (default)**, saved in localStorage
- Pages: Dashboard (with family panel), Analytics, Forecast, Debt, Goals, Recommendations, AI Assistant
- Components: Sidebar, Header, SummaryCard, InsightCard, DebtCard, ForecastCard, FinancialChart, SpendingChart, LoadingState

**No financial numbers are hard-coded.** Every value comes from the API. The source dataset is simulated, and the dashboard says so.

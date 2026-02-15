# MyFinance

MyFinance er en Next.js-app til privat budget, økonomisk overblik og prognoser.

## Funktioner

- Budgetsektioner for:
  - Indtægter
  - Bolig
  - Transport
  - Øvrige faste udgifter
- Drag-and-drop sortering af budgetkort
- Import/eksport af budgetdata (inkl. Excel/CSV-understøttelse i setup)
- Formueforudsætninger:
  - Opsparing
  - Boligværdi
  - Restgæld
  - Rente
  - Værdistigning
  - Forventet lønstigning
- Pensionsprognose
- Flere overbliksdiagrammer med til/fra-knapper
- Maskot-guide/tour
- Top-navbar med flere sider:
  - Budget
  - Overblik
  - Mål
  - Rapporter
- Ny overblik-side (`/overblik`) der læser snapshot-data fra budgetsiden

## Teknologi

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- ESLint
- `xlsx` til import

## Kom i gang

### Krav

- Node.js 18+ (anbefalet 20+)
- npm

### Installation

```bash
npm install
```

### Kør lokalt

```bash
npm run dev
```

Åbn `http://localhost:3000`.

## Scripts

```bash
npm run dev     # Start udviklingsserver
npm run build   # Build til produktion
npm run start   # Start produktion build
npm run lint    # Kør lint
```

## Projektstruktur

- `app/page.tsx` - Forside (budget)
- `app/overblik/page.tsx` - Overbliksside
- `app/maal/page.tsx` - Placeholder side
- `app/rapporter/page.tsx` - Placeholder side
- `app/components/savings-projection.tsx` - Hovedlogik for budget/prognose
- `app/components/finance-overview-dashboard.tsx` - Dashboard-komponent til overblikssiden
- `app/components/top-navbar.tsx` - Topnavigation
- `app/components/site-mascot.tsx` - Guide-maskot

## Data og lagring

Appen gemmer brugerindstillinger og snapshot-data i browserens `localStorage`, fx:

- `myfinance.sidebarVisible`
- `myfinance.darkMode`
- `myfinance.hiddenBudgetFields`
- `myfinance.periodTogglesEnabled`
- `myfinance.sectionOrder`
- `myfinance.overviewChartsVisible`
- `myfinance.overviewSnapshot`
- `myfinance.mascotTourSeen`

## GitHub (manual opsætning)

Hvis du vil pushe projektet til GitHub:

```bash
git add .
git commit -m "Initial MyFinance setup"
git branch -M main
git remote add origin <DIN_GITHUB_REPO_URL>
git push -u origin main
```

Eksempel på URL:

- `https://github.com/<brugernavn>/<repo>.git`

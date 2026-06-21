# FCO - Forest Carbon Online

*The COLE Tribute App*

FCO is an independent, unofficial, COLE-inspired explorer for broad-area USDA Forest Service Forest Inventory and Analysis (FIA) estimates. The public application is available at [fco.forestenterprise.org](https://fco.forestenterprise.org/).

## Data integrity

- Every displayed estimate must come from a completed FIADB-API `fullreport` request.
- FCO does not generate modeled, sample, illustrative, or substitute estimates.
- Failed, unavailable, and unsupported requests return an error without numbers.
- Evaluation-year choices are taken from FIA's published parameter catalog or confirmed by successful official queries.
- Results preserve FIA standard error, sampling error, and contributing plot count when supplied.
- Carbon is displayed primarily in metric tonnes of elemental carbon. The alternate short-ton value is an explicit mass-unit conversion using `1 metric tonne = 1.10231131 short tons`.
- Elemental carbon is never labeled as CO2e.

## Supported exploration

The production API supports FIA state and county requests, official evaluation groups, documented FIA row groupings, advanced condition filters, carbon pools, comparisons, and exports. Availability still depends on the combinations published by FIA; FCO returns no result when FIA cannot fulfill a selected combination.

## Architecture

- React, Vite, and TypeScript interface.
- Same-origin Vercel serverless API in `frontend/api/[...path].js`.
- Official FIADB-API requests made server-side.
- CSV, standalone HTML, print/PDF report exports.
- Anonymous aggregate product analytics and a scheduled weekly email report.

The old duplicate FastAPI mock implementation was removed. There is one estimate path and one result contract.

## Local development

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. Local development calls the deployed official-data API by default, so it exercises the same estimate service as the public application. Set `VITE_API_BASE_URL` only when intentionally testing another API deployment.

Run verification with:

```powershell
npm test
npm run build
```

## Deployment

Vercel deploys the `frontend` directory from `loggingchance/FCO`. The production domain is `fco.forestenterprise.org`. Upload changes on Windows with `UPLOAD_TO_GITHUB.cmd`.

Weekly aggregate usage reporting setup is documented in `docs/WEEKLY_USAGE_REPORT.md`.

## Non-affiliation notice

FCO is independent and unofficial. It is not affiliated with, endorsed by, sponsored by, or maintained by the USDA Forest Service, FIA, NCASI, the original COLE development group, or any prior COLE authors. FCO uses public data and documentation to make broad-area FIA information easier to explore.

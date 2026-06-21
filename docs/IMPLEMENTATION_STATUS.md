# FCO Implementation Status

## Production behavior

- The Vercel serverless API is the only estimate backend.
- Results are returned only after a successful USDA Forest Service FIADB-API request.
- No sample, mock, modeled, or fallback estimates exist.
- FIA failures and unsupported combinations return errors without numeric output.
- FIA evaluation years are discovered from official services rather than invented defaults.
- State and county geographies, supported FIADB row groupings, advanced filters, carbon pools, comparisons, and exports use the same official request path.
- County maps request official boundary geometry from U.S. Census Bureau TIGERweb and display no substitute shape if that service is unavailable.
- Standard error, sampling error, and contributing plot counts are retained when returned by FIA.

## Units

- Carbon output is normalized to metric tonnes of elemental carbon.
- Source attributes published in short tons are converted with `1 short ton = 0.90718474 metric tonnes`.
- The interface and exports also show the corresponding short tons of elemental carbon.
- FCO does not present elemental carbon as CO2e.

## Verification

- Automated API-handler tests cover official normalization, all exposed estimate types, groupings, counties, filters, evaluation-year discovery, and failure behavior.
- TypeScript compilation and the Vite production build are required before deployment.
- Live availability remains controlled by FIA's published evaluation groups and service response.

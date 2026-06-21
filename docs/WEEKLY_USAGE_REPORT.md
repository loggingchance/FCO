# FCO Weekly Usage Report

FCO includes anonymous aggregate usage reporting and a scheduled Monday email. It records product events, not people: page views, successful and failed estimates, comparisons, exports, feedback-link use, states, estimate types, groupings, years, and export formats.

FCO does not store analytics cookies, user identities, email addresses, or IP addresses in the usage data.

## Services

The implementation uses:

- Upstash Redis to retain weekly aggregate counters.
- Resend to deliver the weekly email.
- Vercel Cron to run the report every Monday at 15:00 UTC.

Both Upstash and Resend offer free tiers suitable for beta testing.

## Vercel environment variables

For the guided setup, double-click `ACTIVATE_WEEKLY_REPORTING.cmd` in the project folder. It opens the two integrations and the correct FCO environment-variable page, generates `CRON_SECRET`, and copies the value to the clipboard.

Add these variables to the FCO Vercel project under **Settings > Environment Variables**:

```text
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
RESEND_API_KEY=re_your_resend_key
FCO_REPORT_FROM=FCO Reports <reports@your-verified-domain.com>
FCO_REPORT_EMAIL=steve@northeastforests.com
CRON_SECRET=a-long-random-secret
```

The Vercel-native Upstash integration may create `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or equivalent `STORAGE_*` variables when a custom prefix is used. FCO recognizes those names automatically; do not copy database secrets manually.

Apply each variable to Production, Preview, and Development if reports should operate in all environments. Production-only is recommended for usage reporting so test traffic is excluded.

After adding the variables, redeploy FCO. The cron schedule is defined in `frontend/vercel.json`.

## Email contents

The Monday email summarizes the previous ISO week and includes:

- Total recorded actions.
- Page views by page.
- Successful and failed estimates.
- Successful and failed comparisons.
- Exports by format.
- Feedback-link use.
- The most common state, geography, estimate, grouping, year, and format combinations.

## Failure behavior

Usage reporting never blocks the FCO interface. If Redis is unavailable, the event is discarded and the user's estimate continues normally. The weekly report endpoint requires `CRON_SECRET`; requests without it are rejected.

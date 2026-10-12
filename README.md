# Lease Redline

A website where anyone can upload a Letter of Intent (LOI) or commercial lease and get:

- a term-by-term review against the negotiation playbook (missing / negotiate / looks good)
- a list of LOI terms the lease changed or left out
- a ready-to-send email to the property manager

Visitors don't need any account. Hosting is on Cloudflare Pages (free). Reviews run on the site owner's Anthropic API key, about $0.20 each.

## What's in this repository

| File | What it does |
|---|---|
| `index.html` | The website people see |
| `lib/playbook.js` | **The negotiation rules.** Edit targets here; the site and the AI both use it |
| `functions/api/review.js` | Sends the documents to Claude and streams the review back (the API key stays hidden here) |

## Cloudflare settings

- Build command: *(none)* · Build output directory: `/`
- **Variables and Secrets** (Settings):
  - `ANTHROPIC_API_KEY` (Secret): the Anthropic key. Required.
  - `ACCESS_CODE` (optional): a code visitors must type before a review runs.
  - `CLAUDE_MODEL` (optional): defaults to `claude-sonnet-5-5`.
- After changing variables, retry the latest deployment so they take effect.

## Changing things later
- **Negotiation targets:** edit `lib/playbook.js` on GitHub. Cloudflare republishes automatically, at no cost.
- **Spending:** set a monthly spend limit at console.anthropic.com → Billing.
- **Limits:** each visitor can run about 8 reviews an hour; scanned PDFs read up to 5 pages.

## If something goes wrong
- *"The review service isn't set up yet"*: the `ANTHROPIC_API_KEY` secret is missing. Add it, then retry the deployment.
- *"Out of credit"*: add credits at console.anthropic.com.

This is general business guidance, not legal advice.

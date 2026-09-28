# TRACE Intelligence — ML baseline + optional grounded GenAI

Implemented path: mobile home → **MY INTELLIGENCE** → authenticated callable
getActivityInsight → private Firestore run summaries → 28-day pace baseline →
source-tagged comparisons. It works without a model API key after Firebase
configuration, with at least three valid preceding runs.

## Honest model status

The deployed predictor is a **prior-28-day mean pace baseline** from the
existing ML benchmark design. The sklearn research model in ml/pace_benchmark.py
is NOT deployed and no real-data accuracy score is claimed. This is a first
full-stack inference/evidence integration, not a clinical or training coach.

- Reads only the authenticated user's own Firestore activities, enforced by the
  callable and ownership verification; App Check is required.
- Selects the latest synced run (or an explicitly supplied owned activity ID).
- Reads at most 100 eligible prior runs, strictly before that run and within 28
  days; needs three to report a baseline.
- Filters implausible or incomplete summaries and produces traceable evidence.
- Sends **no GPS points, route artifacts, account identifiers, or precise
  timestamps** to any LLM.
- Never automatically invokes the generative provider.

The optional **OPT IN · GENERATE EXPLANATION** button calls
generateActivityInsight, which independently re-fetches the same server-side
facts and only sends short, aggregate evidence strings to the external model.
It validates an exact quote anchor before showing generated commentary.
Quotation matching does NOT prove the interpretation is correct.

## Setup

    npm install
    npm run test -w trace-functions
    npm run typecheck -w @trace/mobile

Configure native Firebase, Auth and App Check per docs/LOCAL_DEVELOPMENT.md.
Deploy the index, rules and functions:

    firebase deploy --only firestore:indexes,firestore:rules,functions

To enable the optional model function, explicitly configure the secret and
model before deployment:

    firebase functions:secrets:set OPENAI_API_KEY
    # In functions/.env (server only, gitignored):
    TRACE_LLM_MODEL=your-json-capable-model-id
    # Never use an EXPO_PUBLIC_ key or put provider credentials in the app.

The model function requires this secret binding; without a configured
provider, leave generation disabled/uninvoked. Deterministic insights never
require a provider. Ensure provider terms, permissions, consent notices and
data retention are reviewed before connecting real end users.

## Evaluation contract

functions/test/insightCore.test.cjs checks exclusion of future sessions,
28-day windows, unsupported activity types, insufficient history and exact
baseline arithmetic. The existing ml/ benchmark remains a separate
reproducible, user-disjoint research pipeline on explicitly consented data.
Test fixtures are not empirical evidence of predictive quality.

## Known limitations

- Activity metrics originate from user devices; they are not a validated
  external measurement source.
- The baseline is not personalized predictive ML and must not be presented as
  an injury, recovery, health or training prescription.
- Previous 100 run cap and explicit index are documented scaling limits.
- Live production provider, Firebase deployment and mobile device acceptance
  tests require operator configuration; this PR does not claim they occurred.

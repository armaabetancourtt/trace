<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Interception Engine

One of TRACE's signature interactions is **JOIN RUN**.

The engineering problem is not simply "show the other runner on a map." TRACE needs to estimate a useful meeting point.

## Inputs

- joining user's current position;
- active session position;
- remaining/planned route when available;
- active runner/group speed;
- joining user's estimated speed;
- pedestrian routing time in a production implementation.

## Starter heuristic

The repository includes a deterministic baseline in:

`packages/shared/src/interception.ts`

It evaluates future points on the remaining route and compares:

```text
runner ETA to point
vs.
joiner ETA to point
```

Arriving slightly early is preferred over arriving late.

## Why start deterministic?

A deterministic baseline is:
- explainable;
- testable;
- easy to compare with future models;
- honest when there is not yet enough product data for ML.

A later implementation can use Mapbox Directions/Matrix routing and historical pace confidence intervals.

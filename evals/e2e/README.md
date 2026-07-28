# E2E evals

Black-box end-to-end evals for `ris-cli`. They run the built CLI
(`dist/cli.js`) as a child process against the **live RIS OGD API** and check
pre-declared expectations per case.

They are intentionally not part of `pnpm test`: they need network access, they
depend on live data, and single cases can flake when the API is slow. Run them
on demand, for example before a release or after adapter changes.

## Run

```bash
pnpm eval:e2e                # build + run all cases
tsx evals/e2e/run.ts --list  # list case ids
tsx evals/e2e/run.ts --only vwgh   # run matching cases only
```

The runner executes cases sequentially (gentle on the API), retries each
failed case once to absorb transient network errors, prints PASS/FAIL per
case, writes `evals/e2e/report.json` (gitignored), and exits non-zero when any
case fails.

## Case set

| Area             | Cases                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Justiz (default) | well-formed results, newest-first sorting, `--court` filter, date filter, offset pagination, empty result |
| Applications     | Vwgh (court + `JWT_` decision-text links), Bvwg (two known Geschaeftszahlen), Vfgh, Lvwg, Dsk, Gbk, Pvak  |
| Option handling  | case-insensitive `-a`, clean error for unknown values                                                     |
| Bundesrecht      | GehG § 13d regression, `--with-full-text`                                                                 |

Expected values (court strings, known case numbers, document number prefixes)
were verified against the live API before being encoded in
[`cases.ts`](./cases.ts).

## Caveats

- Known-decision cases (`bvwg-known-decisions`, `bundesrecht-gehg-13d`) pin
  live data. If RIS removes or renames those documents, update the case, not
  the adapter.
- `search --with-summary` is not covered: it depends on a configured summary
  provider (local model or API key).
- Live hit counts change over time; cases therefore assert structure and
  known anchors, never exact totals.

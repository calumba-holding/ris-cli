---
title: "ris-cli search: RIS-Judikatur-Applikationen (VwGH/BVwG/…)"
status: done
created: "2026-07-27T12:00:00+02:00"
updated: "2026-07-28T12:12:00+02:00"
source_goal: "Baue einen --application-Parameter für die search-Funktion ein, dann ist die komplette Beamten-Judikatur (VwGH/BVwG) direkt über die CLI abfragbar."
---

# ISA: ris-cli search über alle RIS-Judikatur-Applikationen

## Problem

`ris-cli search` fragt ausschließlich die Applikation `Justiz` (OGH/OLG/LG/BG) ab.
Verwaltungsjudikatur (VwGH, BVwG, VfGH, LVwG …) ist über die CLI nicht erreichbar,
obwohl die RIS-API v2.6 sie über denselben Judikatur-Endpoint anbietet. Zusätzlich
scheitert die CLI hinter HTTPS-CONNECT-Proxys mit HTTP 405, weil das Lockfile
axios 1.13.6 auflöst (kaputtes HTTPS-Proxy-Handling vor 1.16.1).

## Ideal State

Eine Nutzerin wählt per `-a/--application` die Judikatur-Applikation; Treffer
zeigen das korrekte Gericht und verlinken bevorzugt den Entscheidungs-Volltext.
Ohne die Option verhält sich die CLI exakt wie bisher. Die CLI funktioniert auch
hinter einem HTTPS-CONNECT-Proxy.

## Out of Scope

- Keine Änderungen an `sync`, `notify`, `onboard` und `bundesrecht`.
- Keine applikationsspezifischen Zusatzfilter (Norm, Index, Sammlungsnummer).
- Kein Release/Versionsbump (nur CHANGELOG unter "Unreleased").

## Constraints

- Default bleibt `Justiz`; bestehende Optionssemantik bleibt unverändert.
- ISC-IDs dieser ISA bleiben stabil; kein Renumbering.
- `pnpm build` (inkl. DTS) muss fehlerfrei bleiben.

## Dependencies

- RIS-OGD-API v2.6 (data.bka.gv.at), erreichbar zur Laufzeit der Live-Probes.
- Push-/PR-Rechte auf calumba-holding/ris-cli.

## Goal

> "Baue einen --application-Parameter für die search-Funktion ein, dann ist die
> komplette Beamten-Judikatur (VwGH/BVwG) direkt über die CLI abfragbar."

`ris-cli search` akzeptiert `-a/--application` mit den Werten Justiz (Default),
Vwgh, Vfgh, Bvwg, Lvwg, Dsk, Gbk, Pvak, liefert applikationskorrekte Treffer und
ist per Unit- und Live-Probes verifiziert; die Änderung ist via PR in main gemergt.

## Criteria

- [x] ISC-1: `ris-cli search "Urlaubsersatzleistung" -a Vwgh --limit 3` liefert
      mindestens einen Treffer mit Court "Verwaltungsgerichtshof (VwGH)".
- [x] ISC-2: Rechtssatz-Treffer aus ISC-1 verlinken den Entscheidungs-Volltext
      (Dokumentnummer `JWT_…`), nicht das Rechtssatz-Dokument (`JWR_…`).
- [x] ISC-3: `ris-cli search "Karenzurlaub Beschäftigungsverbot Unterbrechung"
-a Bvwg --limit 5` liefert die Geschäftszahlen W262 2314253-1 und
      W122 2001512-1 mit Court "Bundesverwaltungsgericht".
- [x] ISC-4: Requests an Nicht-Justiz-Applikationen enthalten `Gericht` nicht als
      Parameter — auch dann nicht, wenn `--court` gesetzt ist.
      _(Angepasst 2026-07-28, siehe Learning Log: `Dokumenttyp.SucheInEntscheidungstexten`
      ist laut Handbuch v2.6 und Live-Probe für alle 8 Applikationen der gültige
      Volltext-Schalter und bleibt daher für alle Applikationen gesetzt.)_
- [x] ISC-5: Requests an Vwgh und Vfgh enthalten den wirksamen Volltext-Schalter
      `Dokumenttyp.SucheInEntscheidungstexten=true` und senden kein
      `Dokumenttyp.SucheInTexten`.
      _(Angepasst 2026-07-28, siehe Learning Log: `SucheInTexten` existiert in der
      OGD-API v2.6 nicht und wird von der API stillschweigend ignoriert.)_
- [x] ISC-6: Applikationswerte werden case-insensitiv akzeptiert
      (`-a bvwg` ≡ `-a Bvwg`).
- [x] ISC-7: Ein unbekannter Wert (`-a Foo`) erzeugt eine Fehlermeldung, die alle
      gültigen Werte auflistet, ohne Stacktrace.
- [x] ISC-8: Anti: Ohne `-a` sind die gesendeten Request-Parameter identisch zum
      Stand von main (der bestehende Justiz-Parameter-Test besteht unverändert).
- [x] ISC-9: Anti: `ris-cli bundesrecht "GehG § 13d" --limit 2` liefert weiterhin
      GehG-§-13d-Treffer (Gesetzesnummer 10008163).
- [x] ISC-10: `pnpm test` besteht vollständig, inklusive neuer Tests für
      ISC-4, ISC-5 und das Vwgh-Ergebnis-Mapping (Gericht aus dem
      applikationsspezifischen Unterobjekt, z.B. `Judikatur.Vwgh.Gericht`).
- [x] ISC-11: Das Lockfile löst axios auf eine Version ≥ 1.16.1 auf.
- [x] ISC-12: README dokumentiert die Option mit Beispielen und dem Hinweis, dass
      `--court` nur für Justiz wirkt; CHANGELOG hat einen "Unreleased"-Eintrag.
      _(Angepasst 2026-07-28, siehe Learning Log: Lvwg hat in der OGD-API keinen
      `Gericht`-Suchparameter, sondern filtert per `Bundesland`.)_
- [x] ISC-13: Der PR ist mit grünem CI in main gemergt; der Feature-Branch ist
      gelöscht.

## Verification Plan

| ISC    | Probe                                                                           | Pass condition                                                                      | Evidence location   |
| ------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------- |
| ISC-1  | Live-CLI-Aufruf `search "Urlaubsersatzleistung" -a Vwgh --limit 3`              | ≥1 Treffer, Court = "Verwaltungsgerichtshof (VwGH)"                                 | Verification/ISC-1  |
| ISC-2  | URLs der ISC-1-Treffer inspizieren                                              | Dokumentnummer beginnt mit `JWT_`                                                   | Verification/ISC-2  |
| ISC-3  | Live-CLI-Aufruf mit der genannten Query, `-a Bvwg --limit 5`                    | GZ W262 2314253-1 und W122 2001512-1 in der Ausgabe                                 | Verification/ISC-3  |
| ISC-4  | Unit-Test: gemockter fetch, Bvwg-Suche mit gesetztem `gericht`, Params asserten | `Gericht` fehlt im Request                                                          | Verification/ISC-4  |
| ISC-5  | Unit-Test: gemockter fetch, Vwgh-/Vfgh-Suche, Params asserten                   | `Dokumenttyp.SucheInEntscheidungstexten` = "true", kein `Dokumenttyp.SucheInTexten` | Verification/ISC-5  |
| ISC-6  | CLI-Aufrufe `-a bvwg` und `-a Bvwg` vergleichen                                 | Identisches Applikation-Param im Request/identische Trefferliste                    | Verification/ISC-6  |
| ISC-7  | CLI-Aufruf `-a Foo`                                                             | Meldung listet alle 8 Werte; kein Stacktrace in stderr                              | Verification/ISC-7  |
| ISC-8  | Bestehenden Justiz-Parameter-Test unverändert ausführen                         | Test grün ohne Anpassung seiner Assertions                                          | Verification/ISC-8  |
| ISC-9  | Live-CLI-Aufruf `bundesrecht "GehG § 13d" --limit 2`                            | Treffer "Gehaltsgesetz 1956 – § 13d", Law number 10008163                           | Verification/ISC-9  |
| ISC-10 | `pnpm test`                                                                     | Exit-Code 0, 0 failed, neue Tests enthalten                                         | Verification/ISC-10 |
| ISC-11 | `pnpm why axios` bzw. Lockfile prüfen                                           | aufgelöste Version ≥ 1.16.1                                                         | Verification/ISC-11 |
| ISC-12 | README/CHANGELOG-Diff lesen                                                     | Beispiele + `--court`-Hinweis + Unreleased-Eintrag vorhanden                        | Verification/ISC-12 |
| ISC-13 | PR-Status via gh abfragen                                                       | PR merged, CI success, Branch gelöscht                                              | Verification/ISC-13 |

## Work Breakdown

| Work unit       | Outcome                                                                                                | Satisfies          | Depends on |
| --------------- | ------------------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| Types + Options | `JUDIKATUR_APPLICATIONS`-Konstante, `SearchOptions.application`                                        | ISC-6, ISC-7       | None       |
| Adapter         | Applikationsbewusste Params + Ergebnis-Mapping (Unterobjekt-Gericht, `EntscheidungstextUrl`-Präferenz) | ISC-1–ISC-5, ISC-8 | Types      |
| CLI-Option      | `-a/--application` mit Validierung                                                                     | ISC-6, ISC-7       | Types      |
| axios-Bump      | Lockfile ≥ 1.16.1                                                                                      | ISC-11             | None       |
| Tests + Doku    | Neue Unit-Tests, README, CHANGELOG                                                                     | ISC-10, ISC-12     | Adapter    |
| PR + Merge      | Änderung auf main                                                                                      | ISC-13             | alle       |

## Decisions

- 2026-07-27: Applikationsliste auf die 8 Judikatur-Applikationen der RIS-API
  beschränkt; Normen-/Index-Filter bewusst Out of Scope.
- 2026-07-27: Bei Vwgh-Rechtssätzen wird `EntscheidungstextUrl` (JWT\_…) als
  Ergebnis-URL bevorzugt — analog zur bestehenden JJT-vor-JJR-Logik bei Justiz.
- 2026-07-27: axios-Bump ist Teil des Done-Begriffs, weil 1.13.6 hinter
  HTTPS-CONNECT-Proxys reproduzierbar mit HTTP 405 scheitert.
- 2026-07-27: Annahme: Für Bvwg/Lvwg existiert kein SucheInTexten-Schalter; die
  API ignoriert unbekannte Parameter stillschweigend, Volltextsuche ist dort
  Default. Falls eine Probe das widerlegt → Learning Log + ISC anpassen.
- 2026-07-28: `Dokumenttyp.SucheInEntscheidungstexten=true` wird für alle
  Applikationen gesendet (nicht nur Justiz), weil Handbuch und Live-Probes ihn
  als überall gültigen Volltext-Schalter bestätigen; damit bleibt das
  Justiz-Default-Verhalten trivially unverändert (ISC-8).
- 2026-07-28: `Gericht` wird nur für Justiz gesendet; Lvwg-Bundesland-Filter
  bleibt Out of Scope (kein applikationsspezifischer Zusatzfilter).

## Learning Log

- 2026-07-28: Live-Probe Vwgh "Urlaubsersatzleistung": ohne Dokumenttyp-Parameter
  40 Treffer, mit `Dokumenttyp.SucheInTexten=true` ebenfalls 40 (Parameter wird
  ignoriert), mit `Dokumenttyp.SucheInEntscheidungstexten=true` 90 Treffer.
  Offizielles OGD-RIS-API-Handbuch V2_6 (im Repo unter
  `docs/official-ogd-ris-api-handbuch-v2.6.md`) listet für VfGH und VwGH:
  `Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |
"SucheInEntscheidungstexten"="true"), Opt)` — ein `SucheInTexten` existiert in
  v2.6 nicht. → ISC-5 angepasst.
- 2026-07-28: Handbuch: `Dokumenttyp.SucheInRechtssaetzen|SucheInEntscheidungstexten`
  ist für alle 8 Judikatur-Applikationen dokumentiert. → ISC-4 angepasst: nur
  `Gericht` ist Justiz-spezifisch; der Volltext-Schalter bleibt überall gesetzt.
- 2026-07-28: Live-Probe Lvwg mit `Gericht=Landesverwaltungsgericht Wien` lieferte
  Treffer des LVwG Niederösterreich (Parameter ignoriert); Handbuch: Lvwg filtert
  per `Bundesland`, ein `Gericht`-Suchparameter existiert nur für Justiz.
  → ISC-12-Hinweis angepasst auf "nur Justiz".
- 2026-07-28: Live-Probe Bvwg mit `Dokumenttyp.SucheInEntscheidungstexten=true`:
  identische 4 Treffer wie ohne Parameter (inkl. W262 2314253-1 und
  W122 2001512-1) — der Schalter ist für Bvwg harmlos und konsistent.

## Verification

<!-- Vor dem Abhaken jeder ISC hier eintragen: Probe, Observed, Pass condition,
     Evidence (Kommando-Output zitieren), Checked (Timestamp). -->

### ISC-1 — Vwgh-Suche liefert VwGH-Treffer

- Probe: `node dist/cli.js search "Urlaubsersatzleistung" -a Vwgh --limit 3 --json`
- Pass condition: ≥1 Treffer, Court = "Verwaltungsgerichtshof (VwGH)"
- Observed: 3 Treffer, alle mit `"court": "Verwaltungsgerichtshof (VwGH)"`.
- Evidence: `"title": "Ra 2025/08/0088", "court": "Verwaltungsgerichtshof (VwGH)",
"date": "2026-02-26"`; ebenso Ro 2025/08/0002 (2026-01-28) und
  Ra 2025/08/0057 (2025-08-25).
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-2 — Treffer verlinken Entscheidungs-Volltext (JWT\_…)

- Probe: URLs der ISC-1-Treffer inspiziert.
- Pass condition: Dokumentnummer beginnt mit `JWT_`.
- Observed: Alle 3 URLs zeigen auf `JWT_…`, keine `JWR_…`:
  `…Dokumentnummer=JWT_2025080088_20260226L00`,
  `…JWT_2025080002_20260128J00`, `…JWT_2025080057_20250825L00`.
  Zusätzlich sichert der Unit-Test "should map Vwgh results …" die
  `EntscheidungstextUrl`-Präferenz für JWR-Rechtssatz-Treffer ab
  (JWR-Fixture → Ergebnis-URL/ID `JWT_2025080088_20260226L00`).
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-3 — Bvwg-Suche liefert die erwarteten Geschäftszahlen

- Probe: `node dist/cli.js search "Karenzurlaub Beschäftigungsverbot Unterbrechung" -a Bvwg --limit 5 --json`
- Pass condition: GZ W262 2314253-1 und W122 2001512-1, Court "Bundesverwaltungsgericht".
- Observed: 4 Treffer, darunter
  `W262 2314253-1 | Bundesverwaltungsgericht | …BVWGT_20251215_W262_2314253_1_00`
  und `W122 2001512-1 | Bundesverwaltungsgericht | …BVWGT_20141024_W122_2001512_1_00`.
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-4 — Kein `Gericht` an Nicht-Justiz-Applikationen

- Probe: Unit-Test "should not send a Gericht param for non-Justiz applications"
  (Bvwg-Suche mit `gericht: "OGH"`, gemockter fetch).
- Pass condition: `Gericht` fehlt im Request.
- Observed: `expect(params).not.toHaveProperty("Gericht")` grün; Params enthalten
  `Applikation: "Bvwg"` und `Dokumenttyp.SucheInEntscheidungstexten: "true"`.
  `pnpm test`: 43 passed, 0 failed.
- Checked: 2026-07-28T12:05+02:00 → PASS

### ISC-5 — Wirksamer Volltext-Schalter für Vwgh/Vfgh

- Probe: Unit-Test "should send the full-text switch and no Justiz-only params
  for Vwgh and Vfgh" (gemockter fetch, beide Applikationen).
- Pass condition: `Dokumenttyp.SucheInEntscheidungstexten` = "true", kein
  `Dokumenttyp.SucheInTexten`, kein `Gericht`.
- Observed: Beide Assertions grün für Vwgh und Vfgh; `pnpm test`: 43 passed.
  Wirksamkeit live belegt (Learning Log: 90 statt 40 Treffer bei Vwgh).
- Checked: 2026-07-28T12:05+02:00 → PASS

### ISC-6 — Case-insensitive Applikationswerte

- Probe: `search … -a bvwg --json` und `search … -a Bvwg --json` per `diff`
  verglichen; zusätzlich Unit-Tests für `normalizeJudikaturApplication`.
- Pass condition: identische Trefferliste.
- Observed: `diff` meldet keine Abweichung ("IDENTICAL OUTPUT");
  `normalizeJudikaturApplication("bvwg") === "Bvwg"`, `("VWGH") === "Vwgh"`.
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-7 — Unbekannter Wert erzeugt saubere Fehlermeldung

- Probe: `node dist/cli.js search "Test" -a Foo --limit 2`
- Pass condition: Meldung listet alle 8 Werte, kein Stacktrace.
- Observed: Ausgabe exakt:
  `❌ Unknown application "Foo". Valid values: Justiz, Vwgh, Vfgh, Bvwg, Lvwg, Dsk, Gbk, Pvak`
  — kein Stacktrace, Exit-Code 1.
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-8 — Anti: Default-Verhalten unverändert

- Probe: Bestehender Test "should send Justiz application, server-side sorting,
  paging, and court filter params" unverändert ausgeführt (`git diff` enthält
  keine Änderung an seinen Assertions).
- Pass condition: Test grün ohne Anpassung seiner Assertions.
- Observed: Test grün in `pnpm test` (43 passed); ohne `application` liefert
  `buildSearchParams` weiterhin `Applikation: "Justiz"`,
  `Dokumenttyp.SucheInEntscheidungstexten: "true"`, `Gericht` bei gesetztem
  `--court` — identische Parametermenge wie auf main.
- Checked: 2026-07-28T12:05+02:00 → PASS

### ISC-9 — Anti: bundesrecht-Regression

- Probe: `node dist/cli.js bundesrecht "GehG § 13d" --limit 2 --json`
- Pass condition: Treffer "Gehaltsgesetz 1956 – § 13d", Law number 10008163.
- Observed: 2 Treffer, beide `Gehaltsgesetz 1956 – § 13d | 10008163`.
- Checked: 2026-07-28T12:06+02:00 → PASS

### ISC-10 — Testsuite vollständig grün inkl. neuer Tests

- Probe: `pnpm test` (zusätzlich voller `pnpm check` und `pnpm smoke`).
- Pass condition: Exit-Code 0, 0 failed, neue Tests enthalten.
- Observed: `Test Files 6 passed (6) / Tests 43 passed (43)` — inkl. der neuen
  Tests für ISC-4, ISC-5, das Vwgh-Mapping (Gericht aus `Judikatur.Vwgh.Gericht`,
  URL-Präferenz) und `normalizeJudikaturApplication`. `pnpm check` und
  `pnpm smoke` sowie `pnpm build` (inkl. DTS) fehlerfrei.
- Checked: 2026-07-28T12:05+02:00 → PASS

### ISC-11 — axios ≥ 1.16.1 im Lockfile

- Probe: `pnpm why axios` nach Bump von `^1.6.2` auf `^1.16.1`.
- Pass condition: aufgelöste Version ≥ 1.16.1.
- Observed: `axios@1.18.1 └── @calumba/ris-cli@1.1.3 (dependencies)`;
  `pnpm-lock.yaml` löst axios auf 1.18.1 auf.
- Checked: 2026-07-28T12:02+02:00 → PASS

### ISC-12 — README + CHANGELOG

- Probe: README-/CHANGELOG-Diff gelesen.
- Pass condition: Beispiele + `--court`-Hinweis (nur Justiz) + Unreleased-Eintrag.
- Observed: README-Abschnitt "Judikatur applications (`-a`/`--application`)" mit
  drei Beispielen (Vwgh, Bvwg, vfgh lowercase) und dem Hinweis "Note: `--court`
  only takes effect for the `Justiz` application …"; CHANGELOG "## Unreleased"
  mit vier Einträgen (Option, Mapping, Gericht-Einschränkung, axios).
- Checked: 2026-07-28T12:05+02:00 → PASS

### ISC-13 — PR gemergt

- Probe: `gh pr checks 3 --watch`, `gh pr merge 3 --squash --delete-branch`,
  `gh pr view 3 --json state,mergedAt,mergeCommit`,
  `gh api repos/calumba-holding/ris-cli/branches/feat/judikatur-applications`.
- Pass condition: PR merged, CI success, Branch gelöscht.
- Observed: CI-Checks "Check" (32s) und "Package smoke test" (21s) beide pass;
  `{"state":"MERGED","mergedAt":"2026-07-28T10:10:50Z",
"mergeCommit":"186f4d82bf16db1ca88b2da1d83ede684a4d2fdf"}`;
  Branch-Abfrage liefert HTTP 404 "Branch not found" (gelöscht).
- Checked: 2026-07-28T12:11+02:00 → PASS

# RIS API Dokumentation im Projekt

Diese Markdown-Dateien sammeln die **offiziell verifizierten** Unterlagen zur im Projekt verwendeten API:

- REST-Basis: `https://data.bka.gv.at/ris/api/v2.6/`
- offizielle Startseite: <https://data.bka.gv.at/ris/api/v2.6/>
- Help-Index: <https://data.bka.gv.at/ris/api/v2.6/Help>
- offizielles Handbuch (PDF): `OGD-RIS API Handbuch V2_6`
- offizielle Beispiele: `https://data.bka.gv.at/ris/api/v2.6/Content/Examples.zip`

## Projektbezug

`ris-cli` verwendet aktuell den Endpoint:

- `https://data.bka.gv.at/ris/api/v2.6/Judikatur`
- mit `Applikation=Justiz`

Siehe dazu auch `../src/adapters/ris.ts`.

## Dateien in diesem Ordner

### Offizielle Doku

- [`official-ogd-ris-api-handbuch-v2.6.md`](./official-ogd-ris-api-handbuch-v2.6.md) — Markdown-Kopie des offiziellen PDF-Handbuchs
- [`ris-api-overview.md`](./ris-api-overview.md) — kompakter Überblick über Endpunkte, Quellen, Formate und Besonderheiten
- [`ris-api-endpoints-catalog.md`](./ris-api-endpoints-catalog.md) — kompletter Katalog der offiziellen Top-Level-Endpunkte und Applikationen
- [`ris-api-judikatur-justiz.md`](./ris-api-judikatur-justiz.md) — die für dieses Projekt relevante Doku zu `Judikatur` / `Applikation=Justiz`
- [`judikatur/README.md`](./judikatur/README.md) — kurze Referenzen für alle Judikatur-Applikationen
- [`sonstige/README.md`](./sonstige/README.md) — kurze Referenzen für alle Sonstige-Applikationen

### Beispiele

- [`examples/official-examples-index.md`](./examples/official-examples-index.md) — Übersicht der offiziellen Beispielseiten aus `Examples.zip`
- [`examples/version.md`](./examples/version.md) — minimales Beispiel für den `Version`-Endpoint
- [`examples/judikatur-justiz-get.md`](./examples/judikatur-justiz-get.md) — GET-Beispiele für `Judikatur?Applikation=Justiz`
- [`examples/judikatur-justiz-post.md`](./examples/judikatur-justiz-post.md) — POST-Beispiele für `Judikatur` mit `application/x-www-form-urlencoded`
- [`examples/other-top-level-endpoints.md`](./examples/other-top-level-endpoints.md) — live verifizierte Beispiele für `Bundesrecht`, `Landesrecht`, `Gemeinden`, `Bezirke`, `Sonstige` und `History`

## Verifikation

Geprüft wurden direkt gegen die offiziellen Quellen:

- `GET https://data.bka.gv.at/ris/api/v2.6/` → erreichbar
- `GET https://data.bka.gv.at/ris/api/v2.6/Help` → erreichbar
- `GET https://data.bka.gv.at/ris/api/v2.6/Version` → liefert `{"OgdSearchResult":{"Version":"2.6"}}`
- `GET/POST https://data.bka.gv.at/ris/api/v2.6/Judikatur` → liefert JSON-Ergebnisse

Stand der Prüfung: 2026-03-21.

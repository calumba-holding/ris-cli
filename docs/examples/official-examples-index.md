# Offizielle RIS API Beispielseiten (`Examples.zip`)

Quelle:
- <https://data.bka.gv.at/ris/api/v2.6/Content/Examples.zip>

Die ZIP-Datei enthält eine kleine offizielle HTML-Beispielanwendung. Für dieses Projekt ist vor allem `justiz.html` relevant.

## Gruppen laut `index.html`

### Bundesrecht
- `bundesnormen.html`
- `bgblauth.html`
- `bgblpdf.html`
- `bgblalt.html`
- `begut.html`
- `regv.html`
- `erv.html`

### Landesrecht
- `landesnormen.html`
- `lgblauth.html`
- `lgbl.html`
- `lgblno.html`
- `vbl.html`

### Bezirke
- `bvb.html`

### Gemeinden
- `gr.html`
- `gra.html`

### Judikatur
- `vfgh.html`
- `vwgh.html`
- `normenliste.html`
- `justiz.html`
- `bvwg.html`
- `lvwg.html`
- `dsk.html`
- `dok.html`
- `pvak.html`
- `gbk.html`
- `uvs.html`
- `asylgh.html`
- `ubas.html`
- `umse.html`
- `bks.html`
- `verg.html`

### Sonstige
- `pruefgewo.html`
- `avsv.html`
- `spg.html`
- `avn.html`
- `kmger.html`
- `upts.html`
- `mrp.html`
- `erlaesse.html`

### History / Info
- `history.html`
- `version.html`
- `index.html`

---

## Für `ris-cli` direkt relevant

### `justiz.html`
Offizielle Beispielseite für:

```text
POST /ris/api/v2.6/Judikatur
Applikation=Justiz
```

Dort sichtbar/verifiziert:
- `Applikation=Justiz`
- `Suchworte`
- `Geschaeftszahl`
- `Norm`
- `EntscheidungsdatumVon`
- `EntscheidungsdatumBis`
- `Rechtsgebiet`
- `Fachgebiet`
- `Gericht`
- `Rechtssatznummer`
- `Spruch`
- `RechtlicheBeurteilung`
- `Fundstelle`
- `Entscheidungsart`
- `AenderungenSeit.Periode`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `ImRisSeit`

Außerdem sieht man dort direkt die Enum-Werte für:
- `DokumenteProSeite`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `ImRisSeit`
- `Rechtsgebiet`
- `Fachgebiet`
- `Entscheidungsart`

### `version.html`
Minimales Beispiel für den `Version`-Endpoint.

---

## Wichtige technische Beobachtung

Die Example-UI schickt `justiz.html` per AJAX als `POST` an:

```text
ApiUrl + 'Judikatur'
```

mit `$(this).serialize()`.

Das bestätigt:
- `application/x-www-form-urlencoded` ist offiziell vorgesehen
- Punkt-Notation wie `Sortierung.SortedByColumn` funktioniert
- Paging und Sortierung werden direkt als Formularparameter übergeben

---

## Lokale abgeleitete Markdown-Beispiele

- [`version.md`](./version.md)
- [`judikatur-justiz-get.md`](./judikatur-justiz-get.md)
- [`judikatur-justiz-post.md`](./judikatur-justiz-post.md)
- [`other-top-level-endpoints.md`](./other-top-level-endpoints.md)

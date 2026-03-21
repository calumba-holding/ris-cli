# RIS API – kompletter Endpoint-Katalog

Diese Datei ergänzt die Justiz-spezifische Doku um die **anderen offiziellen API-Endpunkte** der OGD RIS API v2.6.

Quellen:
- offizielles Handbuch `OGD-RIS API Handbuch V2_6`
- offizieller Help-Index: <https://data.bka.gv.at/ris/api/v2.6/Help>
- offizielle Example-UI aus `Examples.zip`

---

## Top-Level-Endpunkte

Laut Help-Index und Handbuch gibt es diese Hauptgruppen:

| Endpoint | Methoden | Zweck |
|---|---|---|
| `/Bundesrecht` | `GET`, `POST` | Bundesrecht und verwandte Bundes-Anwendungen |
| `/Landesrecht` | `GET`, `POST` | Landesrecht und Landesblätter |
| `/Bezirke` | `GET`, `POST` | Kundmachungen der Bezirksverwaltungsbehörden |
| `/Gemeinden` | `GET`, `POST` | Gemeinderecht und authentische Gemeindekundmachungen |
| `/Judikatur` | `GET`, `POST` | Gerichts- und Behördenentscheidungen |
| `/Sonstige` | `GET`, `POST` | sonstige Kundmachungen / Spezialanwendungen |
| `/History` | `GET`, `POST` | Änderungsverfolgung über Anwendungen hinweg |
| `/Version` | `GET` | API-Version |

Basis-URL:

```text
https://data.bka.gv.at/ris/api/v2.6/
```

---

## Controller → Applikationen

Diese Zuordnung ist im Handbuch aufgelistet.

### `/Bundesrecht`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `BrKons` | Bundesrecht konsolidiert | `bundesnormen.html` |
| `BgblAuth` | Bundesgesetzblatt authentisch ab 2004 | `bgblauth.html` |
| `BgblPdf` | Staats- und Bundesgesetzblatt 1945–2003 | `bgblpdf.html` |
| `BgblAlt` | Reichs-, Staats- und Bundesgesetzblatt 1848–1940 | `bgblalt.html` |
| `Begut` | Begutachtungsentwürfe | `begut.html` |
| `RegV` | Regierungsvorlagen | `regv.html` |
| `Erv` | Austrian Laws / englische Rechtsvorschriften | `erv.html` |

### `/Landesrecht`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `LrKons` | Landesrecht konsolidiert | `landesnormen.html` |
| `LgblAuth` | Landesgesetzblätter authentisch | `lgblauth.html` |
| `Lgbl` | Landesgesetzblätter nicht authentisch | `lgbl.html` |
| `LgblNO` | Landesgesetzblätter Niederösterreich | `lgblno.html` |
| `Vbl` | Verordnungsblätter der Länder | `vbl.html` |

### `/Bezirke`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `Bvb` | Kundmachungen der Bezirksverwaltungsbehörden | `bvb.html` |

### `/Gemeinden`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `Gr` | Gemeinderecht | `gr.html` |
| `GrA` | Gemeinderecht authentisch | `gra.html` |

### `/Judikatur`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `Vfgh` | Verfassungsgerichtshof | `vfgh.html` |
| `Vwgh` | Verwaltungsgerichtshof | `vwgh.html` |
| `Normenliste` | Normenliste des VwGH | `normenliste.html` |
| `Justiz` | OGH, OLG, LG, BG, OPMS, AUSL | `justiz.html` |
| `Bvwg` | Bundesverwaltungsgericht | `bvwg.html` |
| `Lvwg` | Landesverwaltungsgerichte | `lvwg.html` |
| `Dsk` | Datenschutzbehörde / Datenschutzkommission | `dsk.html` |
| `Dok` | Bundesdisziplinarbehörde / Disziplinarkommissionen | `dok.html` |
| `Pvak` | Personalvertretungsaufsichtsbehörde | `pvak.html` |
| `Gbk` | Gleichbehandlungskommission | `gbk.html` |
| `Uvs` | Unabhängige Verwaltungssenate | `uvs.html` |
| `AsylGH` | Asylgerichtshof | `asylgh.html` |
| `Ubas` | Unabhängiger Bundesasylsenat | `ubas.html` |
| `Umse` | Umweltsenat | `umse.html` |
| `Bks` | Bundeskommunikationssenat | `bks.html` |
| `Verg` | Vergabekontrollbehörden | `verg.html` |

### `/Sonstige`
| Applikation | Bedeutung | offizielle Beispielseite |
|---|---|---|
| `PruefGewO` | Prüfungsordnungen gemäß GewO / HBB | `pruefgewo.html` |
| `Avsv` | Amtliche Verlautbarungen der Sozialversicherung | `avsv.html` |
| `Spg` | Strukturpläne Gesundheit | `spg.html` |
| `Avn` | Amtliche Veterinärnachrichten | `avn.html` |
| `KmGer` | Kundmachungen der Gerichte | `kmger.html` |
| `Upts` | Parteien-Transparenz-Senat | `upts.html` |
| `Mrp` | Ministerratsprotokolle | `mrp.html` |
| `Erlaesse` | Erlässe der Bundesministerien | `erlaesse.html` |

### `/History`
Kein `Applikation`-Parameter, sondern:
- `Anwendung`

Mögliche Werte laut Handbuch / Example-UI u. a.:
- `AsylGH`
- `Avn`
- `Avsv`
- `Begut`
- `BgblAlt`
- `BgblAuth`
- `BgblPdf`
- `Bks`
- `Bundesnormen`
- `Bvb`
- `Bvwg`
- `Dok`
- `Dsk`
- `Erlaesse`
- `Erv`
- `Gemeinderecht`
- `GemeinderechtAuth`
- `Gbk`
- `Justiz`
- `KmGer`
- `Lgbl`
- `LgblAuth`
- `LgblNO`
- `Landesnormen`
- `Lvwg`
- `Mrp`
- `Normenliste`
- `PruefGewO`
- `Pvak`
- `RegV`
- `Spg`
- `Ubas`
- `Umse`
- `Upts`
- `Uvs`
- `Vbl`
- `Verg`
- `Vfgh`
- `Vwgh`

### `/Version`
Kein Applikationsparameter.

---

## Namens-Mapping: Beispielseite vs. API-Wert

Ein paar Namen unterscheiden sich zwischen sichtbarer Beispielseite und tatsächlichem Parameterwert:

| Sichtbarer Name | Endpoint | tatsächlicher Wert |
|---|---|---|
| Bundesnormen | `/Bundesrecht` | `Applikation=BrKons` |
| Landesnormen | `/Landesrecht` | `Applikation=LrKons` |
| Gemeinderecht authentisch | `/Gemeinden` | `Applikation=GrA` |
| History für Bundesnormen | `/History` | `Anwendung=Bundesnormen` |
| History für Landesnormen | `/History` | `Anwendung=Landesnormen` |
| History für Gemeinderecht authentisch | `/History` | `Anwendung=GemeinderechtAuth` |

---

## Gemeinsame Muster über fast alle Endpunkte

Wiederkehrende Parameter:
- `Applikation`
- `Suchworte`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `ImRisSeit`

Wiederkehrende Werte:

### `DokumenteProSeite`
- `Ten`
- `Twenty`
- `Fifty`
- `OneHundred`

### `Sortierung.SortDirection`
- `Ascending`
- `Descending`

### Zeiträume wie `ImRisSeit`, `AenderungenSeit.Periode`, `Kundmachung.Periode`
- `Undefined`
- `EinerWoche`
- `ZweiWochen`
- `EinemMonat`
- `DreiMonaten`
- `SechsMonaten`
- `EinemJahr`

---

## Repräsentative Beispiel-Requests

Für live verifizierte Beispiele der anderen Top-Level-Endpunkte siehe:
- [`examples/other-top-level-endpoints.md`](./examples/other-top-level-endpoints.md)

Für `Judikatur/Justiz` siehe:
- [`ris-api-judikatur-justiz.md`](./ris-api-judikatur-justiz.md)
- [`examples/judikatur-justiz-get.md`](./examples/judikatur-justiz-get.md)
- [`examples/judikatur-justiz-post.md`](./examples/judikatur-justiz-post.md)

## Kurzreferenzen pro Applikation

- Judikatur: [`judikatur/README.md`](./judikatur/README.md)
- Sonstige: [`sonstige/README.md`](./sonstige/README.md)

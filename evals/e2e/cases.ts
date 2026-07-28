// E2E eval cases for ris-cli.
//
// Each case runs the built CLI (dist/cli.js) as a black box against the live
// RIS OGD API and checks pre-declared expectations. Expected values (court
// strings, known Geschaeftszahlen, document number prefixes) were verified
// against the live API before being encoded here.

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  json?: any;
  durationMs: number;
}

export interface EvalCheck {
  name: string;
  /**
   * Throws (with a helpful message) when the check fails.
   * `secondary` is only set for cases with a `compareCommand`.
   */
  assert: (primary: CliResult, secondary?: CliResult) => void;
}

export interface EvalCase {
  id: string;
  description: string;
  command: string[];
  /** Optional second CLI invocation, passed to checks as `secondary`. */
  compareCommand?: string[];
  /** Expected process exit code (default 0). */
  expectExitCode?: number;
  /** Parse stdout as JSON into `result.json` (default true). */
  parseJson?: boolean;
  timeoutMs?: number;
  checks: EvalCheck[];
}

function fail(message: string): never {
  throw new Error(message);
}

function results(r: CliResult): any[] {
  if (!Array.isArray(r.json?.results)) {
    fail(
      `expected JSON output with a results array, got: ${r.stdout.slice(0, 200)}`,
    );
  }
  return r.json.results;
}

function minCount(n: number): EvalCheck {
  return {
    name: `at least ${n} result(s)`,
    assert: (r) => {
      if (results(r).length < n)
        fail(`expected >= ${n} results, got ${results(r).length}`);
    },
  };
}

function maxCount(n: number): EvalCheck {
  return {
    name: `at most ${n} result(s)`,
    assert: (r) => {
      if (results(r).length > n)
        fail(`expected <= ${n} results, got ${results(r).length}`);
    },
  };
}

function everyResult(
  name: string,
  predicate: (item: any) => boolean,
): EvalCheck {
  return {
    name,
    assert: (r) => {
      const items = results(r);
      if (items.length === 0) fail("no results to check");
      const bad = items.find((item) => !predicate(item));
      if (bad) fail(`failing result: ${JSON.stringify(bad).slice(0, 300)}`);
    },
  };
}

function someResult(
  name: string,
  predicate: (item: any) => boolean,
): EvalCheck {
  return {
    name,
    assert: (r) => {
      if (!results(r).some(predicate))
        fail(
          `no result matched; got: ${results(r)
            .map((item) => item.gz ?? item.title)
            .join(", ")}`,
        );
    },
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const evalCases: EvalCase[] = [
  // --- Justiz (default application, unchanged behavior) ---
  {
    id: "justiz-default-search",
    description: "Default search hits Justiz and returns well-formed results",
    command: ["search", "Cybermobbing", "--limit", "5", "--json"],
    checks: [
      minCount(1),
      maxCount(5),
      everyResult(
        "every result has a court",
        (item) => typeof item.court === "string" && item.court !== "Unknown",
      ),
      everyResult("every result has an ISO date", (item) =>
        ISO_DATE.test(item.date ?? ""),
      ),
      everyResult("every result links ris.bka.gv.at", (item) =>
        String(item.url).startsWith("https://www.ris.bka.gv.at/"),
      ),
    ],
  },
  {
    id: "justiz-sort-newest-first",
    description: "Justiz results are sorted by date descending",
    command: ["search", "Cybermobbing", "--limit", "10", "--json"],
    checks: [
      minCount(2),
      {
        name: "dates are non-increasing",
        assert: (r) => {
          const dates = results(r).map((item) => String(item.date));
          for (let i = 1; i < dates.length; i += 1) {
            if (dates[i] > dates[i - 1])
              fail(`dates out of order: ${dates[i - 1]} before ${dates[i]}`);
          }
        },
      },
    ],
  },
  {
    id: "justiz-court-filter",
    description: "--court OGH filters Justiz results to OGH",
    command: [
      "search",
      "Verhetzung",
      "--court",
      "OGH",
      "--limit",
      "5",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult("every court is OGH", (item) => item.court === "OGH"),
    ],
  },
  {
    id: "justiz-date-filter",
    description: "--from-date/--to-date restrict results to 2023",
    command: [
      "search",
      "Beleidigung",
      "--from-date",
      "2023-01-01",
      "--to-date",
      "2023-12-31",
      "--limit",
      "5",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult("every date is in 2023", (item) =>
        String(item.date).startsWith("2023"),
      ),
    ],
  },
  {
    id: "justiz-offset-pagination",
    description: "Offset returns the same window as slicing a larger page",
    command: ["search", "Vertrag", "--limit", "5", "--json"],
    compareCommand: [
      "search",
      "Vertrag",
      "--limit",
      "3",
      "--offset",
      "2",
      "--json",
    ],
    checks: [
      {
        name: "offset 2 matches results[2..4] of the unpaged call",
        assert: (r, offsetRun) => {
          const expected = results(r)
            .slice(2, 5)
            .map((item) => item.id);
          const actual = results(offsetRun!).map((item) => item.id);
          if (JSON.stringify(expected) !== JSON.stringify(actual))
            fail(
              `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
            );
        },
      },
    ],
  },
  {
    id: "empty-result",
    description: "A nonsense query returns zero results and exit code 0",
    command: ["search", "xyzzyqwertz123abc", "--limit", "3", "--json"],
    checks: [
      {
        name: "count is 0 and results are empty",
        assert: (r) => {
          if (r.json?.count !== 0 || results(r).length !== 0)
            fail(`expected empty result, got count=${r.json?.count}`);
        },
      },
    ],
  },

  // --- Judikatur applications ---
  {
    id: "vwgh-court-and-decision-text",
    description:
      "Vwgh results carry the VwGH court and link decision texts (JWT_)",
    command: [
      "search",
      "Urlaubsersatzleistung",
      "-a",
      "Vwgh",
      "--limit",
      "3",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult(
        "every court is Verwaltungsgerichtshof (VwGH)",
        (item) => item.court === "Verwaltungsgerichtshof (VwGH)",
      ),
      everyResult("every URL links a JWT_ decision text", (item) =>
        String(item.url).includes("Dokumentnummer=JWT_"),
      ),
    ],
  },
  {
    id: "bvwg-known-decisions",
    description: "Bvwg search finds two known Geschaeftszahlen",
    command: [
      "search",
      "Karenzurlaub Beschäftigungsverbot Unterbrechung",
      "-a",
      "Bvwg",
      "--limit",
      "5",
      "--json",
    ],
    checks: [
      everyResult(
        "every court is Bundesverwaltungsgericht",
        (item) => item.court === "Bundesverwaltungsgericht",
      ),
      someResult(
        "finds W262 2314253-1",
        (item) => item.gz === "W262 2314253-1",
      ),
      someResult(
        "finds W122 2001512-1",
        (item) => item.gz === "W122 2001512-1",
      ),
    ],
  },
  {
    id: "vfgh-search",
    description: "Vfgh results carry the VfGH court",
    command: [
      "search",
      "Legalitätsprinzip",
      "-a",
      "Vfgh",
      "--limit",
      "3",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult(
        "every court is Verfassungsgerichtshof (VfGH)",
        (item) => item.court === "Verfassungsgerichtshof (VfGH)",
      ),
    ],
  },
  {
    id: "lvwg-search",
    description: "Lvwg results carry a Landesverwaltungsgericht court",
    command: ["search", "Hundehaltung", "-a", "Lvwg", "--limit", "3", "--json"],
    checks: [
      minCount(1),
      everyResult("every court starts with Landesverwaltungsgericht", (item) =>
        String(item.court).startsWith("Landesverwaltungsgericht"),
      ),
    ],
  },
  {
    id: "dsk-search",
    description: "Dsk search returns data-protection authority decisions",
    command: ["search", "Datenschutz", "-a", "Dsk", "--limit", "3", "--json"],
    checks: [
      minCount(1),
      everyResult(
        "every result has a real court",
        (item) => typeof item.court === "string" && item.court !== "Unknown",
      ),
      everyResult("every URL queries the Dsk application", (item) =>
        String(item.url).includes("Abfrage=Dsk"),
      ),
    ],
  },
  {
    id: "gbk-search",
    description: "Gbk search returns equal-treatment commission decisions",
    command: [
      "search",
      "Diskriminierung",
      "-a",
      "Gbk",
      "--limit",
      "3",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult("every court is a Gleichbehandlungskommission", (item) =>
        String(item.court).includes("leichbehandlungskommission"),
      ),
    ],
  },
  {
    id: "pvak-search",
    description: "Pvak search returns staff-representation oversight decisions",
    command: [
      "search",
      "Personalvertretung",
      "-a",
      "Pvak",
      "--limit",
      "3",
      "--json",
    ],
    checks: [
      minCount(1),
      everyResult("every court starts with Personalvertretungs", (item) =>
        String(item.court).startsWith("Personalvertretungs"),
      ),
    ],
  },

  // --- Option handling ---
  {
    id: "application-case-insensitive",
    description: "-a bvwg and -a Bvwg return identical results",
    command: [
      "search",
      "Karenzurlaub Beschäftigungsverbot Unterbrechung",
      "-a",
      "bvwg",
      "--limit",
      "5",
      "--json",
    ],
    compareCommand: [
      "search",
      "Karenzurlaub Beschäftigungsverbot Unterbrechung",
      "-a",
      "Bvwg",
      "--limit",
      "5",
      "--json",
    ],
    checks: [
      {
        name: "results are identical",
        assert: (r, other) => {
          const a = JSON.stringify(results(r));
          const b = JSON.stringify(results(other!));
          if (a !== b) fail("lowercase and canonical runs differ");
        },
      },
    ],
  },
  {
    id: "unknown-application-error",
    description: "-a Foo fails cleanly and lists all valid values",
    command: ["search", "Test", "-a", "Foo", "--limit", "2"],
    expectExitCode: 1,
    parseJson: false,
    checks: [
      {
        name: "error lists all eight applications",
        assert: (r) => {
          const output = r.stdout + r.stderr;
          for (const app of [
            "Justiz",
            "Vwgh",
            "Vfgh",
            "Bvwg",
            "Lvwg",
            "Dsk",
            "Gbk",
            "Pvak",
          ]) {
            if (!output.includes(app)) fail(`missing "${app}" in: ${output}`);
          }
        },
      },
      {
        name: "no stack trace",
        assert: (r) => {
          if (/\n\s+at /.test(r.stdout + r.stderr))
            fail("output contains a stack trace");
        },
      },
    ],
  },

  // --- Bundesrecht (regression guard) ---
  {
    id: "bundesrecht-gehg-13d",
    description: "bundesrecht finds GehG § 13d (law number 10008163)",
    command: ["bundesrecht", "GehG § 13d", "--limit", "2", "--json"],
    checks: [
      minCount(1),
      everyResult("every title names the Gehaltsgesetz", (item) =>
        String(item.title).includes("Gehaltsgesetz"),
      ),
      everyResult(
        "every law number is 10008163",
        (item) => item.lawNumber === "10008163",
      ),
    ],
  },
  {
    id: "bundesrecht-full-text",
    description: "bundesrecht --with-full-text fetches the provision text",
    command: [
      "bundesrecht",
      "BDG § 3",
      "--with-full-text",
      "--limit",
      "1",
      "--json",
    ],
    timeoutMs: 90000,
    checks: [
      minCount(1),
      everyResult(
        "every result carries a non-trivial fullText",
        (item) =>
          typeof item.fullText === "string" && item.fullText.length > 100,
      ),
    ],
  },
];

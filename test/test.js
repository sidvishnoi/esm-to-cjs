const supported = require("./supported");
const bad = require("./bad");

const stats = {
  total: 0,
  run: 0,
  passed: 0,
  failed: 0,
  failing: []
};

supported(stats);
bad(stats);

if (stats.failed) {
  console.log(
    [
      "",
      "Summary:",
      `❌  Passed: ${stats.passed} / ${stats.total}`,
      stats.run !== stats.total
        ? ` (⚠  Skipped: ${stats.total - stats.run})`
        : ""
    ].join("\n")
  );
  process.exit(1);
} else {
  console.log(`\n✅  ${stats.passed} of ${stats.total} tests passed.`);
  if (stats.run !== stats.total) {
    console.log(`⚠  Skipped: ${stats.total - stats.run}`);
  }
}

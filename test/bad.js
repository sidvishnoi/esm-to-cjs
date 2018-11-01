const { readFileSync } = require("fs");
const { join } = require("path");

const { runTransform } = require("../src/core");

module.exports = main;

function main(stats) {
  const str = readFileSync(join(__dirname, "./fixtures/bad.txt"), "utf8");
  const failing = [];
  for (const fixture of getFixtures(str)) {
    ++stats.total;
    if (fixture.skip) continue;
    ++stats.run;
    try {
      runTransform(fixture.input, fixture.options);
      ++stats.failed;
      failing.push(fixture);
    } catch (err) {
      ++stats.passed;
      console.log(`✔  throws when ${fixture.title}`);
    }
  }
  printFailing(failing);
}

function printFailing(failing) {
  const colors = {
    bgRed: "\x1b[41m",
    fgRed: "\x1b[31m",
    fgWhite: "\x1b[37m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    reset: "\x1b[0m"
  };
  const str = [];
  const style2 = "=".repeat(60);
  failing.forEach(fixture => {
    str.push(
      [
        "",
        colors.fgRed + style2,
        `>> bad.txt #${fixture.line} (test #${fixture.testId})`,
        ` @ ${fixture.title}`,
        "expected to throw",
        style2 + colors.reset
      ].join("\n")
    );
    console.log(str.join("\n"));
  });
}

function* getFixtures(str) {
  const lines = str.split("\n");
  for (let i = 0, length = lines.length, testId = 0; i < length; ++i) {
    const lineStart = i;
    if (!lines[i]) break;
    const { title, skip, ...options } = JSON.parse(lines[i]);
    i += 2;
    let j = i;
    i = lines.indexOf("======", i);
    const input = lines.slice(j, i).join("\n");
    ++testId;
    yield {
      skip: skip === true,
      line: lineStart + 1,
      title,
      input,
      options,
      testId
    };

    if (!lines[i].startsWith("======")) break;
  }
}

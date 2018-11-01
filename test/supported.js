const { readFileSync } = require("fs");
const { join } = require("path");
const Table = require("easy-table");

const { runTransform } = require("../src/core");

module.exports = main;

function main(stats) {
  const fixtures = readFileSync(
    join(__dirname, "./fixtures/supported.txt"),
    "utf8"
  );
  const failing = [];
  for (const fixture of getFixtures(fixtures)) {
    ++stats.total;
    if (fixture.skip) continue;
    ++stats.run;
    const result = runTransform(fixture.input, fixture.options).trim();
    if (result === fixture.expected.trim()) {
      console.log(`✔  ${fixture.title}`);
      ++stats.passed;
    } else {
      ++stats.failed;
      fixture.fail = true;
      fixture.actual = result;
      failing.push(fixture);
    }
  }
  printFailing(failing);
}

function printFailing(failing) {
  const str = [];
  const colors = {
    bgRed: "\x1b[41m",
    fgRed: "\x1b[31m",
    fgWhite: "\x1b[37m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    reset: "\x1b[0m"
  };
  failing.forEach(fixture => {
    const expectation = fixture.expected.split("\n");
    const reality = fixture.actual.split("\n");
    const maxLen = Math.max(expectation.length, reality.length);
    reality.push(..." ".repeat(maxLen - reality.length).split(" "));
    expectation.push(..." ".repeat(maxLen - expectation.length).split(" "));

    const table = new Table();

    let printLen = 0,
      printLen1 = 0,
      printLen2 = 0;
    expectation.forEach((_, i) => {
      const color = expectation[i] !== reality[i] ? colors.bgRed : "";
      table.cell("expectation", color + expectation[i] + colors.reset);
      table.cell("reality", color + reality[i] + colors.reset);
      printLen1 = Math.max(printLen1, expectation[i].length);
      printLen2 = Math.max(printLen2, reality[i].length);
      printLen = Math.max(printLen, printLen1 + printLen2 + 2);
      table.newRow();
    });

    const style1 = "-".repeat(printLen);
    const style2 = "=".repeat(printLen);

    str.push(
      [
        "",
        colors.fgRed + style2,
        `>> supported.txt #${fixture.line} (test #${fixture.testId})`,
        ` @ ${fixture.title}`,
        style1 + colors.reset,
        fixture.input,
        style1,
        table.toString(),
        colors.fgRed + style2 + colors.reset
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
    let j = lines.indexOf("---", i);
    const input = lines.slice(i, j).join("\n");
    i = j + 1;
    j = lines.indexOf("======", i);
    const expected = lines.slice(i, j).join("\n");
    i = j;
    ++testId;
    yield {
      skip,
      line: lineStart + 1,
      title,
      input,
      options,
      expected,
      testId
    };

    if (!lines[i].startsWith("======")) break;
  }
}

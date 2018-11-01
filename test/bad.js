const { readFileSync } = require("fs");
const { join } = require("path");

const { runTransform } = require("../src/core");

module.exports = main;

function main(stats) {
  const str = readFileSync(join(__dirname, "./fixtures/bad.md"), "utf8");
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
  for (let i = 0, length = lines.length, testId = 0; i < length;) {
    const lineStart = i;

    const optionsStart = lines.indexOf("``` json", i);
    const optionsEnd = lines.indexOf("```", optionsStart + 1);
    const { title, skip, ...options } = JSON.parse(
      lines.slice(optionsStart + 1, optionsEnd).join("\n")
    );

    const inputStart = lines.indexOf("``` javascript", optionsEnd + 1);
    const inputEnd = lines.indexOf("```", inputStart + 1);
    const input = lines.slice(inputStart + 1, inputEnd).join("\n");

    ++testId;

    i = lines.indexOf("---", inputEnd);

    yield {
      skip: skip === true,
      line: lineStart + 1,
      title,
      input,
      options,
      testId
    };

    if (i === -1) break;
  }
}

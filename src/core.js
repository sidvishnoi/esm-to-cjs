module.exports.runTransform = runTransform;

// gives parsing errors better description
let LOOKING_FOR;
// length/distance defaults during parsing
const DISTANCE = 6;

const defaultOptions = {
  quote: "double",
  lenDestructure: 60,
  lenModuleName: 20,
  lenIdentifier: 20,
  indent: 2,
};

function runTransform(str, options = {}) {
  options = { ...defaultOptions, ...options };
  options.quote = options.quote === "single" ? "'" : '"';
  const buffer = [];
  const exportBuffer = {
    items: [],
    requires: []
  };
  let pos = 0;

  for (const token of tokenize(str, options)) {
    buffer.push(str.slice(pos, token.start));
    buffer.push(transform(token, str, exportBuffer, options));
    pos = token.end + 1;
  }

  // add rest of input
  pos = skipNewLines(str, pos);
  buffer.push(str.slice(pos, str.length));

  if (exportBuffer.items.length) {
    const indent = " ".repeat(options.indent);
    // add module.exports
    for (const item of exportBuffer.requires) {
      buffer.push(item);
    }
    buffer.push("\nmodule.exports = {\n");
    const exportNames = exportBuffer.items.map(
      item => `${indent}${item[0]}${item[1] ? `: ${item[1]}` : ""}`
    );
    buffer.push(exportNames.join(",\n"));
    buffer.push("\n}");
  }

  buffer.push("\n"); // end file
  return buffer.join("");
}

function transform(token, str, exportBuffer, { indent }) {
  indent = " ".repeat(indent);

  const { type } = token;
  switch (type) {
    case "import": {
      const identifiers = token.imports.map(s => s.join(": ")).join(", ");
      const moduleName = token.from;
      return `const { ${identifiers} } = require(${moduleName})`;
    }
    case "import*": {
      const { identifier, moduleName } = token;
      return `const ${identifier} = require(${moduleName})`;
    }
    case "awaitImport": {
      return `require(${token.moduleName})`;
    }
    case "export": {
      exportBuffer.items.push([token.identifier]);
      return "";
    }
    case "reExport": {
      const moduleName = token.from;

      if (token.exports.length === 1) {
        const [original, alias] = token.exports[0];
        exportBuffer.items.push([
          alias ? alias : original,
          `require(${moduleName}).${original}`
        ]);
        return;
      }

      exportBuffer.requires.push("const {\n");
      const names = token.exports
        .map(([original]) => `${indent}${original}: __${original}__`)
        .join(",\n");
      exportBuffer.requires.push(names);
      exportBuffer.requires.push(`\n} = require(${moduleName});`);

      for (const [original, alias] of token.exports) {
        exportBuffer.items.push([alias ? alias : original, `__${original}__`]);
      }

      return "";
    }
    case "reExportImported": {
      exportBuffer.items.push(...token.exports);
      return "";
    }
    default:
      throw new Error("should not reach here");
  }
}

String.prototype.indexWithin = indexWithin;

function* tokenize(str, options) {
  const { quote, lenDestructure, lenModuleName, lenIdentifier } = options;

  let start = 0;
  let pos;

  const types = new Map([
    ["import", "import "],
    ["export", "export "],
    ["awaitImport", "await import("]
  ]);

  while (types.size !== 0) {
    // look for first matching pattern
    pos = Number.POSITIVE_INFINITY;
    let type;
    for (const t of types.keys()) {
      const idx = str.indexOf(types.get(t), start);
      if (idx === -1) {
        types.delete(t);
      } else if (idx < pos) {
        pos = idx;
        type = t;
      }
    }

    switch (type) {
      case "import":
        yield handleImport();
        break;
      case "export":
        yield handleExport();
        break;
      case "awaitImport":
        yield handleAwaitImport();
        break;
    }
  }

  // import { ... } from "MODULE"
  // import * as IDENTIFIER from "MODULE"
  function handleImport() {
    LOOKING_FOR = "import names";
    const braceStart = str.indexWithin("{", pos + 7, DISTANCE, false);
    // 7 === "import ".length
    if (braceStart === -1) {
      // try to see if it's `import *`
      return handleImportStar();
    }

    const braceEnd = str.indexWithin("}", braceStart + 1, lenDestructure);

    LOOKING_FOR = "name of imported module";
    let moduleStart = str.indexWithin("from ", braceEnd + 1, DISTANCE);
    moduleStart = str.indexWithin(quote, moduleStart + 1, 5);
    const moduleEnd = str.indexWithin(quote, moduleStart + 1, lenModuleName);

    start = moduleEnd + 1;
    return {
      type: "import",
      start: pos,
      end: moduleEnd,
      // match: str.slice(pos, moduleEnd + 1),
      imports: destructureModules(str.slice(braceStart, braceEnd + 1)),
      from: str.slice(moduleStart, moduleEnd + 1)
    };
  }

  // await import(...)
  function handleAwaitImport() {
    LOOKING_FOR = "name of imported module for await import()";
    const moduleStart = str.indexWithin("(", pos + 12, 10) + 1;
    // 12 === "await import".length
    const moduleEnd = str.indexWithin(")", moduleStart + 1, lenIdentifier) - 1;

    start = moduleEnd + 2;
    return {
      type: "awaitImport",
      start: pos,
      end: moduleEnd + 1,
      moduleName: str.slice(moduleStart, moduleEnd + 1)
      // match: str.slice(pos, end + 1)
    };
  }

  // export const IDENTIFIER = ...
  // export function IDENTIFIER(...) ...
  // export class IDENTIFIER ...
  // export { ... } >> handleReExport()
  // export { ... } from "MODULE" >> handleReExport()
  function handleExport() {
    LOOKING_FOR = "export pattern";
    const skipStart = pos + "export ".length;

    if (str.indexWithin("{", skipStart, 5, false) !== -1) {
      return handleReExport();
    } else if (str.indexWithin("*", skipStart, 5, false) !== -1) {
      return handleExportStar();
    }

    LOOKING_FOR = "identifier type (function|class|const) for export";
    const typeEnd = str.indexWithin(" ", skipStart, 9);
    // 9 === "function".length + 1
    const exportType = str.slice(skipStart, typeEnd);

    LOOKING_FOR = "export identifiers";
    const identifierStart =
      str.indexWithin(" ", skipStart + exportType.length, 5) + 1;
    const identifierEnd =
      str.indexWithin(
        exportType === "function" ? "(" : " ",
        identifierStart,
        lenIdentifier
      ) - 1;

    const end = pos + 6; // 6 == "export".length;

    start = end + 1;
    return {
      type: "export",
      start: pos,
      end,
      identifier: str.slice(identifierStart, identifierEnd + 1)
      // identifierType: exportType,
      // match: str.slice(pos, end + 1)
    };
  }

  // import * as IDENTIFIER from "MODULE"
  function handleImportStar() {
    LOOKING_FOR = "import name for import*";
    const identifierStart = str.indexWithin("* as ", pos + 7, DISTANCE) + 5;
    // 7 === "import ".length, 5 === "* as ".length
    const identifierEnd = str.indexWithin(
      " ",
      identifierStart + 1,
      lenIdentifier
    );

    LOOKING_FOR = "name of imported module for import*";
    let moduleStart =
      str.indexWithin("from ", identifierEnd + 1) + "from".length;
    moduleStart = str.indexWithin(quote, moduleStart + 1);
    const moduleEnd = str.indexWithin(quote, moduleStart + 1, lenModuleName);

    start = moduleEnd + 1;
    return {
      type: "import*",
      start: pos,
      end: moduleEnd,
      identifier: str.slice(identifierStart, identifierEnd),
      moduleName: str.slice(moduleStart, moduleEnd + 1)
      // match: str.slice(pos, end + 1),
    };
  }

  // export { ... } from "..." | export { ... }
  function handleReExport() {
    LOOKING_FOR = "export pattern for re-export";
    const braceStart = str.indexWithin("{", pos + "export ".length, 5);
    const braceEnd = str.indexWithin("}", braceStart + 1, lenDestructure);

    LOOKING_FOR = "name of re-exported module";
    let moduleStart = str.indexWithin("from ", braceEnd + 1, 10, false);

    if (moduleStart === -1) {
      // export { ... }
      const end = skipNewLines(str, braceEnd);

      start = end + 1;
      return {
        type: "reExportImported",
        start: pos,
        end,
        exports: destructureModules(str.slice(braceStart, braceEnd + 1))
      };
    }

    moduleStart = str.indexWithin(quote, moduleStart, "from ".length + 4);
    const moduleEnd = str.indexWithin(quote, moduleStart + 1, lenModuleName);

    const end = skipNewLines(str, moduleEnd);

    start = end + 1;
    return {
      type: "reExport",
      start: pos,
      end,
      exports: destructureModules(str.slice(braceStart, braceEnd + 1)),
      from: str.slice(moduleStart, moduleEnd + 1)
    };
  }

  function handleExportStar() {
    throw new Error("not implemented");
  }

  function destructureModules(objLiteral) {
    return objLiteral
      .trim()
      .slice(1, -1)
      .split(/,\s*/)
      .map(i => i.trim())
      .filter(i => i)
      .map(i => i.split(/\s*as\s*/));
  }
}

// this is same as indexOf, but can stop searching earlier
function indexWithin(needle, from, within = 99, throws = true) {
  for (let i = from, L = from + within, j = 0; i < L; ++i) {
    if (this.charCodeAt(i) === needle.charCodeAt(j)) {
      while (j < needle.length) {
        if (this.charCodeAt(i + j) === needle.charCodeAt(j)) {
          ++j;
        } else {
          j = 0;
          break;
        }
      }
      if (j === needle.length) {
        return i;
      }
    }
  }
  if (throws) {
    throw new Error(
      `ParseError: Failed to find \`${needle}\` within ${within} characters from position ${from}` +
        (LOOKING_FOR ? ` while looking for ${LOOKING_FOR}` : "") +
        "\n\nINPUT STRING:" +
        `\n${"*".repeat(20)}\n` +
        this +
        `\n${"*".repeat(20)}\n`
    );
  } else {
    return -1;
  }
}

function skipNewLines(str, i) {
  if (str.charAt(i + 1) === ";") ++i;
  while (i < str.length && /\s/.test(str.charAt(i))) {
    ++i;
  }
  return i;
}

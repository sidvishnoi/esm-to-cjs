module.exports.runTransform = runTransform;

// globals:

// gives parsing errors better description
let LOOKING_FOR;
// length/distance defaults during parsing
const DISTANCE = 6;

const defaultOptions = {
  quoteType: '"',
  maxObjectLiteralLength: 60,
  maxModuleNameLength: 20,
  maxIdentifierLength: 20,
  indent: 2,
  removeMultipleNewLines: true
};

function runTransform(str, options = {}) {
  options = { ...defaultOptions, ...options };
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

  // add remaining of string
  buffer.push(str.slice(pos, str.length));

  if (exportBuffer.items.length) {
    // add module.exports
    if (exportBuffer.requires.length) buffer.push("\n");
    for (const item of exportBuffer.requires) {
      buffer.push(item);
    }
    buffer.push("\nmodule.exports = {\n");
    for (const item of exportBuffer.items) {
      buffer.push(item);
    }
    buffer.push("}");
  }
  buffer.push("\n"); // end file
  if (options.removeMultipleNewLines) {
    return buffer.join("").replace(/\n{3,}/g, "\n\n");
  }
  return buffer.join("");
}

function transform(token, str, exportBuffer, { indent }) {
  indent = " ".repeat(indent);

  const { type } = token;
  switch (type) {
    case "import": {
      const identifiers = token.imports.replace(/ as /g, ": ");
      const moduleName = token.from;
      return `const ${identifiers} = require(${moduleName});`;
    }
    case "import*": {
      const { identifier, moduleName } = token;
      return `const ${identifier} = require(${moduleName});`;
    }
    case "awaitImport": {
      return `require(${token.moduleName});`;
    }
    case "export": {
      if (token.identifierType) {
        exportBuffer.items.push(`${indent}${token.identifier},\n`);
      }
      return "";
    }
    case "reExport": {
      let identifiers = token.exports.split(/,\s*/).map(s => s.trim());
      if (identifiers.length > 1) {
        identifiers = identifiers.map(s => {
          if (s.includes("as")) {
            const [id, alias] = s.split(/\s+as\s+/);
            return { newId: `__${id}__`, id, alias };
          } else {
            return { newId: `__${s}__`, id: s, alias: s };
          }
        });
      } else {
        const [id, alias] = identifiers[0].split(/\s+as\s+/);
        identifiers = [{ id, alias: alias ? alias : id }];
      }
      const moduleName = token.from;
      if (identifiers.length > 1) {
        exportBuffer.requires.push("const {\n");
        for ({ alias, newId, id } of identifiers) {
          exportBuffer.items.push(`${indent}${alias}: ${newId},\n`);
          exportBuffer.requires.push(`${indent}${id}: ${newId},\n`);
        }
        exportBuffer.requires.push(`} = require(${moduleName});`);
      } else {
        const { id, alias } = identifiers[0];
        exportBuffer.items.push(
          `${indent}${alias}: require(${moduleName}).${id},\n`
        );
      }
      return "";
    }
    case "reExportImported": {
      const identifiers = token.exports.split(/,\s*/).map(s => {
        const [id, alias] = s.trim().split(/\s+as\s+/);
        return `${indent}${id}${alias ? ": " + alias : ""},\n`;
      });
      exportBuffer.items.push(...identifiers);
      return "";
    }
    default:
      throw new Error("should not reach here");
  }
}

String.prototype.indexWithin = indexWithin;

function* tokenize(str, options) {
  const {
    quoteType,
    maxObjectLiteralLength,
    maxModuleNameLength,
    maxIdentifierLength
  } = options;

  let start = 0;
  let pos;

  const types = new Map([
    ["import", "import "],
    ["export", "export "],
    ["awaitImport", "await import("]
  ]);
  const lastSearchPositions = new Map([
    ["import", start],
    ["export", start],
    ["awaitImport", start]
  ]);

  while (types.size !== 0) {
    for (const t of types.keys()) {
      let idx = str.indexOf(types.get(t), start);
      if (idx === -1) {
        types.delete(t);
        lastSearchPositions.set(t, Number.POSITIVE_INFINITY);
      } else {
        lastSearchPositions.set(t, idx);
      }
    }

    pos = Number.POSITIVE_INFINITY;
    let type;
    for (const [t, idx] of lastSearchPositions.entries()) {
      if (idx < pos) {
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
    const braceStart = str.indexWithin(
      "{",
      pos + "import ".length,
      DISTANCE,
      false
    );
    if (braceStart === -1) {
      // try to see if it's `import *`
      return handleImportStar();
    }

    const braceEnd = str.indexWithin(
      "}",
      braceStart + 1,
      maxObjectLiteralLength
    );

    LOOKING_FOR = "name of imported module";
    let moduleStart = str.indexWithin("from ", braceEnd + 1, DISTANCE);
    moduleStart = str.indexWithin(quoteType, moduleStart + 1, 5);
    const moduleEnd = str.indexWithin(
      quoteType,
      moduleStart + 1,
      maxModuleNameLength
    );

    let end = moduleEnd + 1;
    if (str.charAt(end + 1) === ";") ++end;

    start = end + 1;
    return {
      type: "import",
      start: pos,
      end,
      // braceStart,
      // braceEnd,
      // moduleStart,
      // moduleEnd,
      match: str.slice(pos, end + 1),
      imports: str.slice(braceStart, braceEnd + 1),
      from: str.slice(moduleStart, moduleEnd + 1)
    };
  }

  // await import(...)
  function handleAwaitImport() {
    LOOKING_FOR = "name of imported module for await import()";
    const moduleStart =
      str.indexWithin("(", pos + "await import".length, 10) + 1;
    const moduleEnd =
      str.indexWithin(")", moduleStart + 1, maxIdentifierLength) - 1;

    let end = moduleEnd + 1;
    if (str.charAt(end + 1) === ";") ++end;

    start = end + 1;
    return {
      type: "awaitImport",
      start: pos,
      end,
      // moduleStart,
      // moduleEnd,
      moduleName: str.slice(moduleStart, moduleEnd + 1),
      match: str.slice(pos, end + 1)
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
    let exportType;
    if (str.indexWithin("{", skipStart, 5, false) !== -1) {
      exportType = "reExport";
    } else if (str.indexWithin("*", skipStart, 5, false) !== -1) {
      exportType = "export*";
    } else {
      LOOKING_FOR = "identifier type (function|class|const) for export";
      const typeEnd = str.indexWithin(" ", skipStart, 9);
      // 9 === "function".length + 1
      exportType = str.slice(skipStart, typeEnd);
    }

    if (exportType === "reExport") {
      return handleReExport();
    } else if (exportType === "export*") {
      return handleExportStar();
    } else if (exportType !== "") {
      LOOKING_FOR = "export identifiers";
      const identifierStart =
        str.indexWithin(" ", skipStart + exportType.length, 5) + 1;

      const identifierEnd =
        str.indexWithin(
          exportType === "function" ? "(" : " ",
          identifierStart,
          maxIdentifierLength
        ) - 1;

      const end = pos + "export".length;

      start = end + 1;
      return {
        type: "export",
        start: pos,
        end,
        // identifierStart,
        // identifierEnd,
        identifierType: exportType,
        identifier: str.slice(identifierStart, identifierEnd + 1),
        match: str.slice(pos, end + 1)
      };
    }
  }

  // import * as IDENTIFIER from "MODULE"
  function handleImportStar() {
    LOOKING_FOR = "import name for import*";
    const identifierStart = str.indexWithin("* as ", pos + 7, DISTANCE) + 5;
    // 7 === "import ".length, 5 === "* as ".length
    const identifierEnd = str.indexWithin(
      " ",
      identifierStart + 1,
      maxIdentifierLength
    );

    LOOKING_FOR = "name of imported module for import*";
    let moduleStart =
      str.indexWithin("from ", identifierEnd + 1) + "from".length;
    moduleStart = str.indexWithin(quoteType, moduleStart + 1);
    const moduleEnd = str.indexWithin(
      quoteType,
      moduleStart + 1,
      maxModuleNameLength
    );

    let end = moduleEnd;
    if (str.charAt(end + 1) === ";") ++end;

    start = end + 1;
    return {
      type: "import*",
      start: pos,
      end,
      // identifierStart,
      // identifierEnd,
      // moduleStart,
      // moduleEnd,
      match: str.slice(pos, end + 1),
      identifier: str.slice(identifierStart, identifierEnd),
      moduleName: str.slice(moduleStart, moduleEnd + 1)
    };
  }

  // export { ... } from "..." | export { ... }
  function handleReExport() {
    LOOKING_FOR = "export pattern for re-export";
    const braceStart = str.indexWithin("{", pos + "export ".length, 5);
    const braceEnd = str.indexWithin(
      "}",
      braceStart + 1,
      maxObjectLiteralLength
    );

    LOOKING_FOR = "name of re-exported module";
    let moduleStart = str.indexWithin("from ", braceEnd + 1, 10, false);
    if (moduleStart === -1) {
      // export { ... }
      let end = braceEnd;
      if (str.charAt(end + 1) === ";") ++end;

      start = end + 1;
      return {
        type: "reExportImported",
        start: pos,
        end,
        // braceStart,
        // braceEnd,
        exports: str.slice(braceStart + 1, braceEnd),
        match: str.slice(pos, end + 1)
      };
    }
    moduleStart = str.indexWithin(quoteType, moduleStart, "from ".length + 4);
    const moduleEnd = str.indexWithin(
      quoteType,
      moduleStart + 1,
      maxModuleNameLength
    );

    let end = moduleEnd;
    if (str.charAt(end + 1) === ";") ++end;

    start = end + 1;
    return {
      type: "reExport",
      start: pos,
      end,
      // braceStart,
      // braceEnd,
      // moduleStart,
      // moduleEnd,
      exports: str.slice(braceStart + 1, braceEnd),
      from: str.slice(moduleStart, moduleEnd + 1),
      match: str.slice(pos, end + 1)
    };
  }

  function handleExportStar() {
    throw new Error("not implemented");
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

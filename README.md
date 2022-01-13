## esm-to-cjs

> Transform ESM to Common JS for present NodeJS, without any junk wrappers or useless renaming.

## Motivation

I was working on a TypeScript project for NodeJS and using ES modules. The transformations to CommonJS by TypeScript (or by Babel + plugins) causes variable renaming (prefixing) and adds some wrapper functions to the transformed code.

I was not happy with this transformation. So I created this tool to convert the ESM import/exports to the kinds that a NodeJS developer would write today.

``` js
// input
import { resolve as resolvePath } from "path";
resolvePath("./hello")

// what i wanted
const {  resolve: resolvePath } = require("path");
resolvePath("./hello")

// typescript gave me:
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
path_1.resolve("./hello");
```

``` js
// input
async () => {
  const path = await import("path");
}

// what i wanted
async () => {
  const path = require("path");
}

// typescript gave me:
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
async () => {
    const path = await Promise.resolve().then(() => __importStar(require("path")));
};
```

``` js
// input
export const foo = 5;
console.log(foo);

// what i wanted
const foo = 5;
module.exports = {
  foo
}

// typescript gave me:
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = 5;
console.log(exports.foo);
```


``` js
// input
export { foo as wow, bar } from "baz";
export { baz } from "lorem";

// what i wanted
const { foo: __foo__, bar: __bar__ } = require("baz");
module.exports = {
  wow: __foo__,
  bar: __bar__,
  baz: require("lorem").baz
}

// typescript gave me
Object.defineProperty(exports, "__esModule", { value: true });
var baz_1 = require("baz");
var lorem_1 = require("lorem");
exports.wow = baz_1.foo;
exports.bar = baz_1.bar;
exports.baz = lorem1.baz;
```


So, I created this tool using some simple string manipulations. A lot of sample input/output are [available here](https://github.com/sidvishnoi/esm-to-cjs/blob/main/test/fixtures/supported.md).



## Limitations

- `import * as foo from "bar";` is converted to `const foo = require("bar");`. Not sure if this is what everyone wants. I did it as per my project requirements.
- Also, `import foo from "bar";` is converted to `const foo = require("bar").default;"`.
- No support for `export *` syntax.
- No mixing of default import, named imports and `import *` in same statement.
- See Bug: ["The simpler transform is semantically wrong"](https://github.com/sidvishnoi/esm-to-cjs/issues/4)

## Packages

This tool is available in form of two packages:

- `esm-to-cjs`: the core module.
- `gulp-esm-to-cjs`: as a gulp plugin.

### `esm-to-cjs`

This is the core module. It includes a tokenizer and a transformer. I didn't use some specific JS parser due to overheads and created my own using string manipulation.

**Install:**

```
npm i --save-dev esm-to-cjs
```

**Usage:**

``` js
const { runTransform } = require("esm-to-cjs");

const input = `import { resolve as resolvePath } from "path";`
const options = { quote: "double" }; // see details below
const output = runTransform(input, options);
console.log(output);
// const { resolve: resolvePath } = require("path");
```

**Options:**

``` yaml
quote:
  type: string
  default: "double"
  available: "double" | "single"
  description: Tells parser what kind of quotes you use in module names, i.e. like `from "moduleName"`

lenDestructure:
  type: number (of characters)
  default: 60
  description: Used by parser to improve performance. Set to a higher value if your object destruturing statements are longer.

lenModuleName:
  type: number (of characters)
  default: 20
  description: Used by parser to improve performance. Set to a higher value if your module names are longer.

lenIdentifier:
  type: number (of characters)
  default: 60
  description: Used by parser to improve performance. Set to a higher value if your identifier names are longer.

indent:
  type: number
  default: 2
  description: Indentation (spaces) in output code.
```


### `gulp-esm-to-cjs`

Gulp plugin for esm-to-cjs.

**Install**:

```
npm i --save-dev gulp-esm-to-cjs
```

**Usage**:

``` js
// gulpfile.js
const esmToCjs = require("gulp-esm-to-cjs");

function convert() {
  return gulp
    .src(src)
    .pipe(esmToCjs(options))
    .pipe(gulp.dest(dest));
}
module.exports.convert = convert;

// use as:
// $ gulp convert
```


## Contributing

- If you've issues regarding the project - documentation, supported features and transformations etc., please file them on [GitHub](https://github.com/sidvishnoi/esm-to-cjs/issues) where we can discuss.
- Pull requests are welcome!
- Please bear in mind that I created this project in a hurry, so the code isn't very impressive. Also, I didn't add all the transformations. See limitations above. Would be nice if we can overcome them!

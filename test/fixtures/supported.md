```
---             : test case starts
```json         : options
```javascript   : input
```javascript   : expected output
---             : test case ends
```
---
``` json
{ "title": "nothing to modify" }
```
``` javascript
const foo = 5;
```
``` javascript
const foo = 5;
```
---
``` json
{ "title": "simple import" }
```
``` javascript
import { foo } from "bar";
```
``` javascript
const { foo } = require("bar");
```
---
``` json
{ "title": "is okay without semicolons" }
```
``` javascript
import { foo } from "bar"

import * as bar from "bar"

export { foo as bar, baz } from "aha";
```
``` javascript
const { foo } = require("bar");
const bar = require("bar");

const {
  foo: __foo__,
  baz: __baz__,
} = require("aha");
module.exports = {
  bar: __foo__,
  baz: __baz__,
}
```
---
``` json
{"title": "import with rename" }
```
``` javascript
import { a, b as c, d } from "bar";
```
``` javascript
const { a, b: c, d } = require("bar");
```
---
``` json
{"title": "await import" }
```
``` javascript
const foo = await import("bar");
```
``` javascript
const foo = require("bar");
```
---
``` json
{"title": "import *" }
```
``` javascript
import * as path from "path";
```
``` javascript
const path = require("path");
```
---
``` json
{"title": "await import with module name as variable" }
```
``` javascript
const foo = await import(bar);
```
``` javascript
const foo = require(bar);
```
---
``` json
{"title": "export a const" }
```
``` javascript
export const foo = 5;
```
``` javascript
const foo = 5;
module.exports = {
  foo,
}
```
---
``` json
{"title": "export a function" }
```
``` javascript
export function foo(blah) {}
```
``` javascript
function foo(blah) {}
module.exports = {
  foo,
}
```
---
``` json
{"title": "export a class" }
```
``` javascript
export class foo {};
```
``` javascript
class foo {};
module.exports = {
  foo,
}
```
---
``` json
{"title": "re-export simple" }
```
``` javascript
export { foo } from "bar";
```
``` javascript
module.exports = {
  foo: require("bar").foo,
}
```
---
``` json
{"title": "re-export with rename" }
```
``` javascript
export { foo as bar } from "baz";
```
``` javascript
module.exports = {
  bar: require("baz").foo,
}
```
---
``` json
{"title": "multiple re-exports" }
```
``` javascript
export { foo, bar } from "baz";
```
``` javascript
const {
  foo: __foo__,
  bar: __bar__,
} = require("baz");
module.exports = {
  foo: __foo__,
  bar: __bar__,
}
```
---
``` json
{"title": "multiple re-exports with rename" }
```
``` javascript
export { foo as wow, bar } from "lorem";
```
``` javascript
const {
  foo: __foo__,
  bar: __bar__,
} = require("lorem");
module.exports = {
  wow: __foo__,
  bar: __bar__,
}
```
---
``` json
{"title": "multiple re-exports from module with name having non-alphanum characters", "maxModuleNameLength": 40 }
```
``` javascript
export { foo, bar } from "./module/aha/w-o-w/d.json";
```
``` javascript
const {
  foo: __foo__,
  bar: __bar__,
} = require("./module/aha/w-o-w/d.json");
module.exports = {
  foo: __foo__,
  bar: __bar__,
}
```
---
``` json
{"title": "import in multiple lines" }
```
``` javascript
import {
  a,
  b as c,
  d,
} from "bar";
```
``` javascript
const {
  a,
  b: c,
  d,
} = require("bar");
```
---
``` json
{"title": "multiple imports" }
```
``` javascript
import { a, b as c, d } from "foo";
import { e, f, g } from "bar";
```
``` javascript
const { a, b: c, d } = require("foo");
const { e, f, g } = require("bar");
```
---
``` json
{"title": "multiple exports" }
```
``` javascript
export const foo = 5;
export function bar(some, ...args) {

}
```
``` javascript
const foo = 5;
function bar(some, ...args) {

}
module.exports = {
  foo,
  bar,
}
```
---
``` json
{"title": "allows setting options", "indent": 4 }
```
``` javascript
export { foo, bar } from "module";
```
``` javascript
const {
    foo: __foo__,
    bar: __bar__,
} = require("module");
module.exports = {
    foo: __foo__,
    bar: __bar__,
}
```
---
``` json
{"title": "whitespace processing" }
```
``` javascript
export const foo = 5;






export const bar = 6;



```
``` javascript
const foo = 5;

const bar = 6;

module.exports = {
  foo,
  bar,
}
```
---
``` json
{"title": "disable whitespace processing", "removeMultipleNewLines": false }
```
``` javascript
export const foo = 5;






export const bar = 6;



```
``` javascript
const foo = 5;






const bar = 6;



module.exports = {
  foo,
  bar,
}
```
---
``` json
{"title": "all supported types mixed" }
```
``` javascript
import { a, b as c, d } from "m1";
import {
  e,
  f as g,
  h
} from "m1/2";
import * as path from "path";

const i = await import("m2");

export const j = 5;

export { k } from "m3";

export class l {
  constructor(name) {
    this.name = name;
  }
};

export function m() {

}

export { n, o as p } from "m4";

export { q };

export { s as r };


```
``` javascript
const { a, b: c, d } = require("m1");
const {
  e,
  f: g,
  h
} = require("m1/2");
const path = require("path");

const i = require("m2");

const j = 5;

class l {
  constructor(name) {
    this.name = name;
  }
};

function m() {

}

const {
  n: __n__,
  o: __o__,
} = require("m4");
module.exports = {
  j,
  k: require("m3").k,
  l,
  m,
  n: __n__,
  p: __o__,
  q,
  s: r,
}
```
***

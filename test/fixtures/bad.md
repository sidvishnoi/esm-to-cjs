```
---             : test case starts
```json         : options
```javascript   : input
---             : test case ends
```
---
``` json
{ "title": "long module name" }

```
``` javascript
import { foo } from "some-really-long-module-name-that-we-did-not-allow-in-options";
```
---
``` json
{ "title": "too long identifer list" }
```
``` javascript
import { some_really_long_module_name_that_we_did_not_allow_in_options } from "foo";
```
---
``` json
{ "title": "far away keywords" }
```
``` javascript
import {

      foo: bar,
      baz:






        "from"

    } from aha;
```
---
``` json
{ "title": "bad syntax" }
```
``` javascript
import foo: bar,
      baz: "from"
    } from {aha};
```
---
``` json
{ "title": "bad syntax 2 - why would you do that!" }
```
``` javascript
import                                  {};
```
---
``` json
{ "title": "not implemented" }
```
``` javascript
export * from "aha";
```
---
``` json
{ "title": "bad option - quoteType" }
```
``` javascript
import { foo } from 'bar';
```
---
``` json
{ "title": "bad syntax 3" }
```
``` javascript
import { foo } frOm 'bar';
```
***

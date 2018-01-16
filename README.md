# Improved regular expressions support for Acorn

[![NPM version](https://img.shields.io/npm/v/acorn-parse-regexps.svg)](https://www.npmjs.org/package/acorn-parse-regexps)

This is a plugin for [Acorn](http://marijnhaverbeke.nl/acorn/) - a tiny, fast JavaScript parser, written completely in JavaScript.

It decouples regular expression parsing from the JavaScript host acorn is running in.
This allows it to parse [named capture groups](https://github.com/tc39/proposal-regexp-named-groups) everywhere.
The plugin also implements optional support for lookbehind assertions as defined in the stage 3 proposal [RegExp Lookbehind Assertions](https://github.com/tc39/proposal-regexp-lookbehind).

This plugin does not support the `value` property on regular expression `Literal` nodes, see [ESTree](https://github.com/estree/estree/blob/master/es5.md#literal). `raw` and `regex` can be used to get string-based representations of the regular expression.

## Usage

You can use this module directly in order to get an Acorn instance with the plugin installed:

```javascript
var acorn = require('acorn-parse-regexps');
```

Or you can use `inject.js` for injecting the plugin into your own version of Acorn like this:

```javascript
var acorn = require('acorn-parse-regexps/inject')(require('./custom-acorn'));
```

Then, use the `plugins` option to enable the plugiin:

```javascript
var ast = acorn.parse(code, {
  plugins: { parseRegexps: {
    // Enable parsing of lookbehind assertions in EcmaScript version >= 9.
    // The default is false.
    lookbehind: true
  } }
});
```

## License

This plugin is released under the [GNU Affero General Public License](./LICENSE).

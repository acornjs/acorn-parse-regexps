"use strict"

const assert = require("assert")
const acorn = require("..")

function parse(text, additionalOptions) {
  return acorn.parse(text, Object.assign({ ecmaVersion: 9, plugins: { parseRegexps: { lookbehind: true } } }, additionalOptions))
}

function test(text, expectedResult, additionalOptions) {
  it(text, function () {
    const result = parse(text, additionalOptions)
    if (expectedResult) {
      assert.deepEqual(result.body[0], expectedResult)
    }
  })
}
function testFail(text, expectedResult, additionalOptions) {
  it(text, function () {
    let failed = false
    try {
      parse(text, additionalOptions)
    } catch (e) {
      assert.equal(e.message, expectedResult)
      failed = true
    }
    assert(failed)
  })
}

describe("acorn-parse-regexps", function () {
  testFail("/^/uu", "Duplicate regular expression flag (1:4)")
  test("/(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/u")
  test("/^(?<half>.*).\\k<half>$/u")
  test("/(?<!.)/")
  test("/(?<=\\1(.))/")
  test("/(?<=(\\d+)(\\d+))$/")

  testFail("/a/\u{10509}", "Unexpected token (1:3)")
  testFail("/\\u{110000}/u", "Error parsing regular expression: Invalid escape sequence (1:1)")

  // These are from test262:
  // https://github.com/tc39/test262/blob/master/test/built-ins/RegExp/named-groups/unicode-property-names.js
  test("/(?<π>a)/u")
  test("/(?<\\u{03C0}>a)/u")
  test("/(?<π>a)/u")
  test("/(?<\\u{03C0}>a)/u")
  test("/(?<$>a)/u")
  test("/(?<_>a)/u")
  //test("/(?<$𐒤>a)/u") // See https://github.com/jviereck/regjsparser/issues/90
  test("/(?<_\\u200C>a)/u")
  test("/(?<_\\u200D>a)/u")
  test("/(?<ಠ_ಠ>a)/u")
  testFail("/(?<❤>a)/u", "Error parsing regular expression: Invalid identifier (1:3)")
  testFail("/(?<𐒤>a)/u", "Error parsing regular expression: Invalid identifier (1:3)")

  // Unicode escapes in capture names.
  test("/(?<a\\uD801\\uDCA4>.)/u")
  testFail("/(?<a\\uD801>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  testFail("/(?<a\\uDCA4>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  test("/(?<\\u0041>.)/u")
  test("/(?<\\u{0041}>.)/u")
  test("/(?<a\\u{104A4}>.)/u")
  testFail("/(?<a\\u{110000}>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  testFail("/(?<a\\uD801>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  testFail("/(?<a\\uDCA4>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")

  // Bracketed escapes are not allowed;
  // 4-char escapes must be the proper ID_Start/ID_Continue
  testFail("/(?<a\\uD801>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  testFail("/(?<a\\uDCA4>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")
  test("/(?<\\u{0041}>.)/u")
  test("/(?<a\\u{104A4}>.)/u")

  // Backslash is not allowed as ID_Start and ID_Continue
  testFail("/(?<\\>.)/u", "Error parsing regular expression: Invalid escape sequence (1:3)")
  testFail("/(?<a\\>.)/u", "Error parsing regular expression: Invalid escape sequence (1:4)")

  testFail("/a/\u{10509}", "Unexpected token (1:3)")
})

"use strict"

const regjsparser = require("regjsparser")
const lineBreak = /\r\n?|\n|\u2028|\u2029/

module.exports = function (acorn) {
  const tt = acorn.tokTypes

  acorn.plugins.parseRegexps = function (instance, config) {
    instance.extend("readRegexp", _superF => function () {
      let escaped, inClass, start = this.pos
      for (;;) {
        if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression")
        let ch = this.input.charAt(this.pos)
        if (lineBreak.test(ch)) this.raise(start, "Unterminated regular expression")
        if (!escaped) {
          if (ch === "[") inClass = true
          else if (ch === "]" && inClass) inClass = false
          else if (ch === "/" && !inClass) break
          escaped = ch === "\\"
        } else escaped = false
        ++this.pos
      }
      let content = this.input.slice(start, this.pos)
      ++this.pos
      // Need to use `readWord1` because '\uXXXX' sequences are allowed
      // here (don't ask).
      let mods = this.readWord1()
      if (mods) {
        let validFlags = /^[gim]*$/
        if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
        if (this.options.ecmaVersion >= 9) validFlags = /^[gimsuy]*$/
        if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
      }

      // Check for duplicate flags
      const flags = Object.create(null)
      for (let i = 0; i < mods.length; ++i) {
        if (flags[mods[i]]) this.raise(this.start, "Duplicate flag in regular expression")
        else flags[mods[i]] = true
      }

      try {
        regjsparser.parse(content, mods, {
          unicodePropertyEscape: this.options.ecmaVersion >= 6,
          namedGroups: this.options.ecmaVersion >= 9,
          lookbehind: this.options.ecmaVersion >= 9 && config.lookbehind
        })
      } catch (e) {
        const matched = e.message.match(/^(.*) at position (\d+)/)
        if (matched) this.raise(this.start + Number(matched[2]), `Error parsing regular expression: ${matched[1]}`)
      }

      return this.finishToken(tt.regexp, {pattern: content, flags: mods})
    })
  }
  return acorn
}

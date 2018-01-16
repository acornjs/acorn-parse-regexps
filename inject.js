"use strict"

const regjsparser = require("regjsparser")
const lineBreak = /\r\n?|\n|\u2028|\u2029/

module.exports = function (acorn) {
  const tt = acorn.tokTypes
  const isIdentifierChar = acorn.isIdentifierChar

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

      let mods = "", flagsStart = this.pos, allowedFlags
      if (this.options.ecmaVersion >= 9) allowedFlags = {g: true, i: true, m: true, s: true, u: true, y: true}
      else if (this.options.ecmaVersion >= 6) allowedFlags = {g: true, i: true, m: true, u: true, y: true}
      else allowedFlags = {g: true, i: true, m: true}
      for (; this.pos < this.input.length; ++this.pos) {
        let ch = this.input[this.pos]
        if (!isIdentifierChar(ch.charCodeAt(0))) break // Doesn't correctly handle astral plane chars
        if (!allowedFlags[ch])
          this.raise(this.pos, (allowedFlags[ch] === false ? "Duplicate" : "Invalid") + " regular expression flag")
        allowedFlags[ch] = false
      }
      mods = this.input.slice(flagsStart, this.pos)

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

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
      let mods = this.readWord1()
      if (this.containsEsc) this.unexpected(start)

      let tmp = content, tmpFlags = ""
      if (mods) {
        let validFlags = "gim"
        if (this.options.ecmaVersion >= 6) validFlags += "uy"
        if (this.options.ecmaVersion >= 9) validFlags += "s"
        for (let i = 0; i < mods.length; i++) {
          let mod = mods.charAt(i)
          if (validFlags.indexOf(mod) == -1) this.raise(start, "Invalid regular expression flag")
          if (mods.indexOf(mod, i + 1) > -1) this.raise(start, "Duplicate regular expression flag")
        }
      }

      try {
        regjsparser.parse(content, mods, this.options.ecmaVersion >= 9 && {
          lookbehind: true,
          namedGroups: true,
          unicodePropertyEscape: true
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

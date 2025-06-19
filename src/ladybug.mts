
export { Ladybug }
import { Lexer } from "./lexer.mjs"
import { Parser } from "./parser.mjs"

/**
 * The global interpreter class for running ladybug code and managing handles
 */
class Ladybug {

    constructor() {}

}

let lexer = new Lexer()
lexer.read("x = 5; f();")
let parser = new Parser()
console.dir(parser.parse(lexer.tokens), {depth: null})
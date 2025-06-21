
export { TokenType, Token }
import { Loc } from "./loc.mjs"

/**
 * The type of a token prodcued by the lexer
 */
enum TokenType {

    // Constants
    NUM = "NUM", STR = "STR", TRUE = "TRUE", FALSE = "FALSE",
    // Identifiers and keywords
    ID = "ID", IF = "IF", ELSE = "ELSE", WHILE = "WHILE", FUNCTION = "FUNCTION",
    RETURN = "RETURN",

    // Assignment operators
    ASSIGN = "=", ASSIGN_ADD = "+=", ASSIGN_SUB = "-=", ASSIGN_MUL = "*=",
    ASSIGN_DIV = "/=", ASSIGN_MOD = "%=",
    // Delimiters
    COMMA = ",", SEMICOL = ";",
    // Braces
    LCBRACE = "{", RCBRACE = "}", LBRACE = "(", RBRACE = ")",
    // Arithmetic operators
    ADD = "+", SUB = "-", MUL = "*", DIV = "/", MOD = "%",
    // Logical operators
    AND = "&&", OR = "||", NOT = "!",
    // Comparison operators
    EQ = "==", NEQ = "!=", LT = "<", LTE = "<=", GT = ">", GTE = ">=",

    // Error token
    ERR = "ERR",

}

/**
 * A token produced by the lexer, with a token type and content, which by
 * default is empty
 */
class Token {

    // Type of the token
    type: TokenType
    // Token content, empty by default
    content: string
    // Location of the token, defaults to unknown
    loc: Loc

    /**
     * Constructor
     * @param type The type of the token
     * @param content The content of the token (default empty)
     */
    constructor(type: TokenType, content?: string, loc?: Loc) {
        this.type = type
        this.content = content ?? ""
        this.loc = new Loc(loc?.line, loc?.col)
    }

}
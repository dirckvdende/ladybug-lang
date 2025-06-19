
export { Lexer }
import { Token, TokenType } from "./token.mjs"

// Mapping of keywords to their token types
const keywords: Record<string, TokenType | undefined> = {
    "if": TokenType.IF,
    "while": TokenType.WHILE,
}

// Mapping of special tokens to their respective token types. If a certain
// string is a key in this mapping, every non-empty prefix needs to be a key as
// well
const specialTokens: Record<string, TokenType | undefined> = {
    "=": TokenType.ASSIGN,
    ";": TokenType.SEMICOL,
    "{": TokenType.LCBRACE,
    "}": TokenType.RCBRACE,
    "(": TokenType.LBRACE,
    ")": TokenType.RBRACE,
    "+": TokenType.ADD,
    "-": TokenType.SUB,
    "*": TokenType.MUL,
    "/": TokenType.DIV,
    "%": TokenType.MOD,
}

/**
 * Tokenizes an input string
 */
class Lexer {

    // The array of tokens produced by the lexer
    tokens: Token[] = []
    // Current input string
    private text: string = ""
    // Current position in the input string
    private pos: number = 0

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Tokenize a string and place the tokens at the end of the tokens array
     * @param text The string to tokenize
     */
    read(text: string) {
        this.text = text
        this.pos = 0
        while (!this.end()) {
            if (this.isIDChar(this.cur(), true)) {
                this.readID()
            } else if (this.isSpace(this.cur())) {
                // Ignore whitespace
                this.next()
            } else if (this.isNum(this.cur())) {
                this.readNum()
            } else {
                this.readSpecialToken()
            }
        }
    }

    /**
     * Read an identifier and add it to the tokens array
     */
    private readID() {
        let content = ""
        while (this.isIDChar(this.cur()))
            content += this.next()
        let token: Token
        if (keywords[content] != undefined)
            token = new Token(keywords[content]!)
        else
            token = new Token(TokenType.ID, content)
        this.tokens.push(token)
    }

    /**
     * Read a number and add it to the tokens array
     */
    private readNum() {
        let foundDot = false
        let content = ""
        while (!this.end() && (this.isNum(this.cur()) || (!foundDot &&
        this.cur() == "."))) {
            if (this.cur() == ".")
                foundDot = true
            content += this.next()
        }
        this.tokens.push(new Token(TokenType.NUM, content))
    }

    /**
     * Read a special token, such as a semicolon or brace. Throws an error if
     * no token could be read
     */
    private readSpecialToken() {
        let content = ""
        while (!this.end() && specialTokens[content + this.cur()] != undefined)
            content += this.next()
        if (content == "")
            throw Error(`Unexpected character ${this.cur()}`)
        this.tokens.push(new Token(specialTokens[content]!, ""))
    }

    /**
     * Check if the input string has been fully consumed
     * @returns If the input string has been consumed
     */
    private end(): boolean {
        return this.pos >= this.text.length
    }

    /**
     * Get the current character in the input string
     * @returns The current character, or an empty string if end() returns true
     */
    private cur(): string {
        if (this.end())
            return ""
        return this.text[this.pos]
    }

    /**
     * Move to the next character in the input string
     * @returns The current character, before moving to the next character
     */
    private next(): string {
        let r = this.cur()
        this.pos += 1
        return r
    }

    /**
     * Check if a character is a letter
     * @param char The character
     * @returns If the character is a letter
     */
    private isAlpha(char: string): boolean {
        return this.inCharRange(char, "a", "z") || this.inCharRange(char, "A",
        "Z")
    }

    /**
     * Check if a character is numeric
     * @param char The character
     * @returns If the character is a number
     */
    private isNum(char: string): boolean {
        return this.inCharRange(char, "0", "9")
    }

    /**
     * Check if a character can be used in an identifier
     * @param char The character
     * @param start Whether the character should be valid at the start of an
     * identifier (default false)
     * @returns If the character can be used in an identifier
     */
    private isIDChar(char: string, start: boolean = false): boolean {
        return this.isAlpha(char) || char == "_" || (!start && this.isNum(char))
    }

    /**
     * Check if a character is a whitespace character
     * @param char The character
     * @returns If the character is a whitespace character
     */
    private isSpace(char: string) {
        return char == " " || char == "\t" || char == "\r" || char == "\n"
    }

    /**
     * Check if a character is in a certain unicode range, e.g. numbers are
     * between characters "0" and "9"
     * @param char The character to check
     * @param start The start of the range the character has to be in
     * @param end The end of the range the character has to be in
     * @returns If the character is in the given range
     */
    private inCharRange(char: string, start: string, end: string): boolean {
        return (start.charCodeAt(0) <= char.charCodeAt(0) && char.charCodeAt(0)
        <= end.charCodeAt(0))
    }

}
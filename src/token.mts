
export { TokenType, Token }

/**
 * The type of a token prodcued by the lexer
 */
enum TokenType {

    // Constants
    NUM,
    // Special tokens
    ASSIGN, SEMICOL, LCBRACE, RCBRACE, LBRACE, RBRACE, ADD, SUB, MUL, DIV, MOD,
    // Identifiers and keywords
    ID, IF, WHILE,
    // Error token
    ERR,

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

    /**
     * Constructor
     * @param type The type of the token
     * @param content The content of the token (default empty)
     */
    constructor(type: TokenType, content?: string) {
        this.type = type
        this.content = content ?? ""
    }

}
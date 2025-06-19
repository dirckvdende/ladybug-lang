
export { Parser }
import { Token, TokenType } from "./token.mjs"
import { ParseNode, ParseNodeType } from "./parsenode.mjs"

class Parser {

    // Input tokens
    private tokens: Token[] = []
    // Position in input tokens list
    private pos: number = 0

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Generate a parse tree from the given tokens
     * @param tokens The tokens to parse
     * @returns The root of the parse tree that was generated
     */
    parse(tokens: Token[]): ParseNode {
        this.tokens = tokens
        this.pos = 0
        return this.parseBlock()
    }

    /**
     * Parse the inside of a code block (without curly braces)
     * @returns The root of the generated subtree
     */
    private parseBlock(): ParseNode {
        let children: ParseNode[] = []
        while (!this.end() && this.cur().type != TokenType.RCBRACE) {
            if (this.cur().type == TokenType.SEMICOL)
                this.next()
            else
                children.push(this.parseLine())
        }
        return new ParseNode(ParseNodeType.BLOCK, "", children)
    }

    private parseLine(): ParseNode {
        let e = this.parseExpr()
        this.expect(TokenType.SEMICOL)
        this.next()
        return e
    }

    private parseExpr(): ParseNode {
        return this.parseAssign()
    }

    private parseAssign(): ParseNode {
        let left = this.parseSum()
        if (this.accept(TokenType.ASSIGN)) {
            if (left.type != ParseNodeType.ID)
                throw Error("Assignment requires identifier on the left")
            this.next()
            let right = this.parseAssign()
            return new ParseNode(ParseNodeType.ASSIGN, left.content, [right])
        }
        return left
    }

    private parseSum(): ParseNode {
        let left = this.parseProduct()
        while (this.accept(TokenType.ADD) || this.accept(TokenType.SUB)) {
            if (this.accept(TokenType.ADD)) {
                this.next()
                let right = this.parseProduct()
                left = new ParseNode(ParseNodeType.ADD, "", [left, right])
            } else {
                this.next()
                let right = this.parseProduct()
                left = new ParseNode(ParseNodeType.SUB, "", [left, right])
            }
        }
        return left
    }

    private parseProduct(): ParseNode {
        let left = this.parseCall()
        while (this.accept(TokenType.MUL) || this.accept(TokenType.DIV)) {
            if (this.accept(TokenType.MUL)) {
                this.next()
                let right = this.parseCall()
                left = new ParseNode(ParseNodeType.MUL, "", [left, right])
            } else {
                this.next()
                let right = this.parseCall()
                left = new ParseNode(ParseNodeType.DIV, "", [left, right])
            }
        }
        return left
    }

    private parseCall(): ParseNode {
        let left = this.parseAtom()
        if (this.accept(TokenType.LBRACE)) {
            if (left.type != ParseNodeType.ID)
                throw Error("Function call syntax only on identifiers")
            this.next()
            // TODO: Implement parameters
            this.expect(TokenType.RBRACE)
            this.next()
            return new ParseNode(ParseNodeType.CALL, left.content, [])
        }
        return left
    }

    private parseAtom(): ParseNode {
        if (this.accept(TokenType.LBRACE)) {
            this.next()
            let e = this.parseExpr()
            this.expect(TokenType.RBRACE)
            this.next()
            return e
        }
        if (this.accept(TokenType.ID)) {
            let node = new ParseNode(ParseNodeType.ID, this.cur().content)
            this.next()
            return node
        }
        if (this.accept(TokenType.NUM)) {
            let node = new ParseNode(ParseNodeType.NUM, this.cur().content)
            this.next()
            return node
        }
        this.expect([TokenType.ID, TokenType.NUM])
        return new ParseNode(ParseNodeType.ERR)
    }

    /**
     * Check if the entire input of tokens has been consumed
     * @returns If we have consumed the entire input
     */
    private end(): boolean {
        return this.pos >= this.tokens.length
    }

    /**
     * Get the current token being parsed
     * @returns The current token, or an error token if the input has been
     * consumed
     */
    private cur(): Token {
        if (this.end())
            return new Token(TokenType.ERR)
        return this.tokens[this.pos]
    }

    /**
     * Move to the next token in the input
     * @returns The current token before moving to the next token
     */
    private next(): Token {
        let c = this.cur()
        this.pos++
        return c
    }

    /**
     * Throw an error if the current token is not of the given type
     * @param type The type that is expected to be read, can be an array from
     * which one type must match
     */
    private expect(type: TokenType | TokenType[]) {
        if (!(type instanceof Array))
            type = [type]
        for (let t of type)
            if (this.accept(t))
                return
        throw Error(`Unexpected token of type ${this.cur().type}, expected `
        + `${type}`)
    }

    /**
     * Check if the current token is of the given type
     * @param type The type to compare against
     * @returns Whether the current token is of the given type
     */
    private accept(type: TokenType): boolean {
        return this.cur().type == type
    }

}

export { Parser }
import { Token, TokenType } from "./token.mjs"
import { ParseNode, NodeType } from "./parsenode.mjs"

/**
 * Class to parse an array of tokens to a parse tree. Uses recursive descent for
 * the parsing
 */
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
        return new ParseNode(NodeType.BLOCK, "", children)
    }

    private parseLine(): ParseNode {
        if (this.accept(TokenType.IF))
            return this.parseIf()
        if (this.accept(TokenType.WHILE))
            return this.parseWhile()
        let e = this.parseExpr()
        this.expect(TokenType.SEMICOL)
        this.next()
        return e
    }

    private parseIf(): ParseNode {
        this.expect(TokenType.IF)
        this.next()
        this.expect(TokenType.LBRACE)
        this.next()
        let condition = this.parseExpr()
        this.expect(TokenType.RBRACE)
        this.next()
        let block = this.parseLineOrBlock()
        if (this.accept(TokenType.ELSE)) {
            this.next();
            let elseBlock = this.parseLineOrBlock()
            return new ParseNode(NodeType.IF, "", [condition, block, elseBlock])
        }
        return new ParseNode(NodeType.IF, "", [condition, block])
    }

    private parseWhile(): ParseNode {
        this.expect(TokenType.WHILE)
        this.next()
        this.expect(TokenType.LBRACE)
        this.next()
        let condition = this.parseExpr()
        this.expect(TokenType.RBRACE)
        this.next()
        let block = this.parseLineOrBlock()
        return new ParseNode(NodeType.WHILE, "", [condition, block])
    }

    private parseLineOrBlock(): ParseNode {
        if (this.accept(TokenType.LCBRACE)) {
            this.next()
            let block = this.parseBlock()
            this.expect(TokenType.RCBRACE)
            this.next()
            return block
        }
        return this.parseLine()
    }

    private parseExpr(): ParseNode {
        return this.parseAssign()
    }

    private parseAssign(): ParseNode {
        let left = this.parseSum()
        if (this.accept(TokenType.ASSIGN)) {
            if (left.type != NodeType.ID)
                throw Error("Assignment requires identifier on the left")
            this.next()
            let right = this.parseAssign()
            return new ParseNode(NodeType.ASSIGN, left.content, [right])
        }
        return left
    }

    private parseSum(): ParseNode {
        let left = this.parseProduct()
        while (this.accept(TokenType.ADD) || this.accept(TokenType.SUB)) {
            if (this.accept(TokenType.ADD)) {
                this.next()
                let right = this.parseProduct()
                left = new ParseNode(NodeType.ADD, "", [left, right])
            } else {
                this.next()
                let right = this.parseProduct()
                left = new ParseNode(NodeType.SUB, "", [left, right])
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
                left = new ParseNode(NodeType.MUL, "", [left, right])
            } else {
                this.next()
                let right = this.parseCall()
                left = new ParseNode(NodeType.DIV, "", [left, right])
            }
        }
        return left
    }

    private parseCall(): ParseNode {
        let left = this.parseAtom()
        if (this.accept(TokenType.LBRACE)) {
            if (left.type != NodeType.ID)
                throw Error("Function call syntax only on identifiers")
            this.next()
            // TODO: Implement parameters
            let args = this.parseCallArgs()
            this.expect(TokenType.RBRACE)
            this.next()
            return new ParseNode(NodeType.CALL, left.content, args)
        }
        return left
    }

    private parseCallArgs(): ParseNode[] {
        let args: ParseNode[] = []
        let first = true
        while (!this.accept(TokenType.RBRACE) && !this.end()) {
            if (!first) {
                this.expect(TokenType.COMMA)
                this.next()
            }
            args.push(this.parseExpr())
        }
        return args
    }

    private parseAtom(): ParseNode {
        if (this.accept(TokenType.LBRACE)) {
            this.next()
            let e = this.parseExpr()
            this.expect(TokenType.RBRACE)
            this.next()
            return e
        }
        this.expect([TokenType.ID, TokenType.NUM, TokenType.STR])
        let tokenType = this.cur().type
        let nodeType: NodeType
        if (tokenType == TokenType.ID)
            nodeType = NodeType.ID
        else if (tokenType == TokenType.NUM)
            nodeType = NodeType.NUM
        else
            nodeType = NodeType.STR
        let node = new ParseNode(nodeType, this.cur().content)
        this.next()
        return node
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
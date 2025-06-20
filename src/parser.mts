
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

    /**
     * Parse a "line" of code, which can be an if statement, while loop,
     * expression with a semicolon at the end, function definition, return
     * statement
     * @returns The root of the generated subtree
     */
    private parseLine(): ParseNode {
        if (this.accept(TokenType.IF))
            return this.parseIf()
        if (this.accept(TokenType.WHILE))
            return this.parseWhile()
        if (this.accept(TokenType.FUNCTION))
            return this.parseFunction()
        if (this.accept(TokenType.RETURN))
            return this.parseReturn()
        let e = this.parseExpr()
        this.expect(TokenType.SEMICOL)
        this.next()
        return e
    }

    /**
     * Parse either a code block with curly braces around it, or a single. This
     * is used for example after an if or while
     * @param forceBraces Whether to require curly braces to be used, for
     * example in function definitions
     * @returns The root of the generated subtree
     */
    private parseLineOrBlock(forceBraces: boolean = false): ParseNode {
        if (forceBraces)
            this.expect(TokenType.LBRACE)
        if (this.accept(TokenType.LCBRACE)) {
            this.next()
            let block = this.parseBlock()
            this.expect(TokenType.RCBRACE)
            this.next()
            return block
        }
        return this.parseLine()
    }

    /**
     * Parse an if(-else) statement
     * @returns The root of the generated subtree
     */
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

    /**
     * Parse a while loop
     * @returns The root of the generated subtree
     */
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

    /**
     * Parse a function definition
     * @returns The root of the generated subtree
     */
    private parseFunction(): ParseNode {
        this.expect(TokenType.FUNCTION)
        this.next()
        this.expect(TokenType.ID)
        let name = this.cur().content
        this.next()
        this.expect(TokenType.LBRACE)
        this.next()
        let args = this.parseFunctionArgs()
        this.expect(TokenType.RBRACE)
        this.next()
        let block = this.parseLineOrBlock(true)
        let content = name + "(" + args.join(",") + ")"
        return new ParseNode(NodeType.FUNCTION, content, [block])
    }

    /**
     * Parse the arguments of a function definition, which is a comma-separated
     * list
     * @returns The argument names as a list of strings
     */
    private parseFunctionArgs(): string[] {
        let first = true
        let args: string[] = []
        while (!this.end() && !this.accept(TokenType.RBRACE)) {
            if (!first) {
                this.expect(TokenType.COMMA)
                this.next()
            }
            first = false
            this.expect(TokenType.ID)
            args.push(this.cur().content)
            this.next()
        }
        return args
    }

    /**
     * Parse a return statement with optional returned expression
     * @returns The root of the generated subtree
     */
    private parseReturn(): ParseNode {
        this.expect(TokenType.RETURN)
        this.next()
        let children: ParseNode[] = []
        if (!this.accept(TokenType.SEMICOL))
            children.push(this.parseExpr())
        return new ParseNode(NodeType.RETURN, "", children)
    }

    /**
     * Parse an expression
     * @returns The root of the generated subtree
     */
    private parseExpr(): ParseNode {
        return this.parseAssign()
    }

    /**
     * Parse an assignment expression, which can be a simple assignment or an
     * assignment with an operation
     * @returns The root of the generated subtree
     */
    private parseAssign(): ParseNode {
        return this.parseBinaryRight([
            [TokenType.ASSIGN, NodeType.ASSIGN],
            [TokenType.ASSIGN_ADD, NodeType.ASSIGN_ADD],
            [TokenType.ASSIGN_SUB, NodeType.ASSIGN_SUB],
            [TokenType.ASSIGN_MUL, NodeType.ASSIGN_MUL],
            [TokenType.ASSIGN_DIV, NodeType.ASSIGN_DIV],
            [TokenType.ASSIGN_MOD, NodeType.ASSIGN_MOD],
        ], this.parseOr, (node: ParseNode) => {
            if (node.children[0].type != NodeType.ID)
                throw Error("Assignment requires identifier on the left")
        })
    }
    
    /**
     * Parse the logical OR operator
     * @returns The root of the generated subtree
     */
    private parseOr(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.OR, NodeType.OR],
        ], this.parseAnd)
    }

    /**
     * Parse the logical AND operator
     * @returns The root of the generated subtree
     */
    private parseAnd(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.AND, NodeType.AND],
        ], this.parseEq)
    }

    /**
     * Parse equality operators "==" and "!="
     * @returns The root of the generated subtree
     */
    private parseEq(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.EQ, NodeType.EQ],
            [TokenType.NEQ, NodeType.NEQ],
        ], this.parseIneq)
    }

    /**
     * Parse inequality operators "<", "<=", ">", and ">="
     * @returns The root of the generated subtree
     */
    private parseIneq(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.LT, NodeType.LT],
            [TokenType.LTE, NodeType.LTE],
            [TokenType.GT, NodeType.GT],
            [TokenType.GTE, NodeType.GTE],
        ], this.parseSum)
    }

    /**
     * Parse a sum expression with addition and subtraction
     * @returns The root of the generated subtree
     */
    private parseSum(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.ADD, NodeType.ADD],
            [TokenType.SUB, NodeType.SUB],
        ], this.parseProduct)
    }

    /**
     * Parse a product expression with multiplication, division, and modulo
     * @returns The root of the generated subtree
     */
    private parseProduct(): ParseNode {
        return this.parseBinaryLeft([
            [TokenType.MUL, NodeType.MUL],
            [TokenType.DIV, NodeType.DIV],
            [TokenType.MOD, NodeType.MOD],
        ], this.parseUnary)
    }

    /**
     * Parse unary operators "!" and "-"
     * @returns The root of the generated subtree
     */
    private parseUnary(): ParseNode {
        if (this.accept(TokenType.NOT)) {
            this.next()
            return new ParseNode(NodeType.NOT, "", [this.parseUnary()])
        }
        if (this.accept(TokenType.SUB)) {
            this.next()
            return new ParseNode(NodeType.NEG, "", [this.parseUnary()])
        }
        return this.parseCall()
    }

    /**
     * Parse a function call expression
     * @returns The root of the generated subtree
     */
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

    /**
     * Parse the arguments of a function call, which is a comma-separated list
     * of expressions
     * @returns A list of roots of subtrees, one for each argument
     */
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

    /**
     * Parse an expression atom, which can be an identifier, number, string,
     * constant or an expression with braces around it
     * @returns The root of the generated subtree
     */
    private parseAtom(): ParseNode {
        if (this.accept(TokenType.LBRACE)) {
            this.next()
            let e = this.parseExpr()
            this.expect(TokenType.RBRACE)
            this.next()
            return e
        }
        this.expect([TokenType.ID, TokenType.NUM, TokenType.STR, TokenType.TRUE,
        TokenType.FALSE])
        if (this.accept([TokenType.TRUE, TokenType.FALSE])) {
            let content = this.accept(TokenType.TRUE) ? "1" : "0"
            this.next()
            return new ParseNode(NodeType.NUM, content, [])
        }
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
     * Parse a binary operation with left-to-right associativity
     * @param nodeMap List of token types and matching node types that represent
     * all operations that need to be parsed
     * @param subcall The function to call to parse a subexpression, e.g. for
     * parsing sums this would call a function parsing a product
     * @param handle A function that is called every time a parse node is
     * created in this function
     */
    private parseBinaryLeft(nodeMap: [TokenType, NodeType][], subcall: () =>
    ParseNode, handle?: (node: ParseNode) => void): ParseNode {
        let left = subcall()
        let foundOp = true
        while (foundOp) {
            foundOp = false
            for (let mapItem of nodeMap) {
                if (!this.accept(mapItem[0]))
                    continue
                foundOp = true
                this.next()
                let right = subcall()
                left = new ParseNode(mapItem[1], "", [left, right])
                if (handle != undefined)
                    handle(left)
                break
            }
        }
        return left
    }

    /**
     * Parse a binary operation with right-to-left associativity
     * @param nodeMap List of token types and matching node types that represent
     * all operations that need to be parsed
     * @param subcall The function to call to parse a subexpression, e.g. for
     * parsing sums this would call a function parsing a product
     * @param handle A function that is called every time a parse node is
     * created in this function
     */
    private parseBinaryRight(nodeMap: [TokenType, NodeType][], subcall: () =>
    ParseNode, handle?: (node: ParseNode) => void): ParseNode {
        let left = subcall()
        for (let mapItem of nodeMap) {
            if (!this.accept(mapItem[0]))
                continue
            this.next()
            let right = this.parseBinaryRight(nodeMap, subcall, handle)
            let parent = new ParseNode(mapItem[1], "", [left, right])
            if (handle != undefined)
                handle(parent)
            return parent
        }
        return left
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
        if (this.accept(type))
            return
        throw Error(`Unexpected token of type ${this.cur().type}, expected `
        + `${type}`)
    }

    /**
     * Check if the current token is of the given type
     * @param type The type to compare against
     * @returns Whether the current token is of the given type
     */
    private accept(type: TokenType | TokenType[]): boolean {
        if (!(type instanceof Array))
            type = [type]
        for (let t of type)
            if (this.accept(t))
                return true
        return false
    }

}
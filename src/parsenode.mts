import { Loc } from "./loc.mjs"
export { ParseNode, NodeType }

/**
 * Type of a node in the parse tree
 */
enum NodeType {

    // Atoms
    ID, NUM, STR,
    // Assignment operators
    ASSIGN, ASSIGN_ADD, ASSIGN_SUB, ASSIGN_MUL, ASSIGN_DIV, ASSIGN_MOD,
    // Arithmetic operators
    ADD, SUB, MUL, DIV, MOD, NEG,
    // Logical operators
    AND, OR, NOT,
    // Comparison operators
    EQ, NEQ, LT, LTE, GT, GTE,

    // Control flow
    IF, WHILE, RETURN,
    // Function calls (with parameters as children), function definitions
    CALL, FUNCTION,
    // Code block
    BLOCK,

    // Error parse node
    ERR,

}

/**
 * Node in the parse tree produced by the parser
 */
class ParseNode {

    // The type of the parse node
    type: NodeType
    // Content of the parse node, empty by default
    content: string
    // Parse node children
    children: ParseNode[]
    // Location of the parse node
    loc: Loc

    /**
     * Constructor
     * @param type The type of the parse node
     * @param content The content of the parse node (default empty)
     * @param children The children of the parse node (default empty array).
     * Array will always be copied (shallow copy)
     * @param loc Location of the parse node (default unknown)
     */
    constructor(type: NodeType, content?: string, children?: ParseNode[], loc?:
    Loc) {
        this.type = type
        this.content = content ?? ""
        this.children = children == undefined ? [] : children.slice()
        this.loc = loc ?? new Loc()
    }

}
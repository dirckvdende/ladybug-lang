
export { ParseNode, NodeType }

/**
 * Type of a node in the parse tree
 */
enum NodeType {

    // Atoms
    ID, NUM,
    // Operators
    ASSIGN, ADD, SUB, MUL, DIV, MOD,
    // Control flow
    IF, WHILE,
    // Function calls (with parameters as children)
    CALL,
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

    /**
     * Constructor
     * @param type The type of the parse node
     * @param content The content of the parse node (default empty)
     * @param children The children of the parse node (default empty array).
     * Array will always be copied (shallow copy)
     */
    constructor(type: NodeType, content?: string, children?: ParseNode[]) {
        this.type = type
        this.content = content ?? ""
        this.children = children == undefined ? [] : children.slice()
    }

}
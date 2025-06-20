
export { Ladybug, ReturnValue, ValueType }
import { Lexer } from "./lexer.mjs"
import { Parser } from "./parser.mjs"
import { Dict } from "./dict.mjs"
import { NodeType, ParseNode } from "./parsenode.mjs"
import { ReturnValue, ValueType } from "./returnvalue.mjs"

/**
 * The global interpreter class for running ladybug code and managing handles
 */
class Ladybug {

    // Handles for functions which can be called from inside the ladybug code,
    // and cannot be overwritten
    handles: Dict<string, (x: ReturnValue[]) => ReturnValue> = new Dict()
    // Stored global variable values
    private vars: Dict<string, ReturnValue> = new Dict()

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Executes the given code. Keep in mind that the state is kept when running
     * code twice, which means first running `x = 5;` and then `y = x + 2;`
     * works
     * @param code The code to execute as a string
     */
    execute(code: string) {
        let lexer = new Lexer()
        lexer.read(code)
        let parser = new Parser()
        this.executeNode(parser.parse(lexer.tokens))
    }

    /**
     * Execute the code stored as a parse node
     * @param node The parse node to execute
     * @returns The return value of the code
     */
    private executeNode(node: ParseNode): ReturnValue {
        switch (node.type) {
            case NodeType.BLOCK:
                this.executeBlock(node)
                return new ReturnValue()
            case NodeType.IF:
                this.executeIf(node)
                return new ReturnValue()
            case NodeType.WHILE:
                this.executeWhile(node)
                return new ReturnValue()
            case NodeType.RETURN:
                this.executeReturn(node)
                return new ReturnValue()
            case NodeType.FUNCTION:
                this.registerFunction(node)
                return new ReturnValue()
            case NodeType.ASSIGN:
            case NodeType.ASSIGN_ADD:
            case NodeType.ASSIGN_SUB:
            case NodeType.ASSIGN_MUL:
            case NodeType.ASSIGN_DIV:
            case NodeType.ASSIGN_MOD:
                return this.executeAssign(node)
            case NodeType.ID:
            case NodeType.NUM:
            case NodeType.STR:
                return this.executeAtom(node)
            case NodeType.CALL:
                return this.executeCall(node)
            case NodeType.ADD:
            case NodeType.SUB:
            case NodeType.MUL:
            case NodeType.DIV:
            case NodeType.MOD:
                return this.executeBinaryArith(node)
            case NodeType.AND:
            case NodeType.OR:
                return this.executeAndOr(node)
            case NodeType.EQ:
            case NodeType.NEQ:
            case NodeType.LT:
            case NodeType.LTE:
            case NodeType.GT:
            case NodeType.GTE:
                return this.executeCompare(node)
            case NodeType.NEG:
                return this.executeNeg(node)
            case NodeType.NOT:
                return this.executeNot(node)
            default:
                throw Error("Unimplemented")
        }
    }

    private executeBlock(node: ParseNode) {
        for (let child of node.children)
            this.executeNode(child)
    }

    private executeIf(node: ParseNode) {

    }

    private executeWhile(node: ParseNode) {

    }

    private registerFunction(node: ParseNode) {

    }

    private executeCall(node: ParseNode): ReturnValue {

    }

    private executeReturn(node: ParseNode) {

    }

    private executeAssign(node: ParseNode): ReturnValue {

    }

    private executeAndOr(node: ParseNode): ReturnValue {

    }

    private executeNot(node: ParseNode): ReturnValue {

    }

    private executeCompare(node: ParseNode): ReturnValue {

    }

    private executeBinaryArith(node: ParseNode): ReturnValue {

    }

    private executeNeg(node: ParseNode): ReturnValue {

    }

    private executeAtom(node: ParseNode): ReturnValue {

    }

}

let lb = new Ladybug()
lb.handles.add("print", (x: ReturnValue[]) => {
    console.log(x[0].content)
    return new ReturnValue()
})
lb.execute("x = 10; print(x + 3);")
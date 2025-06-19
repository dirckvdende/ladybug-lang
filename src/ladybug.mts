
export { Ladybug }
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
                for (let child of node.children)
                    this.executeNode(child)
                return new ReturnValue()
            case NodeType.ASSIGN:
                let rv = this.executeNode(node.children[0])
                this.vars.set(node.content, rv)
                return rv
            case NodeType.NUM:
                return new ReturnValue(ValueType.NUM, node.content)
            case NodeType.ID:
                if (!this.vars.has(node.content))
                    throw Error(`Variable ${node.content} does not have a ` +
                    `value`)
                return this.vars.get(node.content)
            case NodeType.CALL:
                // TODO: Implement user-defined functions
                if (!this.handles.has(node.content))
                    throw Error(`Function ${node.content} is undefined`)
                let args: ReturnValue[] = []
                for (let child of node.children)
                    args.push(this.executeNode(child))
                return this.handles.get(node.content)(args)
            case NodeType.ADD:
                let left = this.executeNode(node.children[0])
                let right = this.executeNode(node.children[1])
                if (left.type != ValueType.NUM || right.type != ValueType.NUM)
                    throw Error("Cannot add non-numeric types")
                return new ReturnValue(ValueType.NUM, String(Number(
                left.content) + Number(right.content)))
            default:
                throw Error("Unimplemented")
        }
    }

}

let lb = new Ladybug()
lb.handles.add("print", (x: ReturnValue[]) => {
    console.log(x[0].content)
    return new ReturnValue()
})
lb.execute("x = 10; print(x + 3);")

export { Ladybug, ReturnValue, ValueType }
import { Lexer } from "./lexer.mjs"
import { Parser } from "./parser.mjs"
import { Dict } from "./dict.mjs"
import { NodeType, ParseNode } from "./parsenode.mjs"
import { ReturnValue, ValueType } from "./returnvalue.mjs"
import { CallStack } from "./callstack.mjs"

/**
 * The global interpreter class for running ladybug code and managing handles
 */
class Ladybug {

    // Handles for functions which can be called from inside the ladybug code,
    // and cannot be overwritten
    handles: Dict<string, (x: ReturnValue[]) => ReturnValue> = new Dict()
    // Call stack of functions and variables
    private callStack: CallStack = new CallStack()
    // Indicates if the current function has returned and nothing more should
    // be executed. If it is undefined, nothing has been returned. If it
    // contains a value a return has happened
    private returnedValue: ReturnValue | undefined = undefined

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
        let root = parser.parse(lexer.tokens)
        this.executeNode(root)
    }

    /**
     * Execute the code stored as a parse node
     * @param node The parse node to execute
     * @returns The return value of the code
     */
    private executeNode(node: ParseNode): ReturnValue {
        if (this.returnedValue != undefined)
            return new ReturnValue()
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
        let condition = this.executeNode(node.children[0])
        if (this.isTruthy(condition))
            this.executeNode(node.children[1])
        else if (node.children.length > 2)
            this.executeNode(node.children[2])
    }

    private executeWhile(node: ParseNode) {
        while (this.isTruthy(this.executeNode(node.children[0])))
            this.executeNode(node.children[1])
    }

    private registerFunction(node: ParseNode) {
        let name = node.content.split("(", 1)[0]
        if (this.handles.has(name))
            throw Error(`The name ${name} is reserved by a handle`)
        this.callStack.set(name, node)
    }

    private executeCall(node: ParseNode): ReturnValue {
        if (this.handles.has(node.content))
            return this.executeHandleCall(node)
        let func = this.callStack.get(node.content)
        if (!(func instanceof ParseNode))
            throw Error(`${node.content} is not a function`)
        let paramNames = func.content.split("(")[1].slice(0, -1).split(",")
        let params = node.children
        if (paramNames.length != params.length)
            throw Error("Number of parameters does not match expected number")
        let values: ReturnValue[] = []
        for (let param of params)
            values.push(this.executeNode(param))
        this.callStack.pushFrame()
        // Set up parameter values
        for (let i = 0; i < params.length; i++) {
            if (values[i] instanceof ParseNode)
                throw Error("Cannot pass a function as a parameter")
            this.callStack.set(paramNames[i], values[i])
        }
        // Call function body
        this.executeNode(func.children[0])
        this.callStack.popFrame()
        let ret = this.returnedValue
        this.returnedValue = undefined
        return ret == undefined ? new ReturnValue() : ret
    }

    private executeHandleCall(node: ParseNode): ReturnValue {
        let handle = this.handles.get(node.content)
        // Set up parameter values
        let values: ReturnValue[] = []
        for (let child of node.children)
            values.push(this.executeNode(child))
        return handle(values)
    }

    private executeReturn(node: ParseNode) {
        let value = new ReturnValue()
        if (node.children.length > 0)
            value = this.executeNode(node.children[0])
        this.returnedValue = value
    }

    private executeAssign(node: ParseNode): ReturnValue {
        // TODO: Compound assignments
        let varName = node.children[0].content
        if (this.handles.has(varName))
            throw Error(`The name ${varName} is reserved by a handle`)
        let right = this.executeNode(node.children[1])
        this.callStack.set(varName, right)
        return right
    }

    private executeAndOr(node: ParseNode): ReturnValue {
        let left = this.isTruthy(this.executeNode(node.children[0]))
        if (!left && node.type == NodeType.AND)
            return new ReturnValue(ValueType.NUM, "0")
        if (left && node.type == NodeType.OR)
            return new ReturnValue(ValueType.NUM, "1")
        let right = this.isTruthy(this.executeNode(node.children[1]))
        return new ReturnValue(ValueType.NUM, right ? "1" : "0")
    }

    private executeNot(node: ParseNode): ReturnValue {
        let child = this.isTruthy(this.executeNode(node.children[0]))
        return new ReturnValue(ValueType.NUM, child ? "0" : "1")
    }

    private executeCompare(node: ParseNode): ReturnValue {
        let comp: (x: number, y: number) => boolean
        switch (node.type) {
            case NodeType.EQ:
            case NodeType.NEQ:
                return this.executeEq(node)
            case NodeType.LT:
                comp = (x, y) => x < y
                break
            case NodeType.LTE:
                comp = (x, y) => x <= y
                break
            case NodeType.GT:
                comp = (x, y) => x > y
                break
            case NodeType.GTE:
                comp = (x, y) => x >= y
                break
            default:
                comp = () => false
        }
        let left = this.executeNode(node.children[0])
        let right = this.executeNode(node.children[1])
        if (left.type != ValueType.NUM || right.type != ValueType.NUM)
            throw Error("Cannot compare non-numeric types")
        let x = Number(left.content)
        let y = Number(right.content)
        return new ReturnValue(ValueType.NUM, comp(x, y) ? "1" : "0")
    }

    private executeEq(node: ParseNode): ReturnValue {
        let left = this.executeNode(node.children[0])
        let right = this.executeNode(node.children[1])
        if (left.type != right.type)
            return new ReturnValue(ValueType.NUM, "0")
        let result = false
        if (left.type == ValueType.NUM)
            result = Number(left.content) == Number(right.content)
        else
            result = left.content == right.content
        return new ReturnValue(ValueType.NUM, result ? "1" : "0")
    }

    private executeBinaryArith(node: ParseNode): ReturnValue {
        let left = this.executeNode(node.children[0])
        let right = this.executeNode(node.children[1])
        if (node.type == NodeType.ADD && (left.type == ValueType.STR ||
        right.type == ValueType.STR)) {
            if (left.type != ValueType.STR || right.type != ValueType.STR)
                throw Error("Cannot concatenate non-string and string")
            return new ReturnValue(ValueType.STR, left.content + right.content)
        }
        if (left.type != ValueType.NUM || right.type != ValueType.NUM)
            throw Error("Cannot perform arithmatic on non-number type")
        let op: (x: number, y: number) => number
        switch (node.type) {
            case NodeType.ADD:
                op = (x, y) => x + y
                break
            case NodeType.SUB:
                op = (x, y) => x - y
                break
            case NodeType.MUL:
                op = (x, y) => x * y
                break
            case NodeType.DIV:
                op = (x, y) => x / y
                break
            case NodeType.MOD:
                op = (x, y) => x % y
                break
            default:
                op = () => 0
        }
        let x = Number(left.content)
        let y = Number(right.content)
        return new ReturnValue(ValueType.NUM, String(op(x, y)))
    }

    private executeNeg(node: ParseNode): ReturnValue {
        let child = this.executeNode(node.children[0])
        if (child.type != ValueType.NUM)
            throw Error("Cannot negate non-numeric type")
        return new ReturnValue(ValueType.NUM, String(-Number(child.content)))
    }

    private executeAtom(node: ParseNode): ReturnValue {
        switch (node.type) {
            case NodeType.ID:
                let value = this.callStack.get(node.content)
                if (!(value instanceof ReturnValue))
                    throw Error("Cannot use function in expression without " +
                    "calling it")
                return value
            case NodeType.NUM:
                return new ReturnValue(ValueType.NUM, node.content)
            case NodeType.STR:
                return new ReturnValue(ValueType.STR, node.content)
            default:
                throw Error("Unexpected node type")
        }
    }

    /**
     * Check if a certain return value is truthy (i.e. evaluated to true if
     * converted to a boolean)
     * @param value The return value to check
     * @returns If the value is truthy
     */
    private isTruthy(value: ReturnValue): boolean {
        return !(value.type == ValueType.NUM && Number(value.content) == 0)
    }

}

let lb = new Ladybug()
lb.handles.add("print", (x: ReturnValue[]): ReturnValue => {
    console.log(x[0].content)
    return new ReturnValue()
})
lb.execute(`
    function fib(x) {
        if (x > 2)
            return fib(x - 1) + fib(x - 2)
        return 1
    }
    print(fib(9));
`)
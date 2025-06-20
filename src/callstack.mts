
export { CallStack }
import { ParseNode } from "./parsenode.mjs"
import { ReturnValue } from "./returnvalue.mjs"
import { Dict } from "./dict.mjs"

/**
 * A call stack of frames, each with variables names and functions with their
 * values/contents
 */
class CallStack<T = ReturnValue | ParseNode> {

    // The stack of frames. New frames are added at the back, frames are also
    // removed from the back
    private frames: Dict<string, T>[] = []

    /**
     * Constructor. The stack is created with one frame
     */
    constructor() {
        this.frames.push(new Dict())
    }

    /**
     * Put a new stack frame at the top of the stack
     */
    pushFrame() {
        this.frames.push(new Dict())
    }

    /**
     * Remove the top stack frame. If this frame has any contents these are
     * removed
     */
    popFrame() {
        this.frames.pop()
    }

    /**
     * Get the value of a variable from the topmost frame it occurs in. If no
     * frame contains the variable an error is thrown
     * @param name The name of the variable
     * @returns The value of the variable
     */
    get(name: string): T {
        for (let i = this.frames.length - 1; i >= 0; i--)
            if (this.frames[i].has(name))
                return this.frames[i].get(name)
        throw Error(`Name ${name} was not defined in this context`)
    }

    /**
     * Check if a variable with the given name exists anywhere in the stack
     * @param name The name of the variable
     * @returns If any stack frame contains the variable
     */
    has(name: string): boolean {
        for (let frame of this.frames)
            if (frame.has(name))
                return true
        return false
    }

    /**
     * Set the value of the given variable in the top stack frame. If there is
     * a variable with the same name further down the stack, this variable is
     * unaltered
     * @param name The name of the variable
     * @param value The value to assign
     */
    set(name: string, value: T) {
        this.frames[this.frames.length - 1].set(name, value)
    }

}
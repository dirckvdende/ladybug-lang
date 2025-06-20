
export { ReturnValue, ValueType }

/**
 * The different types that a value in ladybug can have. Keep in mind that
 * ladybug is dynamically typed
 */
enum ValueType {

    // Numbers
    NUM,
    // Strings
    STR,
    // No-return
    VOID,

}

/**
 * A value returned from an expression, for example `3 + 4` returns
 * ReturnValue(NUM, "7")
 */
class ReturnValue {

    // The type of return value, VOID by default
    type: ValueType
    // The return value content, empty by default
    content: string

    /**
     * Constructor
     * @param type The type of the return value, VOID by default
     * @param content The content of the return value, empty by default
     */
    constructor(type?: ValueType, content?: string) {
        this.type = type ?? ValueType.VOID
        this.content = content ?? ""
    }

}
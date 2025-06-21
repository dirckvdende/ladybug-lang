
export { Loc }

/**
 * Represents a location in the input, with line and column number. If either is
 * -1 that means it is unknown
 */
class Loc {

    // Line number of the location
    private _line: number
    // Column number of the location
    private _col: number

    /**
     * Constructor
     * @param line The line number, defaults to -1
     * @param col The column number, defaults to -1
     */
    constructor(line?: number, col?: number) {
        this._line = line ?? -1
        this._col = col ?? -1
    }

    /**
     * Convert location to a string
     * @returns The string representation
     */
    str(): string {
        if (this._line == -1)
            return "<unknown location>"
        return `<line ${this._line}:${this._col}>`
    }

    /**
     * The line number of the location
     */
    get line(): number {
        return this._line
    }

    /**
     * The column number of the location
     */
    get col(): number {
        return this._col
    }

}
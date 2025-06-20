
import { exit } from "process"
import { Ladybug, ReturnValue, ValueType } from "../src/ladybug.mjs"
import fs = require("fs")

/**
 * Wrapper for the assertion handler function
 * @param args The arguments passed to the handler
 * @returns If the assertion was successful or failed
 */
function assertWrapper(args: ReturnValue[]): boolean {
    for (let arg of args) {
        if (arg.type != ValueType.NUM)
            return false
        if (Number(arg.content) == 0)
            return false
    }
    return true
}

let failures = 0
let successes = 0
for (let file of fs.readdirSync("./testfiles")) {
    let content = fs.readFileSync(`./testfiles/${file}`, { encoding: "utf-8" })
    let lb = new Ladybug()
    let success = true
    let index = 0
    lb.handles.add("assert", (args: ReturnValue[]): ReturnValue => {
        index++
        if (!assertWrapper(args)) {
            console.log(`Failed assertion #${index}`)
            success = false
        }
        return new ReturnValue()
    })
    lb.execute(content)
    if (success) {
        console.log(`\u001b[32m[ SUCCESS ]\u001b[0m ${file}`)
        successes++
    } else {
        console.log(`\u001b[31m[ FAILURE ]\u001b[0m ${file}`)
        failures++
    }
}

if (failures == 0) {
    console.log()
    console.log("\u001b[32m---------------------------------------------------")
    console.log(`\u001b[32m ALL ${failures + successes} TESTS PASSED`)
    console.log()
} else {
    console.log()
    console.log("\u001b[31m---------------------------------------------------")
    console.log(`\u001b[31m ${failures} OUT OF ${failures + successes} TESTS ` +
    `FAILED`)
    console.log()
    exit(1)
}
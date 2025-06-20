
# Ladybug-lang

Ladybug-lang is a simple JavaScript-like programming language built in TypeScript. Its main advantages are its simplicity (making it easy to modify and lightweight) and the easy-to-use support for "handles", functions written in TypeScript that can be called from the ladybug script. The language is dynamically typed, with support for strings and numbers.

## Syntax

Expression are built from the following:

- **Identifiers**, which consist of alphanumeric characters and `_`, not starting with a number
- **Numbers**, which can contain a single period, but not at the start
- **String**, enclosed by either `"` or `'`. Escape characters with `\`

All valid operations on expressions are

- `=` (assignment), `+=`, `-=`, `*=`, `/=`, `%=`
- `+`, `-` (binary minus), `*`, `/`, `%`, `-` (unary minus)
- `&&`, `||`, `!`
- `==` (equality), `!=`, `<`, `<=`, `>`, `>=`
- Function calls, such as `f(4, 5)` if `f` is a function

Each line of code can be either an expression followed by a semicolon (`;`) or one of the following:

### If-statement

Which can also have an else, such as in the following example. The curly braces `{}` are optional if there is only a single line of code inside one of the blocks.

```
if (x > 3) {
    y = 6;
    x = 4;
} else if (x == 2) {
    y = 7;
} else {
    y = 8;
}
```

### While loop

Again curly braces only necessary if there is a single line of code inside the loop body.

```
while (x > 3)
    x -= 1;
```

### Function

A function can be defined with zero or more arguments as follows:

```
function fib(x) {
    if (x > 2)
        return fib(x - 1) + fib(x - 2);
    return 1;
}
```

### Return

Return from a function with some value or end the program if not inside a function. See the example above.

## Calling the interpreter

The `src` directory inside this project contains the file `ladybug.mts`. When working with ladybug you should (most of the time) import the following from the file:

```ts
import { Ladybug, ReturnValue, ValueType } from "./src/ladybug.mjs";
```

Some piece of code can then be run as follows:

```ts
let lb = new Ladybug();
lb.execute("x = 5;");
```

This executes the code, but does not provide any output or interaction with TypeScript (note that ladybug has no print function). However, we can add a handle that can be called from inside the ladybug code. Each handler should accept a single argument, which is used to pass an array of ladybug arguments as `ReturnValue` objects. It should also return a `ReturnValue` object. These objects have two fields: `type` and `content`. The first has type `ValueType` and contains the type of values the object can store. It can be one of `VOID`, `NUM`, and `STR`. The content is a string with content (so even if the type is `NUM` this is a string containing the number!). Let's create a function that prints the first argument that is passed, then run the ladybug code `x = 5; print(x);`.

```ts
let lb = new Ladybug();
lb.handles.add("print", (args: ReturnValue[]): ReturnValue => {
    console.log(args[0].content);
    return new ReturnValue(ValueType.VOID, "");
});
lb.execute("x = 5; print(x);")
```

This will print `5` to the console!

## Some notes

Known issues:

- Very unclear error messages
- No possibility of adding comments

//const fs = require("fs").promises;
//fs.readFile("gze.oblivionScript").then(content => console.log(content.toString()));
function inBetween(string, start, end) {
    return string.slice(string.indexOf(start) + 1).split(end)[0];
};

function testString(string) {
    return string.startsWith("'") && string.endsWith("'");
};
let typeCodes = {
    int: "number",
    str: "string"
};
class Function {
    constructor(source, args, callback) {
        this.arguments = args;
        this.callback = callback;
        this.source = source;
    }
    call(...args) {
        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            let expected = this.arguments[i];
            let type = testString(arg) ? "string" : !isNaN(Number(arg)) ? "number" : "unknown";
            switch (type) {
                case "string": {
                    arg = arg.split("");
                    arg.shift();
                    arg.pop();
                    arg = arg.join("");
                }
                break;
            case "number": {
                arg = Number(arg);
            }
            break;
            }
            if (type !== typeCodes[expected.type]) {
                throw new Error(`Unexpected ${type} in function call. Expected ${expected.type}`);
                return;
            }
        }
        for (let i = 0; i < args.length; i++) {
            args[i] = {
                name: this.arguments[i].name,
                value: args[i]
            };
        }
        return this.callback(...args);
    }
}
class Program {
    constructor(code) {
        this.code = code;
        this.variables = {};
        this.state = 0;
        this.functions = {};
        this.lastOutput = undefined;
        // 0 - looking for variable declaration
        // 1 - execution
        // 2 - large declaration
    }
    handle_declare(line, code) {
        const type = code.shift();
        const name = code.shift();
        let value = code.join(" ");
        if (value.includes("last")) value = this.lastOutput;
        switch (line, type) {
            case "int": {
                this.variables[name] = Number(value);
            } break;
            case "str": {
                this.variables[name] = value;
            } break;
            case "bool": {
                this.variables[name] = (value === "true");
            } break;
        }
    }
    handle_function(line, code) {
        let name = code.shift();
        let args = [];
        let splitty = inBetween(line, "(", ")").split(" ").map(entry => {
            if (entry.endsWith(",")) {
                entry = entry.split("");
                entry.pop();
                entry = entry.join("");
            }
            return entry;
        });
        for (let i = 0; i < splitty.length; i++) {
            let type = splitty[i];
            let name = splitty[i + 1];
            args.push({
                type,
                name
            });
            i++;
        }
        let callback = (...args) => {
            let code = "";
            for (let key in this.variables) {
                code += `let ${key} = ${this.variables[key]};`;
            }
            for (let arg of args) {
                code += `let ${arg.name} = ${arg.value};`;
            }
            code += line.split(" => ")[1];
            const out = eval(code);
            return out;
        };
        this.functions[name] = new Function(this, args, callback);
    }
    handle_default(line, code) {
        let name = code.shift();
        if (this.functions[name]) {
            let args = inBetween(line, "(", ")").split(" ").map(entry => {
                if (entry.endsWith(",")) {
                    entry = entry.split("");
                    entry.pop();
                    entry = entry.join("");
                }
                return entry;
            });
            return this.functions[name].call(...args);
        }
    }
    handle_print(line, code) {
        let toPrint = code.join(" ");
        if (toPrint.replace(" ", "") === "last") toPrint = this.lastOutput;
        if (this.variables[code.join(" ")]) toPrint = this.variables[code.join(" ")];
        console.log(toPrint);
    }
    compute(line) {
        if (line.endsWith(";")) {
            line = line.split("");
            line.pop();
            line.join("");
        }
        let code = line.split(" ");
        let output = undefined;
        const operation = code.shift();
        if (this[`handle_${operation}`]) output = this[`handle_${operation}`](line, code);
        else output = this[`handle_default`](line, code);
        this.lastOutput = output;
    }
    run() {
        const lines = this.code.split("\n");
        for (let i = 0; i < lines.length; i ++) {
            this.compute(lines[i]);
        }
        return this.lastOutput;
    }
}

function execute(code) {
    let program = new Program(code);
    program.run();
};
module.exports = path => require("fs").promises.readFile(path).then(content => execute(content.toString()));
// TODO: rewrite execution with cache and add global variables and split this into files last result system

function inBetween(string, start, end) {
    return string.slice(string.indexOf(start) + 1).split(end)[0];
}

function testString(string) {
    return string.startsWith("'") && string.endsWith("'");
}

function cleanUp(string, ugly) {
    for (let i = 0; i < string.length; i++)
        string[i] = string[i].replace(ugly, `\\${ugly}`);
    return string;
}

const typeCodes = {
    int: "number",
    str: "string"
};

const handlers = {
    declare: function(context, args) {
        if (!typeCodes[args[0]]) throw new Error("Unknown type " + args[0]);
        const type = args.shift();
        const name = args.shift();
        args = args.join(" ");
        args = args === "last" ? context.lastValue : cleanUp(args, "'");
        context.variables.push({
            name: name,
            type: type
        });
        return {
            text: `let ${name} = ${type !== "int" ? "'" : "+"}${args}${type !== "int" ? "'" : ""};`,
            context
        };
    },
    function: function(context, args) {
        const full = args.join(" ");
        const name = args.shift();
        args = args.join(" ");
        const arguments = inBetween(args, "(", ")");
        args = args.replace(`(${arguments})`, "").split(" ");
        let output = `function ${name}(`;
        output += arguments.split(", ").map((entry) => entry.split(" ").pop()).join(", ");
        output += `) { return ${full.split("=>").pop()} };`.trim();
        context.variables.push({
            name: name,
            type: "function"
        });
        return {
            text: output,
            context
        };
    },
    default: function(context, line) {
        let text = "";
        const variable = context.variables.find((instance) =>
            line.startsWith(instance.name)
        );
        if (variable && variable.type === "function") {
            let args = inBetween(line, "(", ")");
            text = `${variable.name}(${args});`;
        }
        return {
            text: text,
            context
        };
    }
};

function getJSFromLine(context, line) {
    let args = line.split(" ");
    const action = args.shift();
    if (handlers[action]) return handlers[action](context, args);
    return handlers.default(context, line);
}

function compile(code) {
    let context = {
        code: "",
        lastValue: null,
        variables: []
    };
    let compiled = "";
    code = code.split("\n");
    code.forEach((line) => {
        const result = getJSFromLine(context, line);
        compiled += result.text;
        context = result.context;
    });
    console.log(compiled);
    return eval(compiled);
}
require("fs").promises.readFile("main.ob").then((buff) => console.log(compile(buff.toString())));

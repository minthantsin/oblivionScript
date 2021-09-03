function inBetween(string, start, end) {
    return string.slice(string.indexOf(start) + 1).split(end)[0];
};

function testString(string) {
    return string.startsWith("'") && string.endsWith("'");
};

function cleanUp(string, ugly) {
    for (let i = 0; i < string.length; i ++) string[i] = string[i].replace(ugly, `\\${ugly}`);
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
        return `let ${name} = ${type !== "int" ? "'" : "+"}${args}${type !== "int" ? "'" : ""}`;
    },
    function: function(context, args) {}
};

function getJSFromLine(context, line) {
    let args = line.split(" ");
    const action = args.shift();
    if (handlers[action]) return handlers[action](context, args);
    return handlers.default(context, args);
}

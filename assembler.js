/**
 * Created by Spencer on 12/8/15.
 */
var instructions = {
    "MOVA": {"opcode": 0, "type": "2regf"},
    "INC": {"opcode": 1, "type": "2regf"},
    "ADD": {"opcode": 2, "type": "3reg"},
    "SUB": {"opcode": 5, "type": "3reg"},
    "DEC": {"opcode": 6, "type": "2regf"},
    "AND": {"opcode": 8, "type": "3reg"},
    "OR": {"opcode": 9, "type": "3reg"},
    "XOR": {"opcode": 10, "type": "3reg"},
    "NOT": {"opcode": 11, "type": "2regf"},
    "MOVB": {"opcode": 12, "type": "2regl"},
    "SHR": {"opcode": 13, "type": "2regl"},
    "SHL": {"opcode": 14, "type": "2regl"},
    "LDI": {"opcode": 76, "type": "1regop"},
    "ADI": {"opcode": 66, "type": "2regop"},
    "LD": {"opcode": 16, "type": "2regf"},
    "ST": {"opcode": 32, "type": "2regl"},
    "BRZ": {"opcode": 96, "type": "1regad"},
    "BRN": {"opcode": 97, "type": "1regad"},
    "JMP": {"opcode": 112, "type": "1reg"}
};

var argTypes = {
    "2regf": {"args": {"rd": "reg", "ra": "reg"}, "ord": ["rd", "ra", 0]},
    "2regl": {"args": {"rd": "reg", "rb": "reg"}, "ord": ["rd", 0, "rb"]},
    "3reg": {"args": {"rd": "reg", "ra": "reg", "rb": "reg"}, "ord": ["rd", "ra", "rb"]},
    "1regop": {"args": {"rd": "reg", "op": "op"}, "ord": ["rd", 0, "op"]},
    "2regop": {"args": {"rd": "reg", "ra": "reg", "op": "op"}, "ord": ["rd", "ra", "op"]},
    "1reg": {"args": {"rd": "reg"}, "ord": [0, 0, "rd"]},
    "1regad": {"args": {"rd": "reg", "addr": "addr"}, "ord": ["addr", "rd", "addr"]}
}

var labels = {};

var macros = {};

var failed = false;

function assemble(code){
    failed = false;
    code += "\n";
    var inLineComment = false;
    var inExtComment = false;
    var nextToken = false;
    var nextLine = false;
    var tokens = [];
    var tokenLineToRealLine = [];
    tokens[0] = [];
    var readLines = 0;
    for(var i = 0; i < code.length; i++){
        if(code[i] == "\n"){
            inLineComment = false;
            if(tokenLineToRealLine[tokens.length - 1] == undefined)
                tokenLineToRealLine[tokens.length - 1] = readLines;
            //tokensNewLine(tokens);
            nextLine = true;
            readLines++;
            nextToken = false;
        }
        else if(code[i] == "/") {
            if (code[i + 1] == "/") {
                inLineComment = true;
                i++;
            }
            else if (code[i + 1] == "*") {
                inExtComment = true;
                i++;
            }
            else {
                if(!inLineComment && !inExtComment) {
                    addToToken(tokens, code[i], nextToken, nextLine);
                    nextToken = false;
                    nextLine = false;
                }
            }
        }
        else if(code[i] == " " || code[i] == ",") {
            if (!inLineComment && !inExtComment){
                nextToken = true;
            }
        }
        else if(code[i] == "*"){
            if(code[i + 1] == "/"){
                inExtComment = false;
                i++;
            }
            else{
                if(!inLineComment && !inExtComment) {
                    addToToken(tokens, code[i], nextToken, nextLine);
                    nextToken = false;
                    nextLine = false;
                }
            }
        }
        else{
            if(!inLineComment && !inExtComment) {
                addToToken(tokens, code[i], nextToken, nextLine);
                nextToken = false;
                nextLine = false;
            }
        }
    }
    var codeTokens = [];
    var labelInds = {};

    for(var i = 0; i < tokens.length; i++){
        var line = tokens[i];
        if(instructions[line[0].toUpperCase()] != null){
            line[0] = line[0].toUpperCase();
            codeTokens[codeTokens.length] = line;
        }
        else if(line[line.length - 1].endsWith(":")){
            if(line.length > 1){
                logError("Invalid label identifier on line " + tokenLineToRealLine[i]);
                logError("Labels can only contain 1 word");
                errorPrintContext(code, tokenLineToRealLine[i]);
            }
            else{
                labelInds[line[0].split(":")[0]] = code.length;
            }
        }
        else{
            logError("Unidentified instruction: " + line[0]);
            errorPrintContext(code, tokenLineToRealLine[i]);
        }
    }
    var out = "\n";
    var padding = "0000";
    for(var i = 0; i < codeTokens.length; i++){
        var opcd = createOp(codeTokens[i], i, labelInds, tokenLineToRealLine[i], code).toString(16);
        out += (padding + opcd).substr(-4) + "\n";
    }
    if(failed){
        //Fail entirely
        return null;
    }
    return out;
}

function decodeRegister(reg, line, code){
    if(!reg.startsWith("r")){
        logError("Error: register in incorrect format");
        errorPrintContext(code, line);
    }
    var out = parseInt(reg.split("r")[1]);
    if(out > 7 || out < 0){
        logError("Error: invalid register index: " + out + " (the cpu only supports r0 - r7)");
        errorPrintContext(code, line);
    }
    return out;
}

function createOp(line, lineNum, labels, codeLine, codeText){
    var op = instructions[line[0]];
    var schema = argTypes[op.type];
    if(line.length != (Object.keys(schema.args).length + 1)){
        logError("Error! Invalid number of arguments for instruction " + line[0]);
    }
    else if(op.type == "1regad"){
        var addr = line[2];
        var offset;
        if(isNaN(addr)){
            offset = labels[addr] - lineNum;
        }
        else{
            offset = parseInt(addr);// - lineNum;
        }
        var left = offset & 7;
        var right = (offset >> 3) & 7;
        return makeOperation(line[0], right, decodeRegister(line[1], codeLine, codeText), left);
    }
    else{
        var args = [line[0]];
        var mArgs = {};
        var i = 0;
        for(var key in schema.args){
            switch(schema.args[key]){
                case "reg": mArgs[key] = decodeRegister(line[i + 1], codeLine, codeText); break;
                case "op": if(parseInt(line[i + 1])){}; mArgs[key] = parseInt(line[i + 1]); break;
            }
            i++;
        }
        for(var ind = 0; ind <  schema.ord.length; ind++){
            if(!isNaN(schema.ord[ind])){
                args[ind + 1] = schema.ord[ind];
            }
            else{
                args[ind + 1] = parseInt(mArgs[schema.ord[ind]]);
            }
        }
        return makeOperation(args[0], args[1], args[2], args[3]);
    }
}

function makeOperation(opcode, arg1, source, arg2){
    if(isNaN(arg1)){
        arg1 = 0;
    }
    if(isNaN(arg2)){
        arg2 = 0;
    }
    if(isNaN(source)){
        source = 0;
    }
    if(instructions[opcode] == undefined){
        logError("Error: undefined opcode");
    }
    return ((instructions[opcode].opcode & 127) << 9 )| ((arg1 & 7) << 6) | ((source & 7) << 3) | (arg2 & 7);
}

function errorPrintContext(str, line){
    var lines = str.split("\n");
    if(line > 0){
        logError(lines[line - 1]);
    }
    logError(lines[line]);
    if(line < lines.length - 1){
        logError(lines[line + 1]);
    }
}

function logError(str){
    console.log(str);
    failed = true;
}

function addToToken(tokens, char, next, newLine){
    if(newLine){
        if(tokens[tokens.length - 1].length != 0){
            tokens[tokens.length] = [];
        }
    }
    var line = tokens[tokens.length - 1];
    if (line.length === 0){
        line[0] = "";
    }
    if(next){
        line[line.length] = "";
    }
    line[line.length - 1] += char;
}

function tokensNewLine(tokens){
    if(tokens[tokens.length - 1].length == 0){
        return;
    }
    tokens[tokens.length] = [];
}
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

var macros = {};

var failed = false;
var labelsEnabled = true;
var errors = [];
var readLines;
var tokenLineToRealLine;
function assemble(code){
    var inlineLabels = 0;
    errors = [];
    failed = false;
    code += "\n";
    var inLineComment = false;
    var inExtComment = false;
    var nextToken = false;
    var nextLine = false;
    var tokens = [];
    tokenLineToRealLine = [];
    tokens[0] = [];
    readLines = 0;
    for(var i = 0; i < code.length; i++){
        if(code[i] == "\n"){
            inLineComment = false;

            if(code[i - 1] != ":")
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
                nextLine = (code[i] == ":");
                if(code[i] == ":") {
                    inlineLabels++;
                    if(code[i + 1] == " "){
                        i++;
                    }
                }
            }
        }
    }

    if(tokens.length == 1 && tokens[0].length == 1 && tokens[0][0] == "undefined"){
        logError("Error: cannot assemble nothing. Please enter assembly code and try again.");
        var o = {};
        o.errors = errors;
        return o;
    }
    var codeTokens = [];
    var codeTokenToGlobalToken = [];
    var labelInds = {};

    for(var i = 0; i < tokens.length; i++){
        var line = tokens[i];
        if(instructions[line[0].toUpperCase()] != null){
            line[0] = line[0].toUpperCase();
            codeTokens[codeTokens.length] = line;
            codeTokenToGlobalToken.push(i);
        }
        else if(line[line.length - 1].endsWith(":") && labelsEnabled){
            if(line.length > 1){
                logError("Invalid label identifier on line " + tokenLineToRealLine[i]);
                logError("Labels can only contain 1 word");
                errorPrintContext(code, tokenLineToRealLine[i]);
            }
            else {
                if (labelInds[line[0].split(":")[0]] != undefined) {
                    logError("Error: attempted to redefine label: " + line[0].split(":")[0]);
                    errorPrintContext(code, tokenLineToRealLine[i]);
                }
                else {
                    labelInds[line[0].split(":")[0]] = codeTokens.length;
                }
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
        var op = createOp(codeTokens[i], i, labelInds, codeTokenToGlobalToken[tokenLineToRealLine[i]], code);
        var opcd = op != null ? op.toString(16) : "";
        out += (padding + opcd).substr(-4) + "\n";
    }
    if(failed){
        var o = {};
        o.errors = errors;
        return o;
    }
    var o = {};
    o.code = out;
    return o;
}

function decodeRegister(reg, line, code, argnum){
    if(!reg.toLowerCase().startsWith("r")){
        printInstArgErr(code, line, argnum, "Error: invalid register format\nValid registers are r0 - r7");
    }
    var out = parseInt(reg.toLowerCase().split("r")[1]);
    if(out > 7 || out < 0){
        printInstArgErr(code, line, argnum, "Error: invalid register index: " + out + " (the cpu only supports r0 - r7)");
    }
    return out;
}

function createOp(line, lineNum, labels, codeLine, codeText){
    var op = instructions[line[0]];
    var schema = argTypes[op.type];
    if(line.length != (Object.keys(schema.args).length + 1)){
        logError("Error: Invalid number of arguments for instruction " + line[0]);
        var erargs = [];
        for(var key in schema.args){
            switch(schema.args[key]){
                case "reg": erargs.push("register"); break;
                case "op": erargs.push("operator"); break;
                case "addr": erargs.push("offset"); break;
            }
        }
        logError(line[0] + " takes arguments " + erargs.join(", "));
        logError("For additional help on the " + line[0] + " instruction, click " + "here".link("javascript:openHelp(\"" + line[0] + "\");"));
        errorPrintContext(codeText, codeLine);
    }
    else if(op.type == "1regad"){
        var addr = line[2];
        var offset;
        if(isNaN(addr)){
            if(labels[addr] == undefined){
                if(!isNaN(addr.toLowerCase().split("r")[1])){
                    printInstArgErr(codeText, codeLine, 1, "Error: received register where constant expected");
                }
                else {
                    printInstArgErr(codeText, codeLine, 1, "Error: undefined label " + addr);
                }
            }
            offset = labels[addr] - lineNum;
        }
        else{
            offset = parseInt(addr);
        }
        if(offset < -32 || offset > 31){
            var errNum = addr;
            if(isNaN(errNum)){
                errNum += " (" + offset + ")";
            }
            printInstArgErr(codeText, codeLine, 1, "Error: branch offset out of range: " + errNum);
        }
        var left = offset & 7;
        var right = (offset >> 3) & 7;
        return makeOperation(line[0], right, decodeRegister(line[1], codeLine, codeText, 1), left);
    }
    else{
        var args = [line[0]];
        var mArgs = {};
        var i = 0;
        for(var key in schema.args){
            switch(schema.args[key]){
                case "reg": mArgs[key] = decodeRegister(line[i + 1], codeLine, codeText, i); break;
                case "op":  var val;
                            if(isNaN(line[i + 1])){
                                if(labels[line[i + 1]] == undefined){
                                    if(!isNaN(line[i + 1].toLowerCase().split("r")[1])){
                                        printInstArgErr(codeText, codeLine, i, "Error: received register where constant expected");
                                    }
                                    else {
                                        printInstArgErr(codeText, codeLine, i, "Error: undefined label " + line[i + 1]);
                                    }
                                }
                                val = labels[line[i + 1]];
                            }
                            else{
                                 val = parseInt(line[i + 1]);
                            }
                            if(val < 0 || val > 7){
                                printInstArgErr(codeText, codeLine, i, "Error: operator out of range: " + val + " (the supported range is 0 - 7)");
                            }
                            mArgs[key] = parseInt(val); break;
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

function printInstArgErr(str, line, argNum, errorText){
    logError(errorText);
    var lines = str.split("\n");
    var inst = lines[line].split(" ")[0];
    logError("For additional help on the " + inst + " instruction, click " + "here".link("javascript:openHelp(\"" + inst + "\");"));
    if(line > 0){
        logError(lines[line - 1]);
    }
    var probLine = lines[line].split(" ");
    probLine[argNum + 1] = "<b>" + probLine[argNum + 1] + "</b>";
    logError(">" + probLine.join(" "));
    if(line < lines.length - 1){
        logError(lines[line + 1]);
    }
}

function errorPrintContext(str, line){
    var lines = str.split("\n");
    if(line > 0){
        logError(lines[line - 1]);
    }
    logError(">" + lines[line]);
    if(line < lines.length - 1){
        logError(lines[line + 1]);
    }
}

function logError(str){
    errors.push(str);
    failed = true;
}

function addToToken(tokens, char, next, newLine){
    if(tokenLineToRealLine[tokens.length - 1] == undefined) {
        tokenLineToRealLine[tokens.length - 1] = readLines;
    }
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
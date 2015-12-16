/**
 * Created by Spencer on 12/11/15.
 */
var examples = {
    "LDI": "//"
};

var exp = {
    "LDI": 'LDI, or load immediate allows one to store a constant number between 0 and 7 in a register. LDI is often used to initialize registers for ' +
    'an operation like <span class="code black">jmp</span>.',
    "INC": "INC, or increment, accepts "
};

var desc = {
    "LDI": 'R[DR]←zf OP; PC ← PC +1'
};

var syntax = {
    "1regop": "DR, OP",
    "2regf": "DR, RA"
};

var keyWords = {
    "DR": "Destination register"
};

String.prototype.repl = function(tok, rep){
    return this.split(tok).join(rep);
};

function addKeywordTags(str){
    var out = str;
    for(var ki in Object.keys(keyWords)){
        var key = Object.keys(keyWords)[ki];
        out = out.repl(key, "<span class=\"helpToolTip\" title=\"" + keyWords[key] + "\">" + key + "</span>");
    }
    return out;
}

asmctrl.controller('HelpController', function($scope, $sce, func){

    $scope.getExp = function(){
        return $sce.trustAsHtml(addKeywordTags(exp[func]));
    };
    
    $scope.getDesc = function(){
        return $sce.trustAsHtml(addKeywordTags(desc[func]));
    };

    $scope.getSchema = function(){
        /*var schema = argTypes[instructions[func.toUpperCase()].type];
        var erargs = [];
        for(var key in schema.args){
            switch(schema.args[key]){
                case "reg": erargs.push("register"); break;
                case "op": erargs.push("operator"); break;
                case "addr": erargs.push("offset"); break;
            }
        }
        return func + " " + erargs.join(" ");*/
        return $sce.trustAsHtml(addKeywordTags(func + " " + syntax[instructions[func.toUpperCase()].type]));
    };

    $scope.openTab = function(){
        asm.selectTab(asm.createTab(func, examples[func]));
        modalInstance.close();
    }

    $scope.inst = func;
    $scope.opcode = instructions[func].opcode.toString(2);
});

function openHelp(helpFunc){
    modalInstance = modal.open({
        animation: true,
        templateUrl: 'help_modal.html',
        controller: "HelpController",
        size: 'lg',
        resolve: {
            func: function(){
                return helpFunc;
            }
        }
    });
    window.setTimeout(function(){$(".helpToolTip").tooltip()}, 50);
}

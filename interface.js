/**
 * Created by Spencer on 12/8/15.
 */

var asmctrl = angular.module('assembler', ['ui.bootstrap', 'ngSanitize']);

asmctrl.config(['$sceProvider',function($sceProvider){
    $sceProvider.enabled(false);
}]);

Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

var modal;
var modalInstance;
var LDI_example = "TEST";
var asm;
asmctrl.controller('AssemblerController', function($scope, $sce, $modal) {
    asm = this;
    modal = $modal;
    this.$scope = $scope;
    this.cm = null;
    this.code = null;
    this.codeArr = null;
    this.codeLines = null;
    this.tabs = [{"name": "Workspace 1", "code": "FOOBAR"}];
    this.selectedTab = 0;
    this.instructionList = Object.keys(instructions);
    this.init = function(){
        $sce.trustAsUrl('template/modal/backdrop.html');
        //this.cm = CodeMirror(document.getElementById("asm_code_mirror"), {mode: "asm"});
        //CodeMirror.defineMode("asm", highlightASM);
    }

    this.assemble = function(){
        //alert(this.cm.getValue())
        var code = this.getCode();
        var asm = assemble(code);
        if(asm.code != undefined){
            this.code = asm.code;
            this.codeArr = this.code.split("\n").clean("");
            this.codeLines = asm.lines;
            this.errors = "";
        }
        else {
            this.errors = $sce.trustAsHtml("\n" + asm.errors.join("\n"));
            this.code = "";
            this.codeArr = null;
            this.codeLines = null;
        }
    };

    this.createTab = function(name, text){
        this.tabs.push({"name": name, "code": text});
        return this.tabs.length - 1;
    };

    this.deleteTab = function(index){
        if(this.tabs.length == 1){
            return;
        }
        this.tabs.splice(index, 1);
        if(this.selectedTab >= this.tabs.length){
            this.selectedTab = this.tabs.length - 1;
        }
        $scope.code = this.tabs[this.selectedTab].code;
    }

    this.getCode = function(){
        return $scope.code;
    }

    this.getCodeArr = function(){
        return $scope.code.split("\n");
    }

    this.selectTab = function(index){
        this.tabs[this.selectedTab].code = this.getCode();
        $scope.code = this.tabs[index].code;
        this.selectedTab = index;
    }

    this.showHelp = openHelp;

    this.gotoLine = function(l)
    {
        if(this.codeLines == null){
            return;
        }

        var line = this.codeLines[l];

        this.gotoRawLine(line);
    }

    this.gotoRawLine = function(line){
        var ta = document.getElementById("asm_code");
        /*var lineHeight = ta.clientHeight / ta.rows;
         var jump = (line - 1) * lineHeight;
         ta.scrollTop = jump;*/

        var lines = ta.value.split("\n");

        // calculate start/end
        var startPos = 0, endPos = ta.value.length;
        for(var x = 0; x < lines.length; x++) {
            if(x == line) {
                break;
            }
            startPos += (lines[x].length+1);

        }

        var endPos = lines[line].length+startPos;

        // do selection
        // Chrome / Firefox

        if(typeof(ta.selectionStart) != "undefined") {
            ta.focus();
            ta.selectionStart = startPos;
            ta.selectionEnd = endPos;
            return true;
        }

        // IE
        if (document.selection && document.selection.createRange) {
            ta.focus();
            ta.select();
            var range = document.selection.createRange();
            range.collapse(true);
            range.moveEnd("character", endPos);
            range.moveStart("character", startPos);
            range.select();
            return true;
        }

        return false;
    }
});

/*asmctrl.directive('tooltip', ['$timeout', function ($timeout) {
    return {
        link: function ($scope, element, attrs) {
            $scope.$on('dataloaded', function () {
                console.log(element);
            })
        }
    };
}]);*/

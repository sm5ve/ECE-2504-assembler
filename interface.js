/**
 * Created by Spencer on 12/8/15.
 */

var asmctrl = angular.module('assembler', ['ui.bootstrap', 'ngSanitize']);
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
    this.tabs = [{"name": "Workspace 1", "code": "FOOBAR"}];
    this.selectedTab = 0;
    this.instructionList = Object.keys(instructions);
    this.init = function(){
        //this.cm = CodeMirror(document.getElementById("assembler_code_entry"))
        //cm.defineMode("asm", highlightASM)
    }

    this.assemble = function(){
        //alert(this.cm.getValue())
        var code = getCode();
        var asm = assemble(code);
        if(asm.code != undefined){
            this.code = asm.code;
            this.errors = "";
        }
        else {
            this.errors = $sce.trustAsHtml("\n" + asm.errors.join("\n"));
            this.code = "";
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

    function getCode(){
        return $scope.code;
    }

    this.selectTab = function(index){
        this.tabs[this.selectedTab].code = getCode();
        $scope.code = this.tabs[index].code;
        this.selectedTab = index;
    }

    this.showHelp = openHelp;
});
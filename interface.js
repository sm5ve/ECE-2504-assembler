/**
 * Created by Spencer on 12/8/15.
 */

var asmctrl = angular.module('assembler', ['ui.bootstrap']);
asmctrl.controller('AssemblerController', function($scope) {
    this.cm = null;
    this.code = null;
    this.init = function(){
        //this.cm = CodeMirror(document.getElementById("assembler_code_entry"))
        //cm.defineMode("asm", highlightASM)
    }

    this.assemble = function(){
        //alert(this.cm.getValue())
        var code = getCode();
        this.code = assemble(code);
        //$scope.$apply();
    };

    function getCode(){
        return $scope.code;
    }
});
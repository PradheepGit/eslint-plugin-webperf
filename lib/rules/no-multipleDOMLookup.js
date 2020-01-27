/* 
* @fileoverview Rule to flag if the DOM is looked up multiple times
* @author Bala Sundar @jankhuter
*/




//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create: function(context) {
    	var selectorArr = [], blockSelectorArr =[], tempSelectorArr =[]; //to store the selectors
    	var innerFuncNumb = -1;
        var conditionalBlock = [],cond_block_numb = -1,temp_cond_block_numb = [];
        conditionalBlock[-1] = false;
        var isLoop = [];
        loopNumb = -1;
        isLoop[-1] = [];
        var loopVariables = []; //array to store the initialisation variables of the loops
        var dynamicLoopVariables = []; //array to store the variable names of the dynamic selector inside the loop
        var firstFlag = [], secondFlag = [];
        firstFlag[-1] = false;
        secondFlag[-1] = false;

    	var arr = ["getElemById","getElementById","getElementsByClassName","getElementsByName","getElementsByTagName","getElementsByTagNameNS","querySelector","querySelectorAll"];
    	var arr1 = ["children","closest","contents","filter","find","first","has","last","next","nextAll","nextUntil","offsetParent","parent","parents","parentsUntil","prev","prevAll","prevUntil","siblings"];
    	var arr2 = ["childNodes","children","firstChild","firstElementChild","lastChild","lastElementChild","nextSibling","nextElementSibling","parentNode","parentElement","previousSibling","previousElementSibling"];
    	
        //array containing keyword that is used to bind events
        var eventArr = ["setTimeout","onabort","onafterprint","onbeforeprint","onbeforeunload","onblur","oncanplay","oncanplaythrough","onchange","onclick","oncontextmenu","oncopy","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onended","onerror","onfocus","onfocusin","onfocusout","onhashchange","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onmessage","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseover","onmouseout","onmouseup","onoffline","ononline","onopen","onpagehide","onpageshow","onpaste","onpause","onplay","onplaying","onprogress","onratechange","onresize","onreset","onscroll","onsearch","onseeked","onseeking","onselect","onshow","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","onunload","onvolumechange","onwaiting","onwheel"];
        var eventArr1 = ["on","off","one","click","dblclick","mouseenter","mouseleave","mousedown","mousemove","mouseover","mouseout","mouseup","keypress","keydown","keyup","submit","change","focus","focusin","focusout","hover","blur","load","resize","scroll","unload","bind","ready","select","trigger","triggerHandler","unbind"];
        
        function func_start(node){
    		innerFuncNumb++;
    		selectorArr[innerFuncNumb] = [];
            blockSelectorArr[innerFuncNumb] = [];
            tempSelectorArr[innerFuncNumb] = [];
            conditionalBlock[innerFuncNumb] = [];
            isLoop[innerFuncNumb] = [];
            //to deal the case where you get function inside a conditional block. To store the conditional block number of the previous function
            if(innerFuncNumb !== 0){
                temp_cond_block_numb[innerFuncNumb-1] = cond_block_numb;
            }
            cond_block_numb = -1;
            //to initiate loops_start and to include "this" and arguments of the function for each
            if(node.parent.callee && node.parent.callee.property && node.parent.callee.property.name === "each"){
                loops_start(node);
                dynamicLoopVariables[loopNumb].push("this");
                var variables = context.getDeclaredVariables(node);
                for(var i = 0; i < variables.length; i++){
                    dynamicLoopVariables[loopNumb].push(variables[i].name);
                }
            }

            //to find whether the function is used to bind events or a normal function
            if(node.parent.callee){
                if(node.parent.callee.name){
                    var name = node.parent.callee.name;
                    if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
                        firstFlag[innerFuncNumb] = true;
                    }
                }
                else if(node.parent.callee.property){
                    var name = node.parent.callee.property.name;
                    if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
                        secondFlag[innerFuncNumb] = true;
                    }
                }
            }
    	}
    	function func_end(node){
            //to initiate loops_end for each statement
            if(node.parent.callee && node.parent.callee.property && node.parent.callee.property.name === "each"){
                loops_end();
            }
            //to find whether the function is used to bind events or a normal function
            if(node.parent.callee){
                if(node.parent.callee.name){
                    var name = node.parent.callee.name;
                    if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
                        firstFlag[innerFuncNumb] = false;
                    }
                }
                else if(node.parent.callee.property){
                    var name = node.parent.callee.property.name;
                    if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
                        secondFlag[innerFuncNumb] = false;
                    }
                }
            }
    		innerFuncNumb--;
            //to deal the case where you get function inside a conditional block. To store the conditional block number of the previous function
            if(innerFuncNumb !== -1){
                cond_block_numb = temp_cond_block_numb[innerFuncNumb];
            }
    	}
    	function callExp(node){
    		if(innerFuncNumb === -1){
    			return;
    		}
            //to check first level of jquery
    		if((node.callee.name === "$" || node.callee.name === "$L") && node.arguments && node.arguments[0] && node.arguments[0].type !== "Identifier" && node.arguments[0].type !== "FunctionExpression"){
    			var selector = context.getSourceCode(node);
    			var text = selector.getText(node);
    			text = text.replace(/\'/g,"\"");
                var textWithNoSpace = text.replace(/ /g,'');
                //to split the combined Jquery and check for it separately
                var splitWithComma = textWithNoSpace.split(",");
                if(splitWithComma[1]){
                    splitWithComma[0] += "\")";
                    checker(node,splitWithComma[0],false);
                    for(var i = 1; i < splitWithComma.length; i++){
                        if(i === splitWithComma.length-1){
                            splitWithComma[i] = node.callee.name + "(\"" + splitWithComma[i];
                            checker(node,splitWithComma[i],false);
                        }
                        else{
                            splitWithComma[i] = node.callee.name + "(\"" + splitWithComma[i] + "\")";
                            checker(node,splitWithComma[i],false);
                        }
                    }
                }

                if(isLoop[innerFuncNumb][loopNumb]){
                    //to find the name of the variables of the dynamic selector
                    var isDynamic = isDynamicSelector(text);
                    if(isDynamic){
                        storeDynamicVariables(node)
                    }
                }
                checker(node,text,true);
	    	}
            //to check first level of javascript and second or more levels of jquery
    		if(node.callee.property){
    			if(arr.indexOf(node.callee.property.name) > -1 || arr1.indexOf(node.callee.property.name) > -1){
	    			var selector = context.getSourceCode(node);
	    			var text = selector.getText(node);
	    			text = text.replace(/\'/g,"\"");
                    if(isLoop[innerFuncNumb][loopNumb]){
                        //to find the name of the variables of the dynamic selector
                        var isDynamic = isDynamicSelector(text);
                        if(isDynamic){
                            storeDynamicVariables(node)
                        }
                    }
	    			checker(node,text,true);
	    		}
	    	}
            
            /*  this is added to handle the case of static selector inside loop
                if a class is added using addClass and the element is looked for using the same class
            */
            if(isLoop[innerFuncNumb][loopNumb]){
                if(node.arguments && node.callee.property && node.callee.property.name === "addClass"){
                    for(var i = 0; i < node.arguments.length; i++){
                        var text = node.arguments[i].value;
                        dynamicLoopVariables[loopNumb].push(text);
                    }
                }
            }
	    }
	    function memExp(node){
    		if(innerFuncNumb === -1){
    			return;
    		}
            
            //to check second level of javascript
    		if(node.parent.type !== "CallExpression" && arr2.indexOf(node.property.name) > -1){
    			var selector = context.getSourceCode(node);
    			var text = selector.getText(node);
    			text = text.replace(/\'/g,"\"");
                if(isLoop[innerFuncNumb][loopNumb]){
                    //to find the name of the variables of the dynamic selector
                    var isDynamic = isDynamicSelector(text);
                    if(isDynamic){
                        storeDynamicVariables(node)
                    }
                }
    			checker(node,text,true);
    		}
            // //check for .each loop
            // if (node.property.name === "each") {
            //     loops_start();
            // }
    	}

        //to separate each conditional statement (if else if, switch statement)
        function if_start(node) {
            if(innerFuncNumb === -1){
                return;
            }
            if (node.alternate && (node.parent.type === "SwitchCase" || node.parent.type === "BlockStatement" || node.parent.type === "Program")) {
                cond_block_numb++;
                tempSelectorArr[innerFuncNumb][cond_block_numb] = [];
                blockSelectorArr[innerFuncNumb][cond_block_numb] = [];
                conditionalBlock[innerFuncNumb][cond_block_numb] = true;
            }
        }
        function switch_start(node) {
            if(innerFuncNumb === -1){
                return;
            }
            cond_block_numb++;
            tempSelectorArr[innerFuncNumb][cond_block_numb] = [];
            blockSelectorArr[innerFuncNumb][cond_block_numb] = [];
            conditionalBlock[innerFuncNumb][cond_block_numb] = true;
        }
        function conditional_block_end(node){
            if(innerFuncNumb === -1){
                return;
            }
            if(blockSelectorArr[innerFuncNumb][cond_block_numb] && conditionalBlock[innerFuncNumb][cond_block_numb]){
                tempSelectorArr[innerFuncNumb][cond_block_numb] = tempSelectorArr[innerFuncNumb][cond_block_numb].concat(blockSelectorArr[innerFuncNumb][cond_block_numb]);
            }
            //to empty the array if it is not simple 'if'
            if(node.parent.alternate || node.alternate  || node.type === "SwitchCase"){
                blockSelectorArr[innerFuncNumb][cond_block_numb] = [];
            }
        }
        function if_end(node){
            if(innerFuncNumb === -1){
                return;
            }
            /*else if*/
            if(node.parent.type === "IfStatement" && !node.alternate){
                if(tempSelectorArr[innerFuncNumb][cond_block_numb] && cond_block_numb === 0){
                    selectorArr[innerFuncNumb] = selectorArr[innerFuncNumb].concat(tempSelectorArr[innerFuncNumb][cond_block_numb]);
                }
                conditionalBlock[innerFuncNumb][cond_block_numb] = false;
                cond_block_numb--;
                return;
            }
            /*else*/
            if(node.alternate && node.alternate.type === "BlockStatement"){
                if(tempSelectorArr[innerFuncNumb][cond_block_numb] && cond_block_numb === 0){
                    selectorArr[innerFuncNumb] = selectorArr[innerFuncNumb].concat(tempSelectorArr[innerFuncNumb][cond_block_numb]);
                }
                conditionalBlock[innerFuncNumb][cond_block_numb] = false;
                cond_block_numb--;
                return;
            }
            /*else without braces (single statement)*/
            if(node.alternate && node.alternate.type !== "IfStatement" && node.alternate.type !== "BlockStatement"){ 
                if(tempSelectorArr[innerFuncNumb][cond_block_numb] && cond_block_numb === 0){
                    selectorArr[innerFuncNumb] = selectorArr[innerFuncNumb].concat(tempSelectorArr[innerFuncNumb][cond_block_numb]);
                }
                conditionalBlock[innerFuncNumb][cond_block_numb] = false;
                cond_block_numb--;
                return;
            }
        }
        function switch_end(node) {
            if(innerFuncNumb === -1){
                return;
            }
            if(tempSelectorArr[innerFuncNumb][cond_block_numb]){
                selectorArr[innerFuncNumb] = selectorArr[innerFuncNumb].concat(tempSelectorArr[innerFuncNumb][cond_block_numb]);
            }
            conditionalBlock[innerFuncNumb][cond_block_numb] = false;
            cond_block_numb--;
        }

        //to flag the loop and check for static selector inside the loop
        function loops_start(node){
            loopNumb++;
            loopVariables[loopNumb] = [];
            dynamicLoopVariables[loopNumb] = [];
            isLoop[innerFuncNumb][loopNumb] = true;

            //to store the initialisation values
            if(node.init) {
                if(node.init.type === "AssignmentExpression"){
                    loopVariables[loopNumb].push(node.init.left.name);
                }
                if(node.init.type === "SequenceExpression"){
                    for(let i=0; i < node.init.expressions.length; i++){
                        if (node.init.expressions[i].left) {
                            loopVariables[loopNumb].push(node.init.expressions[i].left.name);
                        }
                    }
                }
                if(node.init.type === "VariableDeclaration") {
                    for(let i=0; i < node.init.declarations.length; i++){
                        loopVariables[loopNumb].push(node.init.declarations[i].id.name);
                    }
                }
            }
        }
        function loops_end(node){
            isLoop[innerFuncNumb][loopNumb] = false;
            loopNumb--;
        }
        function callExpEnd(node){
            // if (typeof node.callee !== "undefined" && typeof node.callee.property !== "undefined" && node.callee.property.name === "each" && node.arguments && node.arguments[0] && node.arguments[0].type === "FunctionExpression")
            //     loops_end();
        }

        /*  function to find whether the selector is a dynamic selector.
            Returns True if the selector is dynamic and false when static.
        */
        function isDynamicSelector(text){
            var splitWithPlus = text.split("+");
            var isDynamicVariableFound = false;
            if(splitWithPlus[1]){
                var canIBreak = false;
                for(var i = 1; i < splitWithPlus.length; i++){
                    if(loopVariables[loopNumb].indexOf(splitWithPlus[i]) > -1){
                        isDynamicVariableFound = true;
                        break;
                    }
                    else{
                        var secondLevelSplit = splitWithPlus[i].split(/\[|\]|\(|\)/);
                        for(var j = 0; j < secondLevelSplit.length; j++){
                            if(loopVariables[loopNumb].indexOf(secondLevelSplit[j]) > -1){
                                isDynamicVariableFound = true;
                                canIBreak = true;
                                break;
                            }
                        }
                        if(canIBreak){
                            break;
                        }
                    }
                }
            }
            return isDynamicVariableFound;
        }

        //function to store the variable names of the dynamic selector inside the loop
        function storeDynamicVariables(node){
            for(var elem = node; ;){
                if(elem.parent.type === "VariableDeclarator"){
                    dynamicLoopVariables[loopNumb].push(elem.parent.id.name);
                    break;
                }
                if(elem.parent.type === "AssignmentExpression"){
                    var source = context.getSourceCode(elem.parent.left);
                    var variableName = source.getText(elem.parent.left);
                    dynamicLoopVariables[loopNumb].push(variableName);
                    break;
                }
                if(elem.parent.type === "ExpressionStatement" || elem.parent.type === "Program"){
                    break;
                }
                elem = elem.parent;
            }
        }
        //function to store the variable names of the dynamic selector inside the loop
        function variableDec(node){
            if(loopNumb > -1){
                if(node.init === null){
                    return;
                }
                var source = context.getSourceCode(node.init);
                var text = source.getText(node.init);
                var splitText = text.split(/\.|\(|\)|\[|\]|\+|\ /);
                // if(splitText[1]){
                for(var j = loopNumb; j>=0; j--){
                    for(var i = 0; i < splitText.length; i++){
                        if(splitText[i] === "clone"){
                            dynamicLoopVariables[j].push(node.id.name);
                            break;
                        }
                        if((dynamicLoopVariables[j] && dynamicLoopVariables[j].indexOf(splitText[i]) > -1) || loopVariables[j].indexOf(splitText[i]) > -1){
                            dynamicLoopVariables[j].push(node.id.name);
                            break;
                        }
                    }
                }
                // }
            }
        }
        //function to store the variable names of the dynamic selector inside the loop
        function assignmentExp(node){
            if(loopNumb > -1){
                var source = context.getSourceCode(node.init);
                var text = source.getText(node.init);
                var splitText = text.split(/\.|\(|\)|\[|\]|\+|\ /);
                // if(splitText[1]){
                for(var j = loopNumb; j>=0; j--){
                    for(var i = 0; i < splitText.length; i++){
                        var variables = context.getSourceCode(node.left);
                        var variableName = variables.getText(node.left);
                        if(splitText[i] === "clone"){
                            dynamicLoopVariables[j].push(variableName);
                            break;
                        }
                        if((dynamicLoopVariables[j] && dynamicLoopVariables[j].indexOf(splitText[i]) > -1) || loopVariables[j].indexOf(splitText[i]) > -1){
                            dynamicLoopVariables[j].push(variableName);
                            break;
                        }
                    }
                }
                // }
            }
        }
        /*  function to check whether the selector is already present of not
            Throws an error message when the selector is already present
            (or)
            Stores the new selector in respective arrays based on the scope of the selector (block or functional level)
        */
        function checker(node,text,notManuallySeparatedSelector){
            if(innerFuncNumb === -1){
                return;
            }

            // to exclude dynamically created elements
            if(text.indexOf("<") > -1 || text.indexOf("document.createElement") > -1){
                return;
            }
            
            //check for static selectors inside a loop
            if(isLoop[innerFuncNumb][loopNumb] && notManuallySeparatedSelector){
                //to skip $(this) in case of static selector
                if(text === "$(this)"){
                    return;
                }
                var splitWithPlus = text.split("+"); //to check for dynamic selector
                var splitText = text.split(/\.|\(|\)|\[|\]|\+|\ |\"/); //split to check whether iterator value present or not
                if(!splitWithPlus[1]){
                    var proceed = true;
                    //to find in outer loops also
                    for(var j = loopNumb; j>=0; j--){
                        var notInArray = 0;
                        for(var i = 0; i < splitText.length; i++){
                            if(dynamicLoopVariables[j].indexOf(splitText[i]) === -1 && loopVariables[j].indexOf(splitText[i]) === -1){
                                notInArray++;
                            }
                        }
                        if(notInArray !== splitText.length){
                            proceed = false; //proceed turns to false when dynamic selector found
                            break;
                        }
                    }
                    if(!firstFlag[innerFuncNumb] && !secondFlag[innerFuncNumb] && proceed){
                        let updateSameElement = false;
                        if(node.parent.type === "AssignmentExpression"){
                            if(splitText.indexOf(node.parent.left.name) > -1){
                                updateSameElement = true;
                            }
                        }
                        if(!updateSameElement){
                            context.report(node, "Reference of a static selector "+ text +" inside a loop should be strictly avoided. Store it outside the loop.");
                        }
                    }
                }
            }

            //function level check
            if(selectorArr[innerFuncNumb] && selectorArr[innerFuncNumb].indexOf(text) > -1){
                context.report(node,"Multiple reference of "+ text +" detected. Store it in a variable.");
            }
            //block level check
            else if(conditionalBlock[innerFuncNumb][cond_block_numb]){
                //to check in the previous conditional also
                var exist = false;  
                for(var i = cond_block_numb; i > -1; i--){
                    if(blockSelectorArr[innerFuncNumb][i] && blockSelectorArr[innerFuncNumb][i].indexOf(text) > -1){
                        context.report(node,"Multiple reference of "+ text +" detected. Store it in a variable.");
                        exist = true;
                        break;
                    }
                }
                if(!exist){
                    blockSelectorArr[innerFuncNumb][cond_block_numb].push(text);
                }
            }
            else{
                selectorArr[innerFuncNumb].push(text);
            }
        }

        //function to store the initialisation variables of the loop
        function storeLoopVariables(node){
            if(node.parent.type === "ForStatement" || node.parent.type === "WhileStatement" || node.parent.type === "DoWhileStatement"){
                var loopVarArr = context.getDeclaredVariables(node);
                for(var i = 0 ; i < loopVarArr.length; i++){
                    loopVariables[loopNumb].push(loopVarArr[i].name);
                }
            }
        }
        
    	return {
    		"FunctionExpression": func_start,
            "FunctionExpression:exit": func_end,
            "FunctionDeclaration": func_start,
            "FunctionDeclaration:exit": func_end,
            "CallExpression" : callExp,
            "CallExpression:exit": callExpEnd,
            "MemberExpression" : memExp,
            "SwitchStatement": switch_start,
            "SwitchCase:exit": conditional_block_end,
            "SwitchStatement:exit": switch_end,
            "IfStatement": if_start,
            "IfStatement > BlockStatement:exit": conditional_block_end,
            "IfStatement:exit" : if_end,
            "ForStatement": loops_start,
            "ForStatement:exit": loops_end,
            "WhileStatement": loops_start,
            "WhileStatement:exit": loops_end,
            "DoWhileStatement": loops_start,
            "DoWhileStatement:exit": loops_end,
            "VariableDeclaration" : storeLoopVariables,
            "VariableDeclarator":variableDec,
            "AssignmentExpression":assignmentExp

        };
    }
};

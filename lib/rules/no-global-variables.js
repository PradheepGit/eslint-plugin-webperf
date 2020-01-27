/* 
* @fileoverview Rule to find global variables, statements which leads to memory leak
* @author Bala Sundar @jankhuter
*/

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------




module.exports = {
	create : function(context){
		var programVariables = []; //variables that are declared globally with keyword 'var'
		var functionVariables = []; //variables that are declared in functional scope with keyword 'var'
		var innerFuncNumb = -1;
		var proceed = 1;
		var firstFlag = false, secondFlag = false;
		//array of jquery traversals
    	var arr = ["children","closest","contents","filter","find","first","has","last","next","nextAll","nextUntil","offsetParent","parent","parents","parentsUntil","prev","prevAll","prevUntil","siblings"]; 
    	//array of javascript selectors and traversals
    	var arr1 = ["getElementById","getElementsByClassName","getElementsByName","getElementsByTagName","getElementsByTagNameNS","querySelector","querySelectorAll"];
    	var arr2 = ["childNodes","children","firstChild","firstElementChild","lastChild","lastElementChild","nextSibling","nextElementSibling","parentNode","parentElement","previousSibling","previousElementSibling"];

    	//array containing keyword that is used to bind events
    	var eventArr = ["onabort","onafterprint","onbeforeprint","onbeforeunload","onblur","oncanplay","oncanplaythrough","onchange","onclick","oncontextmenu","oncopy","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onended","onerror","onfocus","onfocusin","onfocusout","onhashchange","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onmessage","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseover","onmouseout","onmouseup","onoffline","ononline","onopen","onpagehide","onpageshow","onpaste","onpause","onplay","onplaying","onprogress","onratechange","onresize","onreset","onscroll","onsearch","onseeked","onseeking","onselect","onshow","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","onunload","onvolumechange","onwaiting","onwheel"];
    	var eventArr1 = ["on","off","one","click","dblclick","mouseenter","mouseleave","mousedown","mousemove","mouseover","mouseup","keypress","keydown","keyup","submit","change","focus","focusin","focusout","hover","blur","load","resize","scroll","unload","bind","ready","select","trigger","triggerHandler","unbind"];
		
    	//function to store the globally declared variables
		function storeVar(node){
			var variablesObj = context.getScope(node).variables;
			for(var i = 0; i < variablesObj.length; i++){
				programVariables.push(variablesObj[i].name);
			}
		}

		function func_start(node){
			innerFuncNumb++;
			functionVariables[innerFuncNumb] = [];
			//to find whether the function is used to bind events or a normal function
			if(node.parent.callee){
				if(node.parent.callee.name){
					var name = node.parent.callee.name;
					if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
						firstFlag = true;
					}
				}
				else if(node.parent.callee.property){
					var name = node.parent.callee.property.name;
					if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
						secondFlag = true;
					}
				}
			}
			//to store the variables declared at the functional scope
			var variablesObj = context.getScope(node).variables;
			for(var i = 0; i < variablesObj.length; i++){
				functionVariables[innerFuncNumb].push(variablesObj[i].name);
			}
			if(node.type === "FunctionDeclaration"){
				// context.report(node,"Function declared globally. Declare as Object scope")
			}
		}
		function func_end(node){
			functionVariables[innerFuncNumb] = [];
			//to find whether the function is used to bind events or a normal function
			if(node.parent.callee){
				if(node.parent.callee.name){
					var name = node.parent.callee.name;
					if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
						firstFlag = false;
					}
				}
				else if(node.parent.callee.property){
					var name = node.parent.callee.property.name;
					if(eventArr.indexOf(name) > -1 || eventArr1.indexOf(name) > -1){
						secondFlag = false;
					}
				}
			}
			innerFuncNumb--;
		}
		function callExp(node){
    		//first level of jquery
    		if(node.callee.name === "$" || node.callee.name === "$L"){
    			if(node.arguments.length === 0){
    				return;
    			}
    			//to check for jquery traversals
    			if(node.parent.property && arr.indexOf(node.parent.property.name) > -1){
    				proceed = 0;
    			}
    			//to check for DOM content stored in a property of an object
    			if(proceed){
	    			if(node.parent.type === "Property" && node.parent.value === node || isMemExp(node)){
	    				context.report(node,"Dont store DOM in a property of an Object");
	    			}
	    		}
	    		proceed = 1;
    		}
    		//jquery traversals
			if(node.callee.property && (arr.indexOf(node.callee.property.name) > -1 || arr1.indexOf(node.callee.property.name) > -1)){
				if(node.parent.property && (arr.indexOf(node.parent.property.name) > -1 || arr1.indexOf(node.callee.property.name) > -1)){
    				proceed = 0;
    			}
    			//to check for DOM content stored in a property of an object
    			if(proceed){
	    			if(!isFilter(node, node.callee.property.name) && (node.parent.type === "Property" && node.parent.value === node || isMemExp(node))){
	    				context.report(node,"Dont store DOM in a property of an Object");
	    			}
	   			}
	    		proceed = 1;
    		}
    	}
    	function memExp(node){
    		//to check select level of javascript
    		if(arr2.indexOf(node.property.name) > -1){
    			if(node.parent.type === "Property" && node.parent.value === node || isMemExp(node)){
    				context.report(node,"Dont store DOM in a property of an Object");
    			}
    		}
    	}

    	// to skip the filter method of array
    	function isFilter(node, name) {
    		if (name !== "filter") {
    			return false;
    		}
    		if (node.arguments && node.arguments[0].type === "FunctionExpression") {
    			return true;
    		}
    		return false;
    	}

    	// to check if the memExp is a global variable or not
    	function isMemExp(node) {
			if (node.parent.type !== "AssignmentExpression") {
				return;
			}
    		if (node.parent.left && node.parent.left !== node && node.parent.left.type === "MemberExpression") {
    			for ( var elem = node.parent.left; ; elem = elem.object) {
    				if (!elem.object || elem.type == "Identifier") {
    					if(programVariables && programVariables.indexOf(elem.name) > -1) {
    						return true;
    					}

    					// break works if the above if conditions fails
    					break;
    				}
    			}
    		}
    	}
    	
		function assignmentExp(node){
			if(node.left.type === "Identifier"){
				if(programVariables && programVariables.indexOf(node.left.name) > -1){
					return;
				}
				if(functionVariables[innerFuncNumb] && functionVariables[innerFuncNumb].indexOf(node.left.name) > -1){
					return;
				}
				/*	to check if the variable is present in previous functional scope 
					if the current functional is not used to bind events
				*/
				if(!firstFlag && !secondFlag){
					for(var i = innerFuncNumb-1; i >= 0 ; i--){
						if(functionVariables[i] && functionVariables[i].indexOf(node.left.name) > -1){
							return;
						}
					}
				}
				context.report(node,"Declare the variable \""+ node.left.name +"\" else it resides in global scope");
			}
		}
		//function to ensure only objects are in the global scope
		function variableDeclarator(node){
			scopeOfNode = context.getScope(node).type;
			if(scopeOfNode === "global"){
				if(node.init && (node.init.type !== "ObjectExpression" && ((!node.init.left || node.init.left.type !== "ObjectExpression") && (!node.init.right || node.init.right.type !== "ObjectExpression")))){
					context.report(node,"Variable is in global scope")
				}
			}
		}
		return {
			"Program" : storeVar,
    		"FunctionExpression": func_start,
            "FunctionExpression:exit": func_end,
            "FunctionDeclaration": func_start,
            "FunctionDeclaration:exit": func_end,
            "CallExpression" : callExp,
            "MemberExpression" : memExp,
            "AssignmentExpression": assignmentExp,
            "VariableDeclarator" : variableDeclarator,
        }
	}
}

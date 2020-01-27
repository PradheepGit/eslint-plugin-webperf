/* 
* @fileoverview Rule to find statements which leads to closure issues
* @author Bala Sundar @jankhuter
*/

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
	create : function(context){
		var functionalDOMVariables = []; //variables that store DOM in functional scope
		var innerFuncNumb = -1;
		var proceed = 1;
		var firstFlag = [], secondFlag = [];
		//array of jquery traversals
    	var arr = ["children","closest","contents","filter","find","first","has","last","next","nextAll","nextUntil","offsetParent","parent","parents","parentsUntil","prev","prevAll","prevUntil","siblings"]; 
    	//array of javascript selectors and traversals
    	var arr1 = ["getElementById","getElementsByClassName","getElementsByName","getElementsByTagName","getElementsByTagNameNS","querySelector","querySelectorAll"];
    	var arr2 = ["childNodes","children","firstChild","firstElementChild","lastChild","lastElementChild","nextSibling","nextElementSibling","parentNode","parentElement","previousSibling","previousElementSibling"];

    	//array containing keyword that is used to bind events
    	var eventArr = ["onabort","onafterprint","onbeforeprint","onbeforeunload","onblur","oncanplay","oncanplaythrough","onchange","onclick","oncontextmenu","oncopy","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onended","onerror","onfocus","onfocusin","onfocusout","onhashchange","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onmessage","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseover","onmouseout","onmouseup","onoffline","ononline","onopen","onpagehide","onpageshow","onpaste","onpause","onplay","onplaying","onprogress","onratechange","onresize","onreset","onscroll","onsearch","onseeked","onseeking","onselect","onshow","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","onunload","onvolumechange","onwaiting","onwheel"];
    	var eventArr1 = ["on","off","one","click","dblclick","mouseenter","mouseleave","mousedown","mousemove","mouseover","mouseup","keypress","keydown","keyup","submit","change","focus","focusin","focusout","hover","blur","load","resize","scroll","unload","bind","ready","select","trigger","triggerHandler","unbind"];
		

		function func_start(node){
			innerFuncNumb++;
			functionalDOMVariables[innerFuncNumb] = [];
			firstFlag[innerFuncNumb] = false;
			secondFlag[innerFuncNumb] = false;
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
			functionalDOMVariables[innerFuncNumb] = [];
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
		}
		function callExp(node){
			if(innerFuncNumb === -1){
				return;
			}
    		//first level of jquery
    		if(node.callee.name === "$" || node.callee.name === "$L"){
    			if(node.arguments.length === 0){
    				return;
    			}
    			//to check for jQuery traversals
    			if(node.parent.property && arr.indexOf(node.parent.property.name) > -1){
    				proceed = 0;
    			}
    			//to add the jquery variables into an array
    			if(proceed){
	    			if(node.parent.type === "AssignmentExpression" && node.parent.left.type === "Identifier"){
	    				functionalDOMVariables[innerFuncNumb].push(node.parent.left.name);
	    			}
	    			if(node.parent.type === "VariableDeclarator"){
	    				functionalDOMVariables[innerFuncNumb].push(node.parent.id.name);
	    			}
	    		}
	    		proceed = 1;
    		}
    		//jQuery traversals and first level of javascript
			if(node.callee.property && (arr.indexOf(node.callee.property.name) > -1 || arr1.indexOf(node.callee.property.name) > -1)){
				if(node.parent.property && (arr.indexOf(node.parent.property.name) > -1 || arr1.indexOf(node.parent.property.name) > -1)){
    				proceed = 0;
    			}
    			//to add the jquery variables into an array
    			if(proceed){
    				if(node.parent.type === "AssignmentExpression"){
	    				functionalDOMVariables[innerFuncNumb].push(node.parent.left.name);
	    			}
	    			if(node.parent.type === "VariableDeclarator"){
	    				functionalDOMVariables[innerFuncNumb].push(node.parent.id.name);
	    			}
	    		}
	    		proceed = 1;
    		}
    	}
    	function memExp(node){
    		if(innerFuncNumb === -1){
				return;
			}
    		//to check second level of javascript
    		if(arr2.indexOf(node.property.name) > -1){
    			if(node.parent.type === "AssignmentExpression"){
    				functionalDOMVariables[innerFuncNumb].push(node.parent.left.name);
    			}
    			if(node.parent.type === "VariableDeclarator"){
    				functionalDOMVariables[innerFuncNumb].push(node.parent.id.name);
    			}
    		}
    	}

		function identifier(node){
			if(innerFuncNumb === -1){
				return;
			}
			if(node.parent.type === "VariableDeclarator" || node.parent.type === "AssignmentExpression" || node.parent.type === "FunctionDeclaration" || node.parent.type === "Property" || (node.parent.callee === node) || (node.parent.property === node)){
				return;
			}
			if((firstFlag[innerFuncNumb] || secondFlag[innerFuncNumb]) && (!functionalDOMVariables[innerFuncNumb] || (functionalDOMVariables[innerFuncNumb] && functionalDOMVariables[innerFuncNumb].indexOf(node.name) === -1))){
				for(var i = innerFuncNumb-1; i >= 0 ; i--){
					if(functionalDOMVariables[i] && functionalDOMVariables[i].indexOf(node.name) > -1){
						context.report(node,"Declare the variable \""+ node.name +"\", since it is in previous function's scope");
					}
				}
			}
		}
		return {
    		"FunctionExpression": func_start,
            "FunctionExpression:exit": func_end,
            "FunctionDeclaration": func_start,
            "FunctionDeclaration:exit": func_end,
            "CallExpression" : callExp,
            "MemberExpression" : memExp,
            "Identifier": identifier,
        }
	}
}
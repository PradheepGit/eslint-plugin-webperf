/* 
* @fileoverview Rule to flag complex and costly selectors
* @author Bala Sundar @jankhuter
*/

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
	create: function(context){
		//array of pseudo complex selectors
		var complexSelectorArr = ["first","last","even","odd","first-child","first-of-type","last-child","last-of-type","nth-child","nth-last-child","nth-of-type","nth-last-of-type","only-child","only-of-type"];
		var arr = ["querySelector","querySelectorAll"];
		//array of jQuery traversals
		var arr1 = ["children","closest","contents","filter","find","first","has","last","next","nextAll","nextUntil","offsetParent","parent","parents","parentsUntil","prev","prevAll","prevUntil","siblings"];
		var notVariable = false;
		function callExp(node){
			//to find in jQuery first level selector
			if(node.callee.name === "$" || node.callee.name === "$L"){
    			if(node.arguments.length === 0){
    				return;
    			}
    			if(node.arguments[0]){
    				validate(node,true);		    		
    			}
    		}
    		//to find in javascript first level selector
    		if(node.callee.property){
    			if(node.arguments.length === 0){
    				return;
    			}
    			if(arr.indexOf(node.callee.property.name) > -1){
    				validate(node,true);
    			}
    		}
    		//to find in jQuery traversals
    		if(node.callee.property){
    			if(node.arguments.length === 0){
    				return;
    			}
    			if(arr1.indexOf(node.callee.property.name) > -1){
    				validate(node,false);
    			}
    		}
		}
		function validate(node,checkForTag){
			var isTag = false;
			var selector = context.getSourceCode(node.arguments[0]);
			var text = selector.getText(node.arguments[0]);
			text = text.replace(/\'/g,"\"");
			var spaceCount = 0;
			//to find if a tag is used as a selector if the selector is dynamic
			var splitWithPlus = text.split("+");
			if(splitWithPlus.length > 1){
				var length = splitWithPlus.length;
				var splitWithSpace = splitWithPlus[length-1].split(" ");
				var len = splitWithSpace.length;
				var str = splitWithSpace[len-1];
				if(str[str.length-1] === "'" || str[str.length-1] === '"'){
					str = str.replace(/["']/g,"");
					var res = /^([a-zA-Z-]+$)/g.test(str);
					if(res === true){
						isTag = true;
					}
				}
			}

			//to find for any complex pseudo selectors
			var splitWithSpace = text.split(" ");
			var len = splitWithSpace.length;
			for(var i = 0; i < len; i++){
				var str = splitWithSpace[i];
				if(str[str.length-1] === "'" || str[str.length-1] === '"'){
					notVariable = true;
				}
				str = str.replace(/["']/g,"");
				//splitted with colon to compare the string with pseudo selectors
				var splitWithColon = str.split(":");
				var length = splitWithColon.length;
				if(complexSelectorArr.indexOf(splitWithColon[length-1]) > -1){
					context.report(node,"Psuedo selector. Try with an alternative");
					break;
				}
			}

			//to find if a tag is used as a selector if the selector is static
			if(splitWithPlus.length === 1 && notVariable){
				notVariable = false;
				var res = /^([a-zA-Z-]+$)/g.test(str);
				if(res === true){
					isTag = true;
				}
			}

			var shouldIBreak = false;
			for(var i = 0; i < text.length; i++){
				shouldIBreak = false;
				if(text[i] === "'" || text[i] === '"'){
					for(var j = i+1; j < text.length; j++){
						if(text[j] === "'" || text[j] === '"'){
							break;
						}
						//to skip hardcorded DOM
						if(text[j] === '<'){
							spaceCount = 0;
							shouldIBreak = true;
							break;
						}
						if((text[j] === "*" && text[j-1] === " " && (text[j+1] === "'" || text[j+1] === '"' || text[j+1] === ' '))){
							context.report(node,"Never use * as a selector. Instead use specific selector");
							spaceCount = 0;
							shouldIBreak = true; 
							break;
						}
						if(text[j+1] !== ">" && text[j-1] !== ">" && text[j] === " "){
							spaceCount++;
						}
					}
					if(shouldIBreak){
						break;
					}
					i=j;
				}
			}
    		if(text.indexOf(',') === -1 && text.indexOf('+') === -1){
    			if(spaceCount > 2){
	    			context.report(node,"Many level of selectors detected. Try to reduce it");
	    		}
	    	}
	    	if(text.indexOf(',') === -1 && isTag && spaceCount > 0 && checkForTag){
				context.report(node,"Selector is a tag. Try with an alternative");
			}
		}
		return{
			"CallExpression" : callExp
		};
	}
};
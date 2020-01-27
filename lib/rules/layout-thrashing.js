/* 
* @fileoverview Rule to find Layout Thrashing
* @author Bala Sundar @jankhuter
*/

/* 
* if(lt || LT){ alert("read it as Layout thrashing"); }
*/

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create: function(context) {
        var LT_threshold_for_loops = [],inner_loop_numb = -1,write = [],read = []; //to check LT inside the loops
        var LT_threshold = []; //indicates that the threshold for LT has reached or not(1=reached ; 0=not reached)
        var read_count = [],write_count = []; //to keep track of the number of reads and writes count
        var temp_read, temp_write;
        var error_array = []; // array to keep track of the reads and writes of call exp
        var is_call_exp = false,inner_func_numb = -1;
        var isFirstLeftAssignment = false; //boolean to check for firstAssignment
        /* variables to check for conditional statements like "if,else", "if,else if" and "switch"*/
        var ifCondition,isElseIf; //boolean to check for if, else if statements
        var conditionalBlock = [],block_threshold = [],cond_block_numb = -1,tempConditionalThreshold = []; //variables used to store values between the blocks in the if,else if statements or switch case statements
        tempConditionalThreshold [-1] = 0;
        var temp_threshold_for_loops = [];
        var normalIf = false;
        var propVarArray = [];
        var objectVariables = [];
        var takenFromObject = false;

        function lt_validater(node) {
            //Check for existence
            if (typeof node.property === "undefined") {
                return;
            }
            //to skip the check of conditional statement in "else if"
            if(isElseIf && conditionalBlock[cond_block_numb] && !tempConditionalThreshold[cond_block_numb]){
                return;
            }
            //check for .each loop
            if (node.property.name === "each") {
                loops_start();
            }

            //to skip the values read from the object (given the syntax 'ui')
            if(node.parent.type !== "MemberExpression"){
                // if(node.object.name === 'ui'){
                //     takenFromObject = true;
                // }
                for(var elem=node; elem.object; ){
                    if(elem.property.name === 'ui'){
                        takenFromObject = true;
                        break;
                    }
                    elem = elem.object;
                }
            }
            if(takenFromObject){
                return;
            }

            var proceed = 1;
            var arr = ["position","offset","offsetLeft", "offsetTop", "offsetWidth", "offsetHeight", "offsetParent", "clientLeft", "clientTop", "clientWidth", "clientHeight", "scrollWidth", "scrollHeight", "scrollLeft", "scrollTop", "min-width", "min-height", "max-width", "max-height", "height", "width", "top", "right", "bottom", "left", "margin", "marginTop", "marginRight", "marginLeft", "marginBottom", "padding", "paddingTop", "paddingRight", "paddingLeft", "paddingBottom", "scrollX", "scrollY", "innerWidth", "innerHeight", "outerWidth", "outerHeight", "getComputedStyle","getBoundingClientRect","getClientRects"]; //array of styles that triggers layout
            var arr1 = ["html", "val", "value", "text", "innerText", "innerHTML", "className", "textContent", "dir", "normalize"]
            var arr2 = ["empty", "hide", "show", "append", "appendTo", "prepend", "prependTo", "appendChild", "removeChild", "replaceAll", "replaceWith", "replaceChild", "after", "before", "addClass", "insertBefore", "insertAfter", "wrap", "wrapAll", "wrapInner"];
            var arr3 = ["class", "style", "dir", "size"];
            var arr4 = ["removeAttr", "removeAttribute", "removeAttributeNode"];
            var arr5 = ["left","top","bottom","height","right","width","x","y"];
            var propArr = ["getOffset","offset","position","getClientRects","getBoundingClientRect"];

            //to store the variables reading the propArr values
            if((propArr.indexOf(node.property.name) > -1) && !node.parent.property && !node.parent.parent.property){
                node.parent.parent.id && propVarArray.push(node.parent.parent.id.name);
            }

            //check for STYLE READ properties
            if (arr.indexOf(node.property.name) > -1 || node.property.name === "getOffset") {
                if (node.property.name !== "getOffset" && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node) {
                    //to support the syntax outerHeight(true)
                    if (node.parent.arguments.length !== 0 && !(node.parent.arguments.length === 1 && node.parent.arguments[0].value === true)) {
                        proceed = 0;
                    }
                }
                if (node.parent.type === "AssignmentExpression") {
                    if (node.parent.left === node) {
                        proceed = 0;
                    }
                }
                //to exclude if it is read an object formed due to the read of propArr
                if(arr5.indexOf(node.property.name) > -1){
                    if(propVarArray.indexOf(node.object.name) > -1){
                        proceed = 0;
                    }
                }
                //to exclude if it is javascript .style read
                if(typeof node.object.property !== "undefined"){
                    if(node.object.property.name === "style"){
                        proceed = 0;
                    }
                }
                //to exclude if the value is read from an object
                if(objectVariables[inner_func_numb] && (objectVariables[inner_func_numb].indexOf(node.object.name) > -1 || (node.object.object && objectVariables[inner_func_numb].indexOf(node.object.object.name) > -1))){
                    proceed = 0;
                }
                if (proceed) {
                    if (is_call_exp) {
                        error_array.push({ "status": "read", "node": node });
                    } else {
                        if (!LT_threshold_for_loops[inner_loop_numb] && LT_threshold[inner_func_numb] === 1) {
                            if (!isFirstLeftAssignment) {
                                context.report(node, "Alternative reads and writes are detected");
                            }
                        } else if (LT_threshold_for_loops[inner_loop_numb]) {
                            read[inner_loop_numb] = 1;
                            if (write[inner_loop_numb] || LT_threshold[inner_func_numb] === 1) {
                                context.report(node, "Alternative reads and writes are detected");
                            }
                        }
                        read_count[inner_func_numb]++;
                    }
                }
                proceed = 1;
            } else if (node.property.name === "css" && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && node.parent.arguments.length === 1 && node.parent.arguments[0].type === "Literal") {
                if (is_call_exp) {
                    error_array.push({ "status": "read", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb] && LT_threshold[inner_func_numb] === 1) {
                        context.report(node, "Alternative reads and writes are detected");
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        read[inner_loop_numb] = 1;
                        if (write[inner_loop_numb] || LT_threshold[inner_func_numb] === 1) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    read_count[inner_func_numb]++;
                }
            } else if ((node.property.name === "prop" || node.property.name === "attr") && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && node.parent.arguments.length === 1 && node.parent.arguments[0].type === "Literal") {
                //to check if the attr or prop value is related to layout calculations or not
                if (arr.indexOf(node.parent.arguments[0]) < 0 && arr3.indexOf(node.parent.arguments[0]) < 0) {
                    proceed = 0;
                }
                if (proceed) {
                    if (is_call_exp) {
                        error_array.push({ "status": "read", "node": node });
                    } else {
                        if (!LT_threshold_for_loops[inner_loop_numb] && LT_threshold[inner_func_numb] === 1) {
                            context.report(node, "Alternative reads and writes are detected");
                        } else if (LT_threshold_for_loops[inner_loop_numb]) {
                            read[inner_loop_numb] = 1;
                            if (write[inner_loop_numb] || LT_threshold[inner_func_numb] === 1) {
                                context.report(node, "Alternative reads and writes are detected");
                            }
                        }
                        read_count[inner_func_numb]++;
                    }
                }
                proceed = 1;
            } else if (node.property.name === "is" && node.parent.type === "CallExpression" && node.parent.arguments && node.parent.arguments.length === 1 && node.parent.arguments[0].value === ":visible") {
                // special handling for $(elem).is(':visible') check
                if (is_call_exp) {
                    error_array.push({ "status": "read", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb] && LT_threshold[inner_func_numb] === 1) {
                        context.report(node, "Alternative reads and writes are detected");
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        read[inner_loop_numb] = 1;
                        if (write[inner_loop_numb] || LT_threshold[inner_func_numb] === 1) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    read_count[inner_func_numb]++;
                }
            }

            //check for STYLE WRITE properties
            if (typeof node.object.property !== "undefined" && node.object.property.name === "style" && node.parent.left === node && node.parent.type === "AssignmentExpression") {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    if (write_count[inner_func_numb] < 1) {
                        isFirstLeftAssignment = true;
                    }
                    write_count[inner_func_numb]++;
                }
            } else if (arr.indexOf(node.property.name) > -1 && ((node.parent.type === "AssignmentExpression" && node.parent.left === node && (!objectVariables[inner_func_numb] || (objectVariables[inner_func_numb].indexOf(node.object.name) === -1 && (node.object.object && objectVariables[inner_func_numb].indexOf(node.object.object.name) === -1)))) || (node.property.name !== "getComputedStyle" && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && node.parent.arguments.length === 1 && node.parent.arguments[0].value !== true))) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    if (write_count[inner_func_numb] < 1) {
                        isFirstLeftAssignment = true;
                    }
                    write_count[inner_func_numb]++;
                }
            } else if (node.property.name === "css" && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && (node.parent.arguments.length > 1 || (node.parent.arguments.length === 1 && node.parent.arguments[0].type === "ObjectExpression"))) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    write_count[inner_func_numb]++;
                }
            } else if ((node.property.name === "prop" || node.property.name === "attr") && typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && (node.parent.arguments.length > 1 || (node.parent.arguments.length === 1 && node.parent.arguments[0].type === "ObjectExpression"))) {
                if (node.parent.arguments.length === 1) {
                    //to check if the argument property triggers layout 
                    var property = node.parent.arguments[0].properties,
                        trueorfalse = false;
                    for (var i = 0; i < property.length; i++) {
                        if (arr.indexOf(property[i].key.value) > -1) {
                            trueorfalse = true;
                            break;
                        }
                    }
                    if (!trueorfalse) {
                        proceed = 0;
                    }
                }
                if (node.parent.arguments.length > 1) {
                    //to check if the argument property triggers layout
                    var property = node.parent.arguments[0].value;
                    if (arr.indexOf(property) === -1) {
                        proceed = 0;
                    }
                }
                if (proceed) {
                    if (is_call_exp) {
                        error_array.push({ "status": "write", "node": node });
                    } else {
                        if (!LT_threshold_for_loops[inner_loop_numb]) {
                            LT_threshold[inner_func_numb] = 1;
                        } else if (LT_threshold_for_loops[inner_loop_numb]) {
                            write[inner_loop_numb] = 1;
                            LT_threshold[inner_func_numb] = 1;
                            if (read[inner_loop_numb]) {
                                context.report(node, "Alternative reads and writes are detected");
                            }
                        }
                        write_count[inner_func_numb]++;
                    }
                }
                proceed = 1;
            } else if (["setAttribute", "setAttributeNode"].indexOf(node.property.name) > -1) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    write_count[inner_func_numb]++;
                }
            }

            //check for DOM WRITE
            if (arr1.indexOf(node.property.name) > -1 && ((typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && node.parent.arguments.length > 0) || (node.parent.left === node && node.parent.type === "AssignmentExpression"))) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    if (write_count[inner_func_numb] < 1) {
                        isFirstLeftAssignment = true;
                    }
                    write_count[inner_func_numb]++;
                }
            } else if (["remove", "removeClass"].indexOf(node.property.name) > -1) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    write_count[inner_func_numb]++;
                }
            } else if (arr4.indexOf(node.property.name) > -1 && (typeof node.parent.arguments !== "undefined" && node.parent.arguments[node.parent.arguments.indexOf(node)] !== node && node.parent.arguments.length > 0 && (arr.indexOf(node.parent.arguments[0].value) > -1 || arr3.indexOf(node.parent.arguments[0].value) > -1))) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    write_count[inner_func_numb]++;
                }
            } else if (arr2.indexOf(node.property.name) > -1) {
                if (is_call_exp) {
                    error_array.push({ "status": "write", "node": node });
                } else {
                    if (!LT_threshold_for_loops[inner_loop_numb]) {
                        LT_threshold[inner_func_numb] = 1;
                    } else if (LT_threshold_for_loops[inner_loop_numb]) {
                        write[inner_loop_numb] = 1;
                        LT_threshold[inner_func_numb] = 1;
                        if (read[inner_loop_numb]) {
                            context.report(node, "Alternative reads and writes are detected");
                        }
                    }
                    write_count[inner_func_numb]++;
                }
            }
        }

        function memExpEnd(node){
            if(node.parent.type !== "MemberExpression"){
                if(takenFromObject){
                    takenFromObject = false;
                }
            }
        }

        function func_start(node) {
            //for inner functions
            inner_func_numb++;
            read_count[inner_func_numb] = 0;
            write_count[inner_func_numb] = 0;
            LT_threshold[inner_func_numb] = 0;
            objectVariables[inner_func_numb] = [];
            if(inner_func_numb === 0){
                propVarArray = [];
            }
            //to handle function that are binded to click handlers inside loop
            if(node.parent && node.parent.callee && node.parent.callee.property && node.parent.callee.property.name !== "each"){
                if(LT_threshold_for_loops[inner_loop_numb]){
                    temp_threshold_for_loops[inner_func_numb] = 1;
                    LT_threshold_for_loops[inner_loop_numb] = 0;
                }
            }
        }
        function func_end(node) {
            //to handle function that are binded to click handlers inside loop
            if(temp_threshold_for_loops[inner_func_numb]){
                LT_threshold_for_loops[inner_loop_numb] = 1;
                temp_threshold_for_loops[inner_func_numb] = 0;
            }
            //decrementing the function count while function ends
            inner_func_numb--;
        }
        function block_end(node) {
            //to check in conditional statement (if else if, switch statement)
            if (/*else if*/(node.parent.parent && node.parent.parent.type === "IfStatement" && !node.parent.alternate) || /*else*/(node.parent.type === "IfStatement" && node.parent.alternate === node && node.parent.alternate && node.parent.alternate.type === "BlockStatement")) {
                if (block_threshold[cond_block_numb]) {
                    LT_threshold[inner_func_numb] = 1;
                }
                conditionalBlock[cond_block_numb] = false;
                block_threshold[cond_block_numb] = false;
                tempConditionalThreshold[cond_block_numb] = 0
                cond_block_numb--;
            }
        }

        //to check in conditional statement (if else if, switch statement)
        function if_start(node) {
            if (node.alternate && (node.parent.type === "SwitchCase" || node.parent.type === "BlockStatement" || node.parent.type === "Program")) {
                cond_block_numb++;
                tempConditionalThreshold[cond_block_numb] = LT_threshold[inner_func_numb];
                conditionalBlock[cond_block_numb] = true;
            }
            else if((!(node.parent.alternate && node.parent.alternate.type === "IfStatement")) && !node.alternate){
                normalIf = true;
            }
            if(node.parent.type === "IfStatement"){
                isElseIf = true;
            }
            ifCondition = true;
        }
        function switch_start(node) {
            cond_block_numb++;
            tempConditionalThreshold[cond_block_numb] = LT_threshold[inner_func_numb];
            conditionalBlock[cond_block_numb] = true;
        }
        function conditional_block_start(node) {
            if(cond_block_numb > -1 && (conditionalBlock[cond_block_numb] && !normalIf)){
                LT_threshold[inner_func_numb] = tempConditionalThreshold[cond_block_numb];
                write_count[inner_func_numb] = 0;
            }
            normalIf = false;
            isElseIf = false; 
            if (ifCondition) {
                ifCondition = false;
            }
        }
        function conditional_block_end(node) {
            if (conditionalBlock[cond_block_numb]) {
                if (LT_threshold[inner_func_numb]) {
                    block_threshold[cond_block_numb] = true;
                }
            }
        }
        function switch_end(node) {
            if (block_threshold[cond_block_numb]) {
                LT_threshold[inner_func_numb] = 1;
            }
            block_threshold[cond_block_numb] = false;
            conditionalBlock[cond_block_numb] = false;
            tempConditionalThreshold[cond_block_numb] = 0;
            cond_block_numb--;
        }

        //to check in loops
        function loops_start(node) {
            inner_loop_numb++;
            LT_threshold_for_loops[inner_loop_numb] = 1;
        }
        function loops_end(node) {
            read[inner_loop_numb] = 0;
            write[inner_loop_numb] = 0;
            LT_threshold_for_loops[inner_loop_numb] = 0;
            inner_loop_numb--;
        }
        function exp_statement(node) {
            error_array = [];
        }
        function exp_statement_end(node) {
            if (is_call_exp) {
                for (var i = error_array.length - 1; i >= 0; i--) {
                    if (error_array[i].status === "read") {
                        if (!LT_threshold_for_loops[inner_loop_numb] && LT_threshold[inner_func_numb] === 1) {
                            if (!isFirstLeftAssignment) {
                                context.report(error_array[i].node, "Alternative reads and writes are detected");
                            }
                        } else if (LT_threshold_for_loops[inner_loop_numb]) {
                            read[inner_loop_numb] = 1;
                            if (write[inner_loop_numb] || LT_threshold[inner_func_numb] === 1) {
                                context.report(error_array[i].node, "Alternative reads and writes are detected");
                            }
                        }
                        read_count[inner_func_numb]++;
                    }
                    if (error_array[i].status === "write") {
                        if (!LT_threshold_for_loops[inner_loop_numb]) {
                            LT_threshold[inner_func_numb] = 1;
                        } else if (LT_threshold_for_loops[inner_loop_numb]) {
                            write[inner_loop_numb] = 1;
                            LT_threshold[inner_func_numb] = 1;
                            if (read[inner_loop_numb]) {
                                context.report(error_array[i].node, "Alternative reads and writes are detected");
                            }
                        }
                        write_count[inner_func_numb]++;
                    }
                }
                is_call_exp = false;
            }
            isFirstLeftAssignment = false;
        }
        function call_exp(node) {
            is_call_exp = true;
            if (ifCondition) {
                is_call_exp = false;
            }
        }
        function call_exp_end(node) {
            if (typeof node.callee !== "undefined" && typeof node.callee.property !== "undefined" && node.callee.property.name === "each")
                loops_end();
        }
        //function to store array variables and object variables
        function variableDeclarator(node){
            if(inner_func_numb === -1){
                return;
            }
            if(node.init && (node.init.type === "ObjectExpression" || node.init.type === "ArrayExpression")){
                objectVariables[inner_func_numb].push(node.id.name);
            }
        }
        return {
            "BlockStatement:exit": block_end,
            "FunctionExpression": func_start,
            "FunctionExpression:exit": func_end,
            "FunctionDeclaration": func_start,
            "FunctionDeclaration:exit": func_end,
            "SwitchStatement": switch_start,
            "SwitchCase": conditional_block_start,
            "SwitchCase:exit": conditional_block_end,
            "SwitchStatement:exit": switch_end,
            "IfStatement": if_start,
            "IfStatement > BlockStatement": conditional_block_start,
            "IfStatement > BlockStatement:exit": conditional_block_end,
            "MemberExpression": lt_validater,
            "MemberExpression:exit": memExpEnd,
            "ForStatement": loops_start,
            "ForStatement:exit": loops_end,
            "WhileStatement": loops_start,
            "WhileStatement:exit": loops_end,
            "DoWhileStatement": loops_start,
            "DoWhileStatement:exit": loops_end,
            "CallExpression": call_exp,
            "CallExpression:exit": call_exp_end,
            "ExpressionStatement": exp_statement,
            "ExpressionStatement:exit": exp_statement_end,
            "VariableDeclaration": exp_statement,
            "VariableDeclaration:exit": exp_statement_end,
            "VariableDeclarator" : variableDeclarator
        };
    }
};
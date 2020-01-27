/*
 * @fileoverview Rule to find the selectors which selects an element with ID in the traversal part of selectors (.find, .closest)
 * @author Bala Sundar @jankhuter
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce you to select the DOM with ID directly with document.getElementById and $('#id')",
            category: "Rendering Best Practices",
            recommended: true,
            url: "https://eslint.org/docs/rules/directly-select-with-id"
        },
        schema: [],
        messages: {
            attributeId: "Directly select as $('#id')",
            traversalsId: "Directly select with id as $('#id')"
        }
    },
    create(context) {

        // array of jquery traversals
        const arr = ["children", "closest", "contents", "filter", "find", "first", "has", "last", "next", "nextAll", "nextUntil", "offsetParent", "parent", "parents", "parentsUntil", "prev", "prevAll", "prevUntil", "siblings"];
        let innerFuncNumb = -1;
        let variableWithValueHash = []; //eslint-disable-line

        variableWithValueHash[-1] = [];

        /**
         * function that is called for every function starts
         * @returns {void}
         */
        function funcStart() {
            innerFuncNumb++;
            variableWithValueHash[innerFuncNumb] = [];
        }

        /**
         * function that is called for every function ends
         * @returns {void}
         */
        function funcEnd() {
            innerFuncNumb--;
        }

        /**
         * function that finds the wrong usage of ID selectors
         * @param {node} node is CallExpression
         * @returns {void}
         */
        function callExp(node) {
            let i;

            if (!node.arguments || !node.arguments[0]) {
                return;
            }

            // to check first level of jquery

            if ((node.callee.name === "$" || node.callee.name === "$L") && node.arguments[0].type !== "Identifier" && node.arguments[0].type !== "FunctionExpression") {
                const selector = context.getSourceCode(node),
                    text = selector.getText(node),
                    splitWithComma = text.split(",");

                for (i = 0; i < splitWithComma.length; i++) {
                    if ((/\[id\s*/).test(splitWithComma[i]) && !(/\[id\s*\^/).test(splitWithComma[i])) {
                        context.report({ node, messageId: "attributeId" });
                    }
                }

            }

            if (node.callee.property && arr.indexOf(node.callee.property.name) > -1) {
                const arg = context.getSourceCode(node.arguments[0]),
                    argContent = arg.getText(node.arguments[0]),
                    splitWithComma = argContent.split(",");

                for (i = 0; i < splitWithComma.length; i++) {
                    if ((/\[id\s*/).test(splitWithComma[i]) && !(/\[id\s*\^/).test(splitWithComma[i])) {
                        context.report({ node, messageId: "attributeId" });
                    }
                }
                if (argContent.indexOf("#") > -1 || variableWithValueHash[innerFuncNumb].indexOf(argContent) > -1) {
                    context.report({ node, messageId: "traversalsId" });
                }
            }
        }

        /**
         * function that is used to parse the binary Expression to find the string with #
         * @param {node} node is incoming param node (AssignmentExpression or VariableDeclarator)
         * @param {node} checkVal is binary Expression needed to be checked
         * @returns {void}
         */
        function pushVarWithHash(node, checkVal) {
            if (typeof checkVal === "string" && checkVal.indexOf("#") > -1) {
                if (node.type === "AssignmentExpression") {
                    variableWithValueHash[innerFuncNumb].push(node.left.value);
                } else if (node.type === "VariableDeclarator") {
                    variableWithValueHash[innerFuncNumb].push(node.id.name);
                }
            } else if (checkVal.left || checkVal.right) {
                const leftSource = context.getSourceCode(checkVal.left);
                const leftText = leftSource.getText(checkVal.left);

                pushVarWithHash(node, leftText);

                const rightSource = context.getSourceCode(checkVal.right);
                const rightText = rightSource.getText(checkVal.right);

                pushVarWithHash(node, rightText);
            }
        }

        /**
         * function that is called for every VariableDeclarator
         * @param {node} node is VariableDeclarator
         * @returns {void}
         */
        function variableDec(node) {

            // return if no value is in init
            if (node.init) {
                let checkVal;

                if (node.init.type === "Literal") {
                    checkVal = node.init.value;
                    if (typeof checkVal === "string" && checkVal.indexOf("#") > -1) {
                        variableWithValueHash[innerFuncNumb].push(node.id.name);
                    }
                } else if (node.init.type === "BinaryExpression") {
                    checkVal = node.init;
                    pushVarWithHash(node, checkVal);
                }
            }
        }

        /**
         * function that is called for every AssignmentExpression
         * @param {node} node is AssignmentExpression
         * @returns {void}
         */
        function assignmentExp(node) {

            // return if no value is in right
            if (node.right) {
                let checkVal;

                if (node.right.type === "Literal") {
                    checkVal = node.right.value;
                    if (typeof checkVal === "string" && checkVal.indexOf("#") > -1) {
                        variableWithValueHash[innerFuncNumb].push(node.left.value);
                    }
                } else if (node.right.type === "BinaryExpression") {
                    checkVal = node.right;
                    pushVarWithHash(node, checkVal);
                }
            }
        }

        return {
            FunctionExpression: funcStart,
            "FunctionExpression:exit": funcEnd,
            FunctionDeclaration: funcStart,
            "FunctionDeclaration:exit": funcEnd,
            CallExpression: callExp,
            VariableDeclarator: variableDec,
            AssignmentExpression: assignmentExp
        };
    }
};

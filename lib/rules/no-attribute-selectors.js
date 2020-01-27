/*
 * @fileoverview Rule to flag the selectors which use attributes to select the elements
 * @author Bala Sundar @jankhuter
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "disallow you to select the DOM with attributes",
            category: "Rendering Best Practices",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-attribute-selectors"
        },
        schema: [],
        messages: {
            attributeSelector: "Use specific selectors rather than selecting with attributes"
        }
    },
    create(context) {

        // array of jquery traversals
        const arr = ["children", "closest", "contents", "filter", "find", "first", "has", "last", "next", "nextAll", "nextUntil", "offsetParent", "parent", "parents", "parentsUntil", "prev", "prevAll", "prevUntil", "siblings"];

        /**
         * function that finds the attribute selectors
         * @param {text} text is selector needed to be checked
         * @param {node} node is CallExpression
         * @returns {void}
         */
        function selectorValidator(text, node) {
            const splitWithComma = text.split(",");
            let splitWithPlus,
                i,
                j;

            for (i = 0; i < splitWithComma.length; i++) {
                splitWithPlus = splitWithComma[i].split("+");
                for (j = 0; j < splitWithPlus.length; j++) {
                    if (j % 2 !== 0) {
                        return;
                    }
                    if (splitWithPlus[j].indexOf("[") > -1 && !splitWithPlus[j].match(/\[id\s*/)) {
                        context.report({ node, messageId: "attributeSelector" });
                    }
                }
            }
        }

        /**
         * function that finds selectors
         * @param {node} node is CallExpression
         * @returns {void}
         */
        function callExp(node) {
            if (!node.arguments || !node.arguments[0]) {
                return;
            }
            if (node.arguments[0].type === "MemberExpression" || node.arguments[0].type === "FunctionExpression") {
                return;
            }

            // to check first level of jquery
            if ((node.callee.name === "$" || node.callee.name === "$L") && node.arguments[0].type !== "Identifier") {
                const selector = context.getSourceCode(node),
                    text = selector.getText(node);

                selectorValidator(text, node);
            }
            if (node.callee.property && arr.indexOf(node.callee.property.name) > -1) {
                const arg = context.getSourceCode(node.arguments[0]),
                    argContent = arg.getText(node.arguments[0]);

                selectorValidator(argContent, node);
            }
        }

        return {
            CallExpression: callExp
        };
    }
};

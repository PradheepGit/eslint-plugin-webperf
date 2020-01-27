/*
 * @fileoverview Rule to explain the proper use of .show() (must be in last of jQuery chaining).
 * @author Sundara Akilesh . P
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce the use of .show() in the last",
            category: "Best Practices",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-show-last"
        },
        schema: [],
        messages: {
            remove: ".show() should be the last statement in jquery chaining"
        }
    },
    create(context) {

        var elem, // eslint-disable-line
            arr1 = ["children", "closest", "contents", "filter", "find", "first", "has", "last", "next", "nextAll", "nextUntil", "offsetParent", "parent", "parents", "parentsUntil", "prev", "prevAll", "prevUntil", "siblings"];

        /**
         * show must be in the last
         *@param{node} node is member expression
         * @returns {void}
         */
        function memfun(node) {
            if (node.property && node.property.name === "show") {

                if (node.parent.parent && node.parent.parent.type === "ExpressionStatement") {
                    return;
                }
        if (node.parent.parent && node.parent.parent.type === "IfStatement") {
                    return;
                }
                elem = node;

                for (elem; elem.parent.parent && elem.parent.parent.type !== "ExpressionStatement";) {
                    if (elem.parent.parent.property && arr1.includes(elem.parent.parent.property.name)) {
                        return;
                    }
                    elem = elem.parent.parent;
                    if (!elem.parent) {
                        return;
                    }
                }

                context.report({ node, messageId: "remove" });
            }
        }
        return {
            MemberExpression: memfun
        };
    }
};

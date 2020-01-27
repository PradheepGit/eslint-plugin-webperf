/*
 * @fileoverview Rule to explain the proper use of async
 * @author Sundara Akilesh
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "disallow use of async in making ajax calls",
            category: "Best Practices",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-async-false"
        },
        schema: [],
        messages: {
            remove: "remove async in property"
        }
    },
    create(context) {

        /**
         * Disallow use of async
         * @param {node} node is Property
         * @returns {void}
         */
        function property(node) {
            if (node.type === "Property" && node.key.type === "Literal" && node.key.value === "async") {
                context.report({ node, messageId: "remove" });
            }
            if (node.type === "Property" && node.key.type === "Identifier" && node.key.name === "async") {
                context.report({ node, messageId: "remove" });
            }
        }
        return {
            Property: property
        };
    }
};

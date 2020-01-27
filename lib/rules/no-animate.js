/*
 *fileoverview Rule to flag declared but unused variables
 * @author Ilya Volodin
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create: function(context) {
        function checkFn(node) {
            if (node.property.type == "Identifier" && node.property.name == "animate" && node.parent.arguments) {
                var selector = context.getSourceCode(node.parent.arguments[0]);
                var text = selector.getText(node.parent.arguments[0]);
                if (text.indexOf("scrollTop") === -1) {
                    context.report(node, "Do not use animate function. Use css animations");
                }
            }
        }
        return {
            "MemberExpression": checkFn
        };
    }
};
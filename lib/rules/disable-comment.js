/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const utils = require("./utils")

const PATTERNS = {
    Block: /^\s*(eslint-disable?-line)\s*(\S)?/,
    Line: /^\s*(eslint-disable(?:-next)?-line)\s*(\S)?/,
}

module.exports = {
    meta: {
        docs: {
            description:
                "disallows `eslint-disable` comments without rule names",
            category: "Best Practices",
            recommended: true,
            url:
                "https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/v3.0.0-beta.2/docs/rules/no-unlimited-disable.md",
        },
        fixable: null,
        schema: [],
    },

    create(context) {
        const sourceCode = context.getSourceCode()

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    const pattern = PATTERNS[comment.type]
                    if (pattern == null) {
                        continue
                    }

                    const m = pattern.exec(comment.value)
                    if (m && !m[2]) {
                        context.report({
                            loc: utils.toForceLocation(comment.loc),
                            message:
                                "Unexpected unlimited '{{kind}}' comment. Specify some rule names to disable.",
                            data: { kind: m[1] },
                        })
                    }
                }
            },
        }
    },
}
// eslint exercise 4 (no-console)
// When you're finished with this exercise, run
//   "npm start exercise.eslint.5"
//   to move on to the next exercise

const disallowedMethods = ['log', 'info', 'warn', 'error', 'dir']

module.exports = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          allowedMethods: {
            type: 'array',
            items: {
              enum: ['log', 'info', 'warn', 'error', 'dir'],
            },
            minItems: 1,
            uniqueItems: true,
          },
        },
      },
    ],
  },
  create(context) {
    const consoleUsages = []
    const config = context.options[0] || {}
    const allowedMethods = config.allowedMethods || []

    function isDisallowedFunctionCall(identifier) {
      return looksLike(identifier, {
        parent: {
          type: 'MemberExpression',
          parent: {type: 'CallExpression'},
          property: {
            name: val =>
              !allowedMethods.includes(val) && disallowedMethods.includes(val),
          },
        },
      })
    }

    return {
      'Program:exit'(node) {
        consoleUsages.forEach(identifier => {
          if (identifier.parent.type === 'VariableDeclarator') {
            const references = context
              .getDeclaredVariables(identifier.parent)[0]
              .references.slice(1)
            references.forEach(({identifier}) => {
              if (isDisallowedFunctionCall(identifier)) {
                context.report({
                  node: identifier.parent.property,
                  message: 'Using console is not allowed',
                })
              }
            })
          }
          if (
            identifier.name === 'console' &&
            !isDisallowedFunctionCall(identifier)
          ) {
            return
          }
          context.report({
            node: identifier.parent.property,
            message: 'Using console is not allowed',
          })
        })
      },
      Identifier(node) {
        if (node.name !== 'console') {
          return
        }
        consoleUsages.push(node)
      },
    }
  },
}

function looksLike(a, b) {
  return (
    a &&
    b &&
    Object.keys(b).every(bKey => {
      const bVal = b[bKey]
      const aVal = a[bKey]
      if (typeof bVal === 'function') {
        return bVal(aVal)
      }
      return isPrimitive(bVal) ? bVal === aVal : looksLike(aVal, bVal)
    })
  )
}

function isPrimitive(val) {
  return val == null || /^[sbn]/.test(typeof val)
}

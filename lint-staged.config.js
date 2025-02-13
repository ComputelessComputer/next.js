const { quote } = require('shell-quote')
const { ESLint } = require('eslint')

const eslint = new ESLint()

/**
 * Escape filenames to ensure that spaces and such aren't interpreted as
 * separators.
 *
 * @param {string[]} filenames
 * @returns {string[]}
 */
function escape(filenames) {
  if (process.platform === 'win32') {
    return filenames
  }

  return filenames.map((filename) => quote([filename]).replace(/\\@/g, '@'))
}

module.exports = {
  '*.{js,jsx,mjs,ts,tsx,mts}': async (filenames) => {
    const escapedFileNames = escape(filenames).join(' ')
    const eslintFileNames = await Promise.all(
      filenames.map(async (filename) => {
        const ignored = await eslint.isPathIgnored(filename)
        return ignored ? null : filename
      })
    )

    return [
      `prettier --with-node-modules --ignore-path .prettierignore --write ${escapedFileNames}`,
      `eslint --no-ignore --max-warnings=0 --fix ${eslintFileNames
        .filter((filename) => filename !== null)
        .map((filename) => {
          return `"${filename}"`
        })
        .join(' ')}`,
      `git add ${escapedFileNames}`,
    ]
  },
  '*.{json,md,mdx,css,html,yml,yaml,scss}': [
    'prettier --with-node-modules --ignore-path .prettierignore --write',
  ],
  '*.rs': ['cargo fmt --'],
}

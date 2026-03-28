// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const typescriptParserPath = require.resolve('@typescript-eslint/parser');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'legacy/**', 'coverage/**'],
  },
  {
    settings: {
      'import/parsers': {
        [typescriptParserPath]: ['.ts', '.tsx'],
      },
    },
  },
]);

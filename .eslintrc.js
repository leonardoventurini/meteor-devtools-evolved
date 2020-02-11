module.exports = {
  parser: 'babel-eslint', // Specifies the ESLint parser
  extends: [
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/prop-types': 0,
    'react/jsx-curly-spacing': 0,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

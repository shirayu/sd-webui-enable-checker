import eslintConfigPrettier from "eslint-config-prettier";
export default [
  {
    languageOptions: {
      globals: {
        amd: true,
        browser: true,
        es6: true,
        jquery: true,
        node: true,
      },
    },
  },
  eslintConfigPrettier,
];

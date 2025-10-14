// backend/eslint.config.js (ESLint v9 flat config)
export default [
  // Which files to lint
  {
    files: ["**/*.js"],
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "frontend/**"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
  'no-unused-vars': ['warn', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrors: 'all',
    caughtErrorsIgnorePattern: '^_' 
  }],
      // Merge-conflict armor: discourage wrong route filenames
      // blocks imports from src/routes/* unless they end with .routes.js
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/src/routes/*", "!**/*.routes.js"],
              message: "Import route files with the `.routes.js` suffix."
            }
          ],
          paths: [
            { name: "../routes/requests.js", message: "Use `requests.routes.js`" },
            { name: "../routes/user.js",     message: "Use `user.routes.js` or `users.routes.js`" }
          ]
        }
      ]
    }
  }
];

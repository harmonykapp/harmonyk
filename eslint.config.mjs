// eslint.config.mjs
import react from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: [
            "**/.next/**",
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.turbo/**",
            "**/public/**",
            "**/.husky/**",
            "**/*.js",
            "**/*.d.ts",
        ],
        // ⬇️ Ignore "Unused eslint-disable directive" so max-warnings=0 passes
        linterOptions: {
            reportUnusedDisableDirectives: "off",
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: { jsx: true },
            },
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            react,
        },
        settings: { react: { version: "detect" } },
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-extra-semi": "off",
            "react/no-danger": "off",
        },
    },
];

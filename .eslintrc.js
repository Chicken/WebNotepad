module.exports = {
    "env": {
        "commonjs": true,
        "es2021": true,
        "node": true,
        "browser": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "max-len": "error",
        "no-var": "error",
        "space-infix-ops": "error",
        "no-empty": [
            "error",
            {
                "allowEmptyCatch": true
            }
        ]
    }
};

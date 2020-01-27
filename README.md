# eslint-plugin-weperf

Plugin for rules which enhances web performance

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-webperf`:

```
$ npm install eslint-plugin-webperf --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-webperf` globally.

## Usage

Add `webperf` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "webperf"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "webperf/rule-name": 2
    }
}
```

## Supported Rules

* Fill in provided rules here






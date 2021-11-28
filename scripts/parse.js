
function getVariables(expr) {
    expr += ' ';
    let v = new RegExp(/[a-zA-Z_][a-zA-Z_0-9]*[^a-zA-Z_0-9]/g);
    let lst = [];
    if (!expr.match(v)) return new Set();
    for (let s of expr.match(v)) {
        lst.push(s.substring(0, s.length - 1));
    }
    let vars = new Set(lst);
    for (let mathKeyword of ['sin', 'cos', 'tan',
                             'asin', 'acos', 'atan',
                             'sinh', 'cosh', 'tanh',
                             'asinh', 'acosh', 'atanh',
                             'pow', 'log', 'exp',
                             'sqrt', 'inversesqrt',
                             'abs', 'ceil', 'max', 'min',
                             'mod', 'modf', 'pi',
                             'circle']) {
        console.log(vars.delete(mathKeyword));
    }
    console.log(vars);
    return vars;
}


let getNumberAndEndPos = function(expr, i) {
    let num = '';
    let isFloat = false;
    while (i < expr.length &&
           ('0123456789'.indexOf(expr[i]) >= 0 ||
            'Ee.'.indexOf(expr[i]) >= 0)) {
        if (expr[i] === '.') {
            isFloat = true;
            num += expr[i];
            i += 1;
        }
        if ('eE'.indexOf(expr[i]) >= 0) {
            isFloat = true;
            if (i+1 < expr.length  &&
                '+-'.indexOf(expr[i+1]) >= 0) {
                num += expr[i] + expr[i+1];
                i += 2;
            } else {
                num += expr[i];
                i += 1;
            }
        } else {
            num += expr[i];
            i += 1;
        }
    }
    if (!isFloat) {
        num += '.0';
    }
    return {i: i, num: num};
}


function replaceIntsToFloats(expr) {
    let newExpr = '';
    let i = 0;
    while ( i < expr.length) {
        if ('0123456789.'.indexOf(expr[i]) >= 0 &&
            ((i - 1 >= 0 &&
             ' ()+-*/'.indexOf(expr[i-1]) >= 0)
            || i === 0)
        ) {
            let num;
            ({i, num} = getNumberAndEndPos(expr, i));
            newExpr += num;
        } else {
            newExpr += expr[i];
            i++;
        }
    }
    return newExpr;
}

function isAlphanumericOrUnderscore(letter) {
    return (letter.charCodeAt(0) >= 48 && 
            letter.charCodeAt(0) <= 57) ||
           (letter.charCodeAt(0) >= 65 &&
            letter.charCodeAt(0) <= 90) ||
            (letter.charCodeAt(0) >= 97 && 
            letter.charCodeAt(0) <= 122) ||
            letter === '_' || letter === '.';
}

function getPowerExpressionLocation(expr, i) {
    let parenthStack = [];
    let j = i + 1;
    while (j < expr.length &&
        (isAlphanumericOrUnderscore(expr[j]) || 
            expr[j] === '(' || parenthStack.length > 0
        ) || (parenthStack.length == 0 && 
                ((expr.substring(j, j+2) === '**' ||
                    expr.substring(j-1, j+1) === '**')
                    || expr[j] === '^'
                )
            )
    ) {
        if (expr[j] === '(') parenthStack.push('(');
        if (expr[j] === ')') parenthStack.pop();
        j++;
    }
    parenthStack = [];
    let k = (expr[i] === '*')? i - 2: i - 1;
    while (k >= 0 && (isAlphanumericOrUnderscore(expr[k])
            || expr[k] === ')' || parenthStack.length > 0)) {
        if (expr[k] === ')') parenthStack.push(')');
        if (expr[k] === '(') parenthStack.pop();
        k--;
    }
    return {start: k+1, end: j};
}

function powerOpsToCallables(expr, isWhitespaceRemoved) {
    if (!isWhitespaceRemoved) {
        while (expr.includes(' ', '')) {
            expr = expr.replace(' ', '');
        }
    }
    let i = 0;
    while (i < expr.length) {
        let c = expr[i];
        if (c === '^' || (c === '*' && i > 0 && 
                          expr[i-1] === '*')) {
            let {start, end} = getPowerExpressionLocation(expr, i);
            let powExpr = powerOpToCallable(expr.substring(start, end));
            expr = expr.substring(0, start) + powExpr
                     + expr.substring(end, expr.length);
            setTimeout(() => {}, 1000);
        }
        i += 1;
    }
    return expr;
}

function split(expr, delim) {
    let string0 = expr.split(delim)[0];
    let string1 = '';
    for (let i = string0.length + delim.length; 
         i < expr.length; i++) {
        string1 += expr[i];
    }
    // console.log([string0, string1]);
    return [string0, string1];
}

function powerOpToCallable(expr) {
    let caret = expr.search('\\^');
    let stars = expr.search('\\*\\*');
    let binTokens;
    if (stars >= 0 && caret < 0) {
        binTokens = split(expr, '**');
    }
    else if (stars < 0 && caret >= 0) {
        binTokens = split(expr, '^');
    }
    else {
        binTokens = (caret < stars)? split(expr, '^') : 
                                     split(expr, '**');
    }
    // TODO: Fix a bug in replaceIntsToFloats
    // where in expressions such as pow(x,2)
    // the 2 is not converted to 2.0.
    let tmp = replaceIntsToFloats(binTokens[1]);
    return 'pow(' + binTokens[0] + ',' + tmp + ')';
}


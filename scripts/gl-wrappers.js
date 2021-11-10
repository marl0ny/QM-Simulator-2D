/*
* Functions and classes to wrap around the
* various WebGL interfaces.
*/

canvas = document.getElementById("sketch-canvas");
let context = (useWebGL2IfAvailable)? "webgl2": "webgl";

function initializeCanvasGL(canvas, context) {
    let gl = (useWebGL2IfAvailable)? canvas.getContext(context): null;
    let ext = null;
    let ext2 = null;
    if (gl === null) {
        context = "webgl";
        gl = canvas.getContext(context);
        if (gl === null) {
            let msg = "Your browser does not support WebGL.";
            alert(msg);
            throw msg;
        }
        ext = gl.getExtension('OES_texture_float');
        ext2 = gl.getExtension('OES_texture_float_linear');
        if (ext === null && ext2 === null) {
            let msg = "Your browser does not support "
                      + "the necessary WebGL extensions.";
            alert(msg);
            throw msg;
        }
    } else {
        ext = gl.getExtension('EXT_color_buffer_float');
        if (ext === null) {
            let msg = "Your browser does not support "
                       + "the necessary WebGL extensions.";
            alert(msg);
            throw msg;
        }
    }

    if (gl === null) {
        document.getElementById("error-text").textContent =
            `<br>Unable to display canvas.`;
    }

    if (gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,
                                    gl.HIGH_FLOAT).precision < 23) {
        let msg = "Your GPU does not support 32 bit floats or higher. "
                + "You may see solutions quickly decay to zero.";
        alert(msg);
    }
    return gl;
}
let gl = initializeCanvasGL(canvas, context);

function makeShader(shaderType, shaderSource) {
    let shaderID = gl.createShader(shaderType);
    if (shaderID === 0) {
        alert("Unable to create shader.");
    }
    gl.shaderSource(shaderID,
                    (context === "webgl2")? "#version 300 es\n" + shaderSource:
                                            shaderSource
                   );
    gl.compileShader(shaderID);
    if (!gl.getShaderParameter(shaderID, gl.COMPILE_STATUS)) {
        let msg = gl.getShaderInfoLog(shaderID);
        alert(`Unable to compile shader.\n${msg}`);
        gl.deleteShader(shaderID);
    }
    return shaderID;
}

function makeProgram(...shaderIDs) {
    let shaderProgram = gl.createProgram();
    for (let shaderID of shaderIDs) {
        gl.attachShader(shaderProgram, shaderID);
    }
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            'Unable to initialize the shader program: '
            + gl.getProgramInfoLog(shaderProgram));
    }
    return shaderProgram;
}

function unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}

function makeBlankTexture(buf, w, h, format, boundaries) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (format === gl.FLOAT) {
        gl.texImage2D(
            gl.TEXTURE_2D, 0,
            (context === "webgl")? gl.RGBA: gl.RGBA32F,
            w, h, 0,
            gl.RGBA, format,
            buf
        );
    } else {
        gl.texImage2D(
            gl.TEXTURE_2D, 0,
            (context === "webgl")? gl.RGBA: gl.RGBA8,
            w, h, 0, gl.RGBA, format,
            buf
        );
    }
    let interpolation;
    if (context === "webgl2") {
        interpolation = (format === gl.FLOAT)? gl.NEAREST: gl.LINEAR;
    } else {
        interpolation = gl.LINEAR;
    }
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, boundaries.s);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, boundaries.t);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpolation);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpolation);
    /*if (context == "webgl") {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }*/
    return texture;
}

function draw() {
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function drawLines(numberOfLines) {
    gl.drawArrays(gl.LINES, 0, numberOfLines);
}

class Frame {
    constructor(w, h, frameNumber) {
        unbind();
        this.shaderProgram = null;
        this.uniforms = {};
        this.frameNumber = frameNumber;
        this.frameTexture = null;
        this.setTexture(w, h, {s: gl.CLAMP_TO_EDGE,
                               t: gl.CLAMP_TO_EDGE});
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();
        this.fbo = gl.createFramebuffer();
        if (this.frameNumber !== 0) {
            this.activateFramebuffer();
        }
        unbind();
    }
    setTexture(w, h, boundaries) {
        gl.activeTexture(gl.TEXTURE0 + this.frameNumber);
        let type = (this.frameNumber === 0)? gl.UNSIGNED_BYTE: gl.FLOAT;
        this.frameTexture = makeBlankTexture(null, w, h, type, boundaries);
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    }
    activateFramebuffer() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, this.frameTexture, 0);
    }
    setFloatUniforms(uniforms) {
        for (let field of Object.keys(uniforms)) {
            this.uniforms[field] = gl.getUniformLocation(this.shaderProgram,
                                                         field);
            gl.uniform1f(this.uniforms[field], uniforms[field]);
        }
    }
    setIntUniforms(uniforms) {
        for (let field of Object.keys(uniforms)) {
            this.uniforms[field] = gl.getUniformLocation(this.shaderProgram,
                                                         field);
            gl.uniform1i(this.uniforms[field], uniforms[field]);
        }
    }
    setVec3Uniforms(uniforms) {
        for (let field of Object.keys(uniforms)) {
            this.uniforms[field] = gl.getUniformLocation(this.shaderProgram,
                                                         field);
            gl.uniform3fv(this.uniforms[field], uniforms[field]);
        }   
    }
    useProgram(shaderProgram) {
        this.shaderProgram = shaderProgram;
        gl.useProgram(shaderProgram);
    }
    bind() {
        if (this.frameNumber !== 0) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        }
        let shaderProgram = this.shaderProgram;
        let vertices = new Float32Array([1.0, 1.0, 0.0, 1.0, -1.0, 0.0,
                                         -1.0, -1.0, 0.0, -1.0, 1.0, 0.0]);
        let elements = new Uint16Array([0, 2, 3, 0, 1, 2]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
        let pos = gl.getAttribLocation(shaderProgram, 'pos');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 3*4, 0);
    }
    getTextureArray(boxDimensions) {
        // Getting texture data as array:
        // https://stackoverflow.com/a/18804153
        // answered by nkron
        // (https://stackoverflow.com/users/977809/nkron)
        // question (https://stackoverflow.com/q/4702032)
        // by pion (https://stackoverflow.com/users/365450/pion)
        let x, y, w, h;
        ({x, y, w, h} = boxDimensions);
        let buf = new Float32Array((w - x)*(h - y)*4);
        gl.readPixels(x, y, w, h, gl.RGBA, gl.FLOAT, buf);
        return buf;
    }
    substituteTextureArray(w, h, type, arr) {
        gl.activeTexture(gl.TEXTURE0 + this.frameNumber);
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, type, arr);
        gl.activeTexture(gl.TEXTURE0);
    }
}

class VectorFieldFrame extends Frame {
    bind(vertices) {
        if (this.frameNumber !== 0) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        }
        let shaderProgram = this.shaderProgram;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        let pos = gl.getAttribLocation(shaderProgram, 'pos');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 3*4, 0);
    }
}

class ImageFrame extends Frame {
    constructor(w, h, image, frameNumber, shaderProgram) {
        super(w, h, 0);
        this.shaderProgram = shaderProgram;
        this.bind();
        gl.activeTexture(gl.TEXTURE0 + frameNumber);
        this.frameTexture = makeBlankTexture(image, w, h,
                                             gl.UNSIGNED_BYTE,
                                             gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, this.frameTexture, 0);
        unbind();

    }
    getTextureArray(boxDimensions) {
        throw "Not implemented yet";
    }
}


class FramesManager {
    constructor() {
        this.frames = [];
        this.vectorFieldFrames = [];
        this.nullTexNumber = 0;
    }
    addFrame(width, height) {
        let frame = new Frame(width, height, this.nullTexNumber);
        this.frames.push(frame);
        this.nullTexNumber++;
    }
    addFrames(width, height, n) {
        for (let i = 0; i < n; i++) {
            this.addFrame(width, height);
        }
    }
    addVectorFieldFrame(width, height) {
        let frame = new VectorFieldFrame(width, height, this.nullTexNumber);
        this.vectorFieldFrames.push(frame);
        this.nullTexNumber++;
    }
}


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

function createFunctionShader(expr, uniforms) {
    let splitTemplateShader = [`
    precision highp float;
    #if __VERSION__ == 300
    #define texture2D texture
    in vec2 fragTexCoord;
    out vec4 fragColor;
    #else
    #define fragColor gl_FragColor
    varying highp vec2 fragTexCoord;
    #endif
    uniform float xScale;
    uniform float yScale;
    uniform sampler2D prevV;`, // 0
    '// UNIFORMS HERE', // 1
    `
    float circle(float x, float y,
                 float x0, float y0, float r) {
        float xc = x0 - x;
        float yc = y0 - y;
        return (sqrt(xc*xc + yc*yc) < r)? 1.0: 0.0;
    }
    `, // 2
    'void main() {',  // 3
    '    float pi = 3.141592653589793;', // 4
    '    float x = xScale*fragTexCoord.x;', // 5
    '    float y = yScale*fragTexCoord.y;', // 6
    '    float functionValue = ', // 7
    `float prevVal = texture2D(prevV, fragTexCoord).r;
    if (functionValue > 30.0) {
        fragColor = vec4(30.0, prevVal, 0.0, 1.0);
    } else {
        if (functionValue >= 0.0) {
            fragColor = vec4(functionValue, prevVal, 0.0, 1.0);
        } else {
            fragColor = vec4(0.0, prevVal, 0.0, 1.0);
        }
    }
    `, // 8
    '}'];
    splitTemplateShader[7] = splitTemplateShader[7] + expr + ';';
    for (let uniform of uniforms) {
        splitTemplateShader[1] += '\n' + `uniform float ${uniform};`;
    }
    splitTemplateShader[1] += '\n';
    let templateShaderText = '';
    for (let s of splitTemplateShader) {
        templateShaderText += s + '\n';
    }
    if (context === "webgl2")
        templateShaderText = "#version 300 es\n" + templateShaderText;
    let shaderID = gl.createShader(gl.FRAGMENT_SHADER);
    if (shaderID === 0) {
        return null;
    }
    gl.shaderSource(shaderID, templateShaderText);
    gl.compileShader(shaderID);
    if (!gl.getShaderParameter(shaderID, gl.COMPILE_STATUS)) {
        gl.deleteShader(shaderID);
        return null;
    }
    return shaderID;
}

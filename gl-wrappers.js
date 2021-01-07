/*
* Functions and classes to wrap around the
* various WebGL interfaces.
*/

function makeShader(shaderType, shaderSource) {
    let shaderID = gl.createShader(shaderType);
    if (shaderID === 0) {
        alert("Unable to create shader.");
    }
    gl.shaderSource(shaderID, shaderSource);
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

function makeTexture(buf, w, h) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 
        w, h, 0, 
        gl.RGBA, gl.FLOAT, 
        buf
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
}


class Frame {
    constructor(w, h, frameNumber) {
        unbind();
        this.shaderProgram = null;
        this.uniforms = {};
        this.frameNumber = frameNumber;
        this.frameTexture = null;
        if (this.frameNumber !== 0) {
            gl.activeTexture(gl.TEXTURE0 + frameNumber);
            this.frameTexture = makeTexture(null, w, h);
            gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        }
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();
        this.fbo = gl.createFramebuffer();
        if (this.frameNumber !== 0) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                                    gl.TEXTURE_2D, this.frameTexture, 0);
        }
        unbind();
    }
    setFloatUniforms(uniforms) {
        for (let field of Object.keys(uniforms)) {
            this.uniforms[field] = gl.getUniformLocation(this.shaderProgram, field);
            gl.uniform1f(this.uniforms[field], uniforms[field]);
        }
    }
    setIntUniforms(uniforms) {
        for (let field of Object.keys(uniforms)) {
            this.uniforms[field] = gl.getUniformLocation(this.shaderProgram, field);
            gl.uniform1i(this.uniforms[field], uniforms[field]);
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
        // https://stackoverflow.com/a/18804153
        ({x, y, w, h} = boxDimensions);
        let buf = new Float32Array((w - x)*(h - y)*4);
        gl.readPixels(x, y, w, h, gl.RGBA, gl.FLOAT, buf);
        return buf;
    }
}

function getVariables(expr) {
    expr += ' ';
    let v = new RegExp(/[a-zA-Z_][a-zA-Z_0-9]*[^a-zA-Z_0-9]/g);
    let lst = [];
    for (let s of expr.match(v)) {
        lst.push(s.substring(0, s.length - 1));
    }
    let vars = new Set(lst);
    for (let mathKeyword in ['sin', 'cos', 'tan',
                             'asin', 'acos', 'atan',
                             'sinh', 'cosh', 'tanh',
                             'asinh', 'acosh', 'atanh',
                             'pow', 'log', 'exp',
                             'sqrt', 'inversesqrt',
                             'abs', 'ceil', 'max', 'min', 
                             'mod', 'modf', 'pi']) {
        vars.delete(mathKeyword);
    }
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
    return {i: i, num: num}
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
            ({i, num} = getNumberAndEndPos(expr, i));
            newExpr += num;
        } else {
            newExpr += expr[i];
            i++;
        }
    }
    return newExpr;
}
// replaceIntsToFloats('a3*3 - 4*x + y + z*0.1231 - 3');


/*function replaceCaretPowersWithPow(expr) {
    // Posible cases
    let varOrNumber = '(?:[a-zA-Z_][a-zA-Z_0-9]*|[0-9]+(\.)?'
                      + '|\.[0-9]+|[0-9]*(\.)?[0-9]+[eE](-)?[0-9]+)'
    let powExpr = new RegExp(varOrNumber + '\s*\^\s*' + varOrNumber);
    while(expr.match(powExpr) !== null) {
        let match = expr.match(powExpr);
        match.split 
        expr.replaceAll(match, '');
    }

}*/

function createFunctionShader(expr, uniforms) {
    let splitTemplateShader = [`
    precision highp float;
    varying highp vec2 fragTexCoord;
    uniform float xScale;
    uniform float yScale;`, // 0
    '// UNIFORMS HERE', // 1
    'void main() {',  // 2
    '    float pi = 3.141592653589793;', // 3
    '    float x = xScale*fragTexCoord.x;', // 4
    '    float y = yScale*fragTexCoord.y;', // 5
    '    float functionValue = ', // 6
    `    if (functionValue > 30.0) {
        gl_FragColor = vec4(30.0, 0.0, 0.0, 1.0);
    } else {
        if (functionValue >= 0.0) {
            gl_FragColor = vec4(functionValue, 0.0, 0.0, 1.0);
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
    `, // 7
    '}'];
    splitTemplateShader[6] = splitTemplateShader[6] + expr + ';';
    for (let uniform of uniforms) {
        splitTemplateShader[1] += '\n' + `uniform float ${uniform};`
    }
    splitTemplateShader[1] += '\n';
    templateShaderText = '';
    for (let s of splitTemplateShader) {
        templateShaderText += s + '\n';
    }
    let shaderID = gl.createShader(gl.FRAGMENT_SHADER);
    if (shaderID === 0) {
        return null;
    }
    gl.shaderSource(shaderID, templateShaderText);
    gl.compileShader(shaderID);
    if (!gl.getShaderParameter(shaderID, gl.COMPILE_STATUS)) {
        // let msg = gl.getShaderInfoLog(shaderID);
        // alert(msg);
        gl.deleteShader(shaderID);
        return null;
    }
    return shaderID;
}

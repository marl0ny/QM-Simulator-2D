
function createPotentialShader(expr, uniforms) {
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

function createWavefunctionShader(expr, uniforms) {
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
    const float pi = 3.141592653589793;
    uniform float dx;
    uniform float dy;
    uniform float px;
    uniform float py;
    uniform float borderAlpha;
    uniform float xScale;
    uniform float yScale;`, // 0
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
    '    float x = xScale*fragTexCoord.x - 0.5;', // 4
    '    float y = yScale*fragTexCoord.y - 0.5;', // 5
    '    float functionValue = ', // 6
    `    //if (fragTexCoord.x > dx && fragTexCoord.x < 1.0-dx &&
         //    fragTexCoord.y > dy && fragTexCoord.y < 1.0-dy) {
            float re = functionValue*cos(2.0*pi*(px*x + py*y));
            float im = functionValue*sin(2.0*pi*(px*x + py*y));
            fragColor = vec4(re, im, 0.0, 1.0); 
        /* } else {
            fragColor = vec4(0.0, 0.0, 0.0, borderAlpha); 
        }*/
    `, // 7
    '}'];
    splitTemplateShader[6] = splitTemplateShader[6] + expr + ';';
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

function createNonlinearExpPotentialShader(expr, uniforms) {
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
    const float pi = 3.141592653589793;
    uniform sampler2D texV;
    uniform sampler2D texPsi;
    uniform float dt;
    uniform float hbar;`, // 0
    '// UNIFORMS HERE', // 1
    'void main() {',  // 2
    '    vec4 psi = texture2D(texPsi, fragTexCoord);', // 3
    '    float u = psi.x*psi.x + psi.y*psi.y;', // 4
    '    float value = ', // 5
    `    vec4 potential = texture2D(texV, fragTexCoord);
    float reV = potential[0] + value;
    float imV = potential[2];
    // Arg = -i*0.5*(reV + i*imV)*dt/hbar = 0.5*(-i*reV + imV)*dt/hbar
    float imArg = -0.5*reV*dt/hbar;
    float reArg = 0.5*imV*dt/hbar;
    fragColor = vec4(exp(reArg)*cos(imArg), exp(reArg)*sin(imArg), 0.0, 1.0);
    `, // 6
    '}'];
    console.log(expr);
    splitTemplateShader[5] = splitTemplateShader[5] + expr + ';';
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
const copyOverFragmentSource = `#define NAME copyOverFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;

void main () {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    gl_FragColor = vec4(col1.rgb + col2.rgb, 1.0); 
}
`;


const reshapePotentialFragmentSource = `#define NAME reshapePotentialFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform float bx;
uniform float by;
uniform float v2;


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    if ((xy.x - bx)*(xy.x - bx) < 0.0001 && (xy.y - by)*(xy.y - by) < 0.0001
         && initialV < v2) {
        gl_FragColor = vec4(v2, (initialV + v2)/2.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(initialV, initialV, 0.0, 1.0);
    }
}
`;


const initializePotentialFragmentSource = `#define NAME initializePotentialFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform int potentialType;

// Controls size of potential
uniform float a;

// For the double slit
uniform float y0;
uniform float w;
uniform float spacing;
uniform float x1;
uniform float x2;


void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    if (potentialType == 1) {
        gl_FragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0, 0.0, 1.0); 
    } else if (potentialType == 2) {
        if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             (x >= x1 + spacing/2.0 &&
              x <= x2 - spacing/2.0
             ) || x >= x2 + spacing/2.0
            )) {
            gl_FragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 3) {
         if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             x >= x1 + spacing/2.0)) {
            gl_FragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 4) {
        float u = 10.0*(x - 0.5);        
        float v = 10.0*(y - 0.5);
        float oneOverR = 1.0/sqrt(u*u + v*v);
        float val = (oneOverR < 50.0)? oneOverR: 50.0;
        gl_FragColor = vec4(val, 0.0, 0.0, 1.0); 
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}`;


const realTimeStepFragmentSource = `#define NAME realTimeStepFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform float dx;
uniform float dy;
uniform float dt;
uniform float w;
uniform float h;
uniform float m;
uniform float hbar;
uniform float rScaleV;
uniform sampler2D texPsi;
uniform sampler2D texV;


void main () {
    float V = rScaleV*texture2D(texV, fragTexCoord).r;
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).g;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).g;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).g;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).g;
    // float div2ImPsi = (u + d - 2.0*imPsi)/(dy*dy) + (l + r - 2.0*imPsi)/(dx*dx);
    float div2ImPsi = (u + d + l + r - 4.0*imPsi)/(dx*dx);
    float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + V*imPsi;
    gl_FragColor = vec4(rePsi + hamiltonImPsi*dt/hbar, imPsi, 0.0, 1.0);
}`;


const initialWaveFragmentSource = `#define NAME initialWaveFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform float dx;
uniform float dy;
uniform float bx;
uniform float by;
uniform float px;
uniform float py;
float sqrt2 = 1.4142135623730951; 
float sqrtpi = 1.7724538509055159;
float pi = 3.141592653589793;

void main () {
    if (fragTexCoord.x > dx && fragTexCoord.x < 1.0-dx &&
        fragTexCoord.y > dy && fragTexCoord.y < 1.0-dy) {
        float x = fragTexCoord.x;
        float y = fragTexCoord.y;
        float sx = 30.0*dx;
        float sy = 30.0*dy;
        float u = ((x - bx)/(sx*sqrt2));
        float v = ((y - by)/(sy*sqrt2));
        float amp = 5.0;
        float re = 5.0*exp(- u*u - v*v)*cos(2.0*pi*(px*x + py*y));
        float im = 5.0*exp(- u*u - v*v)*sin(2.0*pi*(px*x + py*y));
        gl_FragColor = vec4(re, im, 0.0, 1.0); 
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}`;


const viewFrameFragmentSource = `#define NAME viewFrameFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D texV;
uniform int displayMode;


vec3 complexToColour(float re, float im) {
    float pi = 3.141592653589793;
    float argVal = atan(im, re);
    float maxCol = 1.0;
    float minCol = 50.0/255.0;
    float colRange = maxCol - minCol;
    if (argVal <= pi/3.0 && argVal >= 0.0) {
        return vec3(maxCol, 
                    minCol + colRange*argVal/(pi/3.0), minCol);
    } else if (argVal > pi/3.0 && argVal <= 2.0*pi/3.0){
        return vec3(maxCol - colRange*(argVal - pi/3.0)/(pi/3.0), 
                    maxCol, minCol);
    } else if (argVal > 2.0*pi/3.0 && argVal <= pi){
        return vec3(minCol, maxCol, 
                    minCol + colRange*(argVal - 2.0*pi/3.0)/(pi/3.0));
    } else if (argVal < 0.0 && argVal > -pi/3.0){
        return vec3(maxCol, minCol,
                    minCol - colRange*argVal/(pi/3.0));
    } else if (argVal <= -pi/3.0 && argVal > -2.0*pi/3.0){
        return vec3(maxCol + (colRange*(argVal + pi/3.0)/(pi/3.0)),
                    minCol, maxCol);
    } else if (argVal <= -2.0*pi/3.0 && argVal >= -pi){
        return vec3(minCol,
                    minCol - (colRange*(argVal + 2.0*pi/3.0)/(pi/3.0)), maxCol);
    }
    else {
        return vec3(minCol, maxCol, maxCol);
    }
}

void main () {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    vec4 col3 = texture2D(tex3, fragTexCoord);
    vec4 col4 = texture2D(texV, fragTexCoord)/(50.0*2.0);
    float probDensity = (col1.g*col3.g + col2.r*col2.r);
    float re = col2.r;
    float im = (col3.g + col1.g)/2.0;
    if (displayMode == 0) {
    gl_FragColor = vec4(probDensity*complexToColour(re, im)/4.0 + 
                        vec3(col4.r, col4.r, col4.r),
                        1.0);
    } else {
        gl_FragColor = vec4(probDensity/4.0 + col4.r, 
                            probDensity/4.0 + col4.r, 
                            probDensity/4.0 + col4.r, 1.0);
    }
}`;


const vertexShaderSource = `#define NAME vertexShaderSource
attribute vec3 pos;
varying highp vec2 fragTexCoord;

void main() {
    gl_Position = vec4(pos.xyz, 1.0);
    fragTexCoord = vec2(0.5, 0.5) + pos.xy/2.0;
}`;


const imagTimeStepFragmentSource = `#define NAME imagTimeStepFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform float dx;
uniform float dy;
uniform float dt;
uniform float w;
uniform float h;
uniform float m;
uniform float hbar;
uniform sampler2D texPsi;
uniform sampler2D texV;


void main () {
    float V = texture2D(texV, fragTexCoord).r;
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).r;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).r;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).r;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).r;
    // float div2RePsi = (u + d - 2.0*rePsi)/(dy*dy) + (l + r - 2.0*rePsi)/(dx*dx);
    float div2RePsi = (u + d + l + r - 4.0*rePsi)/(dx*dx);
    float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + V*rePsi;
    gl_FragColor = vec4(rePsi, imPsi - hamiltonRePsi*dt/hbar, 0.0, 1.0);
}`;



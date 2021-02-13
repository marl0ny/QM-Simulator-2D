const copyOverFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;
uniform sampler2D tex2;

void main () {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    fragColor = vec4(col1.rgb + col2.rgb, 1.0); 
}
`;


const reshapePotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;
uniform float bx;
uniform float by;
uniform float v2;


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    if ((xy.x - bx)*(xy.x - bx) < 0.0001 && (xy.y - by)*(xy.y - by) < 0.0001
         && initialV < v2) {
        fragColor = vec4(v2, initialV, 0.0, 1.0);
    } else {
        fragColor = vec4(initialV, initialV, 0.0, 1.0);
    }
}
`;


const probDensityFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;


void main() {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    vec4 col3 = texture2D(tex3, fragTexCoord);
    float probDensity = col2.r*col2.r + col1.g*col3.g;
    fragColor = vec4(probDensity, 0.0, 0.0, 1.0);
}`;


const initialPotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
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
        fragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0, 0.0, 1.0); 
    } else if (potentialType == 2) {
        if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             (x >= x1 + spacing/2.0 &&
              x <= x2 - spacing/2.0
             ) || x >= x2 + spacing/2.0
            )) {
            fragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 3) {
         if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             x >= x1 + spacing/2.0)) {
            fragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 4) {
        float u = 10.0*(x - 0.5);        
        float v = 10.0*(y - 0.5);
        float oneOverR = 1.0/sqrt(u*u + v*v);
        float val = (oneOverR < 50.0)? oneOverR: 50.0;
        fragColor = vec4(val, 0.0, 0.0, 1.0); 
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}`;


const realTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
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
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).g;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).g;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).g;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).g;
    // float div2ImPsi = (u + d - 2.0*imPsi)/(dy*dy) + (l + r - 2.0*imPsi)/(dx*dx);
    float div2ImPsi = (u + d + l + r - 4.0*imPsi)/(dx*dx);
    float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + V*imPsi;
    fragColor = vec4(rePsi + hamiltonImPsi*dt/hbar, imPsi, 0.0, 1.0);
}`;


const initialWaveFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;
uniform float dy;
uniform float bx;
uniform float by;
uniform float px;
uniform float py;
uniform float sx;
uniform float sy;
uniform float amp;
float sqrt2 = 1.4142135623730951; 
float sqrtpi = 1.7724538509055159;
float pi = 3.141592653589793;

void main () {
    if (fragTexCoord.x > dx && fragTexCoord.x < 1.0-dx &&
        fragTexCoord.y > dy && fragTexCoord.y < 1.0-dy) {
        float x = fragTexCoord.x;
        float y = fragTexCoord.y;
        float u = ((x - bx)/(sx*sqrt2));
        float v = ((y - by)/(sy*sqrt2));
        float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(px*x + py*y));
        float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(px*x + py*y));
        fragColor = vec4(re, im, 0.0, 1.0); 
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}`;


const viewFrameFragmentSource = `#define NAME viewFrameFragmentSource
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float x0;
uniform float y0;
uniform float w;
uniform float h;
uniform float lineWidth;
uniform float brightness;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D texV;
uniform sampler2D textTex;
uniform int displayMode;


vec4 drawWindow(vec4 pix, float x, float y,
                float x0, float y0, float w, float h,
                float lineWidth) {
    y0 = (h < 0.0)? y0 + h: y0;
    h = (h < 0.0)? -h: h;
    x0 = (w < 0.0)? x0 + w: x0;
    w = (w < 0.0)? -w: w;
    if ((x >= x0 && x <= (x0 + w)) &&
        (
            (abs(y - y0) <= lineWidth/2.0) ||
            (abs(y - y0 - h) <= lineWidth/2.0)
        )
    ) {
        return vec4(1.0, 1.0, 1.0, 1.0);
    }
    if ((y > y0 && y < (y0 + h)) &&
        (
            (abs(x - x0) <= lineWidth/2.0) ||
            (abs(x - x0 - w) <= lineWidth/2.0)
        )
    ) {
        return vec4(1.0, 1.0, 1.0, 1.0);
    }
    return pix;
}


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
    vec4 col4 = texture2D(texV, fragTexCoord)/(50.0*1.0);
    float probDensity = (col1.g*col3.g + col2.r*col2.r);
    float re = col2.r;
    float im = (col3.g + col1.g)/2.0;
    vec4 pix;
    if (displayMode == 0) {
        pix = vec4(probDensity*complexToColour(re, im)*(brightness/16.0) + 
                   vec3(col4.r, col4.r, col4.r),
                   1.0);
    } else {
        pix = vec4(probDensity*(brightness/16.0) + col4.r, 
                   probDensity*(brightness/16.0) + col4.r, 
                   probDensity*(brightness/16.0) + col4.r, 1.0);
    }
    fragColor = drawWindow(pix, fragTexCoord.x, fragTexCoord.y,
                              x0, y0, w, h, lineWidth) + texture2D(textTex, fragTexCoord);
}`;


const vertexShaderSource = `#if __VERSION__ == 300
in vec3 pos;
out highp vec2 fragTexCoord;
#else
attribute vec3 pos;
varying highp vec2 fragTexCoord;
#endif

void main() {
    gl_Position = vec4(pos.xyz, 1.0);
    fragTexCoord = vec2(0.5, 0.5) + pos.xy/2.0;
}`;


const imagTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
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
    float V = texture2D(texV, fragTexCoord).r;
    /*float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;*/
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).r;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).r;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).r;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).r;
    // float div2RePsi = (u + d - 2.0*rePsi)/(dy*dy) + (l + r - 2.0*rePsi)/(dx*dx);
    float div2RePsi = (u + d + l + r - 4.0*rePsi)/(dx*dx);
    float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + V*rePsi;
    fragColor = vec4(rePsi, imPsi - hamiltonRePsi*dt/hbar, 0.0, 1.0);
}`;



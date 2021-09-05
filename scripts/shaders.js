const initialUpperSpinorFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float bx;
uniform float by;
uniform float kx;
uniform float ky;
uniform float sx;
uniform float sy;
uniform float amp;
uniform float m;
uniform float c;
uniform float w;
uniform float h;
uniform float pixelW;
uniform float pixelH;
uniform float t;
uniform float hbar;
float sqrt2 = 1.4142135623730951; 
float pi = 3.141592653589793;

void main () {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    float u = ((x - bx)/(sx*sqrt2));
    float v = ((y - by)/(sy*sqrt2));
    float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));
    float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));
    if ((kx == 0.0 && ky == 0.0) || m == 0.0) {
        fragColor = vec4(re, im, 0.0, 0.0);
    } else {
        float mc = m*c;
        float px = 2.0*pi*kx/w;
        float py = 2.0*pi*ky/h;
        float p2 = px*px + py*py;
        float p = sqrt(p2);
        float omega = sqrt(mc*mc + p2);
        float energy = omega*c;
        float den = p*sqrt((mc + omega)*(mc + omega) + p2);
        // The free particle positive energy normalized eigenstates are found
        // by diagonalizing the alpha_i p_i + beta m c matrix.
        // This can be done symbolically using a coputer algebra system
        // like Sympy.
        // More info found here: https://en.wikipedia.org/wiki/Dirac_spinor.
        float reS1 = px*(mc + omega)/den;
        float imS1 = -py*(mc + omega)/den;
        float reExpEnergy = cos(t*energy/hbar);
        float imExpEnergy = sin(t*energy/hbar);
        float re2 = re*reExpEnergy - im*imExpEnergy;
        float im2 = re*imExpEnergy + im*reExpEnergy;
        fragColor = vec4(reS1*re2 - imS1*im2, reS1*im2 + imS1*re2, 0.0, 0.0);
    }
}
`;


const onesFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif


void main () {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0); 
}
`;


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


const initialBottomSpinorFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float bx;
uniform float by;
uniform float kx;
uniform float ky;
uniform float sx;
uniform float sy;
uniform float amp;
uniform float m;
uniform float c;
uniform float w;
uniform float h;
uniform float pixelW;
uniform float pixelH;
uniform float t;
uniform float hbar;
float sqrt2 = 1.4142135623730951; 
float pi = 3.141592653589793;

void main () {
    float x = fragTexCoord.x - 0.5/pixelW;
    float y = fragTexCoord.y - 0.5/pixelH;
    float u = ((x - bx)/(sx*sqrt2));
    float v = ((y - by)/(sy*sqrt2));
    float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));
    float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));
    if ((kx == 0.0 && ky == 0.0) || m == 0.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        float mc = m*c;
        float px = 2.0*pi*kx/w;
        float py = 2.0*pi*ky/h;
        float p2 = px*px + py*py;
        float p = sqrt(p2);
        float omega = sqrt(mc*mc + p2);
        float energy = omega*c;
        float reExpEnergy = cos(t*energy/hbar);
        float imExpEnergy = sin(t*energy/hbar);
        float den = sqrt((mc + omega)*(mc + omega) + p2);
        // The free particle positive energy normalized eigenstates are found
        // by diagonalizing the alpha_i p_i + beta m c matrix.
        // This can be done symbolically using a coputer algebra system
        // like Sympy.
        // More info found here: https://en.wikipedia.org/wiki/Dirac_spinor.
        fragColor = vec4(0.0, 0.0, (re*reExpEnergy - im*imExpEnergy)*p/den,
                                   (re*imExpEnergy + im*reExpEnergy)*p/den); 
    }
}
`;


const diracProbDensityFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float pixelW;
uniform float pixelH;
uniform sampler2D uTex;
uniform sampler2D vTex1;
uniform sampler2D vTex2;


void main() {
    vec4 u = texture2D(uTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
    vec4 v1 = texture2D(vTex1, fragTexCoord + offset);
    vec4 v2 = texture2D(vTex2, fragTexCoord + offset);
    vec4 v = (v1 + v2)/2.0;
    vec4 probs = vec4(u[0]*u[0] + u[1]*u[1], u[2]*u[2] + u[3]*u[3],
                      v[0]*v[0] + v[1]*v[1], v[2]*v[2] + v[3]*v[3]);
    fragColor = probs;
}`;


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
uniform int drawMode;
uniform int eraseMode;
uniform float drawWidth;
uniform float bx;
uniform float by;
uniform float v2;

#define DRAW_SQUARE 0
#define DRAW_CIRCLE 1
#define DRAW_GAUSS 2


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    // float imagV = texture2D(tex1, fragTexCoord).b;
    float imagV = 0.0;
    float drawW2 = drawWidth*drawWidth;
    float r2 = (xy.x - bx)*(xy.x - bx) 
                + (xy.y - by)*(xy.y - by);
    if (initialV < v2 || eraseMode == 1) {
        if ((drawMode == DRAW_SQUARE && 
            (xy.x - bx)*(xy.x - bx) < drawW2 && 
            (xy.y - by)*(xy.y - by) < drawW2) ||
            (drawMode == DRAW_CIRCLE && r2 < drawW2)) {
            fragColor = vec4(v2, initialV, 0.0, 1.0);
        } else if (drawMode == DRAW_GAUSS) {
            float tmp = exp(-0.5*r2/(2.0*drawW2));
            if (eraseMode == 0) {
                fragColor = vec4(max(tmp + initialV, initialV), 
                                     initialV, imagV, 1.0);
            } else {
                fragColor = vec4(max(initialV - tmp, 0.0), 
                                     initialV, imagV, 1.0);
            }
        } else {
            fragColor = vec4(initialV, initialV, imagV, 1.0);
        }
    } else {
        fragColor = vec4(initialV, initialV, imagV, 1.0);
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


const diracViewFragmentSource = `#define NAME viewFrameFragmentSource
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float constPhase;
uniform float psiBrightness;
uniform float potBrightness;
uniform float pixelW;
uniform float pixelH;
uniform float showPsi1;
uniform float showPsi2;
uniform float showPsi3;
uniform float showPsi4;
uniform sampler2D vTex1;
uniform sampler2D vTex2;
uniform sampler2D uTex;
uniform sampler2D potTex;
uniform sampler2D guiTex;
uniform sampler2D vecTex;
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
    vec4 gui = texture2D(guiTex, fragTexCoord);
    vec4 vec = texture2D(vecTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
    vec4 u = texture2D(uTex, fragTexCoord);
    vec4 v1 = texture2D(vTex1, fragTexCoord + offset);
    vec4 v2 = texture2D(vTex2, fragTexCoord + offset);
    vec4 v = (v1 + v2)/2.0;
    vec4 probs = vec4(showPsi1*(u[0]*u[0] + u[1]*u[1]),
                      showPsi2*(u[2]*u[2] + u[3]*u[3]),
                      showPsi3*(v[0]*v[0] + v[1]*v[1]), 
                      showPsi4*(v[2]*v[2] + v[3]*v[3]));
    vec3 pot = texture2D(potTex, fragTexCoord).rrr;
    vec3 col;
    vec4 notPhaseProb;
    vec4 phaseProb;
    vec3 ones = vec3(1.0, 1.0, 1.0);
    if (displayMode == 0) {
        col = complexToColour(u[0]*cos(constPhase) - u[1]*sin(constPhase),
                               u[0]*sin(constPhase) + u[1]*cos(constPhase));
        notPhaseProb = vec4((probs[1] + probs[2] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[0]*col, 1.0);
    } else if (displayMode == 1) {
        col = complexToColour(u[2]*cos(constPhase) - u[3]*sin(constPhase), 
                               u[2]*sin(constPhase) + u[3]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[2] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[1]*col, 1.0);
    } else if (displayMode == 2) {
        col = complexToColour(v[0]*cos(constPhase) - v[1]*sin(constPhase), 
                               v[0]*sin(constPhase) + v[1]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[1] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[2]*col, 1.0);
    } else if (displayMode == 3) {
        col = complexToColour(v[2]*cos(constPhase) - v[3]*sin(constPhase), 
                               v[2]*sin(constPhase) + v[3]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[1] + probs[2])*ones, 1.0);
        phaseProb = vec4(probs[3]*col, 1.0);
    } else if (displayMode == 4) {
        float pi = 3.141592653589793;
        float p1 = probs[0] + probs[1];
        float p2 = probs[2] + probs[3];
        float a = p1 + p2;
        col = complexToColour(sqrt(p1)*cos(6.0*pi/5.0)
                                 - sqrt(p2)*sin(6.0*pi/5.0), 
                               sqrt(p1)*sin(6.0*pi/5.0)
                                + sqrt(p2)*cos(6.0*pi/5.0));
        notPhaseProb = vec4(0.0, 0.0, 0.0, 1.0);
        phaseProb = vec4(a*col, 1.0);
    } else {
        notPhaseProb = vec4((probs[0] + probs[1]
                              + probs[2] + probs[3])*ones, 1.0);
        phaseProb = vec4(0.0, 0.0, 0.0, 1.0);
    }
    vec4 pixColor = psiBrightness*(phaseProb + notPhaseProb)
                    + vec4(10.0*potBrightness*pot/1000.0, 1.0);
    fragColor = vec4(pixColor.rgb, 1.0) + gui + vec;
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

#define SHO 1
#define DOUBLE_SLIT 2
#define SINGLE_SLIT 3
#define STEP 4
#define INV_R 5
#define TRIPLE_SLIT 6
#define NEG_INV_R 7


void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    if (potentialType == SHO) {
        fragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0, 0.0, 1.0); 
    } else if (potentialType == DOUBLE_SLIT) {
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
    } else if (potentialType == SINGLE_SLIT) {
         if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             x >= x1 + spacing/2.0)) {
            fragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == STEP) {
        if (y > y0) {
            fragColor = vec4(a, 0.0, 0.0, 1.0);
        } else {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    } else if (potentialType == INV_R) {
        float u = 10.0*(x - 0.5);        
        float v = 10.0*(y - 0.5);
        float oneOverR = 1.0/sqrt(u*u + v*v);
        float val = (oneOverR < 50.0)? oneOverR: 50.0;
        fragColor = vec4(val, 0.0, 0.0, 1.0); 
    } else if (potentialType == TRIPLE_SLIT) {
        float val = 15.0;   
        if ((y <= 0.45 || y >= 0.48) || (x > 0.49 && x < 0.51)
            || (x > 0.43 && x < 0.45) || (x > 0.55 && x < 0.57)) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }
    } else if (potentialType == NEG_INV_R) {
        float u = 2.0*(x - 0.5);        
        float v = 2.0*(y - 0.5);
        float oneOverR = -1.0/sqrt(u*u + v*v);
        float val = (oneOverR < -150.0)? -150.0: oneOverR;
        fragColor = vec4(val + 50.0, 0.0, 0.0, 1.0);
    } else {
        float val = 0.0;
        // val += 30.0*exp(-0.5*y*y/(0.01*0.01));
        // val += 30.0*exp(-0.5*(y-1.0)*(y-1.0)/(0.01*0.01));
        // val += 30.0*exp(-0.5*x*x/(0.01*0.01));
        // val += 30.0*exp(-0.5*(x-1.0)*(x-1.0)/(0.01*0.01));
        fragColor = vec4(0.0, 0.0, -val, 1.0); 
    }
}
`;


const probCurrentFragmentSource = `precision highp float;
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
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;


float realValueAt(sampler2D texPsi, vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.r*tmp.a;
}

float imagValueAt(sampler2D texPsi, vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}

vec2 getDivRePsi(sampler2D texPsi) {
    float u = realValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));
    return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);
}

vec2 getDivImPsi(sampler2D texPsi) {
    float u = imagValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));
    return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);
}

void main() {
    float rePsi = texture2D(tex2, fragTexCoord).r;
    float imPsi = 0.5*(texture2D(tex1, fragTexCoord).g
                        + texture2D(tex3, fragTexCoord).g);
    vec2 divRePsi = getDivRePsi(tex2);
    vec2 divImPsi = (getDivImPsi(tex1) + getDivImPsi(tex3))/2.0;
    // (*psi)*div psi = (rePsi - I*imPsi)*(divRePsi + I*divImPsi)
    // = rePsi*divRePsi + imPsi*divImPsi
    //     + I*(-imPsi*divRePsi + rePsi*divImPsi)
    // I*(hbar/(2m))*(psi*div (*psi) - (*psi)*div psi)
    // = I*(hbar/(2m))*2*Im(-(*psi)*div psi)
    vec2 probCurrent = (hbar/m)*(-imPsi*divRePsi + rePsi*divImPsi);
    fragColor = vec4(probCurrent.x, probCurrent.y, 0.0, 1.0);
}
`;


const bottomSpinorTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float dt;
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform float c;
uniform sampler2D vTex;
uniform sampler2D uTex;
uniform sampler2D potTex;

void main() {

    vec2 xy = fragTexCoord;

    vec4 dUdx = (texture2D(uTex, vec2(xy.x, xy.y-0.5*dy/h))
                 - texture2D(uTex, vec2(xy.x-dx/w, xy.y-0.5*dy/h)))/dx;
    vec4 dUdy = (texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y))
                 - texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y-dy/h)))/dy;
    vec4 uDerivatives = vec4(-dUdx[2] - dUdy[3], dUdy[2] - dUdx[3],
                             -dUdx[0] + dUdy[1], -dUdy[0] - dUdx[1]);
    float b = 0.5*(dt/hbar)*(-m*c*c
                             + c*(texture2D(potTex, 
                                            xy-0.5*vec2(dx/w, dy/h))[0]));
    float den = (1.0 + b*b);
    vec4 u = vec4(dot(vec4(1.0, b,  0.0, 0.0), uDerivatives)/den,
                  dot(vec4(-b, 1.0, 0.0, 0.0), uDerivatives)/den,
                  dot(vec4(0.0, 0.0, 1.0, b ), uDerivatives)/den,
                  dot(vec4(0.0, 0.0, -b, 1.0), uDerivatives)/den);

    vec4 prevV = texture2D(vTex, xy);
    vec4 v = vec4(dot(vec4(1.0 - b*b, 2.0*b,  0.0, 0.0), prevV)/den,
                  dot(vec4(-2.0*b, 1.0 - b*b, 0.0, 0.0), prevV)/den,
                  dot(vec4(0.0, 0.0,  1.0 - b*b, 2.0*b), prevV)/den,
                  dot(vec4(0.0, 0.0, -2.0*b, 1.0 - b*b), prevV)/den);

    fragColor = v + c*dt*u;
}
`;


const upperSpinorTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float dt;
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform float c;
uniform sampler2D vTex;
uniform sampler2D uTex;
uniform sampler2D potTex;

void main() {

    vec2 xy = fragTexCoord;

    vec4 dVdx = (texture2D(vTex, vec2(xy.x+dx/w, xy.y+0.5*dy/h))
                 - texture2D(vTex, vec2(xy.x, xy.y+0.5*dy/h)))/dx;
    vec4 dVdy = (texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y+dy/h))
                 - texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y)))/dy;
    vec4 vDerivatives = vec4(-dVdx[2] - dVdy[3], dVdy[2] - dVdx[3],
                             -dVdx[0] + dVdy[1], -dVdy[0] - dVdx[1]);
    float a = 0.5*(dt/hbar)*(m*c*c + c*texture2D(potTex, xy)[0]);
    float den = (1.0 + a*a);
    vec4 v = vec4(dot(vec4(1.0, a,  0.0, 0.0), vDerivatives)/den,
                  dot(vec4(-a, 1.0, 0.0, 0.0), vDerivatives)/den,
                  dot(vec4(0.0, 0.0, 1.0, a),  vDerivatives)/den,
                  dot(vec4(0.0, 0.0, -a, 1.0), vDerivatives)/den);

    vec4 prevU = texture2D(uTex, xy);
    vec4 u = vec4(dot(vec4(1.0 - a*a, 2.0*a,  0.0, 0.0), prevU)/den,
                  dot(vec4(-2.0*a, 1.0 - a*a, 0.0, 0.0), prevU)/den,
                  dot(vec4(0.0, 0.0,  1.0 - a*a, 2.0*a), prevU)/den,
                  dot(vec4(0.0, 0.0, -2.0*a, 1.0 - a*a), prevU)/den);

    fragColor = u + c*dt*v;
}
`;


const guiRectangleFragmentSource = `precision highp float;
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


void main() {
    vec2 xy = fragTexCoord;
    vec4 col = vec4(0.0, 0.0, 0.0, 0.0);
    fragColor = drawWindow(col, xy.x, xy.y, x0, y0, w, h, lineWidth);
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
uniform int laplacePoints;


float imagValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}


float getDiv2ImPsi(float imPsi) {
    float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));
    // Reference for different Laplacian stencil choices:
    // Wikipedia contributors. (2021, February 17)
    // Discrete Laplacian Operator 
    // 1.5.1 Implementation via operator discretization
    // https://en.wikipedia.org/wiki/Discrete_Laplace_operator
    // #Implementation_via_operator_discretization
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*imPsi)/(dx*dx);
    } else {
        float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);
    }
}

void main () {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;
    float imV = texture2D(texV, fragTexCoord).b;
    vec4 psi = texture2D(texPsi, fragTexCoord);
    float rePsi = psi.r;
    float imPsi = psi.g;
    float alpha = psi.a;
    float div2ImPsi = getDiv2ImPsi(imPsi);
    float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + V*imPsi;
    float f1 = 1.0 - dt*imV/hbar;
    float f2 = 1.0 + dt*imV/hbar;
    fragColor = vec4(rePsi*(f2/f1) + hamiltonImPsi*dt/(f1*hbar), imPsi, 
                     0.0, alpha);
}`;


const imagePotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int invert;
uniform sampler2D tex;


void main() {
    vec2 st = vec2(fragTexCoord.x, 1.0 - fragTexCoord.y);
    vec4 col = texture2D(tex, st);
    float avgCol = (col.r + col.g + col.b)/3.0;
    if (invert == 1) {
        avgCol = 20.0 - avgCol;
    }
    fragColor = vec4(avgCol, avgCol/2.0, 0.0, 1.0);
    // fragColor = vec4(col[0], col[1], col[2], 1.0);
}`;


const diracCurrentFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float pixelW;
uniform float pixelH;
uniform sampler2D uTex;
uniform sampler2D vTex1;
uniform sampler2D vTex2;


vec4 multiplyBySigmaX(vec4 x) {
    return vec4(dot(vec4(0.0, 0.0, 1.0, 0.0), x),
                dot(vec4(0.0, 0.0, 0.0, 1.0), x),
                dot(vec4(1.0, 0.0, 0.0, 0.0), x),
                dot(vec4(0.0, 1.0, 0.0, 0.0), x));
}


vec4 multiplyBySigmaY(vec4 x) {
    return vec4(dot(vec4(0.0, 0.0, 0.0, 1.0), x),
                dot(vec4(0.0, 0.0, -1.0, 0.0), x),
                dot(vec4(0.0, -1.0, 0.0, 0.0), x),
                dot(vec4(1.0, 0.0, 0.0, 0.0), x));
}


vec4 multiplyBySigmaZ(vec4 x) {
    return vec4(dot(vec4(1.0, 0.0, 0.0, 0.0), x),
                dot(vec4(0.0, 1.0, 0.0, 0.0), x),
                dot(vec4(0.0, 0.0, -1.0, 0.0), x),
                dot(vec4(0.0, 0.0, 0.0, -1.0), x));
}


void main() {
    vec4 u = texture2D(uTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
    vec4 v1 = texture2D(vTex1, fragTexCoord + offset);
    vec4 v2 = texture2D(vTex2, fragTexCoord + offset);
    vec4 v = (v1 + v2)/2.0;
    vec4 current;
    current[0] = u[0]*u[0] + u[1]*u[1] + u[2]*u[2] + u[3]*u[3]
                  + v[0]*v[0] + v[1]*v[1] + v[2]*v[2] + v[3]*v[3];

    current[1] = dot(u, multiplyBySigmaX(v)) 
                  + dot(v, multiplyBySigmaX(u));
    current[2] = dot(u, multiplyBySigmaY(v)) 
                  + dot(v, multiplyBySigmaY(u));
    current[3] = dot(u, multiplyBySigmaZ(v)) 
                  + dot(v, multiplyBySigmaZ(u));
    fragColor = current;
}
`;


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
uniform float brightness2;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D texV;
uniform sampler2D vecTex;
uniform sampler2D textTex;
uniform int displayMode;
uniform vec3 probColour;
uniform vec3 potColour;

#define DISPLAY_ONLY_PROB_DENSITY 0
#define DISPLAY_PHASE 1
#define DISPLAY_CURRENT_WITH_PROB 2
#define DISPLAY_CURRENT_WITH_PHASE 3


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
    vec3 potential = col4.r*brightness2*potColour;
    if (displayMode == DISPLAY_PHASE) {
        pix = vec4(probDensity*complexToColour(re, im)*(brightness/16.0) +
                   potential,
                   1.0);
    } else if (displayMode == DISPLAY_ONLY_PROB_DENSITY) {
        pix = vec4(probDensity*probColour[0]*(brightness/16.0) + potential.r,
                   probDensity*probColour[1]*(brightness/16.0) + potential.g,
                   probDensity*probColour[2]*(brightness/16.0) + potential.b, 
                   1.0);
    } else if (displayMode == DISPLAY_CURRENT_WITH_PHASE) {
        pix = vec4(probDensity*complexToColour(re, im)*(brightness/16.0) +
                   potential,
                   1.0);
        pix += 10.0*texture2D(vecTex, fragTexCoord);
    } else if (displayMode == DISPLAY_CURRENT_WITH_PROB) {
        pix = vec4(probDensity*probColour[0]*(brightness/16.0) + potential.r,
                   probDensity*probColour[1]*(brightness/16.0) + potential.g,
                   probDensity*probColour[2]*(brightness/16.0) + potential.b,
                   1.0);
        pix += 10.0*texture2D(vecTex, fragTexCoord);
    }
    fragColor = drawWindow(pix, fragTexCoord.x, fragTexCoord.y,
                              x0, y0, w, h, lineWidth) +
                              texture2D(textTex, fragTexCoord);
}
`;


const initialWavepacketFragmentSource = `precision highp float;
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
uniform float borderAlpha;
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
        fragColor = vec4(0.0, 0.0, 0.0, borderAlpha); 
    }
}
`;


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
uniform int laplacePoints;


float realValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.r*tmp.a;
}


float getDiv2RePsi(float rePsi) {
    float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));
    // Reference for different Laplacian stencil choices:
    // Wikipedia contributors. (2021, February 17)
    // Discrete Laplacian Operator 
    // 1.5.1 Implementation via operator discretization
    // https://en.wikipedia.org/wiki/Discrete_Laplace_operator
    // #Implementation_via_operator_discretization
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*rePsi)/(dx*dx);
    } else {
        float ul = realValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = realValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = realValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = realValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);
    }
}

void main () {
    float V = texture2D(texV, fragTexCoord).r;
    float imV = texture2D(texV, fragTexCoord).b;
    vec4 psi = texture2D(texPsi, fragTexCoord);
    float rePsi = psi.r;
    float imPsi = psi.g;
    float alpha = psi.a;
    float div2RePsi = getDiv2RePsi(rePsi);
    float f1 = 1.0 - dt*imV/hbar;
    float f2 = 1.0 + dt*imV/hbar;
    float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + V*rePsi;
    fragColor = vec4(rePsi, imPsi*(f2/f1) - hamiltonRePsi*dt/(f1*hbar),
                     0.0, alpha);
}`;



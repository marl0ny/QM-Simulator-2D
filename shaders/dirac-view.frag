#define NAME viewFrameFragmentSource
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
uniform int wavefuncDisplayMode;
uniform int potentialDisplayMode;
uniform vec3 probColour;
uniform vec3 potColour;

const float pi = 3.141592653589793;

vec3 argumentToColour(float argVal) {
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

vec3 complexToColour(float re, float im) {
    float argVal = atan(im, re);
    return argumentToColour(argVal);
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
    float potVal = texture2D(potTex, fragTexCoord).r;
    vec4 potPix;
    if (potentialDisplayMode == 0) {
        vec3 pot = potVal*potColour;
        potPix = vec4(10.0*potBrightness*pot/1000.0, 1.0);
    } else if (potentialDisplayMode == 1) {
        float val = -3.0*pi*10.0*potBrightness*potVal/1000.0 - 2.0*pi/3.0;
        if (val < -pi) {
            val = 2.0*pi + val;
            if (val < -pi/4.0) {
                val = -pi/4.0;
            }
        }
        vec3 pot = complexToColour(cos(val), sin(val));
        potPix = vec4(pot, 1.0);
    }
    vec3 col;
    vec4 notPhaseProb;
    vec4 phaseProb;
    vec3 ones = vec3(1.0, 1.0, 1.0);
    if (wavefuncDisplayMode == 0) {
        col = complexToColour(u[0]*cos(constPhase) - u[1]*sin(constPhase),
                               u[0]*sin(constPhase) + u[1]*cos(constPhase));
        notPhaseProb = vec4((probs[1] + probs[2] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[0]*col, 1.0);
    } else if (wavefuncDisplayMode == 1) {
        col = complexToColour(u[2]*cos(constPhase) - u[3]*sin(constPhase), 
                               u[2]*sin(constPhase) + u[3]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[2] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[1]*col, 1.0);
    } else if (wavefuncDisplayMode == 2) {
        col = complexToColour(v[0]*cos(constPhase) - v[1]*sin(constPhase), 
                               v[0]*sin(constPhase) + v[1]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[1] + probs[3])*ones, 1.0);
        phaseProb = vec4(probs[2]*col, 1.0);
    } else if (wavefuncDisplayMode == 3) {
        col = complexToColour(v[2]*cos(constPhase) - v[3]*sin(constPhase), 
                               v[2]*sin(constPhase) + v[3]*cos(constPhase));
        notPhaseProb = vec4((probs[0] + probs[1] + probs[2])*ones, 1.0);
        phaseProb = vec4(probs[3]*col, 1.0);
    } else if (wavefuncDisplayMode == 4) {
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
    } else if (wavefuncDisplayMode == 5) {
        notPhaseProb = vec4((probs[0] + probs[1]
                              + probs[2] + probs[3])*probColour, 1.0);
        phaseProb = vec4(0.0, 0.0, 0.0, 1.0);
    } 
    vec4 pixColor;
    if (wavefuncDisplayMode < 6) {
        pixColor = psiBrightness*(phaseProb + notPhaseProb)
                    + potPix;
    } else {
        float val = -pi*psiBrightness*(probs[0] + probs[1]
                          + probs[2] + probs[3])/2.0 - 2.0*pi/3.0;
        if (val < -pi) {
            val = 2.0*pi + val;
            if (val < 0.0) {
                val = 0.0;
            }
        }
        vec3 col = min((probs[0] + probs[1]
                          + probs[2] + probs[3])*(psiBrightness), 1.25)*
                          argumentToColour(val);
        pixColor = vec4(col, 0.0) + potPix;
    }
    fragColor = vec4(pixColor.rgb, 1.0) + gui + vec;
}
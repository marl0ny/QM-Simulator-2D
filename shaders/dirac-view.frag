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
uniform float brightness;
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
uniform int displayMode;

#define DISPLAY_ONLY_PROB_DENSITY 0
#define DISPLAY_PHASE 1

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
    vec4 u = texture2D(uTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
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
    vec4 pixColor = brightness*(phaseProb + notPhaseProb)
                                + vec4(10.0*pot/1000.0, 1.0);
    fragColor = vec4(pixColor.rgb, 1.0);
}
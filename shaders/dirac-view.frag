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
uniform sampler2D wavefuncTex;
uniform sampler2D potTex;
uniform int displayMode;

#define DISPLAY_ONLY_PROB_DENSITY 0
#define DISPLAY_PHASE 1
#define DISPLAY_CURRENT_WITH_PROB 2
#define DISPLAY_CURRENT_WITH_PHASE 3


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
    vec4 wavefunc = texture2D(wavefuncTex, fragTexCoord);
    float a = wavefunc[0]*wavefunc[0] + wavefunc[1]*wavefunc[1]
            + wavefunc[2]*wavefunc[2] + wavefunc[3]*wavefunc[3];
    vec3 pot = texture2D(potTex, fragTexCoord).rrr;
    vec3 col = complexToColour(wavefunc[0]*cos(constPhase)
                               - wavefunc[1]*sin(constPhase), 
                               wavefunc[0]*sin(constPhase)
                               + wavefunc[1]*cos(constPhase));
    fragColor = vec4(a*col + 10.0*pot/1000.0, 1.0);
}
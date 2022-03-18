precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform sampler2D uTex;
uniform sampler2D vTex;
uniform sampler2D potTex;
uniform int useVecPot;
uniform sampler2D vecPotTex;
uniform float dt;
uniform float m;
uniform float c;
uniform float hbar;

uniform int topOrBottom;
const int TOP = 0;
const int BOTTOM = 1;

#define complex vec2


complex mult(complex z1, complex z2) {
    return complex(z1.x*z2.x - z1.y*z2.y, 
                   z1.x*z2.y + z1.y*z2.x);
}

complex conj(complex z) {
    return vec2(z.x, -z.y);
}

void main() {
    vec4 potential = texture2D(potTex, fragTexCoord);
    float reV = potential[0];
    float imV = potential[2];
    float imArg = -0.5*c*reV*dt/hbar;
    float reArg = 0.5*c*imV*dt/hbar;
    fragColor = vec4(exp(reArg)*cos(imArg), exp(reArg)*sin(imArg), 
                     exp(reArg)*cos(imArg), exp(reArg)*sin(imArg));
    // TODO!
    /* if (useVecPot) {
        vec4 vecPot = sampler2D(vecPotTex, fragTexCoord);
        float vecPot2 = vecPot.x*vecPot.x + vecPot.y*vecPot.y + vecPot.z*vecPot.z;
        float expVec00 = cosh(0.25*powf(-vecPot2*dt*hbar*dt*hbar, 0.5));
        float expVec01 = 0.0;
        float expVec02 = 0.0;
        float expVec03 = 0.0;
        float expVec10 = 0.0;
        float expVec12 = 0.0;
        float expVec13 = 0.0;
        float expVec20 = 0.0;
        float expVec21 = 0.0;
        float expVec22 = 0.0;
        float expVec23 = 0.0;
        float expVec30 = 0.0;
        float expVec31 = 0.0;
        float expVec32 = 0.0;
        float expVec33 = cosh(0.25*powf(-vecPot2*dt*dt*hbar*hbar, 0.5));
    }*/
}

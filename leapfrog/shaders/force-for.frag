#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#define texture2D texture
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform sampler2D massTex;
uniform sampler2D posVelTex;
uniform float G;
uniform float nParticles;

const float EPS = 0.0001;


void main() {
    float index1 = UV[1];
    vec2 r1 = texture2D(posVelTex, vec2(0.5, index1)).xy;
    float m1 = texture2D(massTex, vec2(0.5, index1))[0];
    vec4 force = vec4(0.0, 0.0, 0.0, 0.0);
    for (float i = 0.5; i < nParticles; i++) {
        float index2 = i/nParticles;
        vec2 r2 = texture2D(posVelTex, vec2(0.5, index2)).xy;
        float m2 = texture2D(massTex, vec2(0.5, index2))[0];
        vec2 r12 = r2 - r1;
        float den = pow(length(r12), 1.5);
        vec2 num = 0.5*G*m1*m2*r12;
        if (index1 != index2) {
            force += vec4(vec2(0.0, 0.0), num/(den + EPS));
        }
    }
    fragColor = force;
}
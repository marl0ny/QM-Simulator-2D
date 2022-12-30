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

const float EPS = 0.0001;

void main() {
    float u = UV[0], v = UV[1];
    float mU = texture2D(massTex, vec2(0.5, u))[0];
    float mV = texture2D(massTex, vec2(0.5, v))[0];
    vec2 rU = texture2D(posVelTex, vec2(0.5, u)).xy;
    vec2 rV = texture2D(posVelTex, vec2(0.5, v)).xy;
    vec2 rUV = rV - rU;
    float den = pow(length(rUV), 1.5);
    vec2 num = -0.5*G*mU*mV*rUV;
    if (u != v) {
        fragColor = vec4(vec2(0.0, 0.0), num/(den + EPS));
    } else {
        fragColor = vec4(vec2(0.0, 0.0), vec2(0.0, 0.0));
    }
}


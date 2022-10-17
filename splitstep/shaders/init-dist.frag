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

#define complex vec2
#define complex2 vec4

uniform float amplitude;
uniform float sigma_x;
uniform float sigma_y;
uniform float u0;
uniform float v0;
uniform float nx;
uniform float ny;
uniform complex2 spin;


const float TAU = 6.283185307179586;

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

void main() {
    float u = UV[0] - u0;
    float v = UV[1] - v0;
    float sx = sigma_x;
    float sy = sigma_y;
    float absVal = amplitude*exp(-u*u/(2.0*sx*sx))*exp(-v*v/(2.0*sy*sy));
    float angle = TAU*(nx*UV[0] + ny*UV[1]);
    complex psi = absVal*complex(cos(angle), sin(angle));
    fragColor = multiply(spin, complex2(psi, psi));
}
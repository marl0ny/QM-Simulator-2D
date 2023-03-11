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

#define PI 3.141592653589793

uniform float amplitude;
uniform float sigma;
uniform vec2 r0;
uniform ivec2 wavenumber;

void main() {
    float u = UV[0] - r0[0];
    float v = UV[1] - r0[1];
    float amp = amplitude*exp(-0.5*(u*u + v*v)/(sigma*sigma));
    float nx = float(wavenumber[0]);
    float ny = float(wavenumber[1]);
    complex phase = complex(cos(2.0*PI*(nx*u + ny*v)),
                            sin(2.0*PI*(nx*u + ny*v)));
    complex psi = amp*phase;
    float potential = 1.0*((UV[0] - 0.5)*(UV[0] - 0.5)
                                  + (UV[1] - 0.5)*(UV[1] - 0.5));
    // float potential = 0.0;
    fragColor = vec4(psi, vec2(potential, 0.0));
}

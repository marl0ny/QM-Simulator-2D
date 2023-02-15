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

#define complex2 vec4

uniform vec4 scale1;
uniform vec4 scale2;
uniform sampler2D tex1;
uniform sampler2D tex2;

// H psi_1 = -hbar^2/(2.0 * m) psi_1 + V psi_1
// psi_2 = -dt*(i / hbar) H psi_1 + psi_0

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}


void main() {
    fragColor = multiply(scale1, texture2D(tex1, UV))
                 + multiply(scale2, texture2D(tex2, UV));
}
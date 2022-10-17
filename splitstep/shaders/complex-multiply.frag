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

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform complex2 a;

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

void main() {
    complex2 z = texture2D(tex1, UV);
    complex2 w = texture2D(tex2, UV);
    fragColor = multiply(a, multiply(z, w));
}
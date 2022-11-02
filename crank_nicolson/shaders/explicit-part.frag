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

uniform complex2 dt;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform float m;
uniform float hbar;

uniform sampler2D wavefuncTex;
uniform sampler2D potentialTex;

const complex2 IMAG_UNIT = complex2(0.0, 1.0, 0.0, 1.0);
const complex2 ONE = complex2(1.0, 0.0, 1.0, 0.0);


complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 laplacian2ndOrder4Point(sampler2D wavefuncTex) {
    complex2 u = texture(wavefuncTex, UV + vec2(0.0, dy/height));
    complex2 d = texture(wavefuncTex, UV - vec2(0.0, dy/height));
    complex2 l = texture(wavefuncTex, UV - vec2(dx/width, 0.0));
    complex2 r = texture(wavefuncTex, UV + vec2(dx/width, 0.0));
    complex2 c = texture(wavefuncTex, UV);
    return (u + d - 2.0*c)/(dy*dy) + (l + r - 2.0*c)/(dx*dx);
}

complex2 laplacian4thOrder9Point(sampler2D wavefuncTex) {
    complex2 u2 = texture(wavefuncTex, UV + 2.0*vec2(0.0, dy/height));
    complex2 u1 = texture(wavefuncTex, UV +     vec2(0.0, dy/height));
    complex2 d1 = texture(wavefuncTex, UV -     vec2(0.0, dy/height));
    complex2 d2 = texture(wavefuncTex, UV - 2.0*vec2(0.0, dy/height));
    complex2 L2 = texture(wavefuncTex, UV - 2.0*vec2(dx/width, 0.0));
    complex2 L1 = texture(wavefuncTex, UV -     vec2(dx/width, 0.0));
    complex2 r1 = texture(wavefuncTex, UV +     vec2(dx/width, 0.0));
    complex2 r2 = texture(wavefuncTex, UV + 2.0*vec2(dx/width, 0.0));
    complex2 c0 = texture(wavefuncTex, UV);
    float dy2 = dy*dy, dx2 = dx*dx;
    return (-u2/12.0 + 4.0*u1/3.0 - 5.0*c0/2.0 + 4.0*d1/3.0 - d2/12.0)/dy2
            + (-L2/12.0 + 4.0*L1/3.0 - 5.0*c0/2.0 + 4.0*r1/3.0 - r2/12.0)/dx2;
}

void main() {
    complex2 psi = texture2D(wavefuncTex, UV);
    vec4 potential = texture2D(potentialTex, UV);
    complex2 hPsi = -hbar*hbar*laplacian4thOrder9Point(wavefuncTex)/(2.0*m)
                     + potential.w*psi;
    fragColor = psi - multiply(multiply(IMAG_UNIT, dt), hPsi)/(2.0*hbar);
}
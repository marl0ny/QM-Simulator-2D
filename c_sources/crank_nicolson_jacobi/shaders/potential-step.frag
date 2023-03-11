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

uniform complex dt;
uniform sampler2D psiVTex;
uniform float nonlinearTermScale;

const complex IMAG_UNIT = complex(0.0, 1.0);

complex mul(complex a, complex b) {
    return complex(a.x*b.x - a.y*b.y,
		               a.x*b.y + a.y*b.x);
}

complex conj(complex z) {
    return complex(z.x, -z.y);
}

complex cexp(complex z) {
    return complex(exp(z.x)*cos(z.y), exp(z.x)*sin(z.y));
}

void main() {
    vec4 psiV = texture2D(psiVTex, UV);
    complex psi = psiV.xy;
    complex potential = psiV.zw
                         + complex(nonlinearTermScale*(psi.x*psi.x + psi.y*psi.y), 0.0);
    complex arg = mul(mul(-IMAG_UNIT, dt), potential);
    fragColor = vec4(mul(cexp(arg), psi), potential);
}


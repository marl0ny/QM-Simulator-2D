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
uniform float m;
uniform float hbar;
// uniform float q;
// uniform float c;

uniform sampler2D wavefuncTex;
uniform sampler2D potentialTex;


complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 conj(complex2 z) {
    return complex2(z[0], -z[1], z[2], -z[3]);
}

complex2 complex2Exp(complex2 z) {
    return complex2(exp(z[0])*cos(z[1]), exp(z[0])*sin(z[1]),
                    exp(z[2])*cos(z[3]), exp(z[2])*sin(z[3]));
}

complex2 IMAG_UNIT = complex2(0.0, 1.0, 0.0, 1.0);

void main() {
    float potential = texture2D(potentialTex, UV).w;
    // float nonlinearAmp = 8.0;
    // float nonlinearAmp = 16.0;
    float nonlinearAmp = 20.0;
    // float nonlinearAmp = 32.0;
    complex2 psi = texture2D(wavefuncTex, UV);
    complex2 iDt = multiply(IMAG_UNIT, dt);
    complex2 u = complex2(multiply(conj(psi), psi)[0], 0.0,
                          multiply(conj(psi), psi)[2], 0.0);
    complex2 nonlinearTerm = complex2(0.0, 0.0, 0.0, 0.0);
    nonlinearTerm += nonlinearAmp*u;
    // nonlinearTerm += 0.5/(u + 0.25);
    fragColor = multiply(psi, 
                         complex2Exp(-(0.5*iDt/hbar)*potential
				     -multiply(0.5*iDt/hbar, nonlinearTerm)));				      
}

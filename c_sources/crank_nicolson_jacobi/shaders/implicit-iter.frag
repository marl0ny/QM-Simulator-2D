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

uniform float alpha;
uniform complex dt;
uniform float dx, dy;
uniform float w, h;
uniform sampler2D psiVPrevTex;
uniform sampler2D psiVSolTex;
uniform int potentialType;
uniform int orderOfAccuracy;

const complex IMAG_UNIT = complex(0.0, 1.0);

complex mul(complex a, complex b) {
    return complex(a.x*b.x - a.y*b.y,
                   a.x*b.y + a.y*b.x);
}

complex conj(complex z) {
    return complex(z.x, -z.y);
}

complex frac(complex num, complex den) {
    complex invDen = conj(den)/(den.x*den.x + den.y*den.y);
    return mul(num, invDen);
}

complex diagonalTermsH(sampler2D tex) {
    if (orderOfAccuracy == 4) {
        return complex(-alpha*(-5.0/(2.0*dx*dx) - 5.0/(2.0*dy*dy)), 0.0);
               // + potential;
    } else {
        return complex(-alpha*(-2.0/(dx*dx) - 2.0/(dy*dy)), 0.0);
        // + potential;
    }
}

complex offDiagonalTermsHPsi(sampler2D tex) {
    complex psiL1 = texture2D(tex, UV - vec2(dx/w, 0.0)).xy;
    complex psiR1 = texture2D(tex, UV + vec2(dx/w, 0.0)).xy;
    complex psiD1 = texture2D(tex, UV - vec2(0.0, dy/h)).xy;
    complex psiU1 = texture2D(tex, UV + vec2(0.0, dy/h)).xy;
    complex xPart = complex(0.0, 0.0), yPart = complex(0.0, 0.0);
    if (orderOfAccuracy == 4) {
        complex psiL2 = texture2D(tex, UV - 2.0*vec2(dx/w, 0.0)).xy;
        complex psiR2 = texture2D(tex, UV + 2.0*vec2(dx/w, 0.0)).xy;
        complex psiD2 = texture2D(tex, UV - 2.0*vec2(0.0, dy/h)).xy;
        complex psiU2 = texture2D(tex, UV + 2.0*vec2(0.0, dy/h)).xy;
        xPart = -alpha*(-(psiR2 + psiL2)/12.0
                        + 4.0*(psiR1 + psiL1)/3.0)/(dx*dx);
        yPart = -alpha*(-(psiU2 + psiD2)/12.0
                        + 4.0*(psiU1 + psiD1)/3.0)/(dy*dy);
    } else {
        xPart = -alpha*(psiR1 + psiL1)/(dx*dx);
        yPart = -alpha*(psiU1 + psiD1)/(dy*dy);
    }
    return xPart + yPart;
}


void main() {
    complex psiSol = texture2D(psiVSolTex, UV).xy;
    complex offDiagHPsiPrev = offDiagonalTermsHPsi(psiVPrevTex);
    complex num = psiSol - mul(0.5*mul(dt, IMAG_UNIT), offDiagHPsiPrev);
    complex den = complex(1.0, 0.0)
                   + mul(0.5*mul(dt, IMAG_UNIT), diagonalTermsH(psiVPrevTex));
    fragColor = vec4(frac(num, den), texture2D(psiVPrevTex, UV).zw);
}   

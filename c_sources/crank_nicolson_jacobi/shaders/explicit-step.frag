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
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform complex dt;
uniform sampler2D psiVTex0;
uniform sampler2D psiVTex1;

const complex IMAG_UNIT = complex(0.0, 1.0);

complex mul(complex a, complex b) {
    return complex(a.x*b.x - a.y*b.y,
		               a.x*b.y + a.y*b.x);
}

complex psiLaplacian2ndOrder5Point(sampler2D tex) {
    complex psiC = texture2D(tex, UV).xy;
    complex psiL = texture2D(tex, UV - vec2(dx/w, 0.0)).xy;
    complex psiR = texture2D(tex, UV + vec2(dx/w, 0.0)).xy;
    complex psiD = texture2D(tex, UV - vec2(0.0, dy/h)).xy;
    complex psiU = texture2D(tex, UV + vec2(0.0, dy/h)).xy;

    complex xLaplacianPsi = (psiR + psiL - 2.0*psiC)/(dx*dx);
    complex yLaplacianPsi = (psiU + psiD - 2.0*psiC)/(dy*dy);
    return xLaplacianPsi + yLaplacianPsi;
}

complex psiLaplacian4thOrder9Point(sampler2D tex) {
    complex psiC0 = texture2D(tex, UV).xy;
    complex psiL2 = texture2D(tex, UV - 2.0*vec2(dx/w, 0.0)).xy;
    complex psiL1 = texture2D(tex, UV - vec2(dx/w, 0.0)).xy;
    complex psiR1 = texture2D(tex, UV + vec2(dx/w, 0.0)).xy;
    complex psiR2 = texture2D(tex, UV + 2.0*vec2(dx/w, 0.0)).xy;
    complex psiD2 = texture2D(tex, UV - 2.0*vec2(0.0, dy/h)).xy;
    complex psiD1 = texture2D(tex, UV - vec2(0.0, dy/h)).xy;
    complex psiU1 = texture2D(tex, UV + vec2(0.0, dy/h)).xy;
    complex psiU2 = texture2D(tex, UV + 2.0*vec2(0.0, dy/h)).xy;
    complex xLaplacianPsi = (-(psiR2 + psiL2)/12.0
                             + 4.0*(psiR1 + psiL1)/3.0
                             - 5.0*psiC0/2.0)/(dx*dx);
    complex yLaplacianPsi = (-(psiU2 + psiD2)/12.0
                             + 4.0*(psiU1 + psiD1)/3.0
                             - 5.0*psiC0/2.0)/(dy*dy);
    return xLaplacianPsi + yLaplacianPsi;
}


void main() {
    vec4 psiV = texture2D(psiVTex1, UV);
    complex psi = psiV.xy;
    // complex potential = psiV.ba;
    complex hPsi = -alpha*psiLaplacian4thOrder9Point(psiVTex1);
		                // + mul(potential, psi);
    fragColor = texture2D(psiVTex0, UV)
                + vec4(mul(-0.5*mul(dt, IMAG_UNIT), hPsi), 0.0, 0.0);
}

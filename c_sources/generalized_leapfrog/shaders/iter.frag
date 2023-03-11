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

uniform float hbar;
uniform float m;
uniform complex dt;
uniform float dx, dy;
uniform float w, h;
uniform vec2 offsetA;

uniform bool useSubstitution;
uniform int orderOfAccuracy;

uniform sampler2D tex;

/*uniform int potentialType;
#define REAL_SCALAR_POTENTIAL 0
#define COMPLEX_SCALAR_POTENTIAL 1
#define VECTOR_POTENTIAL 2*/

complex mul(complex a, complex b) {
    return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); 
}

complex conj(complex z) {
    return complex(z.r, -z.g);
}

float sampleV(sampler2D tex, vec2 uv) {
    return texture2D(tex, uv).z;
}

vec2 sampleA(sampler2D tex, vec2 uv) {
    return texture2D(tex, uv).zw;
}

complex samplePsi(sampler2D tex, vec2 uv) {
    return texture2D(tex, uv).xy;
}

const complex IMAG_UNIT = complex(0.0, 1.0);

/* 
 The approximation of the vector potential acting with momentum terms
 are handled with Peierls substitution. This means that when constructing
 the finite difference equation, the off-diagonal terms are multiplied
 by a normalized complex phase factor whose argument is the (discretized)
 spatial integral of the vector potential, where the integral starts with the 
 location represented by the diagonal term, and ends with 
 the off-diagonal term.

References:

 - Feynman R., Leighton R., Sands M. (2011).
   The Schrödinger Equation in a Classical Context:
   A Seminar on Superconductivity.
   In The Feynman Lectures on Physics: 
   The New Millennium Edition, Volume 3, chapter 21.
   Basic Books.
   (https://www.feynmanlectures.caltech.edu/III_21.html)

-  Wikipedia contributors. (2021, April 21). Peierls substitution. 
   In Wikipedia, The Free Encyclopedia. 
   (https://en.wikipedia.org/wiki/Peierls_substitution)

*/
vec2 computePhaseArg(vec2 r0In, vec2 r1In) {
    vec2 r0 = r0In + offsetA;
    vec2 r1 = r1In + offsetA;
    vec2 a0 = sampleA(tex, r0);
    vec2 a1 = sampleA(tex, r1);
    float thetaX = -dx*(a0.x + a1.x)/2.0;
    float thetaY = -dy*(a0.y + a1.y)/2.0;
    return vec2(thetaX, thetaY);
}

float computePhaseArgX(vec2 r0In, vec2 r1In) {
    return computePhaseArg(r0In, r1In).x;
}

float computePhaseArgX(vec2 r0In, vec2 r1In, vec2 r2In) {
    vec2 r0 = r0In + offsetA;
    vec2 r1 = r1In + offsetA;
    vec2 r2 = r2In + offsetA;
    float a0x = sampleA(tex, r0).x;
    float a1x = sampleA(tex, r1).x;
    float a2x = sampleA(tex, r2).x;
    return -dx*(0.5*a0x + a1x + 0.5*a2x);
}

float computePhaseArgY(vec2 r0In, vec2 r1In) {
    return computePhaseArg(r0In, r1In).y;
}

float computePhaseArgY(vec2 r0In, vec2 r1In, vec2 r2In) {
    vec2 r0 = r0In + offsetA;
    vec2 r1 = r1In + offsetA;
    vec2 r2 = r2In + offsetA;
    float a0y = sampleA(tex, r0).y;
    float a1y = sampleA(tex, r1).y;
    float a2y = sampleA(tex, r2).y;
    return -dy*(0.5*a0y + a1y + 0.5*a2y);
}

complex getXTranslationPhase(vec2 x0, vec2 x1) {
    float arg = computePhaseArgX(x0, x1);
    return complex(cos(arg), sin(arg));
}

complex getXTranslationPhase(vec2 x0, vec2 x1, vec2 x2) {
    float arg = computePhaseArgX(x0, x1, x2);
    return complex(cos(arg), sin(arg));
}

complex getYTranslationPhase(vec2 y0, vec2 y1) {
    float arg = computePhaseArgY(y0, y1);
    return complex(cos(arg), sin(arg));
}

complex getYTranslationPhase(vec2 y0, vec2 y1, vec2 y2) {
    float arg = computePhaseArgY(y0, y1, y2);
    return complex(cos(arg), sin(arg));
}

complex xKinetic2ndOrder(sampler2D tex) {
    complex psiC = samplePsi(tex, UV);
    complex psiL = samplePsi(tex, UV - vec2(dx/w, 0.0));
    complex psiR = samplePsi(tex, UV + vec2(dx/w, 0.0));
    complex phaseR = getXTranslationPhase(UV, UV + vec2(dx/w, 0.0));
    complex phaseL = conj(getXTranslationPhase(UV, UV - vec2(dx/w, 0.0)));
    float alpha = hbar*hbar/(2.0*m);
    return -alpha*(mul(psiL, phaseL) - 2.0*psiC + mul(psiR, phaseR))/(dx*dx);
}

complex xKinetic4thOrder(sampler2D tex) {
    complex psiL2 = samplePsi(tex, UV - 2.0*vec2(dx/w, 0.0));
    complex psiL1 = samplePsi(tex, UV - vec2(dx/w, 0.0));
    complex psiC0 = samplePsi(tex, UV);
    complex psiR1 = samplePsi(tex, UV + vec2(dx/w, 0.0));
    complex psiR2 = samplePsi(tex, UV + 2.0*vec2(dx/w, 0.0));
    complex phaseR2 = getXTranslationPhase(UV, 
                                           UV + vec2(dx/w, 0.0),
                                           UV + 2.0*vec2(dx/w, 0.0));
    complex phaseR1 = getXTranslationPhase(UV, UV + vec2(dx/w, 0.0));
    complex phaseL1 = conj(getXTranslationPhase(UV, UV - vec2(dx/w, 0.0)));
    complex phaseL2 = conj(getXTranslationPhase(UV, UV - vec2(dx/w, 0.0),
                                                UV - 2.0*vec2(dx/w, 0.0)));
    float alpha = hbar*hbar/(2.0*m);
    return -alpha*(-(mul(psiL2, phaseL2) + mul(psiR2, phaseR2))/12.0
                   +4.0*(mul(psiL1, phaseL1) + mul(psiR1, phaseR1))/3.0
                   -5.0*psiC0/2.0)/(dx*dx);
}

complex yKinetic2ndOrder(sampler2D tex) {
    complex psiC = samplePsi(tex, UV);
    complex psiD = samplePsi(tex, UV - vec2(0.0, dy/h));
    complex psiU = samplePsi(tex, UV + vec2(0.0, dy/h));
    complex phaseU = getYTranslationPhase(UV, UV + vec2(0.0, dy/h));
    complex phaseD = conj(getYTranslationPhase(UV, UV - vec2(0.0, dy/h)));
    float alpha = hbar*hbar/(2.0*m);
    return -alpha*(mul(psiD, phaseD) - 2.0*psiC + mul(psiU, phaseU))/(dy*dy);
}

complex yKinetic4thOrder(sampler2D tex) {
    complex psiD2 = samplePsi(tex, UV - 2.0*vec2(0.0, dy/h));
    complex psiD1 = samplePsi(tex, UV - vec2(0.0, dy/h));
    complex psiC0 = samplePsi(tex, UV);
    complex psiU1 = samplePsi(tex, UV + vec2(0.0, dy/h));
    complex psiU2 = samplePsi(tex, UV + 2.0*vec2(0.0, dy/h));
    complex phaseU2 = getYTranslationPhase(UV,
                                           UV + vec2(0.0, dy/h),
                                           UV + 2.0*vec2(0.0, dy/h));
    complex phaseU1 = getYTranslationPhase(UV, UV + vec2(0.0, dy/h));
    complex phaseD1 = conj(getYTranslationPhase(UV, UV - vec2(0.0, dy/h)));
    complex phaseD2 = conj(getYTranslationPhase(UV, UV - vec2(0.0, dy/h),
                                                UV - 2.0*vec2(0.0, dy/h)));
    float alpha = hbar*hbar/(2.0*m);
    return -alpha*(-(mul(psiD2, phaseD2) + mul(psiU2, phaseU2))/12.0
                   +4.0*(mul(psiD1, phaseD1) + mul(psiU1, phaseU1))/3.0
                   -5.0*psiC0/2.0)/(dy*dy);
}


complex kinetic2ndOrderNoSubstitution(sampler2D tex) {
    complex psiC0 = samplePsi(tex, UV);
    complex psiL1 = samplePsi(tex, UV - vec2(dx/w, 0.0));
    complex psiR1 = samplePsi(tex, UV + vec2(dx/w, 0.0));
    complex psiD1 = samplePsi(tex, UV - vec2(0.0, dy/h));
    complex psiU1 = samplePsi(tex, UV + vec2(0.0, dy/h));
    complex xLaplacianPsi = (psiL1 + psiR1 - 2.0*psiC0)/(dx*dx);
    complex yLaplacianPsi = (psiU1 + psiD1 - 2.0*psiC0)/(dy*dy);
    complex xGradPsi = (psiR1 - psiL1)/(2.0*dx);
    complex yGradPsi = (psiU1 - psiD1)/(2.0*dy);
    vec2 A = sampleA(tex, UV + offsetA);
    // float divA = getDivA(tex);
    return (-hbar*hbar*(xLaplacianPsi + yLaplacianPsi)
            +mul(2.0*hbar*IMAG_UNIT, A.x*xGradPsi + A.y*yGradPsi)
            +dot(A, A)*psiC0)/(2.0*m);
}


complex kinetic4thOrderNoSubstitution(sampler2D tex) {
    complex psiC0 = samplePsi(tex, UV);
    complex psiL2 = samplePsi(tex, UV - 2.0*vec2(dx/w, 0.0));
    complex psiL1 = samplePsi(tex, UV - vec2(dx/w, 0.0));
    complex psiR1 = samplePsi(tex, UV + vec2(dx/w, 0.0));
    complex psiR2 = samplePsi(tex, UV + 2.0*vec2(dx/w, 0.0));
    complex psiD2 = samplePsi(tex, UV - 2.0*vec2(0.0, dy/h));
    complex psiD1 = samplePsi(tex, UV - vec2(0.0, dy/h));
    complex psiU1 = samplePsi(tex, UV + vec2(0.0, dy/h));
    complex psiU2 = samplePsi(tex, UV + 2.0*vec2(0.0, dy/h));
    complex xLaplacianPsi = (-(psiR2 + psiL2)/12.0
                             + 4.0*(psiR1 + psiL1)/3.0
                             - 5.0*psiC0/2.0)/(dx*dx);
    complex yLaplacianPsi = (-(psiU2 + psiD2)/12.0
                             + 4.0*(psiU1 + psiD1)/3.0
                             - 5.0*psiC0/2.0)/(dy*dy);
    complex xGradPsi = ((psiL2 - psiR2)/12.0 + 2.0*(psiR1 - psiL1)/3.0)/dx;
    complex yGradPsi = ((psiD2 - psiU2)/12.0 + 2.0*(psiU1 - psiD1)/3.0)/dy;
    vec2 A = sampleA(tex, UV + offsetA);
    // float divA = getDivA(tex);
    return (-hbar*hbar*(xLaplacianPsi + yLaplacianPsi)
            +mul(2.0*hbar*IMAG_UNIT, A.x*xGradPsi + A.y*yGradPsi)
            +dot(A, A)*psiC0)/(2.0*m);
}

complex nonlinear(float magnitude, sampler2D tex) {
    complex psi = samplePsi(tex, UV);
    return magnitude*mul(psi, conj(psi))[0]*psi;
}


void main() {
    complex kineticPsi;
    if (orderOfAccuracy == 4) {
        if (useSubstitution)
            kineticPsi = xKinetic4thOrder(tex) + yKinetic4thOrder(tex);
        else
            kineticPsi = kinetic4thOrderNoSubstitution(tex);   
    } else {
        if (useSubstitution)
            kineticPsi = xKinetic2ndOrder(tex) + yKinetic2ndOrder(tex);
        else
            kineticPsi = kinetic2ndOrderNoSubstitution(tex);
    }
    fragColor = vec4(mul((dt/hbar), (kineticPsi + nonlinear(0.0, tex))),
                     sampleA(tex, UV));
}

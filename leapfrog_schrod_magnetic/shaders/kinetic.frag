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

uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform sampler2D tex;

uniform vec2 offsetA;

complex mul(complex a, complex b) {
    return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); 
}

complex conj(complex z) {
    return complex(z.r, -z.g);
}

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
    vec2 a0 = texture2D(tex, r0).xy;
    vec2 a1 = texture2D(tex, r1).xy;
    float thetaX = dx*(a0.x + a1.x);
    float thetaY = dy*(a0.y + a1.y);
    return vec2(thetaX, thetaY);
}

float computePhaseArgX(vec2 r0In, vec2 r1In) {
    return computePhaseArg(r0In, r1In).x;
}

float computePhaseArgY(vec2 r0In, vec2 r1In) {
    return computePhaseArg(r0In, r1In).y;
}

complex getXTranslationPhase(vec2 x0, vec2 x1) {
    float arg = computePhaseArgX(x0, x1);
    return complex(cos(arg), sin(arg));
}

complex getYTranslationPhase(vec2 y0, vec2 y1) {
    float arg = computePhaseArgY(y0, y1);
    return complex(cos(arg), sin(arg));
}

/* vec2 computePhaseArg2ndOrder(vec2 rightIn, vec2 upIn,
                             vec2 leftIn, vec2 downIn) {
    vec2 centre = UV + offsetA;
    vec2 right = rightIn + offsetA;
    vec2 up = upIn + offsetA;
    vec2 left = leftIn + offsetA;
    vec2 down = downIn + offsetA;
    vec2 aLeft = texture2D(tex, left).xy;
    vec2 aRight = texture2D(tex, right).xy;
    vec2 aUp = texture2D(tex, up).xy;
    vec2 aDown = texture2D(tex, down).xy;
    float thetaX = dx*(aRight.x + aLeft.x)/2.0;
    float thetaY = dy*(aUp.y + aDown.y)/2.0;
    return vec2(thetaX, thetaY);
}*/

complex xKinetic2ndOrder(sampler2D tex) {
    complex psiC = texture2D(tex, UV).zw;
    complex psiL = texture2D(tex, UV - vec2(dx/w, 0.0)).zw;
    complex psiR = texture2D(tex, UV + vec2(dx/w, 0.0)).zw;
    complex phaseR = getXTranslationPhase(UV, UV + vec2(dx/w, 0.0));
    complex phaseL = conj(getXTranslationPhase(UV, UV - vec2(dx/w, 0.0)));
    return (mul(psiL, phaseL) - 2.0*psiC + mul(psiR, phaseR))/(dx*dx);
}

/* complex xKinetic4thOrder(sampler2D tex) {
    complex psiL2 = texture2D(tex, UV - 2.0*vec2(dx/w, 0.0)).zw;
    complex psiL1 = texture2D(tex, UV - vec2(dx/w, 0.0)).zw;
    complex psiC0 = texture2D(tex, UV).zw;
    complex psiR1 = texture2D(tex, UV + vec2(dx/w, 0.0)).zw;
    complex psiR2 = texture2D(tex, UV + 2.0*vec2(dx/w, 0.0)).zw;
    complex phaseR2 = phaseAdjust2;
    complex phaseR1 = phaseAdjust1;
    complex phaseL1 = conj(phaseR1);
    complex phaseL2 = conj(phaseR2);
    return (-(mul(psiL2, phaseL2) + mul(psiR2, phaseR2))/12.0
            +4.0*(mul(psiL1, phaseL1) + mul(psiR1, phaseR1))/3.0
            -5.0*psiC0/2.0)/(dx*dx);
}*/

complex yKinetic2ndOrder(sampler2D tex) {
    complex psiC = texture2D(tex, UV).zw;
    complex psiD = texture2D(tex, UV - vec2(0.0, dy/h)).zw;
    complex psiU = texture2D(tex, UV + vec2(0.0, dy/h)).zw;
    complex phaseU = getYTranslationPhase(UV, UV + vec2(0.0, dy/h));
    complex phaseD = conj(getYTranslationPhase(UV, UV - vec2(0.0, dy/h)));
    return (mul(psiD, phaseD) - 2.0*psiC + mul(psiU, phaseU))/(dy*dy);
}

/* complex yKinetic4thOrder(sampler2D tex) {
    complex psiD2 = texture2D(tex, UV - 2.0*vec2(0.0, dy/h)).zw;
    complex psiD1 = texture2D(tex, UV - vec2(0.0, dy/h)).zw;
    complex psiC0 = texture2D(tex, UV).zw;
    complex psiU1 = texture2D(tex, UV + vec2(0.0, dy/h)).zw;
    complex psiU2 = texture2D(tex, UV + 2.0*vec2(0.0, dy/h)).zw;
    complex phaseU2 = phaseAdjust2;
    complex phaseU1 = phaseAdjust1;
    complex phaseD1 = conj(phaseU1);
    complex phaseD2 = conj(phaseU2);
    return (-(mul(psiD2, phaseD2) + mul(psiU2, phaseU2))/12.0
            +4.0*(mul(psiD1, phaseD1) + mul(psiU1, phaseU1))/3.0
            -5.0*psiC0/2.0)/(dy*dy);
}*/

void main() {
    /* vec2 theta = computePhaseArg2ndOrder(UV + vec2(dx/w, 0.0),
                                         UV + vec2(0.0, dy/h),
                                         UV - vec2(dx/w, 0.0),
                                         UV - vec2(0.0, dy/h));
    complex phaseX = complex(cos(theta.x), sin(theta.x));
    complex phaseY = complex(cos(theta.y), sin(theta.y));
    fragColor = vec4(vec2(0.0, 0.0),
                     xKinetic2ndOrder(tex, phaseX)
                     + yKinetic2ndOrder(tex, phaseY));*/
    fragColor = vec4(vec2(0.0, 0.0),
                     xKinetic2ndOrder(tex) + yKinetic2ndOrder(tex));
}

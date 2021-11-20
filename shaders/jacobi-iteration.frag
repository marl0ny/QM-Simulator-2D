precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;
uniform float dy;
uniform float dt;
uniform float w;
uniform float h;
uniform float m;
uniform float hbar;
uniform float rScaleV;
uniform sampler2D texPsi;
uniform sampler2D texPsiIter;
uniform sampler2D texV;
uniform sampler2D texA;
uniform int useAField;
uniform int laplacePoints;

vec2 mult(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x - z1.y*z2.y, 
                z1.x*z2.y + z1.y*z2.x);
}

vec2 conj(vec2 z) {
    return vec2(z.r, -z.g);
}


float reValueAt(sampler2D texComplexFunc, vec2 location) {
    vec4 tmp = texture2D(texComplexFunc, location);
    return tmp.r*tmp.a;
}

float imagValueAt(sampler2D texComplexFunc, vec2 location) {
    vec4 tmp = texture2D(texComplexFunc, location);
    return tmp.g*tmp.a;
}

float getImagValuesAround(sampler2D texComplexFunc) {
    float u = imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= 5) {
        return u + d + l + r;
    } else {
        float ul = imagValueAt(texComplexFunc, 
                               fragTexCoord + vec2(-dx/w, dy/h));
        float ur = imagValueAt(texComplexFunc, 
                               fragTexCoord + vec2(dx/w, dy/h));
        float dl = imagValueAt(texComplexFunc, 
                               fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = imagValueAt(texComplexFunc, 
                               fragTexCoord + vec2(dx/w, -dy/h));
        return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r;

    }
}

float getReValuesAround(sampler2D texComplexFunc) {
    float u = reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h));
    float d = reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h));
    float l = reValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0));
    float r = reValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= 5) {
        return u + d + l + r;
    } else {
        float ul = reValueAt(texComplexFunc, 
                             fragTexCoord + vec2(-dx/w, dy/h));
        float ur = reValueAt(texComplexFunc, 
                             fragTexCoord + vec2(dx/w, dy/h));
        float dl = reValueAt(texComplexFunc, 
                             fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = reValueAt(texComplexFunc, 
                             fragTexCoord + vec2(dx/w, -dy/h));
        return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r;
    }
}


vec2 valueAt(sampler2D texComplexFunc, vec2 location) {
    vec4 tmp = texture2D(texComplexFunc, location);
    return tmp.xy*tmp.a;
}

/* To approximage the vector potential, Peierls substitution is used where
very basically the non-diagonal elements are multiplied by a phase that is 
determined by a path from the diagonal to the non-diagonal element
using the vector potential. 

Feynman R., Leighton R., Sands M. (2011).
The Schrödinger Equation in a Classical Context: 
A Seminar on Superconductivity
https://www.feynmanlectures.caltech.edu/III_21.html.
In The Feynman Lectures on Physics: The New Millennium Edition, 
Volume 3, chapter 21. Basic Books.

Wikipedia contributors. (2021, April 21). Peierls substitution
https://en.wikipedia.org/wiki/Peierls_substitution. 
In Wikipedia, The Free Encyclopedia
*/

vec4 getAngles(vec2 location) {
    float q = 1.0;
    vec2 xy = location;
    vec4 c = texture2D(texA, xy);
    vec4 u = texture2D(texA, xy + vec2(0.0, dy/h));
    vec4 d = texture2D(texA, xy + vec2(0.0, -dy/h));
    vec4 l = texture2D(texA, xy + vec2(-dx/w, 0.0));
    vec4 r = texture2D(texA, xy + vec2(dx/w, 0.0));
    float thetaR = 0.5*q*(r + c).x*dx/hbar;
    float thetaU = 0.5*q*(u + c).y*dy/hbar;
    float thetaD = -0.5*q*(c + d).y*dy/hbar;
    float thetaL = -0.5*q*(c + l).x*dx/hbar;
    return vec4(thetaR, thetaU, thetaD, thetaL);
}

vec2 getPhase(float theta) {
    return vec2(cos(theta), -sin(theta));
}

vec2 getValuesAround(sampler2D texComplexFunc) {
    vec2 xy = fragTexCoord;
    vec4 theta = getAngles(xy);
    vec2 phaseR = getPhase(theta[0]);
    vec2 phaseU = getPhase(theta[1]);
    vec2 phaseD = getPhase(theta[2]);
    vec2 phaseL = getPhase(theta[3]);
    vec2 u = mult(valueAt(texComplexFunc, xy + vec2(0.0, dy/h)), phaseU);
    vec2 d = mult(valueAt(texComplexFunc, xy + vec2(0.0, -dy/h)), phaseD);
    vec2 l = mult(valueAt(texComplexFunc, xy + vec2(-dx/w, 0.0)), phaseL);
    vec2 r = mult(valueAt(texComplexFunc, xy + vec2(dx/w, 0.0)), phaseR);
    if (laplacePoints <= 5) {
        return u + d + l + r;
    } else {
        vec2 ul = valueAt(texComplexFunc, xy + vec2(-dx/w, dy/h));
        vec2 ur = valueAt(texComplexFunc, xy + vec2(dx/w, dy/h));
        vec2 dl = valueAt(texComplexFunc, xy + vec2(-dx/w, -dy/h));
        vec2 dr = valueAt(texComplexFunc, xy + vec2(dx/w, -dy/h));
        return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r;
    }
}

void main() {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;
    vec4 psiIter = texture2D(texPsiIter, fragTexCoord);
    vec4 psi = texture2D(texPsi, fragTexCoord);
    float c1 = (laplacePoints <= 5)? 1.0: 0.75;
    float imDiag = dt*V/(2.0*hbar) + c1*hbar*dt/(m*dx*dx);
    if (useAField == 0) {
        float reInvDiag = 1.0/(1.0 + imDiag*imDiag);
        float imInvDiag = -imDiag/(1.0 + imDiag*imDiag);
        float reTmp = psi.r;
        reTmp -= hbar*dt/(4.0*m*dx*dx)*getImagValuesAround(texPsiIter);
        float imTmp = psi.g;
        imTmp += hbar*dt/(4.0*m*dx*dx)*getReValuesAround(texPsiIter);
        fragColor = vec4(reInvDiag*reTmp - imInvDiag*imTmp,
                        imInvDiag*reTmp + reInvDiag*imTmp, 0.0, psi.a);
    } else {
        vec2 invDiag = vec2(1.0/(1.0 + imDiag*imDiag), 
                            -imDiag/(1.0 + imDiag*imDiag));
        vec2 I = vec2(0.0, 1.0);
        vec2 tmp = psi.xy + hbar*dt/(4.0*m*dx*dx)*
                   mult(I, getValuesAround(texPsiIter));
        fragColor = vec4(mult(invDiag, tmp), 0.0, psi.a);
    }
}

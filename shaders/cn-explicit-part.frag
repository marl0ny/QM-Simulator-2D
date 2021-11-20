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

float realValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.r*tmp.a;
}

float imagValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}

vec2 valueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
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

vec2 getDiv2Psi() {
    vec2 xy = fragTexCoord;
    vec4 theta = getAngles(xy);
    vec2 phaseR = getPhase(theta[0]);
    vec2 phaseU = getPhase(theta[1]);
    vec2 phaseD = getPhase(theta[2]);
    vec2 phaseL = getPhase(theta[3]);
    vec2 u = mult(valueAt(xy + vec2(0.0, dy/h)), phaseU);
    vec2 d = mult(valueAt(xy + vec2(0.0, -dy/h)), phaseD);
    vec2 l = mult(valueAt(xy + vec2(-dx/w, 0.0)), phaseL);
    vec2 r = mult(valueAt(xy + vec2(dx/w, 0.0)), phaseR);
    vec2 c = valueAt(xy);
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*c)/(dx*dx);
    } else {
        vec2 ul = valueAt(xy + vec2(-dx/w, dy/h));
        vec2 ur = valueAt(xy + vec2(dx/w, dy/h));
        vec2 dl = valueAt(xy + vec2(-dx/w, -dy/h));
        vec2 dr = valueAt(xy + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*c)/(dx*dx);
    }

}

float getDiv2RePsi(float rePsi) {
    float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*rePsi)/(dx*dx);
    } else {
        float ul = realValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = realValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = realValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = realValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);
    }
}

float getDiv2ImPsi(float imPsi) {
    float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*imPsi)/(dx*dx);
    } else {
        float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);
    }
}

void main() {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
               rScaleV*texture2D(texV, fragTexCoord).g;
    vec4 psi = texture2D(texPsi, fragTexCoord);
    // TODO: do an electromagnetic field where
    // H = e**2*A**2/(2*m) - e*A*p/(2*m) - e*p*(A/(2*m)) + p**2/(2*m) + V
    // H = p**2/(2*m) - e*A*p/(2*m) - e*p*(A/(2*m)) + (e**2*A**2/(2*m) + V)
    // V_A = (e**2*A**2/(2*m) + V)
    // H = (1/(2*m))*p**2 - (e/(2*m))*A*p - (e/(2*m))*p*A + V_A
    // H psi = (1/(2*m))*p**2 psi - (e/(2*m))*A*p psi
    //          - (e/(2*m))*p (A psi) + V_A psi
    if (useAField == 0) {
        float reKinetic = (-hbar*hbar/(2.0*m))*getDiv2RePsi(psi.r);
        float imKinetic = (-hbar*hbar/(2.0*m))*getDiv2ImPsi(psi.g);
        float hamiltonRePsi = reKinetic + V*psi.r;
        float hamiltonImPsi = imKinetic + V*psi.g;
        // 1 - i*dt*H/(2.0*hbar)
        fragColor = vec4(psi.r + dt/(2.0*hbar)*hamiltonImPsi,
                         psi.g - dt/(2.0*hbar)*hamiltonRePsi, 0.0, psi.a
                         );
    } else {
        vec2 kinetic = (-hbar*hbar/(2.0*m))*getDiv2Psi();
        vec2 hamiltonPsi = kinetic + V*psi.xy;
        vec2 I = vec2(0.0, 1.0);
        fragColor = vec4(psi.xy - (dt/(2.0*hbar))*mult(I, hamiltonPsi), 0.0,
                         psi.a);
    }
}

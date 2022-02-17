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


const int FIVE_POINT = 5;
const int NINE_POINT_I = 9;
const int NINE_POINT_II = 10;
const int THIRTEEN_POINT = 13;
const int SEVENTEEN_POINT = 17;


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
    if (laplacePoints <= FIVE_POINT) {
        return (u + d + l + r - 4.0*c)/(dx*dx);
    } else if (laplacePoints <= NINE_POINT_I) {
        vec2 ul = valueAt(xy + vec2(-dx/w, dy/h));
        vec2 ur = valueAt(xy + vec2(dx/w, dy/h));
        vec2 dl = valueAt(xy + vec2(-dx/w, -dy/h));
        vec2 dr = valueAt(xy + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*c)/(dx*dx);
    } else {
        vec2 d00 = vec2(2.0*dx/w, 2.0*dy/h);
        vec2 d01 = vec2(2.0*dx/w, dy/h);
        vec2 d02 = vec2(2.0*dx/w, 0.0);
        vec2 d03 = vec2(2.0*dx/w, -1.0*dy/h);
        vec2 d04 = vec2(2.0*dx/w, -2.0*dy/h);
        vec2 d10 = vec2(dx/w, 2.0*dy/h);
        vec2 d11 = vec2(dx/w, dy/h);
        vec2 d12 = vec2(dx/w, 0.0);
        vec2 d13 = vec2(dx/w, -1.0*dy/h);
        vec2 d14 = vec2(dx/w, -2.0*dy/h);
        vec2 d20 = vec2(0.0, 2.0*dy/h);
        vec2 d21 = vec2(0.0, dy/h);
        vec2 d22 = vec2(0.0, 0.0);
        vec2 d23 = vec2(0.0, -1.0*dy/h);
        vec2 d24 = vec2(0.0, -2.0*dy/h);
        vec2 d30 = vec2(-1.0*dx/w, 2.0*dy/h);
        vec2 d31 = vec2(-1.0*dx/w, dy/h);
        vec2 d32 = vec2(-1.0*dx/w, 0.0);
        vec2 d33 = vec2(-1.0*dx/w, -1.0*dy/h);
        vec2 d34 = vec2(-1.0*dx/w, -2.0*dy/h);
        vec2 d40 = vec2(-2.0*dx/w, 2.0*dy/h);
        vec2 d41 = vec2(-2.0*dx/w, dy/h);
        vec2 d42 = vec2(-2.0*dx/w, 0.0);
        vec2 d43 = vec2(-2.0*dx/w, -1.0*dy/h);
        vec2 d44 = vec2(-2.0*dx/w, -2.0*dy/h);
        vec2 s00 = valueAt(fragTexCoord + d00);
        vec2 s01 = valueAt(fragTexCoord + d01);
        vec2 s02 = valueAt(fragTexCoord + d02);
        vec2 s03 = valueAt(fragTexCoord + d03);
        vec2 s04 = valueAt(fragTexCoord + d04);
        vec2 s10 = valueAt(fragTexCoord + d10);
        vec2 s11 = valueAt(fragTexCoord + d11);
        vec2 s12 = valueAt(fragTexCoord + d12);
        vec2 s13 = valueAt(fragTexCoord + d13);
        vec2 s14 = valueAt(fragTexCoord + d14);
        vec2 s20 = valueAt(fragTexCoord + d20);
        vec2 s21 = valueAt(fragTexCoord + d21);
        vec2 s22 = valueAt(fragTexCoord + d22);
        vec2 s23 = valueAt(fragTexCoord + d23);
        vec2 s24 = valueAt(fragTexCoord + d24);
        vec2 s30 = valueAt(fragTexCoord + d30);
        vec2 s31 = valueAt(fragTexCoord + d31);
        vec2 s32 = valueAt(fragTexCoord + d32);
        vec2 s33 = valueAt(fragTexCoord + d33);
        vec2 s34 = valueAt(fragTexCoord + d34);
        vec2 s40 = valueAt(fragTexCoord + d40);
        vec2 s41 = valueAt(fragTexCoord + d41);
        vec2 s42 = valueAt(fragTexCoord + d42);
        vec2 s43 = valueAt(fragTexCoord + d43);
        vec2 s44 = valueAt(fragTexCoord + d44);
        float w00, w01, w02, w03, w04;
        float w10, w11, w12, w13, w14;
        float w20, w21, w22, w23, w24;
        float w30, w31, w32, w33, w34;
        float w40, w41, w42, w43, w44;
        if (laplacePoints == NINE_POINT_II) {
            w00 = 0.0, w01 = 0.0, w02 = -1./12.0, w03 = 0.0, w04 = 0.0;
            w10 = 0.0, w11 = 0.0, w12 = 4.0/3.0,  w13 = 0.0, w14 = 0.0;
            w20 = -1.0/12.0, w21 = 4.0/3.0, 
                w22 = -5.0, w23 = 4.0/3.0, w24 = -1.0/12.0;
            w30 = 0.0, w31 = 0.0, w32 = 4.0/3.0,   w33 = 0.0, w34 = 0.0;
            w40 = 0.0, w41 = 0.0, w42 = -1.0/12.0, w43 = 0.0, w44 = 0.0;
        } else if (laplacePoints == THIRTEEN_POINT) {
            w00 = 0.0;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = 0.0;
            w10 = 0.0;
            w11 = 0.25;
            w12 = 0.6666666666666666;
            w13 = 0.25;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.5;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.25;
            w32 = 0.6666666666666666;
            w33 = 0.25;
            w34 = 0.0;
            w40 = 0.0;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = 0.0;
        } else {
            w00 = -0.020833333333333332;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = -0.020833333333333332;
            w10 = 0.0;
            w11 = 0.3333333333333333;
            w12 = 0.6666666666666666;
            w13 = 0.3333333333333333;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.75;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.3333333333333333;
            w32 = 0.6666666666666666;
            w33 = 0.3333333333333333;
            w34 = 0.0;
            w40 = -0.020833333333333332;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = -0.020833333333333332;
        }
        return (w00*s00
                + w01*s01 + w02*s02 + w03*s03 + w04*s04 
                + w10*s10 + w11*s11 + w12*s12 + w13*s13 + w14*s14
                + w20*s20 + w21*s21 + w22*s22 + w23*s23
                + w24*s24 + w30*s30 + w31*s31 + w32*s32
                + w33*s33 + w34*s34 + w40*s40 + w41*s41
                + w42*s42 + w43*s43 + w44*s44)/(dx*dx);
    }
}

float getDiv2RePsi(float rePsi) {
    float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= FIVE_POINT) {
        return (u + d + l + r - 4.0*rePsi)/(dx*dx);
    } else if (laplacePoints <= NINE_POINT_I) {
        float ul = realValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = realValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = realValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = realValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);
    } else {
        vec2 d00 = vec2(2.0*dx/w, 2.0*dy/h);
        vec2 d01 = vec2(2.0*dx/w, dy/h);
        vec2 d02 = vec2(2.0*dx/w, 0.0);
        vec2 d03 = vec2(2.0*dx/w, -1.0*dy/h);
        vec2 d04 = vec2(2.0*dx/w, -2.0*dy/h);
        vec2 d10 = vec2(dx/w, 2.0*dy/h);
        vec2 d11 = vec2(dx/w, dy/h);
        vec2 d12 = vec2(dx/w, 0.0);
        vec2 d13 = vec2(dx/w, -1.0*dy/h);
        vec2 d14 = vec2(dx/w, -2.0*dy/h);
        vec2 d20 = vec2(0.0, 2.0*dy/h);
        vec2 d21 = vec2(0.0, dy/h);
        vec2 d22 = vec2(0.0, 0.0);
        vec2 d23 = vec2(0.0, -1.0*dy/h);
        vec2 d24 = vec2(0.0, -2.0*dy/h);
        vec2 d30 = vec2(-1.0*dx/w, 2.0*dy/h);
        vec2 d31 = vec2(-1.0*dx/w, dy/h);
        vec2 d32 = vec2(-1.0*dx/w, 0.0);
        vec2 d33 = vec2(-1.0*dx/w, -1.0*dy/h);
        vec2 d34 = vec2(-1.0*dx/w, -2.0*dy/h);
        vec2 d40 = vec2(-2.0*dx/w, 2.0*dy/h);
        vec2 d41 = vec2(-2.0*dx/w, dy/h);
        vec2 d42 = vec2(-2.0*dx/w, 0.0);
        vec2 d43 = vec2(-2.0*dx/w, -1.0*dy/h);
        vec2 d44 = vec2(-2.0*dx/w, -2.0*dy/h);
        float s00 = realValueAt(fragTexCoord + d00);
        float s01 = realValueAt(fragTexCoord + d01);
        float s02 = realValueAt(fragTexCoord + d02);
        float s03 = realValueAt(fragTexCoord + d03);
        float s04 = realValueAt(fragTexCoord + d04);
        float s10 = realValueAt(fragTexCoord + d10);
        float s11 = realValueAt(fragTexCoord + d11);
        float s12 = realValueAt(fragTexCoord + d12);
        float s13 = realValueAt(fragTexCoord + d13);
        float s14 = realValueAt(fragTexCoord + d14);
        float s20 = realValueAt(fragTexCoord + d20);
        float s21 = realValueAt(fragTexCoord + d21);
        float s22 = realValueAt(fragTexCoord + d22);
        float s23 = realValueAt(fragTexCoord + d23);
        float s24 = realValueAt(fragTexCoord + d24);
        float s30 = realValueAt(fragTexCoord + d30);
        float s31 = realValueAt(fragTexCoord + d31);
        float s32 = realValueAt(fragTexCoord + d32);
        float s33 = realValueAt(fragTexCoord + d33);
        float s34 = realValueAt(fragTexCoord + d34);
        float s40 = realValueAt(fragTexCoord + d40);
        float s41 = realValueAt(fragTexCoord + d41);
        float s42 = realValueAt(fragTexCoord + d42);
        float s43 = realValueAt(fragTexCoord + d43);
        float s44 = realValueAt(fragTexCoord + d44);
        float w00, w01, w02, w03, w04;
        float w10, w11, w12, w13, w14;
        float w20, w21, w22, w23, w24;
        float w30, w31, w32, w33, w34;
        float w40, w41, w42, w43, w44;
        if (laplacePoints == NINE_POINT_II) {
            w00 = 0.0, w01 = 0.0, w02 = -1./12.0, w03 = 0.0, w04 = 0.0;
            w10 = 0.0, w11 = 0.0, w12 = 4.0/3.0,  w13 = 0.0, w14 = 0.0;
            w20 = -1.0/12.0, w21 = 4.0/3.0, 
                w22 = -5.0, w23 = 4.0/3.0, w24 = -1.0/12.0;
            w30 = 0.0, w31 = 0.0, w32 = 4.0/3.0,   w33 = 0.0, w34 = 0.0;
            w40 = 0.0, w41 = 0.0, w42 = -1.0/12.0, w43 = 0.0, w44 = 0.0;
        } else if (laplacePoints == THIRTEEN_POINT) {
            w00 = 0.0;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = 0.0;
            w10 = 0.0;
            w11 = 0.25;
            w12 = 0.6666666666666666;
            w13 = 0.25;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.5;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.25;
            w32 = 0.6666666666666666;
            w33 = 0.25;
            w34 = 0.0;
            w40 = 0.0;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = 0.0;
        } else {
            w00 = -0.020833333333333332;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = -0.020833333333333332;
            w10 = 0.0;
            w11 = 0.3333333333333333;
            w12 = 0.6666666666666666;
            w13 = 0.3333333333333333;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.75;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.3333333333333333;
            w32 = 0.6666666666666666;
            w33 = 0.3333333333333333;
            w34 = 0.0;
            w40 = -0.020833333333333332;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = -0.020833333333333332;
        }
        return (w00*s00
                + w01*s01 + w02*s02 + w03*s03 + w04*s04 
                + w10*s10 + w11*s11 + w12*s12 + w13*s13 + w14*s14
                + w20*s20 + w21*s21 + w22*s22 + w23*s23
                + w24*s24 + w30*s30 + w31*s31 + w32*s32
                + w33*s33 + w34*s34 + w40*s40 + w41*s41
                + w42*s42 + w43*s43 + w44*s44)/(dx*dx);
    }
}

float getDiv2ImPsi(float imPsi) {
    float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));
    if (laplacePoints <= FIVE_POINT) {
        return (u + d + l + r - 4.0*imPsi)/(dx*dx);
    } else if (laplacePoints <= NINE_POINT_I) {
        float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);
    } else {
        vec2 d00 = vec2(2.0*dx/w, 2.0*dy/h);
        vec2 d01 = vec2(2.0*dx/w, dy/h);
        vec2 d02 = vec2(2.0*dx/w, 0.0);
        vec2 d03 = vec2(2.0*dx/w, -1.0*dy/h);
        vec2 d04 = vec2(2.0*dx/w, -2.0*dy/h);
        vec2 d10 = vec2(dx/w, 2.0*dy/h);
        vec2 d11 = vec2(dx/w, dy/h);
        vec2 d12 = vec2(dx/w, 0.0);
        vec2 d13 = vec2(dx/w, -1.0*dy/h);
        vec2 d14 = vec2(dx/w, -2.0*dy/h);
        vec2 d20 = vec2(0.0, 2.0*dy/h);
        vec2 d21 = vec2(0.0, dy/h);
        vec2 d22 = vec2(0.0, 0.0);
        vec2 d23 = vec2(0.0, -1.0*dy/h);
        vec2 d24 = vec2(0.0, -2.0*dy/h);
        vec2 d30 = vec2(-1.0*dx/w, 2.0*dy/h);
        vec2 d31 = vec2(-1.0*dx/w, dy/h);
        vec2 d32 = vec2(-1.0*dx/w, 0.0);
        vec2 d33 = vec2(-1.0*dx/w, -1.0*dy/h);
        vec2 d34 = vec2(-1.0*dx/w, -2.0*dy/h);
        vec2 d40 = vec2(-2.0*dx/w, 2.0*dy/h);
        vec2 d41 = vec2(-2.0*dx/w, dy/h);
        vec2 d42 = vec2(-2.0*dx/w, 0.0);
        vec2 d43 = vec2(-2.0*dx/w, -1.0*dy/h);
        vec2 d44 = vec2(-2.0*dx/w, -2.0*dy/h);
        float s00 = imagValueAt(fragTexCoord + d00);
        float s01 = imagValueAt(fragTexCoord + d01);
        float s02 = imagValueAt(fragTexCoord + d02);
        float s03 = imagValueAt(fragTexCoord + d03);
        float s04 = imagValueAt(fragTexCoord + d04);
        float s10 = imagValueAt(fragTexCoord + d10);
        float s11 = imagValueAt(fragTexCoord + d11);
        float s12 = imagValueAt(fragTexCoord + d12);
        float s13 = imagValueAt(fragTexCoord + d13);
        float s14 = imagValueAt(fragTexCoord + d14);
        float s20 = imagValueAt(fragTexCoord + d20);
        float s21 = imagValueAt(fragTexCoord + d21);
        float s22 = imagValueAt(fragTexCoord + d22);
        float s23 = imagValueAt(fragTexCoord + d23);
        float s24 = imagValueAt(fragTexCoord + d24);
        float s30 = imagValueAt(fragTexCoord + d30);
        float s31 = imagValueAt(fragTexCoord + d31);
        float s32 = imagValueAt(fragTexCoord + d32);
        float s33 = imagValueAt(fragTexCoord + d33);
        float s34 = imagValueAt(fragTexCoord + d34);
        float s40 = imagValueAt(fragTexCoord + d40);
        float s41 = imagValueAt(fragTexCoord + d41);
        float s42 = imagValueAt(fragTexCoord + d42);
        float s43 = imagValueAt(fragTexCoord + d43);
        float s44 = imagValueAt(fragTexCoord + d44);
        float w00, w01, w02, w03, w04;
        float w10, w11, w12, w13, w14;
        float w20, w21, w22, w23, w24;
        float w30, w31, w32, w33, w34;
        float w40, w41, w42, w43, w44;
        if (laplacePoints == NINE_POINT_II) {
            w00 = 0.0, w01 = 0.0, w02 = -1./12.0, w03 = 0.0, w04 = 0.0;
            w10 = 0.0, w11 = 0.0, w12 = 4.0/3.0,  w13 = 0.0, w14 = 0.0;
            w20 = -1.0/12.0, w21 = 4.0/3.0, 
                w22 = -5.0, w23 = 4.0/3.0, w24 = -1.0/12.0;
            w30 = 0.0, w31 = 0.0, w32 = 4.0/3.0,   w33 = 0.0, w34 = 0.0;
            w40 = 0.0, w41 = 0.0, w42 = -1.0/12.0, w43 = 0.0, w44 = 0.0;
        } else if (laplacePoints == THIRTEEN_POINT) {
            w00 = 0.0;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = 0.0;
            w10 = 0.0;
            w11 = 0.25;
            w12 = 0.6666666666666666;
            w13 = 0.25;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.5;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.25;
            w32 = 0.6666666666666666;
            w33 = 0.25;
            w34 = 0.0;
            w40 = 0.0;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = 0.0;
        } else {
            w00 = -0.020833333333333332;
            w01 = 0.0;
            w02 = -0.041666666666666664;
            w03 = 0.0;
            w04 = -0.020833333333333332;
            w10 = 0.0;
            w11 = 0.3333333333333333;
            w12 = 0.6666666666666666;
            w13 = 0.3333333333333333;
            w14 = 0.0;
            w20 = -0.041666666666666664;
            w21 = 0.6666666666666666;
            w22 = -3.75;
            w23 = 0.6666666666666666;
            w24 = -0.041666666666666664;
            w30 = 0.0;
            w31 = 0.3333333333333333;
            w32 = 0.6666666666666666;
            w33 = 0.3333333333333333;
            w34 = 0.0;
            w40 = -0.020833333333333332;
            w41 = 0.0;
            w42 = -0.041666666666666664;
            w43 = 0.0;
            w44 = -0.020833333333333332;
        }
        return (w00*s00
                + w01*s01 + w02*s02 + w03*s03 + w04*s04 
                + w10*s10 + w11*s11 + w12*s12 + w13*s13 + w14*s14
                + w20*s20 + w21*s21 + w22*s22 + w23*s23
                + w24*s24 + w30*s30 + w31*s31 + w32*s32
                + w33*s33 + w34*s34 + w40*s40 + w41*s41
                + w42*s42 + w43*s43 + w44*s44)/(dx*dx); 
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

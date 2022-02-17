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
uniform sampler2D texPsi1;
uniform sampler2D texPsi2;
uniform sampler2D texV;
uniform int laplacePoints;

const int FIVE_POINT = 5;
const int NINE_POINT_I = 9;
const int NINE_POINT_II = 10;
const int THIRTEEN_POINT = 13;
const int SEVENTEEN_POINT = 17;


vec2 valueAt(sampler2D texPsi, vec2 coord) {
    vec4 psiFragment = texture2D(texPsi, coord);
    return psiFragment.xy*psiFragment.a;
}


vec2 div2Psi(sampler2D texPsi) {
    vec2 c = valueAt(texPsi, fragTexCoord);
    vec2 u = valueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));
    vec2 d = valueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));
    vec2 l = valueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));
    vec2 r = valueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));
    // Reference for different Laplacian stencil choices:
    // Wikipedia contributors. (2021, February 17)
    // Discrete Laplacian Operator 
    // 1.5.1 Implementation via operator discretization
    // https://en.wikipedia.org/wiki/Discrete_Laplace_operator
    // #Implementation_via_operator_discretization
    // 
    // Fornberg, B. (1988). 
    // Generation of Finite Difference Formulas on 
    // Arbitrarily Spaced Grids. 
    // Mathematics of Computation, 51(184), 699-706. 
    // https://doi.org/10.1090/S0025-5718-1988-0935077-0
    if (laplacePoints <= FIVE_POINT) {
        return (u + d + l + r - 4.0*c)/(dx*dx);
    } else if (laplacePoints == NINE_POINT_I) {
        vec2 ul = valueAt(texPsi, fragTexCoord + vec2(-dx/w, dy/h));
        vec2 ur = valueAt(texPsi, fragTexCoord + vec2(dx/w, dy/h));
        vec2 dl = valueAt(texPsi, fragTexCoord + vec2(-dx/w, -dy/h));
        vec2 dr = valueAt(texPsi, fragTexCoord + vec2(dx/w, -dy/h));
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
        vec2 s00 = valueAt(texPsi, fragTexCoord + d00);
        vec2 s01 = valueAt(texPsi, fragTexCoord + d01);
        vec2 s02 = valueAt(texPsi, fragTexCoord + d02);
        vec2 s03 = valueAt(texPsi, fragTexCoord + d03);
        vec2 s04 = valueAt(texPsi, fragTexCoord + d04);
        vec2 s10 = valueAt(texPsi, fragTexCoord + d10);
        vec2 s11 = valueAt(texPsi, fragTexCoord + d11);
        vec2 s12 = valueAt(texPsi, fragTexCoord + d12);
        vec2 s13 = valueAt(texPsi, fragTexCoord + d13);
        vec2 s14 = valueAt(texPsi, fragTexCoord + d14);
        vec2 s20 = valueAt(texPsi, fragTexCoord + d20);
        vec2 s21 = valueAt(texPsi, fragTexCoord + d21);
        vec2 s22 = valueAt(texPsi, fragTexCoord + d22);
        vec2 s23 = valueAt(texPsi, fragTexCoord + d23);
        vec2 s24 = valueAt(texPsi, fragTexCoord + d24);
        vec2 s30 = valueAt(texPsi, fragTexCoord + d30);
        vec2 s31 = valueAt(texPsi, fragTexCoord + d31);
        vec2 s32 = valueAt(texPsi, fragTexCoord + d32);
        vec2 s33 = valueAt(texPsi, fragTexCoord + d33);
        vec2 s34 = valueAt(texPsi, fragTexCoord + d34);
        vec2 s40 = valueAt(texPsi, fragTexCoord + d40);
        vec2 s41 = valueAt(texPsi, fragTexCoord + d41);
        vec2 s42 = valueAt(texPsi, fragTexCoord + d42);
        vec2 s43 = valueAt(texPsi, fragTexCoord + d43);
        vec2 s44 = valueAt(texPsi, fragTexCoord + d44);
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
    vec4 arrV = texture2D(texV, fragTexCoord);
    float V = (1.0 - rScaleV)*arrV[0] + rScaleV*arrV[1];
    float imV = arrV[2];
    float f1 = 1.0 - dt*imV/hbar;
    float f2 = 1.0 + dt*imV/hbar;
    vec4 psi1Fragment = texture2D(texPsi1, fragTexCoord);
    float alpha = psi1Fragment.a;
    vec2 psi1 = psi1Fragment.xy*alpha;
    vec2 psi2 = valueAt(texPsi2, fragTexCoord);
    vec2 hamiltonianPsi2 = -(0.5*hbar*hbar/m)*div2Psi(texPsi2) + V*psi2;
    fragColor = vec4(psi1.x*(f2/f1) + dt*hamiltonianPsi2.y/(f1*hbar),
                     psi1.y*(f2/f1) - dt*hamiltonianPsi2.x/(f1*hbar),
                     0.0, alpha);
}

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
uniform int laplacePoints;


const int FIVE_POINT = 5;
const int NINE_POINT_I = 9;
const int NINE_POINT_II = 10;
const int THIRTEEN_POINT = 13;
const int SEVENTEEN_POINT = 17;


float imagValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}


float getDiv2ImPsi(float imPsi) {
    float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));
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
        return (u + d + l + r - 4.0*imPsi)/(dx*dx);
    } else if (laplacePoints <= NINE_POINT_I) {
        float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));
        float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));
        float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));
        float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);
    } else {
        // #   #   #
        //   # # #  
        // # # # # #
        //   # # #  
        // #   #   #
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

void main () {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;
    float imV = texture2D(texV, fragTexCoord).b;
    vec4 psi = texture2D(texPsi, fragTexCoord);
    float rePsi = psi.r;
    float imPsi = psi.g;
    float alpha = psi.a;
    float div2ImPsi = getDiv2ImPsi(imPsi);
    float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + V*imPsi;
    float f1 = 1.0 - dt*imV/hbar;
    float f2 = 1.0 + dt*imV/hbar;
    fragColor = vec4(rePsi*(f2/f1) + hamiltonImPsi*dt/(f1*hbar), imPsi, 
                     0.0, alpha);
}
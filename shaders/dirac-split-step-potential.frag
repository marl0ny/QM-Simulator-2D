precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif


uniform sampler2D uTex;
uniform sampler2D vTex;
uniform sampler2D potTex;
uniform int useVecPot;
uniform sampler2D vecPotTex;
uniform float dt;
uniform float m;
uniform float c;
uniform float hbar;

uniform int topOrBottom;

const int TOP = 0;
const int BOTTOM = 1;

#define complex vec2
#define complex2 vec4

const float SQRT_2 = 1.4142135623730951;

complex mult(complex z1, complex z2) {
    return complex(z1.x*z2.x - z1.y*z2.y, 
                   z1.x*z2.y + z1.y*z2.x);
}

complex mul(complex z1, complex z2) {
    return mult(z1, z2);
}

complex2 c1C2(complex z, complex2 z2) {
    complex a = complex(z2[0], z2[1]);
    complex b = complex(z2[2], z2[3]);
    return complex2(complex(z.x*a.x - z.y*a.y, z.x*a.y + z.y*a.x),
                    complex(z.x*b.x - z.y*b.y, z.x*b.y + z.y*b.x));
}

complex conj(complex z) {
    return complex(z.x, -z.y);
}

complex innerProd(complex2 z1, complex2 z2) {
    return mul(conj(z1.rg), z2.rg) + mul(conj(z1.ba), z2.ba);
}

complex frac(complex z1, complex z2) {
    complex invZ2 = conj(z2)/(z2.x*z2.x + z2.y*z2.y);
    return mul(z1, invZ2);
}

complex complexExp(complex z) {
    return complex(exp(z.x)*cos(z.y), exp(z.x)*sin(z.y));
}

/* 
 Instead of exponentiating the vector potential terms in its entirety which
 was what was previously done, its eigenvectors are instead computed.
 The wave function is then expressed in this basis, then the wave function
 is propagated in time with the now diagonal propagator, and finally the 
 wave function is transformed back to its Initial basis. 
 To compute the eigenvectors, the eigenvectors for the sigma matrices for a 
 general direction were needed. Although easily duoble by pencil and paper,
 this was just done using a computer algebra system like Sympy.
*/
complex2 getNegativeSpinEigenstate(vec3 orientation, float len) {
    float n = len;
    float nx = orientation.x, ny = orientation.y, nz = orientation.z;
    complex az = complex(0.0, 0.0);
    complex bz = complex(1.0, 0.0);
    complex a = frac(complex(-n + nz, 0.0),
                     complex(nx, ny)*sqrt((nz - n)*(nz - n)/(nx*nx + ny*ny)
                                          + 1.0));
    complex b = complex(1.0/sqrt((nz - n)*(nz - n)/(nx*nx + ny*ny) + 1.0),
                        0.0);
    if ((nx*nx + ny*ny) == 0.0) return complex2(az, bz);
    return complex2(a, b);
}

complex2 getPositiveSpinEigenstate(vec3 orientation, float len) {
    float n = len;
    float nx = orientation.x, ny = orientation.y, nz = orientation.z;
    complex az = complex(1.0, 0.0);
    complex bz = complex(0.0, 0.0);
    complex a = frac(complex(n + nz, 0.0),
                     complex(nx, ny)*sqrt((nz + n)*(nz + n)/(nx*nx + ny*ny)
                                          + 1.0));
    complex b = complex(1.0/sqrt((nz + n)*(nz + n)/(nx*nx + ny*ny) + 1.0),
                        0.0);
    if ((nx*nx + ny*ny) == 0.0) return complex2(az, bz);
    return complex2(a, b);
}

void main() {
    // Potential
    vec4 potential = texture2D(potTex, fragTexCoord);
    float reV = potential[0];
    float imV = potential[2];
    float imArg = -0.5*c*reV*dt/hbar;
    float reArg = 0.5*c*imV*dt/hbar;
    complex expV = complexExp(complex(reArg, imArg));
    // complex expV = complex(cos(imArg), sin(imArg));
    // 3 vector potential
    vec4 vecPot = texture2D(vecPotTex, fragTexCoord);
    float vx = vecPot.x, vy = vecPot.y, vz = vecPot.z;
    float v2 = vx*vx + vy*vy + vz*vz;
    float v = sqrt(v2);
    // Wave function
    complex2 s01 = texture2D(uTex, fragTexCoord);
    complex2 s23 = texture2D(vTex, fragTexCoord);
    if (useVecPot > 0) {

        complex2 posEig = getPositiveSpinEigenstate(vecPot.xyz, v);
        complex2 negEig = getNegativeSpinEigenstate(vecPot.xyz, v);

        complex c0 = (innerProd(posEig, s01) + innerProd(posEig, s23))/SQRT_2;
        complex c1 = (innerProd(negEig, s01) - innerProd(negEig, s23))/SQRT_2;
        complex c2 = (innerProd(negEig, s01) + innerProd(negEig, s23))/SQRT_2;
        complex c3 = (innerProd(posEig, s01) - innerProd(posEig, s23))/SQRT_2;
        complex eP = complex(cos(c*v*dt/hbar), sin(c*v*dt/hbar)); 
        complex eN = complex(cos(c*v*dt/hbar), -sin(c*v*dt/hbar));
        complex e0 = mult(c0, eP);
        complex e1 = mult(c1, eP);
        complex e2 = mult(c2, eN);
        complex e3 = mult(c3, eN);
        if (v != 0.0) {
            s01 = c1C2(e0, posEig/SQRT_2) + c1C2(e1, negEig/SQRT_2)
                   + c1C2(e2, negEig/SQRT_2) + c1C2(e3, posEig/SQRT_2);
            s23 = c1C2(e0, posEig/SQRT_2) + c1C2(e1, -negEig/SQRT_2)
                   + c1C2(e2, negEig/SQRT_2) + c1C2(e3, -posEig/SQRT_2);
        }
        fragColor = (topOrBottom == TOP)? c1C2(expV, s01): c1C2(expV, s23);
    } else {
        fragColor = complex2(expV, expV);
    }
}

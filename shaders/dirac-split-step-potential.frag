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
const complex ZERO = complex(0.0, 0.0);


complex mult(complex z1, complex z2) {
    return complex(z1.x*z2.x - z1.y*z2.y, 
                   z1.x*z2.y + z1.y*z2.x);
}

complex conj(complex z) {
    return complex(z.x, -z.y);
}

complex frac(complex z1, complex z2) {
    complex invZ2 = conj(z2)/(z2.x*z2.x + z2.y*z2.y);
    return mult(z1, invZ2);
} 

complex complexExp(complex z) {
    return complex(exp(z.x)*cos(z.y), exp(z.x)*sin(z.y));
}

complex complexCosh(complex z) {
    return (complexExp(z) + complexExp(-z))/2.0;
}

complex complexSinh(complex z) {
    return (complexExp(z) - complexExp(-z))/2.0;
}

void main() {
    vec4 potential = texture2D(potTex, fragTexCoord);
    float reV = potential[0];
    float imV = potential[2];
    float imArg = -0.5*c*reV*dt/hbar;
    float reArg = 0.5*c*imV*dt/hbar;
    if (useVecPot == 0) {
        fragColor = vec4(exp(reArg)*cos(imArg), exp(reArg)*sin(imArg), 
                         exp(reArg)*cos(imArg), exp(reArg)*sin(imArg));

    } else if (useVecPot == 1) {
        vec4 vecPot = texture2D(vecPotTex, fragTexCoord);
        float vx = vecPot.x, vy = vecPot.y, vz = vecPot.z;
        float v2 = vx*vx + vy*vy + vz*vz;
        float v = sqrt(v2);
        complex d = complex(0.0, -1.0)*dt*c/hbar;
        complex expV00 = complexCosh(d*v);
        complex expV01 = ZERO;
        complex expV02 = mult(vz*d, frac(complexSinh(d*v), d*v));
        complex expV03 = 0.5*mult(d,
                                  complex(-vx, vy)
                                   + mult(complex(vx -vy),
                                          mult(complexExp(2.0*d*v), 
                                               frac(complexExp(-d*v), d*v))));

        complex expV10 = ZERO;
        complex expV11 = complexCosh(d*v);
        complex expV12 = 0.5*mult(d,
                                   complex(-vx, -vy)
                                   + mult(complex(vx, vy),
                                          mult(complexExp(2.0*d*v), 
                                               frac(complexExp(-d*v), d*v))));
        complex expV13 = mult(-vz*d, frac(complexSinh(d*v), d*v));
        complex expV20 = mult(vz*d, frac(complexSinh(d*v), d*v2));
        complex expV21 = 0.5*mult(d*v, 
                                  complex(-vx, vy)
                                   + mult(complex(vx, -vy), 
                                  mult(complexExp(2.0*d*v), 
                                       frac(complexExp(-d*v), d*v2))));
        complex expV22 = complexCosh(d*v);
        complex expV23 = ZERO;
        complex expV30 = 0.5*mult(d*v, 
                                  complex(-vx, -vy)
                                   + mult(complex(vx, vy), 
                                  mult(complexExp(2.0*d*v), 
                                       frac(complexExp(-d*v), d*v2))));
        complex expV31 = -vz*mult(d*v, frac(complexSinh(d*v), d*v2));
        complex expV32 = ZERO;
        complex expV33 = complexCosh(d*v);

        complex expV = complexExp(complex(reArg, imArg));
        expV00 = mult(expV00, expV);
        expV01 = mult(expV01, expV);
        expV02 = mult(expV02, expV);
        expV03 = mult(expV03, expV);
        expV10 = mult(expV10, expV);
        expV11 = mult(expV11, expV);
        expV12 = mult(expV12, expV);
        expV13 = mult(expV13, expV);
        expV20 = mult(expV20, expV);
        expV21 = mult(expV21, expV);
        expV22 = mult(expV22, expV); 
        expV23 = mult(expV23, expV);
        expV30 = mult(expV30, expV);
        expV31 = mult(expV31, expV);
        expV32 = mult(expV32, expV);
        expV33 = mult(expV33, expV);

        vec4 upperSpinor = texture2D(uTex, fragTexCoord);
        vec4 lowerSpinor = texture2D(vTex, fragTexCoord);
        complex r0 = upperSpinor.xy;
        complex r1 = upperSpinor.zw;
        complex r2 = lowerSpinor.xy;
        complex r3 = lowerSpinor.zw;
        complex s0 = mult(expV00, r0) + mult(expV01, r1)
                      + mult(expV02, r2) + mult(expV03, r3);
        complex s1 = mult(expV10, r0) + mult(expV11, r1)
                      + mult(expV12, r2) + mult(expV13, r3);
        complex s2 = mult(expV20, r0) + mult(expV21, r1)
                      + mult(expV22, r2) + mult(expV23, r3);
        complex s3 = mult(expV30, r0) + mult(expV31, r1)
                      + mult(expV32, r2) + mult(expV33, r3);

        if (topOrBottom == TOP) {
            fragColor = vec4(s0, s1);
        } else {
            fragColor = vec4(s2, s3);
        }
    }
}

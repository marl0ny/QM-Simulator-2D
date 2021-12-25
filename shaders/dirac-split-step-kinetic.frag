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
uniform sampler2D momentumTex;
uniform float dt;
uniform float m;
uniform float c;
uniform float hbar;

uniform int topOrBottom;
const int TOP = 0;
const int BOTTOM = 1;

#define complex vec2


complex mult(complex z1, complex z2) {
    return complex(z1.x*z2.x - z1.y*z2.y, 
                   z1.x*z2.y + z1.y*z2.x);
}

complex conj(complex z) {
    return vec2(z.x, -z.y);
}

void main() {

    vec4 momenta = texture2D(momentumTex, fragTexCoord);
    float px = momenta.x;
    float py = momenta.y;
    float pz = momenta.z;
    float p2 = momenta[3];
    float p = sqrt(momenta[3]);
    float mc = m*c;
    float omega = sqrt(mc*mc + p2);
    float den1 = p*sqrt((mc - omega)*(mc - omega) + p2);
    float den2 = p*sqrt((mc + omega)*(mc + omega) + p2);

    // The matrix U for the momentum step, where U e^{E} U^{\dagger}
    // Define each element for U
    float   matU00 = pz*(mc - omega)/den1;
    complex matU01 = (mc - omega)*complex(px, -py)/den1;
    float   matU02 = pz*(mc + omega)/den2;
    complex matU03 = (mc + omega)*complex(px, -py)/den2;
    complex matU10 = (mc - omega)*complex(px, py)/den1;
    float   matU11 = -pz*(mc - omega)/den1;
    complex matU12 = (mc + omega)*complex(px, py)/den2;
    float   matU13 = -pz*(mc + omega)/den2;
    float   matU20 = p2/den1;
    float   matU21 = 0.0;
    float   matU22 = p2/den2;
    float   matU23 = 0.0;
    float   matU30 = 0.0;
    float   matU31 = p2/den1;
    float   matU32 = 0.0;
    float   matU33 = p2/den2;

    // U^{\dagger}
    float   matUDag00 = matU00;
    complex matUDag01 = conj(matU10);
    float   matUDag02 = matU20;
    float   matUDag03 = matU30;
    complex matUDag10 = conj(matU01);
    float   matUDag11 = matU11;
    float   matUDag12 = matU21;
    float   matUDag13 = matU31;
    float   matUDag20 = matU02;
    complex matUDag21 = conj(matU12);
    float   matUDag22 = matU22;
    float   matUDag23 = matU32;
    complex matUDag30 = conj(matU03);
    float   matUDag31 = matU13;
    float   matUDag32 = matU23;
    float   matUDag33 = matU33;
    
    vec4 u = texture2D(uTex, fragTexCoord);
    vec4 v = texture2D(vTex, fragTexCoord);
    complex psi0 = u.xy;
    complex psi1 = u.zw;
    complex psi2 = v.xy;
    complex psi3 = v.zw;

    float cos_val = cos(0.5*omega*c*dt*hbar);
    float sin_val = sin(0.5*omega*c*dt*hbar); 
    complex e1 = complex(cos_val, sin_val); 
    complex e2 = complex(cos_val, -sin_val); 

    complex phi0 = mult(e1, matUDag00*psi0 + mult(matUDag01, psi1)
                        + matUDag02*psi2 + matUDag03*psi3);
    complex phi1 = mult(e1, mult(matUDag10, psi0) + matUDag11*psi1
                        + matUDag12*psi2 + matUDag13*psi3);
    complex phi2 = mult(e2, matUDag20*psi0 + mult(matUDag21, psi1)
                        + matUDag22*psi2 + matUDag23*psi3);
    complex phi3 = mult(e2, matUDag30*psi0 + matUDag31*psi1
                        + matUDag32*psi2 + matUDag33*psi3);

    if (topOrBottom == TOP) {
        fragColor = vec4(
            matU00*phi0 + mult(matU01, phi1)
             + matU02*phi2 + mult(matU03, phi3),
            mult(matU10, phi0) + matU11*phi1 + 
            mult(matU12, phi2) + matU13*phi3
        );
    } else if (topOrBottom == BOTTOM) {
        fragColor = vec4(
            matU20*phi0 + matU21*phi1 + matU22*phi2 + matU23*phi3,
            matU30*phi0 + matU31*phi1 + matU32*phi2 + matU33*phi3
        );
    }

}
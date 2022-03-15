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


    /*
    float phi = -dt*p2/(2.0*m*hbar);
    complex phase = complex(cos(phi), sin(phi));
    // complex phase = complex(1.0, 0.0);
    vec4 s;
    if (topOrBottom == TOP) {
        s = texture2D(uTex, fragTexCoord);
    } else {
        s = texture2D(vTex, fragTexCoord);
    } 
    fragColor = vec4(mult(s.xy, phase), mult(s.zw, phase));*/


    float mc = m*c;
    float omega = sqrt(mc*mc + p2);
    float den1 = p*sqrt((mc - omega)*(mc - omega) + p2);
    float den2 = p*sqrt((mc + omega)*(mc + omega) + p2);
    complex re = complex(1.0, 0.0);

    // The matrix U for the momentum step, where U e^{E} U^{\dagger}.
    // This is found by diagonalizing the matrix involving the mass
    // and momentum terms using a computer algebra system like Sympy,
    // which can be expressed as  U E inv(U), where E is the diagonal
    // matrix of eigenvalues and U is the matrix of eigenvectors. 
    // This is following what is similarly done in II.3 of this
    // article by Bauke and Keitel:
    // https://arxiv.org/abs/1012.3911

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

    float cos_val = cos(omega*c*dt/hbar);
    float sin_val = sin(omega*c*dt/hbar); 
    complex e1 = complex(cos_val, sin_val); 
    complex e2 = complex(cos_val, -sin_val);

    complex phi0 = matUDag00*psi0 + mult(matUDag01, psi1) + matUDag02*psi2 + matUDag03*psi3;
    complex phi1 = mult(matUDag10, psi0) + matUDag11*psi1 + matUDag12*psi2 + matUDag13*psi3;
    complex phi2 = matUDag20*psi0 + mult(matUDag21, psi1) + matUDag22*psi2 + matUDag23*psi3;
    complex phi3 = mult(matUDag30, psi0) + matUDag31*psi1 + matUDag32*psi2 + matUDag33*psi3;
    
    complex e1Phi0 = mult(e1, phi0);
    complex e1Phi1 = mult(e1, phi1);
    complex e2Phi2 = mult(e2, phi2);
    complex e2Phi3 = mult(e2, phi3);

    psi0 = matU00*e1Phi0 + mult(matU01, e1Phi1) + matU02*e2Phi2 + mult(matU03, e2Phi3);
    psi1 = mult(matU10, e1Phi0) + matU11*e1Phi1 + mult(matU12, e2Phi2) + matU13*e2Phi3;
    psi2 = matU20*e1Phi0 + matU21*e1Phi1 + matU22*e2Phi2 + matU23*e2Phi3;
    psi3 = matU30*e1Phi0 + matU31*e1Phi1 + matU32*e2Phi2 + matU33*e2Phi3;
    
    vec4 psi01 = vec4(mult(re, psi0), mult(re, psi1));
    vec4 psi23 = vec4(mult(re, psi2), mult(re, psi3));

    if (topOrBottom == TOP) {
        fragColor = psi01;
    } else if (topOrBottom == BOTTOM) {
        fragColor = psi23;
    }

}
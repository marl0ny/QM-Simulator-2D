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
uniform int laplacePoints;

float reValueAt(sampler2D texComplexFunc, vec2 location) {
    vec4 tmp = texture2D(texComplexFunc, location);
    return tmp.r*tmp.a;
}

float imagValueAt(sampler2D texComplexFunc, vec2 location) {
    vec4 tmp = texture2D(texComplexFunc, location);
    return tmp.g*tmp.a;
}

float getImagValuesAround(sampler2D texComplexFunc) {
    return (imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h)) +
            imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h)) +
            imagValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0)) +
            imagValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0)));
}

float getReValuesAround(sampler2D texComplexFunc) {
    return (reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h)) +
            reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h)) +
            reValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0)) +
            reValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0)));
}

void main() {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;
    vec4 psiIter = texture2D(texPsiIter, fragTexCoord);
    vec4 psi = texture2D(texPsi, fragTexCoord);
    float imDiag = dt*V/(2.0*hbar) + hbar*dt/(m*dx*dx);
    float reInvDiag = 1.0/(1.0 + imDiag*imDiag);
    float imInvDiag = -imDiag/(1.0 + imDiag*imDiag);
    float reTmp = psi.r;
    reTmp -= hbar*dt/(4.0*m*dx*dx)*getImagValuesAround(texPsiIter);
    float imTmp = psi.g;
    imTmp += hbar*dt/(4.0*m*dx*dx)*getReValuesAround(texPsiIter);
    fragColor = vec4(reInvDiag*reTmp - imInvDiag*imTmp,
                     imInvDiag*reTmp + reInvDiag*imTmp, 0.0, psi.a);
}

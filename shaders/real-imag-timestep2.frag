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


//   # #
// # # # #
// # # # #
//   # #
vec2 div2Psi_(sampler2D texPsi, vec2 coord) {
    float dw = dx/w;
    float dh = dy/h;
    vec2 uul = texture2D(texPsi, coord + vec2(-0.5*dw, 1.5*dh)).xy;
    vec2 uur = texture2D(texPsi, coord + vec2(0.5*dw, 1.5*dh)).xy;
    vec2 ul = texture2D(texPsi, coord + vec2(-0.5*dw, 0.5*dh)).xy;
    vec2 ull = texture2D(texPsi, coord + vec2(-1.5*dw, 0.5*dh)).xy;
    vec2 ur = texture2D(texPsi, coord + vec2(0.5*dw, 0.5*dh)).xy;
    vec2 urr = texture2D(texPsi, coord + vec2(1.5*dw, 0.5*dh)).xy;
    vec2 dl = texture2D(texPsi, coord + vec2(-0.5*dw, -0.5*dh)).xy;
    vec2 dll = texture2D(texPsi, coord + vec2(-1.5*dw, -0.5*dh)).xy;
    vec2 dr = texture2D(texPsi, coord + vec2(0.5*dw, -0.5*dh)).xy;
    vec2 drr = texture2D(texPsi, coord + vec2(1.5*dw, -0.5*dh)).xy;
    vec2 ddl = texture2D(texPsi, coord + vec2(-0.5*dw, -1.5*dh)).xy;
    vec2 ddr = texture2D(texPsi, coord + vec2(0.5*dw, -1.5*dh)).xy;
    // d2udy2 = 0.5*(((uul - ul)/dy - (dl - ddl)/dy)/(2.0*dy) + 
    //               ((uur - ur)/dy - (dr - ddr)/dy)/(2.0*dy))
    // d2udy2 = 0.25*((uul - ul)/dy^2 - (dl - ddl)/dy^2 + 
    //                (uur - ur)/dy^2 - (dr - ddr)/dy^2)
    // d2udy2 = 0.25*((uul - ul) - (dl - ddl) + (uur - ur) - (dr - ddr))/dy^2
    // d2udy2 = 0.25*((uul - ul - dl + ddl + uur - ur - dr + ddr))/dy^2
    // d2udx2 = 0.25*((urr - ur - ul + ull + drr - dr - dl + dll))/dx^2
    vec2 d2Psidx2 = (urr - ur - ul + ull + drr - dr - dl + dll)/(4.0*dx*dx);
    vec2 d2Psidy2 = (uul - ul - dl + ddl + uur - ur - dr + ddr)/(4.0*dy*dy);
    return d2Psidx2 + d2Psidy2;
}

vec2 div2Psi(sampler2D texPsi, vec2 coord) {
    float dw = dx/w;
    float dh = dy/h;
    vec2 uu = texture2D(texPsi, coord + vec2(0.0, dh)).xy;
    vec2 u = texture2D(texPsi, coord + 0.5*vec2(0.0, dh)).xy;
    vec2 d = texture2D(texPsi, coord + 0.5*vec2(0.0, -dh)).xy;
    vec2 dd = texture2D(texPsi, coord + vec2(0.0, -dh)).xy;
    vec2 ll = texture2D(texPsi, coord + vec2(-dw, 0.0)).xy;
    vec2 l = texture2D(texPsi, coord + 0.5*vec2(-dw, 0.0)).xy;
    vec2 r = texture2D(texPsi, coord + 0.5*vec2(dw, 0.0)).xy;
    vec2 rr = texture2D(texPsi, coord + vec2(dw, 0.0)).xy;
    // vec2 c = texture2D(texPsi, coord).xy;
    return 0.5*(uu - u - d + dd)/(dy*dy) + 0.5*(ll - l - r + rr)/(dx*dx);
}




void main() {
    vec2 coord1 = fragTexCoord + 0.5*vec2(dx/w, dy/h);
    vec2 coord2 = fragTexCoord - 0.0*vec2(dx/w, dy/h);
    float VR = (1.0 - rScaleV)*texture2D(texV, coord2).r + 
                        rScaleV*texture2D(texV, coord2).g;
    float VI = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                        rScaleV*texture2D(texV, fragTexCoord).g;
    vec2 psi1 = texture2D(texPsi1, fragTexCoord).xy;
    vec2 psi2 = texture2D(texPsi2, fragTexCoord).xy;
    vec2 psiR = texture2D(texPsi2, coord1).xy;
    vec2 psiI = texture2D(texPsi2, coord2).xy;
    vec2 div2PsiR = div2Psi(texPsi2, coord1);
    vec2 div2PsiI = div2Psi(texPsi2, coord2);
    vec2 hamiltonianPsiR = -(0.5*hbar*hbar/m)*div2PsiR + VR*psiR;
    vec2 hamiltonianPsiI = -(0.5*hbar*hbar/m)*div2PsiI + VI*psiI;
    fragColor = vec4(psi1.x + dt*hamiltonianPsiI.y/hbar,
                     psi1.y - dt*hamiltonianPsiR.x/hbar,
                     0.0, 0.0);
}
    
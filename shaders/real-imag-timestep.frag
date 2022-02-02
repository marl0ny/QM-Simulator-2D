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
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*c)/(dx*dx);
    } else {
        vec2 ul = valueAt(texPsi, fragTexCoord + vec2(-dx/w, dy/h));
        vec2 ur = valueAt(texPsi, fragTexCoord + vec2(dx/w, dy/h));
        vec2 dl = valueAt(texPsi, fragTexCoord + vec2(-dx/w, -dy/h));
        vec2 dr = valueAt(texPsi, fragTexCoord + vec2(dx/w, -dy/h));
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*c)/(dx*dx);
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

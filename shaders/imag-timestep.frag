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


float getDiv2RePsi(float rePsi) {
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).r;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).r;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).r;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).r;
    // Reference for different Laplacian stencil choices:
    // Wikipedia contributors. (2021, February 17)
    // Discrete Laplacian Operator 
    // 1.5.1 Implementation via operator discretization
    // https://en.wikipedia.org/wiki/Discrete_Laplace_operator
    // #Implementation_via_operator_discretization
    if (laplacePoints <= 5) {
        return (u + d + l + r - 4.0*rePsi)/(dx*dx);
    } else {
        float ul = texture2D(texPsi, fragTexCoord + vec2(-dx/w, dy/h)).r;
        float ur = texture2D(texPsi, fragTexCoord + vec2(dx/w, dy/h)).r;
        float dl = texture2D(texPsi, fragTexCoord + vec2(-dx/w, -dy/h)).r;
        float dr = texture2D(texPsi, fragTexCoord + vec2(dx/w, -dy/h)).r;
        return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l + 
                0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);
    }
}

void main () {
    float V = texture2D(texV, fragTexCoord).r;
    /*float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
                rScaleV*texture2D(texV, fragTexCoord).g;*/
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float div2RePsi = getDiv2RePsi(rePsi);
    float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + V*rePsi;
    fragColor = vec4(rePsi, imPsi - hamiltonRePsi*dt/hbar, 0.0, 1.0);
}
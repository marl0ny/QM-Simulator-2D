// del^2 phi = -rho
// E = - del phi
// del E = rho
// (LU + D)x = b
// (D^-1LU + 1)x =  D^-1b
// D^-1LU x + x =  D^-1b
// x =  D^-1b - D^-1LU x
// x =  D^-1(b - LU x)


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
uniform float w;
uniform float h;
uniform float bScale;
uniform int laplacianType;
uniform sampler2D bTex;
uniform sampler2D prevTex;

const int FIVE_POINT = 5;
const int NINE_POINT = 9;

void main() {
    // laplacian x = (x_u + x_d + x_l + x_r - 4.0*x_c)/dx**2
    // diag = -4.0/dx**2;
    vec4 u = texture2D(prevTex, fragTexCoord + vec2(0.0, dy/h));
    vec4 d = texture2D(prevTex, fragTexCoord + vec2(0.0, -dy/h));
    vec4 l = texture2D(prevTex, fragTexCoord + vec2(-dx/w, 0.0));
    vec4 r = texture2D(prevTex, fragTexCoord + vec2(dx/w, 0.0));
    vec4 b = texture2D(bTex, fragTexCoord);
    if (laplacianType <= FIVE_POINT) {
        fragColor = bScale*b*dx*dx/4.0 + (u + d + l + r)/4.0;
    } else {
        // 0.5*(u + d + l + r)/dx^2 
        // + 0.25*(ur + ul + dl + dr)/dx^2 - 3.0*c/dx^2
        vec4 ul = texture2D(prevTex, fragTexCoord + vec2(-dx/w, dy/h));
        vec4 ur = texture2D(prevTex, fragTexCoord + vec2(dx/w, dy/h));
        vec4 dl = texture2D(prevTex, fragTexCoord + vec2(-dx/w, -dy/h));
        vec4 dr = texture2D(prevTex, fragTexCoord + vec2(dx/w, -dy/h));
        fragColor = -(-bScale*b*dx*dx - (u + d + l + r)/2.0 
                      - (ul + ur + dl + dr)/4.0)/3.0;
    }
}

precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
const float pi = 3.141592653589793;
uniform float m;
uniform float hbar;
uniform float w;
uniform float h;
uniform float t;


// COEFFICIENTS HERE

 
// COEFFICIENTS END

void main() {
    vec2 psi = vec2(0.0, 0.0);
    float E;
    float psin0;
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    // ADD EIGENSTATES HERE

 
// ADD EIGENSTATES END
    gl_FragColor = vec4(psi, 0.0, 1.0);
}
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D texV;
uniform float dt;
uniform float hbar;

void main() {
    vec4 potential = texture2D(texV, fragTexCoord);
    float reV = potential[0];
    // TODO: do imaginary potentials as well.
    // float imV = potential[2]; 
    fragColor = vec4(cos(0.5*reV*dt/hbar), sin(0.5*reV*dt/hbar), 0.0, 1.0);
}

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
    float imV = potential[2];
    // Arg = -i*0.5*(reV + i*imV)*dt/hbar = 0.5*(-i*reV + imV)*dt/hbar
    float imArg = -0.5*reV*dt/hbar;
    float reArg = 0.5*imV*dt/hbar;
    fragColor = vec4(exp(reArg)*cos(imArg), exp(reArg)*sin(imArg), 0.0, 1.0);
}

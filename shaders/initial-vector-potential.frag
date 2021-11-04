precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int potentialType;

uniform float cx;
uniform float cy;

#define UNIFORM_MAGNETIC 1

void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    if (potentialType == UNIFORM_MAGNETIC) {
        fragColor = vec4(cx*(y - 0.5), -cy*(x - 0.5), 0.0, 1.0);
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
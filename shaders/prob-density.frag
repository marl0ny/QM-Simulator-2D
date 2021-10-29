precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex;


void main() {
    vec4 col = texture2D(tex, fragTexCoord);
    float probDensity = col.r*col.r + col.g*col.g;
    fragColor = vec4(probDensity, 0.0, 0.0, 1.0);
}

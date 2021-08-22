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
    vec2 st = vec2(fragTexCoord.x, 1.0 - fragTexCoord.y);
    vec4 col = texture2D(tex, st);
    float avgCol = (col.r + col.g + col.b)/3.0;
    fragColor = vec4(avgCol, avgCol/2.0, 0.0, 1.0);
    // fragColor = vec4(col[0], col[1], col[2], 1.0);
}
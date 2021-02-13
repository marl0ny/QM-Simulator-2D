precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;
uniform float bx;
uniform float by;
uniform float v2;


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    if ((xy.x - bx)*(xy.x - bx) < 0.0001 && (xy.y - by)*(xy.y - by) < 0.0001
         && initialV < v2) {
        fragColor = vec4(v2, initialV, 0.0, 1.0);
    } else {
        fragColor = vec4(initialV, initialV, 0.0, 1.0);
    }
}

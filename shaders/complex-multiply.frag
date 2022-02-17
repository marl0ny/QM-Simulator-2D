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
uniform sampler2D tex2;
uniform int layoutType;

const int RE_IM_0_ALPHA2_LAYOUT = 0;
// const int RE_IM_0_ALPHA1_LAYOUT = 1;
const int RE_IM_RE_IM_LAYOUT = 2;


void main() {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    if (layoutType == RE_IM_0_ALPHA2_LAYOUT) {
        fragColor = vec4(col1.r*col2.r - col1.g*col2.g,
                         col1.r*col2.g + col1.g*col2.r, 0.0, col2.a);
    } else {
        fragColor = vec4(col1.r*col2.r - col1.g*col2.g, 
                         col1.r*col2.g + col1.g*col2.r,
                         col1.b*col2.b - col1.a*col2.a, 
                         col1.b*col2.a + col1.a*col2.b);
    }

}
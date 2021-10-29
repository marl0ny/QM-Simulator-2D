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


void main() {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    fragColor = vec4(col1.r*col2.r - col1.g*col2.g, 
                     col1.r*col2.g + col1.g*col2.r, 0.0, 1.0);

}
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float scale1;
uniform float scale2;
uniform sampler2D tex1;
uniform sampler2D tex2;

void main () {
    vec2 coord = vec2(fragTexCoord.x, 1.0 - fragTexCoord.y);
    vec4 col1 = scale1*texture2D(tex1, coord);
    vec4 col2 = scale2*texture2D(tex2, coord);
    fragColor = vec4(col1.rgb + col2.rgb, 1.0); 
}

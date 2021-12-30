precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;

void main() {
    vec4 v0 = texture2D(tex0, fragTexCoord);
    vec4 v1 = texture2D(tex1, fragTexCoord);
    vec4 v2 = texture2D(tex2, fragTexCoord);
    vec4 diff = v2 - v1;
    fragColor = vec4(diff.x*diff.x + diff.y*diff.y + diff.z*diff.z,
                     v0.x*v0.x + v0.y*v0.y + v0.z*v0.z, 0.0, 
                     0.0);
}

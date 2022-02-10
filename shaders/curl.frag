precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform sampler2D tex;
uniform int type;

int FOWARD = 0;
int CENTRED = 1;
int BACKWARD = 2;

void main() {
    // Dy Az - Dz Ay, -Dx Az + Dz Ax, Dx Ay - Dy Ax
    vec4 u, d, l, r;
    if (type == FOWARD) {
        /*vec4 cc = texture2D(tex, fragTexCoord);
        vec4 rc = texture2D(tex, fragTexCoord + vec2(dx/w, 0.0));
        vec4 cu = texture2D(tex, fragTexcoord + vec2(0.0, dy/h));
        vec4 ru = texture2D(tex, fragTexcoord + vec2(dx/w, dy/h));
        vec4 u = (cu + ru)/2.0;
        vec4 d = (cc + rc)/2.0;
        vec4 l = (cc + cu)/2.0;
        vec4 r = (ru + rc)/2.0;*/
        vec4 u = texture2D(tex, fragTexCoord + vec2(0.5*dx/w, dy/h));
        vec4 d = texture2D(tex, fragTexCoord + vec2(0.5*dx/w, 0.0));
        vec4 l = texture2D(tex, fragTexCoord + vec2(0.0, 0.5*dy/h));
        vec4 r = texture2D(tex, fragTexCoord + vec2(dx/w, 0.5*dy/h));
    } else if (type == CENTRED) {
        vec4 u = 0.5*texture2D(tex, fragTexCoord + vec2(0.0, dy/h));
        vec4 d = 0.5*texture2D(tex, fragTexCoord + vec2(0.0, -dy/h));
        vec4 l = 0.5*texture2D(tex, fragTexCoord + vec2(-dx/w, 0.0));
        vec4 r = 0.5*texture2D(tex, fragTexCoord + vec2(dx/w, 0.0));
    } else if (type == BACKWARD) {
        vec4 u = texture2D(tex, fragTexCoord + vec2(-0.5*dx/w, 0.0));
        vec4 d = texture2D(tex, fragTexCoord + vec2(-0.5*dx/w, -dy/h));
        vec4 l = texture2D(tex, fragTexCoord + vec2(-dx/w, -0.5*dy/h));
        vec4 r = texture2D(tex, fragTexCoord + vec2(0.0, -0.5*dy/h));
    }
    vec4 dAdx = (r - l)/dx;
    vec4 dAdy = (u - d)/dy;
    vec3 curl = vec3(dAdy.z, -dAdx.z, dAdx.y - dAdy.x);
    fragColor = vec4(curl, 1.0);
}
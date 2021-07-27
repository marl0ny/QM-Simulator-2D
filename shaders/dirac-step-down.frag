precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float dt;
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform float c;
uniform sampler2D vTex;
uniform sampler2D uTex;
uniform sampler2D potTex;

void main() {

    vec2 xy = fragTexCoord;

    vec4 dUdx = (texture2D(uTex, vec2(xy.x, xy.y-0.5*dy/h))
                 - texture2D(uTex, vec2(xy.x-dx/w, xy.y-0.5*dy/h)))/dx;
    vec4 dUdy = (texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y))
                 - texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y-dy/h)))/dy;
    vec4 u = vec4(-dUdx[2] - dUdy[3], dUdy[2] - dUdx[3],
                  -dUdx[0] + dUdy[1], -dUdy[0] - dUdx[1]);

    float b = 0.5*(dt/hbar)*(-m*c*c
                             + c*(texture2D(potTex, 
                                            xy-0.5*vec2(dx/w, dy/h))[0]));
    float den = (1.0 + b*b);
    vec4 prevV = texture2D(vTex, xy);
    vec4 v = vec4(dot(vec4(1.0 - b*b, 2.0*b,  0.0, 0.0), prevV)/den,
                  dot(vec4(-2.0*b, 1.0 - b*b, 0.0, 0.0), prevV)/den,
                  dot(vec4(0.0, 0.0,  1.0 - b*b, 2.0*b), prevV)/den,
                  dot(vec4(0.0, 0.0, -2.0*b, 1.0 - b*b), prevV)/den);

    fragColor = v + c*dt*u;
}

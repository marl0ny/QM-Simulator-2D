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

    vec4 dVdx = (texture2D(vTex, vec2(xy.x+dx/w, xy.y+0.5*dy/h))
                 - texture2D(vTex, vec2(xy.x, xy.y+0.5*dy/h)))/dx;
    vec4 dVdy = (texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y+dy/h))
                 - texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y)))/dy;
    vec4 vDerivatives = vec4(-dVdx[2] - dVdy[3], dVdy[2] - dVdx[3],
                             -dVdx[0] + dVdy[1], -dVdy[0] - dVdx[1]);
    float a = 0.5*(dt/hbar)*(m*c*c + c*texture2D(potTex, xy)[0]);
    float den = (1.0 + a*a);
    vec4 v = vec4(dot(vec4(1.0, a,  0.0, 0.0), vDerivatives)/den,
                  dot(vec4(-a, 1.0, 0.0, 0.0), vDerivatives)/den,
                  dot(vec4(0.0, 0.0, 1.0, a),  vDerivatives)/den,
                  dot(vec4(0.0, 0.0, -a, 1.0), vDerivatives)/den);

    vec4 prevU = texture2D(uTex, xy);
    vec4 u = vec4(dot(vec4(1.0 - a*a, 2.0*a,  0.0, 0.0), prevU)/den,
                  dot(vec4(-2.0*a, 1.0 - a*a, 0.0, 0.0), prevU)/den,
                  dot(vec4(0.0, 0.0,  1.0 - a*a, 2.0*a), prevU)/den,
                  dot(vec4(0.0, 0.0, -2.0*a, 1.0 - a*a), prevU)/den);

    fragColor = u + c*dt*v;
}

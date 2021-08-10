precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float bx;
uniform float by;
uniform float kx;
uniform float ky;
uniform float sx;
uniform float sy;
uniform float amp;
uniform float m;
uniform float c;
uniform float w;
uniform float h;
uniform float pixelW;
uniform float pixelH;
uniform float t;
uniform float hbar;
float sqrt2 = 1.4142135623730951; 
float pi = 3.141592653589793;

void main () {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    float u = ((x - bx)/(sx*sqrt2));
    float v = ((y - by)/(sy*sqrt2));
    float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));
    float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));
    if ((kx == 0.0 && ky == 0.0) || m == 0.0) {
        fragColor = vec4(re, im, 0.0, 0.0);
    } else {
        float mc = m*c;
        float px = 2.0*pi*kx/w;
        float py = 2.0*pi*ky/h;
        float p2 = px*px + py*py;
        float p = sqrt(p2);
        float omega = sqrt(mc*mc + p2);
        float energy = omega*c;
        float den = p*sqrt((mc + omega)*(mc + omega) + p2);
        // The free particle positive energy normalized eigenstates are found
        // by diagonalizing the alpha_i p_i + beta m c matrix.
        // This can be done symbolically using a coputer algebra system
        // like Sympy.
        // More info found here: https://en.wikipedia.org/wiki/Dirac_spinor.
        float reS1 = px*(mc + omega)/den;
        float imS1 = -py*(mc + omega)/den;
        float reExpEnergy = cos(t*energy/hbar);
        float imExpEnergy = sin(t*energy/hbar);
        float re2 = re*reExpEnergy - im*imExpEnergy;
        float im2 = re*imExpEnergy + im*reExpEnergy;
        fragColor = vec4(reS1*re2 - imS1*im2, reS1*im2 + imS1*re2, 0.0, 0.0);
    }
}

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
uniform float px;
uniform float py;
uniform float sx;
uniform float sy;
uniform float amp;
float sqrt2 = 1.4142135623730951; 
float pi = 3.141592653589793;

void main () {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    float u = ((x - bx)/(sx*sqrt2));
    float v = ((y - by)/(sy*sqrt2));
    float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(px*x + py*y));
    float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(px*x + py*y));
    fragColor = vec4(re, im, 0.0, 0.0); 
}

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
uniform float pixelW;
uniform float pixelH;
uniform float t;
uniform float hbar;
uniform vec4 initSpinor;
uniform float staggeredOffset;
float sqrt2 = 1.4142135623730951; 
float pi = 3.141592653589793;

#define complex vec2

complex mult(complex z1, complex z2) {
    return complex(z1.x*z2.x - z1.y*z2.y, 
                   z1.x*z2.y + z1.y*z2.x);
}

complex conj(complex z) {
    return vec2(z.x, -z.y);
}

void main () {
    float x = fragTexCoord.x - staggeredOffset/pixelW;
    float y = fragTexCoord.y - staggeredOffset/pixelH;
    float u = ((x - bx)/(sx*sqrt2));
    float v = ((y - by)/(sy*sqrt2));
    float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));
    float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));
    fragColor = vec4(mult(initSpinor.xy, complex(re, im)), 
                         mult(initSpinor.zw, complex(re, im)));
    /*if ((kx == 0.0 && ky == 0.0)
        // || m == 0.0
        ) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        fragColor = vec4(mult(initSpinor.xy, complex(re, im)), 
                         mult(initSpinor.zw, complex(re, im)));
    }*/
}

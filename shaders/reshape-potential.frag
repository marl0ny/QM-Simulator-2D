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
uniform int drawMode;
uniform int eraseMode;
uniform float drawWidth;
uniform float bx;
uniform float by;
uniform float v2;

#define DRAW_SQUARE 0
#define DRAW_CIRCLE 1
#define DRAW_GAUSS 2


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    float drawW2 = drawWidth*drawWidth;
    float r2 = (xy.x - bx)*(xy.x - bx) 
                + (xy.y - by)*(xy.y - by);
    if (initialV < v2 || eraseMode == 1) {
        if ((drawMode == DRAW_SQUARE && 
            (xy.x - bx)*(xy.x - bx) < drawW2 && 
            (xy.y - by)*(xy.y - by) < drawW2) ||
            (drawMode == DRAW_CIRCLE && r2 < drawW2)) {
            fragColor = vec4(v2, initialV, 0.0, 1.0);
        } else if (drawMode == DRAW_GAUSS) {
            float tmp = exp(-0.5*r2/(2.0*drawW2));
            fragColor = vec4(max(tmp + initialV, initialV), 
                             initialV, 0.0, 1.0);
        } else {
            fragColor = vec4(initialV, initialV, 0.0, 1.0);
        }
    } else {
        fragColor = vec4(initialV, initialV, 0.0, 1.0);
    }
}

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
uniform float drawHeight;
uniform float bx;
uniform float by;
uniform float v2;

#define DRAW_SQUARE 0
#define DRAW_CIRCLE 1
#define DRAW_GAUSS 2


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    // float imagV = texture2D(tex1, fragTexCoord).b;
    float imagV = 0.0;
    float drawW2 = drawWidth*drawWidth;
    float drawH2 = drawHeight*drawHeight;
    float x2 = (xy.x - bx)*(xy.x - bx);
    float y2 = (xy.y - by)*(xy.y - by);
    // float r2 = x2 + y2;
    if (initialV < v2 || eraseMode == 1) {
        if ((drawMode == DRAW_SQUARE && 
            x2 < drawW2 && y2 < drawH2) ||
            (drawMode == DRAW_CIRCLE && x2*(drawH2/drawW2) + y2 < drawH2)) {
            fragColor = vec4(v2, initialV, 0.0, 1.0);
        } else if (drawMode == DRAW_GAUSS) {
            float tmp = exp(-0.25*(x2/drawW2 + y2/drawH2));
            if (eraseMode == 0) {
                fragColor = vec4(max(tmp + initialV, initialV), 
                                     initialV, imagV, 1.0);
            } else {
                fragColor = vec4(max(initialV - tmp, 0.0), 
                                     initialV, imagV, 1.0);
            }
        } else {
            fragColor = vec4(initialV, initialV, imagV, 1.0);
        }
    } else {
        fragColor = vec4(initialV, initialV, imagV, 1.0);
    }
}
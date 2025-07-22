/* Reverse bit sort a texture whose width and height must be a power
of two.*/
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex;
uniform int width;
uniform int height;

bool revBitSort2SingleIter(inout int rev, inout int i,
                           inout int asc, inout int des, int stop) {
    if (i/des > 0) {
        rev += asc;
	i -= des;
    }
    des /= 2, asc *= 2;
    if (asc == 2*stop)
        return false;
    return true;
}

/* Older versions of GLSL do not support for loops.
 This very long function is used to reverse bit sort a finite-sized
 input texture with power of two dimensions without using any for loops.
 For more modern versions of GLSL a different implementation of reverse
 bit sorting which includes for loops is used instead.
*/
float revBitSort2SingleDimension(int index, int size) {
    int rev = 0, i = index;
    int asc = 1, des = size/2;
    float retVal;
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    if (!revBitSort2SingleIter(rev, i, asc, des, size/2))
        retVal = (float(rev) + 0.5)/float(size);
    return retVal;
}

vec2 revBitSort2NoForLoop(vec2 uv) {
    int indexU = int(floor(uv[0]*float(width)));
    int indexV = int(floor(uv[1]*float(height)));
    return vec2(
        revBitSort2SingleDimension(indexU, width),
        revBitSort2SingleDimension(indexV, height)
    );
}

vec2 revBitSort2(vec2 uv) {
    #if (!defined(GL_ES) && __VERSION__ >= 120) || (defined(GL_ES) && __VERSION__ > 300)
    vec2 uv2 = vec2(0.0, 0.0);
    int indexU = int(floor(uv[0]*float(width)));
    int indexV = int(floor(uv[1]*float(height)));
    int rev = 0, i = indexU;
    for (int asc = 1, des = width/2; des > 0; des /= 2, asc *= 2) {
        if (i/des > 0) {
            rev += asc;
            i -= des;
        }
    }
    uv2[0] = (float(rev) + 0.5)/float(width);
    rev = 0, i = indexV;
    for (int asc = 1, des = height/2; des > 0; des /= 2, asc *= 2) {
        if (des > i) {
            rev += asc;
            i -= des;
        }
    }
    uv2[1] = (float(rev) + 0.5)/float(height);
    return uv2;
    #else
    return revBitSort2NoForLoop(uv);
    #endif
}

void main() {
    fragColor = texture2D(tex, revBitSort2(fragTexCoord));
}

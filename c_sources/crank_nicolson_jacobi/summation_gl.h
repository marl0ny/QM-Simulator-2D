#include "gl_wrappers/gl_wrappers.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _SUMMATION_GL_
#define _SUMMATION_GL_

#define MAX_NUMBER_OF_SUMMATION_FRAMES 12

struct SummationFrames {
    // Support texture size of up to 2^13x2^13 or 8192x8192
    frame_id ind[MAX_NUMBER_OF_SUMMATION_FRAMES];
    int n;
};

typedef struct SummationFrames SummationFrames;

struct Vec4 sum_vec4_array(int width, int height,
                           const struct Vec4 *arr);

struct Vec4 texture_reduction_sum(int scale_program,
                                  frame_id init_quad,
                                  SummationFrames *frames);

SummationFrames init_summation_frames(struct TextureParams tex_params,
                                      int n);

#endif

#ifdef __cplusplus
}
#endif


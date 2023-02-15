#include "gl_wrappers/gl_wrappers.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _SUMMATION_GL_
#define _SUMMATION_GL_


struct Vec4 sum_vec4_array(int width, int height,
                           const struct Vec4 *arr);

struct Vec4 texture_reduction_sum(int scale_program,
                                  frame_id init_quad, frame_id *sum_quads,
                                  size_t init_size);

#endif

#ifdef __cplusplus
}
#endif


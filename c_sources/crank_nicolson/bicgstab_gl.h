/*

References used for the BiCGSTAB algorithm:

- Wikipedia contributors. (2022, June 2).
  Biconjugate gradient stabilized method
  https://en.wikipedia.org/wiki/Biconjugate_gradient_stabilized_method.
  In Wikipedia, The Free Encyclopedia.

- Gutknecht, M. (1993).
  Variants of BICGSTAB for Matrices with Complex Spectrum.
  SIAM Journal on Scientific Computing, 14(5). 1020-1033.
  https://doi.org/10.1137/0914062

*/

#include "gl_wrappers/gl_wrappers.h"
#include "complex2/complex2.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _BICGSTAB_GL
#define _BICGSTAB_GL

struct BiCGSTABController {
    frame_id *quads;
    GLuint scale_program, copy_program;
    GLuint inner_product_program;
    GLuint add_program, add3_program;
    GLuint subtract_program;
    frame_id *sum_quads;
    int size;
    int min_iter, max_iter;
};

struct BiCGSTABResult {
    frame_id result;
    int number_of_iterations;
};

struct BiCGSTABResult bicgstab(const struct BiCGSTABController *controls,
                               void (* transform)
                               (frame_id y, void *data, frame_id x),
                               void *data, frame_id x0, frame_id b);

#endif
#ifdef __cplusplus
}
#endif

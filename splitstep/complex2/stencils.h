#include "complex2.h"

#ifdef __cplusplus
extern "C" {
#endif


#ifndef _STENCILS_
#define _STENCILS_


struct Complex2 centred_x_derivative_4thorder(struct Complex2 *z,
                                              int i, int j,
                                              int height, int width,
                                              float dx);

struct Complex2 centred_y_derivative_4thorder(struct Complex2 *z,
                                              int i, int j,
                                              int height, int width,
                                              float dy);

struct Complex2 laplacian_4thorder_9point(struct Complex2 *z,
                                          int i, int j,
                                          int height, int width,
                                          float dx, float dy);


#endif

#ifdef __cplusplus
}
#endif

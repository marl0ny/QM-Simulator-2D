#include "stencils.h"


struct Complex2 centred_x_derivative_4thorder(struct Complex2 *z,
                                              int i, int j, 
                                              int height, int width,
                                              float dx) {
    int ind_r2 = i*width + (j + 2) % width;
    int ind_r1 = i*width + (j + 1) % width;
    int ind_l1 = i*width + ((j == 0)? width - 1: j - 1);
    int ind_l2 = i*width + (((j - 2) < 0)? width + j - 2: j - 2);
    struct Complex2 *r2 = &z[ind_r2], *r1 = &z[ind_r1];
    struct Complex2 *l1 = &z[ind_l1], *l2 = &z[ind_l2];
    struct Complex2 div_x;
    div_x.c2[0] = (-r2->c2[0]/12.0 + 2.0*r1->c2[0]/3.0
                    - 2.0*l1->c2[0]/3.0 + l2->c2[0]/12.0)/dx;
    div_x.c2[1] = (-r2->c2[1]/12.0 + 2.0*r1->c2[1]/3.0
                    - 2.0*l1->c2[1]/3.0 + l2->c2[1]/12.0)/dx;
    return div_x;
}

struct Complex2 centred_y_derivative_4thorder(struct Complex2 *z,
                                              int i, int j, 
                                              int height, int width,
                                              float dy) {
    int ind_u2 = ((i + 2) % height)*width + j;
    int ind_u1 = ((i + 1) % height)*width + j;
    int ind_d1 = ((i == 0)? height - 1: i - 1)*width + j;
    int ind_d2 = (((i - 2) < 0)? height + i - 2: i - 2)*width + j;
    struct Complex2 *u2 = &z[ind_u2], *u1 = &z[ind_u1];
    struct Complex2 *d1 = &z[ind_d1], *d2 = &z[ind_d2];
    struct Complex2 div_y;
    div_y.c2[0] = (-u2->c2[0]/12.0 + 2.0*u1->c2[0]/3.0
                   - 2.0*d1->c2[0]/3.0 + d2->c2[0]/12.0)/dy;
    div_y.c2[1] = (-u2->c2[1]/12.0 + 2.0*u1->c2[1]/3.0
                   - 2.0*d1->c2[1]/3.0 + d2->c2[1]/12.0)/dy;
    return div_y;
}

struct Complex2 laplacian_4thorder_9point(struct Complex2 *z, 
                                          int i, int j, 
                                          int height, int width,
                                          float dx, float dy) {
    float dx2 = dx*dx, dy2 = dy*dy;
    int ind_c0 = i*width + j;
    int ind_u2 = ((i + 2) % height)*width + j;
    int ind_u1 = ((i + 1) % height)*width + j;
    int ind_d1 = ((i == 0)? height - 1: i - 1)*width + j;
    int ind_d2 = (((i - 2) < 0)? height + i - 2: i - 2)*width + j;
    int ind_r2 = i*width + (j + 2) % width;
    int ind_r1 = i*width + (j + 1) % width;
    int ind_l1 = i*width + ((j == 0)? width - 1: j - 1);
    int ind_l2 = i*width + (((j - 2) < 0)? width + j - 2: j - 2);
    struct Complex2 *c0 = &z[ind_c0];
    struct Complex2 *u2 = &z[ind_u2], *u1 = &z[ind_u1];
    struct Complex2 *d1 = &z[ind_d1], *d2 = &z[ind_d2];
    struct Complex2 *r2 = &z[ind_r2], *r1 = &z[ind_r1];
    struct Complex2 *l1 = &z[ind_l1], *l2 = &z[ind_l2];
    struct Complex2 div2_x, div2_y;
    div2_x.c2[0] = (-r2->c2[0]/12.0 + 4.0*r1->c2[0]/3.0
                    - 5.0*c0->c2[0]/2.0
                    + 4.0*l1->c2[0]/3.0 - l2->c2[0]/12.0)/dx2;
    div2_x.c2[1] = (-r2->c2[1]/12.0 + 4.0*r1->c2[1]/3.0
                    - 5.0*c0->c2[1]/2.0
                    + 4.0*l1->c2[1]/3.0 - l2->c2[1]/12.0)/dx2;
    div2_y.c2[0] = (-u2->c2[0]/12.0 + 4.0*u1->c2[0]/3.0
                    - 5.0*c0->c2[0]/2.0
                    + 4.0*d1->c2[0]/3.0 - d2->c2[0]/12.0)/dy2;
    div2_y.c2[1] = (-u2->c2[1]/12.0 + 4.0*u1->c2[1]/3.0
                    - 5.0*c0->c2[1]/2.0
                    + 4.0*d1->c2[1]/3.0 - d2->c2[1]/12.0)/dy2;
    struct Complex2 div2;
    div2.c2[0] = div2_x.c2[0] + div2_y.c2[0];
    div2.c2[1] = div2_x.c2[1] + div2_y.c2[1];
    return div2;
}
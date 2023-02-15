#include <math.h>
#include "summation_gl.h"
#include "bicgstab_gl.h"


static void swap2(frame_id *f1, frame_id *f2) {
    frame_id tmp  = *f1;
    *f1 = *f2;
    *f2 = tmp;
}

static void c2_copy(struct Complex2 *dst, const struct Complex2 *src) {
    dst->c2[0] = src->c2[0];
    dst->c2[1] = src->c2[1];
}

struct Complex2 c2_div(const struct Complex2 *num,
                       const struct Complex2 *den) {
    struct Complex2 frac;
    frac.c2[0] = num->c2[0]/den->c2[0];
    frac.c2[1] = num->c2[1]/den->c2[1];
    return frac;
}

struct Complex2 c2_inv(const struct Complex2 *z) {
    struct Complex2 inv_z;
    inv_z.c2[0] = 1.0/z->c2[0];
    inv_z.c2[1] = 1.0/z->c2[1];
    return inv_z;
}

struct Complex2 c2_mul(const struct Complex2 *z1,
                       const struct Complex2 *z2) {
    struct Complex2 w;
    w.c2[0] = z1->c2[0]*z2->c2[0];
    w.c2[1] = z1->c2[1]*z2->c2[1];
    return w;
}

struct Complex2 c2_inner_prod(const struct Complex2 *z1,
                              const struct Complex2 *z2) {
    struct Complex2 res;
    res.c2[0] = conjf(z1->c2[0])*z2->c2[0];
    res.c2[1] = conjf(z1->c2[1])*z2->c2[1];
    return res;
}

struct InnerProductControls {
    frame_id *sum_quads;
    frame_id product;
    int size;
    GLuint inner_product_program;
    GLuint scale_program;
};

static struct Complex2 inner_product(frame_id v1, frame_id v2,
                                     struct InnerProductControls *controls) {
    frame_id *sum_quads = controls->sum_quads;
    frame_id v1_v2 = controls->product;
    int size = controls->size;
    GLuint inner_product_program = controls->inner_product_program;
    GLuint scale_program = controls->scale_program;
    bind_quad(v1_v2, inner_product_program);
    set_sampler2D_uniform("tex1", v1);
    set_sampler2D_uniform("tex2", v2);
    draw_unbind();
    struct Vec4 res = texture_reduction_sum(scale_program,
                                            v1_v2, sum_quads,
                                            size);
    struct Complex2 c_res;
    c2_copy(&c_res, (struct Complex2 *)&res);
    return c_res;
}

static void add(GLuint add_program, frame_id res,
                const struct Complex2 *s1, frame_id v1,
                const struct Complex2 *s2, frame_id v2) {
    bind_quad(res, add_program);
    set_vec4_uniform("scale1",
                     s1->ind[0], s1->ind[1],
                     s1->ind[2], s1->ind[3]);
    set_sampler2D_uniform("tex1", v1);
    set_vec4_uniform("scale2",
                     s2->ind[0], s2->ind[1],
                     s2->ind[2], s2->ind[3]);
    set_sampler2D_uniform("tex2", v2);
    draw_unbind();
}

static void add3(GLuint add_program, frame_id res,
                 const struct Complex2 *s1, frame_id v1,
                 const struct Complex2 *s2, frame_id v2,
                 const struct Complex2 *s3, frame_id v3) {
    bind_quad(res, add_program);
    set_vec4_uniform("scale1",
                     s1->ind[0], s1->ind[1],
                     s1->ind[2], s1->ind[3]);
    set_sampler2D_uniform("tex1", v1);
    set_vec4_uniform("scale2",
                     s2->ind[0], s2->ind[1],
                     s2->ind[2], s2->ind[3]);
    set_sampler2D_uniform("tex2", v2);
    set_vec4_uniform("scale3",
                     s3->ind[0], s3->ind[1],
                     s3->ind[2], s3->ind[3]);
    set_sampler2D_uniform("tex3", v3);
    draw_unbind();
}

static void subtract(GLuint add_program, frame_id res,
                     const struct Complex2 *s1, frame_id v1,
                     const struct Complex2 *s2, frame_id v2) {
    bind_quad(res, add_program);
    set_vec4_uniform("scale1",
                     s1->ind[0], s1->ind[1],
                     s1->ind[2], s1->ind[3]);
    set_sampler2D_uniform("tex1", v1);
    set_vec4_uniform("scale2",
                     -s2->ind[0], -s2->ind[1],
                     -s2->ind[2], -s2->ind[3]);
    set_sampler2D_uniform("tex2", v2);
    draw_unbind();
}

static int continue_iteration(int i, int min_iter, int max_iter,
                              const struct Complex2 *norm_residual2,
                              const struct Complex2 *epsilon) {
    return ((cabsf(norm_residual2->c2[0]) > cabsf(epsilon->c2[0]) ||
             cabsf(norm_residual2->c2[1]) > cabsf(epsilon->c2[1]))
            || i < min_iter) && i < max_iter;
}

static void copy(GLuint copy_program, frame_id dst, frame_id src) {
    bind_quad(dst, copy_program);
    set_sampler2D_uniform("tex", src);
    draw_unbind();
}

#include <stdio.h>


/*
  Unpreconditioned BiCGSTAB algorithm.
  
  The reference used for implementing this function
  is pseudocode given in the article
  "Variants of BICGSTAB for Matrices with Complex Spectrum"
  by Martin H. Gutknecht
  (Siam Journal of Scientific Computing,
   Vol 14, No. 5, pg 1020-1033 Sept. 1993)
   on page 1024, eq 25 a-i.
 */
struct BiCGSTABResult bicgstab(const struct BiCGSTABController *controls,
                               void (* transform)
                               (frame_id y, void *data, frame_id x),
                               void *data, frame_id x0, frame_id b) {
    // Ones
    struct Complex2 ones;
    ones.c2[0] = 1.0, ones.c2[1] = 1.0;
    // Get the programs
    GLuint scale_program = controls->scale_program;
    GLuint copy_program = controls->copy_program;
    GLuint inner_product_program = controls->inner_product_program;
    GLuint add_program = controls->add_program;
    GLuint add3_program = controls->add3_program;
    GLuint subtract_program = controls->subtract_program;
    // Define all of the frames
    frame_id r_next = controls->quads[0], r_last = controls->quads[1];
    frame_id y0 = controls->quads[2];
    frame_id s_next = controls->quads[3], s_last = controls->quads[4];
    frame_id transform_s = controls->quads[5];
    frame_id rs = controls->quads[7];
    frame_id transform_rs = controls->quads[8];
    frame_id product = controls->quads[9];
    frame_id s_last_minus_alpha_transform_s = controls->quads[10];
    frame_id transform_x0 = controls->quads[11];
    frame_id x_next = controls->quads[11], x_last = controls->quads[12];
    frame_id *sum_quads = controls->sum_quads;
    int size = controls->size;
    int min_iter = controls->min_iter, max_iter = controls->max_iter;
    struct InnerProductControls inner_prod_controls = {
        .inner_product_program = inner_product_program,
        .scale_program = scale_program,
        .sum_quads = sum_quads,
        .size = size,
        .product = product,
    };
    // Initialize stuff
    transform(transform_x0, data, x0);
    subtract(subtract_program, r_last,
             &ones, b, &ones, transform_x0);
    copy(copy_program, x_last, x0);
    copy(copy_program, s_last, r_last);
    transform(transform_s, data, s_last);
    copy(copy_program, y0, r_last);
    struct Complex2 epsilon;
    epsilon.c2[0] = 1e-5; epsilon.c2[1] = 1e-5;
    struct Complex2 delta = inner_product(y0, r_last, &inner_prod_controls);
    struct Complex2 y0_transform_s = inner_product(y0, transform_s,
                                                   &inner_prod_controls);
    struct Complex2 phi = c2_div(&y0_transform_s, &delta);
    int i;
    for (i = 0; continue_iteration(i, min_iter, max_iter,
                                   &delta, &epsilon); i++) {
        // inv_phi = 1.0 / phi
        struct Complex2 inv_phi = c2_inv(&phi);
        // |rs> = |r_next> - inv_phi A|s_last>
        subtract(subtract_program, rs,
                 &ones, r_last, &inv_phi, transform_s);
        // |A rs> = A|rs>
        transform(transform_rs, data, rs);
        // alpha = <rs A|rs> / <rs A|A rs>
        struct Complex2 rs_prod1 = inner_product(transform_rs, rs,
                                                    &inner_prod_controls);
        struct Complex2 rs_prod2 = inner_product(transform_rs,
                                                    transform_rs,
                                                    &inner_prod_controls);
        struct Complex2 alpha = c2_div(&rs_prod1, &rs_prod2);
        // |r_next> = |rs> - alpha A|rs>
        subtract(subtract_program, r_next,
                 &ones, rs, &alpha, transform_rs);
        // |x_next> = |x_last> + inv_phi |s_last> + alpha|rs>
        add3(add3_program, x_next,
             &ones, x_last, &inv_phi, s_last, &alpha, rs);
        // delta_next = <y0 | r_next>
        struct Complex2 delta_next = inner_product(y0, r_next,
                                                   &inner_prod_controls);
        // |s_last> - alpha A |s_last>
        subtract(subtract_program, s_last_minus_alpha_transform_s,
                 &ones, s_last, &alpha, transform_s);
        // beta = -inv_phi delta_next/(delta alpha)
        struct Complex2 tmp1 = c2_mul(&inv_phi, &delta_next);
        struct Complex2 tmp2 = c2_mul(&delta, &alpha);
        struct Complex2 neg_beta = c2_div(&tmp1, &tmp2);
        // |s_next> = |r_next> - beta * (|s_last> - alpha A |s_last>)
        add(add_program, s_next,
            &ones, r_next, &neg_beta, s_last_minus_alpha_transform_s);
        // |A s_next> = A |s_next>
        transform(transform_s, data, s_next);
        // phi = <y0 | A s_next> / delta_next
        struct Complex2 y0_transform_s_prod
            = inner_product(y0, transform_s, &inner_prod_controls);
        struct Complex2 phi_next = c2_div(&y0_transform_s_prod, &delta_next);
        // Swap things for next iteration
        // printf("%f, %f, %f, %f\n", delta_next.ind[0], delta_next.ind[1],
        //        delta_next.ind[2], delta_next.ind[3]);
        // printf("%f, %f, %f, %f\n", phi_next.ind[0], phi_next.ind[1],
        //        phi_next.ind[2], phi_next.ind[3]);
        c2_copy(&delta, &delta_next);
        c2_copy(&phi, &phi_next);
        swap2(&r_last, &r_next);
        swap2(&x_last, &x_next);
        swap2(&s_last, &s_next);
    }
    struct BiCGSTABResult res = {
        .result=x_last,
        .number_of_iterations=i,
    };
    return res;
}

#include "simulation.h"
#include "gl_wrappers/gl_wrappers.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void init_sim_params(SimParams *params) {
    params->dt = (1.0 - 0.01*I);
    params->step_count = 0;
    params->texel_width = 256;
    params->texel_height = 256;
    params->width = (float)params->texel_width;
    params->height = (float)params->texel_height;
    params->dx = params->width/params->texel_width;
    params->dy = params->height/params->texel_height;
    params->alpha = 0.5;
}

void init_sim_programs(SimPrograms *programs) {
    programs->copy = make_quad_program("./shaders/copy.frag");
    programs->scale = make_quad_program("./shaders/scale.frag");
    programs->zero = make_quad_program("./shaders/zero.frag");
    programs->complex_scale
        = make_quad_program("./shaders/complex-scale.frag");
    programs->init = make_quad_program("./shaders/init.frag");
    programs->complex_add2 = make_quad_program("./shaders/complex-add2.frag");
    programs->complex_abs2 = make_quad_program("./shaders/complex-abs2.frag");
    programs->implicit_iter
        = make_quad_program("./shaders/implicit-iter.frag");
    programs->explicit_step
        = make_quad_program("./shaders/explicit-step.frag");
    programs->potential_step
        = make_quad_program("./shaders/potential-step.frag");
}

void init_sim_frames(SimFrames *frames, const SimParams *params) {
    struct TextureParams tex_params = {
        .format=GL_RGBA32F,
        .width=params->texel_width,
        .height=params->texel_height,
        .generate_mipmap=1,
        .wrap_s=GL_REPEAT, .wrap_t=GL_REPEAT,
        .min_filter=GL_LINEAR, .mag_filter=GL_LINEAR,
    };
    for (int i = 0; i < 2; i++) {
        frames->psi_potential[i] = new_quad(&tex_params);
        frames->temps[i] = new_quad(&tex_params);
    }
    // Will not work at half precision!
    tex_params.format = GL_RGBA32F;
    frames->abs_psi2 = new_quad(&tex_params);
    frames->summation = init_summation_frames(tex_params, 8);
}

static void set_dx_dy_w_h(const SimParams *params) {
    set_float_uniform("dx", params->dx);
    set_float_uniform("dy", params->dy);
    set_float_uniform("w", params->width);
    set_float_uniform("h", params->height);
}

static void compute_abs_psi2(int abs_psi2_program,
                             frame_id dst, frame_id src) {
    bind_quad(dst, abs_psi2_program);
    set_sampler2D_uniform("tex", src);
    draw_unbind_quad();
}

static double compute_norm(int scale_program,
                           SummationFrames *summation, frame_id abs_psi2) {
    struct Vec4 sum = texture_reduction_sum(scale_program,
                                            abs_psi2, summation);
    return sqrt(sum.ind[0]);
}

static struct Vec4 *arr = NULL;
double cpu_compute_norm(frame_id frame, int texel_width, int texel_height) {
    int size = texel_width*texel_height;
    if (arr == NULL) arr = malloc(size*sizeof(struct DVec4));
    get_quad_texture_array(frame, 0, 0,
                           texel_width, texel_height,
                           GL_FLOAT, (void *)arr);
    double sum = 0.0;
    for (int i = 0; i < size; i++) {
        double x = (double)arr[i].x;
        double y = (double)arr[i].y;
        sum += x*x + y*y;
    }
    return sqrt(sum);
}

void init_psi_potential(SimFrames *frames, SimPrograms *programs,
                        SimParams *params) {
    for (int i = 0; i < 2; i++) {
        bind_quad(frames->psi_potential[i], programs->init);
        set_float_uniform("amplitude", 5.0);
        set_float_uniform("sigma", 0.05);
        set_ivec2_uniform("wavenumber", 10, -10);
        // set_float_uniform("amplitude", 1.0);
        // set_float_uniform("sigma", 2.05);
        // set_ivec2_uniform("wavenumber", 10, 0);
        set_vec2_uniform("r0", 0.35, 0.35);
        draw_unbind_quad();
    }
    params->norm = cpu_compute_norm(frames->psi_potential[0],
                                    params->texel_width, params->texel_height);

}

static void swap(frame_id *a, frame_id *b) {
    frame_id tmp = *a;
    *a = *b;
    *b = tmp;
}

void set_complex_uniform(const char *name, double complex z) {
    set_vec2_uniform(name, creal(z), cimag(z));
}

struct IterParams {
    float alpha;
    double complex dt;
    float dx, dy, w, h;
    int number_of_iterations;
    int order_of_accuracy;
};

static frame_id jacobi_solve_step(int iter_program,
                                  frame_id iter[2], frame_id b,
                                  const struct IterParams *params) {
    for (int i = 0; i < params->number_of_iterations; i++) {
        bind_quad(iter[1], iter_program);
        set_sampler2D_uniform("psiVPrevTex", (i == 0)? b: iter[0]);
        set_sampler2D_uniform("psiVSolTex", b);
        set_float_uniform("alpha", params->alpha);
        set_complex_uniform("dt", params->dt);
        set_float_uniform("dx", params->dx);
        set_float_uniform("dy", params->dy);
        set_float_uniform("w", params->w);
        set_float_uniform("h", params->h);
        set_int_uniform("orderOfAccuracy", params->order_of_accuracy);
        draw_unbind_quad();
        swap(&iter[0], &iter[1]);
    }
    return iter[0];
}

void timestep(SimFrames *frames, SimPrograms *programs, SimParams *params) {

    float nonlinear = 0.0001;
    bind_quad(frames->psi_potential[1], programs->potential_step);
    set_sampler2D_uniform("psiVTex", frames->psi_potential[0]);
    set_float_uniform("nonlinearTermScale", nonlinear);
    set_complex_uniform("dt", params->dt/2.0);
    draw_unbind_quad();
    swap(&frames->psi_potential[0], &frames->psi_potential[1]);

    bind_quad(frames->psi_potential[1], programs->explicit_step);
    set_complex_uniform("dt", params->dt);
    set_dx_dy_w_h(params);
    set_float_uniform("alpha", params->alpha);
    set_sampler2D_uniform("psiVTex0", frames->psi_potential[0]);
    set_sampler2D_uniform("psiVTex1", frames->psi_potential[0]);
    draw_unbind_quad();

    // swap(&frames->psi_potential[1], &frames->psi_potential[0]);
    // return;

    struct IterParams iter_params = {
        .dt=params->dt,
        .w=params->width, .h=params->height,
        .dx=params->dx, .dy=params->dy,
        .alpha=params->alpha,
        .number_of_iterations=10, .order_of_accuracy=4
    };
    frame_id iter[2] = {frames->temps[0], frames->temps[1]};
    frame_id res = jacobi_solve_step(programs->implicit_iter, iter,
                                     frames->psi_potential[1], &iter_params);


    bind_quad(frames->psi_potential[1], programs->potential_step);
    set_sampler2D_uniform("psiVTex", res);
    set_float_uniform("nonlinearTermScale", nonlinear);
    set_complex_uniform("dt", params->dt/2.0);
    draw_unbind_quad();

    // Normalize the wave function and scale it back to its initial norm
    /* compute_abs_psi2(programs->complex_abs2,
                     frames->abs_psi2, frames->psi_potential[0]);
    double norm2
        = compute_norm(programs->scale, &frames->summation, frames->abs_psi2);*/

    double norm = cpu_compute_norm(frames->psi_potential[0],
                                   params->texel_width, params->texel_height);
    // printf("%f, %f\n", norm, norm2);
    double scale = params->norm/norm;
    bind_quad(frames->psi_potential[0], programs->scale);
    set_vec4_uniform("scale", scale, scale, 1.0, 1.0);
    set_sampler2D_uniform("tex", frames->psi_potential[1]);
    draw_unbind_quad();


}

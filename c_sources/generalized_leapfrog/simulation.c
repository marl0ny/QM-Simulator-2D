#include "simulation.h"
#include "gl_wrappers/gl_wrappers.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void init_sim_params(SimParams *params) {
    params->dt = 0.01;
    params->step_count = 0;
    params->texel_width = 256;
    params->texel_height = 256;
    params->width = 0.1758*(float)params->texel_width;
    params->height = 0.1758*(float)params->texel_height;
    params->dx = params->width/params->texel_width;
    params->dy = params->height/params->texel_height;
    params->hbar = 1.0;
    params->m = 1.0;
    params->time_accuracy = 6;
    params->spatial_accuracy = 4;
}

void init_sim_programs(SimPrograms *programs) {
    programs->copy = make_quad_program("./shaders/copy.frag");
    programs->scale = make_quad_program("./shaders/scale.frag");
    programs->zero = make_quad_program("./shaders/zero.frag");
    programs->init = make_quad_program("./shaders/init.frag");
    programs->scale_add2 = make_quad_program("./shaders/scale-add2.frag");
    programs->complex_abs2 = make_quad_program("./shaders/complex-abs2.frag");
    programs->iter = make_quad_program("./shaders/iter.frag");
}

void init_sim_frames(SimFrames *frames, const SimParams *params) {
    struct TextureParams tex_params = {
        .type=GL_FLOAT,
        .width=params->texel_width,
        .height=params->texel_height,
        .generate_mipmap=1,
        .wrap_s=GL_REPEAT, .wrap_t=GL_REPEAT,
        .min_filter=GL_LINEAR, .mag_filter=GL_LINEAR,
    };
    for (int i = 0; i < 3; i++) {
        frames->psi_potential[i] = new_quad(&tex_params);
        frames->temps[i] = new_quad(&tex_params);
    }
    for (int i = 0; i < MAX_ITER_FRAMES; i++) {
        frames->iter_res.ind[i] = new_quad(&tex_params);
    }
    frames->iter_res.number_of = params->time_accuracy/2;
    // Will not work at half precision!
    tex_params.type = GL_FLOAT;
    frames->summation = init_summation_frames(tex_params, 8);
}

static void set_dx_dy_w_h(const SimParams *params) {
    set_float_uniform("dx", params->dx);
    set_float_uniform("dy", params->dy);
    set_float_uniform("w", params->width);
    set_float_uniform("h", params->height);
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

static void swap2(frame_id *a, frame_id *b) {
    frame_id tmp = *a;
    *a = *b;
    *b = tmp;
}

static void swap3(frame_id *a, frame_id *b, frame_id *c) {
    frame_id tmp0 = *a, tmp1 = *b, tmp2 = *c;
    *a = tmp1, *b = tmp2, *c = tmp0;
}

static void single_iter(int iter_program, frame_id next, frame_id last,
                        const struct SimParams *params) {
    bind_quad(next, iter_program);
    set_dx_dy_w_h(params);
    double complex dt = (params->step_count == 0)? 0.5*params->dt: params->dt;
    set_vec2_uniform("dt", creal(dt)/2.0, cimag(dt)/2.0);
    set_float_uniform("m", params->m);
    set_float_uniform("hbar", params->hbar);
    set_vec2_uniform("offsetA", 0.0, 0.0);
    set_int_uniform("useSubstitution", 0);
    set_int_uniform("orderOfAccuracy", params->spatial_accuracy);
    set_sampler2D_uniform("tex", last);
    draw_unbind_quad();
}


static void iter(int iter_program, struct IterRes *iter_res,
                 frame_id tmp, frame_id psi,
                 const struct SimParams *params) {
    frame_id last = psi;
    for (int i = 0; i < iter_res->number_of; i++) {
        frame_id next = iter_res->ind[i];
        single_iter(iter_program, next, last, params);
        if (i == iter_res->number_of - 1)
            break;
        next = tmp, last = iter_res->ind[i];
        single_iter(iter_program, next, last, params);
        last = tmp;
    }
}

static void compute_next(int scale_add2_program,
                         frame_id psi2,
                         struct IterRes *iter_res, frame_id psi0,
                         frame_id tmp1, frame_id tmp2) {
    double den = 1.0;
    frame_id iter2[2] = {tmp1, tmp2};
    for (int i = 0; i < iter_res->number_of; i++) {
        double num = 2.0*pow(-1.0, i);
        den *= (2.0*(double)i + 1.0);
        double coeff = num/den;
        frame_id next = (i == (iter_res->number_of - 1))?
            psi2: iter2[1];
        bind_quad(next, scale_add2_program);
        set_vec4_uniform("scale1", 1.0, 0.0, 1.0, 0.0);
        set_sampler2D_uniform("tex1", (i == 0)? psi0: iter2[0]);
        set_vec4_uniform("scale2", 0.0, -coeff, 0.0, 0.0);
        set_sampler2D_uniform("tex2", iter_res->ind[i]);
        draw_unbind_quad();
        swap2(&iter2[0], &iter2[1]);
    }

}

void timestep(SimFrames *frames, SimPrograms *programs, SimParams *params) {
    frame_id psi0, psi1, psi2;
    psi0 = frames->psi_potential[0];
    psi1 = (params->step_count == 0)?
        frames->psi_potential[0]: frames->psi_potential[1];
    psi2 = (params->step_count == 0)?
        frames->psi_potential[1]: frames->psi_potential[2];
    iter(programs->iter, &frames->iter_res, frames->temps[0], psi1, params);
    compute_next(programs->scale_add2, psi2, &frames->iter_res, psi0,
                 frames->temps[0], frames->temps[1]);

    /*double norm = cpu_compute_norm(psi2,
                                   params->texel_width, params->texel_height);
    // printf("%f\n", norm);
    double scale = params->norm/norm;
    bind_quad(frames->temps[0], programs->scale);
    set_vec4_uniform("scale", scale, scale, 1.0, 1.0);
    set_sampler2D_uniform("tex", psi2);
    draw_unbind_quad();
    bind_quad(psi2, programs->copy);
    set_sampler2D_uniform("tex", frames->temps[0]);
    draw_unbind_quad();*/


    if (params->step_count != 0)
        swap3(&frames->psi_potential[0],
              &frames->psi_potential[1], &frames->psi_potential[2]);
    params->step_count++;
}

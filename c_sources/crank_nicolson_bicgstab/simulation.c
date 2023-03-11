#include "simulation.h"
#include "summation_gl.h"
#include <GLES3/gl3.h>
#include <math.h>
#include "bicgstab_gl.h"


void init_sim_params(struct SimParams *params) {
    int width = START_WIDTH;
    int height = START_HEIGHT;
    params->texel_width = width;
    params->texel_height = height;
    params->width = (float)width;
    params->height = (float)height;
    float dt = 1.0;
    params->dt.c2[0] = dt;
    params->dt.c2[1] = dt;
    params->hbar = 1.0;
    params->m = 1.0;
    params->dx = params->width/params->texel_width;
    params->dy = params->height/params->texel_height;
    params->init_wavepacket.amplitude = 1.0;
    params->init_wavepacket.u0 = 0.5;
    params->init_wavepacket.v0 = 0.5;
    params->init_wavepacket.sigma_x = 0.07;
    params->init_wavepacket.sigma_y = 0.07;
    params->init_wavepacket.nx = 10.0;
    params->init_wavepacket.ny = 20.0;
    params->init_wavepacket.spin.c2[0] = 1.0;
    params->init_wavepacket.spin.c2[1] = 0.0;
}

void init_programs(struct Programs *programs) {
    programs->zero = make_program("./shaders/zero.frag");
    programs->copy = make_program("./shaders/copy.frag");
    programs->resize_copy = make_program("./shaders/resize-copy.frag");
    programs->copy2 = make_program("./shaders/copy2.frag");
    programs->scale = make_program("./shaders/scale.frag");
    programs->add2 = make_program("./shaders/add2.frag");
    programs->add3 = make_program("./shaders/add3.frag");
    programs->multiply = make_program("./shaders/multiply.frag");
    programs->inner_product = make_program("./shaders/inner-product.frag");
    programs->init_dist = make_program("./shaders/init-dist.frag");
    programs->explicit_part = make_program("./shaders/explicit-part.frag");
    programs->implicit_part = make_program("./shaders/implicit-part.frag");
    programs->preset_potential
        = make_program("./shaders/preset-potential.frag");
    programs->view = make_program("./shaders/view.frag");
}

void init_frames(struct Frames *quads, const struct SimParams *params) {
    int width = params->texel_width, height = params->texel_height;
    struct TextureParams texture_params = {
        .type=GL_FLOAT, .width=width, .height=height,
        .generate_mipmap=1,
        .wrap_s=GL_CLAMP_TO_EDGE, .wrap_t=GL_CLAMP_TO_EDGE,
        .min_filter=GL_LINEAR, .mag_filter=GL_LINEAR,
    };
    quads->main_view = new_quad(NULL);
    quads->secondary_view = new_quad(&texture_params);
    for (int i = 0; i < N_SIM_FRAMES; i++) {
        quads->simulation[i] = new_quad(&texture_params);
    }
    for (int i = 0; i < N_ITER_FRAMES; i++) {
        quads->iter_solver[i] = new_quad(&texture_params);
    }

    texture_params.min_filter = GL_LINEAR;
    texture_params.mag_filter = GL_LINEAR;
    for (int i = 0; i < SUM_FRAMES; i++) {
        texture_params.width /= 2;
        texture_params.height /= 2;
        quads->summations[i] = new_quad(&texture_params);
    }
}

void set_dx_dy_width_height(float dx, float dy, float width, float height) {
    set_float_uniform("dx", dx);
    set_float_uniform("dy", dy);
    set_float_uniform("width", width);
    set_float_uniform("height", height);
}

void explicit_part(const struct SimParams *params,
                   const struct Programs *programs,
                   struct Frames *quads,
                   frame_id wavefunc_f, frame_id wavefunc_i,
                   frame_id potential) {
    bind_quad(wavefunc_f, programs->explicit_part);
    set_vec4_uniform("dt", params->dt.ind[0], params->dt.ind[1],
                     params->dt.ind[2], params->dt.ind[3]);
    set_float_uniform("hbar", params->hbar);
    set_float_uniform("m", params->m);
    set_dx_dy_width_height(params->dx, params->dy,
                           params->width, params->height);
    set_sampler2D_uniform("wavefuncTex", wavefunc_i);
    set_sampler2D_uniform("potentialTex", potential);
    draw_unbind();
}

void implicit_part(const struct SimParams *params,
                   const struct Programs *programs,
                   struct Frames *quads,
                   frame_id wavefunc_f, frame_id wavefunc_i,
                   frame_id potential) {
    bind_quad(wavefunc_f, programs->implicit_part);
    set_vec4_uniform("dt", params->dt.ind[0], params->dt.ind[1],
                     params->dt.ind[2], params->dt.ind[3]);
    set_float_uniform("hbar", params->hbar);
    set_float_uniform("m", params->m);
    set_dx_dy_width_height(params->dx, params->dy,
                           params->width, params->height);
    set_sampler2D_uniform("wavefuncTex", wavefunc_i);
    set_sampler2D_uniform("potentialTex", potential);
    draw_unbind();
}


struct ImplicitTransformData {
    const struct SimParams *params;
    const struct Programs *programs;
    struct Frames *quads;
};

void implicit_transform(frame_id y0, void *void_data, frame_id x) {
    struct ImplicitTransformData *data
         = (struct ImplicitTransformData *)void_data;
    const struct SimParams *params = data->params;
    const struct Programs *programs = data->programs;
    struct Frames *quads = data->quads;
    implicit_part(params, programs, quads, y0, x, quads->potential);
}


void timestep(const struct SimParams *params,
              const struct Programs *programs, struct Frames *quads) {
    struct BiCGSTABController bicgstab_controls = {
        .quads=quads->iter_solver,
        .scale_program=programs->scale,
        .copy_program=programs->copy,
        .inner_product_program=programs->inner_product,
        .add_program=programs->add2,
        .add3_program=programs->add3,
        .subtract_program=programs->add2,
        .sum_quads=quads->summations,
        .size=params->texel_width,
        .min_iter=1,
        .max_iter=5,
    };
    struct ImplicitTransformData transform_data = {.params=params,
                                                   .programs=programs,
                                                   .quads=quads};
    explicit_part(params, programs, quads,
                  quads->wavefunc[1], quads->wavefunc[0], quads->potential);
    struct BiCGSTABResult res = bicgstab(&bicgstab_controls,
                                         &implicit_transform,
                                         (void *)&transform_data,
                                         quads->wavefunc[1],
                                         quads->wavefunc[1]);
    bind_quad(quads->wavefunc[0], programs->copy);
    set_sampler2D_uniform("tex", res.result);
    draw_unbind();
}


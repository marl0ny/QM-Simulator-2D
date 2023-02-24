#include "simulation.h"
#include "gl_wrappers/gl_wrappers.h"


void init_sim_params(SimParams *params) {
    params->dt = 0.01;
    params->texel_width = 128;
    params->texel_height = 128;
    params->width = 25.0;
    params->height = 25.0;
    params->dx = params->width/params->texel_width;
    params->dy = params->height/params->texel_height;
    params->sigma = 0.01;
    params->step_count = 0;

}

void init_sim_programs(SimPrograms *programs) {
    programs->copy = make_quad_program("./shaders/copy.frag");
    programs->scale = make_quad_program("./shaders/scale.frag");
    programs->zero = make_quad_program("./shaders/zero.frag");
    programs->complex_scale
        = make_quad_program("./shaders/complex-scale.frag");
    programs->kinetic = make_quad_program("./shaders/kinetic.frag");
    programs->init = make_quad_program("./shaders/init.frag");
    programs->complex_add2 = make_quad_program("./shaders/complex-add2.frag");
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
        frames->potential_psi[i] = new_quad(&tex_params);
        frames->temps[i] = new_quad(&tex_params);
    }
}

static void set_dx_dy_w_h(SimParams *params) {
    set_float_uniform("dx", params->dx);
    set_float_uniform("dy", params->dy);
    set_float_uniform("w", params->width);
    set_float_uniform("h", params->height);
}

void init_potential_psi(SimFrames *frames, SimPrograms *programs,
                        SimParams *params) {
    for (int i = 0; i < 3; i++) {
        bind_quad(frames->potential_psi[0], programs->init);
        set_float_uniform("amplitude", 5.0);
        set_float_uniform("sigma", 0.05);
        set_vec2_uniform("r0", 0.5, 0.25);
        set_ivec2_uniform("wavenumber", -10, 0);
        draw_unbind_quad();
    }
}


static void swap3(frame_id *f0, frame_id *f1, frame_id *f2) {
    frame_id tmp0 = *f0, tmp1 = *f1, tmp2 = *f2;
    *f0 = tmp1, *f1 = tmp2, *f2 = tmp0;
}


void timestep_schrod(SimFrames *frames, SimPrograms *programs,
                     SimParams *params) {
    float dt = (params->step_count == 0)? params->dt/2.0: params->dt;
    int frame0 = frames->potential_psi[0];
    int frame1 = (params->step_count == 0)?
        frames->potential_psi[0]: frames->potential_psi[1];
    int frame2 = (params->step_count == 0)?
        frames->potential_psi[1]: frames->potential_psi[2];
    bind_quad(frames->temps[0], programs->kinetic);
    set_dx_dy_w_h(params);
    set_sampler2D_uniform("tex", frame1);
    set_vec2_uniform("offsetA", 0.0, 0.0);
    draw_unbind_quad();
    bind_quad(frame2, programs->complex_add2);
    set_vec4_uniform("scale1", 0.0, 0.0, 0.0, 0.5*dt);
    set_sampler2D_uniform("tex1", frames->temps[0]);
    set_vec4_uniform("scale2", 1.0, 0.0, 1.0, 0.0);
    set_sampler2D_uniform("tex2", frame0);
    draw_unbind_quad();
    if (params->step_count != 0)
        swap3(&frames->potential_psi[0],
              &frames->potential_psi[1], &frames->potential_psi[2]);
    params->step_count++;

}

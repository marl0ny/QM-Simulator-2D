#include "simulation.h"


static struct Programs s_programs = {};
static struct SimParams s_sim_params = {};
static struct Frames s_frames = {};


void init() {
    init_programs(&s_programs);
    init_sim_params(&s_sim_params);
    init_frames(&s_frames, &s_sim_params);
    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);
    bind_quad(s_frames.sim.potential, s_programs.zero);
    draw_unbind_quad();
    bind_quad(s_frames.sim.magnetic_field, s_programs.zero);
    draw_unbind_quad();
    bind_quad(s_frames.sim.current, s_programs.zero);
    draw_unbind_quad();
    new_wavepacket(s_programs.new_wavepacket, &s_sim_params,
                   s_frames.sim.wavefunc[0], s_frames.sim.wavefunc[1]);
    timestep(&s_sim_params, &s_programs, &s_frames);
    swap3(&s_frames.sim.wavefunc[0], &s_frames.sim.wavefunc[1],
          &s_frames.sim.wavefunc[2]);
    s_sim_params.is_initial_step = 0;

}


void render() {

    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);

    for (int i = 0; i < s_sim_params.steps_per_frame; i++) {
        timestep(&s_sim_params, &s_programs, &s_frames);
        swap3(&s_frames.sim.wavefunc[0], &s_frames.sim.wavefunc[1],
              &s_frames.sim.wavefunc[2]);
    }
    // bind_quad(s_frames.view.main, s_programs.copy);
    // set_sampler2D_uniform("tex", s_frames.sim.wavefunc[0]);
    // draw_unbind_quad();


    bind_quad(s_frames.view.secondary[1], s_programs.view);
    set_int_uniform("viewMode", 0);
    set_float_uniform("wavefuncBrightnessScale1", 1.0);
    set_float_uniform("wavefuncBrightnessScale2", 1.0);
    set_float_uniform("potentialBrightnessScale", 1.0);
    set_sampler2D_uniform("texWavefunc0", s_frames.sim.wavefunc[0]);
    set_sampler2D_uniform("texWavefunc1", s_frames.sim.wavefunc[1]);
    set_sampler2D_uniform("texWavefunc2", s_frames.sim.wavefunc[2]);
    set_sampler2D_uniform("texPotential", s_frames.sim.potential);
    draw_unbind_quad();

    #ifdef __APPLE__
    glViewport(0, 0, 4*s_sim_params.texel_width, 4*s_sim_params.texel_height);
    #else
    glViewport(0, 0, 2*s_sim_params.texel_width, 2*s_sim_params.texel_height);
    #endif
    bind_quad(s_frames.view.main, s_programs.copy);
    set_sampler2D_uniform("tex", s_frames.view.secondary[0]);
    draw_unbind_quad();

}

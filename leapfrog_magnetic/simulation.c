#include "simulation.h"
#include <complex.h>
#include "complex2/stencils.h"
#include "complex2/fft.h"
#include "fft_gl.h"


static const double PI = 3.141592653589793;


static struct Complex2 wavefunc_buf0[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 wavefunc_buf1[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 wavefunc_buf2[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 wavefunc_p_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 gradx_wavefunc_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 grady_wavefunc_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 p2_wavefunc_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 p2_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 px_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Complex2 py_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Vec4 potential_buf[MAX_WIDTH*MAX_HEIGHT];
static struct Vec4 magnetic_field_buf[MAX_WIDTH*MAX_HEIGHT];
// static struct Vec4 rearrange_buf[MAX_WIDTH*MAX_HEIGHT];
static float freq_h_buf[MAX_WIDTH*MAX_HEIGHT];
static float freq_v_buf[MAX_WIDTH*MAX_HEIGHT];


void init_sim_params(struct SimParams *sim_params) {
    int width = START_WIDTH;
    int height = START_HEIGHT;
    sim_params->use_gpu_for_timestep = 1;
    sim_params->use_ft_for_momentum_terms = 1;
    sim_params->is_initial_step = 1;
    sim_params->enable_spin_interaction = 1;
    sim_params->steps_per_frame = (width >= 256)? 2: 5;
    // sim_params->steps_per_frame = 1;
    sim_params->dt = 0.135;
    sim_params->m = 1.0, sim_params->hbar = 1.0, sim_params->c = 137.036;
    sim_params->q = 1.0;
    sim_params->texel_width = width;
    sim_params->texel_height = height;
    sim_params->width = (float)width; // 91.0*(width/512.0);
    sim_params->height = (float)height; // 91.0*(height/512.0);
    sim_params->dx = sim_params->width/(float)width;
    sim_params->dy = sim_params->height/(float)height;
    sim_params->init_wavepacket.amplitude = 1.0;
    sim_params->init_wavepacket.sigma_x = 0.06;
    sim_params->init_wavepacket.sigma_y = 0.06;
    sim_params->init_wavepacket.u0 = 0.25;
    sim_params->init_wavepacket.v0 = 0.25;
    sim_params->init_wavepacket.nx = 0; //-10;
    sim_params->init_wavepacket.ny = 0; //10;
    sim_params->init_wavepacket.spin.c2[0] = 1.0/sqrt(2.0);
    sim_params->init_wavepacket.spin.c2[1] = I/sqrt(2.0);
    sim_params->init_wavepacket.spin_direction.x = 0.0;
    sim_params->init_wavepacket.spin_direction.y = 1.0;
    sim_params->init_wavepacket.spin_direction.z = 0.0;
    sim_params->preset_potential.which = 3;
    sim_params->preset_potential.x_amplitude = 2.0;
    sim_params->preset_potential.y_amplitude = 2.0;
}

/* OpenGL needs to be initialized first before calling this function,
 and this must be used only once.*/
void init_programs(struct Programs *programs) {
    programs->zero = make_program("./shaders/zero.frag");
    programs->copy = make_program("./shaders/copy.frag");
    programs->copy2 = make_program("./shaders/copy2.frag");
    programs->resize_copy = make_program("./shaders/resize-copy.frag");
    programs->scale = make_program("./shaders/scale.frag");
    programs->complex_multiply
        = make_program("./shaders/complex-multiply.frag");
    programs->init_dist = make_program("./shaders/init-dist.frag");
    programs->leapfrog = make_program("./shaders/leapfrog.frag");
    programs->current = make_program("./shaders/current.frag");
    programs->preset_potential
        = make_program("./shaders/preset-potential.frag");
    programs->preset_magnetic_field
        = make_program("./shaders/preset-magnetic-field.frag");
    programs->curl = make_program("./shaders/curl.frag");
    programs->fft_iter = make_program("./shaders/fft-iter.frag");
    programs->rearrange = make_program("./shaders/rearrange.frag");
    programs->view = make_program("./shaders/view.frag");
}

/* OpenGL needs to be initialized first before calling this function,
   and this must be used only once.*/
void init_frames(struct Frames *quads, const struct SimParams *sim_params) {
    int width = sim_params->texel_width, height = sim_params->texel_height;
    struct TextureParams texture_params = {
        .type=GL_FLOAT,
        .width=width, .height=height,
        .generate_mipmap=1,
        .wrap_s=GL_REPEAT, .wrap_t=GL_REPEAT,
        .min_filter=GL_LINEAR, .mag_filter=GL_LINEAR,
    };
    quads->main_view = new_quad(NULL);
    quads->secondary_view = new_quad(&texture_params);
    texture_params.min_filter = GL_NEAREST;
    texture_params.mag_filter = GL_NEAREST;
    texture_params.width = width, texture_params.height = height;
    for (int i = 0; i < 16; i++) {
        quads->simulation[i] = new_quad(&texture_params);
    }
    for (int i = 0; i < 3; i++) {
        quads->fft[i] = new_quad(&texture_params);
    }
}

void init_bufs(struct Bufs *bufs) {
    bufs->wavefunc[0] = wavefunc_buf0;
    bufs->wavefunc[1] = wavefunc_buf1;
    bufs->wavefunc[2] = wavefunc_buf2;
    bufs->wavefunc_p = wavefunc_p_buf;
    // bufs->gradx_wavefunc_p = gradx_wavefunc_p_buf;
    // bufs->grady_wavefunc_p = grady_wavefunc_p_buf;
    // bufs->p2_wavefunc_p = p2_wavefunc_p_buf;
    bufs->gradx_wavefunc = gradx_wavefunc_buf;
    bufs->grady_wavefunc = grady_wavefunc_buf;
    bufs->p2_wavefunc = p2_wavefunc_buf;
    bufs->potential = potential_buf;
    bufs->magnetic_field = magnetic_field_buf;
    bufs->p2 = p2_buf;
    bufs->px = px_buf;
    bufs->py = py_buf;
    bufs->freq_h = freq_h_buf;
    bufs->freq_v = freq_v_buf;
}

void set_uniforms_dx_dy_width_height(float dx, float dy,
                                     float width, float height) {
    set_float_uniform("dx", dx);
    set_float_uniform("dy", dy);
    set_float_uniform("width", width);
    set_float_uniform("height", height);
}

void init_momentum_frames(const struct SimParams *params,
                          const struct Frames *quads,
                          const struct Bufs *bufs) {
    struct Complex2 *p2_buf = bufs->p2;
    struct Complex2 *px_buf = bufs->px;
    struct Complex2 *py_buf = bufs->py;
    float *freq_h = bufs->freq_h, *freq_v = bufs->freq_v;
    fftfreq2(freq_h, freq_v, params->texel_width, params->texel_height);
    for (int i = 0; i < params->texel_height; i++) {
        for (int j = 0; j < params->texel_width; j++) {
            int w = params->texel_width;
            float px = 2.0*PI*params->hbar*freq_h[i*w + j]/params->width;
            float py = 2.0*PI*params->hbar*freq_v[i*w + j]/params->height;
            float p2 = px*px + py*py;
            px_buf[i*w + j].ind[0] = px;
            px_buf[i*w + j].ind[1] = 0.0;
            px_buf[i*w + j].ind[2] = px;
            px_buf[i*w + j].ind[3] = 0.0;

            py_buf[i*w + j].ind[0] = py;
            py_buf[i*w + j].ind[1] = 0.0;
            py_buf[i*w + j].ind[2] = py;
            py_buf[i*w + j].ind[3] = 0.0;

            p2_buf[i*w + j].ind[0] = p2;
            p2_buf[i*w + j].ind[1] = 0.0;
            p2_buf[i*w + j].ind[2] = p2;
            p2_buf[i*w + j].ind[3] = 0.0;
        }
    }
    substitute_array(quads->px, params->texel_width, params->texel_height,
                     GL_FLOAT, px_buf);
    substitute_array(quads->py, params->texel_width, params->texel_height,
                     GL_FLOAT, py_buf);
    substitute_array(quads->p2, params->texel_width, params->texel_height,
                     GL_FLOAT, p2_buf);
}

void init_wavepacket(GLuint init_wavepacket_program,
                     const struct SimParams *params,
                     frame_id frame1, frame_id frame2) {
    frame_id frames[2] = {frame1, frame2};
    for (int i = 0; i < 2; i++) {
        frame_id frame = frames[i];
        bind_quad(frame, init_wavepacket_program);
        set_float_uniform("amplitude", params->init_wavepacket.amplitude);
        set_float_uniform("sigma_x", params->init_wavepacket.sigma_x);
        set_float_uniform("sigma_y", params->init_wavepacket.sigma_y);
        set_float_uniform("u0", params->init_wavepacket.u0);
        set_float_uniform("v0", params->init_wavepacket.v0);
        set_float_uniform("nx", params->init_wavepacket.nx);
        set_float_uniform("ny", params->init_wavepacket.ny);
        set_vec4_uniform("spin",
                         params->init_wavepacket.spin.re1,
                         params->init_wavepacket.spin.im1,
                         params->init_wavepacket.spin.re2,
                         params->init_wavepacket.spin.im2);
        draw_unbind();
    }
}

void init_preset_potential(const struct SimParams *params,
                           const struct Programs *programs,
                           const struct Frames *quads,
                           const struct Bufs *bufs) {
    frame_id tmp_quads[2] = {quads->potential, quads->magnetic_field};
    GLuint tmp_prog[2] = {programs->preset_potential,
                          programs->preset_magnetic_field};
    for (int i = 0; i < 2; i++) {
        bind_quad(tmp_quads[i], tmp_prog[i]);
        set_float_uniform("xAmplitude",
                          params->preset_potential.x_amplitude);
        set_float_uniform("yAmplitude",
                          params->preset_potential.y_amplitude);
        set_float_uniform("c", params->c);
        set_float_uniform("hbar", params->hbar);
        set_float_uniform("q", params->q);
        set_float_uniform("m", params->m);
        set_float_uniform("width", params->width);
        set_float_uniform("height", params->height);
        set_int_uniform("which", params->preset_potential.which);
        draw_unbind();
    }
    // if (use_gpu_for_timestep) return;
    get_texture_array(quads->potential,
                      0, 0,
                      params->texel_width,
                      params->texel_height, GL_FLOAT,
                      bufs->potential);
    get_texture_array(quads->magnetic_field,
                      0, 0,
                      params->texel_width,
                      params->texel_height, GL_FLOAT,
                      bufs->magnetic_field);
}

void swap3(frame_id *f1, frame_id *f2, frame_id *f3) {
    frame_id tmp1 = *f1, tmp2 = *f2, tmp3 = *f3;
    *f1 = tmp2, *f2 = tmp3, *f3 = tmp1;
}

frame_id ft(const struct SimParams *params,
            const struct Programs *programs,
            const struct Frames *quads, frame_id initial) {
    reverse_bit_sort(programs->rearrange, quads->bit_sort_table,
                     initial, quads->fft_iter2[0]);
    frame_id res1 = fft_iter(programs->fft_iter,
                             quads->fft_iter2[0], quads->fft_iter2[1],
                             params->texel_height, 0);
    frame_id tmp1, tmp2;
    if (res1 == quads->fft_iter2[0])
        tmp1 = quads->fft_iter2[0], tmp2 = quads->fft_iter2[1];
    else
        tmp1 = quads->fft_iter2[1], tmp2 = quads->fft_iter2[0];
    return fft_iter(programs->fft_iter, tmp1, tmp2, params->texel_height, 1);
}

frame_id ift(const struct SimParams *params,
            const struct Programs *programs,
            const struct Frames *quads, frame_id initial) {
    reverse_bit_sort(programs->rearrange, quads->bit_sort_table,
                     initial, quads->fft_iter2[0]);
    frame_id res1 = ifft_iter(programs->fft_iter,
                              quads->fft_iter2[0], quads->fft_iter2[1],
                              params->texel_height, 0);
    frame_id tmp1, tmp2;
    if (res1 == quads->fft_iter2[0])
        tmp1 = quads->fft_iter2[0], tmp2 = quads->fft_iter2[1];
    else
        tmp1 = quads->fft_iter2[1], tmp2 = quads->fft_iter2[0];
    return ifft_iter(programs->fft_iter, tmp1, tmp2, params->texel_height, 1);
}

void timestep(const struct SimParams *params,
              const struct Programs *programs,
              const struct Frames *quads) {

    frame_id p2_wavefunc = 1, gradx_wavefunc = 1, grady_wavefunc = 1;
    if (params->use_ft_for_momentum_terms) {
        // Fourier Transform the wavefunction to momentum space
        frame_id wavefunc_p = ft(params, programs, quads, quads->wavefunc[1]);

        bind_quad(quads->wavefunc_p, programs->copy);
        set_sampler2D_uniform("tex",  wavefunc_p);
        draw_unbind();

        // Multiply p^2 with the wavefunction
        bind_quad(quads->p2_wavefunc_p, programs->complex_multiply);
        set_vec4_uniform("a", 1.0, 0.0, 1.0, 0.0);
        set_sampler2D_uniform("tex1", quads->p2);
        set_sampler2D_uniform("tex2", quads->wavefunc_p);
        draw_unbind();
        p2_wavefunc = ift(params, programs,
                          quads, quads->p2_wavefunc_p);
        bind_quad(quads->p2_wavefunc, programs->copy);
        set_sampler2D_uniform("tex", p2_wavefunc);
        draw_unbind();

        // With px
        bind_quad(quads->gradx_wavefunc_p, programs->complex_multiply);
        set_vec4_uniform("a", 0.0, 1.0/params->hbar, 0.0, 1.0/params->hbar);
        set_sampler2D_uniform("tex1", quads->px);
        set_sampler2D_uniform("tex2", quads->wavefunc_p);
        draw_unbind();
        gradx_wavefunc = ift(params, programs,
                             quads, quads->gradx_wavefunc_p);
        bind_quad(quads->gradx_wavefunc, programs->copy);
        set_sampler2D_uniform("tex", gradx_wavefunc);
        draw_unbind();

        // With py
        bind_quad(quads->grady_wavefunc_p, programs->complex_multiply);
        set_vec4_uniform("a", 0.0, 1.0/params->hbar, 0.0, 1.0/params->hbar);
        set_sampler2D_uniform("tex1", quads->py);
        set_sampler2D_uniform("tex2", quads->wavefunc_p);
        draw_unbind();
        grady_wavefunc = ift(params, programs,
                             quads, quads->grady_wavefunc_p);
        bind_quad(quads->grady_wavefunc, programs->copy);
        set_sampler2D_uniform("tex", grady_wavefunc);
        draw_unbind();

    }

    bind_quad(quads->wavefunc[2], programs->leapfrog);
    set_float_uniform("c", params->c);
    set_float_uniform("hbar", params->hbar);
    set_float_uniform("q", params->q);
    set_float_uniform("m", params->m);
    set_float_uniform("dt", params->dt*((params->is_initial_step)? 0.5: 1.0));
    set_uniforms_dx_dy_width_height(params->dx, params->dy,
                                    params->width, params->height);
    set_sampler2D_uniform("wavefuncTex0", quads->wavefunc[0]);
    set_sampler2D_uniform("wavefuncTex1", quads->wavefunc[1]);
    set_sampler2D_uniform("potentialTex", quads->potential);
    set_int_uniform("useFTForMomentumTerms",
                     params->use_ft_for_momentum_terms);
    set_sampler2D_uniform("p2wavefuncTex", quads->p2_wavefunc);
    set_sampler2D_uniform("gradXWavefuncTex", quads->gradx_wavefunc);
    set_sampler2D_uniform("gradYWavefuncTex", quads->grady_wavefunc);
    set_int_uniform("enableBFieldSpinInteraction",
                    params->enable_spin_interaction);
    set_sampler2D_uniform("magneticFieldTex", quads->magnetic_field);
    set_int_uniform("addNonlinearTerms", 0);
    draw_unbind();
}


static const float _Complex SIGMA_X[2][2] = {{0.0, 1.0},
                                             {1.0, 0.0}};
static const float _Complex SIGMA_Y[2][2] = {{0.0, -I},
                                             {I,  0.0}};
static const float _Complex SIGMA_Z[2][2] = {{1.0,  0.0},
                                             {0.0, -1.0}};


static inline struct Complex2 matrix_dot(const float _Complex mat[2][2],                                                  struct Complex2 psi) {
    struct Complex2 psi2;
    psi2.c2[0] = mat[0][0]*psi.c2[0] + mat[0][1]*psi.c2[1];
    psi2.c2[1] = mat[1][0]*psi.c2[0] + mat[1][1]*psi.c2[1];
    return psi2;
}


void timestep_cpu(const struct SimParams *params,
                  const struct Programs *programs,
                  const struct Frames *quads,
                  struct Bufs *bufs) {
    int width = params->texel_width, height = params->texel_height;
    int use_ft_for_momentum_terms = params->use_ft_for_momentum_terms;
    get_texture_array(quads->wavefunc[0],
                      0, 0, width, height, GL_FLOAT,
                      bufs->wavefunc[0]);
    get_texture_array(quads->wavefunc[1],
                      0, 0, width, height, GL_FLOAT,
                      bufs->wavefunc[1]);
    struct Complex2 *psi0 = bufs->wavefunc[0];
    struct Complex2 *psi1 = bufs->wavefunc[1];
    struct Complex2 *psi2 = bufs->wavefunc[2];
    struct Complex2 *psi1_p = bufs->wavefunc_p;
    struct Complex2 *gradx_psi1 = bufs->gradx_wavefunc;
    struct Complex2 *grady_psi1 = bufs->grady_wavefunc;
    struct Complex2 *p2_psi1 = bufs->p2_wavefunc;
    struct Complex2 *p2 = bufs->p2;
    struct Complex2 *px = bufs->px, *py = bufs->py;
    struct Vec4 *potential = bufs->potential;
    struct Vec4 *magnetic_field = bufs->magnetic_field;
    float dt = (params->is_initial_step)? params->dt/2.0: params->dt;
    float dx = params->dx, dy = params->dy;
    float hbar = params->hbar;
    float q = params->q;
    float c = params->c;
    float hbar2 = hbar*hbar;
    float m = params->m;
    // The Pauli Equation which discribes how
    // a spin 1/2 particle interacts with a magnetic field
    // in the nonrelativistic limit
    // is found in  Shankar, 568
    // 
    // Shankar, R. (1994). Spin. 
    // In Principles of Quantum Mechanics, 
    // chapter 14. Springer.
    // 
    // Shankar, R. (1994). The Dirac Equation. 
    // In Principles of Quantum Mechanics, chapter 20. 
    // Springer.
    if (use_ft_for_momentum_terms) {
        #pragma omp parallel for
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                for (int k = 0; k < 4; k++) {
                    psi1_p[i*width + j].ind[k] = psi1[i*width + j].ind[k];
                }
            }
        }
        inplace_fft2(psi1_p, width);
        #pragma omp parallel for
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int k = i*width + j;
                gradx_psi1[k].c2[0] = (I/hbar)*px[k].c2[0]*psi1_p[k].c2[0];
                gradx_psi1[k].c2[1] = (I/hbar)*px[k].c2[1]*psi1_p[k].c2[1];
                grady_psi1[k].c2[0] = (I/hbar)*py[k].c2[0]*psi1_p[k].c2[0];
                grady_psi1[k].c2[1] = (I/hbar)*py[k].c2[1]*psi1_p[k].c2[1];
                p2_psi1[k].c2[0] = psi1_p[k].c2[0]*p2[k].c2[0];
                p2_psi1[k].c2[1] = psi1_p[k].c2[1]*p2[k].c2[1];
            }
        }
        inplace_ifft2(gradx_psi1, width);
        inplace_ifft2(grady_psi1, width);
        inplace_ifft2(p2_psi1, width);
    }
    #pragma omp parallel for
    for (int i = 0; i < height; i++) {
        for (int j = 0; j < width; j++) {
            int k = i*width + j;
            struct Complex2 div2_psi1, gradx_psi1_k, grady_psi1_k;
            float _Complex h_psi1_0;
            float _Complex h_psi1_1;
            float ax = potential[k].x, ay = potential[k].y;
            struct Complex2 spin_interaction;
            if (params->enable_spin_interaction) {
                float bx = magnetic_field[k].x;
                float by = magnetic_field[k].y;
                float bz = magnetic_field[k].z;
                struct Complex2 sigma_x_psi1;
                struct Complex2 sigma_y_psi1;
                struct Complex2 sigma_z_psi1;
                {sigma_x_psi1 = matrix_dot(SIGMA_X, psi1[k]);};
                {sigma_y_psi1 = matrix_dot(SIGMA_Y, psi1[k]);};
                {sigma_z_psi1 = matrix_dot(SIGMA_Z, psi1[k]);};
                spin_interaction.c2[0]
                    = -(q*hbar)/(2.0*m*c)*(bx*sigma_x_psi1.c2[0]
                                           + by*sigma_y_psi1.c2[0]
                                           + bz*sigma_z_psi1.c2[0]);
                spin_interaction.c2[1]
                    = -(q*hbar)/(2.0*m*c)*(bx*sigma_x_psi1.c2[1]
                                           + by*sigma_y_psi1.c2[1]
                                           + bz*sigma_z_psi1.c2[1]);

            }
            if (use_ft_for_momentum_terms) {
                h_psi1_0 = (p2_psi1[k].c2[0]/(2.0*m)
                            + hbar*q*I*(ax*gradx_psi1[k].c2[0]
                                        + ay*grady_psi1[k].c2[0])/(m*c)
                            + spin_interaction.c2[0]
                            + potential[k].w*psi1[k].c2[0]);
                h_psi1_1 = (p2_psi1[k].c2[1]/(2.0*m)
                            + hbar*q*I*(ax*gradx_psi1[k].c2[1]
                                        + ay*grady_psi1[k].c2[1])/(m*c)
                            + spin_interaction.c2[1]
                            + potential[k].w*psi1[k].c2[1]);
            } else {
                div2_psi1
                    = laplacian_4thorder_9point(psi1,
                                                i, j,
                                                width, height,
                                                dx, dy);
                gradx_psi1_k = centred_x_derivative_4thorder(psi1,
                                                             i, j,
                                                             width, height,
                                                             dx);
                grady_psi1_k = centred_y_derivative_4thorder(psi1,
                                                             i, j,
                                                             width, height,
                                                             dy);
                h_psi1_0 = (-hbar2/(2.0*m)*div2_psi1.c2[0]
                            + hbar*q*I*(ax*gradx_psi1_k.c2[0]
                                        + ay*grady_psi1_k.c2[0])/(m*c)
                            + spin_interaction.c2[0]
                            + potential[k].w*psi1[k].c2[0]);
                h_psi1_1 = (-hbar2/(2.0*m)*div2_psi1.c2[1]
                            + hbar*q*I*(ax*gradx_psi1_k.c2[1]
                                        + ay*grady_psi1_k.c2[1])/(m*c)
                            + spin_interaction.c2[1]
                            + potential[k].w*psi1[k].c2[1]);
            }
            psi2[k].c2[0] = psi0[k].c2[0] - (dt/hbar)*I*h_psi1_0;
            psi2[k].c2[1] = psi0[k].c2[1] - (dt/hbar)*I*h_psi1_1;
        }
    }
    substitute_array(quads->wavefunc[2], width, height, GL_FLOAT, psi2);
}

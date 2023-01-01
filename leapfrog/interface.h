#ifndef _INTERFACE_
#define _INTERFACE_


void init();

struct RenderParams {
    int user_use;
    int user_direction_x;
    int user_direction_y;
    int user_zoom;
    int user_surface_enlarge;
    double user_x, user_y;
    double user_dx, user_dy;
};

void render(const struct RenderParams *render_params);


#endif

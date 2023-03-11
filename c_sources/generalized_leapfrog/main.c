#include <GLES3/gl3.h>
#include <GLFW/glfw3.h>
#include <stdio.h>
#include "gl_wrappers/gl_wrappers.h"
#include "init_render.h"

#ifdef __EMSCRIPTEN__

#include <emscripten.h>
#include <emscripten/html5.h>

struct EmscriptenMainLoopData {
    GLFWwindow *window;
    int iter;
} main_loop_data;

void emscripten_main_loop() {
    render(NULL);
    glfwPollEvents();
    glfwSwapBuffers(main_loop_data.window);
    main_loop_data.iter++;
}

#endif


int main() {
#ifdef __APPLE__
    int pixel_width = 1024;
    int pixel_height = 1024;
#else
    int pixel_width = 512;
    int pixel_height = 512;
#endif
    GLFWwindow *window = init_window(pixel_width, pixel_height);
    init();
    // getchar();
    #ifdef __EMSCRIPTEN__
    main_loop_data.window = window;
    emscripten_set_main_loop(emscripten_main_loop, 0, 1);
    #else
    for (size_t k = 0; !glfwWindowShouldClose(window); k++) {
        render(NULL);
        glfwPollEvents();
        glfwSwapBuffers(window);
    }
    #endif
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}

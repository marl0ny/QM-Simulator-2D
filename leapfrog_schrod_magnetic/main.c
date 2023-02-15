#include <GLES3/gl3.h>
#include <GLFW/glfw3.h>
#include <stdio.h>
#include "gl_wrappers/gl_wrappers.h"
#include "init_render.h"


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
    for (size_t k = 0; !glfwWindowShouldClose(window); k++) {
        render(NULL);
        glfwPollEvents();
        glfwSwapBuffers(window);
    }
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}

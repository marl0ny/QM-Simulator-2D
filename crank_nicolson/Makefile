MACOSX_HOMEBREW = yes

SHELL = /bin/bash
# FLAGS = -O2 -Wall
FLAGS = -O0 -Wall -g
C_COMPILE = /usr/bin/clang

ifdef MACOSX_HOMEBREW
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers -I/opt/homebrew/include
LIBS = -ldl -L/opt/homebrew/lib -lglfw\
       -framework CoreVideo -framework OpenGL -framework IOKit\
       -framework Cocoa -framework Carbon
else
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers
LIBS = -lm -lGL -lGLEW -lglfw
endif


TARGET = ${PWD}/program

WEB_TARGET = main.js

C_SOURCES = ${PWD}/gl_wrappers/gl_wrappers.c ${PWD}/summation_gl.c \
            ${PWD}/bicgstab_gl.c ${PWD}/simulation.c ${PWD}/view.c

OBJECTS = gl_wrappers.o summation_gl.o bicgstab_gl.o simulation.o view.o

all: ${TARGET}

${TARGET}: ${OBJECTS}
	${C_COMPILE} ${FLAGS} -o $@ $^ ${LIBS}

${WEB_TARGET}: ${C_SOURCES}
	emcc -o $@ $^ ${INCLUDE} -v -s WASM=1 -s USE_GLFW=3 -s FULL_ES3=1 \
	-s TOTAL_MEMORY=100MB --embed-file shaders

${OBJECTS}: ${C_SOURCES}
	${C_COMPILE} ${FLAGS} -c $^ ${INCLUDE}

clean:
	rm -f ${OBJECTS} ${TARGET}

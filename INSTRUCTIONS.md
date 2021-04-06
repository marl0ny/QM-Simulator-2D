# Instructions
When you open the app, the first thing you will see is the time evolution of the wavefunction in an embedded Simple Harmonic Oscillator potential. The brightness and colour of the wavefunction corresponds to its probability density and complex phase. 
Click anywhere on the box to initialize a new wavefunction, where the  motion of the mouse at release determines the initial momentum of the wavefunction.
To the right of the box are the GUI controls. These are:
- **Instructions**. Link to this document.
- **Source**. Link to the source code.
- **Brightness** slider. Change the brightness of the wavefunction.
- **Speed** slider. Change the number of time steps per each frame of animation.
- **Colour Phase** checkbox. Check this to visualize the phase of the complex wavefunction using colours.
- **Mouse Usage** dropdown. Use the mouse to either place a new wavefunction **new Ψ(x, y)**, sketch a potential barrier **sketch barrier**, or draw a box and show the probability of finding the particle inside it **prob. in box**.
- **Preset Potential** dropdown. Modify the potential within the box using the preset options found here. The options are SHO (Simple Harmonic Oscillator, up to the box boundaries), ISW (Infinite Square Well), Double Slit, Single Slit, Step, 1/r, and Triple Slit. The default potential at the start is SHO.
- **Mouse Usage Controls** folder. Contains widgets that pertain to what is selected in the Mouse dropdown. A list of what these widgets do for each of the Mouse dropdown options is shown below:
    - **new Ψ(x, y)**
        - **Fix Init. Mom.** checkbox. Fix Initial Momentum. Instead of using the motion of the mouse to specify the wavefunction's expected initial momentum, use the controls found here instead.
        - **sigma** slider. The new wavefunction is initialized as a Gaussian wavepacket, and this slider
        controls its standard deviation. Note that the sigma value are in texture units, where in these units the width and height of the boundaries are equal to one.
        - **kx** slider. Proportional to the initial momentum in the x-direction (if `px` is the x-momentum, then `px = 2*π*kx/Lx`, where `Lx` is the width of the box).
        - **ky** slider. Proportional to the initial momentum in the y-direction (if `py` is the y-momentum, then `py = 2*π*ky/Ly`, where `Ly` is the height of the box).
    - **sketch barrier**
        - **Draw Type** dropdown. Specify a shape to sketch a new potential barrier.
        - **Draw Width** slider. The draw width. For square this equals its side length, for circle
        this equals its radius, and for a Gaussian the draw width is proportional to its standard deviation. Note that the values shown are in texture coordinates, where the width and height of the box are equal to one.
        - **E** slider. Max energy of the newly drawn potential barrier.
    - **prob. in box**
        - **Probability in Box**. This shows the probability density within the box.

- **Preset Potential Controls** folder. Contains sliders to manipulate the shape of the preset potential. Note that the values of any lengths shown are in texture coordinates, where the width and height of the box are equal to one.
- **Measure Position** button. Perform a measurement on the position of the particle. The wavefunction of the particle is subsequently localized at the measurement position.
### More Controls Folder
- **Show Dimensions** folder. Show the width and height of the box in the units that the simulation uses.
- **Change Grid Size** folder. Change the grid dimensions.
- **Text Edit Potential** folder. This contains the **Enter Potential V(x, y)** entry box and the **Use Tex Coordinates** checkbox. The **Enter Potential V(x, y)** entry box is where you can type in a
new potential.
Note that the value of the potential at a given point may be cutoff if it's too high or too deep. Checking **Use Tex Coordinates** uses the coordinates of the texture image to express V(x, y) instead of the coordinates in the simulation. Note that the origin `0, 0` is defined at the bottom left corner of the box. The folder **Edit Variables** contains sliders for any inputted variables that are not x or y.
- **Edit Boundary Type** folder. Change the boundary conditions, where selecting **Dirichlet** sets the wavefunction to zero at the boundaries, **Neumann** sets the first spatial derivative with respect to the boundary normal to zero, and **Periodic** makes the simulation wrap around itself.
- **Edit Other Values** folder. This contains sliders to modify the mass **m** of the particle, the time step length **dt**, or the discrete **Laplacian** stencil size.


### Issues
- To my knowledge, WebGL does not require for highp float to be at least 32 bit. If it is less than this on your machine, you may see wavefunction quickly decay to zero.
- There is nothing stopping you from placing wavepackets on top of irregular shaped potentials, or drawing potential barriers on top of wavepackets. Weird behaviour may also occur when placing a new wavefunction at the boundaries.
- Things with high momentum may propagate in a square-like way, when it should instead propagate in a circular fashion. 

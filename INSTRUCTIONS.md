# Instructions
When you open the app, the first thing that you will see is an empty square grey box where the wavefunction should reside. 
Click anywhere on the box to initialize the wavefunction, where its brightness and colour corresponds to its probability density and complex phase respectively. The motion of the mouse at release determines the initial momentum of the wavefunction.
To the right of the box are the GUI controls. These are:
- **Instructions**. Link to this document.
- **Source**. Link to the source code.
- **Brightness** slider. Change the brightness of the wavefunction.
- **Speed** slider. Change the number of time steps per each frame of animation.
- **Colour Phase** checkbox. Check this to visualize the phase of the complex wavefunction using colours.
- **Mouse Usage** dropdown. Use the mouse to either place a new wavefunction **new Ψ(x, y)**, sketch a potential barrier **sketch barrier**, or draw a box and show the probability of finding the particle inside it **prob. in box**.
- **Preset Potential** dropdown. Modify the potential within the box using the preset options found here. The options are SHO (Simple Harmonic Oscillator), ISW (Infinite Square Well), Double Slit, Single Slit, Step, and 1/r. The default potential at the start is SHO.
- **Mouse Usage Controls** folder. Contains widgets that pertain to what is selected in the Mouse dropdown. A list of what these widgets do for each of the Mouse dropdown options is shown below:
    - **new Ψ(x, y)**
        - **Fix p0**. Instead of using the motion of the mouse to specify the wavefunction's expected initial momentum, use the controls found here instead.
        - **px**. Expected initial momentum in the x-direction.
        - **py**. Expected initial momentum in the y-direction.
    - **sketch barrier**
        - **Draw Type**. Specify a shape to sketch a new potential barrier.
        - **Draw Width**. The draw width. For square this equals its side length, for circle
        this equals its radius, and for a Guassian the draw width is proportional to its standard deviation. 
        - **E**. Max energy of the newly drawn potential barrier.
    - **prob. in box**
        - **Probability in Box**. This shows the probability density within the box.

- **Preset Potential Controls** folder. Contains sliders to manipulate the shape of the preset potential. 
- **Measure Position** button. Perform a measurement on the position of the particle. The wavefunction of the particle is subsequently localized at the measurement position.
### More Controls Folder
- **Change Grid Size** folder. Change the grid dimensions.
- **Text Edit Potential** folder. This contains the **Enter Potential V(x, y)** entry box and the **Use Tex Coordinates** checkbox. The **Enter Potential V(x, y)** entry box is where you can type in a
new potential.
Note that the value of the potential at a given point may be cutoff if it's too high or too deep. Checking **Use Tex Coordinates** uses the coordinates of the texture image to express V(x, y) instead of the coordinates in the simulation. Note that the origin `0, 0` is defined at the bottom left corner of the box. The folder **Edit Variables** contains sliders for any inputted variables that are not x or y.
- **Edit Boundary Type** folder. Change the boundary conditions, where checking the **s periodic** checkbox makes the simulation periodic in the horizontal direction, and likewise checking the **t periodic** checkbox adds periodicity in the vertical direction.
- **Edit Other Values** folder. This contains sliders to modify the mass **m** of the particle or the time step length **dt**.

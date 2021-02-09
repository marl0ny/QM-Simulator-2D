# Quantum Mechanics in 2D
This [WebGL program](https://marl0ny.github.io/QM-Simulator-2D/index.html) simulates the quantum mechanics of a single particle trapped inside a 2D box, 
where within the box the user can redraw new potential barriers. 

The simulation uses a method described in page 690 of An Introduction to Computer Simulation Methods
by Gould H. et al., which involves splitting the wavefunction into its real and imaginary components,
performing a half-step to advance the real component in time, then using these updated real values to update the imaginary part.

# Instructions
When you open the app, the first thing you will see is a box where the wavefunction resides.
Click anywhere on the box to initialize the wavefunction, which is displayed as a bright and colourful blob. Its brightness and colour corresponds to its probability density and complex phase respectively.
To the right of the box are the GUI controls. These are:
- **Colour Phase** checkbox. Check this to visualize the phase of the complex wavefunction using colours.
- **Brightness** slider. Change the brightness of the wavefunction.
- **Speed** slider. Change the number of time steps per each animation frame.
- **Mouse** dropdown. Use the mouse to either place a new wavefunction `new Ψ(x, y)`, redraw the current potential `reshape V(x, y)`, or draw a rectangular region of interest `draw ROI` 
(currently this option only outputs to console the probability of finding the particle in the region of interest). 
- **Preset Potential** dropdown. Modify the potential within the box using the preset options found here. The options are SHO (Simple Harmonic Oscillator), ISW (Infinite Square Well), Double Slit, Single Slit, and 1/r. The default potential at the start is SHO.
- **Preset Controls** folder. Contains sliders to manipulate the shape of the preset potential. 
- **Measure Position** button. Perform a measurement on the position of the particle. The wavefunction of the particle is subsequently localized at the measurement position.
- Under the folders **More Controls** and **Text Edit Potential** is the **Enter Potential V(x, y)** entry
box and the **Use Tex Coordinates** checkbox. The **Enter Potential V(x, y)** entry box is where you can type in a
new potential. Please note that as of right now you cannot use `**` or `^` to express powers. 
Also note that the value of the potential at a given point may be cutoff if it's too high or too deep. Checking **Use Tex Coordinates** uses the coordinates of the texture image to express V(x, y) instead of the coordinates in the simulation. Note that the origin `0, 0` is defined at the bottom left corner of the box. The folder **Edit Variables** contains sliders for any inputted variables that are not x or y.
- Also under the **More Controls** folder is the **Edit Uniforms Folder** which contains sliders to modify the mass **m** of the particle or the time step length **dt**.


# References
 - Gould, H., Tobochnik J., Christian W. (2007). Quantum Systems.
 In <em>An Introduction to Computer Simulation Methods</em>, 
chapter 16. Pearson Addison-Wesley.
 - Schroeder D. [Quantum Scattering in Two Dimensions](https://physics.weber.edu/schroeder/software/QuantumScattering2D.html).

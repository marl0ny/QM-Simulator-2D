



function init4SpinorWavefunc(a0, a1, a2, a3, params) {
    let normalize = function(values) {
        sum = 0.0;
        for (let e of values) {
            sum += e.x*e.x + e.y*e.y;
        }
        let normFact = 1.0/Math.sqrt(sum);
        for (let i = 0; i < values.length; i++) {
            values[i].x *= normFact;
            values[i].y *= normFact;
        }

    }
    normalize([a0, a1, a2, a3]);
    let add = function(addList) {
        let xSum = 0.0;
        let ySum = 0.0;
        for (let elem of addList) {
            let z = elem[0], w = elem[1]; 
            xSum += z.x*w.x - z.y*w.y;
            ySum += z.x*w.y + z.y*w.x;
        }
        return {x: xSum, y: ySum};
    };
    let mc = params.m*params.c;
    let px = 2.0*Math.PI*params.px/params.w;
    let py = 2.0*Math.PI*params.py/params.h;
    let p2 = px*px + py*py;
    let p = Math.sqrt(p2);
    let omega = Math.sqrt(mc*mc + p2);
    let den1 = p*Math.sqrt((mc - omega)*(mc - omega) + p2);
    let den2 = p*Math.sqrt((mc + omega)*(mc + omega) + p2);
    // The free particle positive energy normalized eigenstates are found
    // by diagonalizing the alpha_i p_i + beta m c matrix.
    // This can be done symbolically using a coputer algebra system
    // like Sympy.
    // More info found here: https://en.wikipedia.org/wiki/Dirac_spinor.
    let e00 = {x: 0.0, y: 0.0};
    let e01 = {x: px*(mc - omega)/den1, y: py*(mc - omega)/den1};
    let e02 = {x: p2/den1, y: 0.0};
    let e03 = {x: 0.0, y: 0.0};
    let e10 = {x: px*(mc - omega)/den1, y: -py*(mc - omega)/den1};
    let e11 = {x: 0.0, y: 0.0};
    let e12 = {x: 0.0, y: 0.0};
    let e13 = {x: p2/den1, y: 0.0};
    let e20 = {x: 0.0, y: 0.0};
    let e21 = {x: px*(mc + omega)/den2, y: py*(mc + omega)/den2};
    let e22 = {x: p2/den2, y: 0.0};
    let e23 = {x: 0.0, y: 0.0};
    let e30 = {x: px*(mc + omega)/den2, y: -py*(mc + omega)/den2};
    let e31 = {x: 0.0, y: 0.0};
    let e32 = {x: 0.0, y: 0.0};
    let e33 = {x: p2/den2, y: 0.0};
    let u0 = add([[a0, e00], [a1, e10], [a2, e20], [a3, e30]]);
    let u1 = add([[a0, e01], [a1, e11], [a2, e21], [a3, e31]]);
    let v0 = add([[a0, e02], [a1, e12], [a2, e22], [a3, e32]]);
    let v1 = add([[a0, e03], [a1, e13], [a2, e23], [a3, e33]]);
    return {u: [u0, u1], v: [v0, v1]};
}
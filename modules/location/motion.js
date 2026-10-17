(function (root) {
  "use strict";
  const defaults = Object.freeze({minPosition:-8,maxPosition:8,initialPosition:6,
    nearDistance:2,runSpeed:1.5,walkSpeed:0.6,keyboardStep:0.25,turnSeconds:0.26,spriteBaseDirection:-1});
  function readConfig(input) {
    const c = Object.assign({}, defaults, input || {});
    for (const key of Object.keys(defaults)) {
      if (typeof c[key] !== "number" || !Number.isFinite(c[key])) throw new Error("Invalid configuration: " + key);
    }
    if (!(c.minPosition < 0 && c.maxPosition > 0)) throw new Error("The axis must extend to both sides of zero.");
    if (Math.min(c.nearDistance,c.runSpeed,c.walkSpeed,c.keyboardStep,c.turnSeconds) <= 0) throw new Error("Distances, speeds and turn duration must be positive.");
    if (Math.abs(c.spriteBaseDirection)!==1) throw new Error("spriteBaseDirection must be -1 or 1.");
    c.initialPosition = clamp(c.initialPosition,c);
    return Object.freeze(c);
  }
  function clamp(x,c) { return Math.max(c.minPosition,Math.min(c.maxPosition,x)); }
  function mode(x,c) { return Math.abs(x) < 1e-9 ? "arrived" : Math.abs(x) > c.nearDistance ? "run" : "walk"; }
  function advance(x,seconds,c) {
    if (!Number.isFinite(x) || !Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid motion step.");
    let distance = Math.abs(clamp(x,c));
    // Account for the speed change even when one time step crosses the boundary.
    if (distance > c.nearDistance) {
      const runTime = Math.min(seconds,(distance-c.nearDistance)/c.runSpeed);
      distance -= runTime*c.runSpeed;
      seconds -= runTime;
    }
    distance = Math.max(0,distance-seconds*c.walkSpeed);
    if (distance < 1e-9) return 0;
    return Math.sign(x)*distance;
  }
  function percent(x,c) { return (clamp(x,c)-c.minPosition)/(c.maxPosition-c.minPosition)*100; }
  function fromPixel(clientX,left,width,c) {
    if (!(width > 0) || !Number.isFinite(clientX)) throw new Error("Invalid axis geometry.");
    return clamp(c.minPosition+(clientX-left)/width*(c.maxPosition-c.minPosition),c);
  }
  function facing(x,c) { return x<0 ? c.spriteBaseDirection : -c.spriteBaseDirection; }
  function turnScale(from,to,progress) {
    const t=Math.max(0,Math.min(1,progress));
    const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    return from+(to-from)*eased;
  }
  const api = Object.freeze({defaults,readConfig,clamp,mode,advance,percent,fromPixel,facing,turnScale});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LocationMotion = api;
})(typeof window !== "undefined" ? window : globalThis);

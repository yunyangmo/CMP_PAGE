(function () {
  "use strict";
  const $=id=>document.getElementById(id), motion=window.LocationMotion;
  const c=motion.readConfig(window.LOCATION_MOTION_CONFIG);
  const demo=document.querySelector(".demo"),rail=$("rail"),handle=$("position-handle"),human=$("human");
  const state={x:c.initialPosition,playing:true,dragging:false,facing:motion.facing(c.initialPosition,c),turn:null};
  let lastTime=null,dragId=null,dragElement=null,dragOffset=0,lastMode=null,frame=null,destroyed=false;
  const controller=new AbortController();
  const listen=(node,event,fn)=>node.addEventListener(event,fn,{signal:controller.signal});
  handle.setAttribute("aria-valuemin",String(c.minPosition));
  handle.setAttribute("aria-valuemax",String(c.maxPosition));
  const origin=motion.percent(0,c);
  document.querySelector(".target").style.left=origin+"%";
  document.querySelector(".origin").style.left=origin+"%";

  function render() {
    const mode=motion.mode(state.x,c);
    demo.style.setProperty("--position",motion.percent(state.x,c)+"%");
    demo.style.setProperty("--facing",String(state.facing));
    $("run-sprite").hidden=mode!=="run";
    $("walk-sprite").hidden=mode==="run";
    handle.setAttribute("aria-valuenow",state.x.toFixed(2));
    handle.setAttribute("aria-valuetext",Math.abs(state.x).toFixed(2)+" metres "+(state.x<0?"left":state.x>0?"right":"at the origin"));
    demo.classList.toggle("is-dragging",state.dragging);
    if(mode!==lastMode){$("announcement").textContent=mode==="arrived"?"Movement stopped.":mode==="run"?"Running.":"Walking.";lastMode=mode;}
  }
  function beginTurn() {
    if(Math.abs(state.x)<1e-9)return;
    const to=motion.facing(state.x,c);
    if(state.turn&&state.turn.to===to)return;
    if(Math.abs(state.facing-to)<1e-9){state.facing=to;state.turn=null;return;}
    state.turn={from:state.facing,to,elapsed:0};
  }
  function setPosition(x) {
    if(typeof x!=="number"||!Number.isFinite(x))throw new Error("Position must be finite.");
    state.x=motion.clamp(x,c);
    if(!state.dragging)beginTurn();
    render();
  }
  function startDrag(event) {
    if(event.button!==undefined&&event.button!==0)return;
    if(dragId!==null)return;
    event.preventDefault();event.stopPropagation();
    dragId=event.pointerId;dragElement=event.currentTarget;state.dragging=true;
    const rect=rail.getBoundingClientRect(),anchored=dragElement===handle||dragElement===human;
    dragOffset=anchored?event.clientX-(rect.left+motion.percent(state.x,c)/100*rect.width):0;
    dragElement.setPointerCapture(dragId);
    if(!anchored)setPosition(motion.fromPixel(event.clientX,rect.left,rect.width,c));
    render();
  }
  function moveDrag(event) {
    if(event.pointerId!==dragId)return;
    event.preventDefault();const rect=rail.getBoundingClientRect();
    setPosition(motion.fromPixel(event.clientX-dragOffset,rect.left,rect.width,c));
  }
  function endDrag(event) {
    if(event&&event.pointerId!==dragId)return;
    const element=dragElement,id=dragId;
    dragId=null;dragElement=null;state.dragging=false;
    if(element&&id!==null&&element.hasPointerCapture(id))element.releasePointerCapture(id);
    beginTurn();lastTime=null;render();
  }
  for(const node of [handle,human,rail]) {
    listen(node,"pointerdown",startDrag);listen(node,"pointermove",moveDrag);
    listen(node,"pointerup",endDrag);listen(node,"pointercancel",endDrag);
    listen(node,"lostpointercapture",event=>{if(event.pointerId===dragId)endDrag(event);});
  }
  listen(handle,"keydown",event=>{
    let next=state.x;
    const step=c.keyboardStep*(event.shiftKey?4:1);
    if(event.key==="ArrowLeft")next-=step;
    else if(event.key==="ArrowRight")next+=step;
    else if(event.key==="Home")next=c.minPosition;
    else if(event.key==="End")next=c.maxPosition;
    else return;
    event.preventDefault();setPosition(next);lastTime=null;
  });
  listen(window,"blur",()=>{if(state.dragging)endDrag();});
  listen(document,"visibilitychange",()=>{lastTime=null;});
  function tick(now) {
    if(destroyed)return;
    if(lastTime!==null&&state.playing&&!document.hidden) {
      const dt=Math.min((now-lastTime)/1000,.05);
      if(state.turn) {
        state.turn.elapsed+=dt;
        state.facing=motion.turnScale(state.turn.from,state.turn.to,state.turn.elapsed/c.turnSeconds);
        if(state.turn.elapsed>=c.turnSeconds){state.facing=state.turn.to;state.turn=null;}
      } else if(!state.dragging)state.x=motion.advance(state.x,dt,c);
      render();
    }
    lastTime=now;frame=requestAnimationFrame(tick);
  }
  render();
  const images=Array.from(document.querySelectorAll("img"));
  Promise.all(images.map(img=>img.decode?img.decode():new Promise((resolve,reject)=>{
    if(img.complete){img.naturalWidth?resolve():reject(new Error("Image missing"));return;}
    img.addEventListener("load",resolve,{once:true});img.addEventListener("error",reject,{once:true});
  }))).then(()=>{if(!destroyed)frame=requestAnimationFrame(tick);}).catch(()=>{
    if(destroyed)return;
    state.playing=false;render();$("error").hidden=false;
    $("error").textContent="Image unavailable. Keep the assets folder beside index.html.";
  });
  window.LocationMotionDemo=Object.freeze({config:c,setPosition,
    getState:()=>({x:state.x,distance:Math.abs(state.x),motion:motion.mode(state.x,c),playing:state.playing,
      dragging:state.dragging,facing:state.facing,turning:!!state.turn}),
    pause:()=>{state.playing=false;render();},resume:()=>{state.playing=true;lastTime=null;render();},
    reset:()=>{endDrag();state.playing=true;setPosition(c.initialPosition);lastTime=null;},
    destroy:()=>{destroyed=true;controller.abort();if(frame!==null)cancelAnimationFrame(frame);endDrag();}});
})();

/* ====================================================
       Advanced Floating-to-Layout Scroll Interaction (Option C)
       - GSAP + ScrollTrigger for scroll driven transforms
       - Magnetic + inertial mouse movement for organic floating feel
       - Items move to slot positions on scroll down, and reverse on scroll up
       ==================================================== */

    gsap.registerPlugin(ScrollTrigger);

    const floatingItems = Array.from(document.querySelectorAll('.floating-item'));
    const slots = {};
    document.querySelectorAll('.slot').forEach(s => slots[s.id] = s);

    // store original transforms/positions for reversing
    // ---- Setup floating items with base positions ----
floatingItems.forEach((el, i) => {
  el.isDocked = false;

  // Base position
  const rect = el.getBoundingClientRect();
  el.base = { x: 0, y: 0 }; // relative base offset for swap/drift
  el.offset = { x: 0, y: 0 }; // current additive drift/magnetic offsets

  // Random drift parameters
  function startDrift() {
    function randomDriftCycle() {
      const xAmt = gsap.utils.random(-50, 50);
      const yAmt = gsap.utils.random(-40, 40);
      const rAmt = gsap.utils.random(-12, 12);
      const dur = gsap.utils.random(3.5, 6);

      gsap.to(el.offset, {
        x: xAmt,
        y: yAmt,
        rotation: rAmt,
        duration: dur,
        ease: "sine.inOut",
        onUpdate: updateTransform,
        onComplete: randomDriftCycle
      });
    }
    randomDriftCycle();
  }

  startDrift();

  // Apply final transform
  function updateTransform() {
    const x = el.base.x + el.offset.x;
    const y = el.base.y + el.offset.y;
    const r = el.offset.rotation || 0;
    gsap.set(el, { x, y, rotation: r });
  }

  el.updateTransform = updateTransform;
});

// ---- Magnetic hover effect ----
(function(){
  const playground = document.getElementById('playground');
  let mouse = {x:0, y:0};
  let velocity = {x:0, y:0};
  let last = {x:0,y:0,t:Date.now()};

  playground.addEventListener('pointermove', (e)=>{
    const rect = playground.getBoundingClientRect();
    mouse.x = (e.clientX - (rect.left + rect.width/2));
    mouse.y = (e.clientY - (rect.top + rect.height/2));
  });

  playground.addEventListener('pointerleave', ()=> { mouse.x=0; mouse.y=0; });

  function step(){
    const now = Date.now();
    const dt = Math.min(40, now-last.t)/1000;
    last.t = now;

    velocity.x += (mouse.x - velocity.x) * (0.08 + Math.min(0.07, dt*0.2));
    velocity.y += (mouse.y - velocity.y) * (0.08 + Math.min(0.07, dt*0.2));

    floatingItems.forEach((el,i)=>{
      if(el.isDocked) return;

      const strength = 0.015 + (0.007 * (i%3));
      const tx = velocity.x * strength;
      const ty = velocity.y * strength;
      const tilt = velocity.x * strength * 0.12;

      el.offset.x += tx;
      el.offset.y += ty;
      el.offset.rotation = (el.offset.rotation || 0) + tilt;
      el.updateTransform();
    });

    requestAnimationFrame(step);
  }

  step();
})();

// ---- Swap positions using base positions ----
function swapPositions() {
  const freeItems = floatingItems.filter(el => !el.isDocked);
  if(freeItems.length < 2) return;

  const [a,b] = gsap.utils.shuffle(freeItems).slice(0,2);

  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();
  const dx = rectB.left - rectA.left;
  const dy = rectB.top - rectA.top;

  // Animate base position
  gsap.to(a.base, { x: a.base.x + dx, y: a.base.y + dy, duration: gsap.utils.random(2,3), ease:"power1.inOut" });
  gsap.to(b.base, { x: b.base.x - dx, y: b.base.y - dy, duration: gsap.utils.random(2,3), ease:"power1.inOut" });

  // Keep updating transform
  gsap.delayedCall(gsap.utils.random(4,8), swapPositions);
}

// Kick off swapping
swapPositions();

// ---- Docking awareness via ScrollTrigger ----
floatingItems.forEach(el=>{
  const targetId = el.dataset.target;
  const slotEl = document.getElementById(targetId);
  if(!slotEl) return;

  ScrollTrigger.create({
    trigger: productsSection,
    start: "top center",
    end: "bottom top+=120",
    onUpdate: self=>{
      const p=self.progress;
      if(p>0.85){
        el.isDocked = true;
        el.style.pointerEvents = "none";
        slotEl.querySelector('.placeholder').style.opacity="0";
      } else {
        el.isDocked = false;
        el.style.pointerEvents = "auto";
        slotEl.querySelector('.placeholder').style.opacity="1";
      }
    }
  });
});



    // ---- 3) Scroll-triggered slotting animation ----
    // We'll create a timeline that, for each floating item, tween it into the matching slot when the products section is reached.
    // Reverse will animate them back to their original positions.
    // Technique:
    //  - compute difference between floating-item bounding rect and slot bounding rect
    //  - tween translate/scale/rotation to achieve a smooth "slot" movement
    //  - optimized by using translate transforms (no layout thrash)

    const productsSection = document.getElementById('products');

    // helper: compute transform values required to move el to target element
    function computeTransformForSlot(el, slot){
      const elRect = el.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();

      // compute center points
      const elCenter = { x: elRect.left + elRect.width/2, y: elRect.top + elRect.height/2 };
      const slotCenter = { x: slotRect.left + slotRect.width/2, y: slotRect.top + slotRect.height/2 };

      // page scroll offset included - ScrollTrigger will handle during animation
      const dx = slotCenter.x - elCenter.x;
      const dy = slotCenter.y - elCenter.y;

      // scale ratio (slot inner placeholder size vs el size)
      const targetInner = slot.querySelector('.placeholder');
      const innerRect = targetInner ? targetInner.getBoundingClientRect() : slotRect;
      const scale = Math.min((innerRect.width*0.9) / elRect.width, (innerRect.height*0.9) / elRect.height);

      return { dx, dy, scale, slotRect, elRect };
    }

    // build main timeline
    const mainTl = gsap.timeline({
      paused:true,
      defaults: {duration: 1.1, ease: "power3.inOut"}
    });

    // For staging, we create individual tweens that we will control with ScrollTrigger.
    floatingItems.forEach((el, idx) => {
      const targetId = el.dataset.target;
      const slotEl = document.getElementById(targetId);

      if(!slotEl){
        // if target slot missing, skip
        return;
      }

      // Each tween will 1) move into slot, 2) add a subtle border radius removal & box-shadow change
      const trans = computeTransformForSlot(el, slotEl);

      // We animate using x/y/scale relative to current transforms.
      // Because we already have some dynamic transforms from the magnetic loop, we capture the current transform via gsap.getProperty
      const tween = gsap.to(el, {
        x: `+=${trans.dx}`,
        y: `+=${trans.dy}`,
        scale: trans.scale,
        rotation: 0,
        duration: 1.1 + (idx * 0.08),
        ease: "power2.out",
        boxShadow: "0 6px 16px rgba(10,18,48,0.06)",
        borderRadius: "12px",
        paused: true,
        onStart: ()=> {
          // elevate z-index to ensure it sits above during motion
          el.style.zIndex = 300 + idx;
        }
      });

      // we add to timeline (but keep paused; we'll drive via ScrollTrigger scrub)
      mainTl.add(tween, 0);
    });

    // create ScrollTrigger to drive the mainTl with scrub (so it's reversible and mapped to scroll progress)
    ScrollTrigger.create({
      trigger: productsSection,
      start: "top center",     // when the products section top hits center of viewport
      end: "bottom top+=120",  // a little beyond for graceful end
      scrub: 0.6,              // scrub for direct control; non-integer to smooth
      animation: mainTl,
      onEnter: self => {
        // subtle style change if needed
      },
      onLeaveBack: self => {
        // when scrolling back above the start point, ensure items re-enable float
      }
    });

    /*
      Extra polish: When an item reaches its slot, we "attach" it visually into the slot by setting pointer-events none
      and hiding the slot placeholder opacity. We use another ScrollTrigger to toggle classes near progress boundaries.
    */
    floatingItems.forEach((el, idx) => {
      const targetId = el.dataset.target;
      const slotEl = document.getElementById(targetId);
      if(!slotEl) return;

      // compute rough thresholds based on mainTl labels
      ScrollTrigger.create({
        trigger: productsSection,
        start: "top center",
        end: "bottom top+=120",
        onUpdate: self => {
          const p = self.progress;
          // when progress is close to 1, consider "docked"
          if(p > 0.85){
            // dock
            el.style.pointerEvents = "none";
            slotEl.querySelector('.placeholder').style.opacity = "0";
          } else {
            el.style.pointerEvents = "auto";
            slotEl.querySelector('.placeholder').style.opacity = "1";
          }
        }
      });
    });

    // ---- 4) Responsiveness and recalculation on resize / orientation change ----
    let resizeId;
    function recalcAll(){
      // kill the timeline and rebuild to recompute transforms using updated DOM rects
      // For simplicity, reload page style effects by refreshing ScrollTrigger and recreating mainTl
      ScrollTrigger.refresh();
      // We choose to simply reload to recompute complex transforms safely in this demo (can be optimized)
      // But avoid forcing a full page reload in production; instead, rebuild tweens programmatically.
      // Here we simply refresh to be safe:
      // (If you'd like no reload, we can implement full tween reconstruction. Let me know.)
    }
    window.addEventListener('resize', ()=>{
      clearTimeout(resizeId);
      resizeId = setTimeout(recalcAll, 200);
    });

    // ---- 5) Accessibility / touch hints: make items draggable on touch for exploration ----
    floatingItems.forEach(el=>{
      let isDown = false;
      let start = {x:0,y:0};
      el.addEventListener('pointerdown', (e)=>{
        isDown = true;
        el.setPointerCapture(e.pointerId);
        start.x = e.clientX; start.y = e.clientY;
        el.style.cursor = "grabbing";
      });
      el.addEventListener('pointermove', (e)=>{
        if(!isDown) return;
        // simple follow while dragging (temporary transform add)
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        gsap.to(el, { x: `+=${dx*0.02}`, y: `+=${dy*0.02}`, duration: 0.25 });
        start.x = e.clientX; start.y = e.clientY;
      });
      el.addEventListener('pointerup', (e)=>{
        isDown = false;
        el.releasePointerCapture(e.pointerId);
        el.style.cursor = "grab";
      });
      el.addEventListener('pointercancel', ()=>{
        isDown = false;
      });
    });
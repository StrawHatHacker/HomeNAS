<!-- CREDIT: https://codepen.io/codelyds/pen/dPGXXZW -->

<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number;
    let h: number;
    let cols: number;
    let ypos: number[];
    let raf: number;

    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.floor(w / 16) + 1;
      ypos = Array(cols).fill(0);
    };

    const matrix = () => {
      // Create the trailing effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, w, h);

      // Set text style
      ctx.fillStyle = "hsl(141, 100%, 50%)";
      ctx.font = "15pt monospace";

      ypos.forEach((y, i) => {
        const text = String.fromCharCode(Math.random() * 128);
        const x = i * 16;
        ctx.fillText(text, x, y);

        // Reset drop to top randomly after it crosses screen height
        if (y > 100 + Math.random() * 10000) {
          ypos[i] = 0;
        } else {
          ypos[i] = y + 16;
        }
      });
    };

    const loop = () => {
      matrix();
      raf = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      init();
    };

    init();
    loop();

    window.addEventListener("resize", handleResize);

    // CLEANUP: Important for SvelteKit navigation
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
    };
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    z-index: -1;
    display: block;
    opacity: 0.4;
  }
</style>

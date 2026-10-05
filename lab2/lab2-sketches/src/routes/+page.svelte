<script>
  import { rows } from '$lib/data.js';
  import SketchA from '$lib/SketchA.svelte';
  import SketchB from '$lib/SketchB.svelte';
</script>

<svelte:head><title>Lab 2: LAX Sketches</title></svelte:head>

<main>
  <h1>My LAX Sketches</h1>
  <p>January–October 2019 and 2023 · Ten comparable terminals</p>
  <div class="sketches">
    <SketchA data={rows} />
    <SketchB data={rows} />
  </div>
</main>

<style>
  :global(body) { margin: 0; font-family: system-ui, sans-serif; color: #222; background: #fafafa; }
  main { max-width: 1200px; margin: auto; padding: 2rem; }
  h1 { font-size: 1.6rem; }
  .sketches { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
  @media (max-width: 750px) { .sketches { grid-template-columns: 1fr; } }
</style>

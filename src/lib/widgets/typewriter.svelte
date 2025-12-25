<script lang="ts">
  let { text = "", speed = 40 } = $props();

  let displayedText = $state("");
  let currentIndex = 0;

  $effect(() => {
    displayedText = "";
    currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        displayedText += text[currentIndex];
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  });
</script>

<span class="typewriter">
  {displayedText}<span class="cursor">_</span>
</span>

<style>
  .typewriter {
    display: inline;
  }

  .cursor {
    display: inline-block;
    width: 1ch;
    animation: blink 1s step-end infinite;
    color: var(--terminal-light-green);
  }

  @keyframes blink {
    from,
    to {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>

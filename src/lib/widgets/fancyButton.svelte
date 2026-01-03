<script lang="ts">
  const {
    text,
    onclick,
  }: {
    text: string;
    onclick?: () => void;
  } = $props();
</script>

<button class="fancy-btn" {onclick} title="">
  <div class="button-content">
    <span class="button-text">{text}</span>
  </div>
</button>

<style>
  @reference '../../routes/layout.css';

  .fancy-btn {
    flex-shrink: 0;
    display: inline-block;
    background: var(--terminal-green);
    border: 4px solid rgb(3, 53, 12);
    cursor: pointer;
    outline: none;
    padding: 0;
    transition: all 0.1s ease-in-out;

    & > .button-content {
      @apply py-4 px-6;
      background: var(--terminal-green);
      box-shadow:
        inset 0 -6px var(--terminal-dark-green),
        0 -2px var(--terminal-green);
      transition: all 0.1s ease-in-out;
      display: block;

      & > .button-text {
        color: black;
        display: block;
        transform: translate3d(0, -4px, 0);
        transition: all 0.1s ease-in-out;
      }
    }

    &:active {
      & > .button-content {
        box-shadow:
          inset 0 -1px var(--terminal-green),
          0 0 var(--terminal-green);

        & > .button-text {
          transform: translate3d(0, 0, 0);
        }
      }
    }
  }
</style>

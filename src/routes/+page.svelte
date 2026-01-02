<script lang="ts">
  import { ROUTES } from "$lib/types";
  import Checkbox from "$lib/widgets/checkbox.svelte";
  import FancyButton from "$lib/widgets/fancyButton.svelte";
  import Matrix from "$lib/widgets/matrix.svelte";
  import Typewriter from "$lib/widgets/typewriter.svelte";

  let pageState = $state<"email" | "code">("email");
  let email = $state("");
  let code = $state("");
  let deletePreviousSessions = $state(false);
  let messageDisplay = $state("");

  const sendCodeWithEmail = async () => {
    messageDisplay = "";
    if (email == "") return;

    try {
      const res = await fetch("/api/auth/sendEmail", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message);

      pageState = "code";
      messageDisplay = "Code sent to your email address.";
    } catch (error) {
      if (error instanceof Error && error.message != "")
        return (messageDisplay = error.message);
      messageDisplay = "Failed to send code.";
    }
  };

  const verifyCode = async () => {
    messageDisplay = "";
    if (code == "") return;

    try {
      const res = await fetch("/api/auth/verifyCode", {
        method: "POST",
        body: JSON.stringify({ email, code, deletePreviousSessions }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }

      window.location.href = ROUTES.crypt;
    } catch (error) {
      if (error instanceof Error && error.message != "")
        return (messageDisplay = error.message);
      messageDisplay = "Failed to verify code.";
    }
  };
</script>

<svelte:head>
  <title>NAS</title>
</svelte:head>

<Matrix />

<main
  class="flex flex-col items-center justify-center gap-10 h-screen w-fit mx-auto text-(--terminal-green)"
>
  <h1 class="text-center flex flex-col tracking-tighter">
    <span>strawhathacker's</span>
    <span>n.a.s.</span>
  </h1>

  <div id="terminal" class="mx-6">
    <p class="text-sm lg:text-md mt-2 mono">
      {#if messageDisplay != ""}
        <Typewriter text={messageDisplay} />
      {:else}
        WARNING: ACCESS IS RESTRICTED. FOR YOUR OWN SAFETY, <br />
        IF YOU DO NOT HAVE AUTHORIZATION, CLOSE THIS APPLICATION. <br />
        <span class="blink">_</span>
      {/if}
    </p>
  </div>

  {#if pageState === "email"}
      <form class="flex gap-2 flex-col md:flex-row items-stretch">
        <input
          id="nas-email"
          class="hacker-input"
          name="nas-email"
          type="email"
          placeholder="E-MAIL ADDRESS"
          autocomplete="email"
          inputmode="email"
          bind:value={email}
        />
        <FancyButton text="REQUEST CODE" onclick={sendCodeWithEmail} />
      </form>
  {:else if pageState === "code"}
    <div>
      <Checkbox
        label="DELETE_PREVIOUS_SESSIONS"
        bind:checked={deletePreviousSessions}
      />
      <div></div>
      <form class="flex gap-2 flex-col md:flex-row">
        <input
          class="hacker-input"
          type="password"
          placeholder="ENTER CODE"
          bind:value={code}
        />
        <FancyButton text="VERIFY" onclick={verifyCode} />
      </form>

      <button
        class="underline mt-2 text-sm w-full"
        onclick={() => ((messageDisplay = ""), (pageState = "email"))}
      >
        &lt; &lt; NO CODE RECEIVED. GO BACK.
      </button>
    </div>
  {/if}
</main>

<style>
  @reference "../routes/layout.css";

  h1 {
    font-size: clamp(2rem, 6vw, 5rem);
  }

  .hacker-input {
    backdrop-filter: blur(2px);
    color: var(--terminal-green);
    height: 100%;

    border: 1px solid var(--terminal-dark-green);

    @apply py-4 px-6;
  }

  .hacker-input::placeholder {
    color: var(--terminal-dark-green);
    opacity: 1;
  }

  .hacker-input:focus {
    outline: none;
    border: 1px solid var(--terminal-green);
    box-shadow: 0 0 8px var(--terminal-green);
  }
</style>

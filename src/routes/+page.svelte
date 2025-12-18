<script lang="ts">
  import { addToast } from "$lib/stores/toast";
  import FancyButton from "$lib/widgets/fancyButton.svelte";
  import Matrix from "$lib/widgets/matrix.svelte";

  // Use the Svelte 5 state rune for reactive and simple state management
  let pageState = $state<"email" | "code">("email");
  let email = $state("");
  let code = $state("");
  let messageDisplay = $state("");

  const sendCodeWithEmail = async () => {
    if (email == "") return;
    try {
      const res = await fetch("/api/auth/sendEmail", {
        method: "POST",
        body: JSON.stringify({ email: email }),
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
</script>

<Matrix />

<main
  class="flex flex-col items-center justify-center gap-10 h-screen w-fit mx-auto"
>
  <h1 class="text-3xl lg:text-8xl text-center">:: stawhathacker's nas ::</h1>

  <div id="terminal" class="mx-6">
    <p class="text-sm lg:text-lg mt-2 mono">
      WARNING: ACCESS IS RESTRICTED. <br />
      FOR YOUR OWN SAFETY, <br />
      IF YOU DO NOT HAVE AUTHORIZATION, CLOSE THIS APPLICATION. <br />
      {#if messageDisplay != ""}
        <span class="blink">{messageDisplay}</span>
      {:else}
        <span class="blink">_</span>
      {/if}
    </p>
  </div>

  {#if pageState === "email"}
    <div>
      <form class="flex gap-2 flex-col md:flex-row">
        <input type="email" placeholder="E-MAIL ADDRESS" bind:value={email} />
        <FancyButton text="REQUEST CODE" onclick={sendCodeWithEmail} />
      </form>

      <button
        class="underline mt-2 text-sm w-full"
        onclick={() => ((messageDisplay = ""), (pageState = "code"))}
      >
        KEY RECEIVED. PROCEED TO VERIFICATION >>
      </button>
    </div>
  {:else if pageState === "code"}<div>
      <form class="flex gap-2 flex-col md:flex-row">
        <input type="text" placeholder="ENTER CODE" />
        <FancyButton text="VERIFY" onclick={() => {}} />
      </form>

      <button
        class="underline mt-2 text-sm w-full"
        onclick={() => ((messageDisplay = ""), (pageState = "email"))}
      >
        NO KEY RECEIVED. RETURN TO REQUEST >>
      </button>
    </div>
  {/if}
</main>

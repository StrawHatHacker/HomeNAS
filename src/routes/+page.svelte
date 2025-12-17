<script lang="ts">
  import { addToast } from "$lib/stores/toast";

  // Use the Svelte 5 state rune for reactive and simple state management
  let pageState = $state<"email" | "code">("email");
  let email = $state("");
  let code = $state("");

  const sendCodeWithEmail = async () => {
    if (email == "") return;
    try {
      // pageState = "code";
      const res = await fetch("/api/auth/sendEmail", {
        method: "POST",
        body: JSON.stringify({ email: email }),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message);

      addToast("success", "Code sent to your email address.");
    } catch (error) {
      if (error instanceof Error && error.message != "")
        return addToast("error", error.message);
      addToast("error", "Failed to send code.");
    }
  };
</script>

<main class="flex flex-col items-center justify-center h-screen w-fit mx-auto">
  <h1 class="text-6xl">:: stawhathacker's nas ::</h1>

  <pre class="text-base mt-2 mb-8 mono">
    WARNING: ACCESS IS RESTRICTED.
    FOR YOUR OWN SAFETY,
    IF YOU DO NOT HAVE AUTHORIZATION, CLOSE THIS APPLICATION.
    <span class="blink">_</span>
  </pre>

  {#if pageState === "email"}
    <form class="flex gap-2">
      <input type="email" placeholder="E-MAIL ADDRESS" bind:value={email} />
      <button class="btn" onclick={sendCodeWithEmail}>REQUEST CODE</button>
    </form>

    <button class="underline mt-2 text-sm" onclick={() => (pageState = "code")}>
      KEY RECEIVED. PROCEED TO VERIFICATION >>
    </button>
  {:else if pageState === "code"}
    <form class="flex gap-2">
      <input type="text" placeholder="ENTER CODE" />
      <button class="btn">SUBMIT CODE</button>
    </form>

    <button
      class="underline mt-2 text-sm"
      onclick={() => (pageState = "email")}
    >
      NO KEY RECEIVED. RETURN TO REQUEST >>
    </button>
  {/if}
</main>

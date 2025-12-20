<script lang="ts">
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
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }

      window.location.href = "/dashboard";
    } catch (error) {
      if (error instanceof Error && error.message != "")
        return (messageDisplay = error.message);
      messageDisplay = "Failed to verify code.";
    }
  };
</script>

<Matrix />

<main
  class="flex flex-col items-center justify-center gap-10 h-screen w-fit mx-auto"
>
  <h1
    class="text-center flex flex-col tracking-tighter"
    data-text="STAWHATHACKER::NAS"
  >
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
    <div>
      <form class="flex gap-2 flex-col md:flex-row">
        <input
          id="nas-email"
          type="email"
          placeholder="E-MAIL ADDRESS"
          bind:value={email}
        />
        <FancyButton text="REQUEST CODE" onclick={sendCodeWithEmail} />
      </form>
    </div>
  {:else if pageState === "code"}
    <div>
      <Checkbox
        label="DELETE_PREVIOUS_SESSIONS"
        bind:checked={deletePreviousSessions}
      />
      <div></div>
      <form class="flex gap-2 flex-col md:flex-row">
        <input type="text" placeholder="ENTER CODE" bind:value={code} />
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
  h1 {
    font-size: clamp(2rem, 6vw, 5rem);
  }
</style>

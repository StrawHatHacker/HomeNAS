import { Auth } from "$lib/server/auth.js";
import { error, json, redirect } from "@sveltejs/kit";

export const POST = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    Auth.verifySession(cookies);

    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) return new Response('No file', { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // mkdirSync('./uploads', { recursive: true });
    // writeFileSync(`./uploads/${file.name}`, buffer);

    return json({});
};
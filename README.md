# RoxAI

RoxAI is a private engineering assistant built with Next.js and the Vercel AI SDK.

## Configure

Add the variables in `.env.example` to your deployment environment. Set up Google OAuth credentials with:

- Authorized JavaScript origin: your app URL (for local development, `http://localhost:3000`)
- Authorized redirect URI: `<your-app-url>/api/auth/callback/google`

Access is restricted to the Google account `sale@roxaii.com`. Set `NEXTAUTH_URL` to the deployed app URL and generate a unique `NEXTAUTH_SECRET` (for example, `openssl rand -base64 32`). Keep all secrets out of source control.

`AI_GATEWAY_API_KEY` is required for chat. Optionally set `AI_MODEL`; the default is `openai/gpt-4o-mini`.

## Run locally

```bash
pnpm dev
```

Assistant replies can be read aloud with the **Read aloud** control. Speech uses the browser's built-in speech synthesis; audio is not uploaded by this feature.

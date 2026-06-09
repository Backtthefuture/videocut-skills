# How to Get the API Key

This skill needs a **Volcengine/Doubao Speech ASR API key** for speech
recognition.

In Chinese product pages, you may see names like:

- 火山引擎
- 豆包语音
- 智能语音
- 语音识别
- 大模型录音文件识别

For this skill, these all point to the same practical need: an API key that can
call the speech recognition endpoint used by `剪口播/scripts/volcengine_transcribe.sh`.

## Before You Start

You need:

- A phone number or account that can log in to Volcengine.
- Real-name verification if the console asks for it.
- A payment method or free quota, depending on the current Volcengine policy.

Do not paste your API key into GitHub, public chat, screenshots, or shared docs.

## Step-by-step

1. Open the Volcengine console:
   [https://console.volcengine.com/](https://console.volcengine.com/)

2. Log in or create an account.

3. In the console search box, search one of these keywords:
   `语音识别`, `智能语音`, `豆包语音`, or `Speech`.

4. Enter the speech recognition product page.

5. If this is your first time, follow the console prompts to enable the service.
   The console may ask you to complete real-name verification first.

6. Look for an API key page. Depending on the current console version, it may be
   named one of these:
   `API Key`, `API Key 管理`, `密钥管理`, `应用管理`, or `访问密钥`.

7. Create a new key or create a new speech application and copy its API key.

8. Open this repository's local `.env` file:

   ```bash
   cd ~/.codex/skills/videocut-skills
   cp .env.example .env
   open -e .env
   ```

9. Paste the key like this:

   ```bash
   VOLCENGINE_API_KEY=your_real_key_here
   ```

10. Save the file.

## Which Key Should I Use?

Use the key for **speech recognition / ASR**, not a random LLM-only key.

If you already have a Doubao model key from 火山方舟, it may not work for this
skill unless the same key is allowed to call the speech recognition API. The
script sends requests to:

```text
https://openspeech.bytedance.com/api/v1/vc/submit
https://openspeech.bytedance.com/api/v1/vc/query
```

and passes your key with the `x-api-key` request header.

## Quick Test

After filling `.env`, run:

```bash
cd ~/.codex/skills/videocut-skills
test -n "$(grep '^VOLCENGINE_API_KEY=' .env | cut -d= -f2)" && echo "Key is set"
```

This only checks that the key exists locally. The first real transcription task
will verify whether the key has the right permission.

## Common Problems

### The script says `找不到 .env`

Make sure `.env` is in the repository root:

```text
~/.codex/skills/videocut-skills/.env
```

not inside `剪口播/`.

### The script says submit failed

Common causes:

- The key is empty or copied with extra spaces.
- The key is for another Volcengine product, not speech recognition.
- The speech recognition service is not enabled.
- The account has no quota or billing is not configured.
- The console has changed product names; search for `语音识别` or `智能语音`.

### I only see 火山方舟 / Doubao model keys

火山方舟 keys are usually for text/image/video model inference. This skill needs
speech recognition. Go back to the console product search and search
`语音识别`, `智能语音`, or `豆包语音`.

## Official Links

- Volcengine console:
  [https://console.volcengine.com/](https://console.volcengine.com/)
- Volcengine speech recognition API docs:
  [https://www.volcengine.com/docs/6561/1354868](https://www.volcengine.com/docs/6561/1354868)

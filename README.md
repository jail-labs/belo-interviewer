# Belo Research Interview Chatbot

An AI-powered qualitative research interviewer for Belo Medical Group's campaign targeting SEC AB Filipinos aged 18–24. Built with Next.js, Tailwind CSS, and the Anthropic API.

## What It Does

- Conducts a structured 30-minute in-depth interview following the v3 interview guide
- Follows the 5-part flow: Life Context → Skin as Identity → The Gap → Price Reveal → The Unlock
- Streams responses in real-time
- Tracks interview duration
- Exports full transcripts as downloadable text files

## Deploy to Vercel

### Option 1: Via GitHub (Recommended)

1. Push this folder to a GitHub repo:
   ```bash
   cd belo-interviewer
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create belo-interviewer --private --push
   ```

2. Go to [vercel.com/new](https://vercel.com/new) and import your repo.

3. In the Vercel dashboard, add the environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

4. Deploy.

### Option 2: Via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd belo-interviewer
   vercel deploy
   ```

3. Set the environment variable:
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```

4. Redeploy:
   ```bash
   vercel deploy --prod
   ```

## Run Locally

```bash
cd belo-interviewer
npm install
```

Create a `.env.local` file:
```
ANTHROPIC_API_KEY=your-key-here
```

Then:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Chat UI (landing → setup → interview → complete)
│   ├── globals.css         # Tailwind + custom styles
│   └── api/
│       ├── chat/route.ts   # Anthropic streaming chat endpoint
│       └── export/route.ts # Transcript download endpoint
```

## How the Interview Works

The system prompt encodes the full v3 interview guide:

1. **Part 1 (3 min):** Who are you — rapport + spending baseline
2. **Part 2 (8 min):** Skin as identity — origin story, routine, emotional weight
3. **Part 3 (10 min):** The gap — why not a clinic, social permission, family patterns
4. **Part 4 (6 min):** Price reveal — ₱2,100–₱3,400, then "so if it's not the price..."
5. **Part 5 (5 min):** The unlock — content preferences, future projection

The AI follows conversational rules: one question at a time, behavioral specifics over feelings, silence as a tool, normalization of negative responses, and never breaking character.

## Cost

Each interview uses approximately 10,000–15,000 tokens. At Sonnet pricing, that's roughly $0.10–0.15 per interview.

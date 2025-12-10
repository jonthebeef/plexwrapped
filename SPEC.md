# Plex Wrapped - Project Specification

## Overview

A web application that generates Spotify Wrapped-style year-in-review experiences for Plex music listeners. Users log in with their Plex account, we fetch their listening history via the Plex API, and render a beautiful, shareable stats experience.

**Target Launch:** December 2024 (to coincide with Spotify Wrapped cultural moment)

**Build Approach:** Build in public on Twitter/Threads, open source repo

---

## Why This Exists

### The Gap

- Plex has no native "Wrapped" feature
- Existing tools (Tautulli, Plex Rewind) are technical, installation-heavy, and video-focused
- No polished, zero-friction music stats experience for Plex users

### The Opportunity

- 800k+ members on r/PleX, 400k+ on r/selfhosted
- Self-hosted community loves "your data, your stats" narrative
- December timing capitalizes on Wrapped season buzz
- Music-first differentiates from existing tools

### The Advantage of Web App

- Zero installation - just log in with Plex
- Works on any device
- Shareable by design
- One codebase, easy iteration

---

## Technical Architecture

### Stack

| Layer         | Technology                        | Rationale                                             |
| ------------- | --------------------------------- | ----------------------------------------------------- |
| **Frontend**  | SvelteKit                         | Fast, modern, excellent Netlify support, fun to learn |
| **Hosting**   | Netlify                           | Preferred platform, generous free tier, great DX      |
| **Database**  | Supabase (PostgreSQL)             | Free tier, auth helpers, real-time if needed          |
| **Auth**      | Plex OAuth                        | Native Plex login, no passwords to manage             |
| **Styling**   | Tailwind CSS                      | Rapid UI development, consistent design               |
| **Image Gen** | Satori + Resvg (or html-to-image) | For shareable stats cards                             |

### Alternative DB: Convex

Convex is interesting but:

- Supabase free tier: 500MB database, 2GB bandwidth, unlimited API calls
- Convex free tier: 1GB storage, but more opinionated data model
- Supabase is more conventional (SQL), Convex is more reactive/real-time focused

**Recommendation:** Start with Supabase - it's simpler for this use case and you can always migrate.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SvelteKit App (Netlify)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ API Routes  │  │   Serverless Functions  │  │
│  │  /          │  │ /api/auth   │  │   - Plex API calls      │  │
│  │  /wrapped   │  │ /api/stats  │  │   - Stats processing    │  │
│  │  /share/[id]│  │ /api/share  │  │   - Image generation    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  Plex.tv    │ │  Supabase   │ │ User's Plex │
        │  OAuth API  │ │  Database   │ │   Server    │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### Data Flow

1. **User visits site** → Landing page with "Sign in with Plex" button
2. **Plex OAuth** → Redirect to plex.tv, user authorizes, redirect back with token
3. **Fetch data** → Use token to call Plex API, get play history
4. **Process stats** → Calculate top artists, albums, tracks, insights
5. **Render Wrapped** → Beautiful animated/interactive stats experience
6. **Share** → Generate image card, shareable link

---

## Plex API Details

### Authentication Flow

1. **Create PIN**: `POST https://plex.tv/api/v2/pins`

   - Headers: `X-Plex-Client-Identifier`, `X-Plex-Product`
   - Returns: `id` and `code`

2. **Redirect user**: `https://app.plex.tv/auth#?clientID={id}&code={code}&context[device][product]=Plex%20Wrapped`

3. **Poll for token**: `GET https://plex.tv/api/v2/pins/{id}`

   - When authorized, returns `authToken`

4. **Get user info**: `GET https://plex.tv/api/v2/user`
   - Headers: `X-Plex-Token: {authToken}`

### Key Endpoints (with user's token)

```
# Get user's servers
GET https://plex.tv/api/v2/resources?includeHttps=1

# Get library sections (find music library)
GET {serverUrl}/library/sections
Headers: X-Plex-Token: {token}

# Get play history (THE KEY ENDPOINT)
GET {serverUrl}/status/sessions/history/all?librarySectionID={musicLibraryId}
Headers: X-Plex-Token: {token}

# Get all tracks (for enrichment if needed)
GET {serverUrl}/library/sections/{id}/all?type=10
Headers: X-Plex-Token: {token}
```

### Play History Response Structure

```json
{
	"MediaContainer": {
		"size": 1000,
		"Metadata": [
			{
				"historyKey": "/status/sessions/history/1",
				"key": "/library/metadata/12345",
				"ratingKey": "12345",
				"title": "Track Name",
				"grandparentTitle": "Artist Name",
				"parentTitle": "Album Name",
				"type": "track",
				"viewedAt": 1702234567,
				"accountID": 1
			}
		]
	}
}
```

### Rate Limits & Considerations

- Plex API rate limits are undocumented but generally generous
- Large libraries (10k+ plays) may need pagination
- Some users have remote access disabled - need graceful handling
- Play history can be incomplete if user hasn't enabled it

---

## Database Schema (Supabase)

### Tables

```sql
-- Users (linked to Plex account)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plex_user_id TEXT UNIQUE NOT NULL,
  plex_username TEXT,
  plex_email TEXT,
  plex_thumb TEXT,  -- Avatar URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Wrapped results (cached stats)
CREATE TABLE wrapped_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  stats_json JSONB NOT NULL,  -- All calculated stats
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  share_id TEXT UNIQUE,  -- Short ID for sharing
  is_public BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, year)
);

-- Optional: Track individual plays for deeper analysis
-- (Only if we want to store history - privacy consideration)
CREATE TABLE play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_title TEXT,
  artist_name TEXT,
  album_name TEXT,
  played_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Indexes
CREATE INDEX idx_wrapped_share_id ON wrapped_results(share_id);
CREATE INDEX idx_wrapped_user_year ON wrapped_results(user_id, year);
```

### Privacy Approach Options

**Option A: No storage (most private)**

- Fetch from Plex, calculate stats, render, forget
- User must re-fetch each visit
- Can't share links (no persistent data)

**Option B: Cache results only (balanced)**

- Store calculated stats (top artists, totals, etc.)
- Don't store individual play history
- Enable shareable links
- Users can delete their data

**Option C: Full history (most features)**

- Store individual plays for year-over-year comparisons
- Requires clear privacy policy
- More storage, more responsibility

**Recommendation:** Start with Option B - cache results for sharing, don't store raw history.

---

## Feature Roadmap

### MVP (Week 1) - Launch Target

**Core Features:**

- [ ] Plex OAuth login
- [ ] Fetch play history from user's server
- [ ] Calculate and display:
  - Total listening time (hours/minutes)
  - Total tracks played
  - Top 5 artists (with play counts)
  - Top 5 albums
  - Top 5 tracks
  - Top genre (if available in metadata)
- [ ] Mobile-responsive design
- [ ] Basic share functionality (link or screenshot prompt)

**Pages:**

- `/` - Landing page with sign-in
- `/wrapped` - Main wrapped experience (authed)
- `/share/[id]` - Public view of someone's wrapped

**Technical:**

- [ ] SvelteKit project setup
- [ ] Netlify deployment
- [ ] Supabase integration
- [ ] Plex OAuth flow
- [ ] Basic error handling

### Post-MVP (Week 2-3)

**Enhanced Stats:**

- [ ] Listening trends by month (chart)
- [ ] Most played day of the week
- [ ] Longest listening streak
- [ ] "Discovery" stat (new artists found this year)
- [ ] Peak listening hour

**Fun Insights:**

- [ ] "Your top song could have played X times during [event]"
- [ ] "You listened to [artist] more than X% of users" (if we have comparison data)
- [ ] "Hidden gem" - least popular track you loved
- [ ] "Guilty pleasure" - most played track from smallest genre

**Sharing:**

- [ ] Generate shareable image cards (Satori)
- [ ] Twitter/social media meta tags
- [ ] Copy-to-clipboard stats

### Future (Post-Launch)

**Features:**

- [ ] Year-over-year comparisons (requires storing history)
- [ ] TV/Movie mode (expand beyond music)
- [ ] Multi-user household support
- [ ] Playlist generation from top tracks
- [ ] Integration with Last.fm for scrobble comparison
- [ ] "Wrapped Party" - compare with friends

**Technical:**

- [ ] Performance optimization for large libraries
- [ ] Background job processing for slow servers
- [ ] Webhook for real-time updates (overkill but cool)

---

## UI/UX Design Direction

### Inspiration

- Spotify Wrapped (obviously)
- Apple Music Replay
- GitHub Skyline
- Monzo Year in Review

### Design Principles

1. **Mobile-first** - Most sharing happens on phones
2. **Animated/Interactive** - Scroll-driven reveals, not a static page
3. **Dark mode default** - Matches Plex aesthetic
4. **Bold typography** - Big numbers, clear hierarchy
5. **Personal** - Use their name, their avatar, feel custom

### Color Palette (Plex-inspired)

- Background: `#1f1f1f` (Plex dark)
- Accent: `#e5a00d` (Plex gold/orange)
- Text: `#ffffff` / `#a0a0a0`
- Cards: `#2a2a2a`

### Key Screens

**1. Landing Page**

- Hero: "Your year in music, wrapped"
- Big "Sign in with Plex" button
- Brief explanation (3 bullet points max)
- Example screenshot/preview

**2. Loading State**

- "Fetching your listening history..."
- Animated Plex-style spinner
- Fun facts while waiting ("Did you know Plex was founded in...")

**3. Wrapped Experience**

- Scroll-driven story format
- Each stat gets its own "slide"
- Progressive reveal builds anticipation
- Ends with summary card + share CTA

**4. Share Card**

- Optimized for social media dimensions
- Username, avatar, year
- Top 3 artists with album art
- Total hours listened
- "Generated with Plex Wrapped" branding

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Netlify CLI (`npm i -g netlify-cli`)
- Supabase account (free tier)
- Plex account (for testing)

### Project Setup

```bash
# Create SvelteKit project
npm create svelte@latest plex-wrapped
cd plex-wrapped

# Choose options:
# - Skeleton project
# - TypeScript: Yes
# - ESLint: Yes
# - Prettier: Yes
# - Playwright: No (for now)

# Install dependencies
npm install

# Add Tailwind
npx svelte-add@latest tailwindcss

# Add Supabase
npm install @supabase/supabase-js

# Add utilities
npm install date-fns  # Date formatting
npm install chart.js svelte-chartjs  # Charts (if needed)

# Dev server
npm run dev
```

### Environment Variables

```bash
# .env.local (never commit)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx  # Server-side only

# Plex App Registration
PUBLIC_PLEX_CLIENT_ID=plex-wrapped
PLEX_CLIENT_SECRET=xxxxx  # If using OAuth app

# App
PUBLIC_APP_URL=http://localhost:5173  # Or production URL
```

### Netlify Setup

```bash
# Login to Netlify
netlify login

# Initialize project
netlify init

# Set environment variables
netlify env:set PUBLIC_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set PUBLIC_SUPABASE_ANON_KEY "xxxxx"
# ... etc

# Deploy
netlify deploy --prod
```

### Project Structure

```
plex-wrapped/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Landing.svelte
│   │   │   ├── WrappedSlide.svelte
│   │   │   ├── TopArtists.svelte
│   │   │   ├── TopTracks.svelte
│   │   │   ├── ShareCard.svelte
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── plex.ts          # Plex API client
│   │   │   ├── auth.ts          # OAuth flow
│   │   │   ├── stats.ts         # Stats calculation
│   │   │   └── supabase.ts      # DB client
│   │   └── stores/
│   │       ├── user.ts          # User state
│   │       └── wrapped.ts       # Wrapped data
│   ├── routes/
│   │   ├── +page.svelte         # Landing
│   │   ├── +layout.svelte       # App shell
│   │   ├── auth/
│   │   │   └── callback/+page.svelte  # OAuth callback
│   │   ├── wrapped/
│   │   │   └── +page.svelte     # Main wrapped experience
│   │   ├── share/
│   │   │   └── [id]/+page.svelte  # Public share view
│   │   └── api/
│   │       ├── auth/+server.ts   # Auth endpoints
│   │       └── stats/+server.ts  # Stats endpoints
│   └── app.html
├── static/
│   └── favicon.png
├── tailwind.config.js
├── svelte.config.js
├── netlify.toml
└── package.json
```

---

## Estimated Costs

### Monthly Running Costs

| Service      | Free Tier               | If It Scales      |
| ------------ | ----------------------- | ----------------- |
| **Netlify**  | 100GB bandwidth         | £15/mo (Pro)      |
| **Supabase** | 500MB DB, 2GB bandwidth | £20/mo (Pro)      |
| **Domain**   | -                       | ~£1/mo (£10/year) |
| **Total**    | **£0**                  | **~£35/mo**       |

### Realistic Projections

**Launch month (low traffic):** £0-10
**If it takes off (10k+ users):** £20-50/month
**Viral December moment:** Could spike to £100-150, then normalize

### Domain Ideas

- plexwrapped.com
- mywrapped.audio
- wrapped.plex.fan
- plexreplay.com

---

## Build in Public Strategy

### Platforms

- **Twitter/X** - Dev updates, screenshots, polls
- **Threads** - Mirror Twitter content
- **Reddit** - r/PleX, r/selfhosted when ready for launch
- **Plex Forums** - Official community

### Content Calendar (1 Week Sprint)

**Day 1:** "Building a Spotify Wrapped for Plex users. Here's the plan..." (share this doc as image)

**Day 2:** "Got Plex OAuth working. Here's the login flow..." (screen recording)

**Day 3:** "First stats showing up. Look at these numbers!" (screenshot of top artists)

**Day 4:** "Working on the UI. Dark mode + Plex gold = chef's kiss" (design preview)

**Day 5:** "Shareable cards are tricky. Here's how I'm generating them..." (technical insight)

**Day 6:** "Beta is live! Looking for testers..." (soft launch)

**Day 7:** "It's live! Get your Plex Wrapped: [link]" (launch post)

### Engagement Tactics

- Ask questions ("What stats would YOU want to see?")
- Share struggles, not just wins
- Reply to everyone
- Retweet/quote people using it

---

## Risks & Mitigations

| Risk                       | Likelihood | Impact | Mitigation                                |
| -------------------------- | ---------- | ------ | ----------------------------------------- |
| Plex API changes           | Low        | High   | Abstract API calls, monitor Plex forums   |
| Rate limiting              | Medium     | Medium | Aggressive caching, queue system          |
| Server connectivity issues | Medium     | Medium | Clear error messages, retry logic         |
| Low play history           | Medium     | Low    | Show "not enough data" gracefully         |
| Privacy concerns           | Low        | Medium | Clear policy, no raw data storage         |
| Netlify costs spike        | Low        | Medium | Caching, rate limiting, upgrade if needed |

---

## Open Questions

1. **Branding:** "Plex Wrapped" might have trademark issues. Alternatives?

   - Plex Replay (Apple uses this)
   - Plex Rewind (exists but abandoned)
   - My Year in Plex
   - Plex Stats
   - Unwrapped (for Plex)

2. **Scope:** Music only, or TV/Movies too?

   - Recommendation: Music MVP, add video later

3. **Comparison features:** Do we want "you listened more than X% of users"?

   - Requires aggregating data across users
   - Privacy implications
   - Maybe later

4. **Multi-year:** Support 2023, 2022, etc?
   - Depends on how far back Plex stores history
   - Could be a differentiator

---

## Getting Started

When ready to build, brief Claude with:

> "I'm building Plex Wrapped - see the spec at `/Users/jongrant/Desktop/plex-wrapped-project.md`. Let's start with [specific task]. We're using SvelteKit, Netlify, Supabase, and Tailwind."

### Suggested Build Order

1. **SvelteKit + Tailwind + Netlify setup** - Get hello world deployed
2. **Plex OAuth flow** - Sign in working
3. **Fetch play history** - Raw data from Plex API
4. **Stats calculation** - Top artists, albums, tracks, totals
5. **Basic UI** - Display stats on page
6. **Supabase integration** - Cache results, enable sharing
7. **Share functionality** - Public links, image generation
8. **Polish** - Animations, mobile optimization, error handling
9. **Launch** - Reddit, Twitter, ship it

---

## References

- [Plex API Documentation](https://github.com/Arcanemagus/plex-api/wiki)
- [Plex OAuth Flow](https://forums.plex.tv/t/authenticating-with-plex/609370)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Netlify SvelteKit Adapter](https://docs.netlify.com/frameworks/sveltekit/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

_Last updated: December 2024_
_Author: Jon Grant + Claude_

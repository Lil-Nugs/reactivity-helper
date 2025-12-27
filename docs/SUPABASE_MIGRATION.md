# Supabase Migration Plan

## Overview

This document outlines the plan for migrating from local-only storage (Dexie/IndexedDB) to Supabase for cloud sync and data sharing capabilities.

---

## When to Implement

### Recommended Timing: **After Phase 6 (Polish)**

**Rationale:**
- All core features complete and tested locally first
- PWA is stable and offline-capable
- Export/import already implemented (fallback option)
- Less refactoring of in-progress features

**Prerequisites before starting:**
- [ ] Phase 6 complete (including data export)
- [ ] App tested on real devices
- [ ] Core user flows validated
- [ ] Offline functionality robust

---

## Goals

### Primary Goals
1. **Anonymous sharing** - Share behavior data via link (no recipient login required)
2. **Cloud backup** - User data persists across devices
3. **Offline-first preserved** - App works without internet, syncs when available

### Secondary Goals (Future)
4. **Optional accounts** - Users can create accounts to manage shares
5. **Behaviorist portal** - Professionals can log in to view client dogs
6. **Multi-device sync** - Same account, multiple devices

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Device                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     React App                            │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   Hooks     │───▶│ Sync Layer  │───▶│  Supabase   │  │   │
│  │  │ (unchanged) │    │   (NEW)     │    │   Client    │  │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘  │   │
│  │         │                  │                   │         │   │
│  │         ▼                  ▼                   │         │   │
│  │  ┌─────────────────────────────┐              │         │   │
│  │  │      Dexie (IndexedDB)      │◀─────────────┘         │   │
│  │  │    (offline cache)          │     sync               │   │
│  │  └─────────────────────────────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    Auth     │  │  Database   │  │  Row-Level Security     │ │
│  │ (optional)  │  │ (Postgres)  │  │  (RLS Policies)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Public share link
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Behaviorist / Shared View (read-only)              │
│                   (No login required)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth requirement | Optional | Lower friction, anonymous sharing first |
| Offline storage | Keep Dexie | Proven, works well, offline-first |
| Sync strategy | Background sync | Don't block UI on network |
| Conflict resolution | Last-write-wins | Simple, data isn't collaborative |
| Share mechanism | UUID tokens | No login required to view |

---

## Database Schema

### New Tables (Supabase)

```sql
-- Device/installation tracking (anonymous users)
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  device_name TEXT,  -- Optional, user-provided
  push_token TEXT    -- For future push notifications
);

-- Dogs table (same as Dexie, adds device_id)
CREATE TABLE dogs (
  id TEXT PRIMARY KEY,  -- nanoid from client
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),  -- NULL for anonymous users
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Share links (the key to anonymous sharing)
CREATE TABLE dog_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Share configuration
  name TEXT,  -- "Dr. Smith" or "My behaviorist"
  permission TEXT NOT NULL DEFAULT 'read',  -- 'read' only for now

  -- What data to share
  include_incidents BOOLEAN DEFAULT true,
  include_departures BOOLEAN DEFAULT true,
  include_medications BOOLEAN DEFAULT true,
  date_range_start DATE,  -- NULL = all history
  date_range_end DATE,    -- NULL = ongoing

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- NULL = never expires
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,

  -- Optional: link to behaviorist account
  shared_with_user_id UUID REFERENCES auth.users(id)
);

-- All other tables mirror Dexie schema
-- (incidents, departures, medications, etc.)
-- Each has: device_id, user_id (nullable), standard fields
```

### Share Token Flow

```
Owner creates share:
┌─────────────────────────────────────────┐
│ Share "Luna's" data                     │
│                                         │
│ Name (optional): [Dr. Martinez      ]   │
│                                         │
│ Include:                                │
│ ☑ Reactivity incidents                  │
│ ☑ Separation anxiety                    │
│ ☑ Medications                           │
│                                         │
│ Date range:                             │
│ ○ All history                           │
│ ● Last 30 days                          │
│ ○ Custom range                          │
│                                         │
│ Expires:                                │
│ ○ Never                                 │
│ ● After 90 days                         │
│ ○ Custom date                           │
│                                         │
│ [Create Share Link]                     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Share link created!                     │
│                                         │
│ https://app.example.com/share/a1b2c3d4  │
│                                         │
│ [Copy Link]  [Share via...]             │
│                                         │
│ Anyone with this link can view Luna's   │
│ behavior data. No login required.       │
└─────────────────────────────────────────┘
```

### Behaviorist View (No Login)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🐕 Luna's Behavior Report                     Shared by: Jane D │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Reactivity]  [Separation Anxiety]  [Medications]               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Summary (Last 30 Days)                                      │ │
│ │                                                             │ │
│ │ Incidents: 23        Avg Intensity: 2.4                     │ │
│ │ Top triggers: Dogs (12), People (6), Bikes (3)              │ │
│ │ Trend: ↓ 18% vs previous 30 days                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Intensity over time chart]                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Recent Incidents                                            │ │
│ │                                                             │ │
│ │ Dec 26, 2:30 PM - Dog (intensity 3)                         │ │
│ │   Barking, lunging. Redirected successfully.                │ │
│ │                                                             │ │
│ │ Dec 26, 10:15 AM - Person (intensity 2)                     │ │
│ │   Alert only, self-recovered.                               │ │
│ │ ...                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Export PDF]  [Export CSV]                                      │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ This data was shared by the dog's owner.                        │
│ Want to track your own clients? [Create Behaviorist Account]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Row-Level Security Policies

### Public Share Access (No Auth Required)

```sql
-- Allow anyone to read shared data via share token
CREATE POLICY "Public read via share token" ON incidents
  FOR SELECT USING (
    dog_id IN (
      SELECT dog_id FROM dog_shares
      WHERE share_token = current_setting('app.share_token', true)
      AND (expires_at IS NULL OR expires_at > now())
      AND include_incidents = true
    )
  );

-- Same pattern for departures, medications, etc.
```

### Device-Based Access (Anonymous Users)

```sql
-- Users can access their own device's data
CREATE POLICY "Device owner access" ON dogs
  FOR ALL USING (
    device_id = current_setting('app.device_id', true)::uuid
  );

-- Cascade to all child tables via dog_id
CREATE POLICY "Device owner incidents" ON incidents
  FOR ALL USING (
    dog_id IN (
      SELECT id FROM dogs
      WHERE device_id = current_setting('app.device_id', true)::uuid
    )
  );
```

### Authenticated User Access (Future)

```sql
-- Authenticated users can access their data across devices
CREATE POLICY "Authenticated user access" ON dogs
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Behaviorists can read shared dogs
CREATE POLICY "Behaviorist shared access" ON dogs
  FOR SELECT USING (
    id IN (
      SELECT dog_id FROM dog_shares
      WHERE shared_with_user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
```

---

## Implementation Phases

### Phase 7a: Cloud Backup (1 week)

**Goal:** User data syncs to cloud, accessible on same device after reinstall

```
Tasks:
- [ ] Set up Supabase project
- [ ] Create database schema (migrations)
- [ ] Implement device registration (anonymous)
- [ ] Create sync layer (Dexie ↔ Supabase)
- [ ] Add sync status indicator in UI
- [ ] Handle offline/online transitions
- [ ] Test data recovery after app reinstall
```

**Sync Layer Implementation:**

```typescript
// src/lib/sync.ts
import { db } from '../db';
import { supabase } from './supabase';

export class SyncManager {
  private deviceId: string;

  async initialize() {
    // Get or create device ID (stored in localStorage)
    this.deviceId = await this.getOrCreateDeviceId();

    // Initial sync: pull remote → local
    await this.pullFromCloud();

    // Watch for local changes
    this.watchLocalChanges();

    // Watch for remote changes (realtime)
    this.subscribeToRemoteChanges();
  }

  async pushToCloud(table: string, record: any) {
    // Optimistic: already in Dexie
    // Background push to Supabase
    const { error } = await supabase
      .from(table)
      .upsert({ ...record, device_id: this.deviceId });

    if (error) {
      // Queue for retry
      await this.queueFailedSync(table, record);
    }
  }

  async pullFromCloud() {
    // Fetch all data for this device
    // Merge with local (last-write-wins by updated_at)
  }
}
```

### Phase 7b: Anonymous Sharing (1 week)

**Goal:** Create share links that anyone can view without logging in

```
Tasks:
- [ ] Create dog_shares table
- [ ] Build share creation UI
- [ ] Generate share tokens
- [ ] Build public share viewer page
- [ ] Implement RLS for public read access
- [ ] Add share management (view, revoke)
- [ ] Track share access analytics
```

**Share URL Structure:**

```
https://reactivity-helper.app/share/a1b2c3d4e5f6g7h8
                                    └── 32-char hex token
```

**Public API (Edge Function):**

```typescript
// supabase/functions/get-shared-data/index.ts
import { createClient } from '@supabase/supabase-js';

export async function handler(req: Request) {
  const url = new URL(req.url);
  const token = url.pathname.split('/').pop();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  // Set the share token for RLS
  await supabase.rpc('set_share_token', { token });

  // Fetch share config
  const { data: share } = await supabase
    .from('dog_shares')
    .select('*, dogs(name)')
    .eq('share_token', token)
    .single();

  if (!share || (share.expires_at && new Date(share.expires_at) < new Date())) {
    return new Response('Share not found or expired', { status: 404 });
  }

  // Increment access count
  await supabase
    .from('dog_shares')
    .update({
      access_count: share.access_count + 1,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', share.id);

  // Fetch shared data based on config
  const data = {
    dog: share.dogs,
    incidents: share.include_incidents
      ? await fetchIncidents(supabase, share)
      : null,
    departures: share.include_departures
      ? await fetchDepartures(supabase, share)
      : null,
    medications: share.include_medications
      ? await fetchMedications(supabase, share)
      : null,
  };

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Phase 7c: Optional Accounts (1 week)

**Goal:** Users can optionally create accounts for multi-device access

```
Tasks:
- [ ] Add Supabase Auth (email + Google)
- [ ] Build sign up / log in UI
- [ ] Link device data to account on signup
- [ ] Implement cross-device sync for authenticated users
- [ ] Add account settings page
- [ ] Handle account deletion (GDPR)
```

### Phase 7d: Behaviorist Portal (Future)

**Goal:** Behaviorists can create accounts to manage multiple client dogs

```
Tasks:
- [ ] Behaviorist role + signup flow
- [ ] Client dashboard (list of shared dogs)
- [ ] Accept share invitations
- [ ] Aggregated analytics across clients
- [ ] Export reports for sessions
- [ ] (Optional) Add notes/comments on entries
```

---

## Security Considerations

### Must Have

| Measure | Implementation |
|---------|----------------|
| **HTTPS only** | Enforced by Supabase + hosting platform |
| **RLS on all tables** | Policies defined above |
| **Share token entropy** | 128-bit random (32 hex chars) |
| **Rate limiting** | Supabase built-in + edge function limits |
| **Input validation** | Zod schemas on client + server |
| **SQL injection prevention** | Supabase client uses parameterized queries |

### Share-Specific Security

| Risk | Mitigation |
|------|------------|
| Token guessing | 128-bit tokens = 3.4×10³⁸ possibilities |
| Link forwarding | Expected behavior; use expiration dates |
| Stale shares | Default 90-day expiration, remind users |
| Data exposure | Share config limits what's visible |
| Analytics abuse | Rate limit public endpoints |

### Data Privacy

| Consideration | Approach |
|---------------|----------|
| No PII in behavior data | Dog name only; no owner info in shared view |
| Share tracking | Log access count, not IP addresses |
| Right to deletion | Cascade delete on dog removal |
| Data export | Already implemented (Phase 6) |

---

## Cost Estimate

### Supabase Free Tier (Sufficient for Launch)

| Resource | Free Limit | Expected Usage |
|----------|------------|----------------|
| Database | 500 MB | ~10 MB (1000 active users) |
| Auth users | 50,000 MAU | < 1,000 |
| Storage | 1 GB | Not used (no files) |
| Edge functions | 500K invocations | < 50K/month |
| Realtime | 200 concurrent | < 50 |

**Projected cost: $0/month** for hobby/small scale

### Growth Scenario (1000+ users)

| Tier | Monthly Cost | Capacity |
|------|--------------|----------|
| Free | $0 | 500 MB, 50K users |
| Pro | $25 | 8 GB, 100K users |
| Team | $599 | Unlimited |

---

## Migration Strategy

### For Existing Users

```
App Update Flow:
1. User opens updated app
2. App detects existing Dexie data
3. Prompt: "Enable cloud backup?"
   - Yes → Register device, upload data
   - No → Continue local-only (can enable later)
4. If cloud enabled:
   - Generate device_id
   - Upload all local data with device_id
   - Enable sync for new entries
```

### Handling Conflicts

```typescript
// Simple last-write-wins strategy
async function mergeRecord(local: any, remote: any) {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();

  return remoteTime > localTime ? remote : local;
}
```

### Rollback Plan

If cloud sync causes issues:
1. Data remains in local Dexie (source of truth)
2. Add "Disable cloud sync" toggle in settings
3. Local-only mode continues working as before

---

## Testing Checklist

### Sync Tests
- [ ] New data syncs to cloud within 5 seconds
- [ ] App works offline for extended periods
- [ ] Data syncs correctly when coming back online
- [ ] Conflict resolution works (edit same record on two devices)
- [ ] Large sync (1000+ records) completes without timeout

### Share Tests
- [ ] Share link loads without authentication
- [ ] Expired shares show appropriate message
- [ ] Revoked shares stop working immediately
- [ ] Share analytics update on access
- [ ] Date-filtered shares only show relevant data

### Security Tests
- [ ] Cannot access other devices' data
- [ ] Cannot modify data via share link
- [ ] Invalid share tokens return 404 (not 403)
- [ ] Rate limiting triggers on abuse
- [ ] RLS policies cover all tables

---

## Open Questions

1. **Realtime sync vs polling?**
   - Realtime: Better UX, more complex
   - Polling: Simpler, slight delay
   - **Recommendation:** Start with polling (every 30s when online), add realtime later

2. **Share link format?**
   - Short codes: `share/abc123` (easier to type, higher collision risk)
   - UUIDs: `share/a1b2c3d4-e5f6-...` (ugly but unique)
   - **Recommendation:** 32-char hex (balance of security and usability)

3. **Behaviorist verification?**
   - Anyone can claim "behaviorist" role
   - Options: Honor system, email domain verification, manual approval
   - **Recommendation:** Honor system for v1; behaviorists just get a nicer dashboard

---

## Summary

| Phase | Effort | Deliverable |
|-------|--------|-------------|
| 7a: Cloud Backup | 1 week | Data persists across reinstalls |
| 7b: Anonymous Sharing | 1 week | Share links work without login |
| 7c: Optional Accounts | 1 week | Multi-device sync for accounts |
| 7d: Behaviorist Portal | 2 weeks | Pro dashboard for behaviorists |

**Total estimated effort: 5 weeks** (can be done incrementally)

**Start after:** Phase 6 (Polish) complete

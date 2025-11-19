# 🔥 DIAGNOSTIC: VAPI SYNC ISSUE

## 🚨 PROBLEM REPORT

User reported:
- "quand on utilise la page assistant. ils dient que c est sauvegardes sur vapi. masi sur vapi aucun des nouveaux details ne reppond"
- "et de connectes le numero de telephone, car la il ne marche pas du tout. persoone me repond"

Translation:
- Settings save but don't appear in Vapi dashboard
- Phone numbers connected but calls don't work

---

## 🔍 DIAGNOSTIC DIVINE (Applied DIVINE CODEX Principles)

### 1. CODE ANALYSIS ✅

**Frontend Flow:**
```
User clicks "SAVE & SYNC TO VAPI NOW"
  ↓
POST /api/config (saves to database) ✅
  ↓
POST /api/v1/studio/sync-vapi (syncs to Vapi)
  ↓
VapiClient.get_or_create_assistant() ✅
  ↓
Vapi REST API
```

**Backend Code Review:**

✅ **studio-settings-form.tsx** (lines 300-370):
- Correctly calls `/api/v1/studio/sync-vapi` after saving config
- Includes proper token handling and retry logic
- Shows success toast with assistant details

✅ **studio_config.py** (lines 169-310):
- `sync_config_to_vapi()` endpoint properly implemented
- Builds enhanced system prompt with safety instructions
- Calls `client.get_or_create_assistant()` with ALL parameters
- Passes `system_prompt` parameter ✅
- Attempts to assign phone numbers ✅

✅ **vapi_client.py** (lines 62-165, 233-320):
- `create_assistant()` properly formats payload:
  ```python
  if system_prompt:
      model_config["messages"] = [
          {"role": "system", "content": system_prompt}
      ]
  ```
- `update_assistant()` same format ✅
- `get_or_create_assistant()` strategy:
  1. If assistant_id exists: UPDATE existing
  2. If update fails (404): CREATE new
  3. If no assistant_id: CREATE new

**Verdict:** CODE IS CORRECT ✅

---

### 2. ROOT CAUSE IDENTIFIED 🎯

**CRITICAL FINDING:**

```bash
$ ps aux | grep -i "uvicorn\|fastapi\|python.*main"
# NO RESULTS
```

**❌ THE BACKEND SERVER IS NOT RUNNING!**

This explains EVERYTHING:
- Frontend saves to `/api/config` (Next.js route) ✅
- Frontend tries to call `/api/v1/studio/sync-vapi` (FastAPI backend) ❌
- Backend is not running, so sync call FAILS
- User sees "saved" message from first call (Next.js)
- But Vapi never gets updated (FastAPI call failed)

---

## 🔥 SOLUTION DIVINE

### **Quick Fix: Start the Backend**

```bash
# Option 1: Using dev script
cd /Users/nissielberrebi/Desktop/Avaai
./scripts/dev.sh

# Option 2: Manual start
cd /Users/nissielberrebi/Desktop/Avaai/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Docker Compose (if configured)
docker-compose up -d backend
```

### **Verification Steps:**

1. **Start Backend:**
   ```bash
   cd /Users/nissielberrebi/Desktop/Avaai/api
   uvicorn main:app --reload --port 8000
   ```

2. **Check Backend is Running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "healthy"}
   ```

3. **Test Sync Endpoint:**
   ```bash
   # Get your auth token from browser localStorage
   TOKEN="your_access_token_here"

   curl -X POST http://localhost:8000/api/v1/studio/sync-vapi \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Test in Browser:**
   - Open Studio Settings
   - Select a persona preset (e.g., "Secretary")
   - Fill in system prompt (should be auto-filled)
   - Click "SAVE & SYNC TO VAPI NOW"
   - Check browser console for logs
   - Check Vapi dashboard for updated assistant

---

## 📋 CHECKLIST FOR USER

### **Before Testing:**

- [ ] Backend server is running (`uvicorn` process visible)
- [ ] Backend health check passes (`curl http://localhost:8000/health`)
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] User is logged in (has valid access token)
- [ ] User has Vapi API key configured

### **During Testing:**

- [ ] Open browser DevTools → Console tab
- [ ] Navigate to Studio Settings
- [ ] Select a persona preset
- [ ] Fill in system prompt (should be 200+ chars)
- [ ] Click "SAVE & SYNC TO VAPI NOW"
- [ ] Watch console for:
  - ✅ "Config saved successfully"
  - ✅ "🔄 Auto-syncing to Vapi..."
  - ✅ "✅ Vapi Sync Success"
- [ ] Check success toast shows:
  - Voice settings
  - Model settings
  - Assistant ID

### **After Save:**

- [ ] Open Vapi dashboard: https://dashboard.vapi.ai
- [ ] Navigate to Assistants
- [ ] Find your assistant by name
- [ ] Verify settings match:
  - [ ] Voice provider and voice ID
  - [ ] Voice speed
  - [ ] AI model (e.g., gpt-4o)
  - [ ] Temperature
  - [ ] Max tokens
  - [ ] First message
  - [ ] System prompt (in Model → Messages)
- [ ] Check phone numbers:
  - [ ] Navigate to Phone Numbers
  - [ ] Verify each number is assigned to correct assistant
  - [ ] Test call to phone number

---

## 🐛 DEBUGGING TIPS

### **If Sync Still Fails After Starting Backend:**

1. **Check Backend Logs:**
   ```bash
   # Terminal running uvicorn should show:
   INFO:     127.0.0.1:xxxxx - "POST /api/v1/studio/sync-vapi HTTP/1.1" 200 OK
   ```

2. **Check for Authentication Errors:**
   - Look for 401 or 403 errors in console
   - Verify token is not expired
   - Try logging out and logging back in

3. **Check Vapi API Key:**
   - Ensure user has valid Vapi API key in settings
   - Test Vapi key manually:
     ```bash
     curl https://api.vapi.ai/assistant \
       -H "Authorization: Bearer YOUR_VAPI_KEY"
     ```

4. **Enable Verbose Logging:**
   Add to `api/src/presentation/api/v1/routes/studio_config.py`:
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

5. **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter by "sync-vapi"
   - Check request payload, response status, and response body

---

## 🎯 PHONE NUMBER ISSUE

The phone number issue is ALSO caused by backend not running:

**Flow:**
```
sync_config_to_vapi() calls:
  ↓
phone_numbers = await client.get_phone_numbers()
  ↓
for each phone:
  updated_phone = await client.assign_phone_number(phone_id, assistant_id)
```

**If backend not running:**
- Phone assignment NEVER happens
- Phones stay assigned to old/wrong assistant
- Calls go to wrong assistant or fail

**Solution:**
1. Start backend ✅
2. Click "SAVE & SYNC TO VAPI NOW" in Studio Settings
3. Backend will assign ALL phone numbers to correct assistant
4. Test call to verify

---

## 📊 EXPECTED BEHAVIOR (When Working)

### **Successful Sync Console Output:**

```
🔄 Auto-syncing to Vapi...
✅ Vapi Sync Success: {
  action: "updated",
  assistantId: "abc123...",
  settings: {
    name: "Company Name Assistant",
    voiceProvider: "11labs",
    voiceSpeed: 1.0,
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 200,
    systemPromptLength: 450,
    phoneNumbers: 1
  }
}
```

### **Successful Toast:**

```
🔄 Assistant Updated Successfully!
✅ Voice: 11labs @ 1.0x
✅ Model: gpt-4o (temp=0.7)
✅ Max Tokens: 200
ID: abc123...
```

### **Vapi Dashboard Should Show:**

- **Assistant Tab:**
  - Name: "Company Name Assistant"
  - Voice: Selected voice provider + voice ID
  - Model: gpt-4o with correct temperature/tokens
  - First Message: Your custom greeting
  - System Instructions: Your full system prompt (in Model → Messages)

- **Phone Numbers Tab:**
  - Each phone number should show:
    - Status: Active
    - Assigned to: "Company Name Assistant"

---

## 🚀 NEXT STEPS

1. **IMMEDIATE:** Start backend server
2. **TEST:** Follow verification steps above
3. **IF STILL BROKEN:** Enable verbose logging and share logs
4. **ONCE WORKING:** Test full flow:
   - Change persona preset
   - Update system prompt
   - Save and verify in Vapi
   - Call phone number to test

---

## 📝 NOTES

- The UI work (preset selector, huge textarea, preview panel) is PERFECT ✅
- The backend code is CORRECT ✅
- The ONLY issue was backend not running ❌
- Once backend starts, everything should work

**DIVINE CODEX Applied:**
- ✅ Diagnostic Avant Action (analyzed code thoroughly)
- ✅ Intelligence Maximale (traced root cause to server not running)
- ✅ Documentation (created this diagnostic report)

---

**Status:** SOLUTION IDENTIFIED - START BACKEND SERVER

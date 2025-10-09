# SMS Agent MVP - Complete Frontend Implementation Plan

## Goal
Build a minimal viable frontend that allows testing SMS conversations with agents via Vonage API, matching the UI mockups in `/SMS Agent UI/`.

---

## 📊 Current State Analysis

### ✅ Backend (COMPLETE)
- JWT authentication (`/api/v1/auth/login`, `/register`)
- Agent CRUD endpoints (`/api/v1/agents`)
- Conversation history (`/api/v1/conversations`)
- SMS webhooks (Telnyx & Vonage)
- 20-second message batching system
- Model registry (`/api/v1/models`)
- Playground endpoint (`/api/v1/playground`)

### 🔄 Frontend (PARTIAL)
**Existing:** `/sms-agent-frontend-only`
- React 18 + Chakra UI
- JWT auth flow (login/register)
- VoiceBot pages (needs SMS adaptation)
- Redux store infrastructure

**Missing (Based on UI Mockups):**
1. **Agent Configuration Page** - Main agent builder (Workflow, Voice, Analysis tabs)
2. **Chat History/Conversations List** - View past conversations with filters
3. **Conversation Detail** - Full transcript viewer with metadata
4. **Tools/Integrations Management** - Webhook tools configuration
5. **SMS Testing Interface** - Send test messages to agents

---

## 📋 MVP Scope - Core Pages Needed

### Page 1: Agent Builder (`/agents/:id/edit`)
**Priority:** CRITICAL
**Mockup:** `SMS Agent UI/Main Screen/Screenshot 2025-10-09 at 2.37.46 PM.png`

**Features:**
- ✅ Agent tab (first message, system prompt, test variables)
- ✅ Dynamic Variables section (submission_id, first_name, email, etc.)
- ✅ LLM selection dropdown (fetch from `/api/v1/models`)
- ✅ Backup LLM configuration
- ✅ Thinking Budget slider
- ✅ Temperature slider
- ✅ Limit token usage input
- ✅ Agent knowledge base (RAG document upload) - FUTURE
- ✅ Tools section (End call, Detect language, Skip turn, Transfer to agent, etc.)

**API Integration:**
- GET `/api/v1/agents/:id` - Load agent config
- PATCH `/api/v1/agents/:id` - Save changes
- GET `/api/v1/models` - LLM dropdown options

---

### Page 2: Chat History List (`/conversations`)
**Priority:** CRITICAL
**Mockup:** `SMS Agent UI/Chat History/Screenshot 2025-10-07 at 4.25.51 PM.png`

**Features:**
- ✅ Table view with columns: Date, Agent, Duration, Messages, Evaluation result
- ✅ Filters: Date After, Date Before, Evaluation, Agent, User
- ✅ Pagination
- ✅ Click row → navigate to conversation detail

**API Integration:**
- GET `/api/v1/conversations?agentPhone=&userPhone=&status=&limit=50&offset=0`

---

### Page 3: Conversation Detail (`/conversations/:id`)
**Priority:** CRITICAL
**Mockup:** `SMS Agent UI/Chat History/Screenshot 2025-10-07 at 4.26.11 PM.png`

**Features:**
- ✅ Message transcript (user messages right, assistant left)
- ✅ Metadata panel: Date, Duration, Credits, LLM Cost
- ✅ Tabs: Overview, Transcription, Client data, Phone call (SMS only needs: Overview, Transcription, Data)
- ✅ TTS/LLM/RAG timing metrics (if available)
- ✅ Export transcript button

**API Integration:**
- GET `/api/v1/conversations/:id` - Full conversation with messages
- GET `/api/v1/conversations/:id/transcript?format=text` - Export
- GET `/api/v1/conversations/:id/data` - Collected data fields

---

### Page 4: Tools/Integrations (`/tools` or `/integrations`)
**Priority:** HIGH
**Mockup:** `SMS Agent UI/Tools/Screenshot 2025-10-07 at 4.26.55 PM.png`

**Features:**
- ✅ List of available tools (send_sms, check_sms, lookup_user, etc.)
- ✅ "Add webhook tool" button
- ✅ "Add client tool" button
- ✅ Search tools
- ✅ Filter by Type

**API Integration:**
- GET `/api/v1/agents/:id` - Load agent.actions array
- PATCH `/api/v1/agents/:id` - Update actions

---

### Page 5: SMS Testing Interface (Embedded in Agent Builder)
**Priority:** CRITICAL FOR MVP
**Mockup:** Not shown, but referenced in Agent tab

**Features:**
- ✅ Phone number input (test user phone)
- ✅ Message input field
- ✅ "Send Test SMS" button
- ✅ Conversation thread display (shows back-and-forth)
- ✅ Shows triggered actions in real-time

**API Integration:**
- POST `/api/v1/playground/message` (already exists)
  ```json
  {
    "agentId": "...",
    "userPhone": "+1234567890",
    "message": "Hello"
  }
  ```

---

## 🛠️ Implementation Plan

### Phase 1: Core Infrastructure (2-3 hours)
**Files to Create/Modify:**
1. `src/pages/admin/Agents/AgentBuilder.tsx` - Main agent configuration
2. `src/components/admin/AgentConfig/` - Reusable config components
   - `GeneralTab.tsx` - First message, system prompt
   - `DynamicVariablesSection.tsx` - Test variables panel
   - `LLMSection.tsx` - Model selection, temperature, tokens
   - `ToolsSection.tsx` - Tools toggle list
3. `src/queries/agents.ts` - API methods (already mostly done)
4. `src/queries/models.ts` - Fetch LLM models

**Test:** Can load agent, modify settings, save successfully

---

### Phase 2: Conversation Viewing (2 hours)
**Files to Create/Modify:**
1. `src/pages/admin/Conversations/ConversationsList.tsx`
2. `src/pages/admin/Conversations/ConversationDetail.tsx`
3. `src/components/admin/ConversationViewer/`
   - `MessageThread.tsx` - Chat bubbles
   - `MetadataPanel.tsx` - Stats sidebar
   - `TranscriptExport.tsx` - Export button
4. `src/queries/conversations.ts` - API methods (already exists)

**Test:** Can view conversation list, click into detail, see messages, export transcript

---

### Phase 3: SMS Testing (1-2 hours)
**Files to Create/Modify:**
1. `src/components/admin/SMSPlayground/`
   - `SMSTestPanel.tsx` - Test message interface
   - `ConversationThread.tsx` - Message display
2. `src/queries/playground.ts` - New file for playground API

**Test:** Send SMS to agent, receive response, see conversation update

---

### Phase 4: Tools Configuration (1 hour)
**Files to Create/Modify:**
1. `src/pages/admin/Tools/ToolsList.tsx`
2. `src/pages/admin/Tools/WebhookToolForm.tsx`
3. `src/components/admin/ToolConfig/` - Tool configuration UI

**Test:** Add webhook tool, configure URL/headers/body, save to agent

---

### Phase 5: Integration & Testing (2 hours)
**Tasks:**
1. Connect all pages via React Router
2. Add navigation menu items
3. Test full E2E flow:
   - Login → Create agent → Configure system prompt → Add tool → Send test SMS → View conversation → Export transcript
4. Fix bugs, polish UI

---

## 🧪 MVP Testing Checklist

### Critical Path Test (Must Work)
1. ✅ Login with admin credentials
2. ✅ Create new agent (name, phone, provider: Vonage, system prompt)
3. ✅ Select LLM model (Gemini 2.5 Flash or GPT-4o)
4. ✅ Set temperature & max tokens
5. ✅ Add test variables (first_name: "Test", email: "test@example.com")
6. ✅ Save agent configuration
7. ✅ Send test SMS message: "Hi, I need help"
8. ✅ Wait ~20 seconds, receive LLM response back
9. ✅ Navigate to Conversations → View the test conversation
10. ✅ Verify message thread shows correctly
11. ✅ Export transcript as text

### Secondary Tests
- ✅ Edit agent and update system prompt
- ✅ Add webhook tool (URL_CALL action)
- ✅ Test multi-turn conversation (send 3-4 messages)
- ✅ Verify dynamic variables populate in actions

---

## 📦 Required Components (from UI mockups)

### Chakra UI Components Already Available
- Box, VStack, HStack, Flex
- Input, Textarea, Select
- Button, IconButton
- Table, Thead, Tbody, Tr, Th, Td
- Card, CardBody, CardHeader
- Tabs, TabList, TabPanels, Tab, TabPanel
- Slider, SliderTrack, SliderFilledTrack, SliderThumb
- Switch, Checkbox
- Modal, ModalOverlay, ModalContent
- Badge, Tag
- Spinner, Skeleton

### Custom Components Needed
1. **MessageBubble** - Chat message display (user vs assistant styling)
2. **VariableInput** - Dynamic variable key-value editor
3. **ToolToggle** - Tool enable/disable switches
4. **LLMSelector** - Model dropdown with provider grouping
5. **ConversationFilters** - Date range + agent/user filters
6. **MetricsCard** - Cost/duration/messages stats

---

## 🎯 Success Criteria for MVP

**MVP is complete when:**
1. ✅ User can create/edit agent via UI
2. ✅ User can send test SMS to agent phone number
3. ✅ Agent receives SMS via Vonage webhook → processes → responds
4. ✅ User receives SMS response back from agent
5. ✅ Conversation appears in history with full transcript
6. ✅ All data persists (agent config, conversation messages)

**Out of Scope for MVP:**
- ❌ Knowledge base (RAG) upload UI
- ❌ Advanced analytics/dashboard
- ❌ Agent-to-agent transfer UI
- ❌ HITL (Human-in-the-loop) interface
- ❌ Multi-language support
- ❌ Workflow visual editor

---

## ⏱️ Time Estimate

| Phase | Time | Total |
|-------|------|-------|
| Phase 1: Core Infrastructure | 3h | 3h |
| Phase 2: Conversation Viewing | 2h | 5h |
| Phase 3: SMS Testing | 2h | 7h |
| Phase 4: Tools Configuration | 1h | 8h |
| Phase 5: Integration & Testing | 2h | 10h |
| **TOTAL** | | **~10 hours** |

---

## 🚀 Deployment After Completion

1. Build frontend: `cd sms-agent-frontend-only && yarn build`
2. Deploy to Vercel: `vercel --prod`
3. Update CORS on backend to allow Vercel domain
4. Test production flow end-to-end

---

## 📝 Next Steps After Plan Approval

1. Start with Phase 1: Agent Builder page
2. Build core UI components matching mockups
3. Wire up API integration with existing backend
4. Test each phase before moving to next
5. Deploy and validate SMS flow works end-to-end

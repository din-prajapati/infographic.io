# AI Chat Navigation Guide

## 🗺️ UI States & Navigation Flow

### **State 1: Default Chat View (Empty State)**
**When:** No conversation loaded, first time opening chat
**Shows:**
- ✅ Smart Suggestions Row (with ⋮ button)
- ✅ Input Field
- ✅ Category Chips (6 chips)
- ✅ Prompt History (if any)
- ✅ 36 Prompt Cards (when category selected)

---

### **State 2: Default Chat with History**
**When:** User has saved conversations but none active
**Shows:**
- ✅ **Conversation History Panel** (collapsible, at top)
- ✅ Smart Suggestions Row (with ⋮ button)
- ✅ Input Field
- ✅ Category Chips
- ✅ Prompt History

**Navigation:**
- Click conversation in history → Go to **State 3**
- Click suggestion/category → Continue in **State 2**

---

### **State 3: Active Conversation View**
**When:** User clicks a conversation from history
**Shows:**
- ✅ **"Back to chat" button** (with ← arrow)
- ✅ **Conversation Messages** (user purple, AI gray bubbles)
- ✅ Input Field
- ❌ NO Category Chips
- ❌ NO Smart Suggestions Row
- ❌ NO Prompt History

**Navigation:**
- Click "Back to chat" → Return to **State 2**
- Type message → Adds to current conversation (stay in **State 3**)

---

### **State 4: Generation in Progress**
**When:** AI is generating templates
**Shows:**
- ✅ Input Field (disabled)
- ✅ Generation Progress (5 steps)
- ❌ NO Smart Suggestions
- ❌ NO Category Chips
- ❌ NO Conversation Messages

**Navigation:**
- Wait for completion → Go to **State 5**

---

### **State 5: Results Variations**
**When:** Generation complete, showing 3 variations
**Shows:**
- ✅ 3 Result Cards
- ✅ "Regenerate All" button
- ✅ Edit/Use buttons
- ❌ NO Smart Suggestions
- ❌ NO Category Chips

**Navigation:**
- Click "Use" → Close chat, load to canvas
- Click "Regenerate" → Back to **State 4**
- Close panel → Return to **State 1** or **State 2**

---

## 🔘 Smart Suggestions Row Components

### **Suggestion Pills**
- 4 property-aware suggestions
- Based on property type & price range
- Examples:
  - Luxury: "Add elegant serif fonts", "Use gold accents"
  - Residential: "Highlight school districts", "Family-friendly layout"
  - Commercial: "Include ROI projections", "Show traffic data"

### **⋮ Button (MoreVertical)**
- Always visible at end of row
- Opens **Enhanced Suggestions Panel**
- Shows 9 visual cards in 3 categories

---

## 📊 Enhanced Suggestions Panel (from ⋮ button)

**Contains:**
- 🎨 **Design Ideas** (3 cards)
- ✍️ **Content Suggestions** (3 cards)
- 📐 **Layout Options** (3 cards)

**Each card has:**
- Unsplash image
- Title
- Description
- Tags
- Click to apply → Closes panel, fills input

---

## 🧪 Testing Navigation

### **Load Test Data:**
```javascript
loadTestConversations() // In browser console
```

### **Test Flow 1: From Empty to Conversation**
1. Open AI Chat (purple button)
2. See Smart Suggestions Row with ⋮
3. Click ⋮ → Enhanced Panel opens
4. Click a card → Input fills
5. Send message → Creates conversation
6. Type response → Conversation continues

### **Test Flow 2: From History to Active Conversation**
1. Open AI Chat
2. See Conversation History Panel (collapsed)
3. Expand history
4. Click "Modern Luxury Villa Design"
5. **→ Switches to Active Conversation View**
6. See "Back to chat" button
7. See message bubbles
8. Click "Back to chat"
9. **→ Returns to Default View**
10. Smart Suggestions Row reappears

### **Test Flow 3: Smart Suggestions Usage**
1. Open AI Chat (default view)
2. See Smart Suggestions Row
3. Click "Add elegant serif fonts"
4. Input fills with suggestion
5. Send → Creates conversation
6. OR Click ⋮ button
7. Enhanced Panel opens
8. Click "Elegant Gold & Black Theme"
9. Input updates
10. Panel closes

---

## 🎯 Key Navigation Rules

1. **Conversation History Panel** only shows when:
   - Not generating
   - Not viewing active conversation
   - Not showing results variations
   - Has at least 1 saved conversation

2. **Smart Suggestions Row** only shows when:
   - Not generating
   - Not viewing active conversation
   - Not showing results variations
   - No category chips selected
   - Not showing favorites

3. **Active Conversation View** only shows when:
   - User clicked a conversation from history
   - `currentConversation` is not null
   - Not generating
   - Not showing results

4. **Back Button** appears when:
   - In active conversation view
   - Allows return to default state

---

## 📍 Component Locations in Scrollable Area

**Top to Bottom Order:**

1. **Conversation History Panel** (if has conversations)
   - Collapsible with details/summary
   - Border at bottom

2. **Conversation Messages** (if active conversation)
   - Back button at top
   - Message bubbles below
   - Border at bottom

3. **Smart Suggestions Row** (if default state)
   - Pills + ⋮ button
   - No border

4. **Input Field** (always visible)
   - Textarea
   - Icon bar inside
   - Chip tags above textarea

5. **Category Chips** (if default state)
   - 6 colorful chips
   - Below input field

6. **Prompt History** (if has history)
   - Collapsible list
   - Star favorites

7. **36 Prompts Grid** (if category selected)
   - 3×2 grid with images

8. **Generation Progress** (if generating)
   - 5 animated steps

9. **Results Variations** (if complete)
   - 3 result cards

---

## 🔑 LocalStorage Keys

- `ai-chat-conversations` - All conversations with messages
- Format: Array of Conversation objects with Date serialization

---

## ✅ Navigation Checklist

- [x] Can open AI Chat
- [x] Can see Smart Suggestions Row
- [x] Can click ⋮ to open Enhanced Panel
- [x] Can click suggestion to fill input
- [x] Can expand Conversation History
- [x] Can click conversation to view messages
- [x] Can see "Back to chat" button in conversation view
- [x] Can click back button to return to default state
- [x] Smart Suggestions Row reappears after going back
- [x] Can navigate between all 5 states
- [x] Can delete conversation from history
- [x] Can favorite conversation

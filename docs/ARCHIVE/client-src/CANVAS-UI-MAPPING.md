# 🗺️ Canvas UI Mapping & Decision Points

> **UPDATED with Canva-style contextual toolbar approach**

---

## ✅ **APPROVED ARCHITECTURE DECISIONS**

### **DECISION 1: Contextual Top Toolbar** ✅ APPROVED

```
TOP TOOLBAR = CONTEXTUAL (like Canva)

When NOTHING selected:
┌─────────────────────────────────────────────────────────┐
│ [←] [✨] Design Name | [Property Details] [Save] [Export] │
└─────────────────────────────────────────────────────────┘

When TEXT selected:
┌────────────────────────────────────────────────────────────────────┐
│ [←] [Font ▾] [19] [B][I][U] [🎨] [≡] ... [Save] [Export]          │
└────────────────────────────────────────────────────────────────────┘

When SHAPE selected:
┌───────────────────────────���────────────────────────────────────┐
│ [←] [Fill 🎨] [Stroke 🎨] [Width] [Opacity] ... [Save] [Export] │
└────────────────────────────────────────────────────────────────┘

When IMAGE selected:
┌─────────────────────────────────────────────────────────────┐
│ [←] [Opacity] [Radius] [Filters ▾] ... [Save] [Export]     │
└─────────────────────────────────────────────────────────────┘
```

**Why This is Better:**

- ✅ Exactly like Canva's UX
- ✅ Properties always visible (no scrolling)
- ✅ More canvas space
- ✅ Familiar pattern for users
- ✅ No need for complex right sidebar

---

### **DECISION 2: Left Sidebar = Tools + Layers** ✅ APPROVED

```
Replace History with:
┌──────────────┐
│ [Tools] [Layers] │  ← 2 tabs
├──────────────┤
│ 🔲 Select    │
│ T  Text      │
│ 🖼  Image     │
│ ▢  Rectangle │
│ ●  Circle    │
│ 🗑  Delete    │
└──────────────┘
```

---

### **DECISION 3: Canvas Technology** ✅ APPROVED

```
Phase 1 (MVP):
- React + SVG only
- Simple, fast to build

Phase 2 (Effects):
- Add PixiJS layer for visual effects
- Hybrid rendering
```

---

### **DECISION 4: Skip Rulers/Grid** ✅ APPROVED

```
MVP:
- Keep dot-grid background
- No rulers
- Focus on core editing

Future:
- Add rulers in v1.1+
```

---

### **DECISION 5: Right Sidebar = Simplified** ✅ NEW

```
Since element properties are in TOP toolbar:

Right Sidebar can be:
┌─────────────────┐
│  📐 Design      │  ← Tab 1: Add Elements, Global styles
│  🏠 Property    │  ← Tab 2: Property Details form
│  👤 Agent       │  ← Tab 3: Agent Info form│
└─────────────────┘

OR simpler:
┌─────────────────┐
│ Add Elements    │
│ - Text          │
│ - Image         │
│ - Shape         │
│                 │
│ Templates       │
│ - Browse        │
│ - Favorites     │
└─────────────────┘
```

**Recommendation:** Keep Property/Agent forms in right sidebar (simpler than modal)

---

## 📊 UPDATED Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP TOOLBAR - CONTEXTUAL (EditorToolbar.tsx)                     │
│ Changes based on selected element                                │
│ [←] [Element Properties...] [Save] [Export] [Share]              │
└──────────────────────────────────────────────────────────────────┘

┌──────────┬────────────────────────────────┬──────────────────────┐
│ LEFT     │ CENTER CANVAS                  │ RIGHT SIDEBAR        │
│ SIDEBAR  │                                │                      │
│          │                                │                      │
│ [Tools]  │  ┌─────────────────────────┐   │ [Design] [Property]  │
│ [Layers] │  │                         │   │ [Agent]              │
│          │  │   React + SVG Canvas    │   │                      │
│ Select   │  │                         │   │ Add Elements:        │
│ Text     │  │   (1200 x 800)          │   │  [Text] [Image]      │
│ Image    │  │                         │   │  [Shape] [Icon]      │
│ Rect     │  │                         │   │                      │
│ Circle   │  │                         │   │ Property Details:    │
│ Delete   │  │                         │   │  - Title             │
│          │  │                         │   │  - Address           │
│          │  └─────────────────────────┘   │  - Price             │
│          │                                │  - Beds/Baths        │
│          │     [AI Button 💜]             │                      │
│          │                                │ Agent Info:          │
│          │                                │  - Name              │
│          │                                │  - Brokerage         │
└──────────┴────────────────────────────────┴──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ FLOATING TOOLBAR (Center-bottom)                                 │
│ [Select] [Hand] [Shape] | [Preview] | [−] [100%] [+] | [↶] [↷]  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Structure

### **New/Modified Components:**

#### **1. EditorToolbar.tsx** (MAJOR UPDATE)

```tsx
// Contextual toolbar that changes based on selection

interface EditorToolbarProps {
  selectedElement: CanvasElement | null;
  onBackClick: () => void;
  onSave: () => void;
}

// Renders different toolbars:
- DefaultToolbar (no selection)
- TextToolbar (text selected)
- ShapeToolbar (shape selected)
- ImageToolbar (image selected)
```

**Sub-components to create:**

```
/components/editor/toolbar/
  EditorToolbar.tsx           ← Main container
  DefaultToolbar.tsx          ← No selection
  TextToolbar.tsx             ← Text properties
  ShapeToolbar.tsx            ← Shape properties
  ImageToolbar.tsx            ← Image properties
```

---

#### **2. LeftSidebar.tsx** (REBUILD)

```tsx
// Tools + Layers tabs

<LeftSidebar>
  <Tabs>
    <ToolsTab>
      - Select tool - Text tool - Image tool - Rectangle tool -
      Circle tool - Delete tool
    </ToolsTab>

    <LayersTab>
      - Dynamic list of canvas elements - Visibility toggle -
      Lock toggle - Drag to reorder
    </LayersTab>
  </Tabs>
</LeftSidebar>
```

**Components:**

```
/components/editor/sidebar/
  LeftSidebar.tsx            ← Main container
  ToolsTab.tsx               ← 6 tool buttons
  LayersTab.tsx              ← Layers list
  LayerItem.tsx              ← Single layer
  ToolButton.tsx             ← Reusable tool button
```

---

#### **3. RightSidebar.tsx** (KEEP & SIMPLIFY)

```tsx
// Keep existing 3 tabs:
// - Design (Add Elements + Global styles)
// - Property (Property Details form)
// - Agent (Agent Info form)

// Since element properties moved to top toolbar,
// Design tab is now simpler:
// - Add Elements buttons
// - Global color palette
// - Font presets
// - Templates browser
```

**Keep existing but simplify:**

```
/components/editor/
  RightSidebar.tsx           ← Keep structure
  PropertyDetailsForm.tsx    ← Keep as-is
  AgentInfoForm.tsx          ← Keep as-is
```

**Simplify Design tab:**

```
Remove:
✗ Element-specific color pickers (now in top toolbar)
✗ Font controls (now in top toolbar)

Keep:
✓ Add Elements buttons
✓ Global design presets
✓ Template browser
```

---

#### **4. CenterCanvas.tsx** (ADD SVG CANVAS)

```tsx
// Add React + SVG canvas

<CenterCanvas>
  <svg width={1200} height={800}>
    {canvasElements.map((element) =>
      element.type === "text" ? (
        <TextElement />
      ) : element.type === "shape" ? (
        <ShapeElement />
      ) : element.type === "image" ? (
        <ImageElement />
      ) : null,
    )}
  </svg>

  <AIFloatingButton />
</CenterCanvas>
```

**Canvas components:**

```
/components/canvas/
  CanvasProvider.tsx         ← Context for canvas state
  CanvasElement.tsx          ← Base element wrapper
  TextElement.tsx            ← Text rendering
  ShapeElement.tsx           ← Shape rendering
  ImageElement.tsx           ← Image rendering
  SelectionBox.tsx           ← Selection handles
  useCanvasState.ts          ← Canvas state hook
```

---

#### **5. FloatingToolbar.tsx** (KEEP AS-IS) ✅

```
No changes needed:
- Keep Select/Hand/Shape tools
- Keep Zoom controls
- Keep Undo/Redo
- Keep Preview button
```

---

## 📝 Implementation Phases

### **Phase 1A: Canvas Foundation** (Week 1)

```
✓ Create CanvasProvider (state management)
✓ Create basic SVG canvas in CenterCanvas
✓ Add TextElement component (draggable)
✓ Add ShapeElement component (rectangle, circle)
✓ Add ImageElement component
✓ Add SelectionBox (resize handles)
```

**Libraries:**

```
npm install:
- react-rnd (for drag/resize)
- html2canvas (for export)
- zustand (lightweight state management)
```

---

### **Phase 1B: Left Sidebar** (Week 1)

```
✓ Rebuild LeftSidebar with 2 tabs
✓ Create ToolsTab (6 tool buttons)
✓ Create LayersTab (element list)
✓ Add tool selection logic
✓ Add layer click to select
```

---

### **Phase 1C: Contextual Toolbar** (Week 2)

```
✓ Create TextToolbar component
  - Font dropdown
  - Font size input
  - Bold/Italic/Underline buttons
  - Text color picker
  - Alignment buttons

✓ Create ShapeToolbar component
  - Fill color picker
  - Stroke color picker
  - Stroke width slider
  - Opacity slider

✓ Create ImageToolbar component
  - Opacity slider
  - Corner radius slider
  - Crop button
  - Filters dropdown (Phase 2)

✓ Update EditorToolbar to switch contexts
```

---

### **Phase 1D: Right Sidebar Cleanup** (Week 2)

```
✓ Simplify Design tab
  - Keep Add Elements buttons
  - Remove element-specific controls
  - Add global presets section

✓ Keep Property/Agent tabs as-is
```

---

### **Phase 1E: Canvas Interactions** (Week 3)

```
✓ Click to select element
✓ Drag to move
✓ Resize handles
✓ Rotate handle (optional)
✓ Delete key to delete
✓ Undo/Redo implementation
✓ Multi-select (Shift+Click)
```

---

### **Phase 1F: Export & Save** (Week 3)

```
✓ Export to PNG (html2canvas)
✓ Save canvas state to LocalStorage
✓ Load canvas state
✓ Generate thumbnail
```

---

### **Phase 2: Effects Layer** (Future)

```
✓ Add PixiJS layer
✓ Image filters
✓ Drop shadows
✓ Gradients
```

---

## 🎨 Example: Contextual Toolbar Code

### **EditorToolbar.tsx** (Updated)

```tsx
export function EditorToolbar({
  selectedElement,
  onBackClick,
  onSave,
}: EditorToolbarProps) {
  return (
    <div className="h-14 bg-gray-900 px-4 flex items-center gap-4">
      {/* Left - Back & Logo */}
      <div className="flex items-center gap-3">
        <Button onClick={onBackClick}>
          <ArrowLeft />
        </Button>
        <Logo />
      </div>

      {/* Center - CONTEXTUAL ELEMENT PROPERTIES */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {!selectedElement && <DefaultToolbar />}
        {selectedElement?.type === "text" && (
          <TextToolbar element={selectedElement} />
        )}
        {selectedElement?.type === "shape" && (
          <ShapeToolbar element={selectedElement} />
        )}
        {selectedElement?.type === "image" && (
          <ImageToolbar element={selectedElement} />
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onSave}>
          <Save /> Save
        </Button>
        <Button>
          <Download /> Export
        </Button>
      </div>
    </div>
  );
}
```

---

### **TextToolbar.tsx** (New)

```tsx
export function TextToolbar({
  element,
}: {
  element: TextElement;
}) {
  const { updateElement } = useCanvas();

  return (
    <div className="flex items-center gap-2">
      {/* Font Family */}
      <Select
        value={element.fontFamily}
        onChange={(val) =>
          updateElement(element.id, { fontFamily: val })
        }
      >
        <SelectItem value="inter">Inter</SelectItem>
        <SelectItem value="roboto">Roboto</SelectItem>
      </Select>

      {/* Font Size */}
      <Input
        type="number"
        value={element.fontSize}
        onChange={(e) =>
          updateElement(element.id, {
            fontSize: +e.target.value,
          })
        }
        className="w-16"
      />

      {/* Bold/Italic/Underline */}
      <div className="flex gap-1">
        <ToggleButton
          active={element.bold}
          onClick={() =>
            updateElement(element.id, { bold: !element.bold })
          }
        >
          <Bold />
        </ToggleButton>
        <ToggleButton
          active={element.italic}
          onClick={() =>
            updateElement(element.id, {
              italic: !element.italic,
            })
          }
        >
          <Italic />
        </ToggleButton>
        <ToggleButton
          active={element.underline}
          onClick={() =>
            updateElement(element.id, {
              underline: !element.underline,
            })
          }
        >
          <Underline />
        </ToggleButton>
      </div>

      {/* Color */}
      <ColorPicker
        value={element.color}
        onChange={(color) =>
          updateElement(element.id, { color })
        }
      />

      {/* Alignment */}
      <div className="flex gap-1">
        <ToggleButton active={element.align === "left"}>
          <AlignLeft />
        </ToggleButton>
        <ToggleButton active={element.align === "center"}>
          <AlignCenter />
        </ToggleButton>
        <ToggleButton active={element.align === "right"}>
          <AlignRight />
        </ToggleButton>
      </div>
    </div>
  );
}
```

---

## ✅ Files to Create/Modify

### **CREATE (New Components):**

```
/components/editor/toolbar/
  DefaultToolbar.tsx
  TextToolbar.tsx
  ShapeToolbar.tsx
  ImageToolbar.tsx

/components/editor/sidebar/
  ToolsTab.tsx
  LayersTab.tsx
  LayerItem.tsx
  ToolButton.tsx

/components/canvas/
  CanvasProvider.tsx
  CanvasElement.tsx
  TextElement.tsx
  ShapeElement.tsx
  ImageElement.tsx
  SelectionBox.tsx

/hooks/
  useCanvasState.ts
  useSelection.ts

/lib/
  canvasTypes.ts
  canvasUtils.ts
```

### **MODIFY (Update Existing):**

```
/components/editor/
  EditorToolbar.tsx          ← Make contextual
  LeftSidebar.tsx            ← Rebuild with Tools/Layers
  RightSidebar.tsx           ← Simplify Design tab
  CenterCanvas.tsx           ← Add SVG canvas
  EditorLayout.tsx           ← Update props/state
```

### **KEEP AS-IS:**

```
✓ FloatingToolbar.tsx
✓ PropertyDetailsForm.tsx
✓ AgentInfoForm.tsx
✓ SaveDialog.tsx
✓ ColorPickerField.tsx
```

---

## 🚀 Ready to Build!

### **Start with Phase 1A:**

1. Create canvas state management
2. Add basic SVG canvas
3. Create text/shape/image elements
4. Add selection system

**Should I start building now?** 🎯
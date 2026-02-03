# 🎯 Figma Make Build Plan - Canvas Editor Core

> **Goal:** Build UI shell + core features without APIs, then migrate to Replit for enhancement

---

## 📊 Current State Analysis

### ✅ Already Built (From Background)
```
✓ Design system (neutral colors, Inter font, 3-column layout)
✓ EditorToolbar (top toolbar with design name display)
✓ Properties Panel (3 tabs: Design, Property Details, Agent Info)
✓ AI Chat Box (full conversation UI with history)
✓ Smart suggestions (property-aware, top 4 items)
✓ Save Dialog (with thumbnail preview, category selection)
✓ LocalStorage persistence
✓ MyDesignsPage (load and display saved items)
✓ TemplatesPage (load and display templates)
✓ 15 real estate templates (AI-generated system)
✓ Motion animations
✓ Dialog components with forwardRef fixes
```

### ❌ Missing (Need to Build)
```
✗ Actual Fabric.js canvas implementation
✗ Canvas toolbar (add text, shapes, images)
✗ Element manipulation (move, resize, rotate, delete)
✗ Canvas properties panel integration
✗ Layer management
✗ Export functionality (PNG)
✗ Template loading into canvas
✗ Canvas state management
✗ Undo/redo system
```

---

## 🎯 Build Plan - Figma Make Phase

### Scope: What We'll Build Here

#### **Phase A: Canvas Foundation** (Priority: CRITICAL)
```
1. Canvas Container Component
   - Fabric.js initialization
   - Canvas workspace (1200x800px)
   - Zoom controls
   - Grid background (optional)
   
2. Canvas Toolbar (Left Sidebar)
   - Select tool
   - Add Text button
   - Add Image button (upload)
   - Add Shape buttons (rectangle, circle)
   - Delete button
   - Undo/Redo buttons
   
3. Canvas Context Provider
   - Store canvas instance
   - Expose canvas methods
   - Handle canvas events
   - State management (selected element)
```

#### **Phase B: Element Tools** (Priority: CRITICAL)
```
1. Text Tool
   - Add text at center
   - Double-click to edit
   - Font family selector
   - Font size slider
   - Color picker
   - Bold/Italic/Underline
   - Text alignment
   
2. Image Tool
   - File upload button
   - Drag uploaded image to canvas
   - Maintain aspect ratio
   - Image scaling
   
3. Shape Tools
   - Rectangle (fill + stroke)
   - Circle (fill + stroke)
   - Color pickers for fill/stroke
```

#### **Phase C: Selection & Manipulation** (Priority: CRITICAL)
```
1. Element Selection
   - Click to select
   - Selection box with handles
   - Multi-select (Shift+Click)
   - Deselect on canvas click
   
2. Manipulation Controls
   - Move (drag)
   - Resize (corner handles)
   - Rotate (top handle)
   - Delete (Delete key)
   
3. Properties Panel Integration
   - Update panel on selection
   - Apply property changes to canvas
   - Show position (X, Y)
   - Show size (W, H)
   - Show rotation
```

#### **Phase D: Template System** (Priority: HIGH)
```
1. Template Data Structure
   - 5-10 pre-made templates
   - JSON format (Fabric.js compatible)
   - Categories (Listing, Sold, Open House)
   
2. Load Template Function
   - Clear canvas
   - Parse template JSON
   - Add objects to canvas
   - Render canvas
   
3. Integration with TemplatesPage
   - "Use Template" loads to canvas
   - Navigate to /editor
   - Template appears on canvas
```

#### **Phase E: Save/Load Canvas** (Priority: HIGH)
```
1. Save Canvas State
   - Serialize Fabric.js canvas to JSON
   - Generate thumbnail (base64)
   - Store in LocalStorage
   - Update existing Save Dialog
   
2. Load Canvas State
   - Retrieve from LocalStorage
   - Parse JSON
   - Recreate canvas objects
   - Render canvas
   
3. Auto-Save
   - Detect canvas changes
   - Save every 30 seconds
   - Show "Saving..." indicator
```

#### **Phase F: Export** (Priority: HIGH)
```
1. Export to PNG
   - Deselect all objects
   - Export canvas at 2x resolution
   - Download file
   - Show success toast
   
2. Export Dialog (Simple)
   - File name input
   - Resolution selector (1x, 2x, 3x)
   - Background toggle (transparent/white)
   - Export button
```

#### **Phase G: Enhanced Features** (Priority: MEDIUM)
```
1. Layers Panel (Optional)
   - List all objects
   - Reorder layers
   - Show/hide layer
   - Lock layer
   
2. Undo/Redo (Optional)
   - Track canvas history
   - Undo button (Ctrl+Z)
   - Redo button (Ctrl+Y)
   - Limit history (20 states)
   
3. Keyboard Shortcuts
   - Delete: Delete selected
   - Ctrl+Z: Undo
   - Ctrl+Y: Redo
   - Ctrl+D: Duplicate
   - Ctrl+S: Save
```

---

## 📁 File Structure Plan

```
/src
  /components
    /editor
      /canvas
        Canvas.tsx                    ← NEW: Main canvas component
        CanvasProvider.tsx            ← NEW: Canvas context
        CanvasToolbar.tsx             ← NEW: Left sidebar tools
        useCanvas.ts                  ← NEW: Canvas hook
        
      /tools
        TextTool.tsx                  ← NEW: Text tool UI
        ImageTool.tsx                 ← NEW: Image upload
        ShapeTool.tsx                 ← NEW: Shape selector
        
      /properties
        CanvasProperties.tsx          ← ENHANCE: Existing properties panel
        TextProperties.tsx            ← NEW: Text-specific properties
        ImageProperties.tsx           ← NEW: Image-specific properties
        ShapeProperties.tsx           ← NEW: Shape-specific properties
        
      /layers
        LayersPanel.tsx               ← NEW: Layers list (optional)
        LayerItem.tsx                 ← NEW: Single layer item
        
      EditorToolbar.tsx               ← EXISTS: Update with save/export
      
    /export
      ExportDialog.tsx                ← NEW: Export modal
      ExportButton.tsx                ← NEW: Export button
      
    /templates
      TemplateCard.tsx                ← EXISTS: Keep as-is
      
  /lib
    /canvas
      fabricHelpers.ts                ← NEW: Fabric.js utility functions
      canvasExport.ts                 ← NEW: Export utilities
      templateLoader.ts               ← NEW: Template loading logic
      
  /data
    templates.ts                      ← NEW: Template definitions
    
  /types
    canvas.types.ts                   ← NEW: Canvas TypeScript types
    
  /pages
    EditorPage.tsx                    ← ENHANCE: Integrate canvas
    MyDesignsPage.tsx                 ← EXISTS: Update to load canvas
    TemplatesPage.tsx                 ← EXISTS: Update to load canvas
```

---

## 🔧 Technical Implementation Plan

### **1. Canvas Foundation Setup**

#### Dependencies to Add
```json
{
  "fabric": "^5.3.0",
  "@types/fabric": "^5.3.0",
  "uuid": "^9.0.0"
}
```

#### Canvas Provider Structure
```typescript
// CanvasProvider.tsx
interface CanvasContextType {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  addText: (text: string) => void;
  addImage: (file: File) => void;
  addShape: (type: 'rect' | 'circle') => void;
  deleteSelected: () => void;
  exportToPNG: () => void;
  loadTemplate: (template: Template) => void;
  saveCanvas: () => void;
  loadCanvas: (id: string) => void;
}
```

### **2. Template Data Format**

```typescript
interface Template {
  id: string;
  name: string;
  category: 'listing' | 'sold' | 'open-house' | 'market-report';
  thumbnail: string; // Unsplash URL
  description: string;
  canvasData: {
    version: string;
    objects: FabricObject[]; // Serialized Fabric.js objects
    background: string;
  };
  metadata: {
    width: number;
    height: number;
    elementCount: number;
    tags: string[];
  };
}
```

#### Example Template
```typescript
{
  id: 'template-001',
  name: 'Just Listed - Modern Clean',
  category: 'listing',
  thumbnail: 'https://images.unsplash.com/...',
  description: 'Clean and modern design for new listings',
  canvasData: {
    version: '5.3.0',
    objects: [
      {
        type: 'text',
        text: 'JUST LISTED',
        left: 100,
        top: 50,
        fontSize: 48,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fill: '#1F2937'
      },
      {
        type: 'text',
        text: '123 Main Street',
        left: 100,
        top: 120,
        fontSize: 32,
        fontFamily: 'Inter',
        fill: '#4B5563'
      },
      {
        type: 'rect',
        left: 50,
        top: 200,
        width: 1100,
        height: 500,
        fill: '#F3F4F6',
        stroke: '#E5E7EB',
        strokeWidth: 2
      },
      {
        type: 'text',
        text: '$850,000',
        left: 100,
        top: 750,
        fontSize: 56,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fill: '#3B82F6'
      }
    ],
    background: '#FFFFFF'
  },
  metadata: {
    width: 1200,
    height: 800,
    elementCount: 4,
    tags: ['modern', 'clean', 'listing']
  }
}
```

### **3. Canvas State Management**

#### Using Zustand
```typescript
// store/canvasStore.ts
interface CanvasStore {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  canvasHistory: string[]; // For undo/redo
  historyStep: number;
  
  setCanvas: (canvas: fabric.Canvas) => void;
  setSelectedObject: (obj: fabric.Object | null) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}
```

### **4. LocalStorage Schema**

#### Design Storage
```typescript
interface SavedDesign {
  id: string;
  name: string;
  thumbnail: string; // base64 or URL
  canvasData: string; // JSON.stringify(canvas.toJSON())
  category: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: {
    width: number;
    height: number;
    elementCount: number;
  };
}

// LocalStorage key: 'infographic-designs'
```

---

## 🎨 UI Component Specifications

### **Canvas Toolbar (Left Sidebar)**

```typescript
interface Tool {
  id: string;
  name: string;
  icon: LucideIcon;
  action: () => void;
  isActive: boolean;
  tooltip: string;
}

const tools: Tool[] = [
  { id: 'select', name: 'Select', icon: MousePointer2, tooltip: 'Select (V)' },
  { id: 'text', name: 'Text', icon: Type, tooltip: 'Add Text (T)' },
  { id: 'image', name: 'Image', icon: Image, tooltip: 'Add Image (I)' },
  { id: 'rectangle', name: 'Rectangle', icon: Square, tooltip: 'Rectangle (R)' },
  { id: 'circle', name: 'Circle', icon: Circle, tooltip: 'Circle (C)' },
  { id: 'delete', name: 'Delete', icon: Trash2, tooltip: 'Delete (Del)' }
];
```

**Layout:**
```
┌─────────────────┐
│  [Select Icon]  │ ← Default selected
│  [Text Icon]    │
│  [Image Icon]   │
│  [Square Icon]  │
│  [Circle Icon]  │
│                 │
│  ─────────────  │
│                 │
│  [Undo Icon]    │
│  [Redo Icon]    │
│  [Delete Icon]  │
└─────────────────┘
```

### **Canvas Properties Panel (Right Sidebar)**

**When Text Selected:**
```
┌─────────────────────────┐
│ TEXT PROPERTIES         │
├─────────────────────────┤
│ Font Family             │
│ [Inter ▼]               │
│                         │
│ Font Size: 24px         │
│ [━━━━━○━━━━━]          │
│                         │
│ Color                   │
│ [■ #000000]             │
│                         │
│ Style                   │
│ [B] [I] [U]             │
│                         │
│ Alignment               │
│ [≡] [≡] [≡]             │
│                         │
├─────────────────────────┤
│ POSITION & SIZE         │
├─────────────────────────┤
│ X: [100]  Y: [100]      │
│ W: [200]  H: [50]       │
│ Rotation: [0°]          │
└─────────────────────────┘
```

**When Image Selected:**
```
┌─────────────────────────┐
│ IMAGE PROPERTIES        │
├─────────────────────────┤
│ Opacity: 100%           │
│ [━━━━━━━━━━○]          │
│                         │
│ Filters                 │
│ Brightness [━━━○━━━]   │
│ Contrast   [━━━○━━━]   │
│                         │
├─────────────────────────┤
│ POSITION & SIZE         │
├─────────────────────────┤
│ X: [100]  Y: [100]      │
│ W: [400]  H: [300]      │
│ Rotation: [0°]          │
│                         │
│ [Maintain Aspect Ratio] │
└─────────────────────────┘
```

### **Export Dialog**

```
┌─────────────────────────────────┐
│ Export Design                   │
├─────────────────────────────────┤
│                                 │
│ File Name                       │
│ [my-design.png]                 │
│                                 │
│ Quality                         │
│ ○ Standard (1x)                 │
│ ● High (2x) ← Recommended       │
│ ○ Ultra (3x)                    │
│                                 │
│ Background                      │
│ ● White                         │
│ ○ Transparent                   │
│                                 │
│ Format                          │
│ ● PNG                           │
│ ○ JPG (coming soon)             │
│                                 │
├─────────────────────────────────┤
│          [Cancel]  [Export]     │
└─────────────────────────────────┘
```

---

## 📋 Implementation Checklist

### **Phase A: Canvas Foundation** (Day 1)
```
□ Install Fabric.js dependency
□ Create CanvasProvider.tsx
□ Create Canvas.tsx component
□ Initialize Fabric.js canvas
□ Add canvas to EditorPage
□ Test canvas renders
□ Create CanvasToolbar.tsx (left sidebar)
□ Add tool buttons (icons only, no functionality yet)
□ Style toolbar with existing design system
```

### **Phase B: Text Tool** (Day 1-2)
```
□ Implement addText() function
□ Add text at canvas center on button click
□ Make text editable on double-click
□ Create TextProperties.tsx component
□ Add font family selector
□ Add font size slider
□ Add color picker
□ Add bold/italic/underline toggles
□ Add text alignment buttons
□ Connect properties to canvas text
□ Test all text features
```

### **Phase C: Image & Shape Tools** (Day 2)
```
□ Implement addImage() function
□ Add file upload input
□ Convert uploaded file to base64
□ Add image to canvas
□ Implement addRectangle() function
□ Implement addCircle() function
□ Create ShapeProperties.tsx
□ Add fill color picker
□ Add stroke color picker
□ Add stroke width slider
□ Test all tools
```

### **Phase D: Selection & Manipulation** (Day 2-3)
```
□ Handle object:selected event
□ Update selectedObject state
□ Display selection box with handles
□ Enable drag to move
□ Enable corner handles to resize
□ Enable rotate handle
□ Implement Delete key handler
□ Implement deleteSelected() function
□ Update properties panel on selection
□ Test selection on different object types
□ Add multi-select (Shift+Click)
□ Test deselection
```

### **Phase E: Templates** (Day 3)
```
□ Create templates.ts with 5-10 templates
□ Find Unsplash images for templates
□ Define template JSON structure
□ Implement loadTemplate() function
□ Clear canvas before loading
□ Parse template.canvasData
□ Add objects to canvas
□ Test template loading
□ Update TemplatesPage
□ Add "Use Template" button
□ Navigate to /editor on click
□ Pass template ID via URL or state
□ Load template on EditorPage mount
□ Test full template flow
```

### **Phase F: Save/Load** (Day 3-4)
```
□ Implement saveCanvas() function
□ Serialize canvas with canvas.toJSON()
□ Generate thumbnail with canvas.toDataURL()
□ Store in LocalStorage
□ Update existing SaveDialog
□ Test save functionality
□ Implement loadCanvas() function
□ Retrieve from LocalStorage
□ Parse JSON
□ Load objects to canvas with canvas.loadFromJSON()
□ Test load functionality
□ Update MyDesignsPage
□ Add "Open in Editor" button
□ Load design on click
□ Implement auto-save (30s interval)
□ Add "Saving..." indicator
□ Test auto-save
```

### **Phase G: Export** (Day 4)
```
□ Create ExportDialog.tsx
□ Implement exportToPNG() function
□ Deselect all objects
□ Use canvas.toDataURL() for export
□ Set multiplier for resolution
□ Create download link
□ Trigger download
□ Add export button to toolbar
□ Show export dialog on click
□ Add file name input
□ Add resolution selector
□ Add background toggle
□ Test export at different resolutions
□ Test with/without background
□ Show success toast after export
```

### **Phase H: Polish & Testing** (Day 4-5)
```
□ Add loading states
□ Add error handling
□ Test all features end-to-end
□ Test on different browsers
□ Test responsive layout
□ Fix any bugs
□ Add keyboard shortcuts
□ Add tooltips to toolbar
□ Performance check (canvas FPS)
□ Clean up console errors
□ Remove unused code
□ Update TypeScript types
□ Final testing
```

---

## 🚀 Migration Plan to Replit

### **Step 1: Export from Figma Make**
```
1. Download project as ZIP
2. Extract files
3. Review folder structure
4. Note all dependencies (package.json)
```

### **Step 2: Setup in Replit**
```
1. Create new Replit project (React + TypeScript)
2. Upload all files
3. Install dependencies: npm install
4. Fix import paths if needed
5. Update environment variables (if any)
```

### **Step 3: Test in Replit**
```
□ Run: npm run dev
□ Test canvas rendering
□ Test text tool
□ Test image tool
□ Test shapes
□ Test selection
□ Test templates
□ Test save/load
□ Test export
□ Fix any errors
```

### **Step 4: Enhance in Replit/Cursor** (Later)
```
□ Advanced Fabric.js features
□ Undo/redo system (more robust)
□ Layers panel
□ Performance optimization
□ Advanced export options
□ Add Stripe integration (payment)
□ Add OpenAI integration (AI features)
□ Add Supabase (cloud sync)
```

---

## ⏱️ Time Estimates

### **Figma Make Build Phase**
```
Day 1: Canvas Foundation + Text Tool (6-8 hours)
Day 2: Image/Shape Tools + Selection (6-8 hours)
Day 3: Templates + Save/Load (6-8 hours)
Day 4: Export + Polish (4-6 hours)
Day 5: Testing + Bug Fixes (4-6 hours)

Total: 26-36 hours (3-5 days of focused work)
```

### **Migration to Replit**
```
Export & Upload: 1 hour
Dependency installation: 1 hour
Testing & fixes: 2-4 hours

Total: 4-6 hours (half day)
```

### **Enhancement in Replit/Cursor**
```
Advanced features: 1-2 weeks
API integrations: 1 week
Testing & polish: 3-5 days

Total: 3-4 weeks for full MVP
```

---

## 🎯 Success Criteria

### **Before Migration to Replit**
```
✓ Canvas renders correctly
✓ Can add text, images, shapes
✓ Can select and manipulate objects
✓ Can delete objects
✓ Properties panel updates on selection
✓ At least 5 templates work
✓ Can load template to canvas
✓ Can save design to LocalStorage
✓ Can load saved design
✓ Auto-save works
✓ Can export to PNG
✓ No critical bugs
✓ No console errors
```

### **After Migration to Replit**
```
✓ All Figma Make features still work
✓ No import errors
✓ Canvas performance smooth (60fps)
✓ Ready to add API integrations
```

---

## 🚨 Known Limitations in Figma Make

### **What We Won't Build Here**
```
❌ Complex undo/redo (better in Replit)
❌ Advanced layer management
❌ Performance optimizations
❌ API integrations (Stripe, OpenAI)
❌ Cloud storage (Supabase)
❌ Real-time collaboration
❌ Advanced export formats (PDF, SVG)
```

### **Why Build in Figma Make First?**
```
✓ Fast UI prototyping
✓ Design system already here
✓ Visual feedback immediate
✓ Can iterate quickly
✓ Export clean code to Replit
✓ Avoid Replit performance issues during UI phase
```

---

## 📝 Notes & Considerations

### **Fabric.js Tips**
```
- Use canvas.renderAll() after changes
- Store canvas instance in useRef
- Clean up canvas on unmount
- Use canvas.toJSON() and canvas.loadFromJSON() for save/load
- Set selection:true for editable objects
- Use canvas.getActiveObject() for selected element
```

### **Performance**
```
- Keep object count < 100 for smooth performance
- Use canvas.requestRenderAll() instead of renderAll()
- Debounce property changes
- Use object caching for images
```

### **LocalStorage Limits**
```
- Limit: ~5-10MB per domain
- Compress large images before saving
- Limit design history
- Clean up old designs
- Warn user when approaching limit
```

---

## ✅ Final Checklist Before Starting

```
□ Current codebase reviewed
□ Existing components identified
□ File structure planned
□ Dependencies listed
□ Template data structure defined
□ Implementation order prioritized
□ Time estimates confirmed
□ Migration plan documented
□ Success criteria defined
□ Ready to start building
```

---

## 🎉 Ready to Build!

**Next Steps:**
1. ✅ Review this plan
2. ✅ Confirm approach
3. 🚀 Start with Phase A: Canvas Foundation

**Estimated Completion:** 3-5 days of focused work

**Expected Output:** 
- Fully functional canvas editor
- 5-10 working templates
- Save/load system
- PNG export
- Ready to migrate to Replit

---

*Plan Created: December 2024*
*Status: Ready for Implementation*

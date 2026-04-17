You are a senior SaaS product designer designing a professional, scalable
Infographic Editor UI similar to Canva, but cleaner and more engineering-friendly.

GOAL:
Design a client-side Infographic Editor UI that supports a hybrid rendering engine:
- React + native SVG for editing
- Canvas/WebGL (PixiJS) for visual effects
The UI must be modular, Auto Layout based, and easy to convert to React components.

STYLE:
- Minimal, modern, professional
- Light theme
- Neutral colors (gray, white, subtle blue accents)
- No heavy illustrations or marketing visuals
- Prioritize clarity, spacing, and hierarchy

LAYOUT:
Desktop web application (1440px wide)

Main layout structure:
- Top toolbar
- Left sidebar (tools + layers)
- Center canvas area
- Right properties panel

FEATURES TO DESIGN:

1. TOP TOOLBAR
- Logo placeholder
- Undo / Redo buttons
- Zoom control (percentage dropdown)
- Export button (primary action)

2. LEFT SIDEBAR (Tabs)
Tab 1: Tools
- Select tool
- Text tool
- Image upload tool
- Rectangle tool
- Circle tool
- Delete tool

Tab 2: Layers
- List of layers (icon + name)
- Visibility toggle
- Lock toggle
- Drag handle for reordering

3. CENTER CANVAS AREA
- Large editable canvas placeholder
- Rulers (top & left)
- Grid toggle
- Zoom/pan affordances
- Selection bounding box example (resize handles, rotate handle)

4. RIGHT PROPERTIES PANEL
Dynamic panel that changes based on selected element

For TEXT:
- Font family dropdown
- Font size input
- Bold / Italic / Underline
- Text color picker
- Alignment (left/center/right)

For SHAPES:
- Fill color
- Stroke color
- Stroke width
- Opacity

For IMAGES:
- Opacity
- Corner radius
- Shadow toggle

5. MODALS / DIALOGS

EXPORT MODAL:
- Title: "Export Design"
- Format selector (PNG, JPG)
- Size options (1x, 2x, custom)
- Background toggle (transparent / white)
- Export button

IMAGE UPLOAD MODAL:
- Drag & drop area
- File picker button
- Supported formats text

6. COMMON UI COMPONENTS
- Color picker popover
- Font selector dropdown
- Icon buttons with tooltip
- Primary / secondary buttons
- Divider components

CONSTRAINTS:
- Use Auto Layout everywhere
- Use component variants for buttons, inputs, icons
- Name layers clearly (React-friendly names)
- No mobile design needed
- No backend or auth screens

OUTPUT:
- One main Editor screen
- Separate frames for Export Modal and Image Upload Modal
- Clean, developer-ready UI design

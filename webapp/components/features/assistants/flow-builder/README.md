# Flow Builder - Visual Assistant Designer

A Figma-inspired visual flow builder for designing AI assistant workflows.

## 🎯 Overview

The Flow Builder transforms the traditional form-based assistant configuration into an intuitive, visual node-based interface. Users can see their assistant's workflow as a vertical flow diagram and click on nodes to edit their configuration.

## 📦 Components

### Core Components

- **FlowCanvas** - Main canvas component that renders the entire flow
- **FlowNode** - Individual node representing a step in the workflow
- **FlowConnector** - SVG-based arrow connecting nodes with smooth bezier curves
- **NodeEditorSidebar** - Slide-in sidebar for editing node configuration

### Supporting Files

- **types.ts** - TypeScript type definitions for the flow system
- **scenarios.ts** - Scenario definitions (currently MVP standard scenario)
- **index.ts** - Barrel exports for easy imports

## 🚀 Features

### MVP (Current)
- ✅ Visual vertical flow layout
- ✅ 3-node standard scenario: Call → AI Agent → Email
- ✅ Clickable nodes with hover effects
- ✅ Animated SVG arrows with flow indicators
- ✅ Right-side editor sidebar with tabs:
  - Prompt/Instructions
  - Voice & Tone
  - Advanced (placeholder)
- ✅ Auto-save to backend on configuration changes
- ✅ Responsive design (mobile-friendly)
- ✅ Smooth animations (framer-motion)
- ✅ Fixed node positions (no drag-drop)

### Future Enhancements
- 🔜 Custom flow creation (add/remove nodes)
- 🔜 Drag & drop node repositioning
- 🔜 Multiple scenario templates
- 🔜 Conditional branching
- 🔜 Advanced AI settings per node
- 🔜 Flow testing & preview mode

## 🎨 Design Philosophy

Inspired by Figma, the interface focuses on:
- **Visual clarity** - See the workflow at a glance
- **Direct manipulation** - Click to edit
- **Smooth animations** - Delightful user experience
- **Professional aesthetics** - Clean, modern design

## 📐 Architecture

### Data Flow

```
User clicks node → Opens sidebar → Edits config → Saves
                                                    ↓
                                    Updates local state + backend
                                                    ↓
                                    Re-renders flow with new config
```

### Node Types

1. **Trigger** (Blue) - Entry point (e.g., "Call Received")
2. **Action** (Purple) - Processing step (e.g., "AI Agent")
3. **Endpoint** (Green) - Final action (e.g., "Email Summary")

### Configuration Persistence

Node configurations are merged with the global StudioConfigInput and saved to:
- Database (via `/api/config`)
- Vapi (synced automatically)
- React Query cache (optimistic updates)

## 🔧 Usage

```tsx
import { FlowCanvas } from "./flow-builder";
import { getStandardScenarioWithConfig } from "./flow-builder/scenarios";

function AssistantDesigner() {
  const config = useStudioConfig(); // Load from API
  const scenario = getStandardScenarioWithConfig(config);

  return (
    <FlowCanvas
      scenario={scenario}
      onNodeConfigUpdate={(nodeId, config) => {
        // Handle config update
        saveToBackend(config);
      }}
    />
  );
}
```

## 🎯 MVP Constraints

For the initial release:
- Flow structure is **hardcoded** (3 nodes, 2 connections)
- Nodes are **not draggable** (fixed positions)
- Only **standard scenario** available
- Advanced settings are **placeholder only**

These constraints allow us to ship quickly while maintaining a clean architecture for future expansion.

## 🌟 Key Highlights

### Visual Design
- Color-coded nodes by type
- Gradient backgrounds and subtle shadows
- Animated connection lines with flowing dots
- Smooth hover and selection states

### User Experience
- One-click node editing
- Tabbed sidebar for organized settings
- Real-time character counts
- Helpful inline tips and badges

### Technical Excellence
- Fully typed (TypeScript)
- Responsive and accessible
- Optimized animations (framer-motion)
- Clean component architecture

## 📱 Responsive Behavior

- **Desktop**: Sidebar slides in from right (500px width)
- **Tablet**: Sidebar overlays full screen
- **Mobile**: Nodes stack vertically, touch-friendly sizing

## 🎨 Styling

Uses Tailwind CSS with:
- GlassCard components for consistency
- Brand colors from design system
- Dark mode support
- Smooth transitions and animations

---

**Status**: ✅ MVP Complete
**Next**: Custom flow creation & drag-drop support

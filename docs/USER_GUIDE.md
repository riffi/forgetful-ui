# Forgetful UI - User Guide

A visual guide to managing your AI knowledge base.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Memories](#memories)
- [Entities](#entities)
- [Projects](#projects)
- [Documents](#documents)
- [Code Artifacts](#code-artifacts)
- [Knowledge Graph](#knowledge-graph)
- [Global Search](#global-search)
- [Project Context Filter](#project-context-filter)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### First Launch

When you open Forgetful UI, the system automatically detects your authentication mode:

- **No auth required** - Direct access to dashboard
- **OAuth enabled** - "Login with GitHub" button appears
- **JWT mode** - Login form is shown

After authentication (if required), you'll see the main dashboard.

### Interface Overview

The interface consists of three main areas:

```
┌─────────────┬────────────────────────────┬──────────────┐
│             │                            │              │
│   Sidebar   │      Content Area          │ Detail Panel │
│   (240px)   │                            │   (380px)    │
│             │                            │  (optional)  │
│             │                            │              │
└─────────────┴────────────────────────────┴──────────────┘
```

- **Sidebar** - Navigation, search, project filter, user profile
- **Content Area** - Main workspace for current page
- **Detail Panel** - Quick edit panel (slides in when item selected)

---

## Dashboard

The dashboard provides an overview of your knowledge base.

### Stats Cards

Top row shows counts for each data type:
- Click any card to navigate to that section
- Counts respect the active project filter

### Recent Memories

Shows the 10 most recently updated memories:
- Click a row to open quick edit panel
- Double-click to open full detail page

### Quick Actions

- **Search** - Opens global search modal
- **Create buttons** - Quick create for any item type
- **High Importance** - Shows memories with importance 9-10

---

## Memories

Memories are atomic units of knowledge - facts, concepts, or information.

### List View

| Column | Description |
|--------|-------------|
| Title | Memory name (click to edit in panel) |
| Importance | 1-10 scale, color-coded |
| Tags | Categorization labels |
| Project | Associated project |
| Updated | Last modification date |

### Creating a Memory

1. Click **Create Memory** button
2. Fill in:
   - **Title** - Short descriptive name
   - **Content** - Main information (markdown supported)
   - **Context** - Background/source information
   - **Importance** - 1-10 (higher = more important)
   - **Keywords** - Search terms
   - **Tags** - Categories
   - **Project** - Optional association

### Editing a Memory

**Quick Edit (Panel)**
- Click any row to open side panel
- Edit importance, tags, projects inline
- Changes auto-save

**Full Page Edit**
- Double-click row OR click "Edit Full" in panel
- All fields are inline-editable (click to edit)
- Click **Save Changes** when done

### Importance Colors

| Range | Color | Meaning |
|-------|-------|---------|
| 9-10 | Red/Orange gradient | Critical |
| 7-8 | Yellow | Important |
| 1-6 | Gray | Normal |

### Bulk Actions

1. Select multiple items with checkboxes
2. Bottom bar appears with actions:
   - Delete selected
   - Mark as obsolete
   - Add to project
   - Remove from project

---

## Entities

Entities represent people, organizations, teams, or things.

### Entity Types

- **Person** - Individual people
- **Organization** - Companies, institutions
- **Team** - Groups within organizations
- **Technology** - Tools, languages, frameworks
- **Device** - Hardware, equipment
- **Other** - Custom type (specify in custom_type field)

### Creating an Entity

1. Click **Create Entity**
2. Fill in:
   - **Name** - Entity name
   - **Type** - Select from dropdown
   - **Custom Type** - If "Other" selected
   - **Notes** - Description (markdown)
   - **Tags** - Categories

### Relationships

Entities can have relationships with other entities:
- View in sidebar on detail page
- Click **Add Relationship** to create new
- Relationships appear in Knowledge Graph

---

## Projects

Projects organize related content together.

### Project Types

- **Development** - Software projects
- **Research** - Research initiatives
- **Documentation** - Documentation efforts
- **Personal** - Personal knowledge

### Project Status

| Status | Description |
|--------|-------------|
| Active | Currently in progress |
| Paused | Temporarily on hold |
| Completed | Finished |
| Archived | No longer active |

### Project Detail Page

**Tabs:**
- **Memories** - All linked memories
- **Documents** - All linked documents
- **Code Artifacts** - All linked code
- **Entities** - All linked entities

Each tab allows:
- Searching within linked items
- Linking new items
- Unlinking existing items

---

## Documents

Documents store longer-form content.

### Document Types

- **Markdown** - Formatted text
- **Text** - Plain text
- **PDF** - PDF documents
- **HTML** - Web content
- **JSON** - JSON data
- **YAML** - YAML configuration
- **Other** - Other formats

### Content Editor

- Supports markdown formatting
- Toggle between edit and preview modes
- Fullscreen editing available

---

## Code Artifacts

Code artifacts store code snippets and files.

### Supported Languages

The editor supports syntax highlighting for:
- JavaScript/TypeScript
- Python
- Go, Rust, Java
- SQL, HTML, CSS
- And many more...

### Code Editor Features

- Syntax highlighting
- Line numbers
- Copy to clipboard button
- Fullscreen mode

---

## Knowledge Graph

Interactive visualization of connections between items.

### Navigation

1. **Search** - Use toolbar search to find a node
2. **Click result** - Graph focuses on that node
3. **Click any node** - Refocus graph on it
4. **Drag nodes** - Rearrange layout
5. **Pan/Zoom** - Mouse scroll and drag

### Depth Control

Controls how many levels of connections to show:
- **1** - Direct connections only
- **2** - Connections of connections
- **3** - Three levels deep

### Node Colors

| Color | Type |
|-------|------|
| Purple | Memory |
| Amber | Entity |
| Blue | Document |
| Cyan | Code Artifact |
| Green | Project |

### Toolbar Controls

- **Zoom** - In/Out/Fit
- **Layout** - Force/Hierarchical/Radial
- **Filters** - Show/hide node types
- **Export** - Save graph image
- **Fullscreen** - Expand to full screen

### Deep Linking

Share specific views using URL:
```
/graph?focus=memory_123
/graph?focus=entity_456
```

---

## Global Search

Press `/` or click search box to open.

### Search Features

- **Semantic search** - Finds related content
- **Type filters** - Filter by item type
- **Project scoped** - Respects active project filter

### Results

Results grouped by type:
- Click result to navigate to detail page
- Shows relevance score
- Preview of content

---

## Project Context Filter

Filter all views by a single project.

### How to Use

1. Click project dropdown in sidebar
2. Select a project (sorted by recent activity)
3. All lists now show only items from that project

### When Active

- Stats show project-specific counts
- Lists are pre-filtered
- New items auto-assign to project
- Search is scoped to project

### Clear Filter

- Select "All Projects" from dropdown
- Or click X button next to selected project

### Keyboard Shortcut

Press `Ctrl+P` to quickly open project selector.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open global search |
| `Ctrl+P` | Open project selector |
| `Escape` | Close panel/modal |

---

## Tips & Best Practices

### Organizing Knowledge

1. **Use projects** - Group related items together
2. **Tag consistently** - Create a tagging taxonomy
3. **Set importance** - Prioritize critical information
4. **Link items** - Create connections for context

### Effective Searching

1. **Semantic search** - Describe what you're looking for
2. **Use filters** - Narrow by type when needed
3. **Graph exploration** - Find related items visually

### Workflow Suggestions

**Daily capture:**
- Quick create memories for new information
- Add to relevant project
- Tag appropriately

**Weekly review:**
- Check high-importance items
- Archive obsolete memories
- Review and link related items

**Project work:**
- Set project context filter
- Focus on project-specific content
- Use graph to explore connections

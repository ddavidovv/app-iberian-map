# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive Iberian Peninsula map application built with React + TypeScript + Vite. Displays geographical zones with color-coded pricing/shipping baremos (rates) based on selected products and origin zones.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Application Routes
- **`/`** - Main map interface (MapPage)
- **`/admin`** - Configuration admin panel (AdminPanel)
  - Password: `admin123`

### Data Flow
1. **Configuration Loading**: Map configuration loaded from `src/data/map-config.json` via `configService.ts`
2. **SVG Parsing**: Iberian map SVG parsed dynamically by `mapService.ts` to extract zone geometries (paths, rects, ellipses)
3. **State Management**: `useMapConfig` hook manages origin selection, product filtering, and zone coloring logic
4. **Multi-Origin System**: User first selects origin type (Península, Canarias, Baleares, Islas Portugal), then products are filtered accordingly
5. **Color Mapping**: When user selects origin zone on map, destination zones colored according to baremo codes
6. **Admin Configuration**: Configuration files in `public/config/` managed via localStorage using `configManager` service

### Key Components

#### Map Interface
- **MapPage.tsx**: Main page with map and navigation to admin panel
- **Map.tsx**: Main map container with zoom controls, fullscreen, origin selector, and product selector overlay
- **MapZone.tsx**: Individual SVG zone renderer (path/rect/ellipse)
- **DraggableLegend.tsx**: Shows color legend when product + origin zone selected
- **OriginSelector.tsx**: Dropdown for selecting customer origin type
- **ProductSelector.tsx**: Dropdown for product selection (filtered by selected origin)

#### Admin Panel
- **AdminPanel.tsx**: Configuration panel with tabbed interface (password-protected)
- **ProductsManager.tsx**: Manage products available per origin (add/remove/edit)

### Multi-Origin System
Each product can have multiple origin configurations (`origins` array):
- `origin_type`: Type of origin ('peninsula' | 'canarias' | 'baleares' | 'islas_portugal')
- `mapConfig`: Array of zone configurations for that origin type

**Flow**:
1. User selects origin type (e.g., "Canarias")
2. Products filtered to show only those available for selected origin
3. User selects product from filtered list
4. User clicks on origin zone on map
5. Map colors all destination zones based on baremo codes

### Baremo System
Each origin configuration has a `mapConfig` array of origin zones. Each origin zone has `destins` with:
- `baremo_code`: Rate category code (e.g., 'PEN', 'PRO', 'PTI', 'NP')
- `destin_zones`: Array of destination zone IDs that share this baremo

Colors defined in `src/config/baremos.ts` map baremo codes to hex colors and display names.

### Zone ID Format
- Spain: `ES-{province_code}` (e.g., `ES-VI` for Vizcaya)
- Portugal: `PT-{region}-{code}` (e.g., `PT-AZ-CO` for Azores Corvo)
- Special: `cuadrado_*` zones are non-interactive background elements

## Data Files

### Configuration System

The application uses a layered configuration system for scalability:

#### `public/config/zone-groups.json`
Defines reusable groups of geographical zones:
```json
{
  "PENINSULA_ALL": ["ES-A", "ES-AB", ...],
  "CANARIAS_MAYORES": ["ES-GC-LA", "ES-TF-TF"],
  "PORTUGAL_CONTINENTAL": ["PT-AV", "PT-BE", ...],
  ...
}
```

#### `public/config/category-mappings.json`
Maps Excel categories to baremo codes and zone groups by origin:
```json
{
  "peninsula": {
    "Provincial": {"baremo": "PRO", "zones": "SAME_AS_ORIGIN"},
    "Regional": {"baremo": "REG", "zones": "REGIONAL_NEIGHBORS"},
    "Peninsular": {"baremo": "PEN", "zones": "PENINSULA_ALL"}
  },
  ...
}
```

Special zone values:
- `SAME_AS_ORIGIN` - Uses the same zone as origin
- `REGIONAL_NEIGHBORS` - Uses zones from `regional-neighbors.json`
- Any other value references a group from `zone-groups.json`

#### `public/config/regional-neighbors.json`
Defines regional neighbors for each zone:
```json
{
  "ES-M": ["ES-TO", "ES-GU", "ES-AV", "ES-SG"],
  "ES-B": ["ES-GI", "ES-T", "ES-L"],
  ...
}
```

#### `public/config/products-availability.json`
Lists products available for each origin type:
```json
{
  "peninsula": ["CTT 24h", "CTT 48h", "CTT e24h", ...],
  "canarias": ["CTT 24h", "CTT 48h", ...],
  ...
}
```

**Configuration Management**:
- Configuration files loaded on first access
- Cached in `localStorage` for performance
- Editable via Admin Panel at `/admin`
- Service: `src/services/configManager.ts`

### `public/data/map-config.json`
Contains `products` array where each product has:
- `id`: Product code (e.g., "C24")
- `name`: Display name (e.g., "CTT e24h")
- `origins`: Array of origin configurations, each with:
  - `origin_type`: Origin type ('peninsula', 'canarias', 'baleares', 'islas_portugal')
  - `mapConfig`: Array of zone configurations for that origin

### `public/assets/iberian_map.svg`
SVG file with zone geometries. Parser extracts elements with IDs and `data-name` attributes.

### Portfolio Excel
Source data in `Portfolio ES-PT- IBÉRICO 24.09.2025 (v12).xlsx` with sheets:
- **Origen Península**: Products and rates for peninsula origins
- **Origen Canarias**: Products and rates for Canary Islands origins
- **Origen Baleares**: Products and rates for Balearic Islands origins
- **Origen Islas Portugal**: Products and rates for Portuguese Islands origins

Use `scripts/extract-excel-data.py` to extract data (requires manual zone mapping).

## Deployment

Azure DevOps pipeline deploys to AWS S3 + CloudFront:
- **Staging**: Deploys from `staging`/`dev` branches to staging bucket
- **Production**: Deploys from `main`/`master` branches to production bucket
- Pipeline runs `yarn init-incident-solver` before build (custom script)

## Admin Panel Usage

### Accessing the Panel
1. Navigate to `http://localhost:{port}/admin`
2. Enter password: `admin123`
3. Select tab to configure

### Managing Products (Tab: Productos)
1. **Select Origin**: Choose origin type from dropdown
2. **Add Product**:
   - Type product name in input field
   - Click "Agregar" or press Enter
3. **Remove Product**: Click trash icon next to product name
4. **Save Changes**: Click "Guardar Cambios" button (appears when changes made)

### Configuration Workflow
1. Edit configurations in Admin Panel
2. Changes saved to `localStorage`
3. To reset to defaults: Use browser dev tools to clear localStorage
4. To export configuration: Use `configManager.exportConfigurations()`
5. To import configuration: Use `configManager.importConfigurations(jsonString)`

### Extending the Admin Panel
To add new configuration editors:
1. Create component in `src/components/admin/`
2. Add tab to `AdminPanel.tsx`
3. Use `configManager` service for loading/saving
4. Follow pattern from `ProductsManager.tsx`

## Coding Conventions

- Use TypeScript strict mode
- React functional components with hooks
- TailwindCSS for styling
- Backend code uses snake_case (per global CLAUDE.md)
- Configuration files use snake_case for keys
- Component files use PascalCase
- Service files use camelCase

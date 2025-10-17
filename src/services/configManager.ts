/**
 * Config Manager Service
 *
 * Handles loading and saving configuration files for the map application.
 * Uses localStorage for persistence in the browser.
 */

import type { ZonesMaster, ZoneMasterEntry } from '../types/map';

export interface ZoneGroups {
  [groupName: string]: string[];
}

export interface CategoryMapping {
  baremo: string;
  zones: string;
}

export interface CategoryMappings {
  [originType: string]: {
    [category: string]: CategoryMapping;
  };
}

export interface RegionalNeighbors {
  [zoneId: string]: string[];
}

export interface ProductsAvailability {
  [originType: string]: string[];
}

const STORAGE_KEYS = {
  ZONE_GROUPS: 'map_config_zone_groups',
  CATEGORY_MAPPINGS: 'map_config_category_mappings',
  REGIONAL_NEIGHBORS: 'map_config_regional_neighbors',
  PRODUCTS_AVAILABILITY: 'map_config_products_availability',
  ZONES_MASTER: 'map_config_zones_master'
};

class ConfigManager {
  /**
   * Load Zone Groups configuration
   */
  async loadZoneGroups(): Promise<ZoneGroups> {
    const stored = localStorage.getItem(STORAGE_KEYS.ZONE_GROUPS);
    if (stored) {
      return JSON.parse(stored);
    }

    // Load from public folder
    const response = await fetch('/config/zone-groups.json');
    const data = await response.json();

    // Cache in localStorage
    localStorage.setItem(STORAGE_KEYS.ZONE_GROUPS, JSON.stringify(data));

    return data;
  }

  /**
   * Save Zone Groups configuration
   */
  async saveZoneGroups(zoneGroups: ZoneGroups): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ZONE_GROUPS, JSON.stringify(zoneGroups));
  }

  /**
   * Load Category Mappings configuration
   */
  async loadCategoryMappings(): Promise<CategoryMappings> {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORY_MAPPINGS);
    if (stored) {
      return JSON.parse(stored);
    }

    const response = await fetch('/config/category-mappings.json');
    const data = await response.json();

    localStorage.setItem(STORAGE_KEYS.CATEGORY_MAPPINGS, JSON.stringify(data));

    return data;
  }

  /**
   * Save Category Mappings configuration
   */
  async saveCategoryMappings(categoryMappings: CategoryMappings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_MAPPINGS, JSON.stringify(categoryMappings));
  }

  /**
   * Load Regional Neighbors configuration
   */
  async loadRegionalNeighbors(): Promise<RegionalNeighbors> {
    const stored = localStorage.getItem(STORAGE_KEYS.REGIONAL_NEIGHBORS);
    if (stored) {
      return JSON.parse(stored);
    }

    const response = await fetch('/config/regional-neighbors.json');
    const data = await response.json();

    localStorage.setItem(STORAGE_KEYS.REGIONAL_NEIGHBORS, JSON.stringify(data));

    return data;
  }

  /**
   * Save Regional Neighbors configuration
   */
  async saveRegionalNeighbors(regionalNeighbors: RegionalNeighbors): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.REGIONAL_NEIGHBORS, JSON.stringify(regionalNeighbors));
  }

  /**
   * Load Products Availability configuration
   */
  async loadProductsAvailability(): Promise<ProductsAvailability> {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS_AVAILABILITY);
    if (stored) {
      return JSON.parse(stored);
    }

    const response = await fetch('/config/products-availability.json');
    const data = await response.json();

    localStorage.setItem(STORAGE_KEYS.PRODUCTS_AVAILABILITY, JSON.stringify(data));

    return data;
  }

  /**
   * Save Products Availability configuration
   */
  async saveProductsAvailability(productsAvailability: ProductsAvailability): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS_AVAILABILITY, JSON.stringify(productsAvailability));
  }

  /**
   * Reset all configurations to defaults (reload from public folder)
   */
  async resetToDefaults(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.ZONE_GROUPS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORY_MAPPINGS);
    localStorage.removeItem(STORAGE_KEYS.REGIONAL_NEIGHBORS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS_AVAILABILITY);
  }

  /**
   * Export all configurations as JSON
   */
  async exportConfigurations(): Promise<string> {
    const config = {
      zoneGroups: await this.loadZoneGroups(),
      categoryMappings: await this.loadCategoryMappings(),
      regionalNeighbors: await this.loadRegionalNeighbors(),
      productsAvailability: await this.loadProductsAvailability()
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configurations from JSON string
   */
  async importConfigurations(jsonString: string): Promise<void> {
    const config = JSON.parse(jsonString);

    if (config.zoneGroups) {
      await this.saveZoneGroups(config.zoneGroups);
    }
    if (config.categoryMappings) {
      await this.saveCategoryMappings(config.categoryMappings);
    }
    if (config.regionalNeighbors) {
      await this.saveRegionalNeighbors(config.regionalNeighbors);
    }
    if (config.productsAvailability) {
      await this.saveProductsAvailability(config.productsAvailability);
    }
  }

  /**
   * Get available zones from the map SVG
   */
  async getAvailableZonesFromMap(): Promise<string[]> {
    try {
      const response = await fetch('/assets/iberian_map.svg');
      const svgContent = await response.text();

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

      // Get all elements with IDs (path, rect, ellipse)
      const elements = Array.from(svgDoc.querySelectorAll('path, rect, ellipse'));

      // Extract zone IDs, excluding non-zone elements (like cuadrado_* background elements)
      const zoneIds = elements
        .map(el => el.id)
        .filter(id => id && !id.startsWith('cuadrado_'))
        .sort();

      return zoneIds;
    } catch (error) {
      console.error('Error loading zones from map:', error);
      return [];
    }
  }

  /**
   * Get usage information for a zone group
   * Returns array of locations where the group is used
   */
  async getGroupUsage(groupName: string): Promise<string[]> {
    const categoryMappings = await this.loadCategoryMappings();
    const usages: string[] = [];

    // Check all origins and categories
    for (const [originType, categories] of Object.entries(categoryMappings)) {
      for (const [categoryName, mapping] of Object.entries(categories)) {
        if (mapping.zones === groupName) {
          usages.push(`${originType} → ${categoryName}`);
        }
      }
    }

    return usages;
  }

  /**
   * Validate if a zone ID exists in the map
   */
  async validateZoneId(zoneId: string): Promise<boolean> {
    const availableZones = await this.getAvailableZonesFromMap();
    return availableZones.includes(zoneId);
  }

  /**
   * Get zone IDs grouped by region for easier selection
   */
  async getZonesByRegion(): Promise<Record<string, string[]>> {
    const zones = await this.getAvailableZonesFromMap();

    const regions: Record<string, string[]> = {
      'España Peninsular': [],
      'Canarias': [],
      'Baleares': [],
      'Portugal Continental': [],
      'Azores': [],
      'Madeira': [],
      'Otros': []
    };

    zones.forEach(zoneId => {
      if (zoneId.startsWith('ES-GC-') || zoneId.startsWith('ES-TF-')) {
        regions['Canarias'].push(zoneId);
      } else if (zoneId.startsWith('ES-PM-')) {
        regions['Baleares'].push(zoneId);
      } else if (zoneId.startsWith('ES-')) {
        regions['España Peninsular'].push(zoneId);
      } else if (zoneId.startsWith('PT-AZ-')) {
        regions['Azores'].push(zoneId);
      } else if (zoneId.startsWith('PT-MA-')) {
        regions['Madeira'].push(zoneId);
      } else if (zoneId.startsWith('PT-')) {
        regions['Portugal Continental'].push(zoneId);
      } else {
        regions['Otros'].push(zoneId);
      }
    });

    return regions;
  }

  /**
   * Load Zones Master configuration
   */
  async loadZonesMaster(): Promise<ZonesMaster> {
    const stored = localStorage.getItem(STORAGE_KEYS.ZONES_MASTER);
    if (stored) {
      return JSON.parse(stored);
    }

    const response = await fetch('/data/zones-master.json');
    const data = await response.json();

    localStorage.setItem(STORAGE_KEYS.ZONES_MASTER, JSON.stringify(data));

    return data;
  }

  /**
   * Save Zones Master configuration
   */
  async saveZonesMaster(zonesMaster: ZonesMaster): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ZONES_MASTER, JSON.stringify(zonesMaster));
  }

  /**
   * Get zones with warnings
   */
  async getZoneWarnings(): Promise<ZoneMasterEntry[]> {
    const zonesMaster = await this.loadZonesMaster();
    return Object.values(zonesMaster).filter(
      zone => zone.status === 'warning' || zone.status === 'svg_only'
    );
  }

  /**
   * Get zone by ID from master
   */
  async getZoneById(zoneId: string): Promise<ZoneMasterEntry | null> {
    const zonesMaster = await this.loadZonesMaster();
    return zonesMaster[zoneId] || null;
  }

  /**
   * Update a single zone in the master
   */
  async updateZone(zoneId: string, updates: Partial<ZoneMasterEntry>): Promise<void> {
    const zonesMaster = await this.loadZonesMaster();

    if (!zonesMaster[zoneId]) {
      throw new Error(`Zone ${zoneId} not found in master`);
    }

    zonesMaster[zoneId] = {
      ...zonesMaster[zoneId],
      ...updates
    };

    await this.saveZonesMaster(zonesMaster);
  }

  /**
   * Add a new zone to the master
   */
  async addZone(zone: ZoneMasterEntry): Promise<void> {
    const zonesMaster = await this.loadZonesMaster();

    if (zonesMaster[zone.zone_code]) {
      throw new Error(`Zone ${zone.zone_code} already exists`);
    }

    zonesMaster[zone.zone_code] = zone;

    await this.saveZonesMaster(zonesMaster);
  }

  /**
   * Get zones filtered by status
   */
  async getZonesByStatus(status: ZoneMasterEntry['status']): Promise<ZoneMasterEntry[]> {
    const zonesMaster = await this.loadZonesMaster();
    return Object.values(zonesMaster).filter(zone => zone.status === status);
  }

  /**
   * Get zones filtered by country
   */
  async getZonesByCountry(countryCode: string): Promise<ZoneMasterEntry[]> {
    const zonesMaster = await this.loadZonesMaster();
    return Object.values(zonesMaster).filter(zone => zone.country_code === countryCode);
  }
}

export const configManager = new ConfigManager();

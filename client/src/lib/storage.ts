/**
 * Storage utilities for saving and loading designs and templates
 * Uses API when authenticated, falls back to LocalStorage
 */

import { designsApi, canvasTemplatesApi } from './api';

export interface DesignMetadata {
  id: string;
  name: string;
  type: "design" | "template";
  category?: string;
  thumbnail: string; // base64 image data
  canvasData: any; // Canvas state JSON
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

const DESIGNS_KEY = "brainwave_designs";
const TEMPLATES_KEY = "brainwave_templates";
const AUTOSAVE_KEY = "brainwave_autosave";

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem('auth_token');
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Generate unique ID for designs/templates
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a design - tries API first, falls back to LocalStorage
 */
export async function saveDesign(design: DesignMetadata): Promise<{ success: boolean; savedDesign: DesignMetadata }> {
  try {
    if (isAuthenticated()) {
      try {
        const savedDesign = await designsApi.save(design);
        // API may return a new DB-assigned ID — use it
        const designToCache = { ...design, ...savedDesign };
        
        // Also save to LocalStorage as cache (with potentially updated ID)
        const designs = loadDesignsFromLocalStorage();
        // Remove old entry if ID changed (LocalStorage → DB ID)
        const filteredDesigns = designs.filter((d) => d.id !== design.id && d.id !== designToCache.id);
        filteredDesigns.push({ ...designToCache, updatedAt: new Date().toISOString() });
        localStorage.setItem(DESIGNS_KEY, JSON.stringify(filteredDesigns));
        return { success: true, savedDesign: designToCache };
      } catch (apiError) {
        console.warn('API save failed, falling back to LocalStorage:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    const success = saveDesignToLocalStorage(design);
    return { success, savedDesign: design };
  } catch (error) {
    console.error("Error saving design:", error);
    return { success: false, savedDesign: design };
  }
}

/**
 * Save a template - tries API first, falls back to LocalStorage
 */
export async function saveTemplate(template: DesignMetadata): Promise<{ success: boolean; savedDesign: DesignMetadata }> {
  try {
    if (isAuthenticated()) {
      try {
        const savedTemplate = await canvasTemplatesApi.save(template);
        const templateToCache = { ...template, ...savedTemplate };
        
        const templates = loadTemplatesFromLocalStorage();
        const filteredTemplates = templates.filter((t) => t.id !== template.id && t.id !== templateToCache.id);
        filteredTemplates.push({ ...templateToCache, updatedAt: new Date().toISOString() });
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filteredTemplates));
        return { success: true, savedDesign: templateToCache };
      } catch (apiError) {
        console.warn('API save failed, falling back to LocalStorage:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    const success = saveTemplateToLocalStorage(template);
    return { success, savedDesign: template };
  } catch (error) {
    console.error("Error saving template:", error);
    return { success: false, savedDesign: template };
  }
}

/**
 * Load all designs - tries API first, falls back to LocalStorage
 */
export async function loadDesigns(): Promise<DesignMetadata[]> {
  try {
    if (isAuthenticated()) {
      try {
        const apiDesigns = await designsApi.getAll();
        const localDesigns = loadDesignsFromLocalStorage();
        // Merge: API is source of truth, but keep local-only designs not yet synced
        const apiIds = new Set(apiDesigns.map((d) => d.id));
        const localOnlyDesigns = localDesigns.filter((d) => !apiIds.has(d.id));
        const merged = [...apiDesigns, ...localOnlyDesigns];
        localStorage.setItem(DESIGNS_KEY, JSON.stringify(merged));
        return merged;
      } catch (apiError) {
        console.warn('API load failed, using LocalStorage cache:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    return loadDesignsFromLocalStorage();
  } catch (error) {
    console.error("Error loading designs:", error);
    return [];
  }
}

/**
 * Load all templates - tries API first, falls back to LocalStorage
 */
export async function loadTemplates(): Promise<DesignMetadata[]> {
  try {
    if (isAuthenticated()) {
      try {
        const apiTemplates = await canvasTemplatesApi.getAll();
        // Update LocalStorage cache
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(apiTemplates));
        return apiTemplates;
      } catch (apiError) {
        console.warn('API load failed, using LocalStorage cache:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    return loadTemplatesFromLocalStorage();
  } catch (error) {
    console.error("Error loading templates:", error);
    return [];
  }
}

/**
 * Load a specific design by ID - tries API first, falls back to LocalStorage
 */
export async function loadDesignById(id: string): Promise<DesignMetadata | null> {
  try {
    // Check localStorage first for immediate, no-latency result
    const localDesigns = loadDesignsFromLocalStorage();
    const localDesign = localDesigns.find((d) => d.id === id) || null;

    if (localDesign) {
      // Return cached version immediately; API sync can happen in the background
      return localDesign;
    }

    // Not in localStorage — try API with a timeout to prevent hangs (e.g. cold DB)
    if (isAuthenticated()) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const apiResult = await Promise.race([designsApi.getOne(id), timeoutPromise]);
        if (apiResult) {
          // Cache the result locally for subsequent loads
          const designs = loadDesignsFromLocalStorage();
          const filtered = designs.filter((d) => d.id !== apiResult.id);
          filtered.push({ ...apiResult, updatedAt: new Date().toISOString() });
          localStorage.setItem(DESIGNS_KEY, JSON.stringify(filtered));
          return apiResult;
        }
      } catch (apiError) {
        console.warn('API load failed, design not found locally either:', apiError);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error loading design:", error);
    return null;
  }
}

/**
 * Load a specific template by ID - tries API first, falls back to LocalStorage
 */
export async function loadTemplateById(id: string): Promise<DesignMetadata | null> {
  try {
    if (isAuthenticated()) {
      try {
        return await canvasTemplatesApi.getOne(id);
      } catch (apiError) {
        console.warn('API load failed, using LocalStorage cache:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    const templates = loadTemplatesFromLocalStorage();
    return templates.find((t) => t.id === id) || null;
  } catch (error) {
    console.error("Error loading template:", error);
    return null;
  }
}

/**
 * Delete a design - tries API first, falls back to LocalStorage
 */
export async function deleteDesign(id: string): Promise<boolean> {
  try {
    if (isAuthenticated()) {
      try {
        await designsApi.delete(id);
        // Also remove from LocalStorage cache
        const designs = loadDesignsFromLocalStorage();
        const filtered = designs.filter((d) => d.id !== id);
        localStorage.setItem(DESIGNS_KEY, JSON.stringify(filtered));
        return true;
      } catch (apiError) {
        console.warn('API delete failed, falling back to LocalStorage:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    return deleteDesignFromLocalStorage(id);
  } catch (error) {
    console.error("Error deleting design:", error);
    return false;
  }
}

/**
 * Delete a template - tries API first, falls back to LocalStorage
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    if (isAuthenticated()) {
      try {
        await canvasTemplatesApi.delete(id);
        // Also remove from LocalStorage cache
        const templates = loadTemplatesFromLocalStorage();
        const filtered = templates.filter((t) => t.id !== id);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
        return true;
      } catch (apiError) {
        console.warn('API delete failed, falling back to LocalStorage:', apiError);
        // Fall through to LocalStorage
      }
    }
    
    // Fallback to LocalStorage
    return deleteTemplateFromLocalStorage(id);
  } catch (error) {
    console.error("Error deleting template:", error);
    return false;
  }
}

// LocalStorage helper functions (used as fallback and cache)

function saveDesignToLocalStorage(design: DesignMetadata): boolean {
  try {
    const designs = loadDesignsFromLocalStorage();
    const existingIndex = designs.findIndex((d) => d.id === design.id);
    
    if (existingIndex >= 0) {
      designs[existingIndex] = {
        ...design,
        updatedAt: new Date().toISOString(),
      };
    } else {
      designs.push({
        ...design,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
    return true;
  } catch (error) {
    console.error("Error saving design to LocalStorage:", error);
    return false;
  }
}

function saveTemplateToLocalStorage(template: DesignMetadata): boolean {
  try {
    const templates = loadTemplatesFromLocalStorage();
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      templates.push({
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error("Error saving template to LocalStorage:", error);
    return false;
  }
}

function loadDesignsFromLocalStorage(): DesignMetadata[] {
  try {
    const data = localStorage.getItem(DESIGNS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading designs from LocalStorage:", error);
    return [];
  }
}

function loadTemplatesFromLocalStorage(): DesignMetadata[] {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading templates from LocalStorage:", error);
    return [];
  }
}

function deleteDesignFromLocalStorage(id: string): boolean {
  try {
    const designs = loadDesignsFromLocalStorage();
    const filtered = designs.filter((d) => d.id !== id);
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting design from LocalStorage:", error);
    return false;
  }
}

function deleteTemplateFromLocalStorage(id: string): boolean {
  try {
    const templates = loadTemplatesFromLocalStorage();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting template from LocalStorage:", error);
    return false;
  }
}

/**
 * Auto-save current work (draft) - LocalStorage only
 */
export function autoSaveDraft(data: any): void {
  try {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error auto-saving draft:", error);
  }
}

/**
 * Load auto-saved draft - LocalStorage only
 */
export function loadAutosaveDraft(): any | null {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    
    const draft = JSON.parse(data);
    // Check if draft is less than 24 hours old
    const draftAge = Date.now() - new Date(draft.timestamp).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (draftAge > ONE_DAY) {
      // Clear old draft
      localStorage.removeItem(AUTOSAVE_KEY);
      return null;
    }
    
    return draft.data;
  } catch (error) {
    console.error("Error loading autosave draft:", error);
    return null;
  }
}

/**
 * Clear auto-saved draft
 */
export function clearAutosaveDraft(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (error) {
    console.error("Error clearing autosave draft:", error);
  }
}

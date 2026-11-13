import base from './v3-slice.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({...base,testMatch:['v3-listing-workflow.spec.ts'],outputDir:'../.e2e-artifacts/v3-listing-workflow'});

import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import federation from '@module-federation/vite';
import path from 'path';
import moduleFederationConfig from './module-federation.config';

const sharedDependencies = {
  '@angular/animations': { singleton: true, requiredVersion: false },
  '@angular/common': { singleton: true, requiredVersion: false },
  '@angular/compiler': { singleton: true, requiredVersion: false },
  '@angular/core': { singleton: true, requiredVersion: false },
  '@angular/forms': { singleton: true, requiredVersion: false },
  '@angular/platform-browser': { singleton: true, requiredVersion: false },
  '@angular/platform-browser-dynamic': { singleton: true, requiredVersion: false },
  '@angular/router': { singleton: true, requiredVersion: false },
  rxjs: { singleton: true, requiredVersion: false },
  'zone.js': { singleton: true, requiredVersion: false },
};

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [
    angular(),
    federation({
      name: moduleFederationConfig.name,
      filename: 'remoteEntry.js',
      exposes: moduleFederationConfig.exposes,
      shared: sharedDependencies,
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, '../dist/logisticsObjects'),
    emptyOutDir: true,
  },
  server: {
    port: 4201,
    strictPort: true,
  },
  preview: {
    port: 4201,
    strictPort: true,
  },
});

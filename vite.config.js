import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveDeployTarget() {
  const explicitTarget = String(process.env.VITE_DEPLOY_TARGET || '').trim().toLowerCase();
  if (explicitTarget === 'vercel' || explicitTarget === 'pages') {
    return explicitTarget;
  }

  return process.env.VERCEL === '1' ? 'vercel' : 'pages';
}

const deployTarget = resolveDeployTarget();

export default defineConfig({
  plugins: [react()],
  base: deployTarget === 'pages' ? '/vive-to-spec-V2/' : '/',
});

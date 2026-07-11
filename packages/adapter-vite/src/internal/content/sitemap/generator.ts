/**
 * ./sitemap.ts - Sitemap generator
 *
 * Scans dist/ directory for index.html files and generates sitemap.xml.
 * Also optionally generates robots.txt.
 *
 * Designed to be called AFTER the SSG build is complete (in CLI build-ssg.ts),
 * not during Vite's buildStart/closeBundle (dist/ is empty at that point).
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import type { SitemapOptions, SitemapUrl } from '../types.ts';
import { createLogger } from '@openelement/element';

const log = createLogger('content:sitemap');

/**
 * Recursively scan a directory for index.html files.
 * Returns relative paths from the dist root (e.g., '/guide/getting-started').
 */
export function scanHtmlFiles(dir: string, baseDir: string = ''): string[] {
  const paths: string[] = [];
  let entries: string[];

  try {
    entries = readdirSync(dir);
  } catch {
    return paths;
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const relativePath = baseDir ? `${baseDir}/${entry}` : entry;

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        paths.push(...scanHtmlFiles(fullPath, relativePath));
      } else if (entry === 'index.html') {
        // Convert 'guide/getting-started/index.html' -> '/guide/getting-started'
        const urlPath = '/' + baseDir.replace(/\\/g, '/');
        paths.push(urlPath);
      }
    } catch {
      continue;
    }
  }

  return paths.sort();
}

/**
 * Generate sitemap XML content.
 */
export function renderSitemapXml(urls: SitemapUrl[]): string {
  const urlsXml = urls.map((url) => {
    let xml = '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n`;
    }
    if (url.changefreq) {
      xml += `    <changefreq>${escapeXml(url.changefreq)}</changefreq>\n`;
    }
    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    xml += '  </url>';
    return xml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

/**
 * Generate robots.txt content.
 */
export function renderRobotsTxt(hostname: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${hostname}/sitemap.xml
`;
}

/**
 * Generate sitemap.xml and optionally robots.txt from dist/ output.
 *
 * @param distDir - Path to the SSG output directory (e.g., 'www/dist')
 * @param options - Sitemap configuration
 * @returns Array of generated file paths
 */
export function generateSitemap(distDir: string, options: SitemapOptions): string[] {
  const resolvedDist = resolve(distDir);
  const exclude = options.exclude || [];
  const defaultChangefreq = options.changefreq || 'weekly';
  const defaultPriority = options.priority ?? 0.7;
  const hostname = options.hostname.replace(/\/$/, ''); // strip trailing slash

  if (!existsSync(resolvedDist)) {
    log.warn(`Dist directory not found: ${resolvedDist}`);
    return [];
  }

  // Scan for index.html files
  const htmlPaths = scanHtmlFiles(resolvedDist);

  // Filter excluded paths
  const includedPaths = htmlPaths.filter((path) => {
    return !exclude.some((pattern) => path.startsWith(pattern) || path === pattern);
  });

  // Build SitemapUrl[]
  const today = new Date().toISOString().split('T')[0];
  const urls: SitemapUrl[] = includedPaths.map((path) => ({
    loc: `${hostname}${path}`,
    lastmod: today,
    changefreq: defaultChangefreq,
    // Homepage gets higher priority
    priority: path === '/' ? 1.0 : defaultPriority,
  }));

  // Write sitemap.xml
  const sitemapPath = join(resolvedDist, 'sitemap.xml');
  writeFileSync(sitemapPath, renderSitemapXml(urls), 'utf-8');
  log.info(`Sitemap: ${urls.length} URL(s) written to sitemap.xml`);

  const generated: string[] = [sitemapPath];

  // Optionally write robots.txt
  if (options.robotsTxt !== false) {
    const robotsPath = join(resolvedDist, 'robots.txt');
    writeFileSync(robotsPath, renderRobotsTxt(hostname), 'utf-8');
    generated.push(robotsPath);
    log.info('robots.txt generated');
  }

  return generated;
}

/** Escape special XML characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

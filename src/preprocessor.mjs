/**
 * Docusaurus markdown preprocessor for W3C-PROV-style entity references.
 *
 * Transforms `[type:id]` notation in prose into clickable Markdown links
 * pointing to a central references registry, and ensures predictable heading
 * anchors inside that registry.
 *
 * Two notations are supported:
 *
 *   [agent:hackner]         — legacy / default. Renders as a clickable link
 *                             whose label keeps the bracket notation visible
 *                             (`[agent:hackner]`). Useful when the marker
 *                             itself should stay recognisable in prose.
 *
 *   [agent:hackner|Hackner] — explicit display label. Renders as a clean
 *                             Markdown link with `Hackner` as anchor text.
 *                             Use this in print/PDF-bound documents where
 *                             link styling is lost and the raw marker would
 *                             clutter the text.
 *
 * Reference architecture: https://gist.github.com/michaelstingl/d915a88fad79469796320f5bd6d34821
 *
 * Pragmatic v1 — known limitations:
 *   - Plain regex, no AST. Matches inside fenced code blocks and inline code
 *     are also rewritten. Avoid `[agent:foo]` in code samples or escape them.
 *   - No validation that the target ID exists in the registry. Docusaurus'
 *     `onBrokenLinks: warn` will flag unknown anchors after the build.
 */

const DEFAULT_TYPES = [
  'agent',
  'source',
  'doc',
  'activity',
  'tool',
  'email',
  'report',
  'entity',
];

/**
 * Build the regex matching `[type:id]` or `[type:id|Label]` while skipping
 * IDs that are already followed by a Markdown link target `(...)`.
 *
 * Capture groups:
 *   1: type (e.g. `agent`)
 *   2: id   (e.g. `hackner`)
 *   3: label (optional, anything after `|` up to `]`, no `]` allowed)
 */
function buildIdPattern(types) {
  const typeAlt = types.join('|');
  return new RegExp(
    `\\[(${typeAlt}):([a-z0-9-]+)(?:\\|([^\\]]+))?\\](?!\\()`,
    'g'
  );
}

/**
 * Build the regex matching headings of the form `### type:id` (any heading
 * level). Used to inject explicit `{#type-id}` anchors inside the registry.
 */
function buildHeadingPattern(types) {
  const typeAlt = types.join('|');
  return new RegExp(`^(#+)\\s+((?:${typeAlt}):([a-z0-9-]+))(.*)$`, 'gm');
}

/**
 * Create a Docusaurus markdown preprocessor.
 *
 * @param {object} options
 * @param {string} options.registryRoute - URL where the registry lives
 *   (e.g. `/register/`). Used as the link prefix; must end with `/`.
 * @param {string} options.registryFilePattern - Substring matched against
 *   `filePath` to detect the registry file itself (so it does not self-link).
 *   Default: `/registry/references.md`.
 * @param {string[]} [options.types] - PROV entity prefixes to recognise.
 *   Default: agent, source, doc, activity, tool, email, report, entity.
 * @returns {(args: { fileContent: string, filePath: string }) => string}
 */
export function createPreprocessor({
  registryRoute,
  registryFilePattern = '/registry/references.md',
  types = DEFAULT_TYPES,
} = {}) {
  if (!registryRoute) {
    throw new Error(
      '[docusaurus-hub-prov] createPreprocessor: registryRoute is required (e.g. "/register/")'
    );
  }
  const route = registryRoute.endsWith('/') ? registryRoute : `${registryRoute}/`;
  const idPattern = buildIdPattern(types);
  const headingPattern = buildHeadingPattern(types);

  return ({ fileContent, filePath }) => {
    const isRegistry = filePath.includes(registryFilePattern);

    if (isRegistry) {
      // Inside the registry: inject `{#type-id}` anchors on entry headings
      // so cross-document links resolve to predictable slugs. Skip headings
      // that already carry an explicit anchor.
      return fileContent.replace(headingPattern, (match, hashes, idPart, _id, rest) => {
        if (rest.includes('{#')) return match;
        const slug = idPart.replace(':', '-');
        const trimmedRest = rest.replace(/\s+$/, '');
        return `${hashes} ${idPart}${trimmedRest} {#${slug}}`;
      });
    }

    // Everywhere else: replace `[type:id]` or `[type:id|Label]` with a
    // Markdown link.
    //
    //   [agent:hackner]         → \[[agent:hackner](/register/#agent-hackner)\]
    //                              (legacy: keeps bracket notation visible)
    //   [agent:hackner|Hackner] → [Hackner](/register/#agent-hackner)
    //                              (clean link, label as anchor text — readable
    //                              in print and PDF where link styling is lost)
    return fileContent.replace(idPattern, (_match, type, id, label) => {
      const href = `${route}#${type}-${id}`;
      if (label) {
        return `[${label.trim()}](${href})`;
      }
      return `\\[[${type}:${id}](${href})\\]`;
    });
  };
}

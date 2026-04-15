/**
 * Options for the W3C-PROV link preprocessor.
 */
export interface ProvPreprocessorOptions {
  /**
   * URL where the registry lives (e.g. `/register/`). Used as the link
   * prefix for generated anchors; trailing slash is added if missing.
   */
  registryRoute: string;

  /**
   * Substring matched against `filePath` to detect the registry file
   * itself (so it does not self-link). Default: `/registry/references.md`.
   */
  registryFilePattern?: string;

  /**
   * PROV entity prefixes to recognise.
   * Default: `agent`, `source`, `doc`, `activity`, `tool`, `email`,
   * `report`, `entity`.
   */
  types?: string[];
}

/**
 * Creates a Docusaurus markdown preprocessor that:
 *
 *   - Inside the registry file: injects predictable `{#type-id}` anchors
 *     on headings of the form `#### type:id`.
 *   - Everywhere else: rewrites `[type:id]` notation into a Markdown link
 *     pointing to `<registryRoute>#<type>-<id>`, preserving the visible
 *     bracket notation by escaping the surrounding brackets.
 *
 * Already-linked references (`[type:id](url)`) are skipped via negative
 * look-ahead.
 */
export function createPreprocessor(
  options: ProvPreprocessorOptions
): (args: { fileContent: string; filePath: string }) => string;

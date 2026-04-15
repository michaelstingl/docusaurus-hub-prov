/**
 * @michaelstingl/docusaurus-hub-prov
 *
 * Docusaurus markdown preprocessor for W3C-PROV-style entity references
 * (`[agent:id]`, `[source:id]`, `[doc:id]`, ...).
 *
 * Reference architecture:
 *   https://gist.github.com/michaelstingl/d915a88fad79469796320f5bd6d34821
 */

export { createPreprocessor } from './preprocessor.mjs';

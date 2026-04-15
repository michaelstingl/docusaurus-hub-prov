# docusaurus-hub-prov

W3C-PROV link transformer for Docusaurus — turns `[agent:id]`, `[source:id]`, `[doc:id]` etc. into clickable links to a central references registry.

Reference architecture: [W3C-PROV-based Documentation Architecture](https://gist.github.com/michaelstingl/d915a88fad79469796320f5bd6d34821) (Gist).

## What it does

A project that follows the W3C-PROV docs architecture maintains a central `references.md` registering every external entity (people, organisations, sources, activities, tools). Other documents reference these entries by ID:

```markdown
The current hoster is [agent:bisping]. The applicable rule is [source:uvgo-12].
```

Out of the box, those bracketed labels render as plain text. This plugin transforms them at build time into Markdown links pointing to the registry, with the bracket notation preserved visually:

```markdown
The current hoster is \[[agent:bisping](/register/#agent-bisping)\].
```

It also injects predictable `{#type-id}` heading anchors inside the registry, so the link targets resolve cleanly without manual anchor maintenance.

## Install

```bash
bun add @michaelstingl/docusaurus-hub-prov@github:michaelstingl/docusaurus-hub-prov
```

## Quick Start

```ts
// docusaurus.config.ts
import { createPreprocessor as createProvPreprocessor }
  from '@michaelstingl/docusaurus-hub-prov';

export default async function createConfigAsync() {
  const provPreprocessor = createProvPreprocessor({
    registryRoute: '/register/',
    // optional, default '/registry/references.md':
    registryFilePattern: '/registry/references.md',
  });

  return {
    markdown: {
      preprocessor: provPreprocessor,
    },
    // ...
  };
};
```

## Chaining with other preprocessors

Docusaurus accepts a single `markdown.preprocessor` function. To combine this plugin with `@michaelstingl/docusaurus-hub-content-calc` (or any other preprocessor), wrap them in a chain:

```ts
const calc = await createAutoPreprocessor('./plugins/calc');
const prov = createProvPreprocessor({ registryRoute: '/register/' });

const preprocessor = (args) => {
  let content = args.fileContent;
  if (calc) content = calc({ ...args, fileContent: content });
  content = prov({ ...args, fileContent: content });
  return content;
};
```

## Heading convention in the registry

Entry headings inside the registry must follow the pattern `### type:id` (any heading level). The plugin injects `{#type-id}` automatically. Example:

```markdown
#### agent:hackner

- **Name:** Robert Hackner
- ...
```

After preprocessing, that heading carries the explicit anchor `{#agent-hackner}` and other documents linking to `[agent:hackner]` resolve correctly.

## Default entity types

The plugin recognises these prefixes out of the box:

```
agent, source, doc, activity, tool, email, report, entity
```

Override with the `types` option to add or restrict prefixes:

```ts
createProvPreprocessor({
  registryRoute: '/register/',
  types: ['agent', 'source', 'doc', 'dataset'],
});
```

## Known limitations (v0.1)

- **Plain regex, no AST.** The plugin runs before MDX parsing and rewrites every match, including inside fenced code blocks and inline code. To keep a literal `[agent:foo]` in a code sample, escape it (`\[agent:foo\]`) or wrap it in a heading-level construct that does not match.
- **No registry validation.** Unknown IDs produce links to non-existent anchors. Docusaurus' `onBrokenLinks: warn` will flag those after the build.
- **One registry per site.** The plugin assumes a single `registryRoute`. Multi-registry setups (e.g. one per docs instance) need separate preprocessor instances chained together.

## Why `\[…\]` and not `[…]`?

Markdown nests brackets ambiguously. `[[agent:foo](url)]` parses correctly in CommonMark but some MDX edge cases (especially around adjacent brackets in tables or admonitions) get confused. Escaping both outer brackets makes the output unambiguous: literal `[`, link `agent:foo`, literal `]`.

## License

MIT

import { PageNode, ComponentCard, CardHolder } from '../types';

/**
 * Raw imported Markdown file map powered by Vite's eager static glob.
 * Bundles all markdown files under src/content/ at compile time.
 */
const rawMarkdownFiles = import.meta.glob('/src/content/**/*.{md,markdown}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/**
 * Metadata extracted from frontmatter or top-level key-value headers.
 */
export interface PageMetadata {
  title?: string;
  version?: string;
  category?: string;
  summary?: string;
  order?: number;
}

/**
 * Resilient, forgiving frontmatter and header parser.
 * Supports:
 * 1. Standard YAML frontmatter wrapped in `---`
 * 2. Plain `key: value` lines at the very top of the file without any `---` fences
 */
export function parseForgivingHeaders(rawContent: string): { data: Record<string, any>; body: string } {
  const content = rawContent.trimStart();
  const data: Record<string, any> = {};

  // Case 1: Standard YAML frontmatter between `---` fences
  const fencedRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const fencedMatch = fencedRegex.exec(content);

  let headerBlock = '';
  let body = content;

  if (fencedMatch) {
    headerBlock = fencedMatch[1];
    body = fencedMatch[2].trim();
  } else {
    // Case 2: Unfenced key-value lines at top of file
    const lines = content.split(/\r?\n/);
    const headerLines: string[] = [];
    let splitIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Stop header collection on empty line, markdown header '#', code block '```', or Key Rule
      if (!line) {
        splitIdx = i + 1;
        break;
      }
      if (
        line.startsWith('#') ||
        line.startsWith('```') ||
        line.startsWith('>') ||
        /^(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?$/i.test(line)
      ) {
        splitIdx = i;
        break;
      }
      if (line.includes(':')) {
        headerLines.push(line);
      } else {
        splitIdx = i;
        break;
      }
    }

    if (headerLines.length > 0) {
      headerBlock = headerLines.join('\n');
      body = lines.slice(splitIdx).join('\n').trim();
    }
  }

  // Parse headerBlock into key-value pairs
  if (headerBlock) {
    const lines = headerBlock.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value: any = trimmed.slice(colonIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        } else if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        } else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        }

        data[key] = value;
      }
    }
  }

  return { data, body };
}

/**
 * Humanizes a slug (e.g., 'opencv' -> 'OpenCV', 'simd' -> 'SIMD', 'linear-algebra' -> 'Linear Algebra')
 */
export function humanizeSlug(slug: string): string {
  const acronyms: Record<string, string> = {
    opencv: 'OpenCV',
    simd: 'SIMD',
    dnn: 'DNN',
    gc: 'GC',
    jit: 'JIT',
    vm: 'VM',
    jvm: 'JVM',
    api: 'API',
    ai: 'AI',
    nn: 'NN',
    hnp: 'HNP',
    hnc: 'HNC',
    cuda: 'CUDA',
    jax: 'JAX',
    onnx: 'ONNX',
  };

  const lower = slug.toLowerCase();
  if (acronyms[lower]) return acronyms[lower];

  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Parses a swipable card markdown file (e.g. 01-hnc-sweappable.md or 01-sweappable.md).
 */
export function parseSwipableSlide(
  slideId: string,
  rawContent: string,
  deckPrefix = 'card',
  defaultTitle?: string,
  cardOrder?: number
): ComponentCard | null {
  const { data, body } = parseForgivingHeaders(rawContent);

  if (!body && Object.keys(data).length === 0) {
    return null;
  }

  // Strip prefixes like "01-hnc-", "hnc-", "01-"
  const cleanId = slideId
    .replace(/^(?:(\d+)[-_])?hnc[-_]/i, '')
    .replace(/^[0-9]+[-_]/, '');

  const title =
    data.title ||
    defaultTitle ||
    cleanId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const tag = data.tag || 'Architecture';

  // Extract Key Rule with or without markdown hashes
  let keyRule = data.keyRule || '';
  const keyRuleRegex = /(?:^|\r?\n)(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?\s*?\r?\n([\s\S]*?)(?=(?:\r?\n#{1,6}\s)|(?:\r?\n```)|$)/i;
  const keyRuleMatch = keyRuleRegex.exec(body);
  if (keyRuleMatch) {
    keyRule = keyRuleMatch[1].trim();
  }

  // Extract TypeScript code block
  let typescriptInterface = '';
  const codeBlockMatch = /```(?:typescript|ts)\r?\n([\s\S]*?)\r?\n```/i.exec(body);
  if (codeBlockMatch) {
    typescriptInterface = codeBlockMatch[1].trim();
  }

  // Extract Definition (first paragraph of prose before headers, code blocks, or Key Rule marker)
  let definition = data.definition || '';
  if (!definition) {
    const lines = body.split(/\r?\n/);
    const defLines: string[] = [];
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed) continue;
      if (
        trimmed.startsWith('#') ||
        trimmed.startsWith('```') ||
        /^(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?$/i.test(trimmed)
      ) {
        break;
      }
      defLines.push(trimmed);
    }
    definition = defLines.join(' ');
  }

  if (!definition) {
    definition = 'Modular runtime component documentation.';
  }

  if (!keyRule) {
    keyRule = 'Ensure strict type safety and verify execution invariants.';
  }

  // Fallback TypeScript interface if none provided in markdown
  if (!typescriptInterface) {
    const safeTypeName = title.replace(/[^a-zA-Z0-9]/g, '') || 'ComponentSpec';
    typescriptInterface = `interface ${safeTypeName} {\n  title: string;\n  status: 'active';\n}`;
  }

  const generatedId = `${deckPrefix.toLowerCase()}-${cleanId.toLowerCase()}`;

  return {
    id: data.id || generatedId,
    title,
    tag,
    definition,
    keyRule,
    order: cardOrder ?? (data.order !== undefined ? Number(data.order) : undefined),
    deepDive: {
      typescriptInterface,
    },
  };
}

/**
 * Represents a parsed folder segment in a path.
 */
export interface ParsedFolderSegment {
  raw: string;
  isHnp: boolean;
  order?: number;
  slug: string;
  displayTitle: string;
}

/**
 * Parses an individual directory segment, detecting HNP markers and numeric prefixes:
 * - "01-hnp-opencv" -> isHnp: true, order: 1, slug: "opencv"
 * - "01-hnp-imageprocessing" -> isHnp: true, order: 1, slug: "imageprocessing"
 * - "01-opencv" -> isHnp: false, order: 1, slug: "opencv"
 * - "opencv" -> isHnp: false, order: undefined, slug: "opencv"
 */
export function parseFolderSegment(segment: string): ParsedFolderSegment {
  // Check for HNP pattern: [XX-]hnp-[slug]
  const hnpMatch = segment.match(/^(?:(\d+)[-_])?hnp[-_](.+)$/i);
  if (hnpMatch) {
    const order = hnpMatch[1] ? parseInt(hnpMatch[1], 10) : undefined;
    const rawSlug = hnpMatch[2].trim();
    const slug = rawSlug.toLowerCase();
    const displayTitle = humanizeSlug(rawSlug);
    return { raw: segment, isHnp: true, order, slug, displayTitle };
  }

  // Check for numbered generic folder: [XX]-[slug]
  const numMatch = segment.match(/^(\d+)[-_](.+)$/);
  if (numMatch) {
    const order = parseInt(numMatch[1], 10);
    const rawSlug = numMatch[2].trim();
    const slug = rawSlug.toLowerCase();
    const displayTitle = humanizeSlug(rawSlug);
    return { raw: segment, isHnp: false, order, slug, displayTitle };
  }

  // Plain folder
  const slug = segment.toLowerCase().trim();
  return {
    raw: segment,
    isHnp: false,
    order: undefined,
    slug,
    displayTitle: humanizeSlug(segment),
  };
}

/**
 * Internal accumulator node used during file-system tree synthesis.
 */
interface NodeAccumulator {
  canonicalKey: string;
  slug: string;
  displayTitle: string;
  order?: number;
  slugSegments: string[];
  meta: PageMetadata;
  content?: string;
  cardHolderMap: Map<string, { id: string; order: number; cards: ComponentCard[] }>;
  cards: ComponentCard[];
  childKeys: Set<string>;
}

/**
 * Consistent sorting comparator: orders primarily by ascending `order` property,
 * falling back to natural alphanumeric sort by title.
 */
export function comparePageNodes(a: PageNode, b: PageNode): number {
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

export function compareCards(a: ComponentCard, b: ComponentCard): number {
  const folderA = a.folderOrder ?? 1;
  const folderB = b.folderOrder ?? 1;
  if (folderA !== folderB) {
    return folderA - folderB;
  }
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

/**
 * Builds the complete recursive PageNode tree from all files in src/content/.
 */
function buildTreeFromFileSystem(): PageNode[] {
  const nodeMap = new Map<string, NodeAccumulator>();

  const getOrCreateNode = (
    slugSegments: string[],
    preferredTitle?: string,
    defaultOrder?: number
  ): NodeAccumulator => {
    const canonicalKey = slugSegments.join('/');
    if (!nodeMap.has(canonicalKey)) {
      const lastSlug = slugSegments[slugSegments.length - 1] || 'root';
      const displayTitle = preferredTitle || humanizeSlug(lastSlug);

      nodeMap.set(canonicalKey, {
        canonicalKey,
        slug: lastSlug,
        displayTitle,
        order: defaultOrder,
        slugSegments: [...slugSegments],
        meta: {},
        cardHolderMap: new Map(),
        cards: [],
        childKeys: new Set(),
      });
    } else {
      const existing = nodeMap.get(canonicalKey)!;
      if (preferredTitle && !existing.meta.title) {
        existing.displayTitle = preferredTitle;
      }
      if (defaultOrder !== undefined && existing.order === undefined) {
        existing.order = defaultOrder;
      }
    }
    return nodeMap.get(canonicalKey)!;
  };

  const registerHierarchy = (
    parsedSegments: ParsedFolderSegment[]
  ): NodeAccumulator | null => {
    if (parsedSegments.length === 0) return null;

    let parentKey = '';
    const currentSlugSegments: string[] = [];

    for (let i = 0; i < parsedSegments.length; i++) {
      const seg = parsedSegments[i];
      currentSlugSegments.push(seg.slug);
      const currentKey = currentSlugSegments.join('/');

      const node = getOrCreateNode(currentSlugSegments, seg.displayTitle, seg.order);

      if (parentKey && nodeMap.has(parentKey)) {
        nodeMap.get(parentKey)!.childKeys.add(currentKey);
      }
      parentKey = currentKey;
    }

    return nodeMap.get(parentKey) || null;
  };

  // 1. Process all raw markdown files from Vite's static glob
  for (const [fullPath, rawContent] of Object.entries(rawMarkdownFiles)) {
    const relative = fullPath.replace(/^\/src\/content\//, '');
    const parts = relative.split('/');
    const filename = parts.pop()!;
    const cleanFilename = filename.replace(/\.(md|markdown)$/i, '');
    const rawFolderParts = [...parts];

    // Check if the immediate parent folder is "root" (e.g. "01-hnp-opencv/root/index.md")
    const isRootMetadataFolder =
      rawFolderParts.length > 0 &&
      rawFolderParts[rawFolderParts.length - 1].toLowerCase() === 'root';

    const effectivePageFolders = isRootMetadataFolder
      ? rawFolderParts.slice(0, rawFolderParts.length - 1)
      : rawFolderParts;

    // Check if inside a dedicated card folder (e.g. "01-hnc", "02-hnc", "01-card", "card")
    const lastEffectiveFolder =
      effectivePageFolders.length > 0
        ? effectivePageFolders[effectivePageFolders.length - 1]
        : '';
    const isInsideCardFolder =
      !isRootMetadataFolder &&
      (/^[0-9]+[-_]hnc$/i.test(lastEffectiveFolder) ||
        /^[0-9]+[-_]hnc[-_]/i.test(lastEffectiveFolder) ||
        lastEffectiveFolder.toLowerCase() === 'hnc' ||
        lastEffectiveFolder.toLowerCase().endsWith('-hnc') ||
        /^[0-9]+[-_]card$/i.test(lastEffectiveFolder) ||
        lastEffectiveFolder.toLowerCase() === 'card' ||
        lastEffectiveFolder.toLowerCase().endsWith('-card'));

    const targetPageFolders = isInsideCardFolder
      ? effectivePageFolders.slice(0, effectivePageFolders.length - 1)
      : effectivePageFolders;

    const parsedPageSegments = targetPageFolders.map(parseFolderSegment);
    const targetNode =
      parsedPageSegments.length > 0 ? registerHierarchy(parsedPageSegments) : null;

    // Extract card folder order if inside card folder (e.g. "01-hnc" -> 1, "02-hnc" -> 2)
    const folderOrderMatch = isInsideCardFolder
      ? lastEffectiveFolder.match(/^(\d+)[-_]/)
      : null;
    const folderOrder = folderOrderMatch ? parseInt(folderOrderMatch[1], 10) : 1;
    const holderKey = isInsideCardFolder ? lastEffectiveFolder.toLowerCase() : 'default';

    const getOrCreateCardHolder = (holderId: string, order: number) => {
      if (!targetNode!.cardHolderMap.has(holderKey)) {
        targetNode!.cardHolderMap.set(holderKey, {
          id: holderId,
          order,
          cards: [],
        });
      }
      return targetNode!.cardHolderMap.get(holderKey)!;
    };

    // A. Check for Horizontal Nested Card (HNC): e.g. "01-hnc-sweappable.md", "02-hnc-filters.md"
    const hncMatch = cleanFilename.match(/^(?:(\d+)[-_])?hnc[-_](.+)$/i);
    if (hncMatch && targetNode) {
      const fileOrder = hncMatch[1] ? parseInt(hncMatch[1], 10) : undefined;
      const cardSlug = hncMatch[2];
      const card = parseSwipableSlide(
        cardSlug,
        rawContent,
        targetNode.slug,
        undefined,
        fileOrder
      );
      if (card) {
        card.folderOrder = isInsideCardFolder ? folderOrder : 1;
        const holder = getOrCreateCardHolder(isInsideCardFolder ? lastEffectiveFolder : '01-hnc', folderOrder);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // B. Check for Slide inside a dedicated card folder (e.g. "01-card/01-sweappable.md" or "01-hnc/01-sweappable.md")
    if (isInsideCardFolder && targetNode) {
      const cardOrderMatch = cleanFilename.match(/^(\d+)[-_]/);
      const fileOrder = cardOrderMatch ? parseInt(cardOrderMatch[1], 10) : undefined;
      const card = parseSwipableSlide(
        cleanFilename,
        rawContent,
        lastEffectiveFolder,
        undefined,
        fileOrder
      );
      if (card) {
        card.folderOrder = folderOrder;
        const holder = getOrCreateCardHolder(lastEffectiveFolder, folderOrder);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // C. Check if this file is a page metadata index file:
    // e.g. "root/index.md", "index.md", "01-index.md", or cleanFilename matches parent directory name
    const indexMatch = cleanFilename.match(/^(?:(\d+)[-_])?index$/i);
    const isNamedAfterParent =
      targetPageFolders.length > 0 &&
      cleanFilename.toLowerCase() ===
        targetPageFolders[targetPageFolders.length - 1].toLowerCase();

    if ((indexMatch || isRootMetadataFolder || isNamedAfterParent) && targetNode) {
      const { data, body } = parseForgivingHeaders(rawContent);
      targetNode.meta = { ...targetNode.meta, ...data };
      targetNode.content = body;

      // Extract first paragraph for summary if not explicitly defined
      if (!targetNode.meta.summary && body) {
        const firstPara = body
          .split(/\r?\n\r?\n/)[0]
          ?.replace(/^#+\s.*$/gm, '')
          ?.trim();
        if (firstPara && !firstPara.startsWith('```')) {
          targetNode.meta.summary = firstPara;
        }
      }

      if (indexMatch && indexMatch[1]) {
        targetNode.order = parseInt(indexMatch[1], 10);
      } else if (data.order !== undefined) {
        targetNode.order = Number(data.order);
      }
      continue;
    }

    // D. Check for flat numbered card file inside page folder (e.g. "01-cyclic-gc.md")
    const flatCardMatch = cleanFilename.match(/^(\d+)[-_](.+)$/);
    if (flatCardMatch && targetNode) {
      const cardOrder = parseInt(flatCardMatch[1], 10);
      const card = parseSwipableSlide(
        cleanFilename,
        rawContent,
        targetNode.slug,
        undefined,
        cardOrder
      );
      if (card) {
        const holder = getOrCreateCardHolder('01-hnc', 1);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // E. Sub-page defined as a standalone markdown file (legacy backwards-compatibility)
    const subPageSeg = parseFolderSegment(cleanFilename);
    const fullSubPageSegments = [...parsedPageSegments, subPageSeg];
    const subPageNode = registerHierarchy(fullSubPageSegments);
    if (subPageNode) {
      const { data, body } = parseForgivingHeaders(rawContent);
      subPageNode.meta = { ...subPageNode.meta, ...data };
      subPageNode.content = body;
      if (data.order !== undefined) {
        subPageNode.order = Number(data.order);
      }
    }
  }

  // 2. Recursively assemble the final PageNode tree
  const buildSubTree = (canonicalKey: string): PageNode => {
    const nodeAcc = nodeMap.get(canonicalKey)!;
    const slug = nodeAcc.slug;
    const meta = nodeAcc.meta;
    const urlPath = `/${nodeAcc.slugSegments.join('/')}`;

    // Assemble card holders sorted by their folder order (01-hnc, 02-hnc, etc.)
    const cardHolders: CardHolder[] = Array.from(nodeAcc.cardHolderMap.values())
      .map((holder) => ({
        id: holder.id,
        order: holder.order,
        cards: [...holder.cards].sort(compareCards),
      }))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, undefined, { numeric: true }));

    const sortedCards = cardHolders.flatMap((h) => h.cards);

    // Recursively build child nodes and sort them deterministically
    const children: PageNode[] = Array.from(nodeAcc.childKeys)
      .map(buildSubTree)
      .sort(comparePageNodes);

    return {
      id: canonicalKey,
      slug,
      urlPath,
      title: meta.title || humanizeSlug(nodeAcc.displayTitle || slug),
      order: nodeAcc.order ?? meta.order,
      version: meta.version,
      category: meta.category,
      summary: meta.summary,
      content: nodeAcc.content,
      cardHolders,
      cards: sortedCards,
      children,
    };
  };

  // Find root-level nodes (slugSegments.length === 1)
  const rootKeys = Array.from(nodeMap.keys()).filter((key) => {
    const acc = nodeMap.get(key)!;
    return acc.slugSegments.length === 1;
  });

  const rootNodes = rootKeys.map(buildSubTree).sort(comparePageNodes);
  return rootNodes;
}

// Generate tree statically at bundle time
export const FILE_SYSTEM_TREE: PageNode[] = buildTreeFromFileSystem();

/**
 * Returns the dynamically scanned page registry.
 */
export function getContentRegistry(): PageNode[] {
  return FILE_SYSTEM_TREE;
}

/**
 * Alias for getContentRegistry for API symmetry with documentation.
 */
export const getRootPages = getContentRegistry;

/**
 * Result structure when resolving a path against the file-system page tree.
 */
export interface ResolvedPathResult {
  node: PageNode;
  breadcrumbs: { label: string; path: string }[];
  currentPath: string;
}

/**
 * Recursively resolves URL path segments against the file-system generated tree.
 * Fully case-insensitive segment resolution.
 */
export function resolvePathNode(
  pathSegments: string[],
  nodes: PageNode[] = FILE_SYSTEM_TREE,
  parentPath = '',
  parentCrumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }]
): ResolvedPathResult | null {
  const sanitizedSegments = pathSegments.filter((seg) => Boolean(seg && seg.trim()));
  if (sanitizedSegments.length === 0) {
    return null;
  }

  const [currentSegment, ...remainingSegments] = sanitizedSegments;
  const currentLower = currentSegment.toLowerCase().trim();
  const matchedNode = nodes.find((n) => n.slug.toLowerCase() === currentLower);

  if (!matchedNode) {
    return null;
  }

  const currentPath = `${parentPath}/${matchedNode.slug}`;
  const breadcrumbs = [...parentCrumbs, { label: matchedNode.title, path: currentPath }];

  if (remainingSegments.length === 0) {
    return {
      node: matchedNode,
      breadcrumbs,
      currentPath: matchedNode.urlPath || currentPath,
    };
  }

  if (matchedNode.children && matchedNode.children.length > 0) {
    return resolvePathNode(remainingSegments, matchedNode.children, currentPath, breadcrumbs);
  }

  return null;
}

/**
 * Convenience method to resolve any full URL pathname directly in O(1) time.
 * @param path - URL pathname (e.g. "/opencv/imageprocessing")
 */
export function getPageByPath(path: string): ResolvedPathResult | null {
  const segments = path.split('/').filter(Boolean);
  return resolvePathNode(segments);
}

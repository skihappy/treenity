import { intersection, difference } from 'lodash';

export const matchBestContext = (contexts: string[], matchTags: string): string | undefined => {
  const matchTagsArr = matchTags.split(' ').filter(Boolean);

  const exclude = new Set<string>();
  const include = new Set<string>();
  const optional = new Set<string>();
  /*
   * we count tags one by one, later added contexts will have precedence
   * context tags could have prefixes:
   * ! - we cant ignore this tag when copying, like + but will remain on context merge
   * + - we have to match this tag
   * - - we have not to match this tag
   * ? - we optionally could match this, more optionals - the more points to this context match
   * without prefix tag will match to replace all tags in parent context except "!" ones.
   * so, we could have context string like: "!react table +cell ?edit"
   */
  matchTagsArr.forEach((tag) => {
    const type = tag[0];
    const ctag = tag.slice(1);
    if ('!+?'.includes(type)) {
      exclude.delete(ctag);
      (type === '?' ? optional : include).add(ctag);
    } else if (type === '-') {
      include.delete(ctag);
      optional.delete(ctag);
      exclude.add(ctag);
    } else {
      include.add(tag);
      exclude.delete(tag);
    }
  });

  // tags we want to see, and will count on
  const cleanTags = new Set([...include, ...optional]);
  const includeArray = [...include];

  const good = contexts
    .map((context) => {
      const tags = context.split(' ');
      if (includeArray.every((t) => tags.includes(t)) && !tags.some((tag) => exclude.has(tag))) {
        return {
          context,
          tags,
          tlen: tags.length,
          ilen: tags.filter((tag) => cleanTags.has(tag)).length,
        };
      }
      return undefined;
    })
    .filter(Boolean);
  good.sort((a, b) => b!.ilen - a!.ilen || a!.tlen - b!.tlen);

  const found = good[0];

  return found?.context;
};

// export function getBestMatchComponent(types, context) {
//   const mapped = types.map((t, i) => ({ ...getComponentInfo(t, context), i }));
//   return maxBy(mapped, o => o.context && o.context.length);
// }

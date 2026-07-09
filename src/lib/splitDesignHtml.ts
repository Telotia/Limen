// Splits a site/*.html page's extracted <body> content around its NAV and
// FOOTER blocks, so the page can render <Nav/>/<Footer/> components in their
// exact original DOM position while everything else stays a raw HTML dump,
// unchanged. Used by every page in src/pages/ that still shims site/*.html.
export function splitDesignHtml(designHtml: string) {
  const navMatch = designHtml.match(/<!-- NAV -->[\s\S]*?<\/nav>/);
  const footerMatch = designHtml.match(/<!-- FOOTER -->[\s\S]*?<\/footer>/);
  if (!navMatch) throw new Error('splitDesignHtml: <!-- NAV --> block not found');
  if (!footerMatch) throw new Error('splitDesignHtml: <!-- FOOTER --> block not found');

  const navStart = designHtml.indexOf(navMatch[0]);
  const navEnd = navStart + navMatch[0].length;
  const footerStart = designHtml.indexOf(footerMatch[0]);
  const footerEnd = footerStart + footerMatch[0].length;

  return {
    beforeNav: designHtml.slice(0, navStart),
    betweenNavAndFooter: designHtml.slice(navEnd, footerStart),
    afterFooter: designHtml.slice(footerEnd),
  };
}

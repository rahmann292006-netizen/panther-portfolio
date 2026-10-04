// Everything search engines and AI answer engines read about the site lives
// here: titles, descriptions, the share image, and the structured data that
// says who Abdul Rahman is. None of it changes what's on screen.

// Set VITE_SITE_URL to the final deployed origin before release. This checkout
// has no confirmed Abdul-owned domain or profile image, so don't publish the
// previous owner's canonical URL or social card.
export const SITE_URL = import.meta.env["VITE_SITE_URL"]?.replace(/\/$/, "");
export const OG_IMAGE = SITE_URL ? `${SITE_URL}/favicon.png` : undefined;

export const NAME = "Abdul Rahman";
export const ABOUT_SHORT =
  "Abdul Rahman (Panther) is a CSE student from Raichur, India, building AI agents, GenAI products, and experimental software. AI Engineer / GenAI Builder.";

export const PROFILES = [
  "https://www.linkedin.com/in/abdul-rahman-75366b343/",
  "https://github.com/rahmann292006-netizen",
  "https://x.com/rahman_aibuilds",
];

export const person = {
  "@type": "Person",
  "@id": SITE_URL ? `${SITE_URL}/#person` : "#person",
  name: NAME,
  alternateName: ["Abdul Rahman", "Panther"],
  ...(SITE_URL ? { url: SITE_URL } : {}),
  ...(OG_IMAGE ? { image: OG_IMAGE } : {}),
  email: "mailto:rahmann292006@gmail.com",
  jobTitle: "AI Engineer / GenAI Builder",
  description: ABOUT_SHORT,
  worksFor: { "@type": "Organization", name: "Student", description: "CSE Student" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "CSE Student" },
  address: { "@type": "PostalAddress", addressLocality: "Raichur", addressCountry: "IN" },
  knowsAbout: [
    "AI agents",
    "GenAI",
    "LLMs",
    "Agentic AI",
    "Full-stack development",
    "AI products",
    "Experiments",
    "Automation",
    "Open source",
  ],
  sameAs: PROFILES,
};

// Turn a JSON-LD object into a <script> entry for a route's head.
export const jsonLd = (data: Record<string, unknown>) => ({
  type: "application/ld+json",
  children: JSON.stringify({ "@context": "https://schema.org", ...data }),
});

// The standard set of tags for a page: title, description, canonical address
// and the share card.
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const url = SITE_URL ? `${SITE_URL}${path}` : undefined;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(url ? [{ property: "og:url", content: url }] : []),
      ...(OG_IMAGE ? [
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:alt", content: "Abdul Rahman (Panther)" },
        { name: "twitter:image", content: OG_IMAGE },
      ] : []),
    ],
    links: url ? [{ rel: "canonical", href: url }] : [],
  };
}

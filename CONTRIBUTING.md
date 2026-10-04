# Contributing

Thanks for stopping by. This is my personal portfolio, so it isn't a typical open-source project, but there are still good ways to get involved.

## Make your own version

The best way to use this repo is to fork it and turn it into **yours**.

1. Fork the repo and clone it.
2. Install and run it:
   ```sh
   bun install   # or npm install
   bun run dev   # or npm run dev
   ```
3. Adapt the story, photos and projects in `src/routes/index.tsx`; SEO details live in `src/lib/seo.ts`.
4. Change the thread, the objects and the colours until it feels like you.

The code is MIT-licensed, so you're free to build on it. My photos, story, name and project screenshots aren't part of that license, so please replace them (see `LICENSE`). A link back to this repo is always appreciated.

When it's live, open an issue with the "Show your version" template.

## Report a bug

Something broken, slow, or weird on a particular device or browser? Open an issue with the "Bug report" template and include:

- what you expected and what happened
- your browser, device and screen size
- a screenshot or screen recording if you can

## Suggest an improvement

Ideas for accessibility, performance, or making the code easier to adapt are very welcome. Open an issue first so we can talk it through, then send a pull request:

1. Create a branch from `main`.
2. Keep the change focused on one thing.
3. Run `bun run build` (or `npm run build`) to make sure it still builds.
4. Describe what you changed and why, with a screenshot for anything visual.

Changes to the story, copy or design of this portfolio should be discussed in an issue first.

## Be kind

Be respectful and constructive. That's it.

# React

Read this when the project uses React: the package manifest nearest the files you change lists `react`, or, with no manifest, component files import from `react`. Files ending in `.jsx` or `.tsx` are not enough: other frameworks use them. Sources read on 2026-11-17.

**The version decides which rules apply.** Read it from that manifest. A rule marked "React 19" or "React 18 and later" uses something that came with that version: on an older version, or when the version is unknown, leave it out and say so in the report line `React rules applied:`. Before you use an API you are not sure the installed version has, check that the installed package exports it. Every rule here assumes React 16.8 or later, the first version with hooks: on an older one apply none of this part and say so. The section "Only with Next.js" applies only when the manifest lists `next`.

Follow the project's own patterns first: its state library, its data fetching, its component conventions. These rules fill the gaps.

## Component structure

- **Compose, do not switch.** A component that grows boolean props to change what it is (`isEditing`, `isCompact`, `withFooter`) becomes a tangle of conditions. Build the variants from smaller parts, and give each real variant its own named component.
- **Compound components for complex widgets.** A menu, a tab set or a form field group is a set of parts that share state through a context: the caller arranges the parts, and the parts read what they need. This beats one component with a prop for every piece.
- **Children before render props.** Pass content as `children` where you can. A function prop that returns markup is for the case where the child needs data from the parent.
- **One place knows how state is kept.** A provider owns the state and how it is stored. The parts below it use an interface of state and actions, so the storage can change without touching them.
- **Lift state into that provider** when siblings need it, instead of threading it through props or syncing two copies.
- **Never define a component inside another component.** It is a new component type on every render, so React throws the old one away: fields lose focus on every key, animations restart, state is lost. Define it outside and pass props.
- **React 19:** `ref` is an ordinary prop, so a new component needs no `forwardRef`. Read a context with `use()` where that fits the project's style.

## Rendering

- **Compute, do not store.** A value that follows from props or state is computed during render. Do not keep it in state and update it in an effect: that renders twice and the two can drift apart.
- **What a user did belongs in the event handler.** Run the consequence of a click or a submit in its handler, not in an effect that watches a state the handler set.
- **A ternary where a value can be 0.** `count && <Badge />` prints a 0 when the count is zero. Write `count > 0 ? <Badge /> : null`.
- **State for what the screen shows, a ref for the rest.** A value that changes often and is not shown, such as a pointer position during a drag or a timer handle, lives in a ref. Never set state on every animation frame: write the style to the element.
- **Update from the previous value** with the function form of the setter when the new state depends on the old one, so a stale value cannot slip in.
- **An expensive first value** goes to `useState` as a function, so it runs once and not on every render.
- **React 18 and later: keep typing fast.** When a field drives an expensive list or chart, mark that update as not urgent (`useTransition`, `useDeferredValue`), so the field answers at once and the heavy part follows.
- **Do not memoize by reflex.** Wrapping a cheap expression in `useMemo` costs more than it saves. Memoize after you saw a slow render, and then give a memoized component stable props: a default `[]` or `{}` written in the parameter list is a new value on every render.
- **Long lists:** `performance.md`. In React the same choices apply: pages, a list that renders only visible rows, or `content-visibility: auto` on the rows.
- **Animate a wrapper, not the SVG.** Put the SVG in an element and animate that element: many browsers do not hand SVG animation to the graphics hardware.
- **Text that differs between server and browser** (a date, a locale format, a value from local storage) needs care in a server-rendered app, or the page flickers or warns after loading. Render it the same on both sides, or mark the one element whose difference is expected.

## Loading

- **Start independent requests together.** Two requests that do not depend on each other are started at once and awaited together, not one after the other. Waiting in sequence is the most expensive mistake in this list.
- **Wait as late as possible.** Do not await something before a branch that may not need it.
- **Show the frame first.** Let the rest of the screen show at once while one part waits for data, with a placeholder in the shape of the content. A `Suspense` boundary does this only for a data source built for it (the framework's own loading, a library that supports it, a lazily loaded component). A fetch started in an effect or an event handler does not trigger it: there, keep an explicit loading state.
- **Import from the module, not from the package's index,** when a package's entry file re-exports everything. Icon and component libraries can cost hundreds of milliseconds through such an entry file. Check that the direct path has types before you use it, and prefer the build tool's own option for this when it has one.
- **Load a heavy component when it is needed:** an editor, a chart, a map loads when its view opens, with a fallback meanwhile. Start loading it when the user shows intent, such as hovering its button.
- **Third-party scripts that are not needed to use the page** (analytics, error tracking) load after the page works.
- **React 19:** `react-dom` can tell the browser early about a resource it will need (`preconnect`, `preload`). Use it for the font or the image of the first screen.

## Only with Next.js

- Load a heavy client component with `next/dynamic`, so it stays out of the first bundle.
- Use the framework's package-import optimization for libraries with a large entry file, instead of deep import paths.
- In server code, start independent work at once and await it where it is used, so one slow call does not hold up the rest.
- For `theme-color` and the viewport, use the way the project already uses. The `viewport` export exists only in newer versions and only in the App Router, in server layout and page files: use it there when the project does, and nowhere else.

## What this part does not cover

Data fetching libraries, routing, forms libraries, state libraries and testing are the project's own choices. Animation of page changes with React's view transitions needs a recent React and is left out here: use it only when the project already does.

## In the report

Name the rules you applied in one line, and the ones you left out because of the version, for example: "React rules applied: composition over boolean props, derived state computed in render, ternary for the count. Left out: ref as a prop (React 18 installed)."

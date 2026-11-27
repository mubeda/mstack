# Which component

Read this when the work adds or changes a component that shows and hides content, lies over the page, lets the user choose, reports something or moves the user around. It says which one fits the job, and what each must carry so that a keyboard and a screen reader can use it.

The duty itself is in `floor.md`: every control works with the keys of its kind, has a name and says its state. This part gives the detail per component, in its common form: a variant (a select-only combobox, an accordion in which one panel stays open, a carousel built as tabs, a list picked with modifier keys) follows W3C's pattern for that variant and is not a fault. Durations and curves are in `motion.md`.

## The order of preference

1. **The project's own component.** When the project has a dialog, a select or tabs, use them, also where a rule below would choose differently.
2. **The element the browser already has.** It brings its keys and its screen-reader behavior with it:
   - `<details>` with `<summary>` for a simple show and hide. Several that share a `name` open one at a time.
   - `<dialog>` opened with `showModal()` for a modal: the page behind it cannot be used, and Escape closes it unless the page prevents that. Add `closedby="any"` when light dismiss on outside click is desired (with a backdrop click listener fallback where unsupported). Opened with `show()` it is not modal.
   - `<select>` (enhanced with `appearance: base-select` when rich option markup is needed, falling back cleanly to the native picker), and native checkboxes, `<input type="checkbox" switch>` (with checkbox/`role="switch"` fallback) and radio buttons styled with `accent-color`, for a plain choice.
   - The `popover` attribute: pair `popover="auto"` or `popover="manual"` (and `<dialog>`) with declarative Invoker commands (`commandfor` and `command`, with a click listener fallback where unsupported) for activation-triggered overlays without boilerplate script; pair `popover="hint"` hover/focus previews with `interestfor` (with a hover/focus/Escape fallback where unsupported, keeping explicit click/tap activation when the control also needs it).
   - When reordering live DOM elements that hold state (media, iframes, focus, animations), prefer `parent.moveBefore(node, ref)` with feature detection (`'moveBefore' in Element.prototype`). Where live state must survive (such as an iframe with unsaved form input), keep the element mounted or defer/avoid the move on unsupported browsers; fall back to `insertBefore` only when resetting state is acceptable or the app restores it.
3. **A hand-built one**, only when it keeps the keyboard and screen-reader behavior of the native one. The entries below say what that is.

## Where a rule of choice comes from

W3C's patterns describe each component, and for most pairs they do not say which to prefer. Where W3C does state a rule, the entry says "W3C:", and that rule holds in every project. Every other "use X when" in this part is a default of this skill, with its reason, and the project's own pattern wins over it. W3C's guide covers these components where it has a pattern. It has none for a drawer, pagination, a popover as such or a status message: those entries are this skill's, built on the elements and roles they name.

## Show and hide

Rules of choice here are defaults of this skill.

- **Disclosure.** One button that shows or hides one piece of content. The button carries `aria-expanded`; Enter and Space toggle it. Use `<details>` when you can. It is the base of an accordion and of a navigation drop-down.
- **Accordion.** Several disclosures in a stack, each header a button inside a heading, with `aria-expanded` and with `aria-controls` that names its panel; Enter and Space toggle, Tab moves on. Prefer it to tabs when there are many sections, when their labels are long, or when a reader may want two open at once: an accordion grows downward, and a row of tabs does not fit on a phone.
- **Tabs.** A few views of equal rank, one shown at a time. Roles `tablist`, `tab` and `tabpanel`; the active tab has `aria-selected="true"`, each tab names its panel with `aria-controls`, and each panel is named by its tab with `aria-labelledby`. Tab enters and leaves the list, the arrow keys move between tabs, and where a tab does not open as soon as it has the focus, Enter or Space opens it. Prefer an accordion beyond about five tabs or on a narrow screen. Tabs that load another page are navigation links, not tabs.

## Over the page

Rules of choice here are defaults of this skill, except where W3C is named.

- **Dialog.** A task the user must finish or cancel before going on. `<dialog>` with `showModal()`, or `role="dialog"` with `aria-modal="true"`, and a name from its heading. The focus moves in when it opens and stays inside, and Escape closes it. Do not use one for something the user only needs to read: that is a message in the page.
- **Alert dialog.** A dialog that interrupts with a message and needs an answer, such as a confirmation before something is lost or a session about to end. `role="alertdialog"`, a name, on the dialog itself `aria-describedby` that points at the message, and `aria-modal="true"` when it is not a native `<dialog>` opened with `showModal()`. W3C: this is the pattern for a message that must interrupt the work. Because it takes the focus, it is the right one whenever the user must answer.
- **Popover.** A small overlay tied to the control that opened it, which the user may ignore: a color picker, a few options, a short form that is not required. The `popover` attribute, or a button with `aria-expanded`. Not modal. When the user must deal with the content first, it is a dialog.
- **Tooltip.** A short text that describes a control, shown on hover and on focus, closed with Escape. Role `tooltip`, tied to the control with `aria-describedby`. It is a description and not the control's name: a button that shows only an icon still needs its name (`floor.md`). It never holds a link or a button, because it cannot be reached; that content belongs in a popover. Its delay is in `motion.md`.
- **Drawer.** A dialog that comes from an edge of the screen. Everything of the dialog entry holds. Use it for a task beside the page that keeps the page in view (filters, details of a row); on a phone it is a sheet from the bottom.

## Choosing

Rules of choice here are defaults of this skill, except where W3C is named.

- **Radio group.** One of a few options, all visible. `radiogroup` with a name, `radio` and `aria-checked`; the arrow keys move and check, Space checks the one in focus, Tab enters and leaves. Inside a toolbar the arrow keys only move, and Space checks. Prefer it up to about five options: the user sees them without opening anything.
- **Checkbox.** Any number of options, or one yes or no that takes effect when a form is sent. Role `checkbox` with `aria-checked`, which may be `mixed` for a parent of several; Space toggles. A group has a name.
- **Switch.** One setting that is on or off and takes effect at once. Role `switch` with `aria-checked`; Space toggles. When the change waits for a Save button, use a checkbox, so the user is not told something happened that has not.
- **Select.** One of many options that need no search. The native `<select>`. Prefer it from about six options, or where space is short.
- **Combobox.** A text field with a list of suggestions or options to filter; this entry describes that kind, with a list as its popup. Role `combobox` with `aria-expanded` and `aria-controls`, and `aria-activedescendant` that names the one option the keys are on, while the focus stays in the field; the Down key opens or enters the list, Enter accepts, Escape closes without changing the value. Use it when the list is long enough to search, or when the user may type a value of their own.
- **Listbox.** A visible list to pick one or several items from. Roles `listbox` and `option`, selection in `aria-selected`, and `aria-multiselectable="true"` when several can be picked; the arrow keys move, Space selects. W3C: a listbox gives no accessible way to hold links, buttons or checkboxes, so a list of those is not a listbox.
- **Slider.** A value in a range where the exact number matters little, such as a volume. The native `<input type="range">`, or role `slider` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`; the arrow keys change it by one step, Home and End go to the ends. When the number matters, give a number field as well or instead.

## Telling the user something

- **Alert.** An important message that appears without a request and that the user need not answer: an error after a save, a lost connection. Role `alert`, which a screen reader announces at once. It never takes the focus. W3C: when the message must interrupt and be answered, it is an alert dialog.
- **Status message.** A quiet confirmation, also when it is shown as a toast: "Saved", a new count. How it is announced is in `floor.md`, names and structure. A default of this skill: never put the only way to an action in one, because it disappears and the focus never reaches it; a message with an Undo also offers that action somewhere that stays.

## Moving around

Rules of choice here are defaults of this skill, except where W3C is named.

- **Navigation links.** The links of a site or an app, in a `<nav>` with a name when the page has more than one. A drop-down in it is a disclosure: a button with `aria-expanded` that shows a list of links. W3C recommends this for ordinary site navigation, also with drop-downs: disclosures and no `menu` role, because that role promises keys and behavior such navigation does not need.
- **Menu.** A list of actions, as in a desktop application: Copy, Rename, Delete. Role `menu` with `menuitem` (or `menuitemcheckbox`, `menuitemradio`), opened by a button with `aria-haspopup` and `aria-expanded`; the arrow keys move, Enter activates, Escape closes. Use it for actions. A menu that holds links is possible, and then it must behave as a menu in every key; for site navigation the entry above is the simpler and safer choice.
- **Breadcrumb.** The path from the top of the site to this page, as links, in a `<nav>` with a name; the current page has `aria-current="page"`. Use it when pages lie more than two levels deep: on a shallower site the navigation already shows where the user is.
- **Pagination.** Links to the pages of a long list, in a `<nav>` with a name; the current one has `aria-current="page"`. Each page has its own address, so it can be shared and the Back button works. Prefer it to endless loading when users look for one item or need the footer.
- **Carousel.** Several slides in one place, one in view. A region or group with a name, slides that are groups with names, and buttons for the previous and the next one. One that turns by itself is moving content: `floor.md`, images and media, applies. It also stops when the keyboard focus enters it and starts again only when the user asks, and it stops while the pointer is over it. Prefer a plain row or grid when all items matter, because most users see only the first slide.
- **Tree view.** A hierarchy the user opens and closes, such as folders. Roles `tree`, `treeitem` and `group`, with `aria-expanded` on a parent; Up and Down move, Right opens or enters, Left closes or leaves, Home and End go to the first and the last item, Enter activates the item in focus. It is costly to build right and unfamiliar on the web: for site navigation, nested lists with disclosures do the job.

## Web Components

Default to the project's framework components or native HTML elements before authoring a custom element. Use a custom element when a widget must work across frameworks or inside static HTML islands:

- Give every custom element a kebab-case tag name containing a hyphen, call `super()` first in its constructor before reading or writing `this`, and hide unupgraded content safely with `:defined` where needed.
- Use `attachShadow({ mode: 'open' })` (or Declarative Shadow DOM `shadowrootmode="open"` for SSR without FOUC), keep semantic HTML inside shadow templates, expose styling hooks with CSS custom properties and `::part()`/`exportparts`, and use `ElementInternals` for form-associated custom elements and default ARIA roles.

## In a review

A component that lacks the roles or keys of its kind is a floor finding. One that works but is the wrong one for its job (a toast that holds the only Undo, tabs for twelve sections, a menu role on site navigation that lacks the keys of a menu) is a finding under states and real content. Name the component that fits and the reason.

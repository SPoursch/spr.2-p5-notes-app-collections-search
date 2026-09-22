/**
 * Static content for the workspace help panel.
 *
 * Plain data, deliberately: no table, no query, no fetch. The guide describes
 * the interface, so it changes when the interface changes — in this file, in
 * the same commit — rather than living somewhere a code change cannot reach.
 *
 * Every answer here was checked against the component it describes. Two rules
 * were applied while writing it:
 *
 * 1. Nothing is promised that the interface does not do. There is no rename or
 *    delete for a collection or a tag, so this file says so rather than
 *    describing a control that is not there.
 * 2. The moments that look like faults get their own entry — the sidebar tree
 *    ignoring the filters, and the notice left behind after a delete. Both are
 *    intended behaviour, and someone who has just hit one is exactly the
 *    person who opens this panel.
 */

/** One question and its answer. Answers stay to a sentence or three. */
export type HelpEntry = {
  q: string
  a: string
}

/** One collapsible group in the panel. */
export type HelpSection = {
  /** Stable key, also used to build the disclosure's element ids. */
  id: string
  heading: string
  entries: HelpEntry[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    heading: 'Getting started',
    entries: [
      {
        q: 'What is NoteSpace for?',
        a: 'Writing notes and keeping them in order. Notes can be grouped into collections, labelled with tags, and found again with search.',
      },
      {
        q: 'What are the three panes?',
        a: 'Left: your collections and the tag filter. Middle: the notes currently in view, with search at the top and New note at the foot. Right: the note you have open.',
      },
      {
        q: 'How do notes, collections and tags fit together?',
        a: 'A note sits in one collection, or in none. A note can carry any number of tags, and the same tag can be on any number of notes.',
      },
      {
        q: 'Can I come back to a particular view later?',
        a: 'Yes. The collection, the tag filter, the search text and the open note are all held in the address bar, so a bookmark brings back exactly what you were looking at.',
      },
    ],
  },
  {
    id: 'notes',
    heading: 'Notes',
    entries: [
      {
        q: 'How do I create a note?',
        a: 'Use the New note box at the foot of the middle pane: type a title, choose a collection (or leave it on No collection) and press Add.',
      },
      {
        q: 'Why did my new note not open?',
        a: 'Creating a note adds it to the list without opening it. It appears at the top of the middle pane, newest first — click its card to open it.',
      },
      {
        q: 'How do I edit a note?',
        a: 'Open the note, then open Edit note in the card below the body. That reveals the Title and Note fields.',
      },
      {
        q: 'How do I save my changes?',
        a: 'Press Save changes, and "Saved." appears beside the button. Nothing is stored until you press it, so do not navigate away with the fields still filled in.',
      },
      {
        q: 'How do I delete a note?',
        a: 'Delete sits under Edit note on the open note. You are asked to confirm first, and a deleted note cannot be brought back.',
      },
      {
        q: 'After deleting, why does it say the note is no longer available?',
        a: 'The deleted note is still named in the address bar, so the pane reports that it has gone. Nothing is wrong — pick another note, or choose All notes.',
      },
      {
        q: 'Will my notes still be there after a reload?',
        a: 'Yes. Everything is saved to the database, not to the browser, so a reload, a new tab or another computer all show the same notes.',
      },
      {
        q: 'Why does a note say Untitled?',
        a: 'A note saved without a title is shown as Untitled in the sidebar, on its card and in the editor. Add one through Edit note.',
      },
      {
        q: 'What is the difference between Created and Last updated?',
        a: 'A note shows Created until the first time you save a change to it. From then on it shows Last updated instead.',
      },
    ],
  },
  {
    id: 'collections',
    heading: 'Collections',
    entries: [
      {
        q: 'How do I create a collection?',
        a: 'Use New collection at the foot of the left pane: type a name and press Add. It joins the Collections list straight away.',
      },
      {
        q: 'How do I put a note in a collection?',
        a: 'Open the note, pick the collection from the Collection dropdown in the card below the body, and press Move. "Moved." confirms it.',
      },
      {
        q: 'How do I take a note out of a collection?',
        a: 'The same dropdown: choose No collection and press Move. The note then appears under Uncollected in the left pane.',
      },
      {
        q: 'Can I rename or delete a collection?',
        a: 'Not at the moment. You can move every note out of a collection, but the collection itself stays in the list.',
      },
      {
        q: 'What is the difference between All notes and Uncollected?',
        a: 'All notes lists everything you have written. Uncollected lists only the notes that are not in any collection.',
      },
      {
        q: 'What is the number beside a collection?',
        a: 'How many notes it holds. It is always the full count, whatever search or tag filter is active.',
      },
    ],
  },
  {
    id: 'tags',
    heading: 'Tags',
    entries: [
      {
        q: 'How do I put a tag on a note?',
        a: 'Open the note. Type into New tag and press Create to make a tag and attach it in one step, or pick one from "Add existing tag" and press Add.',
      },
      {
        q: 'How do I take a tag off a note?',
        a: 'Press the small cross on the tag. That removes it from this note only — the tag stays available for every other note.',
      },
      {
        q: 'Where do tags show up?',
        a: 'On the open note, on the note card in the middle pane, and in the Tags filter at the foot of the left pane.',
      },
      {
        q: 'Can I rename or delete a tag?',
        a: 'Not at the moment. Taking a tag off every note leaves the tag itself in the Tags filter.',
      },
    ],
  },
  {
    id: 'search',
    heading: 'Search and filtering',
    entries: [
      {
        q: 'What does search look at?',
        a: 'The box at the top of the middle pane matches note titles, note text and tag names, ignoring capitals. Results update as you type.',
      },
      {
        q: 'Does search ignore my filters?',
        a: 'No, it narrows what is already on screen. With a collection or a tag filter active, search looks only within that, never wider.',
      },
      {
        q: 'How does the tag filter work?',
        a: 'Click tags under Tags to select them. Select more than one and only notes carrying all of them are listed. Clear drops the whole selection.',
      },
      {
        q: 'Why does the left pane still show notes that search filtered out?',
        a: 'The tree on the left always lists all your notes, so you never lose your bearings. Search and the tag filter narrow the middle pane only.',
      },
      {
        q: 'Nothing was found. What now?',
        a: 'The middle pane says which filter emptied the list. Clear the search, clear a tag, or choose All notes to widen it again.',
      },
    ],
  },
  {
    id: 'account',
    heading: 'Account',
    entries: [
      {
        q: 'What is the circle in the top right?',
        a: 'Your profile menu. It shows the name and email address on your account, how you signed in, and the way out.',
      },
      {
        q: 'How do I sign out?',
        a: 'Sign out in the profile menu, or Sign out at the foot of the left pane. Either one returns you to the sign-in screen.',
      },
      {
        q: 'Can anyone else see my notes?',
        a: 'No. Your notes, collections and tags belong to your account alone. Someone signing in on this computer with a different account sees their own workspace, never yours.',
      },
      {
        q: 'What happens if I am not signed in?',
        a: 'The workspace does not open at all. You are sent to the sign-in screen first.',
      },
    ],
  },
  {
    id: 'password',
    heading: 'Password',
    entries: [
      {
        q: 'I have forgotten my password.',
        a: 'On the sign-in screen choose "Forgot your password?", enter your email address and press Send reset link. Following the emailed link brings you to Set a new password.',
      },
      {
        q: 'The link did not work.',
        a: 'It has to be opened in the same browser you asked for it from. If you opened it somewhere else, request a fresh link and follow it there.',
      },
      {
        q: 'No email arrived.',
        a: 'Check the spam folder, then request the link again from "Forgot your password?".',
      },
      {
        q: 'I sign in with Google.',
        a: 'Then there is no NoteSpace password to reset. Use Sign in with Google, and change the password with Google itself if you need to.',
      },
    ],
  },
  {
    id: 'good-to-know',
    heading: 'Good to know',
    entries: [
      {
        q: 'Where is my work kept?',
        a: 'In the database, saved as soon as an action succeeds. Nothing is held in the browser, so clearing your browsing data cannot lose a note.',
      },
      {
        q: 'Something looks out of date.',
        a: 'Reload the page, or try the action once more. The screen is drawn from the database each time it loads.',
      },
      {
        q: 'How do I know an action worked?',
        a: 'Each control answers for itself: "Saved." beside Save changes, "Moved." beside Move. Anything that fails says so in red, next to the control you used.',
      },
      {
        q: 'Should I sign out when I finish?',
        a: 'Yes, if you share the computer. The workspace is closed to anyone who is not signed in.',
      },
    ],
  },
]

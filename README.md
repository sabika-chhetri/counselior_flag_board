<<<<<<< HEAD
# SA Counsellor Flag Board (prototype)

Synthetic data only. No names, no real students.

## Run it
```
npm start        # then open http://localhost:3000   (needs Node 18+, no installs)
npm test         # checks the flag rules against the dataset
```

## What works
- **AC-01** Loads `data/SA_sample_dataset_SYNTHETIC.csv`, lists all 72 students by ID, school, class (file picker appears if the CSV can't be fetched).
- **AC-02** Flag (Urgent/High/Review/None) by the baseline rules, in order, with the reason beside it.
- **AC-03** Urgent always on top, red row, pulsing "⚠ URGENT" badge.
- **AC-04/07** Follow-up status (Not started / In progress / Closed) per flagged student; saved in the browser (localStorage), survives refresh.
- **AC-05** Supervisor tab: counts by school and class, no IDs, groups under 5 shown as "<5".
- **AC-06** Search by ID; filter by school, class, flag; hide closed.
- **AC-09 (partly)** Stacked bar chart on supervisor view; mobile-friendly layout. Not deployed; no Dzongkha.

## What does not work / limits
- Statuses live in one browser only (no login, no shared database). Real use needs a server.
- Supervisor view can leak by subtraction: if school totals and all-but-one class are visible, a hidden class could be inferred. Next step: also suppress complementary cells.
- Flag counts in a group of 5–6 can still be identifying in a small school; "<5" is a minimum, not a guarantee.

<<<<<<< HEAD
## Rules and assumptions
- Data cleaning: trim spaces, case-insensitive ("often" → Often), blank/invalid values become *unknown*, never guessed. Records with missing or invalid values are listed in a yellow banner (S-010 has no Q1). Harmless formatting problems, such as S-045's lowercase "often", are fixed silently. Unknown Q1 is not counted as "≤ 2".
- Review = any two of (Q1 ≤ 2, Q5 Yes, Q4 No), **or** Q7 Yes.

## Extra rule (AC-08) and gaps I found
**"Prefer not to say" on Q6 is treated as a signal.** The baseline treats it like "No", so such a child with no other flags would show *None*. Mine: at least **Review**; **High** if any other risk signal is present. 8 students answered this way; under the baseline 7 of them would show *None* and 1 only *Review*. With my rule 6 are High and 2 are Review. Why: a child who declines the self-harm question is not telling us they are fine.
Also: if Q2, Q3 or Q6 is missing and nothing else flagged, the student goes to Review ("answers missing") rather than a false None.
Other gaps (not built): free-text comments are ignored (S-023: "Sometimes I don't want to go home" is None); Q7 "wants counsellor" alone only gives Review, though the child asked for help.

## AI tools used
Claude Code (Claude Sonnet 5.5) to write the code and docs. I reviewed and ran the tests myself.
- **Prompt that worked:** giving the exact rules and asking for the logic as a separate pure file plus tests; this caught a wrong expectation (S-027) immediately.
- **Prompt that failed:** [REPLACE with your own honest example, e.g. a first prompt that was too vague and gave a generic dashboard.]
=======
## How I made this
1. **Read the brief** and picked the flag board plus follow-up status as the first piece (see the idea sheet).
2. **Wrote the rules first** as one plain file, `public/rules.js`: CSV reading, data cleaning, the flag rules in order, and the supervisor counts with the "<5" rule. Keeping it separate from the screen let me test it on its own.
3. **Tested the rules** with `npm test` on the real dataset (e.g. S-005 is Urgent, S-045 "often" is cleaned, School D class XI shows "<5", no IDs in supervisor data).
4. **Built the screens** in plain HTML, CSS and JavaScript, with no framework and no install, so it runs with one command. Statuses are saved in the browser's localStorage.
5. **Added my extra rule** for "Prefer not to say", then checked its effect on the 8 affected students.
6. **Improved the look**: large clickable flag-count cards, colour-coded rows, a chart and a mobile layout.

## AI tools used
- **Claude Code **, the only AI tool I used. It wrote the code, tests and documents from my instructions.
- I read the code, ran the tests and checked the numbers myself, and I can explain and change any part of it.
- Only the synthetic dataset was used. No real student data was put into any tool.
>>>>>>> 8af221875531885e45f305a902c2fc78b5bd6567

## Build next
Shared database + login per counsellor; complementary suppression; comment keyword alerts; Dzongkha labels; deploy; audit log of who changed a status.
=======
# counselior_flag_board
Created flag board of students
>>>>>>> 98b165e0811d44c4a66946c005991f4ac5642cdc

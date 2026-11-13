# Email to the CECD Director (~150 words)

Subject: First working piece of the SA counselling platform

Dear Director,

I have built a small working tool that helps a school counsellor act on the Situational Analysis survey. It reads the survey answers and sorts students into four groups: Urgent, High, Review and None, and always shows the reason. Students who say they have thoughts of self-harm appear first, in red. The counsellor marks each child as Not started, In progress or Closed, so nobody is forgotten.

Supervisors get a separate page showing how many students are flagged in each school and class. It never shows a student's ID, and any group smaller than five is hidden.

I also noticed that students who choose "Prefer not to say" on the self-harm question were being treated as fine, so I now flag them for a check.

Everything was tested on the fictional dataset only. Next steps: a shared, secure database and counsellor logins.

Respectfully,
[Your name]

---

# 5-minute pitch script
**0:00 Problem (30s)** Counsellors get piles of answers and must guess who to see first.
**0:30 Why this piece (30s)** Flagging and follow-up is where a child actually gets help; everything else builds on it.
**1:00 Demo counsellor view (90s)** Urgent at top (S-005, S-038), read the reason, change status to In progress, refresh page: it stays. Filter by School B, search an ID.
**2:30 Demo supervisor view (60s)** Counts and chart, no IDs; point out School D class XI showing "<5".
**3:30 My extra rule (45s)** "Prefer not to say" case, show S-027 and S-016.
**4:15 Honest limits + next (45s)** Browser-only storage, subtraction leak, comments ignored; next: database, login, Dzongkha.

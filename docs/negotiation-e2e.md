# In-inbox negotiation — two-account test script

Manual end-to-end check for the negotiation flow: every offer, counter-offer,
acceptance and decline happens inside **Messages**, and free typing only opens
after the deposit is paid.

You do not need to be technical to run this. Work through it top to bottom and
tick each box. If a box fails, note the step number and what you saw instead.

---

## Before you start

You need:

- [ ] The Vercel **preview** URL for the branch under test.
- [ ] Two browser windows that are logged in as different people. Use one
      normal window and one incognito/private window, or two different
      browsers — otherwise the second login kicks out the first.
  - **Window C** — a customer account.
  - **Window P** — a provider account.
- [ ] The provider account must have finished **Stripe onboarding**
      (Provider → Settings/Payouts shows payouts enabled). Without it, the
      deposit step later will refuse to start.
- [ ] The provider's service categories must include the category you will
      post the request in (e.g. Plumbing). Otherwise the request never reaches
      them.
- [ ] A Stripe **test** card: number `4242 4242 4242 4242`, any future expiry
      date, any 3-digit CVC, any postcode.

Keep both windows open side by side for the whole script. Pages refresh
themselves about every 15 seconds — when something doesn't appear yet, wait a
few seconds or reload before treating it as a failure.

---

## Part 1 — Customer posts a request

1. **Window C** — Post a new request.
   - [ ] Dashboard → *Post a request* (or *New request*).
   - [ ] Pick the category the provider covers, fill in address, description
         and a date, then submit.
   - [ ] You land on the request page and it says it is waiting for quotes.
   - [ ] Note the request's web address — you'll come back to it in Part 7.

---

## Part 2 — Provider sends the first offer

2. **Window P** — Find the lead.
   - [ ] Provider → *Leads*. The new request is in the list.
   - [ ] Open it and choose *Send quote*.

3. **Window P** — Send the quote.
   - [ ] Enter a base price (e.g. **200**), optionally hours/notes, then send.
   - [ ] **You are taken straight into the conversation in Messages** — not to
         a "quote sent" confirmation page. This is the key change.
   - [ ] In that conversation you see an **offer card**: an "Offer" label, the
         price €200, who it's from, and an expiry line.
   - [ ] Underneath the message list there is **no text box** — instead a note
         saying free messaging unlocks once the deposit is paid.
   - [ ] The offer card shows **no Accept / Counter / Decline buttons** for you
         (it's the customer's turn).

4. **Window C** — The customer sees the same card.
   - [ ] A notification appears (bell icon). Clicking it opens the
         conversation.
   - [ ] Messages → the thread row for this pro shows a chip like
         **"€200 · your turn"**.
   - [ ] Open the thread. The same offer card is there, and it **does** show
         **Accept**, **Counter** and **Decline**.
   - [ ] There is no text box here either — same locked-messaging note.

---

## Part 3 — Customer counters

5. **Window C** — Counter the price.
   - [ ] On the offer card, press **Counter**.
   - [ ] Enter a lower price (e.g. **160**), optionally a note, and send.
   - [ ] A new **Counter-offer** card appears in the thread at €160.
   - [ ] The old €200 card no longer has any buttons — it's history now.
   - [ ] The new card says it is waiting for the pro to respond, and the
         thread row chip changes to **"€160 · waiting"**.

6. **Window P** — The turn has flipped.
   - [ ] The pro gets a notification about the counter-offer.
   - [ ] The €160 card now shows **Accept / Counter / Decline** for the pro.
   - [ ] The thread row chip reads **"€160 · your turn"**.

---

## Part 4 — Provider counters back

7. **Window P** — Counter once more.
   - [ ] Press **Counter**, enter e.g. **180**, send.
   - [ ] A third card appears at €180; the buttons move off the €160 card.
   - [ ] Chip now reads **"€180 · waiting"** for the pro.

8. **Window C** — Confirm the ball came back.
   - [ ] Chip reads **"€180 · your turn"**, and the €180 card has the buttons.

> Optional sanity check: with the buttons showing in Window C, press
> **Accept** in Window P as well. It should be refused with a message saying
> it's the other side's turn. Nothing should double-book.

---

## Part 5 — Customer accepts, then pays the deposit

9. **Window C** — Accept €180.
   - [ ] Press **Accept** on the €180 card.
   - [ ] You are taken to the **booking page** for this job.
   - [ ] The booking total is **€180** (the agreed figure, not the original
         €200), and it asks for a **20% deposit — €36.00**.

10. **Window C** — Go back to the conversation.
    - [ ] Messages → open the thread.
    - [ ] There is an **"Accepted"** card at €180, and below it a centred
          **"Booking created"** chip with a **Pay deposit** button.
    - [ ] The thread row chip now reads **"€180 · Accepted"** and *stays*
          there (this used to go blank).
    - [ ] Still no free text box — the deposit hasn't been paid yet.

11. **Window P** — The pro's side.
    - [ ] Notification: quote accepted, waiting for deposit.
    - [ ] Same "Accepted" card and "Booking created" chip in the thread, but
          **no** Pay deposit button (the pro owes nothing).
    - [ ] Provider → *My Quotes*: this quote shows **Accepted**, links to the
          job, and has a secondary **View conversation** link.

12. **Window C** — Pay the test deposit.
    - [ ] Press **Pay deposit**.
    - [ ] On the Stripe page use card `4242 4242 4242 4242`, a future expiry,
          any CVC and postcode. Pay €36.00.
    - [ ] You are returned to the app and the booking shows the deposit as
          held/paid.

13. **Both windows** — Messaging unlocks.
    - [ ] In the thread there is now a **"Deposit paid — messaging unlocked"**
          chip.
    - [ ] The locked note at the bottom is replaced by a real **text box with
          a photo button**.
    - [ ] **Window C** — send "See you then". It appears in both windows
          within a few seconds.
    - [ ] **Window P** — reply. It appears in both windows.
    - [ ] Try sending a phone number or an email address. It should come out
          **masked/removed** in the message that appears.

---

## Part 6 — Decline path (fresh request)

Do this on a **new** request so it doesn't disturb the booked one.

14. **Window C** — Post a second request in the same category.
15. **Window P** — Send a quote on it (e.g. €300). You land in the thread.
16. **Window C** — Open the thread and press **Decline**.
    - [ ] A **"Declined"** card appears in the thread for both sides.
    - [ ] The thread row chip reads **"€300 · Declined"** and stays there.
    - [ ] No buttons remain anywhere on the thread.
    - [ ] **Window P** — a notification says the offer was declined, and
          *My Quotes* shows it as **Not selected** with an
          **Open conversation** link.

---

## Part 7 — Losing pro sees the auto-decline

This needs a **second provider account** (Window P2) in the same category. Skip
if you only have one provider account.

17. **Window C** — Post a third request in that category.
18. **Window P** and **Window P2** — Each sends a quote on it.
19. **Window C** — Messages shows two separate threads, one per pro, each with
    its own offer card and price chip.
20. **Window C** — Accept one of them (either window's offer) and complete or
    skip the deposit.
21. **Window P2** (the pro you did *not* pick):
    - [ ] Notification: quote not selected.
    - [ ] Their thread shows a **"Quote declined — another pro was booked"**
          chip, and the offer card has no buttons left.
    - [ ] *My Quotes* shows it as **Not selected**.

---

## Part 8 — The request page is now just a summary

22. **Window C** — Open the request page from Part 1
    (My Requests → tap the request).
    - [ ] The page shows the **request summary** (description, address, date,
          budget) and, when there are several live quotes, the **price range**
          strip.
    - [ ] Each quote is a **single compact row**: pro's photo, name, the
          current price, a status badge — and **one** action,
          **Open conversation**.
    - [ ] There are **no Accept / Decline / Counter buttons anywhere on this
          page** and no "accept this quote?" pop-up. That's the whole point.
    - [ ] Tapping a row opens that pro's conversation in Messages with the
          right thread already selected.
    - [ ] A short line of copy explains that prices are agreed in the
          conversation.
    - [ ] Repeat the check on a **phone-sized window** (or your phone): the
          rows stay on one line each and remain tappable.

---

## What "pass" looks like

- [ ] Prices only ever change from inside a conversation.
- [ ] Exactly one card in a thread ever has buttons — the newest one — and only
      for the side whose turn it is.
- [ ] Every thread keeps a price chip forever: *your turn*, *waiting*,
      *Accepted*, or *Declined*.
- [ ] Free typing is impossible until the deposit is paid, on both sides.
- [ ] Phone numbers and emails are stripped from messages.
- [ ] The request page and *My Quotes* are read-only summaries that link into
      the conversation.

## If something looks wrong

Note, for each failure: the step number, which window, what you expected, what
you saw, and the page address. A screenshot of both windows side by side is
worth more than a description.

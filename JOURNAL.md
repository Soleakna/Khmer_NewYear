# Project Journal

## Reflection: the four-card layout (pagination)

When I asked the AI to add pagination to the archive page, my first message
told it to show 4 entry cards per page, and it built exactly that. But when I
looked at the page on my laptop, 4 cards did not look right. The desktop grid
has three columns, so 4 cards left the last row uneven and the page felt
unbalanced. I realized I actually wanted 6 cards per page, so the grid would
show two full rows of three cards.

I told the AI: "1 page should have 6 cards not 4 cards, so change to 6
cards." The AI changed the number in the code (ITEMS_PER_PAGE from 4 to 6),
so the page started showing 6 cards. But it only updated one of its two
comments. A second comment in the same file still said "4 cards per page"
even though the code was showing 6 cards. I caught this by reading the code
carefully instead of only looking at the website, and I had that leftover
comment fixed so the code and its comments agree.

What I learned about checking, testing, and improving AI-generated code:

- AI assistants change only what they remember to change. When a fix touches
  one value, I need to check the whole file for other places that still
  describe the old behaviour.
- I should test the page after every AI change, and also read the generated
  code, not just look at the website. A comment that lies about the layout
  would confuse anyone reading the code later, including me.
- I should think harder about what I actually want before I ask the AI, so I
  do not have to change my mind right after it finishes.

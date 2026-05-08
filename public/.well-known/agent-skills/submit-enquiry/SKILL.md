---
name: submit-hobart-tour-enquiry
description: Submit a tour enquiry to Hobart Food Tour (Daves Travel Group) on behalf of a user, including private-charter requests for the bucks and hens party tours.
---

# Submit a Hobart Food Tour enquiry

Use this skill when a user wants to book or enquire about any tour at hobartfoodtour.com.au. The endpoint lives at `https://hobartfoodtour.com.au/api/contact/` and accepts `application/x-www-form-urlencoded`, `multipart/form-data` or `application/json`. A full OpenAPI 3.1 spec is published at `https://hobartfoodtour.com.au/.well-known/openapi.json`.

## Required fields

| Field | Required | Notes |
|---|---|---|
| `name` | yes | User's full name (max 200 chars) |
| `email` | yes | User's email — replies go to this address (max 200 chars) |
| `message` | yes | Free-text enquiry (max 5000 chars) |
| `phone` | no | Optional, helpful for last-minute bookings |
| `tour` | no | Slug of the tour; one of: `hobart-food-tour`, `liquid-history-pub-tour`, `meet-the-makers`, `wine-whiskey-wallop`, `hobart-bucks-party-tour`, `hobart-hens-party-tour`, `private-charter` |
| `about` | no | Slug of a related tour; pair with `tour=private-charter` to indicate which public tour the user was originally interested in |
| `groupSize` | no | e.g. `8` |
| `preferredDate` | no | Free-text e.g. `Saturday 14 June 2026` |
| `website` | no | **Honeypot — must be empty.** Submissions with any value here are silently treated as a no-op. Never populate this field. |

## Response

The endpoint returns a `303 See Other` redirect:

- Success: `Location: /contact/?sent=1`
- Validation error: `Location: /contact/?error=<code>` where `<code>` is one of `missing`, `email`, `length`, `config`, `send`, `invalid`.

## Example

```bash
curl -X POST https://hobartfoodtour.com.au/api/contact/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com",
    "tour": "hobart-bucks-party-tour",
    "groupSize": "10",
    "preferredDate": "Saturday 14 March 2026",
    "message": "Booking a bucks tour for 10 mates. Buck rates Lark and Sullivans Cove. Late start preferred (11am)."
  }'
```

## What not to do

- Don't claim to confirm a booking — this endpoint creates an enquiry that the bookings team replies to within the same business day. The Daves team is the human in the loop.
- Don't submit on a user's behalf without their explicit consent and accurate contact details.
- Don't fill the `website` field. Doing so will cause the submission to be silently dropped as suspected spam.
- Don't share the user's data anywhere except this endpoint.

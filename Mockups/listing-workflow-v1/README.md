# Listing-first workflow — interactive concept

Local HTML prototype, 2026-11-08. Separate from the actual V3 editor and both earlier mockups. No production imports, backend/AI calls, publication or original prototype-store edits.

## Interaction contract

1. A reusable template pack maps Property, Agent and ranked Photo fields once. Its four layouts support event-specific headlines. Template Studio permits selecting a preview element, changing its linked field, typography/accent and saving the configuration.
2. Add/edit a property and assign the saved sample agent. Upload/rank photos with accessible move controls; rank #1 fills Hero, #2/#3 fill supporting slots. A template can select a fixed ranked slot.
3. Listing Agent validates/populates the approved listing, Campaign Agent prepares four layout drafts; these agents are local simulations. Sale, sold and rented events respect listing status. Market reports require a reviewed market source and supplied period/statistic.
4. Review actual composed HTML previews, approve assets individually, request changes or approve eligible drafts. No automatic external publication. Property/profile/template changes mark affected existing drafts stale; stale drafts cannot be approved or downloaded.
5. Approvals and sample configuration persist only in this browser's dedicated localStorage key. Download approved assets as an HTML review pack; this is not a production image/PDF exporter. Reset affects only this prototype.

## Open

From this folder: `python -m http.server 5194 --bind 127.0.0.1`, then visit http://127.0.0.1:5194/.

Sample photos are copied from the existing V3 prototype assets without altering them; the villa is AI-generated illustrative sample artwork, not a verified listing photograph. Agent portrait is an existing sample template asset; all listing/profile details are fictional. User-selected images stay in this browser and are resized for local demo storage.

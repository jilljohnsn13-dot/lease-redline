// The negotiation playbook. Edit targets here: the website and the AI review both read this file.

export const SECTIONS = {
  money: "The big money items",
  repairs: "Who pays for repairs",
  personal: "Protect yourself personally",
  exits: "Ways out and flexibility",
  ops: "Running the business",
  legal: "Legal protections & fine print",
  movein: "Before you move in"
};

export const PLAYBOOK = [
  {id:"term", s:"money", title:"Lease term", target:"Aim for a 3-year term. 5 years is acceptable only if the tenant gets meaningful concessions in return (free rent, TI money)."},
  {id:"abatement", s:"money", title:"Free rent (abatement)", target:"At least 3 months of free rent after opening (more is a bonus). At minimum, free rent during the build-out period."},
  {id:"ti", s:"money", title:"Build-out money (TI allowance)", target:"As much TI allowance as possible ($20–$100+/sq ft is common), in writing, with clear timing of payment. Watch for reimbursement only after work is finished."},
  {id:"escalation", s:"money", title:"Yearly rent increases", target:"Cap annual increases at 3%, or 'the lesser of CPI or 3%'. Avoid uncapped CPI increases. Level (flat) payments across the term are a good alternative."},
  {id:"major-systems", s:"repairs", title:"Landlord covers major systems", target:"Landlord handles HVAC replacement, roof, plumbing, electrical, exterior and structure. Tenant handles only minor interior wear and cosmetic items. If the landlord refuses, cap the tenant's cost for any major repair at $1,000."},
  {id:"hvac-cap", s:"repairs", title:"HVAC repair cap", target:"Cap tenant-paid HVAC repairs at about $1,000 per year (acceptable range $500–$1,500); anything above is the landlord's. Routine service ($150–$300 per visit) is normal for the tenant."},
  {id:"lease-type", s:"repairs", title:"Lease type and extra costs", target:"Know whether the lease is gross, modified gross, or NNN. NNN can add $4–$15/sq ft. Get a written list of what is included in rent and every cost passed through."},
  {id:"cam-cap", s:"repairs", title:"Cap on shared-area costs (CAM)", target:"Cap annual CAM increases at 3–5%, plus the right to audit the landlord's CAM records once a year."},
  {id:"guarantee", s:"personal", title:"Personal guarantee", target:"Remove the personal guarantee entirely. If unavoidable, replace with a Good Guy Guarantee: 'Tenant's personal liability is limited to rent and additional rent owed through the date of surrender, as long as the tenant gives 90 days' written notice and returns the space broom-clean.'"},
  {id:"deposit", s:"personal", title:"Security deposit", target:"Keep it to about 1 month's rent (landlords ask 1–3). Clear terms for its return when the lease obligations are met and the space is returned in good condition, normal wear excepted."},
  {id:"assign", s:"exits", title:"Right to assign or sublet", target:"Right to assign or sublet with landlord consent 'not to be unreasonably withheld'. That phrase matters."},
  {id:"renewal", s:"exits", title:"Renewal options", target:"One or two options to renew for 3–5 years each at a set or capped rent. Avoid 'fair market value'."},
  {id:"kickout", s:"exits", title:"Early exit (kick-out clause)", target:"e.g. 'If sales don't reach $X by the end of year 2, tenant may terminate with 90 days' notice for a fee equal to Y months' rent.'"},
  {id:"cotenancy", s:"exits", title:"Co-tenancy", target:"Only for shopping centers/malls: rent reduction or right to leave if the center falls below 60–70% occupied or a named anchor leaves. Mark N/A if clearly not in a center."},
  {id:"exclusive", s:"ops", title:"Exclusivity (no competitors)", target:"Landlord won't lease other space in the building/center to a business whose main use competes (e.g. coffee shops, smoothie shops, dirty sodas, nutrition/shake shops)."},
  {id:"use", s:"ops", title:"Broad use clause", target:"Permitted use should be broad: '[main use] and any related retail or service use', not a narrow single description."},
  {id:"signage", s:"ops", title:"Signage rights", target:"Written rights for exterior wall sign, window decals, monument/pylon panel, and the approval steps."},
  {id:"parking", s:"ops", title:"Parking", target:"A set number of dedicated spaces plus customer parking during business hours."},
  {id:"hours", s:"ops", title:"Hours of operation", target:"Confirm the lease allows the days and hours the business needs, including evenings and weekends."},
  {id:"zoning", s:"ops", title:"Zoning", target:"Tenant should get written confirmation from the city zoning office that this specific use is allowed at the address. Ideally the lease is contingent on that and on permits."},
  {id:"snda", s:"legal", title:"SNDA", target:"An SNDA from the landlord's lender delivered as part of the lease, so a foreclosure can't end the lease."},
  {id:"holdover", s:"legal", title:"Holdover rent", target:"Cap holdover rent at 125–150% of base rent (landlords often ask 150–200%)."},
  {id:"force-majeure", s:"legal", title:"Forced closure (force majeure)", target:"Rent abatement during any government-ordered closure, fire, flood or pandemic. Standard after COVID."},
  {id:"grace", s:"legal", title:"Late-rent grace period", target:"5–10 day grace period before any late fee."},
  {id:"insurance", s:"legal", title:"Insurance requirements", target:"Reasonable coverage minimums. Tenant should send the insurance section to their insurance agent before signing."},
  {id:"loi-match", s:"legal", title:"LOI matches the lease", target:"Every LOI term must appear in the lease exactly. Only applies when both an LOI and a lease are provided; otherwise N/A."},
  {id:"condition", s:"movein", title:"As-is & move-in condition", target:"Avoid broad 'as-is' delivery. Landlord should warrant systems (HVAC, plumbing, electrical) in working order at delivery; tenant walks through with landlord and attaches dated photos/video of condition as an exhibit."},
  {id:"landlord-work", s:"movein", title:"Landlord work before move-in", target:"Landlord does as much pre-move-in work as possible: paint, flooring, HVAC check, plumbing tune-up, electrical updates."},
  {id:"key-dates", s:"movein", title:"The three key dates", target:"Lease clearly defines (1) Delivery Date, (2) Rent Commencement Date (after build-out and opening), and (3) Lease Commencement Date."}
];

const TONES = {
  friendly: "warm and appreciative, collaborative",
  balanced: "professional, appreciative, clear about what we need",
  firm: "polite but firm and direct; makes clear these terms matter to signing"
};

// loi / lease: {name, text, scanned:boolean} or null
export function buildPrompt({loi, lease, notes, tone, sender}) {
  const both = !!(loi && lease);
  const pb = PLAYBOOK.map(p => `- id "${p.id}" | ${SECTIONS[p.s]} | ${p.title}: ${p.target}`).join("\n");
  const docText = [
    loi ? `=== LETTER OF INTENT (${loi.name}) ===\n${loi.scanned ? "[Provided as page images attached to this message, labeled LOI]" : loi.text}` : "",
    lease ? `=== LEASE (${lease.name}) ===\n${lease.scanned ? "[Provided as page images attached to this message, labeled LEASE]" : lease.text}` : ""
  ].filter(Boolean).join("\n\n");

  return `You are a commercial lease negotiation assistant for small storefront business owners (often nutrition clubs, smoothie, coffee and specialty-drink shops) who are usually signing their first lease. Review the tenant's document(s) against the NEGOTIATION PLAYBOOK and tell them exactly what to negotiate.

NEGOTIATION PLAYBOOK (one item per line: id | section | item: what the tenant should get)
${pb}

TENANT CONTEXT
${notes || "(none given)"}
Documents provided: ${[loi && "LOI", lease && "Lease"].filter(Boolean).join(" and ")}.

DOCUMENTS
${docText}

INSTRUCTIONS
- Produce exactly one finding for EVERY playbook id above, in playbook order.
- status: "missing" = the document does not address it; "negotiate" = addressed but worse for the tenant than the playbook target; "ok" = meets or beats the target; "unclear" = ambiguous or depends on an exhibit not provided; "na" = does not apply (e.g. co-tenancy outside a shopping center, loi-match when only one document was provided).
- priority: "high" for big money or personal risk (term, free rent, TI, escalations, major systems, personal guarantee, and anything far off target), "medium" for most others, "low" for "ok"/"na" or minor items.
- found: what the document actually says, as a short quote or close paraphrase (max 30 words) with the section or page number if visible. Use "Not addressed." when missing. Never invent terms that are not in the document.
- ask: the specific change to request, in plain English, using concrete numbers and the playbook's suggested wording where it has some. For "ok" write "No change needed."
- why: one plain sentence on why it matters to this tenant.
- keyTerms: up to 8 of the main deal terms you find (premises/size, term, base rent, lease type, increases, deposit, TI, free rent, dates) as short label/value pairs. Only include terms actually stated.
- mismatches: ${both ? "list every term where the lease differs from or omits what the LOI says: {term, loi, lease, note}." : "an empty array (only one document was provided)."}
- summary: 2–3 plain sentences: what the deal is and the 2–3 most important things to push back on.
- email: a reply the tenant can send to the property manager/landlord. Tone: ${TONES[tone] || TONES.balanced}. Open by thanking them and saying the tenant wants to move forward. Then a numbered list of requested changes covering every "missing" and "negotiate" item with high or medium priority, highest priority first, each one sentence with concrete numbers. Do not mention the playbook, AI, or this tool. Close by inviting a call and sign off as "${sender || "[Your name]"}". Plain text, under 400 words. Subject line references the property or suite if known.

Reply with ONLY a JSON object, no other text, in this shape:
{"summary": string, "keyTerms": [{"label": string, "value": string}], "findings": [{"id": string, "status": "missing"|"negotiate"|"ok"|"unclear"|"na", "priority": "high"|"medium"|"low", "found": string, "ask": string, "why": string}], "mismatches": [{"term": string, "loi": string, "lease": string, "note": string}], "email": {"subject": string, "body": string}}`;
}

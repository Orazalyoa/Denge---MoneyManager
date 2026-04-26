---
name: frontend-design-build
description: "Build and refine frontend UI in this project with strong design direction. Use when implementing pages, components, responsive layouts, visual polish, mobile-first flows, interaction states, and trust-building UX for the Kaspi MVP. Keywords: frontend, design, UI, UX, layout, mobile, Tailwind, Next.js, component, page, visual, responsive, history page, preview, stats."
argument-hint: "Describe the page, component, or UX change and any product constraints."
user-invocable: true
---

# Frontend Design Build

## What This Skill Produces
This skill turns a product or UI request into a concrete frontend implementation for this workspace's Next.js and Tailwind app.

It is intentionally project-specific to this Kaspi MVP workspace rather than a generic frontend skill.

It is optimized for:
- fast MVP delivery
- intentional visual design instead of generic layouts
- mobile-first usability
- PRD-aligned trust signals such as preview-before-save and clear feedback

## When to Use
Use this skill when the task is primarily about:
- building or revising a page in the Next.js app router
- creating or refining React UI components
- improving layout, spacing, hierarchy, typography, color, or interaction design
- making the interface feel clearer, faster, or more trustworthy
- adapting the main paste flow, preview flow, stats area, or history view
- tightening responsive behavior for small screens

Do not use this skill for:
- parser-only or storage-only changes with no meaningful UI impact
- backend, auth, or infrastructure work
- broad product brainstorming without an implementation target

## Project Context
Treat these constraints as default unless the user says otherwise:
- Stack: Next.js App Router, React, TypeScript, Tailwind CSS
- Product goal: fastest way to log Kaspi transactions via paste
- MVP constraints: local-first, deterministic, no backend, no AI parsing
- Critical UX requirement: preview before save must remain obvious and trustworthy
- Non-functional requirement: mobile-friendly UI is mandatory

## Workflow
1. Map the request to one UI surface.
   Choose the smallest owning surface first: page, section, or component. Avoid broad redesigns when a local change is enough.

2. Define the user-facing outcome before coding.
   State the intended behavior in concrete terms such as:
   - what the user sees first
   - what actions are primary and secondary
   - what feedback appears on success, empty, and error states

3. Choose a visual direction that fits the app.
   Prefer a deliberate direction over a safe default, but preserve the existing product patterns unless the task explicitly asks for redesign. Decide:
   - hierarchy: what must draw attention first
   - tone: utility-first, calm finance, energetic dashboard, or similar
   - supporting UI language: cards, panels, dividers, badges, or list rhythm

4. Preserve product trust.
   For any transaction flow change, make sure the UI still clearly communicates:
   - pasted content can be reviewed before save
   - editable fields are obvious
   - destructive actions such as delete are visible and reversible when practical
   - save actions are distinct from parse and edit actions

5. Implement the smallest complete slice.
   Favor focused edits in the owning page or component and shared styling only where reuse is justified.

6. Handle responsive behavior deliberately.
   Design from narrow screens upward. Check:
   - spacing and touch targets on mobile
   - button stacking and wrapping
   - long amounts or labels
   - list density and scanability

7. Add interaction states.
   Ensure the surface has the states it needs:
   - empty
   - loading if applicable
   - success or confirmation
   - parse failure or invalid input guidance
   - disabled states for blocked actions

8. Validate with the narrowest useful check.
   Prefer typecheck, lint, or a focused build validation for the touched slice.

## Decision Rules
If the request touches the main transaction flow:
- keep parse, preview, edit, and save visually separated
- prioritize clarity over decorative complexity
- show summaries near the action, not far from it

If the request touches analytics or history:
- optimize for fast scanning
- make grouping, totals, and date context obvious
- avoid dense tables on mobile unless they degrade gracefully

If the existing screen already has a visual language:
- preserve its patterns unless the task explicitly asks for redesign
- improve weak spots through hierarchy, spacing, and state handling before changing everything

If there is no clear visual direction yet:
- define one briefly before editing and keep it consistent across the touched slice

## Quality Bar
A frontend change is complete only when it meets all of these:
- the main action is visually obvious
- the layout works on mobile widths
- text hierarchy is easy to scan
- empty and feedback states are not neglected
- the design feels intentional rather than default
- the change stays within PRD scope

## Completion Checklist
Before finishing, confirm:
- the request maps cleanly to the changed components or pages
- styling changes are localized unless reuse justifies extraction
- calls to action are clearly labeled
- preview-before-save is still preserved for transaction entry
- the touched screen remains understandable without extra explanation
- validation was run, or the reason it could not be run is stated

## Example Prompts
- Build a cleaner home page focused on paste, parse, and preview.
- Redesign the history page for better mobile scanning.
- Improve the stats cards so they feel more premium and readable.
- Tighten the preview list UX so editing and confirm actions are clearer.
- Refine the color, spacing, and typography of the main transaction flow without changing business logic.

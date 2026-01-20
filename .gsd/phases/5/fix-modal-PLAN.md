---
phase: 5
plan: fix-modal-ui-ux
wave: 1
gap_closure: true
---

# Fix Plan: Modal Responsiveness & UI Polish

## Problem
1. GroupSettingsModal overflows on mobile.
2. Group ID/Image not utilized for visual flair in detail view.

## Tasks

<task type="auto">
  <name>Refactor Modal Responsiveness</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Add `max-h-[90vh] overflow-y-auto` to the modal container.
    - Improve layout spacing for mobile.
  </action>
  <verify>Check tailwind classes in the modal.</verify>
  <done>Modal is usable on all screen sizes.</done>
</task>

<task type="auto">
  <name>Improve Detail Page Header</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Use group image as a subtle, blurred background cover in the header (if present).
  </action>
  <verify>Visually check header area rendering.</verify>
  <done>Group UI feels more premium and personalized.</done>
</task>

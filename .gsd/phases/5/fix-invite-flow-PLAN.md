---
phase: 5
plan: fix-invite-flow
wave: 1
gap_closure: true
---

# Fix Plan: Invite Flow & WhatsApp Sharing

## Problem
The "Invitar" button only copies to clipboard. Users expect a sharing modal and direct WhatsApp integration with a prefilled message.

## Tasks

<task type="auto">
  <name>Create InviteModal Component</name>
  <files>src/features/groups/components/InviteModal.tsx</files>
  <action>
    - Build a high-fidelity modal following glassmorphism style.
    - Include WhatsApp "Compartir" button with `wa.me` link.
    - Prefill message: "¡Hola! Sumate al grupo [Nombre] en SPLITA para que dividamos los gastos: [Link]"
    - Include "Copiar Enlace" secondary action.
  </action>
  <verify>Check file exists and contains WhatsApp sharing logic.</verify>
  <done>InviteModal component is created and styled.</done>
</task>

<task type="auto">
  <name>Integrate InviteModal in GroupDetails</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Replace `handleInvite` logic to open the new modal.
    - Render `InviteModal` when triggered.
  </action>
  <verify>Visually verify modal opens on "Invitar" click.</verify>
  <done>Modal is fully integrated.</done>
</task>

# SAME SKY

## Project Overview

Version: 1.0
Status: Active Development

---

# Purpose

Same Sky is a premium shared growth platform built for exactly two people.

The purpose of the product is to help two individuals grow personally while growing together inside one persistent shared world.

The application transforms consistent real-life actions into visible changes inside a living digital environment.

The digital world is never the objective.

It is a reflection of real life.

---

# Vision

Modern applications optimize for attention.

Same Sky optimizes for growth.

The application should encourage healthier routines, stronger consistency, emotional wellbeing, shared accountability and meaningful memories without demanding excessive screen time.

Users should spend less time inside the application and more time living the life that gradually transforms their shared world.

If the application successfully improves life outside the application, it has achieved its purpose.

---

# Product Identity

Same Sky is:

- A shared growth ecosystem
- A living shared world
- A personal growth companion
- A relationship companion
- A memory space
- A calm and premium digital experience

Same Sky is NOT:

- A habit tracker
- A productivity app
- A social network
- A streak application
- A gamified rewards system
- A messaging application

Relationships are important, but the application is fundamentally about helping two people become healthier, happier and more consistent individuals while growing together.

---

# Core Philosophy

Everything inside Same Sky exists to support one central idea:

Healthy individuals create healthier relationships.

Healthier relationships encourage healthier individuals.

Personal growth and shared growth continuously reinforce each other.

Every feature should strengthen this cycle.

---

# The Shared World

The shared world is the heart of Same Sky.

Everything else exists only to support it.

Authentication protects the world.

Pairing creates ownership.

Rituals influence the world.

Memories become part of the world's history.

AI helps users understand their growth.

The world itself is the product.

Every meaningful action performed in real life should eventually influence the world.

The application should never create artificial progression disconnected from real behaviour.

---

# Emotional Direction

Users should feel:

- Calm
- Safe
- Hopeful
- Proud
- Motivated
- Supported
- Emotionally connected

Users should never feel:

- Guilty
- Pressured
- Manipulated
- Addicted
- Punished
- Overwhelmed

The application should always welcome users back, regardless of how long they have been away.

Recovery should always be easier than abandonment.

---

# Premium Experience

Premium does not mean expensive.

Premium means:

Intentional design.

Beautiful typography.

Generous spacing.

Smooth animation.

Natural colours.

Thoughtful interaction.

Consistency.

Craftsmanship.

The project should rely primarily on open-source technologies while delivering a premium user experience.

---

# Product Principles

Real life always comes before the application.

The application should never interrupt meaningful real-world experiences.

Nothing meaningful should happen inside the world unless something meaningful happened outside it.

Consistency is more valuable than intensity.

Time is more valuable than streaks.

Meaning is more valuable than engagement.

Beauty is functionality.

Calm is a feature.

---

# Long-Term Vision

Over time the shared world should become a visual representation of the journey shared by two people.

Years later users should be able to revisit their world and immediately recognize different chapters of their lives through the environment they built together.

The application should become increasingly meaningful as time passes.

Its value should grow with the relationship rather than decrease after initial excitement.

---

# Future Systems

The finished product will eventually include:

- Dynamic shared world
- Tree progression
- Garden progression
- Pond ecosystem
- Wildlife
- Memories
- Journal
- AI reflections
- Relationship milestones
- Personal growth tracking
- Shared rituals
- Seasonal environments
- Dynamic weather
- Premium animations
- Accessibility
- Personalization

These systems should work together as one cohesive ecosystem rather than independent features.

---

# Success Criteria

A successful Same Sky should leave users feeling closer to themselves and to each other.

It should quietly improve everyday life rather than becoming the centre of it.

Every engineering and product decision should preserve this philosophy.

Whenever uncertainty exists, choose the solution that strengthens personal growth, shared growth and the shared world while maintaining simplicity and premium quality.

This document represents the product vision.

The repository represents the current implementation.

If implementation and philosophy ever diverge, clarify with the project owner before changing either.

# SAME SKY

## Engineering Specification

Version: 1.0
Status: Active Development

---

# Purpose

This document defines the engineering baseline and implementation expectations for Same Sky.

PROJECT_OVERVIEW.md explains the product vision and philosophy.

This document explains how the repository should evolve while preserving that vision.

The repository already contains a stable foundation. The objective is to complete the product, not redesign it.

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS

Backend

- Firebase Authentication
- Firebase Realtime Database

Architecture

- Component-based UI
- Service-based business logic
- Zustand global state
- Firebase realtime synchronization
- Type-safe models

---

# Current Project Status

The following systems are already implemented and should be considered stable.

✓ Project architecture

✓ Routing

✓ Firebase Authentication

✓ Google Sign-In

✓ Persistent sessions

✓ Protected routes

✓ User profile creation

✓ Global authentication store

✓ Pair creation

✓ Invite generation

✓ Invite validation

✓ Join Pair

✓ Shared world initialization

✓ Firebase service abstraction

✓ Database abstraction

These systems should be extended rather than rebuilt.

---

# Remaining Development

Major systems still to be implemented:

1. Premium Shared World UI
2. Ritual Engine
3. World Progression Engine
4. Dynamic Tree
5. Garden System
6. Pond System
7. Sky & Weather System
8. Daily Notes
9. Shared Journal
10. Memories
11. AI Reflection
12. Notifications
13. Personalization
14. Accessibility
15. Performance Optimization
16. Final Production Polish

---

# Repository Structure

app/

Application routing.

components/

Reusable UI only.

No business logic.

layouts/

Application layouts.

pages/

Route-level screens.

services/

Authentication.

Firebase.

Business logic.

World systems.

store/

Global application state.

types/

Shared interfaces.

assets/

Images, audio and static assets.

Avoid introducing unnecessary folders.

---

# Architecture Rules

Business logic belongs inside services.

Presentation belongs inside components.

Pages compose complete screens.

Global state should remain minimal.

Avoid duplicated logic.

Prefer extending existing architecture over creating parallel systems.

---

# Database Philosophy

Firebase stores the persistent application state.

Zustand stores temporary application state.

Realtime listeners should only exist where live synchronization provides user value.

Keep business logic independent of Firebase wherever practical.

---

# Coding Standards

Every implementation must:

- compile successfully
- pass TypeScript
- preserve existing behaviour
- use explicit types
- remain modular
- remain readable
- avoid unnecessary abstraction

Readable code is preferred over clever code.

---

# Product Specifications

## Shared World

The shared world is the central experience of Same Sky.

Everything else exists to support it.

Every meaningful real-life action should gradually influence the shared world.

Progress should feel natural rather than mechanical.

---

## Ritual Engine

Rituals represent consistent positive actions rather than checklist completion.

Core categories include:

- Wake Up
- Sleep
- Hydration
- Healthy Meals
- Exercise
- Walking
- Meditation
- Yoga
- Reading
- Journaling
- Gratitude
- Vitamins
- Study
- Deep Work
- Digital Detox
- Creative Work
- Good Morning
- Good Night
- Appreciation
- Shared Meal
- Call
- Date Night
- Acts of Kindness

The ritual engine should remain extensible so future ritual types can be added without architectural changes.

---

## World Progression

Individual rituals improve individual consistency.

The shared world grows through the combined consistent efforts of both users.

Growth should reward long-term consistency rather than isolated activity.

Large changes should occur gradually.

Small positive interactions may produce immediate visual feedback.

---

## Sky System

The sky should always represent the local time of the user currently viewing the application.

Examples:

Morning → Sunrise

Day → Bright sky

Evening → Sunset

Night → Moon and stars

Two users may see different skies simultaneously because the sky represents each user's local environment.

The sky is personal.

World progression is shared.

---

## Garden

The garden belongs to both users.

Flowers, plants and environmental richness increase through the combined consistency of both people.

One user's effort should not completely replace the contribution of the other.

The healthiest worlds emerge when both people grow together.

---

## Tree

The tree represents long-term shared growth.

Tree progression should remain slow and meaningful.

It should become one of the strongest emotional symbols inside the application.

---

## Pond

The pond represents peace and balance.

Its changes should feel calming rather than rewarding.

---

## Wildlife

Butterflies

Birds

Fireflies

Small animals

These should gradually appear as the shared world becomes healthier.

Wildlife should feel discovered rather than unlocked.

---

## Sound Design

Every meaningful environmental change should be accompanied by subtle natural audio.

Examples:

- leaves moving
- soft wind
- birds singing
- water ripples
- flower bloom
- butterflies
- gentle rain
- distant thunder
- nighttime insects

Audio should create immersion.

It should never become repetitive or distracting.

Users should always have the ability to adjust or disable environmental sounds.

---

## Daily Notes

Each partner may leave one short note every day.

The note should appear naturally inside the shared world as a small gift, letter or waiting message.

The purpose is to create one meaningful daily interaction rather than continuous messaging.

This is not intended to replace chat applications.

---

## Shared Journal

The journal is shared.

Each partner has their own writing space.

Both partners can read each other's entries.

Entries remain individually authored and should never overwrite one another.

The journal should become a shared diary documenting the journey of both people.

---

## Memories

Users should be able to preserve meaningful moments through photographs, text and milestones.

Memories should eventually become integrated into the shared world rather than existing as isolated galleries.

---

## AI

AI should assist by:

- summarizing
- organizing
- reflecting
- identifying positive patterns
- encouraging growth

AI should never:

- replace communication
- simulate emotional intimacy
- become the primary feature

## Long-Term Progress

Same Sky is a long-term growth application.

Every meaningful activity, ritual, memory, journal entry and world progression should be permanently stored.

Users should be able to revisit their entire journey months and years later.

Nothing that represents meaningful personal or shared growth should be temporary.

The application should gradually become more valuable over time rather than less valuable.

---

## Weekly & Monthly Analysis

The application should automatically generate:

- Weekly Reflection
- Monthly Reflection

Analysis should include:

- ritual consistency
- personal growth
- shared growth
- completed goals
- missed opportunities
- positive behavioural trends
- encouraging observations

The objective is reflection rather than judgement.

Analysis should always remain supportive and constructive.

---

## Weekly & Monthly Planning

Users should be able to create shared plans for:

- upcoming week
- upcoming month

Planning may include:

- goals
- habits
- rituals
- reminders
- milestones

The application should later compare planning with actual progress during weekly and monthly reflections.

---

## Historical Timeline

Every meaningful event should become part of a permanent timeline.

Examples:

- memories
- milestones
- journal entries
- world evolution
- ritual achievements
- celebrations

Users should always be able to revisit previous weeks, months and years.

The application should become a living history of two people's journey.

---

## Progress Visualization

Growth should be visible at multiple timescales.

Immediate

Small visual responses after meaningful actions.

Weekly

Visible improvements based on recent consistency.

Monthly

Larger environmental changes.

Yearly

Major world evolution representing long-term commitment.

Growth should always feel earned.

---

## Reflection Philosophy

Reflection is more important than statistics.

The application should explain:

"What happened?"

"Why did it happen?"

"What improved?"

"What could improve next?"

Reflection should encourage awareness rather than performance.

---

## Data Preservation

No meaningful user-generated content should be automatically deleted.

This includes:

- journals
- memories
- plans
- reflections
- milestones
- progression history
- world history

Users are building a long-term shared archive.

Preserving that history is one of the core values of Same Sky.

## Relationship Between Immediate Feedback and Long-Term Growth

Every meaningful action should produce two effects.

Immediate

A small visual and audio response that acknowledges the completed action.

Examples:

- leaf movement
- flower bloom
- butterfly appearance
- gentle chime
- water ripple

Long-Term

The action contributes to the cumulative health of the shared world.

Immediate feedback creates satisfaction.

Long-term progression creates emotional attachment.

Both systems should coexist.

## Time Tracking Philosophy

The application should understand time naturally.

Track:

- daily progress
- weekly progress
- monthly progress
- yearly progress

Visualizations, reflections and world evolution should all use this historical data.

Time itself is one of the primary progression systems inside Same Sky.

The longer two people consistently grow together, the richer and more meaningful their world becomes.

The analysis should be in graphical representation. Daily progress should show completion and incompletion in chart form on percentage of completion basis.

---

# Engineering Constraints

Claude must NOT:

- redesign the product philosophy
- rewrite stable architecture without strong justification
- introduce duplicate systems
- create business logic inside UI components
- tightly couple unrelated modules
- introduce unnecessary dependencies
- introduce paid dependencies without approval
- silently invent product requirements
- remove existing functionality unless requested
- optimize for engagement instead of meaning

---

# UI Constraints

The interface should always feel:

- calm
- premium
- spacious
- emotionally warm

Avoid:

- clutter
- dashboard-heavy layouts
- excessive colours
- aggressive animations
- information overload

Every screen should appear intentionally crafted.

---

# Development Workflow

Before implementation

1. Read PROJECT_OVERVIEW.md
2. Read this document
3. Inspect repository
4. Understand existing architecture
5. Create implementation plan

Implementation

- reuse architecture
- build complete features
- maintain consistency

After implementation

- build project
- resolve compilation errors
- resolve TypeScript errors
- verify UI consistency
- review repository health

---

# Definition of Done

A task is complete only when:

✓ Functionality works

✓ Project builds

✓ TypeScript passes

✓ Existing functionality remains intact

✓ Product philosophy is preserved

✓ UI meets premium expectations

✓ Architecture remains clean

✓ Repository quality improves

---

# Final Contract

The ZIP repository is the implementation source of truth.

PROJECT_OVERVIEW.md is the product source of truth.

This document defines the engineering expectations.
If implementation and documentation conflict, identify the discrepancy and request clarification before making architectural changes.
Complete Same Sky.
Do not reinterpret Same Sky.
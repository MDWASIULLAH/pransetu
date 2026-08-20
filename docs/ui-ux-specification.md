# PRANSETU UI/UX Specification

## 1. Design Philosophy
- **Clarity over decoration:** Information must be immediately legible without cognitive strain.
- **Trust over visual excitement:** The app must feel calm, official, and sophisticated.
- **Speed over unnecessary interaction:** Emergency actions (like SOS) must be obvious and direct.
- **Accessibility by default:** Large touch targets, dynamic font scaling, high contrast, and screen-reader support are mandatory.
- **Honesty in State:** Never display a "success" or "delivered" state unless explicitly confirmed by the backend or local store.

## 2. Visual Identity
- The app portrays a serious government/public-safety identity.
- Deep authoritative public-service blue (`#0F4C81`), clean layouts, and purposeful status color coding.

## 3. Color System
- **Primary:** Deep Public-Service Blue (`#0F4C81`) - communicates trust and stability.
- **Secondary:** Calm Teal/Cyan (`#008080`) - for non-critical secondary actions.
- **Emergency (Error/Critical):** High-visibility Red (`#D32F2F`) - strictly reserved for SOS, critical alerts, and destructive actions.
- **Warning:** Amber (`#FBC02D`) - for offline states, missing permissions, or advisories.
- **Success:** Green (`#388E3C`) - exclusively for confirmed successful deliveries/acknowledgements.
- **Background:** True Black (`#000000`) or deep Gray (`#121212`) in dark mode; off-white (`#F8F9FA`) in light mode.
- **Surface:** Distinct elevations to separate cards (`#1E1E1E` for dark mode surfaces).

## 4. Typography & Languages
- Material 3 typography with Roboto / Inter.
- Direct multilingual support for English, Odia (`ଓଡ଼ିଆ`), and Hindi (`हिन्दी`) without English as an intermediate assumption.

## 5. SOS UX & Lifecycle Progression
- **Interaction:** Press & hold for 3 seconds with circular progress fill.
- **State Progression:**
  `CREATED -> STORED -> QUEUED -> RELAYING -> GATEWAY_RECEIVED -> SERVER_RECEIVED -> ACKNOWLEDGED -> CLOSED`
- Truthful location state representation: distinction between **Current GPS Fix** and **Last-Known Location** with timestamp.

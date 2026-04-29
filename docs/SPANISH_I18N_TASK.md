# Spanish i18n Completion Task

## Context
IronTrack Pulse is a construction schedule intelligence SaaS. Many field workers are Spanish-speaking. The i18n system is already wired:

- `src/lib/i18n.ts` — translation dictionary with `t('key')` function and `useTranslation()` hook
- `src/components/I18nProvider.tsx` — React context, reads from localStorage `pulse_language`
- `src/components/settings/AppearanceSettings.tsx` — EN/ES toggle in settings
- Language state persists in localStorage and triggers re-render via CustomEvent

## Current State
~120 translation keys exist in `src/lib/i18n.ts` covering: nav, actions, statuses, sub-ops, safety, settings, handoffs.

**The problem:** Most components still have hardcoded English strings instead of using `t('key')`. The toggle works but switching to Spanish only translates a small fraction of the UI.

## Task
Complete the Spanish i18n so that **all user-facing text** in the app uses `t('key')` calls and has proper Spanish translations.

### Scope — What to translate
1. **All tab components** in `src/components/tabs/` — headers, labels, empty states, button text, tooltips
2. **All sub portal pages** in `src/app/sub/` — dashboard, dispatch, check-in, production, blockers, SOPs, handoffs, crew, foremen, settings
3. **Navigation components** — `src/components/navigation/ProjectNav.tsx`, `src/components/Sidebar.tsx`, `src/components/MobileNav.tsx`
4. **Form labels and buttons** across all forms
5. **Activity drawer** — `src/components/ActivityDrawer.tsx`
6. **Upload page** — `src/app/upload/page.tsx`
7. **Login/signup pages** — `src/app/login/`, `src/app/signup/`, `src/app/login/sub/`, `src/app/signup/sub/`
8. **Landing page** — `src/app/page.tsx` (hero, features, footer)
9. **Error messages** and **empty states** throughout
10. **Settings panel** — `src/components/settings/SettingsPanel.tsx` and all settings sub-components

### Scope — What NOT to translate
- API routes (server-side only)
- Database values (activity names are translated via a separate `useActivityTranslations` hook)
- Code comments
- Console logs
- Third-party library text

### How to add translations
1. Add new keys to the `translations` dictionary in `src/lib/i18n.ts`
2. In components, import `{ t } from '@/lib/i18n'` (or use `useTranslation()` hook for React components)
3. Replace hardcoded strings with `t('key.subkey')` calls
4. Use construction industry terminology for Spanish translations — this is for field superintendents, foremen, and project managers in commercial construction

### Naming Convention for Keys
Follow the existing pattern:
- `nav.xxx` — navigation items
- `action.xxx` — buttons and actions
- `status.xxx` — status labels
- `tab.xxx` — tab names
- `form.xxx` — form labels
- `error.xxx` — error messages
- `empty.xxx` — empty state messages
- `page.xxx` — page-level headings
- `sub.xxx` — sub portal specific
- `checkin.xxx`, `dispatch.xxx`, `blocker.xxx`, etc. — feature-specific

### Translation Quality Notes
- Use Latin American Spanish (not Castilian)
- Use "usted" form, not "tú" — this is professional/field context
- Construction terms: "schedule" = "cronograma", "foreman" = "capataz" or "maestro de obra", "punch list" = "lista de pendientes", "RFI" = "RFI" (keep as-is, it's industry standard), "submittal" = "entregable" or "sometimiento"
- Keep brand names in English: "IronTrack", "Pulse", "Project Pulse"

### Build Requirements
- Must compile with `npx tsc --noEmit` (zero errors)
- Must not break any existing functionality
- Must not change any API routes or database queries

### Testing
After changes, toggle language in Settings → Appearance → Language and verify the entire UI switches to Spanish. All text should be translated — no English strings should remain visible in Spanish mode except brand names and technical terms.

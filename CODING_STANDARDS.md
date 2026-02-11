# Habify Frontend Coding Standards

This document outlines the coding standards and best practices for the Habify Frontend project (React Native/Expo). All contributors should follow these guidelines to ensure code quality and consistency across the mobile application.

## 1. General Principles
- **Keep it Simple**: Write code that is easy to read and maintain. Avoid over-engineering.
- **DRY (Don't Repeat Yourself)**: Reuse components and hooks. Avoid duplication of logic or styling.
- **Component-Driven Development**: Build small, focused, and reusable components.
- **Accessibility (A11y)**: Follow accessibility best practices for React Native to ensure the app is usable by everyone.

## 2. Naming Conventions
- **Files**: Use `kebab-case` (e.g., `user-profile.tsx`, `auth-service.ts`, `custom-button.tsx`).
- **Folders**: Use `kebab-case`.
- **Components**: Use `PascalCase` for component names (e.g., `export function UserProfile()`).
- **Interfaces & Types**: Use `PascalCase`. Prefer `type` for simple definitions and `interface` for object structures that might be extended.
- **Variables & Functions**: Use `camelCase`.
- **Constants**: Use `UPPER_CASE` for global configuration or fixed values (e.g., `API_URL`, `PRIMARY_COLOR`).
- **Hooks**: Use `camelCase` starting with `use` (e.g., `useAuth`).

## 3. TypeScript Guidelines
- **Strict Mode**: Ensure `strict` mode is respected.
- **Explicit Typing**: 
    - Specify return types for all functions and hooks.
    - Avoid `any`. Use `unknown` if the type truly isn't known, or define a specific interface.
- **Props**: Always define a `Props` type/interface for components.
- **Readonly**: Use `readonly` for state or props that should not be mutated directly.

## 4. React & Expo Best Practices
- **Functional Components**: Use functional components with hooks. Avoid class components.
- **Named Exports**: Use named exports for components to facilitate easier refactoring and better Intellisense support.
- **Custom Hooks**: Extract complex logic into custom hooks.
- **Styling**: 
    - Use `StyleSheet.create` for performance.
    - Keep styles close to the component or in a separate `.styles.ts` file if they are large.
    - Use theme constants for colors and spacing.
- **Navigation**: Use Expo Router conventions (file-based routing).
- **Performance**:
    - Use `useCallback` for functions passed as props to children.
    - Use `useMemo` for expensive calculations.
    - Optimize `FlatList` with `keyExtractor`, `getItemLayout` (if fixed height), and `initialNumToRender`.

## 5. Component Structure & Ordering
To maintain consistency, organize component files in the following order:
1.  **Imports**: (React/RN -> 3rd Party -> Local Components -> Utils/Hooks -> Assets/Styles)
2.  **Interfaces/Types**: (Props, State interfaces)
3.  **Component Definition**: `export function ComponentName(...)`
4.  **Hooks & State**: (`useContext`, `useState`, `useRef`, custom hooks)
5.  **Effects**: (`useEffect`, `useFocusEffect`)
6.  **Helper Functions**: (Event handlers, logic)
7.  **Render**: (Return statement with JSX)
8.  **Styles**: `StyleSheet.create(...)`

## 6. State Management & Data Fetching
- **Global State**: Use React Context for global app state (e.g., Auth, Theme). For more complex state, prefer lightweight libraries like Zustand.
- **Local State**: Use `useState` or `useReducer` for component-level state.
- **Services**: All API calls must be encapsulated in the `services/` directory.
- **Error Handling**: 
    - Handle API errors within the service or hook layer where possible.
    - Return standardized error objects or throw errors to be caught by the UI layer (e.g., showing a Toast).

## 7. Quality Tools
- **ESLint**: Run `npm run lint` regularly to catch issues early.
- **Prettier**: Ensure code is formatted using `npm run format` before committing.
- **Conventional Commits**: Follow the conventional commit format (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
- **Husky & lint-staged**: These are configured to run linting and formatting automatically on pre-commit.

## 8. Directory Structure
- `app/`: Expo Router pages and layouts.
- `components/`: Reusable UI components.
- `hooks/`: Custom React hooks.
- `services/`: API calls and external service integrations.
- `constants/`: Theme, configuration, and fixed values.
- `types/`: Shared TypeScript types and interfaces.
- `utils/`: Helper functions.

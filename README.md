# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Habify Frontend

Habify is a mobile application designed to help users create, track, and manage routines.
This repository contains the React Native (Expo) frontend, following a modular and scalable architecture.

This documentation covers:
• Project structure
• Setup instructions
• Code quality and commit rules
• How to add new screens
• How to connect to the backend

⸻

Requirements

Before running the project, install:
• Node.js 20 or newer
• npm 9 or newer
• Expo CLI
• Git

Check versions:

```bash
node -v
npm -v
npx expo --version
```

⸻
Installation

Clone the repository:

```bash
git clone https://github.com/ctis-habify/habify-frontend.git
cd habify-frontend
```

Install dependencies:

```bash
npm install
```

⸻
Code Quality

Run lint:

```bash
npm run lint
```

Fix automatically:

```bash
npm run lint:fix
npm run format
```

Husky automatically checks formatting and lint rules before each commit.
⸻

Commit Rules (Commitlint)

This project uses Conventional Commits.
If the format is incorrect, commits are rejected.

Examples:

# feat: add routine tracker screen

# fix: correct layout bug in register form

# refactor: extract card component

# chore: update dependencies

# docs: update README instructions

⸻
How to Add New Screens

Example screen:

```bash
touch app/(personal)/routine-detail.tsx
```

Expo Router automatically creates the route.

To add a modal:

```bash
touch app/(personal)/edit-routine.tsx
```

⸻

Theming

All theme and color definitions:

constants/colors.ts
constants/theme.ts

Reusable UI components should be placed inside components/.

⸻

Backend Integration

Example API call:

# import axios from "axios";

# const api = axios.create({

# baseURL: process.env.EXPO_PUBLIC_API_URL,

# });

# export const fetchRoutines = () => api.get("/routines");

Backend repository:
https://github.com/ctis-habify/habify-backend

⸻

Contributing Workflow 1. Create a new branch:

git checkout -b feat/new-feature

    2.	Make changes
    3.	Commit with conventional commit format
    4.	Push and open a pull request

⸻
Habify frontend is now fully set up and ready for development.

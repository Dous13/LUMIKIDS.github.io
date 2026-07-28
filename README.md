# 🌟 LUMIKIDS

> **A Mobile-Based Gamified Adaptive Learning Application for Early Childhood Education Using Rule-Based Difficulty Progression**

LUMIKIDS is a cross-platform mobile application developed to provide an engaging and adaptive learning experience for early childhood learners. The application combines **gamification**, **rule-based difficulty progression**, and **offline-first learning** to help children develop foundational skills in **Reading, Writing, and Mathematics**.

Designed as a Bachelor of Science in Computer Science (BSCS) thesis project, LUMIKIDS aims to create an educational environment that is both enjoyable and effective while giving teachers and parents meaningful insights into learner progress.

---

## ✨ Features

### 📚 Reading

* Interactive reading lessons
* Letter and word recognition
* Audio pronunciation *(planned)*
* Story-based learning *(planned)*

### ✍️ Writing

* Letter formation activities
* Finger tracing *(planned)*
* Stroke guidance *(planned)*
* Writing practice

### 🔢 Mathematics

* Counting
* Number recognition
* Basic arithmetic
* Shape and pattern recognition *(planned)*

### 🎮 Gamification

* Experience Points (XP)
* Achievement Badges
* Learner Levels
* Daily Streaks *(planned)*
* Rewards and Progress Tracking

### 🧠 Adaptive Learning

LUMIKIDS uses a **Rule-Based Difficulty Progression Algorithm** to personalize each learner's experience.

After every assessment, the application evaluates learner performance using predefined mastery rules.

* Learners who demonstrate mastery unlock the next lesson.
* Learners requiring additional support receive reinforcement activities before progressing.

This approach promotes mastery learning while maintaining a structured educational pathway.

### 👨‍🏫 Teacher Dashboard

Teachers can:

* Create classrooms
* Generate classroom invitation codes
* Monitor learner progress
* Review assessment scores
* Track lesson completion
* View classroom analytics *(planned)*

### 👨‍👩‍👧 Parent Progress View

Parents can access their child's profile to view:

* Lesson progress
* Assessment results
* Earned achievements
* Learning history

### 📶 Offline-First Learning

LUMIKIDS is designed to function without an internet connection.

Learner progress is stored locally on the device and automatically synchronized with Firebase once connectivity becomes available.

---

# 📱 Technology Stack

### Frontend

* React Native
* Expo
* TypeScript

### Backend

* Firebase Authentication
* Cloud Firestore
* Firebase Storage

### Local Database

* Expo SQLite

### Navigation

* React Navigation

### Form Validation

* React Hook Form
* Zod

### Version Control

* Git
* GitHub

---

# 🏗️ Project Structure

```text
Lumikids/
│
├── assets/
│
├── src/
│   ├── algorithms/
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── database/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   ├── types/
│   └── utils/
│
├── App.tsx
└── package.json
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Lumikids.git
```

## Install dependencies

```bash
npm install
```

## Start the development server

```bash
npx expo start
```

Run the application using:

* Android Emulator
* iOS Simulator
* Expo Go

---

# 📖 How It Works

1. A learner signs in and joins a classroom using a classroom invitation code.
2. The learner selects a subject (Reading, Writing, or Mathematics).
3. The learner completes lessons and assessments.
4. The Rule-Based Difficulty Progression Algorithm evaluates assessment performance.
5. If mastery is achieved, the learner unlocks the next lesson and earns rewards.
6. If mastery is not achieved, the learner completes reinforcement activities before progressing.
7. Progress is saved locally and synchronized with Firebase whenever an internet connection becomes available.
8. Teachers and parents can monitor learner progress through their respective interfaces.

---

# 🧠 Rule-Based Difficulty Progression

The application uses predefined instructional rules to determine learner progression.

Example progression:

| Assessment Score | System Action                              |
| ---------------- | ------------------------------------------ |
| **90–100%**      | Unlock next lesson + Bonus XP + Badge      |
| **80–89%**       | Unlock next lesson + Standard XP           |
| **60–79%**       | Reinforcement activity before reassessment |
| **Below 60%**    | Repeat lesson with guided practice         |

This algorithm ensures that learners master each lesson before advancing.

---

# 📌 Current Development Status

### Completed

* Project planning
* System architecture
* UI/UX prototype
* Database design
* Thesis documentation

### In Progress

* React Native implementation
* Authentication
* Navigation
* Student dashboard
* Learning modules

### Planned

* Audio pronunciation
* Letter tracing
* Animated rewards
* Tablet optimization
* Classroom analytics
* Push notifications
* Multi-language support

---

# 🎯 Future Enhancements

* AI-assisted pronunciation feedback
* Handwriting recognition
* Teacher assignment management
* Adaptive content recommendations
* Cloud backup and restore
* Expanded curriculum
* Accessibility improvements

---

# 👨‍💻 Developers

Developed as a Bachelor of Science in Computer Science thesis project.

**Project Title**

*A Mobile-Based Gamified Adaptive Learning Application for Early Childhood Education Using Rule-Based Difficulty Progression*

---

# 📄 License

This project is currently intended for educational and research purposes. A license will be selected before any public production release.

---

## ⭐ Project Vision

LUMIKIDS aims to make early childhood learning engaging, accessible, and adaptive by combining educational best practices with modern mobile technology. Through gamification, structured progression, and offline accessibility, the project seeks to support learners, teachers, and parents in creating a more effective and enjoyable learning experience.

# Mosque Educational Management System (MEMS) - Database Schema

This document provides a detailed overview of the database structure for the MEMS application. The system uses **PostgreSQL** with **Prisma ORM** for data management.

## Database Overview

The schema is designed to manage users (Admins and Teachers), students, classes, enrollments, attendance, and progress tracking (both Quranic and Theoretical).

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Class : "teaches"
    Student ||--o{ Enrollment : "has"
    Class ||--o{ Enrollment : "contains"
    Class ||--o{ Schedule : "has"
    Enrollment ||--o{ Attendance : "records"
    Enrollment ||--o{ QuranProgress : "tracks"
    Enrollment ||--o{ TheoryProgress : "tracks"

    User {
        int id PK
        string name
        string username
        string password_hash
        Role role
    }

    Student {
        int id PK
        string name
        string contact_info
        string parent_info
        datetime date_of_birth
    }

    Class {
        int id PK
        string class_name
        ClassType type
        int teacher_id FK
        json schedule_settings
    }

    Enrollment {
        int id PK
        int student_id FK
        int class_id FK
        EnrollmentStatus status
    }

    Attendance {
        int id PK
        int enrollment_id FK
        date date
        AttendanceStatus status
    }

    QuranProgress {
        int id PK
        int enrollment_id FK
        date date
        ProgressType type
        int surah_id
        int start_verse
        int end_verse
        int rating
    }

    TheoryProgress {
        int id PK
        int enrollment_id FK
        date date
        string topic_name
        string notes
    }

    Schedule {
        int id PK
        string month_year
        int[] weekend_config
        json manual_overrides
        int class_id FK
    }
```

---

## Models and Fields

### 1. User (`users`)
Stores information about the people using the system (Admins and Teachers).
- `id`: Unique identifier (auto-increment).
- `name`: Full name of the user.
- `username`: Unique username for login.
- `password_hash`: Securely hashed password.
- `role`: Roles defined as `admin` or `teacher`.

### 2. Student (`students`)
Stores student profiles.
- `id`: Unique identifier.
- `name`: Student's full name.
- `contact_info`: Phone or email (optional).
- `parent_info`: Guardian contact details.
- `date_of_birth`: Student's birth date.

### 3. Class (`classes`)
Represents the different educational groups (Quran or Theory).
- `id`: Unique identifier.
- `class_name`: Name of the class.
- `type`: Either `Quran` or `Theory`.
- `teacher_id`: Linked to the `User` model (Teacher).
- `schedule_settings`: JSON field for additional configuration.

### 4. Enrollment (`enrollments`)
The link between a student and a class. A student can only have one active enrollment per class.
- `id`: Unique identifier.
- `student_id`: FK to `Student`.
- `class_id`: FK to `Class`.
- `status`: `Active` or `Disabled` (Enrollments are disabled if the 60% rule is triggered).

### 5. Attendance (`attendances`)
Daily records of student presence.
- `id`: Unique identifier.
- `enrollment_id`: FK to `Enrollment`.
- `date`: The date of attendance.
- `status`: `Present`, `Absent`, or `Excused`.

### 6. Quran Progress (`quran_progress`)
Specific tracking for Quranic memorization and revision.
- `enrollment_id`: FK to `Enrollment`.
- `type`: `Hifz` (Memorization) or `Muraja` (Revision).
- `surah_id`: Surah number (1-114).
- `start_verse` & `end_verse`: The range covered.
- `rating`: Optional performance score (1-5).

### 7. Theory Progress (`theory_progress`)
Tracking for non-Quranic lessons.
- `topic_name`: The lesson title.
- `notes`: Any comments or observations.

---

## Core Relationships

1.  **Classes & Teachers**: A `Class` has one `User` (Teacher), but a `User` can teach multiple `Classes` (One-to-Many).
2.  **Students & Enrollments**: A `Student` can be enrolled in multiple classes (e.g., one Quran, one Theory), creating multiple `Enrollment` records.
3.  **Enrollments & Progress**: All attendance and progress records are linked to an `Enrollment`, not directly to a `Student`. This ensures that if a student changes classes, their history remains associated with that specific enrollment.
4.  **Classes & Schedules**: Each `Class` can have its own `Schedule` configuration (weekends, holidays), or use a global one.

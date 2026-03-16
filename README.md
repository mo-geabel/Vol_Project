# Mosque Management System (MEMS)

A modern, comprehensive management system designed for mosques and Islamic educational centers to track student progress, attendance, and administrative workflows.

## 🚀 Features

- **Multi-Role Dashboard**: Tailored experiences for Administrators and Teachers.
- **Student Management**: Detailed tracking for both Quranic and Theoretical study tracks.
- **Attendance System**: Digital attendance tracking for both students and teachers with automatic threshold alerts.
- **Progress Tracking**: 
    - **Quran**: Log Hifz (memorization) and Muraja'a (revision) with specific Surah, verse ranges, and ratings.
    - **Theory**: Track progress in books, topics, and pages read.
- **Comprehensive Reporting**: Generate official reports (PDF) for student performance and attendance.
- **Statistics & Analytics**: Visual data representations of attendance trends and student achievements.
- **Bilingual Support**: Full RTL/LTR support for Arabic and English languages.
- **Database Monitoring**: Admin-side visibility into database usage and storage limits.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Context API
- **Routing**: React Router 7
- **Internationalization**: i18next
- **Charts**: Recharts
- **PDF Generation**: jsPDF & AutoTable

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT & Bcrypt

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mosque
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file based on example and add your DATABASE_URL
   npx prisma generate
   npx prisma migrate dev
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🔒 Security
- Secure password hashing using Bcrypt.
- Protected routes and API endpoints via JWT.
- Role-based access control (RBAC).

## 📄 License
This project is proprietary and for internal use only.

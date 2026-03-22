# 📋 AttendX

AttendX is a modern, high-aesthetic web application designed to track college students' daily attendance seamlessly. Moving away from clunky spreadsheets, AttendX provides an incredibly visual, fast, and feature-rich interface to handle both daily check-ins and late-comer tracking with precision.

## 🚀 How It Works

- **Single Date Workflows**: By default, the app loads exactly into "Today's" table. Teachers can easily switch between individual past/future days using the intuitive Date Navigator (`← Prev` / `Next →`), which auto-creates upcoming dates intelligently.
- **Two-Column Tracking per Day**:
  - **Check-In**: A simple Present/Absent checkbox. Checking this confirms the student attended college.
  - **Arrival (Late Marker)**: If the student arrived, clicking the arrival circle securely stamps the current IT time (IST time).
- **Absent Protection**: If a student is marked as absent, their arrival circle remains strictly disabled to prevent invalid logs.
- **Real-Time Dashboards**: The top Stats Bar summarizes the data of the *currently viewed date*, showing total enrollment metrics, how many are present, how many are exactly on time, and who failed to reach before the bell.

## ⏰ Handling Late Comers & Fines

AttendX automates the penalty process:
- **8:30 AM Rule**: If the stamped block is after 08:30 AM, the badge violently shifts to an orange 🟠 `LATE` marker.
- **Dynamic Fines**: Upon accumulating **3 Late Marks**, a student triggers an Alert threshold. Every 3 late marks equal a **₹50 Fine**. 
- **QR Payment Integrated Modal**: By clicking the alert badge next to the student's name, the teacher can retrieve a dynamic UPI QR Code scanning for the exact fine amount. Marking it as paid resets their individual late tracks.

## 🔥 Manual Streaks

To encourage punctuality, AttendX utilizes a **streak tracking engine** handled entirely by manual tracking:
- When a student is checked in (`Present`), their streak increases automatically by `+1`.
- If the student is ever marked `Late`, the system immediately detects this interaction and resets their ongoing streak permanently string to `0`. 
- Streaks are rewarded visually on the UI next to their late flags.

## 📖 History & Exporting

- **Student-First History Page**: The app includes a gorgeous History toggle that converts the table into a fully searchable timeline by student. It renders precise filters (`Present`, `Absent`, `Late`, `On Time`) alongside colored pill-badges displaying the history.
- **CSV Output**: One-click data export pushes exactly formatted data (Name, Date, Arrival Time, Flags) straight to an actionable `.csv` spreadsheet.

## 🔭 Future Scope

While currently completely client-side utilizing React, Vite, and seamless `localStorage` retention, future paths include:
- **Full Backend Integration**: Implementing PostgreSQL/Node.js to securely sync records centrally.
- **Automated SMS Pipeline**: Connecting Twilio/AWS SNS to instantly message parents when a student is marked Absent or hits the Late threshold.
- **Advanced Admin Analytics**: Introducing line charts and graphical reporting structures to observe trends department-wide over semesters.
- **Biometric Integration**: Tying the Arrival check directly to college server ID tap machines.

---

> Built with React, Vite, and Tailwind CSS.

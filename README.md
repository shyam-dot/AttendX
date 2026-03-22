# 📋 AttendX — College Late & Attendance Tracker

AttendX is a high-performance, aesthetically pleasing React application designed for college departments to track daily student attendance, late entries, and automated fine collections. It features a dark-navy glassmorphism design with electric cyan accents, built for speed and ease of use in the classroom.

---

## 🚀 How It Works

1.  **Select Year & Class**: Choose the specific **Year (1st–4th)** at the top. The Department list below it dynamically updates based on the selected year.
2.  **Mark Attendance**:
    *   **Manual Ticks**: Click the circular button in a student's row under a date column to add a ✅ tick.
    *   **Check-In**: Check the box in the `CHECK-IN` column to stamp the current live time in **IST**.
        *   🟢 **ON TIME**: Before 08:30 AM IST.
        *   🟠 **LATE**: After 08:30 AM IST.
    *   **Select All**: Use the master checkbox in the column header to check in all students simultaneously.
3.  **Automatic Alerts**:
    *   If a student reaches **3 ticks**, their entire row turns **Pulsing Red**.
    *   The `ACTION` column will display a dynamic **Pay Fine** button.
4.  **Fine & QR Logic**:
    *   Fines are calculated incrementally: **₹25 per set of 3 ticks** (e.g., 3 ticks = ₹25, 6 ticks = ₹50).
    *   Clicking "Pay Fine" opens a **QR Payment Modal** with a Google Pay QR code. 
    *   Marking as paid resets the student's ticks to zero and clears the alert status.
5.  **History & Calendar**:
    *   By default, only today's date column is visible. 
    *   Use the **"Show History"** toggle to see all previous attendance dates.
    *   Open the **Calendar Picker** to add specific historical or future date columns to the tracking table.
6.  **Stats & Search**:
    *   The dashboard at the top tracks real-time counts for Present, Late, and Alerted students.
    *   Use the search bar to find students instantly by **Name** or **Roll Number**.
7.  **Data Export**: Click **"Export CSV"** to download a full report of the currently selected class attendance.

---

## 🛠️ Technologies Used

*   **⚡ Vite + React**: Blazing-fast frontend foundation.
*   **🎨 Tailwind CSS**: Modern styling with custom glassmorphism and animations.
*   **💾 LocalStorage**: All data (ticks, dates, check-ins) is persisted locally in the browser, scoped per year and department.
*   **📁 JSON Driven**: Student records are loaded dynamically from department-specific JSON files in `src/data/`.
*   **📅 Custom Logic**: Hand-coded Calendar Picker and IST Time stamping engine.

---

## 🏁 How to Start the Project

1.  **Clone the Repository**:
    ```bash
    git clone [your-repo-link]
    cd attendx-app
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Launch the Dashboard**:
    ```bash
    npm run dev
    ```
4.  **Access Localhost**: Open `http://localhost:5173` in your browser.

---

## ⏹️ How to End the Project

1.  **Stop the Server**: In your terminal/command prompt, press `Ctrl + C` (Windows/Linux) or `Cmd + .` (Mac) and type `y` to terminate the process.
2.  **Clear Local Data (Optional)**: If you wish to reset everything for a fresh start, clear your browser's site data/local storage via F12 Developer Tools.
3.  **Close Files**: Simply exit your IDE (VS Code, etc.) and close the browser tab.

---

## 📂 Project Structure

*   `src/data/`: Contains all student datasets (34 JSON files).
*   `src/components/`: Modular UI elements (Header, AttendanceTable, Modals, etc.).
*   `public/assets/`: Static assets like the Google Pay QR image.
*   `src/App.jsx`: The central state management engine.

AttendX — Built for precision. Built for departments. 🏛️

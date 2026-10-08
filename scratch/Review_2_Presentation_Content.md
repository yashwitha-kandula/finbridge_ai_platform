# FinBridge AI: Smart Financial Intelligence
**Review 2 Presentation Document**

---

## 1. Title Sheet
*   **Project Title:** FinBridge AI (Smart Financial Intelligence)
*   **Domain:** Artificial Intelligence / FinTech
*   **Team Members:** [M1 Name], [M2 Name], [M3 Name], [M4 Name]
*   **Guide:** [Guide Name]

---

## 2. Agenda
1. Problem Identification & Objectives
2. Literature Survey & Research Gap
3. Proposed System & Architecture
4. Methodology & Algorithms
5. Module-wise Description & Progress (Modules 1 to 4 Completed)
6. Tools and Technologies
7. Preliminary Implementation & Screenshots
8. Initial Testing, Challenges, and Solutions
9. Work Distribution (M1, M2, M3, M4)
10. Work Completed vs. Work to be Completed

---

## 3. Problem Identification & Motivation
*   **Identification:** Individuals struggle to track decentralized finances, predict future expenses, and prioritize debt repayment efficiently without expensive professional advisors. 
*   **Motivation:** The rise of AI and LLMs presents an opportunity to democratize financial advising by providing a personalized, predictive, and explainable AI assistant that runs directly on user transaction data.

---

## 4. Problem Statement and Objectives
*   **Problem Statement:** To design and develop an intelligent personal finance management system that processes transaction data to analyze spending patterns, forecast future expenses, and prioritize debt, culminating in an explainable LLM-driven financial assistant.
*   **Objectives:**
    1. Automate transaction categorization and data normalization.
    2. Detect spending anomalies and behavioral trends.
    3. Forecast near-term expenses using time-series analysis.
    4. Optimize debt repayment strategies based on interest burdens.

---

## 5. Literature Survey, Existing System & Research Gap
*   **Existing Systems:** Applications like Mint, YNAB, and traditional banking apps.
*   **Existing Approaches:** Rule-based categorization and static budget tracking.
*   **Limitations/Gaps:** Current systems lack predictive forecasting (relying only on past data), do not offer mathematical debt prioritization, and lack conversational AI that grounds its advice in verified user data (often suffering from LLM hallucinations).

---

## 6. Proposed System & Block Diagram
*   **Proposed System:** A full-stack web application integrating a React dashboard with a Python/FastAPI backend. The backend processes transaction data through ML pipelines (Exponential Smoothing, Anomaly Detection) and feeds this grounded context to an LLM for personalized insights.
*   **Architecture Flow:**
    `User Input/Bank CSV -> Data Processing Pipeline -> ML Forecasting & Analytics Engine -> FastAPI Backend -> React UI / LLM Assistant`

---

## 7. Algorithms & Methodology (Applied to Modules 1-4)
*   **Data Normalization (Module 1):** Min-Max scaling for transaction amounts; One-Hot Encoding for categorical transaction types.
*   **Anomaly Detection (Module 2):** Z-Score algorithm and Rolling Averages (SMA/EMA) to identify anomalous spikes in specific spending categories.
*   **Time-Series Forecasting (Module 3):** **Holt-Winters Exponential Smoothing**. Used to estimate near-term category and total expenses. Evaluated using MAE (Mean Absolute Error) and MAPE (Mean Absolute Percentage Error).
*   **Debt Optimization (Module 4):** **Avalanche Algorithm**. Computes outstanding principal and estimated interest burden, ranking obligations mathematically by highest interest rate to minimize total repayment impact.

---

## 8. Module-wise Description & Progress
*(As per project schedule, Modules 1 to 4 have been successfully implemented in the preliminary phase).*

*   **Module 1: Data Processing & Features (Completed):** Normalized transactions, aggregated data by day/week/month, and engineered features for categories, cash-flow, and goals.
*   **Module 2: Spending Pattern Analysis (Completed):** Implemented rolling averages, calculated category shares (visualized in React pie charts), and integrated logic for recurring-expense detection.
*   **Module 3: Expense Forecasting (Completed):** Applied time-series forecasting to predict future expenses, visualized on the frontend using responsive Recharts Area/Composed graphs.
*   **Module 4: Debt Prioritization (Completed):** Built logic to compute interest burdens and rank obligations, visualized in the UI via the "Upcoming Bills" and "Liabilities" components.
*   **Module 5: Personalized Recommendation (Pending):** Rule/score-based logic combining inputs to generate actions.
*   **Module 6: LLM Financial Assistant (Pending):** Tool-grounded prompting to retrieve verified calculations and prevent LLM arithmetic hallucinations.

---

## 9. Tools and Technologies Used
*   **Frontend Development:** React.js, Vite, Tailwind CSS, Recharts (for dynamic data visualization), Lucide-React (Icons).
*   **Backend & Data Processing:** Python, FastAPI, Pandas, NumPy, Scikit-learn, Statsmodels (for Exponential Smoothing).
*   **AI Integration:** Google Gemini LLM API (planned for Module 6).
*   **Tools:** Git, VS Code, npm.

---

## 10. Preliminary Implementation & Prototype Demonstration
*   **Dashboard Interface:** Fully responsive UI featuring top KPI cards, a Gradient Area chart for Income vs. Expense trends, and a dynamically scaling Donut chart for Expense Breakdown.
*   **Forecast & Analytics Interface:** Specialized layout featuring composed charts, Radar charts for Financial Health scoring, and future trajectory mapping.
*   **Interactive Components:** Modals for adding goals/expenses, and a unified Dark/Light mode theme system using Tailwind.

---

## 11. Initial Testing, Challenges Encountered, and Solutions
*   **Challenge 1: Responsive Chart Clipping:** Recharts SVG components were blowing out CSS Grid constraints on smaller screens, causing overlapping text and clipped pie charts.
    *   *Solution:* Enforced `min-w-0` on CSS Grid columns, rewrote the Gauge chart into a custom viewBox-constrained SVG, and transitioned to percentage-based radii (`innerRadius="65%"`).
*   **Challenge 2: State Management for Interactive Data:** Managing live updates across disparate components (like adding a Goal and seeing the progress bar instantly update).
    *   *Solution:* Implemented a unified React Context (`DashboardContext`) to manage global dashboard state and seamlessly trigger re-renders upon data mutation.

---

## 12. Team Work Distribution & Roles
To ensure parallel development and comprehensive project management, tasks were distributed as follows:

*   **M1 (Frontend Developer):** 
    *   Designed and implemented the React UI (Dashboard, Forecast interfaces).
    *   Integrated Tailwind CSS, Dark Mode, and Recharts for data visualization.
*   **M2 (Backend & Data Engineer):** 
    *   Developed the FastAPI backend architecture.
    *   Built **Module 1** (Data Processing) and **Module 2** (Spending Analysis) data pipelines using Pandas.
*   **M3 (ML & Algorithm Specialist):** 
    *   Researched and implemented the core logic.
    *   Built **Module 3** (Exponential Smoothing for Forecasting) and **Module 4** (Debt Prioritization mathematical ranking).
*   **M4 (Documentation, QA & Misc Support - Standby):** 
    *   Led the Literature Survey and gathered research papers (IEEE, Springer).
    *   Managed formatting for Review 1 & Review 2 presentations.
    *   Conducted Initial Testing (UI layout testing, dark mode checks) and documented "Challenges & Solutions".
    *   Serves as standby for unblocking peers and managing the upcoming project report submission.

---

## 13. Work Completed vs. Work to be Completed
*   **Work Completed:**
    *   Full UI/UX Frontend implementation (Dashboard, Forecast, Expenses).
    *   Modules 1, 2, 3, and 4 (Data processing, pattern analysis, statistical forecasting, debt logic).
    *   Chart responsiveness and theme integrations.
*   **Work to be Completed (For Review 3):**
    *   **Module 5:** Finalizing personalized rule-based recommendation logic.
    *   **Module 6:** Full API integration of the LLM Financial Assistant using tool-grounded prompting.
    *   End-to-End integration testing and Final Report generation.

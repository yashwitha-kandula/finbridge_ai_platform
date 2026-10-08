import streamlit as st
import requests
import pandas as pd
import altair as alt

st.set_page_config(page_title="FinBridge AI", page_icon="💰", layout="wide")
API_BASE = "http://localhost:8000"

# --- Session State Initialization ---
if "demo_data" not in st.session_state:
    try:
        st.session_state.demo_data = requests.get(f"{API_BASE}/api/demo/dataset").json()
    except:
        st.session_state.demo_data = None

if "custom_transactions" not in st.session_state:
    st.session_state.custom_transactions = pd.DataFrame([
        {"date": "2026-10-01", "type": "Income", "category": "Salary", "amount": 45000},
        {"date": "2026-10-02", "type": "Expense", "category": "Rent", "amount": 15000},
        {"date": "2026-10-05", "type": "Expense", "category": "Groceries", "amount": 4000}
    ])
    st.session_state.custom_loans = pd.DataFrame([
        {"loan_id": 1, "lender": "Personal Loan", "principal": 50000, "outstanding_balance": 45000, "interest_rate": 10.5}
    ])
    st.session_state.custom_goals = pd.DataFrame([
        {"name": "Vacation", "target_amount": 50000, "current_amount": 10000, "target_date": "2027-01-01"}
    ])
    st.session_state.custom_history = "14000, 15500, 18000, 16000, 19000"

# --- Sidebar ---
st.sidebar.title("💰 FinBridge AI")
mode = st.sidebar.radio("🔌 Operating Mode", ["Demo (Simulated Data)", "Live (Custom Input)"])

st.sidebar.divider()
page = st.sidebar.radio("Navigation", [
    "Dashboard", 
    "Data Manager", 
    "Analytics", 
    "Forecast", 
    "Debt Priority", 
    "Goals", 
    "Recommendations", 
    "AI Assistant"
])

# --- Data Selection Logic ---
if mode == "Demo (Simulated Data)":
    if not st.session_state.demo_data:
        st.error("Backend not reachable. Is FastAPI running on port 8000?")
        st.stop()
    tx_list = st.session_state.demo_data["transactions"]
    loans_list = st.session_state.demo_data["loans"]
    goals_list = st.session_state.demo_data["goals"]
    history_list = st.session_state.demo_data["monthly_expenses_history"]
else:
    tx_list = st.session_state.custom_transactions.to_dict('records')
    loans_list = st.session_state.custom_loans.to_dict('records')
    goals_list = st.session_state.custom_goals.to_dict('records')
    try:
        history_list = [int(x.strip()) for x in st.session_state.custom_history.split(",") if x.strip()]
    except:
        history_list = []

# --- API Fetching ---
analysis = None
forecast = None
goals_res = None

def fetch_analytics():
    try:
        a = requests.post(f"{API_BASE}/api/m2/analysis", json={"transactions": tx_list, "loans": loans_list})
        if a.status_code != 200:
            st.error(f"Analytics Error: {a.text}")
            return None, None, None
        a_data = a.json()
        
        f_data = None
        if len(history_list) >= 2:
            f = requests.post(f"{API_BASE}/api/forecast", json={"monthly_expenses": history_list})
            if f.status_code == 200:
                f_data = f.json()
                
        inc = a_data["summary"].get("total_income", 0)
        g = requests.post(f"{API_BASE}/api/goals/analyze?monthly_income={inc}", json=goals_list)
        g_data = g.json() if g.status_code == 200 else {"goals": []}
        
        return a_data, f_data, g_data
    except Exception as e:
        st.error(f"Backend connection failed: {e}")
        return None, None, None

def INR(value):
    return f"₹{value:,.0f}"

# ---------------------------------------------------------
# PAGE: Data Manager (The "Live Application" Input)
# ---------------------------------------------------------
if page == "Data Manager":
    st.title("🗂️ Live Data Manager")
    st.write("Edit the tables below. The AI and Analytics engines will instantly update to reflect your inputs!")
    
    if mode == "Demo (Simulated Data)":
        st.warning("You are currently in **Demo Mode**. Switch to **Live (Custom Input)** in the sidebar to edit data.")
        st.dataframe(pd.DataFrame(tx_list), use_container_width=True)
    else:
        st.subheader("1. Transactions")
        st.session_state.custom_transactions = st.data_editor(
            st.session_state.custom_transactions, num_rows="dynamic", use_container_width=True
        )
        
        st.subheader("2. Active Loans")
        st.session_state.custom_loans = st.data_editor(
            st.session_state.custom_loans, num_rows="dynamic", use_container_width=True
        )
        
        st.subheader("3. Financial Goals")
        st.session_state.custom_goals = st.data_editor(
            st.session_state.custom_goals, num_rows="dynamic", use_container_width=True
        )
        
        st.subheader("4. Historical Monthly Expenses")
        st.write("Enter past monthly expense totals separated by commas (minimum 2 months required for forecasting).")
        st.session_state.custom_history = st.text_input("History (e.g. 15000, 16000, 15500)", st.session_state.custom_history)

# ---------------------------------------------------------
# PAGE: Dashboard
# ---------------------------------------------------------
elif page == "Dashboard":
    st.title("Dashboard Overview")
    analysis, forecast, goals_res = fetch_analytics()
    if not analysis: st.stop()
    
    s = analysis["summary"]
    h = analysis["financial_health"]
    
    # Top Metrics
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Income", INR(s["total_income"]))
    col2.metric("Total Expenses", INR(s["total_expense"]), f"{s['expense_ratio']}% of income", delta_color="inverse")
    col3.metric("Savings", INR(s["savings"]), f"{s['savings_rate']}% rate")
    col4.metric("Financial Health", f"{h['score']}/100", h["status"], delta_color="off")
    
    st.divider()
    
    # Charts
    colA, colB = st.columns(2)
    with colA:
        st.subheader("Income vs Expense vs Savings")
        chart_data = pd.DataFrame({
            "Amount": [s["total_income"], s["total_expense"], s["savings"]],
            "Category": ["Income", "Expense", "Savings"]
        }).set_index("Category")
        st.bar_chart(chart_data)
        
    with colB:
        st.subheader("Spending by Category")
        if analysis["categories"]:
            cat_data = pd.DataFrame([
                {"Category": k, "Amount": v} for k, v in analysis["categories"].items()
            ])
            # Replaced st.pie_chart with an Altair Arc Chart
            pie = alt.Chart(cat_data).mark_arc(innerRadius=40).encode(
                theta=alt.Theta(field="Amount", type="quantitative"),
                color=alt.Color(field="Category", type="nominal"),
                tooltip=["Category", "Amount"]
            ).properties(height=300)
            st.altair_chart(pie, use_container_width=True)
        else:
            st.info("No expenses found.")

# ---------------------------------------------------------
# PAGE: Analytics
# ---------------------------------------------------------
elif page == "Analytics":
    st.title("Spending Analysis")
    analysis, _, _ = fetch_analytics()
    if not analysis: st.stop()
    
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Category Breakdown")
        for cat, amt in analysis["categories"].items():
            pct = (amt / (analysis["summary"]["total_expense"] or 1)) * 100
            st.write(f"**{cat}**: {INR(amt)} ({pct:.1f}%)")
            st.progress(min(pct / 100.0, 1.0))
            
    with col2:
        st.subheader("⚠️ High-Value Alerts (≥ ₹10,000)")
        if not analysis["alerts"]:
            st.success("No high-value alerts.")
        else:
            for a in analysis["alerts"]:
                st.error(f"{a['date']} — **{a['category']}**: {INR(a['amount'])}")

# ---------------------------------------------------------
# PAGE: Forecast
# ---------------------------------------------------------
elif page == "Forecast":
    st.title("Expense Forecast")
    _, forecast, _ = fetch_analytics()
    
    if not forecast:
        st.warning("Not enough historical data to generate a forecast. Please provide at least 2 months of history in the Data Manager.")
    else:
        st.info(f"Method: {forecast['method']}\n\nNote: {forecast['note']}")
        col1, col2, col3 = st.columns(3)
        col1.metric("Predicted Next Month", INR(forecast["forecast"]))
        col2.metric("Optimistic (Low)", INR(forecast["forecast_low"]))
        col3.metric("Conservative (High)", INR(forecast["forecast_high"]))
        
        st.divider()
        colA, colB, colC = st.columns(3)
        colA.metric("Months of History Used", forecast["input_months"])
        colB.metric("Backtest MAE", INR(forecast["mae_estimate"]) if forecast["mae_estimate"] is not None else "N/A")
        colC.metric("Backtest MAPE", f"{forecast['mape_pct']}%" if forecast.get("mape_pct") is not None else "N/A")

# ---------------------------------------------------------
# PAGE: Debt Priority
# ---------------------------------------------------------
elif page == "Debt Priority":
    st.title("Debt Prioritization (Avalanche Method)")
    analysis, _, _ = fetch_analytics()
    if not analysis: st.stop()
    
    st.caption(f"Total Outstanding: {INR(analysis['debt']['total_outstanding'])} | Estimated Annual Interest: {INR(analysis['debt']['estimated_annual_interest'])}")
    
    if not analysis["debt"]["priority_order"]:
        st.success("No active debts found. Great job!")
        
    for i, loan in enumerate(analysis["debt"]["priority_order"]):
        with st.container(border=True):
            cols = st.columns([3, 1])
            with cols[0]:
                st.subheader(f"#{i+1}: {loan['lender']}")
                st.write(f"Outstanding: **{INR(loan['outstanding_balance'])}** (Principal: {INR(loan['principal'])})")
            with cols[1]:
                st.subheader(f"🔴 {loan['interest_rate']}% p.a.")
                interest_cost = loan['outstanding_balance'] * loan['interest_rate'] / 100
                st.caption(f"{INR(interest_cost)}/yr interest")

# ---------------------------------------------------------
# PAGE: Goals
# ---------------------------------------------------------
elif page == "Goals":
    st.title("Financial Goals")
    _, _, goals_res = fetch_analytics()
    if not goals_res: st.stop()
    
    st.info(goals_res.get("feasibility_note", ""))
    
    if not goals_res.get("goals"):
        st.warning("No financial goals set. Add some in the Data Manager!")
        
    for g in goals_res.get("goals", []):
        with st.container(border=True):
            st.subheader(f"{g['name']} — {g['feasibility']}")
            st.write(f"Saved: {INR(g['current_amount'])} / {INR(g['target_amount'])} (Target: {g['target_date']})")
            st.progress(min(g['progress_pct'] / 100.0, 1.0))
            st.caption(f"Progress: {g['progress_pct']}% | Required Monthly: {INR(g['required_monthly_contribution']) if g['required_monthly_contribution'] else 'N/A'}")

# ---------------------------------------------------------
# PAGE: Recommendations
# ---------------------------------------------------------
elif page == "Recommendations":
    st.title("Recommendations & Insights")
    analysis, _, _ = fetch_analytics()
    if not analysis: st.stop()
    
    if not analysis["recommendations"]:
        st.success("No critical recommendations at this time. Your finances look stable!")
    
    for r in analysis["recommendations"]:
        if r["priority"] == "high":
            st.error(f"**{r['title']}**\n\n{r['message']}\n\n*Reason:* {r['reason']}")
        elif r["priority"] == "medium":
            st.warning(f"**{r['title']}**\n\n{r['message']}\n\n*Reason:* {r['reason']}")
        else:
            st.info(f"**{r['title']}**\n\n{r['message']}\n\n*Reason:* {r['reason']}")

# ---------------------------------------------------------
# PAGE: AI Assistant
# ---------------------------------------------------------
elif page == "AI Assistant":
    st.title("🤖 AI Financial Assistant")
    st.caption("Grounded, rule-based AI that only answers using your actual data.")
    
    if "messages" not in st.session_state:
        st.session_state.messages = [{"role": "assistant", "content": "Ask me about your finances! Try: 'How much did I spend?' or 'Which loan should I prioritize?'"}]

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("Ask a financial question..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                payload = {
                    "question": prompt,
                    "transactions": tx_list,
                    "loans": loans_list,
                    "goals": goals_list,
                    "monthly_expenses_history": history_list
                }
                try:
                    r = requests.post(f"{API_BASE}/api/ai/chat", json=payload).json()
                    ans = r.get("answer", "Error parsing AI response.")
                    if r.get("data_source"):
                        ans += f"\n\n*(Source: {r['data_source']})*"
                    st.markdown(ans)
                    st.session_state.messages.append({"role": "assistant", "content": ans})
                except Exception as e:
                    st.error(f"Error communicating with AI endpoint: {e}")

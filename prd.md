🧾 PRODUCT REQUIREMENTS DOCUMENT (PRD v1.1)
1. Executive Summary
A web-based expense tracker that allows users to paste Kaspi.kz transaction text (single or multiple) and automatically convert it into structured financial data using rule-based parsing (no AI).
The product’s core value:
⚡ Fastest way to log expenses via copy-paste
2. Product Vision
To create a frictionless expense tracking experience where:
Users never manually type transactions
Input takes <3 seconds
Parsing is predictable and reliable
3. Target Users
Primary: Kaspi Power User (Kazakhstan)
Uses Kaspi daily
Copies transaction history / SMS
Wants control without complexity
4. Problem Statement
Users currently:
Copy transaction info → manually re-enter it
Waste time on repetitive actions
Avoid tracking due to friction
Existing apps:
Not optimized for paste input
Too slow or overloaded with features
5. Solution Overview
User pastes:
Case A — Single:
Покупка: 36 035 ₸
В Магазине на Kaspi.kz
Доступно: 44 155,51 ₸
Case B — Multiple:
Покупка: 36 035 ₸
...
Перевод: 20 000 ₸
...
Пополнение: 61 088 ₸
...
System:
Splits input into blocks
Detects type per block
Extracts amount
Creates multiple transactions
6. Success Metrics
⏱ Input time < 3 sec
📥 Paste usage > 80%
🎯 Parsing accuracy > 95%
❌ Error rate < 5%
7. Feature Requirements
🔥 Feature 1: Smart Paste Input (CORE)
Description:
One textarea for all input
Supports single & bulk paste
Behavior:
Auto-detects multiple transactions
Splits into blocks
🔥 Feature 2: Transaction Splitter (CORE LOGIC)
Description:
Splits pasted text into transactions
Logic:
Each transaction starts with:
"Покупка:"
"Перевод:"
"Пополнение:"
Example Output:
[Block1, Block2, Block3]
🔥 Feature 3: Kaspi Parser Engine (CORE)
Parsing Rules:
Detect Type:
"Покупка" → expense
"Перевод" → transfer
"Пополнение" → income
Extract Amount:
Pattern: \d[\d\s]*
Remove spaces → number
Ignore:
"Доступно"
extra lines
🔥 Feature 4: Preview Before Save
Description:
After parsing:
Show list of transactions
User can:
Edit
Delete
Confirm
👉 This is VERY important for trust
Feature 5: Transaction Storage
MVP Decision:
👉 Use local storage (browser)
No backend yet.
Feature 6: History Page
List all transactions
Sorted by date
Basic filters
Feature 7: Analytics (Simple)
Total income
Total expense
Balance
8. Non-functional Requirements
⚡ Parsing < 300ms
📱 Mobile-friendly UI
🔒 100% local (privacy)
🧠 Deterministic logic (no AI)
9. Constraints
Only Kaspi format (MVP)
No backend
No accounts
No AI
10. Release Plan
✅ MVP (Focus!)
Paste input
Split + parse
Preview UI
Save locally
History
Basic stats
11. Final Tech Stack Decision (IMPORTANT)
I’m choosing this for you based on your level and speed:
✅ Frontend:
👉 Next.js (React)
Why:
Easy routing
Scalable later
Works as pure frontend
Huge ecosystem
✅ State & Storage:
localStorage (simple)
later: IndexedDB
✅ Styling:
Tailwind CSS (fast UI)
❌ No backend yet
12. System Architecture (Simple)
[Textarea Input]
        ↓
[Splitter Logic]
        ↓
[Parser Engine]
        ↓
[Preview UI]
        ↓
[Save → localStorage]
        ↓
[History + Analytics]
13. 🔧 Parsing Logic (THIS IS WHAT YOU’LL CODE)
Step 1: Split Transactions
Split by keywords:
const blocks = text.split(/(?=Покупка:|Перевод:|Пополнение:)/);
Step 2: Detect Type
if (block.includes("Покупка")) type = "expense";
if (block.includes("Перевод")) type = "transfer";
if (block.includes("Пополнение")) type = "income";
Step 3: Extract Amount
const match = block.match(/\d[\d\s]*/);
const amount = parseInt(match[0].replace(/\s/g, ""));
14. UI Structure (Frontend)
Pages:
1. Main Page
Paste input
Parse button
Preview list
2. History Page
Transactions list
Components:
PasteBox
TransactionPreviewList
TransactionItem
StatsCard
15. Critical Risks
⚠️ 1. Parsing breaks
Solution:
Keep formats strict
Add logs/debug
⚠️ 2. User confusion
Solution:
Always show preview before saving
🚀 Final Product Positioning
Refined version:
“The fastest expense tracker — just paste your Kaspi transactions and you’re done.”
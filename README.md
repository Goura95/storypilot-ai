# 🚀 StoryPilot AI

### Multi-Agent Generative AI Platform for Intelligent Software Requirement Engineering

StoryPilot AI is a full-stack **Generative AI (GenAI)** and **Agentic AI** platform that transforms software requirements into structured, production-oriented user stories.

Instead of generating a simple user story from a prompt, StoryPilot AI uses a coordinated multi-agent workflow to analyze a requirement from multiple software engineering perspectives, including **Product Management, Business Analysis, Technical Analysis, Quality Assurance, Risk Analysis, and Story Point Estimation**.

The platform consolidates these specialized outputs into a single structured user story containing acceptance criteria, business analysis, technical analysis, risks, estimation, test scenarios, and traceability.

---

## 🎯 Project Objective

Software requirements often need to be analyzed by multiple stakeholders before they are ready for development and testing.

A typical requirement may require:

* Product Manager analysis
* Business requirement analysis
* Technical feasibility analysis
* Risk assessment
* Story point estimation
* Acceptance criteria
* Quality Assurance test scenarios
* Requirement-to-test traceability
* Final quality review

StoryPilot AI automates this workflow using specialized AI agents.

### Traditional Workflow

```text
Requirement
     ↓
Product Manager
     ↓
Business Analyst
     ↓
Technical Team
     ↓
QA Team
     ↓
Risk Review
     ↓
Estimation
     ↓
Final User Story
```

### StoryPilot AI Workflow

```text
                    ┌──────────────────────┐
                    │   Software Requirement│
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ Agent Orchestrator   │
                    └──────────┬───────────┘
                               ↓
        ┌──────────────────────┼──────────────────────┐
        ↓                      ↓                      ↓
┌───────────────┐      ┌────────────────┐      ┌─────────────────┐
│ Product       │      │ Business       │      │ Technical       │
│ Manager Agent │      │ Analyst Agent  │      │ Agent           │
└───────┬───────┘      └───────┬────────┘      └────────┬────────┘
        │                      │                        │
        └──────────────────────┼────────────────────────┘
                               ↓
                 ┌──────────────────────────┐
                 │      QA Agent             │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │      Risk Agent           │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │   Story Point Agent       │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │    Review Agent           │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ Consolidated Agent        │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ Production-Ready Story   │
                 └──────────────────────────┘
```

---

# ✨ Key Features

## 🤖 Multi-Agent AI Architecture

StoryPilot AI uses specialized AI agents instead of relying on a single generic generation prompt.

### Product Manager Agent

Analyzes:

* Feature intent
* Product outcome
* User role
* Business value
* Product requirements
* Scope

### Business Analyst Agent

Generates:

* Requirement summary
* Business rules
* Preconditions
* Assumptions
* Dependencies
* Edge cases
* Clarification questions
* Requirement quality assessment

### Technical Agent

Analyzes:

* Frontend changes
* Backend changes
* Database changes
* APIs
* Integrations
* Technical dependencies
* Error handling
* Logging
* Monitoring
* Performance considerations

### QA Agent

Generates:

* Acceptance criteria
* Functional test scenarios
* Negative tests
* Validation tests
* Security tests
* Integration tests
* Concurrency tests
* Error-handling scenarios
* Traceability between acceptance criteria and test cases

### Risk Agent

Identifies:

* Functional risks
* Security risks
* Integration risks
* Performance risks
* Concurrency risks
* Risk impact
* Risk likelihood
* Mitigation strategies

### Story Point Agent

Analyzes complexity based on factors such as:

* Number of components
* Integrations
* Workflow complexity
* Security requirements
* Testing effort
* Technical complexity

### Review Agent

Performs quality evaluation of the generated story and identifies areas requiring improvement.

### Consolidated Agent

Combines outputs from the specialized agents into one structured user story.

---

# 🧠 Agentic AI Workflow

The core concept of StoryPilot AI is **agent orchestration**.

Instead of:

```text
Prompt → LLM → Answer
```

StoryPilot AI follows:

```text
Requirement
     ↓
Orchestrator
     ↓
Specialized Agents
     ↓
Independent Analysis
     ↓
Cross-Agent Consolidation
     ↓
Quality Review
     ↓
Final Structured Output
```

This architecture allows the system to simulate a collaborative software engineering workflow.

---

# 📋 Generated User Story Structure

StoryPilot AI can generate structured requirements containing:

### Product Information

* Story ID
* Title
* Feature
* Module
* Priority
* Story Type
* User Role
* Complexity
* Story Points

### Product Analysis

* User Story
* Business Value
* Product Outcome
* Assumptions
* Dependencies

### Acceptance Criteria

Structured **Given / When / Then** acceptance criteria with unique identifiers.

Example:

```text
AC001

Given: Employee is authenticated

When: Employee opens the request form

Then: The system displays all mandatory fields
```

### Business Analysis

* Requirement Summary
* Requirement Quality
* Business Rules
* Preconditions
* Edge Cases
* Clarification Questions

### Technical Analysis

* Technical Summary
* Frontend Changes
* Backend Changes
* Database Changes
* Integrations
* Technical Dependencies
* Technical Assumptions
* Error Handling
* Logging & Monitoring
* Performance Considerations

### QA Coverage

* Test Case ID
* Acceptance Criteria mapping
* Scenario
* Test Type
* Preconditions
* Steps
* Test Data
* Expected Result
* Priority

### Traceability

```text
Requirement
     ↓
User Story
     ↓
Acceptance Criteria
     ↓
Test Cases
```

This provides end-to-end requirement traceability.

---

# 🧪 QA and Test Coverage

StoryPilot AI is designed to generate more than basic happy-path tests.

Depending on requirement complexity, generated scenarios can include:

| Test Category | Example                     |
| ------------- | --------------------------- |
| Functional    | Valid request submission    |
| Validation    | Missing mandatory field     |
| Negative      | Duplicate request           |
| Security      | Unauthorized approval       |
| Authorization | Role-based access           |
| Integration   | External service failure    |
| Recovery      | Network timeout             |
| Concurrency   | Simultaneous approval       |
| Performance   | Large request volume        |
| UI            | Search and filtering        |
| Accessibility | Keyboard navigation         |
| Audit         | Audit record validation     |
| Workflow      | Multi-stage approval        |
| Expiry        | Automatic access revocation |

---

# 🏗️ Technical Architecture

```text
┌────────────────────────────────────────────┐
│              Next.js Frontend              │
│                                            │
│  Landing Page                              │
│  Authentication                            │
│  MFA                                       │
│  Dashboard                                 │
│  Story Creation                            │
│  Story Management                          │
│  Analytics                                 │
│  Profile & Sessions                        │
└───────────────────┬────────────────────────┘
                    │
                    │ REST API
                    ↓
┌────────────────────────────────────────────┐
│              FastAPI Backend               │
│                                            │
│  Authentication APIs                       │
│  Story APIs                                │
│  Analytics APIs                            │
│  Profile APIs                              │
│  Session APIs                              │
└───────────────────┬────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│             Agent Orchestrator             │
│                                            │
│  Product Manager Agent                    │
│  Business Analyst Agent                   │
│  Technical Agent                           │
│  QA Agent                                  │
│  Risk Agent                                │
│  Story Point Agent                         │
│  Review Agent                              │
│  Consolidated Agent                       │
└───────────────────┬────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│              LLM Service                   │
│                                            │
│          Generative AI Model               │
└───────────────────┬────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│               Data Layer                   │
│                                            │
│  Users                                      │
│  Sessions                                   │
│  Stories                                    │
│  Analytics                                  │
└────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Radix UI**
* **shadcn/ui**

## Backend

* **Python**
* **FastAPI**
* **Uvicorn**
* **SQLAlchemy**

## Artificial Intelligence

* **Generative AI**
* **Agentic AI**
* **Multi-Agent Architecture**
* **LLM-based requirement analysis**
* **Prompt engineering**
* **Agent orchestration**

## Database

* **SQLite**
* **SQLAlchemy ORM**

## Authentication & Security

* Authentication
* Session management
* Multi-Factor Authentication (MFA)
* Protected routes
* Authorization
* Secure password handling

## Development Tools

* Git
* GitHub
* Visual Studio Code
* Postman
* PowerShell

---

# 📁 Project Structure

```text
StoryPilotAI/
│
├── backend/
│   │
│   ├── app/
│   │   ├── agents/
│   │   │   ├── business_analyst_agent.py
│   │   │   ├── consolidated_agent.py
│   │   │   ├── orchestrator.py
│   │   │   ├── product_manager_agent.py
│   │   │   ├── qa_agent.py
│   │   │   ├── review_agent.py
│   │   │   ├── risk_agent.py
│   │   │   ├── story_point_agent.py
│   │   │   └── technical_agent.py
│   │   │
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── main.py
│   ├── quick_test.py
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── mfa/
│   │   └── register/
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── ui/
│   │
│   ├── services/
│   ├── utils/
│   ├── lib/
│   ├── package.json
│   └── next.config.ts
│
├── .gitignore
└── README.md
```

---

# 🔐 Authentication & Security

StoryPilot AI includes application-level authentication functionality.

Implemented areas include:

* User registration
* User login
* Password security
* Session management
* Multi-Factor Authentication (MFA)
* Authentication guards
* Protected dashboard routes
* Active session management
* Profile management

Sensitive configuration values should be stored in environment variables.

Example:

```env
AI_API_KEY=your_api_key
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

**Never commit `.env` files or API keys to GitHub.**

---

# 📊 Dashboard

The dashboard provides access to the major StoryPilot AI capabilities.

### Dashboard Features

* Story creation
* Story history
* Story details
* Story editing
* Analytics
* Profile management
* Active sessions
* Authentication management

---

# 📈 Analytics

StoryPilot AI includes an analytics section for monitoring generated stories and application usage.

Potential metrics include:

* Stories generated
* Story distribution
* Usage trends
* Story complexity
* Generation activity

---

# 📄 Export

Generated stories can be exported into document formats for use in development and product workflows.

Supported export functionality includes:

* PDF
* Word document

This allows generated requirements to be transferred into existing documentation and development workflows.

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Python 3.11+
* Node.js
* npm
* Git

---

# 1. Clone the Repository

```bash
git clone https://github.com/Goura95/storypilot-ai.git
```

```bash
cd storypilot-ai
```

---

# 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### Windows

```powershell
python -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

# 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
SECRET_KEY=your_secret_key
AI_API_KEY=your_ai_api_key
```

Use the environment variable names expected by your backend configuration.

---

# 4. Start the Backend

From the `backend` directory:

```powershell
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 5. Frontend Setup

Open another terminal.

Navigate to:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🔄 Example Workflow

A typical StoryPilot AI workflow:

### Step 1 — Enter Requirement

Example:

```text
Create a temporary privileged access request system
where employees can request production access and
approval depends on risk level.
```

### Step 2 — Agent Analysis

The orchestrator distributes the requirement to specialized agents.

```text
Requirement
     ↓
Orchestrator
     ↓
PM ─ BA ─ Technical ─ QA ─ Risk ─ Estimation
     ↓
Review
     ↓
Consolidation
```

### Step 3 — Generate Story

The platform generates:

```text
User Story
     +
Business Value
     +
Acceptance Criteria
     +
Business Analysis
     +
Technical Analysis
     +
Risk Analysis
     +
Story Points
     +
QA Test Cases
     +
Traceability
```

### Step 4 — Quality Review

The generated story receives a quality evaluation and improvement recommendations.

---

# 💡 Example Generated Requirement

### Requirement

```text
Employees need temporary privileged access to production
applications for authorized maintenance activities.
Access must be risk-assessed, approved, provisioned and
automatically revoked after expiry.
```

### StoryPilot AI Output

```text
User Story
Acceptance Criteria
Business Rules
Technical Analysis
Risk Analysis
Story Point Estimate
QA Test Scenarios
Traceability
Quality Review
```

---

# 🧠 Why Multi-Agent AI?

A single LLM prompt can generate a user story, but complex software requirements require multiple perspectives.

StoryPilot AI separates these responsibilities.

```text
PM Agent
   ↓
"What should the product do?"

BA Agent
   ↓
"What are the business rules?"

Technical Agent
   ↓
"How can the system implement it?"

QA Agent
   ↓
"How can we verify it?"

Risk Agent
   ↓
"What can go wrong?"

Story Point Agent
   ↓
"How complex is the work?"

Review Agent
   ↓
"Is the generated requirement good enough?"

Consolidated Agent
   ↓
"What is the final requirement?"
```

This makes the output more structured and closer to an actual software development lifecycle.

---

# 🎯 Target Use Cases

StoryPilot AI can be used for:

* Software requirement analysis
* Agile user story generation
* Product requirement documentation
* Acceptance criteria generation
* QA test scenario generation
* Technical requirement analysis
* Risk assessment
* Story point estimation
* Requirement traceability
* Development planning

---

# 👨‍💻 Skills Demonstrated

This project demonstrates practical experience with:

### Generative AI

* LLM integration
* Prompt engineering
* Structured AI output
* Multi-agent workflows
* Agent orchestration
* AI response consolidation
* AI quality evaluation

### Python

* FastAPI
* API development
* Service architecture
* Database integration
* Authentication
* AI service integration

### Full-Stack Development

* Next.js
* React
* TypeScript
* REST APIs
* Frontend/backend integration
* Authentication flows
* Dashboard development

### Software Engineering

* Requirement engineering
* Business analysis
* Technical analysis
* Quality assurance
* Risk analysis
* Agile methodology
* Requirement traceability

---

# 🔮 Future Improvements

Potential future improvements include:

* Retrieval-Augmented Generation (RAG)
* Vector database integration
* Enterprise document ingestion
* Jira integration
* Azure DevOps integration
* GitHub integration
* Advanced agent memory
* Human-in-the-loop approval
* Streaming AI responses
* Agent execution tracing
* Model evaluation framework
* Automated regression testing
* Cloud deployment
* Docker containerization
* CI/CD pipeline
* Production-grade PostgreSQL deployment
* Role-based enterprise administration

---

# 🧪 Quality & Reliability

StoryPilot AI emphasizes structured and testable output through:

* Acceptance criteria
* Requirement traceability
* QA test generation
* Risk analysis
* Quality scoring
* Error handling
* Authentication
* Authorization
* Concurrency considerations
* Integration testing

The generated output should still be reviewed by a qualified Product Manager, Business Analyst, Developer, or QA Engineer before being treated as a production requirement.

---

# 📌 Project Status

**Status:** Active Development

StoryPilot AI is currently being developed as a portfolio-grade **Generative AI and Agentic AI application** demonstrating how AI agents can automate parts of the software requirement engineering lifecycle.

---

# 👤 Author

## Goura

**Software Developer | Generative AI | Agentic AI | Full-Stack Development**

GitHub:

https://github.com/Goura95

Project:

https://github.com/Goura95/storypilot-ai

---

# ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub.

---

## 📜 License

This project is intended for educational, portfolio, and demonstration purposes.

Add an appropriate open-source license before distributing the project commercially.

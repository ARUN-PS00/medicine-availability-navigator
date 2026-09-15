MAP — Overview and Detail

📌 Project Overview

MAP (Medicine Availability Platform) is a medicine availability and navigation system designed to help users quickly identify pharmacies where a required medicine may be available.

The project addresses a common problem: when a person needs a specific medicine, they may not know which nearby pharmacy has it in stock. This can lead to unnecessary phone calls, travel, and delays.

MAP aims to provide a centralized interface where users can search for medicines and view relevant pharmacy and availability information through a simple and accessible client-side application.

⸻

🎯 Problem Statement

Finding a required medicine can be difficult when availability information is distributed across multiple pharmacies.

Users may have to:

* Visit multiple pharmacies.
* Call pharmacies individually.
* Spend additional time searching for medicines.
* Travel unnecessarily when a medicine is unavailable.
* Deal with incomplete or outdated availability information.

MAP is designed to reduce this difficulty by connecting medicine searches with structured pharmacy and inventory information.

⸻

💡 Proposed Solution

MAP provides a system where:

1. A user searches for a required medicine.
2. The system processes the search through the application/backend.
3. Relevant pharmacy and inventory information is retrieved.
4. The user can view the available information in a clear interface.
5. The user can use the information to identify a suitable pharmacy.

The system is designed with separate Client and Admin interfaces.

⸻

🏗️ System Architecture

The project consists of multiple major layers:

                    ┌─────────────────────┐
                    │       CLIENT        │
                    │    Web Interface    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       BACKEND       │
                    │   API / Application │
                    │       Logic         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      DATABASE       │
                    │ Pharmacy + Medicine │
                    │     Inventory       │
                    └─────────────────────┘
                    ┌─────────────────────┐
                    │       ADMIN         │
                    │ Management Interface│
                    └──────────┬──────────┘
                               │
                               ▼
                         Backend / Data

Main Components

* Client Frontend — User-facing medicine search and navigation interface.
* Admin Frontend — Interface for authorized management operations.
* Backend — Provides APIs and application logic.
* Database — Stores structured pharmacy, medicine, and inventory information.
* Inventory System — Handles medicine availability-related data.
* ML / Intelligent Components — Can support intelligent functionality where applicable.

⸻

👥 User Interfaces

Client Side

The client interface is designed for the general user.

Main responsibilities include:

* Medicine search.
* Viewing medicine information.
* Viewing pharmacy information.
* Displaying availability-related information.
* Navigation between relevant pages.
* Providing a simple and user-friendly experience.

Admin Side

The admin interface is intended for authorized users responsible for managing system information.

Possible responsibilities include:

* Managing pharmacy information.
* Managing medicine records.
* Updating inventory information.
* Maintaining data accuracy.
* Performing administrative operations.

The client and admin interfaces are treated as separate front-end responsibilities.

⸻

🔍 Core User Flow

User
  │
  ▼
Open MAP
  │
  ▼
Search for Medicine
  │
  ▼
Backend/API Request
  │
  ▼
Retrieve Relevant Data
  │
  ▼
Display Pharmacy / Availability Information
  │
  ▼
User Identifies Suitable Pharmacy

⸻

🧩 Technology Stack

Frontend

* HTML
* CSS
* JavaScript
* Client-side routing
* Responsive web interface

Backend

* Python
* REST-style API architecture
* Backend application logic

Database

* SQL-based database
* Structured medicine, pharmacy, and inventory data
* Supabase-based data infrastructure where applicable

Development Tools

* Git
* GitHub
* VS Code / compatible development environment

⸻

📂 Project Structure

The repository is organized into separate application areas.

MAP/
│
├── backend/
│   ├── database.py
│   ├── importer.py
│   ├── main.py
│   ├── requirements.txt
│   └── schema.sql
│
├── frontend/
│   ├── css/
│   ├── js/
│   │   └── router.js
│   ├── pages/
│   └── ...
│
├── .gitignore
│
└── README.md

The exact frontend file structure may evolve as development continues.

⸻

⚙️ Backend

The backend acts as the connection between the client application and the underlying data.

Its responsibilities include:

* Handling API requests.
* Processing application logic.
* Communicating with the database.
* Managing medicine and pharmacy-related information.
* Supporting inventory functionality.
* Providing structured data to the frontend.

The backend is maintained independently from the client-side UI so that frontend development does not unnecessarily modify backend architecture or business logic.

⸻

🗄️ Database & Inventory

The database stores structured information required by MAP.

Key data concepts include:

* Medicines
* Pharmacies
* Pharmacy-related information
* Inventory / availability information

Inventory data is used to provide users with availability-related information.

The accuracy of displayed availability depends on the quality and freshness of the underlying inventory data.

⸻

🤖 ML / Intelligent Capability

The project may incorporate machine-learning or intelligent functionality as part of its broader system design.

Any ML functionality should be considered complete only when the corresponding:

* Model
* Data pipeline
* Inference process
* Backend integration
* Evaluation

have been implemented and validated.

Frontend development itself does not imply a change to the ML system.

⸻

🚧 Current Development Focus

The current development focus is primarily on the Client Frontend.

Current priorities include:

* Building the user-facing interface.
* Implementing client-side navigation.
* Creating medicine search functionality.
* Displaying pharmacy and availability information.
* Connecting the frontend with the existing backend APIs.
* Maintaining a clean separation between frontend and backend responsibilities.
* Improving usability and responsiveness.

The backend architecture and existing backend logic should remain stable unless a backend change is specifically required and approved.

⸻

🔐 Data & Reliability Considerations

MAP deals with information that can directly affect a user’s decision about where to obtain a medicine.

Therefore, the system should consider:

* Data accuracy.
* Inventory freshness.
* API reliability.
* Database consistency.
* Appropriate validation.
* Secure handling of administrative operations.
* Clear communication when availability information may be outdated.

The system should not present potentially stale inventory information as a guaranteed statement of physical stock.

⸻

🧪 Testing

Testing should cover the major system layers.

Frontend Testing

* Navigation between pages.
* Medicine search.
* UI responsiveness.
* API integration.
* Error states.
* Empty search results.
* Invalid inputs.

Backend Testing

* API endpoints.
* Database operations.
* Data validation.
* Inventory-related operations.
* Error handling.

Integration Testing

* Frontend → API communication.
* API → Database communication.
* Correct display of retrieved information.
* Handling unavailable or incomplete data.

⸻

🔮 Future Scope

Potential future improvements include:

* Improved medicine search.
* Location-based pharmacy discovery.
* Better availability indicators.
* Pharmacy distance and navigation.
* More advanced inventory synchronization.
* Notifications for medicine availability.
* Improved admin management tools.
* Analytics and reporting.
* Machine-learning-based intelligent features.
* Mobile application support.
* Improved accessibility and multilingual support.

⸻

🎯 Project Goal

The primary goal of MAP is to make medicine availability discovery faster, simpler, and more convenient.

Instead of requiring users to search for pharmacies individually, MAP aims to provide a centralized platform that connects medicine searches with relevant pharmacy and inventory information.

⸻

👨‍💻 Development Philosophy

MAP follows a modular development approach.

The major parts of the project are kept separated so that:

* Frontend development can progress independently.
* Backend architecture remains stable.
* Database operations remain structured.
* Admin and client interfaces can evolve separately.
* Future intelligent functionality can be integrated without unnecessarily disrupting existing components.

⸻

📜 Project Status

Status: Under Development 🚧

The core system and backend infrastructure are being developed alongside the client and admin interfaces.

Current emphasis:

Client-side frontend development and integration with the existing backend.

⸻

📄 License

This project is developed as an academic/project implementation.

License details can be added here if the project is later released under a specific open-source license.

⸻

⭐ Summary

MAP — Overview and Detail is a medicine availability navigation project that aims to connect users with structured information about medicines, pharmacies, and inventory.

The system consists of:

Client Frontend + Admin Frontend + Backend/API + Database + Inventory

with the long-term objective of making medicine discovery more efficient and reliable.
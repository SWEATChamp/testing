# 🎓 Auri-SmartU — AI-Powered Campus Assistant

## 🧠 Overview
**Auri-SmartU** is an AI-driven web/mobile application designed to enhance the daily experience of university students.  
From finding an available classroom or lift, to checking library seat status or estimating driving time to the well-known places at surrounding(ex:Sunway Pyramid). — Auri-SmartU integrates multiple intelligent services into one unified platform.

Our goal is to make campus life **smarter, simpler, and more efficient** through AI and data-driven insights.

---

## 🚀 Key Features

### 🏫 Campus Utility Tracking
- **Available Classroom Finder:** Detect empty rooms in real time using schedule data and IoT integration.  
- **Lift Availability:** Display operational status and congestion levels of campus lifts.  
- **Library & Cafeteria Seats:** Track real-time seat usage in key study and food areas.  

### 🗺️ Smart Navigation
- **POI Status Map:** A live map showing crowd density and traffic within campus buildings.  
- **Route Duration Estimator:** Calculates driving time to a selected destination using AI traffic estimation.

### 📚 Learning Companion
- **Course Planner:** Automatically arranges topics to study based on course syllabus and deadlines.  
- **Personalized Study Schedule:** Uses machine learning to optimize learning pace and difficulty progression.

### 🎙️ Voice AI Assistant
- Interact with the app through natural voice commands.  
- Ask for room availability, upcoming class reminders, or the fastest route to the library.  

---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| **Frontend** | React (Web) / Flutter (Mobile) |
| **Backend** | Node.js / Express / FastAPI |
| **Database** | Firebase / PostgreSQL |
| **AI & ML** | Python (scikit-learn, TensorFlow), OpenAI API |
| **Maps & Sensors** | Google Maps API / IoT Integration |
| **Voice Interface** | SpeechRecognition API / GPT-based Chatbot |
| **UI Design** | Figma / Adobe XD |

---

## 🧱 System Architecture
- The **backend API** collects live campus data (e.g., sensors, schedules).  
- **AI modules** handle predictions (availability, congestion, or personalized learning).  
- **Voice AI** acts as an interface between the user and the data.

---

## 🎨 UI/UX Prototype
- Designed in **Figma** for intuitive navigation and minimal learning curve.
- Emphasizes **youthful colors**, **soft contrast**, and **clean typography**.
- Focus areas:
  - Quick access dashboard (real-time data)
  - Interactive campus map
  - Chat-style voice assistant interface

---

## 🌟 Example Use Cases
- "Hey Auri, where’s the nearest available study room?"
- "Show me which lifts are not crowded right now."
- "Plan my study schedule for CS101 this semester."
- "How long does it take to walk to the cafeteria from Block D?"

---

## 🧑‍💻 Contributors
| Name | Role | Responsibilities |
|------|------|------------------|
| [Lee Ping Xian] | Project Lead / Developer | Backend, AI Integration |
| [Leong Wui Yip] | UI/UX Designer | Prototype Design |

---

## 🔮 Future Enhancements
- Integrate **predictive congestion models** using historical traffic data.  
- Add **cross-campus shuttle tracking** and **real-time notifications**.  
- Deploy **multi-language voice assistant** for international students.  
- Connect to university's **official timetable and facility systems**.

---

## ⚙️ Installation (for Developers)
```bash
# Clone the repository
git clone https://github.com/SWEATChamp/Auri-SmartU.git
cd Auri-SmartU

# Install dependencies
npm install  # or pip install -r requirements.txt

# Run development server
npm run dev  # or python app.py


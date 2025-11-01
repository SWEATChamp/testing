import { useState, useEffect } from "react";
import OpenAI from "openai";

// 🚀 Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // required for Bolt browser environment
});

export default function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [response, setResponse] = useState("");
  const [lastIntent, setLastIntent] = useState("");

  // 🎤 Start speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("User said:", transcript);
      await processCommand(transcript);
    };

    recognition.start();
  };

  // 🔊 Speak with natural tone
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(v => v.name.includes("Google US English")) || voices[0];
      utterance.text = text.replace(/,/g, ', ').replace(/\./g, '. ');
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🧠 Simple pattern matcher
  const matchesPattern = (text: string, keywords: string[]) =>
    keywords.some(word => text.includes(word));

  // 🌐 Command processor
  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = "";

    // 🎙️ Greetings and small talk
    if (matchesPattern(lowerText, ["hi", "hello", "hey"])) {
      responseText = "Hey there! How can I help you today?";
      setLastIntent("greeting");
    } else if (matchesPattern(lowerText, ["how are you"])) {
      responseText = "I'm great — just keeping an eye on the campus for you!";
      setLastIntent("smalltalk");
    } else if (matchesPattern(lowerText, ["thank", "thanks"])) {
      responseText = "You're very welcome!";
      setLastIntent("smalltalk");
    }

    // 🚗 Traffic queries
    else if (matchesPattern(lowerText, ["traffic", "jam", "go home"])) {
      responseText = await handleTrafficQuery(lowerText);
      setLastIntent("traffic");
    }

    // 🅿️ Parking queries
    else if (matchesPattern(lowerText, ["parking", "car park", "space"])) {
      responseText = await handleParkingQuery(lowerText);
      setLastIntent("parking");
    }

    // 🏫 Classroom availability
    else if (matchesPattern(lowerText, ["classroom", "empty room"])) {
      responseText = await handleClassroomQuery();
      setLastIntent("classroom");
    }

    // 🛗 Lift availability
    else if (matchesPattern(lowerText, ["lift", "elevator"])) {
      responseText = await handleLiftQuery();
      setLastIntent("lift");
    }

    // 📚 Library / study area
    else if (matchesPattern(lowerText, ["library", "study space"])) {
      responseText = await handleLibraryQuery();
      setLastIntent("library");
    }

    // 🧠 AI fallback (for flexible queries)
    else {
      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a friendly, casual campus assistant named Tracker. Respond briefly, sound natural, and adapt your tone to the user's message."
            },
            { role: "user", content: text }
          ]
        });
        responseText =
          aiResponse.choices[0].message.content ||
          "Hmm, I'm not sure. Could you say that again?";
      } catch (err) {
        console.error(err);
        responseText = "Sorry, I couldn’t process that right now.";
      }
    }

    setResponse(responseText);
    speak(responseText);
  };

  // 🛠️ Example handlers (replace with Supabase queries)
  const handleTrafficQuery = async (text: string) => {
    if (text.includes("sunway pyramid"))
      return "Traffic to Sunway Pyramid looks heavy right now — around 30 minutes.";
    return "Looks like traffic is moderate. You should be fine to go!";
  };

  const handleParkingQuery = async (text: string) => {
    return "North car park has around 12 free spots right now.";
  };

  const handleClassroomQuery = async () => {
    return "E1.04 and E2.06 are currently empty and available.";
  };

  const handleLiftQuery = async () => {
    return "Lift A is the fastest to reach level 5 — minimal wait time.";
  };

  const handleLibraryQuery = async () => {
    return "The library is 70% full — there are still seats near the windows.";
  };

  return (
    <div className="p-6 bg-gray-100 rounded-2xl shadow-lg flex flex-col items-center space-y-4">
      <h1 className="text-xl font-semibold">🎙️ Campus Voice Assistant</h1>
      <button
        onClick={startListening}
        className={`px-5 py-3 rounded-full text-white transition ${
          listening ? "bg-red-500 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {listening ? "Listening..." : "Start Talking"}
      </button>
      <p className="text-gray-700 italic text-center max-w-md">
        {response || "Ask me about traffic, classrooms, or parking!"}
      </p>
    </div>
  );
}
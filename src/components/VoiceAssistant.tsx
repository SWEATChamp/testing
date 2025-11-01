import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

const getOpenAIClient = () => {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  return null;
};

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || v.name.includes("Samantha")
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.text = text;
      window.speechSynthesis.speak(utterance);
    }
  };

  const matchesPattern = (text: string, keywords: string[]) =>
    keywords.some(word => text.includes(word));

  // === TRAFFIC ===
  const handleTrafficQuery = async (text: string): Promise<string> => {
    const { data: poisData } = await supabase
      .from('pois')
      .select('*')
      .order('is_default', { ascending: false });

    const { data: trafficData } = await supabase.from('poi_traffic').select('*');

    if (!poisData || !trafficData || poisData.length === 0)
      return "Hmm, I can’t fetch traffic data right now. Maybe try again soon?";

    const allTraffic = poisData.map(poi => {
      const poiTraffic = trafficData.find(t => t.poi_id === poi.id);
      return {
        name: poi.name,
        time: poiTraffic?.commute_time_minutes || 0,
        level: poiTraffic?.traffic_level || 'unknown'
      };
    });

    if (matchesPattern(text, ['sunway', 'pyramid'])) {
      const target = allTraffic.find(t =>
        t.name.toLowerCase().includes('sunway')
      );
      if (target) {
        const levelText =
          target.level === 'severe'
            ? 'really bad traffic'
            : target.level === 'heavy'
            ? 'heavy traffic'
            : target.level === 'moderate'
            ? 'moderate traffic'
            : 'smooth traffic';
        return `It takes around ${target.time} minutes to reach ${target.name} — ${levelText} right now.`;
      }
    }

    if (matchesPattern(text, ['best', 'fastest', 'quick'])) {
      const best = [...allTraffic].sort((a, b) => a.time - b.time)[0];
      return `${best.name} seems to be the quickest route, about ${best.time} minutes away.`;
    }

    if (matchesPattern(text, ['worst', 'avoid', 'bad'])) {
      const worst = [...allTraffic].sort((a, b) => b.time - a.time)[0];
      return `You might wanna skip ${worst.name}. It’s packed — around ${worst.time} minutes drive.`;
    }

    const summary = allTraffic
      .slice(0, 3)
      .map(
        t =>
          `${t.name}: ${t.time} minutes (${t.level === 'severe' ? 'jammed' : t.level})`
      )
      .join('. ');
    return `Here’s what I found: ${summary}.`;
  };

  // === PARKING ===
  const handleParkingQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check parking info.';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) return 'Unable to find your university data.';

    const { data } = await supabase
      .from('parking_lots')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('available_spaces', { ascending: false });

    if (!data || data.length === 0)
      return 'No parking info available at the moment.';

    if (matchesPattern(text, ['recommend', 'best', 'should'])) {
      const best = data[0];
      return `${best.zone} has the most space — ${best.available_spaces} spots left.`;
    }

    if (matchesPattern(text, ['avoid', 'worst', 'full'])) {
      const worst = data[data.length - 1];
      return `Try to avoid ${worst.zone}, only ${worst.available_spaces} spots remaining.`;
    }

    const summary = data
      .slice(0, 3)
      .map(p => `${p.zone}: ${p.available_spaces} spaces`)
      .join('. ');
    return `Here’s what’s open: ${summary}.`;
  };

  // === LIBRARY ===
  const handleLibraryQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check library seats.';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) return 'Unable to load your university data.';

    const { data } = await supabase
      .from('library_seats')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('available_seats', { ascending: false });

    if (!data || data.length === 0)
      return 'No info available for the library right now.';

    if (matchesPattern(text, ['charging', 'plug'])) {
      const withCharging = data.filter(s => s.has_charging_port);
      if (withCharging.length > 0) {
        const spot = withCharging[0];
        return `You can try Floor ${spot.floor}, ${spot.zone}. It has ${spot.available_seats} seats with charging ports.`;
      }
      return 'No charging seats are open at the moment.';
    }

    if (matchesPattern(text, ['quiet', 'silent'])) {
      const silent = data.find(s =>
        s.zone.toLowerCase().includes('silent') ||
        s.zone.toLowerCase().includes('quiet')
      );
      if (silent) {
        return `Try Floor ${silent.floor}, ${silent.zone}. ${silent.available_seats} seats available — nice and quiet.`;
      }
    }

    const best = data[0];
    return `I’d suggest Floor ${best.floor}, ${best.zone} — ${best.available_seats} seats open.`;
  };

  // === FOOD ===
  const handleFoodQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check food stall data.';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) return 'Unable to find your university data.';

    const { data } = await supabase
      .from('food_stalls')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('queue_length', { ascending: true });

    if (!data || data.length === 0)
      return 'No food data available right now.';

    if (matchesPattern(text, ['recommend', 'best', 'quick', 'fast', 'should i go'])) {
      const best = data[0];
      return `${best.name} looks good — ${best.available_seats} seats and a short queue of ${best.queue_length}.`;
    }

    if (matchesPattern(text, ['avoid', 'busy', 'crowded', 'worst', 'packed'])) {
      const worst = data[data.length - 1];
      return `Avoid ${worst.name}, it's crowded with ${worst.queue_length} people in line.`;
    }

    const top2 = data.slice(0, 2);
    return `For food, try ${top2.map(f => `${f.name} with ${f.queue_length} in queue`).join(', or ')}.`;
  };

  // === LIFT ===
  const handleLiftQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check lift queues.';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) return 'Unable to find your profile info.';

    const { data } = await supabase
      .from('lifts')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('queue_count', { ascending: true });

    if (!data || data.length === 0)
      return 'No lift data available right now.';

    const best = data[0];
    const liftName = `${best.building} Lift ${best.lift_id}`;
    return `Go for ${liftName}. Only ${best.queue_count} people waiting.`;
  };

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = '';

    try {
      if (matchesPattern(lowerText, ['hi', 'hello', 'hey', 'good morning', 'good afternoon'])) {
        responseText = "Hey there! What can I help you with?";
      } else if (matchesPattern(lowerText, ['how are you', 'how r u', 'whats up', "what's up"])) {
        responseText = "Doing great — just keeping an eye on campus for you!";
      } else if (matchesPattern(lowerText, ['thank', 'thanks', 'appreciate'])) {
        responseText = "You're welcome! Always happy to help.";
      }

      else if (matchesPattern(lowerText, ['traffic', 'jam', 'commute', 'drive', 'go home', 'going home', 'leave', 'how long', 'get to', 'travel time'])) {
        responseText = await handleTrafficQuery(lowerText);
      }

      else if (matchesPattern(lowerText, ['park', 'parking', 'car park', 'space', 'where to park', 'where can i park', 'parking spot', 'car space'])) {
        responseText = await handleParkingQuery(lowerText);
      }

      else if (matchesPattern(lowerText, ['library', 'study', 'seat', 'read', 'quiet place', 'study spot', 'where can i study', 'need a seat', 'find a seat'])) {
        responseText = await handleLibraryQuery(lowerText);
      }

      else if (matchesPattern(lowerText, ['food', 'eat', 'canteen', 'hungry', 'lunch', 'dinner', 'breakfast', 'meal', 'where to eat', 'grab food', 'get food'])) {
        responseText = await handleFoodQuery(lowerText);
      }

      else if (matchesPattern(lowerText, ['lift', 'elevator', 'which lift', 'what lift', 'lift queue', 'waiting', 'go up', 'go down'])) {
        responseText = await handleLiftQuery(lowerText);
      }

      else if (matchesPattern(lowerText, ['classroom', 'empty room', 'free room', 'available room', 'where can i', 'find a room', 'room available'])) {
        responseText = 'Sure! Let me show you available classrooms.';
        onCommand('classroom');
      }

      else if (matchesPattern(lowerText, ['course', 'plan', 'schedule', 'timetable', 'class', 'module', 'subject', 'my courses'])) {
        responseText = 'Opening your course planner now.';
        onCommand('course');
      }

      else if (matchesPattern(lowerText, ['what can you do', 'help me', 'what do you do', 'features', 'how can you help', 'assist'])) {
        responseText = "I can help you with traffic updates, parking availability, library seats, food options, lift queues, classroom availability, and your course schedule. Just ask me anything!";
      }

      else if (matchesPattern(lowerText, ['busy', 'crowded', 'packed', 'full'])) {
        if (matchesPattern(lowerText, ['library', 'study'])) {
          responseText = await handleLibraryQuery(lowerText);
        } else if (matchesPattern(lowerText, ['canteen', 'food', 'cafeteria'])) {
          responseText = await handleFoodQuery(lowerText);
        } else if (matchesPattern(lowerText, ['park', 'parking'])) {
          responseText = await handleParkingQuery(lowerText);
        } else {
          responseText = "What area are you asking about? Library, parking, or food?";
        }
      }

      else {
        const openai = getOpenAIClient();
        if (openai) {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You're a friendly, casual campus assistant. Respond naturally and concisely (max 2 sentences)."
              },
              { role: "user", content: text }
            ]
          });
          responseText = aiResponse.choices[0].message.content || "Hmm, not sure how to respond to that.";
        } else {
          responseText = "I can help with traffic, parking, lifts, library seats, food stalls, and classrooms!";
        }
      }
    } catch (error) {
      console.error('Error processing command:', error);
      responseText = 'Sorry, something went wrong while processing that.';
    }

    setResponse(responseText);
    setShowResponse(true);
    speak(responseText);
    setTimeout(() => setShowResponse(false), 8000);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorText = 'Sorry, your browser doesn’t support voice recognition.';
      setResponse(errorText);
      setShowResponse(true);
      speak(errorText);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processCommand(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    setTranscript('');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  return (
    <>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 ${
          isListening
            ? 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
        }`}
      >
        {isListening ? <MicOff className="text-white" size={28} /> : <Mic className="text-white" size={28} />}
      </button>

      {(transcript || showResponse) && (
        <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-2xl p-4 max-w-md z-50 border border-slate-200">
          {transcript && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  You said
                </span>
              </div>
              <p className="text-slate-800 font-medium">{transcript}</p>
            </div>
          )}

          {showResponse && response && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start space-x-2">
                <Volume2 className="text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" size={16} />
                <p className="text-sm text-slate-800 font-medium">{response}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

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
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const matchesPattern = (text: string, patterns: string[]): boolean => {
    return patterns.some(pattern => text.includes(pattern));
  };

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = '';

    const isTrafficQuery = matchesPattern(lowerText, ['traffic', 'jam', 'road', 'drive', 'driving', 'commute', 'go home', 'going home', 'leave']);
    const isParkingQuery = matchesPattern(lowerText, ['park', 'parking', 'car space', 'parking space', 'where can i park', 'parking lot']);
    const isLibraryQuery = matchesPattern(lowerText, ['library', 'study', 'seat', 'study spot', 'study space', 'where to study', 'where can i study']);
    const isFoodQuery = matchesPattern(lowerText, ['food', 'eat', 'hungry', 'lunch', 'dinner', 'breakfast', 'canteen', 'cafe', 'restaurant']);
    const isLiftQuery = matchesPattern(lowerText, ['lift', 'elevator', 'which lift']);

    if (isTrafficQuery) {
      const { data: poisData } = await supabase
        .from('pois')
        .select('*')
        .order('is_default', { ascending: false });

      const { data: trafficData } = await supabase
        .from('poi_traffic')
        .select('*');

      if (poisData && trafficData && poisData.length > 0) {
        const allTraffic = poisData.map((poi) => {
          const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
          return {
            name: poi.name,
            time: poiTraffic?.commute_time_minutes || 0,
            level: poiTraffic?.traffic_level || 'unknown'
          };
        });

        const isSpecificLocation = matchesPattern(lowerText, ['sunway', 'pyramid', '1 utama', 'one utama', 'utama', 'mid valley', 'midvalley', 'klcc', 'paradigm']);
        const isWorstQuery = matchesPattern(lowerText, ['worst', 'avoid', 'bad', 'heavy', 'jammed', 'congested', 'bad traffic']);
        const isBestQuery = matchesPattern(lowerText, ['best', 'fastest', 'quick', 'fast', 'clear', 'light', 'good', 'recommend']);

        if (isSpecificLocation) {
          let targetPoi = null;
          if (matchesPattern(lowerText, ['sunway', 'pyramid'])) {
            targetPoi = allTraffic.find((t) => t.name.toLowerCase().includes('sunway'));
          } else if (matchesPattern(lowerText, ['1 utama', 'one utama', 'utama'])) {
            targetPoi = allTraffic.find((t) => t.name.toLowerCase().includes('utama'));
          } else if (matchesPattern(lowerText, ['mid valley', 'midvalley'])) {
            targetPoi = allTraffic.find((t) => t.name.toLowerCase().includes('mid valley'));
          } else if (matchesPattern(lowerText, ['klcc'])) {
            targetPoi = allTraffic.find((t) => t.name.toLowerCase().includes('klcc'));
          } else if (matchesPattern(lowerText, ['paradigm'])) {
            targetPoi = allTraffic.find((t) => t.name.toLowerCase().includes('paradigm'));
          }

          if (targetPoi) {
            const levelText = targetPoi.level === 'severe' ? 'severe congestion' :
                            targetPoi.level === 'heavy' ? 'heavy traffic' :
                            targetPoi.level === 'moderate' ? 'moderate traffic' : 'light traffic';
            responseText = `${targetPoi.name} is ${targetPoi.time} minutes away with ${levelText}`;
          }
        } else if (isWorstQuery) {
          const sorted = [...allTraffic].sort((a, b) => b.time - a.time);
          const worst = sorted[0];
          const levelText = worst.level === 'severe' ? 'severe congestion' :
                          worst.level === 'heavy' ? 'heavy traffic' :
                          worst.level === 'moderate' ? 'moderate traffic' : 'light traffic';
          responseText = `Avoid ${worst.name}. It has the worst traffic at ${worst.time} minutes with ${levelText}`;
        } else if (isBestQuery) {
          const sorted = [...allTraffic].sort((a, b) => a.time - b.time);
          const best = sorted[0];
          const levelText = best.level === 'low' ? 'light traffic' : best.level;
          responseText = `${best.name} is your best option with only ${best.time} minutes and ${levelText}`;
        } else {
          const top3 = allTraffic.slice(0, 3);
          const trafficInfo = top3.map((t) => {
            const levelText = t.level === 'severe' ? 'severe' :
                            t.level === 'heavy' ? 'heavy' :
                            t.level === 'moderate' ? 'moderate' : 'light';
            return `${t.name}: ${t.time} minutes, ${levelText}`;
          }).join('. ');
          responseText = `Current traffic: ${trafficInfo}`;
        }
      } else {
        responseText = 'Unable to fetch traffic data right now';
      }
    } else if (isParkingQuery) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        responseText = 'Please sign in to check parking availability';
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('university_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const { data } = await supabase
            .from('parking_lots')
            .select('*')
            .eq('university_id', profile.university_id)
            .order('available_spaces', { ascending: false });

          if (data && data.length > 0) {
            const isRecommendQuery = matchesPattern(lowerText, ['recommend', 'best', 'should i', 'where should', 'where can i']);
            const isWorstQuery = matchesPattern(lowerText, ['worst', 'full', 'avoid', 'crowded']);

            if (isRecommendQuery) {
              const best = data[0];
              const percentage = Math.round((best.available_spaces / best.total_spaces) * 100);
              responseText = `I recommend ${best.zone}. It has ${best.available_spaces} out of ${best.total_spaces} spaces available, that's ${percentage} percent`;
            } else if (isWorstQuery) {
              const worst = data[data.length - 1];
              responseText = `Avoid ${worst.zone}. It only has ${worst.available_spaces} spaces left out of ${worst.total_spaces}`;
            } else {
              const top3 = data.slice(0, 3);
              const parkingInfo = top3.map((p) =>
                `${p.zone}: ${p.available_spaces} available`
              ).join('. ');
              responseText = `Parking: ${parkingInfo}`;
            }
          } else {
            responseText = 'No parking data available';
          }
        }
      }
    } else if (isLibraryQuery) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        responseText = 'Please sign in to check library seats';
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('university_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const { data } = await supabase
            .from('library_seats')
            .select('*')
            .eq('university_id', profile.university_id)
            .order('available_seats', { ascending: false });

          if (data && data.length > 0) {
            const isRecommendQuery = matchesPattern(lowerText, ['recommend', 'best', 'should i', 'where should', 'where can i']);
            const isChargingQuery = matchesPattern(lowerText, ['charging', 'charge', 'power', 'plug', 'charger', 'socket']);
            const isQuietQuery = matchesPattern(lowerText, ['quiet', 'silent', 'peaceful']);

            if (isChargingQuery) {
              const withCharging = data.filter((s) => s.has_charging_port);
              if (withCharging.length > 0) {
                const best = withCharging[0];
                responseText = `For charging, go to Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats with power outlets`;
              } else {
                responseText = 'Sorry, no seats with charging ports are available right now';
              }
            } else if (isQuietQuery) {
              const silent = data.find((s) => s.zone.toLowerCase().includes('silent') || s.zone.toLowerCase().includes('quiet'));
              if (silent) {
                const charging = silent.has_charging_port ? ' with charging' : '';
                responseText = `The quiet area is on Floor ${silent.floor}, ${silent.zone}. ${silent.available_seats} seats available${charging}`;
              } else {
                const best = data[0];
                responseText = `No specific quiet zone found. I recommend Floor ${best.floor}, ${best.zone} with ${best.available_seats} seats`;
              }
            } else if (isRecommendQuery) {
              const best = data[0];
              const charging = best.has_charging_port ? ' with charging ports' : '';
              responseText = `I recommend Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats available${charging}`;
            } else {
              const top3 = data.slice(0, 3);
              const libraryInfo = top3.map((s) => {
                const charging = s.has_charging_port ? ' with charging' : '';
                return `Floor ${s.floor} ${s.zone}: ${s.available_seats} seats${charging}`;
              }).join('. ');
              responseText = `Library: ${libraryInfo}`;
            }
          } else {
            responseText = 'No library seats available';
          }
        }
      }
    } else if (isFoodQuery) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        responseText = 'Please sign in to check food options';
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('university_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const { data } = await supabase
            .from('food_stalls')
            .select('*')
            .eq('university_id', profile.university_id)
            .order('queue_length', { ascending: true });

          if (data && data.length > 0) {
            const isRecommendQuery = matchesPattern(lowerText, ['recommend', 'best', 'should', 'where should', 'where can i']);
            const isWorstQuery = matchesPattern(lowerText, ['avoid', 'busy', 'crowded', 'worst', 'long queue']);
            const isFastQuery = matchesPattern(lowerText, ['quick', 'fast', 'fastest', 'short queue']);

            if (isRecommendQuery || isFastQuery) {
              const best = data[0];
              responseText = `I recommend ${best.name}. It has ${best.available_seats} seats and only ${best.queue_length} people in the queue`;
            } else if (isWorstQuery) {
              const worst = data[data.length - 1];
              responseText = `Avoid ${worst.name}. It has a long queue of ${worst.queue_length} people`;
            } else {
              const top3 = data.slice(0, 3);
              const foodInfo = top3.map((f) =>
                `${f.name}: ${f.available_seats} seats, queue of ${f.queue_length}`
              ).join('. ');
              responseText = `Food options: ${foodInfo}`;
            }
          } else {
            responseText = 'No food stall data available';
          }
        }
      }
    } else if (isLiftQuery) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        responseText = 'Please sign in to check lift status';
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('university_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const { data } = await supabase
            .from('lift_queues')
            .select('*')
            .eq('university_id', profile.university_id)
            .order('queue_length', { ascending: true });

          if (data && data.length > 0) {
            const isRecommendQuery = matchesPattern(lowerText, ['recommend', 'best', 'should', 'fastest', 'which']);

            if (isRecommendQuery) {
              const best = data[0];
              responseText = `Take ${best.lift_name}. It has only ${best.queue_length} people waiting`;
            } else {
              const top3 = data.slice(0, 3);
              const liftInfo = top3.map((l) =>
                `${l.lift_name}: ${l.queue_length} waiting`
              ).join('. ');
              responseText = `Lifts: ${liftInfo}`;
            }
          } else {
            responseText = 'No lift queue data available';
          }
        }
      }
    } else if (matchesPattern(lowerText, ['classroom', 'empty room', 'free room', 'available room'])) {
      responseText = 'Let me show you available classrooms';
      onCommand('classroom');
    } else if (matchesPattern(lowerText, ['course', 'plan', 'schedule', 'timetable', 'units'])) {
      responseText = 'Opening your course planner';
      onCommand('course');
    } else {
      responseText = 'I can help you with traffic, parking, library seats, food options, lifts, classrooms, and course planning. Just ask me a question!';
    }

    setResponse(responseText);
    setShowResponse(true);
    speak(responseText);
    setTimeout(() => setShowResponse(false), 10000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorText = 'Sorry, voice recognition is not supported in your browser';
      setResponse(errorText);
      setShowResponse(true);
      speak(errorText);
      setTimeout(() => setShowResponse(false), 3000);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    setTranscript('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
        {isListening ? (
          <MicOff className="text-white" size={28} />
        ) : (
          <Mic className="text-white" size={28} />
        )}
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

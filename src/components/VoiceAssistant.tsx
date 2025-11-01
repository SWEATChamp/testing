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

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = '';

    if (lowerText.includes('traffic') || lowerText.includes('home') || lowerText.includes('go')) {
      const { data: poisData } = await supabase
        .from('pois')
        .select('*')
        .order('is_default', { ascending: false });

      const { data: trafficData } = await supabase
        .from('poi_traffic')
        .select('*');

      if (poisData && trafficData && poisData.length > 0) {
        if (lowerText.includes('sunway') || lowerText.includes('pyramid')) {
          const sunway = poisData.find((p) => p.name.toLowerCase().includes('sunway'));
          if (sunway) {
            const traffic = trafficData.find((t) => t.poi_id === sunway.id);
            const levelText = traffic?.traffic_level === 'severe' ? 'severe congestion' :
                            traffic?.traffic_level === 'heavy' ? 'heavy traffic' :
                            traffic?.traffic_level === 'moderate' ? 'moderate traffic' : 'light traffic';
            responseText = `Sunway Pyramid: ${traffic?.commute_time_minutes || 0} minutes with ${levelText}`;
          }
        } else if (lowerText.includes('mid valley') || lowerText.includes('midvalley')) {
          const midvalley = poisData.find((p) => p.name.toLowerCase().includes('mid valley'));
          if (midvalley) {
            const traffic = trafficData.find((t) => t.poi_id === midvalley.id);
            const levelText = traffic?.traffic_level === 'severe' ? 'severe congestion' :
                            traffic?.traffic_level === 'heavy' ? 'heavy traffic' :
                            traffic?.traffic_level === 'moderate' ? 'moderate traffic' : 'light traffic';
            responseText = `Mid Valley: ${traffic?.commute_time_minutes || 0} minutes with ${levelText}`;
          }
        } else if (lowerText.includes('worst') || lowerText.includes('avoid') || lowerText.includes('bad')) {
          const withTraffic = poisData.map((poi) => {
            const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
            return {
              name: poi.name,
              time: poiTraffic?.commute_time_minutes || 0,
              level: poiTraffic?.traffic_level || 'unknown'
            };
          }).sort((a, b) => b.time - a.time);

          if (withTraffic.length > 0) {
            const worst = withTraffic[0];
            const levelText = worst.level === 'severe' ? 'severe congestion' :
                            worst.level === 'heavy' ? 'heavy traffic' :
                            worst.level === 'moderate' ? 'moderate traffic' : 'light traffic';
            responseText = `Avoid ${worst.name}. It has the worst traffic right now with ${worst.time} minutes and ${levelText}`;
          }
        } else if (lowerText.includes('best') || lowerText.includes('fastest') || lowerText.includes('quick')) {
          const withTraffic = poisData.map((poi) => {
            const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
            return {
              name: poi.name,
              time: poiTraffic?.commute_time_minutes || 0,
              level: poiTraffic?.traffic_level || 'unknown'
            };
          }).sort((a, b) => a.time - b.time);

          if (withTraffic.length > 0) {
            const best = withTraffic[0];
            responseText = `${best.name} is your best option with only ${best.time} minutes`;
          }
        } else {
          const traffic = poisData.slice(0, 3).map((poi) => {
            const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
            return {
              name: poi.name,
              time: poiTraffic?.commute_time_minutes || 0,
              level: poiTraffic?.traffic_level || 'unknown'
            };
          });

          const trafficInfo = traffic.map((t) => {
            const levelText = t.level === 'severe' ? 'severe congestion' :
                            t.level === 'heavy' ? 'heavy traffic' :
                            t.level === 'moderate' ? 'moderate traffic' : 'light traffic';
            return `${t.name}: ${t.time} minutes with ${levelText}`;
          }).join('. ');

          responseText = `Current traffic conditions: ${trafficInfo}`;
        }
      } else {
        responseText = 'Unable to fetch traffic data at the moment';
      }
    } else if (lowerText.includes('parking')) {
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
            if (lowerText.includes('most') || lowerText.includes('best') || lowerText.includes('recommend')) {
              const best = data[0];
              responseText = `I recommend ${best.zone}. It has ${best.available_spaces} out of ${best.total_spaces} spaces available`;
            } else if (lowerText.includes('full') || lowerText.includes('avoid')) {
              const worst = data[data.length - 1];
              responseText = `Avoid ${worst.zone}. It only has ${worst.available_spaces} spaces left`;
            } else {
              const parkingInfo = data.slice(0, 3).map((p) =>
                `${p.zone}: ${p.available_spaces} out of ${p.total_spaces} available`
              ).join('. ');
              responseText = `Parking availability: ${parkingInfo}`;
            }
          } else {
            responseText = 'No parking data available';
          }
        }
      }
    } else if (lowerText.includes('library') || lowerText.includes('study')) {
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
            if (lowerText.includes('recommend') || lowerText.includes('best') || lowerText.includes('where should')) {
              const best = data[0];
              const charging = best.has_charging_port ? ' with charging ports' : '';
              responseText = `I recommend Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats available${charging}`;
            } else if (lowerText.includes('charging') || lowerText.includes('power') || lowerText.includes('plug')) {
              const withCharging = data.filter((s) => s.has_charging_port);
              if (withCharging.length > 0) {
                const best = withCharging[0];
                responseText = `For charging, go to Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats with charging ports`;
              } else {
                responseText = 'No seats with charging ports are currently available';
              }
            } else if (lowerText.includes('quiet') || lowerText.includes('silent')) {
              const silent = data.find((s) => s.zone.toLowerCase().includes('silent') || s.zone.toLowerCase().includes('quiet'));
              if (silent) {
                const charging = silent.has_charging_port ? ' with charging ports' : '';
                responseText = `The quiet area is on Floor ${silent.floor}, ${silent.zone}. ${silent.available_seats} seats available${charging}`;
              } else {
                responseText = 'No specific quiet zones found, but I recommend the area with most available seats';
              }
            } else {
              const libraryInfo = data.slice(0, 3).map((s) => {
                const charging = s.has_charging_port ? ' with charging' : '';
                return `Floor ${s.floor} ${s.zone}: ${s.available_seats} seats${charging}`;
              }).join('. ');
              responseText = `Library availability: ${libraryInfo}`;
            }
          } else {
            responseText = 'No library seat data available';
          }
        }
      }
    } else if (lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('canteen')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        responseText = 'Please sign in to check food stall availability';
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
            if (lowerText.includes('recommend') || lowerText.includes('best') || lowerText.includes('fastest') || lowerText.includes('quick')) {
              const best = data[0];
              responseText = `I recommend ${best.name}. It has ${best.available_seats} seats and only ${best.queue_length} people in queue`;
            } else if (lowerText.includes('avoid') || lowerText.includes('busy') || lowerText.includes('crowded')) {
              const worst = data[data.length - 1];
              responseText = `Avoid ${worst.name}. It has a queue of ${worst.queue_length} people`;
            } else {
              const foodInfo = data.slice(0, 3).map((f) =>
                `${f.name}: ${f.available_seats} seats, queue of ${f.queue_length}`
              ).join('. ');
              responseText = `Food stalls: ${foodInfo}`;
            }
          } else {
            responseText = 'No food stall data available';
          }
        }
      }
    } else if (lowerText.includes('lift') || lowerText.includes('elevator')) {
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
            if (lowerText.includes('recommend') || lowerText.includes('best') || lowerText.includes('fastest')) {
              const best = data[0];
              responseText = `Use ${best.lift_name}. It has only ${best.queue_length} people waiting`;
            } else {
              const liftInfo = data.slice(0, 3).map((l) =>
                `${l.lift_name}: ${l.queue_length} people waiting`
              ).join('. ');
              responseText = `Lift queues: ${liftInfo}`;
            }
          } else {
            responseText = 'No lift queue data available';
          }
        }
      }
    } else if (lowerText.includes('classroom') || lowerText.includes('empty room')) {
      responseText = 'Let me show you available classrooms';
      onCommand('classroom');
    } else if (lowerText.includes('course') || lowerText.includes('plan')) {
      responseText = 'Opening your course planner';
      onCommand('course');
    } else {
      responseText = 'I can help you check traffic, parking, library seats, food stalls, lifts, classrooms, and course planning. Try asking for recommendations!';
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

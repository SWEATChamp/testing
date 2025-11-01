import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Sparkles, Calendar, BookOpen, Globe } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  course: string;
  intake: string;
  electives: string[];
  overseas: boolean;
}

export function UnitArrangementPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI course advisor. I'll help you plan your academic journey. Let's start by getting to know your preferences. What course are you enrolled in? (e.g., Bachelor of Computer Science)",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    course: '',
    intake: '',
    electives: [],
    overseas: false,
  });
  const [courseMap, setCourseMap] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateCourseMap = (data: UserData) => {
    const semesters = [];
    const allUnits = [
      { code: 'CS101', name: 'Introduction to Programming', credits: 3, year: 1, semester: 1, type: 'Core' },
      { code: 'MATH101', name: 'Calculus I', credits: 3, year: 1, semester: 1, type: 'Core' },
      { code: 'CS102', name: 'Data Structures', credits: 3, year: 1, semester: 2, type: 'Core' },
      { code: 'MATH102', name: 'Linear Algebra', credits: 3, year: 1, semester: 2, type: 'Core' },
      { code: 'CS201', name: 'Object-Oriented Programming', credits: 3, year: 2, semester: 1, type: 'Core' },
      { code: 'CS202', name: 'Database Systems', credits: 3, year: 2, semester: 2, type: 'Core' },
    ];

    if (data.overseas) {
      semesters.push({
        year: 3,
        semester: 1,
        name: 'Overseas Exchange Program',
        units: [
          { code: 'EXCHANGE', name: 'Study Abroad', credits: 12, type: 'Exchange' },
        ],
      });
    }

    const electiveUnits = [
      { code: 'CS301', name: 'Web Development', credits: 3 },
      { code: 'CS302', name: 'Mobile App Development', credits: 3 },
      { code: 'CS303', name: 'Machine Learning', credits: 3 },
      { code: 'CS304', name: 'Cloud Computing', credits: 3 },
    ];

    const selectedElectives = electiveUnits.slice(0, 2);

    for (let i = 0; i < allUnits.length; i += 4) {
      const year = Math.floor(i / 4) + 1;
      const sem1Units = allUnits.slice(i, i + 2);
      const sem2Units = allUnits.slice(i + 2, i + 4);

      if (sem1Units.length > 0) {
        semesters.push({
          year,
          semester: 1,
          name: `Year ${year} - Semester 1`,
          units: sem1Units,
        });
      }

      if (sem2Units.length > 0) {
        semesters.push({
          year,
          semester: 2,
          name: `Year ${year} - Semester 2`,
          units: sem2Units,
        });
      }
    }

    if (!data.overseas) {
      semesters.push({
        year: 3,
        semester: 1,
        name: 'Year 3 - Semester 1',
        units: selectedElectives.map((u) => ({ ...u, year: 3, semester: 1, type: 'Elective' })),
      });
    }

    return semesters;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    setTimeout(() => {
      let assistantResponse = '';
      let newStep = step;

      if (step === 1) {
        setUserData((prev) => ({ ...prev, course: userMessage }));
        assistantResponse = `Great! ${userMessage} is an excellent choice. When is your intake? (e.g., January 2025, September 2024)`;
        newStep = 2;
      } else if (step === 2) {
        setUserData((prev) => ({ ...prev, intake: userMessage }));
        assistantResponse = `Perfect! Starting in ${userMessage}. What are your preferred elective areas? You can choose from: Web Development, Mobile App Development, Machine Learning, Cloud Computing. Please list your top interests.`;
        newStep = 3;
      } else if (step === 3) {
        const electives = userMessage.split(',').map((e) => e.trim());
        setUserData((prev) => ({ ...prev, electives }));
        assistantResponse = `Excellent choices! Are you interested in participating in an overseas exchange program? (Yes/No)`;
        newStep = 4;
      } else if (step === 4) {
        const overseas = userMessage.toLowerCase().includes('yes');
        const finalData = { ...userData, overseas };
        setUserData(finalData);

        const map = generateCourseMap(finalData);
        setCourseMap(map);

        assistantResponse = `Perfect! I have created a personalized course map for you. Based on your preferences:\n\n• Course: ${finalData.course}\n• Intake: ${finalData.intake}\n• Electives: ${finalData.electives.join(', ')}\n• Overseas Program: ${overseas ? 'Yes' : 'No'}\n\nYour course map is displayed below. I have arranged your units considering prerequisites and optimal semester loadings. ${overseas ? 'I have reserved Year 3 Semester 1 for your overseas exchange program.' : 'All electives are scheduled for your final year.'}`;
        newStep = 5;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse }]);
      setStep(newStep);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Unit Arrangement</h1>
              <p className="text-blue-100 text-sm">Plan your academic journey with AI assistance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <Sparkles className="text-blue-600" size={20} />
                <span>AI Course Advisor</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-4 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping || step === 5}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim() || step === 5}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <BookOpen className="text-blue-600" size={20} />
              <span>Your Information</span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Course</div>
                <div className="font-medium text-slate-800">{userData.course || 'Not set'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1 flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Intake</span>
                </div>
                <div className="font-medium text-slate-800">{userData.intake || 'Not set'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Preferred Electives</div>
                <div className="font-medium text-slate-800">
                  {userData.electives.length > 0 ? userData.electives.join(', ') : 'Not set'}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1 flex items-center space-x-1">
                  <Globe size={14} />
                  <span>Overseas Program</span>
                </div>
                <div className="font-medium text-slate-800">
                  {userData.overseas ? 'Yes' : step >= 5 ? 'No' : 'Not set'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {courseMap && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Personalized Course Map</h2>

            <div className="space-y-6">
              {courseMap.map((semester: any, index: number) => (
                <div key={index} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{semester.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {semester.units.map((unit: any, unitIndex: number) => (
                      <div
                        key={unitIndex}
                        className={`p-4 rounded-lg border-2 ${
                          unit.type === 'Core'
                            ? 'bg-blue-50 border-blue-200'
                            : unit.type === 'Elective'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-purple-50 border-purple-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-800">{unit.code}</div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              unit.type === 'Core'
                                ? 'bg-blue-200 text-blue-800'
                                : unit.type === 'Elective'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-purple-200 text-purple-800'
                            }`}
                          >
                            {unit.type}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700 mb-2">{unit.name}</div>
                        <div className="text-xs text-slate-600">{unit.credits} Credits</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

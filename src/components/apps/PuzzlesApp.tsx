import { useEffect, useState } from "react";
import { COMPANY_TIERS, type CompanyTier } from "../../data/aptitudeQuestions";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";

export function PuzzlesApp() {
  // Aptitude Assessment State
  const [selectedTier, setSelectedTier] = useState<CompanyTier>(COMPANY_TIERS[0]!);
  const [inExam, setInExam] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(900);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Certificate Modal State
  const [candidateName, setCandidateName] = useState("STUDENT CODE ESCAPER");

  // Timer countdown hook
  useEffect(() => {
    if (!inExam || examSubmitted) return;
    const t = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [inExam, examSubmitted]);

  const startExam = (tier: CompanyTier) => {
    sound.play("open");
    setSelectedTier(tier);
    setCurrentQIdx(0);
    setUserAnswers({});
    setTimeLeftSec(tier.timeLimitSec);
    setExamSubmitted(false);
    setInExam(true);
  };

  const finishExam = () => {
    sound.play("success");
    setExamSubmitted(true);
    setInExam(false);

    // Calculate score
    let score = 0;
    selectedTier.questions.forEach((q) => {
      if (userAnswers[q.id] === q.answer) score++;
    });

    if (score >= selectedTier.passScore) {
      store.toast("achievement", "PLACED!", `Congratulations! You cleared ${selectedTier.name} assessment (${score}/30)!`);
      store.addXp(500);
    }
  };

  const handleOptionSelect = (qId: number, optionIdx: number) => {
    sound.play("key");
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Score Calculation
  const finalCorrectCount = selectedTier.questions.reduce((acc, q) => {
    return userAnswers[q.id] === q.answer ? acc + 1 : acc;
  }, 0);
  const passedExam = finalCorrectCount >= selectedTier.passScore;

  return (
    <div className="scroll-thin h-full flex flex-col justify-between overflow-y-auto pr-1 font-mono text-xs">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink pb-2 mb-2 shrink-0">
        <div>
          <h2 className="font-display text-xl font-black">🎓 CAMPUS RECRUITMENT & PLACEMENT ASSESSMENT</h2>
          <p className="mono-label text-[10px] text-stone-500">
            90 CAMPUS PLACEMENT MCQs · 3 COMPANY ASSESSMENT TIERS
          </p>
        </div>
      </div>

      {/* CAMPUS PLACEMENT APTITUDE & TECHNICAL EXAM */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          {/* STEP 1: COMPANY TIER SELECTOR */}
          {!inExam && !examSubmitted && (
            <div className="space-y-3 my-auto">
              <div className="bg-stone-900 text-white p-3 border-2 border-lab-ink rounded">
                <h3 className="font-display text-lg text-amber-400 font-black">🎓 CAMPUS RECRUITMENT ASSESSMENT ENGINE</h3>
                <p className="text-xs text-stone-300">
                  Select a company tier below. Each assessment contains <b>30 Mixed Questions</b> (Logical Reasoning, Quantitative Maths, Verbal English, Technical CS). Pass with <b>70%+ (21/30)</b> to earn an official Offer Letter & Placement Certificate!
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {COMPANY_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className="brut brut-press flex flex-col justify-between bg-card p-4 border-3 border-lab-ink rounded hover:bg-amber-50 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">{tier.logoEmoji}</span>
                        <Tag tone={tier.id === "level3" ? "red" : tier.id === "level2" ? "yellow" : "green"}>
                          {tier.id.toUpperCase()}
                        </Tag>
                      </div>
                      <h4 className="font-display text-base font-black text-stone-900 leading-tight mb-1">{tier.name}</h4>
                      <p className="font-bold text-xs text-emerald-700 mb-1">{tier.role}</p>
                      <p className="mono-label text-[10px] text-amber-800 font-black mb-2">CTC: {tier.ctc}</p>
                      <p className="text-[11px] text-stone-600 leading-snug mb-3">{tier.description}</p>
                    </div>

                    <div className="border-t border-stone-300 pt-2 mt-auto flex justify-between items-center">
                      <span className="text-[10px] text-stone-500">⏱️ {tier.timeLimitSec / 60} MINS</span>
                      <BrutButton variant="go" className="text-xs" onClick={() => startExam(tier)}>
                        START EXAM →
                      </BrutButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE EXAM RUNNER */}
          {inExam && !examSubmitted && (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              {/* Exam HUD */}
              <div className="brut bg-stone-900 text-white p-2 flex justify-between items-center border-2 border-lab-ink">
                <div>
                  <span className="font-black text-amber-400">{selectedTier.logoEmoji} {selectedTier.name}</span>
                  <span className="text-xs text-stone-400 ml-2">({selectedTier.role})</span>
                </div>
                <div className="flex items-center gap-3 font-mono font-bold text-xs">
                  <span>TIME REMAINING: <b className="text-rose-400 text-sm">{formatTimer(timeLeftSec)}</b></span>
                  <BrutButton variant="danger" className="text-[10px] py-1" onClick={finishExam}>
                    SUBMIT EXAM
                  </BrutButton>
                </div>
              </div>

              {/* Question Navigation Grid */}
              <div className="flex gap-1 overflow-x-auto pb-1 bg-stone-100 p-2 border border-stone-300 rounded scroll-thin">
                {selectedTier.questions.map((q, idx) => {
                  const answered = userAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIdx(idx)}
                      className={`w-7 h-7 shrink-0 text-[10px] font-bold rounded border ${
                        isCurrent
                          ? "bg-amber-400 text-black border-black font-black scale-110"
                          : answered
                            ? "bg-emerald-600 text-white border-black"
                            : "bg-white text-stone-700 border-stone-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Card */}
              {(() => {
                const curQ: AptitudeQuestion = selectedTier.questions[currentQIdx]!;
                return (
                  <div className="brut bg-card p-4 border-3 border-lab-ink rounded space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b pb-2 border-stone-300">
                        <span className="font-bold text-stone-800">
                          QUESTION {currentQIdx + 1} OF 30
                        </span>
                        <Tag tone="purple">{curQ.category.toUpperCase()}</Tag>
                      </div>

                      <p className="font-display text-base text-stone-900 font-black mt-3 leading-snug">
                        {curQ.question}
                      </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 my-3">
                      {curQ.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[curQ.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionSelect(curQ.id, optIdx)}
                            className={`brut brut-press p-3 text-left border-2 border-lab-ink rounded font-bold text-xs flex items-center gap-2 transition-all ${
                              isSelected
                                ? "bg-amber-400 text-black shadow-md border-black font-black"
                                : "bg-white hover:bg-stone-100 text-stone-800"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-black ${isSelected ? "bg-black text-white" : "bg-stone-200"}`}>
                              {["A", "B", "C", "D"][optIdx]}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Prev / Next Controls */}
                    <div className="flex justify-between items-center border-t pt-2 border-stone-300">
                      <BrutButton
                        disabled={currentQIdx === 0}
                        onClick={() => setCurrentQIdx(currentQIdx - 1)}
                      >
                        ← PREVIOUS
                      </BrutButton>
                      <span className="text-[10px] text-stone-500">
                        ANSWERED: {Object.keys(userAnswers).length}/30
                      </span>
                      {currentQIdx < 29 ? (
                        <BrutButton variant="go" onClick={() => setCurrentQIdx(currentQIdx + 1)}>
                          NEXT QUESTION →
                        </BrutButton>
                      ) : (
                        <BrutButton variant="go" className="bg-emerald-600 text-white" onClick={finishExam}>
                          FINISH & SUBMIT
                        </BrutButton>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 3: EXAM RESULT & OFFER LETTER GENERATOR */}
          {examSubmitted && (
            <div className="space-y-4 my-auto">
              <div className={`brut p-4 border-3 border-lab-ink rounded text-center space-y-2 ${passedExam ? "bg-emerald-100 border-emerald-600" : "bg-rose-100 border-rose-600"}`}>
                <h3 className={`font-display text-3xl font-black ${passedExam ? "text-emerald-700" : "text-rose-700"}`}>
                  {passedExam ? "🎉 PLACEMENT ASSESSMENT PASSED!" : "❌ ASSESSMENT NOT CLEARED"}
                </h3>
                <p className="text-sm text-stone-800">
                  FINAL SCORE: <b>{finalCorrectCount} / 30</b> ({(finalCorrectCount / 30 * 100).toFixed(1)}%) — REQUIRED: 21 / 30 (70%)
                </p>

                <div className="flex justify-center gap-2 pt-2">
                  <BrutButton onClick={() => setExamSubmitted(false)}>
                    TRY AGAIN
                  </BrutButton>
                  <BrutButton variant="go" onClick={() => startExam(selectedTier)}>
                    RE-TAKE ASSESSMENT
                  </BrutButton>
                </div>
              </div>

              {/* OFFICIAL OFFER LETTER & CERTIFICATE (UNLOCKED ON PASSING) */}
              {passedExam && (
                <div className="brut bg-amber-50 p-6 border-4 border-lab-ink rounded-lg shadow-2xl space-y-4 text-stone-900 relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-10 font-display text-8xl select-none">
                    {selectedTier.logoEmoji}
                  </div>

                  {/* Header Logo & Seal */}
                  <div className="flex justify-between items-center border-b-2 border-stone-800 pb-3">
                    <div>
                      <h2 className="font-display text-2xl font-black text-stone-900 tracking-wider">
                        {selectedTier.logoEmoji} {selectedTier.name}
                      </h2>
                      <p className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">
                        CORPORATE PLACEMENT & HUMAN RESOURCES DIVISION
                      </p>
                    </div>
                    <div className="border-2 border-emerald-700 bg-emerald-100 px-3 py-1 text-center rounded rotate-3 shadow">
                      <span className="font-black text-emerald-800 text-xs block">OFFICIAL SELECTION</span>
                      <span className="text-[9px] text-emerald-600 font-bold">VERIFIED PLACEMENT</span>
                    </div>
                  </div>

                  {/* Candidate Name Input */}
                  <div className="flex items-center gap-2 bg-white p-2 border border-stone-400 rounded">
                    <span className="mono-label text-[10px] text-stone-500 font-bold">CANDIDATE NAME:</span>
                    <input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value.toUpperCase())}
                      className="font-bold text-sm text-stone-900 bg-transparent flex-1 focus:outline-none"
                    />
                  </div>

                  {/* Formal Body Text */}
                  <div className="space-y-2 text-xs leading-relaxed text-stone-800 bg-white/70 p-4 border border-stone-300 rounded">
                    <p><b>Dear {candidateName},</b></p>
                    <p>
                      We are delighted to formally offer you the position of <b>{selectedTier.role}</b> at <b>{selectedTier.name}</b>.
                      You successfully demonstrated exceptional aptitude, analytical reasoning, and technical mastery in our 30-question assessment, scoring <b>{finalCorrectCount}/30</b>.
                    </p>

                    <div className="grid grid-cols-2 gap-2 my-2 p-2 bg-amber-100/70 border border-amber-300 rounded text-[11px]">
                      <div>DESIGNATION: <b>{selectedTier.role}</b></div>
                      <div>ANNUAL CTC: <b className="text-emerald-700">{selectedTier.ctc}</b></div>
                      <div>LOCATION: <b>CAMPUS LAB HEADQUARTERS</b></div>
                      <div>JOINING DATE: <b>IMMEDIATE UPON GRADUATION</b></div>
                    </div>

                    <p className="text-[11px] text-stone-600 italic">
                      This offer is valid upon presentation of this official Escaper Placement Certificate. Welcome to the team!
                    </p>
                  </div>

                  {/* Signatures & Print */}
                  <div className="flex justify-between items-end border-t-2 border-stone-800 pt-3">
                    <div className="text-[10px] text-stone-600">
                      <p className="font-bold">AUTHORIZED SIGNATURE:</p>
                      <p className="font-serif italic text-base font-bold text-stone-800">Director of Talent Acquisition</p>
                      <p>DR. ARYAN SHARMA (LAB 404 CHAIR)</p>
                    </div>

                    <BrutButton
                      variant="go"
                      className="bg-emerald-600 text-white font-black"
                      onClick={() => {
                        sound.play("click");
                        window.print();
                      }}
                    >
                      🖨️ PRINT OFFER LETTER
                    </BrutButton>
                  </div>
                </div>
              )}

              {/* QUESTION EXPLANATIONS REVIEW */}
              <div className="bg-stone-900 text-white p-3 border-2 border-lab-ink rounded space-y-2">
                <h4 className="font-display text-base text-amber-400 font-black">📖 ASSESSMENT EXPLANATIONS REVIEW</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scroll-thin">
                  {selectedTier.questions.map((q, idx) => {
                    const userAns = userAnswers[q.id];
                    const isCorrect = userAns === q.answer;
                    return (
                      <div key={q.id} className={`p-2 border rounded text-[11px] ${isCorrect ? "bg-emerald-950 border-emerald-700" : "bg-rose-950 border-rose-700"}`}>
                        <div className="flex justify-between font-bold">
                          <span>Q{idx + 1}: {q.question}</span>
                          <span>{isCorrect ? "✅ CORRECT" : "❌ INCORRECT"}</span>
                        </div>
                        <p className="text-[10px] text-stone-300 mt-1">
                          YOUR ANSWER: <b>{userAns !== undefined ? q.options[userAns] : "NONE"}</b> | CORRECT: <b>{q.options[q.answer]}</b>
                        </p>
                        <p className="text-[10px] text-amber-300 mt-0.5 italic">💡 {q.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

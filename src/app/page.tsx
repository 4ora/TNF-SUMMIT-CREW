"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Menu, 
  Bell, 
  Compass, 
  User, 
  Users, 
  Home as HomeIcon, 
  ChevronRight, 
  Flame, 
  Award, 
  MapPin, 
  Sun,
  Activity,
  Play,
  Pause,
  Square,
  CheckCircle,
  Share2,
  X,
  Sparkles,
  QrCode,
  Check,
  Download,
  Trash2
} from "lucide-react";

// Lucide 모듈 버전별 누락을 방지하기 위해 커스텀 SVG 인스타그램 아이콘 선언
const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);


// 기어 타입 정의
interface Gear {
  id: string;
  name: string;
  passportId: string;
  distance: number;
  expedition: number;
  wearCount: number;
  status: "ACTIVE" | "REPAIR" | "RECYCLED";
}

// 피드 타입 정의
interface FeedItem {
  id: string;
  author: string;
  level: number;
  title: string;
  location: string;
  distance: string;
  duration: string;
  gearUsed: string;
  content: string;
  respectCount: number;
  photoColor: string;
  date: string;
  ploggingWeight?: number; // 플로깅 기록 추가
}

export default function AppContainer() {
  // SSR 하이드레이션 불일치 방지용 상태
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // -----------------------------------------
  // 1. 전역 상태 관리 (LocalStorage와 연계)
  // -----------------------------------------
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "record" | "community" | "my">("home");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 마일리지 및 챌린지 상태
  const [mileage, setMileage] = useState<number>(24300);
  const [challengeProgress, setChallengeProgress] = useState<number>(65);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);

  // 보유 장비 상태
  const [gears, setGears] = useState<Gear[]>([
    {
      id: "gear-1",
      name: "Summit Futurelight L5 Jacket",
      passportId: "SC-20381",
      distance: 812,
      expedition: 28,
      wearCount: 74,
      status: "ACTIVE"
    },
    {
      id: "gear-2",
      name: "Summit VECTIV Sky Trail Shoes",
      passportId: "SC-88319",
      distance: 320,
      expedition: 12,
      wearCount: 30,
      status: "ACTIVE"
    }
  ]);
  const [selectedGearId, setSelectedGearId] = useState<string>("gear-1");
  const [activeGearDetail, setActiveGearDetail] = useState<Gear | null>(null);

  // ESG 기여도 수치 상태
  const [esgImpact, setEsgImpact] = useState({
    co2: 17,
    water: 340,
    textile: 4,
    trees: 5,
    driving: 48
  });

  // 커뮤니티 피드 리스트 상태
  const [feedList, setFeedList] = useState<FeedItem[]>([
    {
      id: "feed-1",
      author: "Explorer_Bora",
      level: 3,
      title: "북한산 신선대 트레일러닝 완료",
      location: "Bukhansan, Seoul",
      distance: "5.2 km",
      duration: "1h 10m",
      gearUsed: "Summit Futurelight L5 Jacket",
      content: "습하고 더운 날씨였지만 투습 성능이 우수해 쾌적하게 트레일러닝을 완수했습니다. 역시 서밋 시리즈네요!",
      respectCount: 142,
      photoColor: "from-neutral-900 to-red-950",
      date: "2026.07.28",
      ploggingWeight: 0.8
    },
    {
      id: "feed-2",
      author: "Pacer_Minsoo",
      level: 5,
      title: "한라산 관음사 코스 종주",
      location: "Hallasan, Jeju",
      distance: "18.3 km",
      duration: "6h 40m",
      gearUsed: "Summit VECTIV Sky Trail Shoes",
      content: "거친 현무암 돌길에서도 발목을 단단히 지탱해주고 접지력이 훌륭했습니다. 스탬프 추가 획득 완료!",
      respectCount: 318,
      photoColor: "from-neutral-900 to-neutral-800",
      date: "2026.07.25",
      ploggingWeight: 0
    }
  ]);

  // 가상 GPS 기록 모드 상태
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gpsStats, setGpsStats] = useState({
    distance: 0.0,
    time: 0,
    elevation: 120,
    speed: 0.0,
    ploggingWeight: 0.0 // LNT 플로깅 수거 무게 (kg)
  });
  
  // LNT 플로깅 챌린지 셋업 변수
  const [isLntMode, setIsLntMode] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("북한산 우이암 코스");
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 탐험 종료 요약 및 저널 에디터
  const [lastExpeditionSummary, setLastExpeditionSummary] = useState<any>(null);
  const [showSummaryScreen, setShowSummaryScreen] = useState<boolean>(false);
  const [showJournalEditor, setShowJournalEditor] = useState<boolean>(false);
  const [journalContent, setJournalContent] = useState<string>("");

  // 수선 / 반납 접수 팝업 상태
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnMethod, setReturnMethod] = useState<"store" | "pickup" | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  
  // ☰ 메뉴 드로어 및 리셋 확인 창
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // 고도화 4가지 추가 모달 상태
  const [showSelfCheck, setShowSelfCheck] = useState<boolean>(false); // 자가 진단 가이드 모달
  const [selfCheckAnswers, setSelfCheckAnswers] = useState({
    fabric: false,
    seamSealing: false,
    zipper: false
  });
  const [showSnsExport, setShowSnsExport] = useState<boolean>(false); // SNS 내보내기 모달
  const [exportCardData, setExportCardData] = useState<any>(null);

  // -----------------------------------------
  // 1-1. LocalStorage 동기화 훅
  // -----------------------------------------
  useEffect(() => {
    // 클라이언트 마운트 시 LocalStorage 데이터 복구
    const localMileage = localStorage.getItem("tnf_mileage");
    const localChallengeProgress = localStorage.getItem("tnf_challenge_progress");
    const localChallengeCompleted = localStorage.getItem("tnf_challenge_completed");
    const localGears = localStorage.getItem("tnf_gears");
    const localEsg = localStorage.getItem("tnf_esg");
    const localFeed = localStorage.getItem("tnf_feed");

    if (localMileage) setMileage(Number(localMileage));
    if (localChallengeProgress) setChallengeProgress(Number(localChallengeProgress));
    if (localChallengeCompleted) setChallengeCompleted(localChallengeCompleted === "true");
    if (localGears) setGears(JSON.parse(localGears));
    if (localEsg) setEsgImpact(JSON.parse(localEsg));
    if (localFeed) setFeedList(JSON.parse(localFeed));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("tnf_mileage", mileage.toString());
    localStorage.setItem("tnf_challenge_progress", challengeProgress.toString());
    localStorage.setItem("tnf_challenge_completed", challengeCompleted.toString());
    localStorage.setItem("tnf_gears", JSON.stringify(gears));
    localStorage.setItem("tnf_esg", JSON.stringify(esgImpact));
    localStorage.setItem("tnf_feed", JSON.stringify(feedList));
  }, [mileage, challengeProgress, challengeCompleted, gears, esgImpact, feedList, isLoaded]);

  // 데모 초기화 리셋 함수
  const handleResetDemoData = () => {
    localStorage.clear();
    showToast("데모 데이터를 성공적으로 초기화했습니다. 페이지를 새로고침합니다.");
    setShowDrawer(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // -----------------------------------------
  // 2. 가상 GPS 기록 타이머 로직 (플로깅 데이터 및 궤적 갱신 포함)
  // -----------------------------------------
  useEffect(() => {
    if (isRecording && !isPaused) {
      gpsTimerRef.current = setInterval(() => {
        setGpsStats((prev) => {
          const nextTime = prev.time + 1;
          const nextDistance = parseFloat((prev.distance + 0.012).toFixed(3));
          const nextElevation = prev.elevation + (Math.random() > 0.45 ? 1 : -1);
          const nextSpeed = parseFloat((4.2 + Math.random() * 1.2).toFixed(1));

          return {
            ...prev,
            time: nextTime,
            distance: nextDistance,
            elevation: nextElevation,
            speed: nextSpeed
          };
        });
      }, 1000);
    } else {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
    }

    return () => {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // -----------------------------------------
  // 3. 헬퍼 및 인터랙션 액션 함수
  // -----------------------------------------
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // LNT 플로깅 줍기 버튼 클릭 모션
  const handlePloggingPick = () => {
    setGpsStats(prev => ({
      ...prev,
      ploggingWeight: parseFloat((prev.ploggingWeight + 0.15).toFixed(2))
    }));
    
    // 네온그린 미세 햅틱 폭죽 연출
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.75, x: 0.25 },
      colors: ["#39FF14", "#FFFFFF"]
    });
    
    showToast("쓰레기 회수 성공 (LNT 플로깅 +0.15kg)");
  };

  // Respect 리액션 파티클 터짐 효과 (canvas-confetti)
  const handleRespectClick = (feedId: string) => {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.8 },
      colors: ["#39FF14", "#FFFFFF", "#111111"]
    });

    setFeedList(prev => prev.map(item => {
      if (item.id === feedId) {
        return { ...item, respectCount: item.respectCount + 1 };
      }
      return item;
    }));

    showToast("탐험가에게 경의를 표했습니다 (Respect +1)");
  };

  // 탐험 시작 셋업
  const handleStartSetup = (courseName: string = "북한산 우이암 코스") => {
    setSelectedCourse(courseName);
    setShowSetupModal(true);
  };

  // 기록 시작 실행
  const triggerRecording = () => {
    setShowSetupModal(false);
    setIsRecording(true);
    setIsPaused(false);
    setGpsStats({
      distance: 0.0,
      time: 0,
      elevation: 120,
      speed: 0.0,
      ploggingWeight: 0.0
    });
    setActiveTab("record");
    showToast(`가상 GPS 기록 및 ${isLntMode ? "LNT 플로깅" : "일반 탐험"} 측정을 시작합니다.`);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    showToast(!isPaused ? "측정이 일시 중지되었습니다." : "측정을 재개합니다.");
  };

  // 탐험 완료
  const handleFinishRecording = () => {
    setIsRecording(false);
    const summary = {
      course: selectedCourse,
      distance: gpsStats.distance,
      time: gpsStats.time,
      elevation: gpsStats.elevation,
      gearId: selectedGearId,
      ploggingWeight: isLntMode ? gpsStats.ploggingWeight : 0
    };
    setLastExpeditionSummary(summary);
    setShowSummaryScreen(true);
  };

  // 저널 공유 완료 및 전역 상태 갱신
  const handlePublishJournal = () => {
    if (!lastExpeditionSummary) return;

    const gearUsed = gears.find(g => g.id === lastExpeditionSummary.gearId)?.name || "Summit Equipment";
    
    // 1. 새로운 커뮤니티 피드 업로드
    const newFeed: FeedItem = {
      id: `feed-${Date.now()}`,
      author: "Explorer_Bora",
      level: 3,
      title: `${lastExpeditionSummary.course} 완주 기록`,
      location: "Bukhansan, Seoul",
      distance: `${lastExpeditionSummary.distance} km`,
      duration: formatTime(lastExpeditionSummary.time),
      gearUsed: gearUsed,
      content: journalContent || `${lastExpeditionSummary.course} 등반 성공! ${isLntMode ? `LNT 플로깅으로 쓰레기 ${lastExpeditionSummary.ploggingWeight}kg 주우며 흔적 없이 다녀왔습니다.` : "기분 좋게 다녀왔습니다!"}`,
      respectCount: 0,
      photoColor: "from-neutral-900 to-[#E2231A]/20",
      date: "오늘",
      ploggingWeight: lastExpeditionSummary.ploggingWeight
    };

    setFeedList([newFeed, ...feedList]);

    // 2. 기어 누적 사용거리 및 카운트 반영
    setGears(prev => prev.map(gear => {
      if (gear.id === lastExpeditionSummary.gearId) {
        return {
          ...gear,
          distance: gear.distance + Math.ceil(lastExpeditionSummary.distance),
          expedition: gear.expedition + 1,
          wearCount: gear.wearCount + 1
        };
      }
      return gear;
    }));

    // 3. 챌린지 성공 및 마일리지 적립 (5000M)
    setChallengeCompleted(true);
    setChallengeProgress(100);
    
    let currentM = mileage;
    const targetM = mileage + 5000;
    const interval = setInterval(() => {
      if (currentM < targetM) {
        currentM += 250;
        setMileage(currentM);
      } else {
        clearInterval(interval);
      }
    }, 30);

    // 4. 플로깅 모드 챌린지 추가 시 ESG 추가 적립 반영
    if (isLntMode && lastExpeditionSummary.ploggingWeight > 0) {
      setEsgImpact(prev => ({
        ...prev,
        textile: prev.textile + Math.ceil(lastExpeditionSummary.ploggingWeight),
        water: prev.water + Math.ceil(lastExpeditionSummary.ploggingWeight * 15),
        co2: prev.co2 + Math.ceil(lastExpeditionSummary.ploggingWeight * 0.8),
        trees: prev.trees + (lastExpeditionSummary.ploggingWeight > 1.0 ? 1 : 0)
      }));
    }

    setShowJournalEditor(false);
    setShowSummaryScreen(false);
    setActiveTab("community");
    setJournalContent("");
    setIsLntMode(false);
    
    confetti({
      particleCount: 100,
      spread: 80,
      colors: ["#E2231A", "#FFFFFF", "#39FF14"]
    });
    
    showToast("저널 발행 완료! 마일리지 +5,000 M가 적립되었습니다.");
  };

  // 자가 점검 진단표 제출 프로세스 ➔ 수선 접수
  const handleSelfCheckSubmit = () => {
    if (!selfCheckAnswers.fabric && !selfCheckAnswers.seamSealing && !selfCheckAnswers.zipper) {
      showToast("하나 이상의 진단 문항을 선택하셔야 판정 라벨이 도출됩니다.");
      return;
    }
    
    // 점검 완료 후 수선 접수로 다이렉트 이행
    if (activeGearDetail) {
      setGears(prev => prev.map(g => {
        if (g.id === activeGearDetail.id) {
          return { ...g, status: "REPAIR" };
        }
        return g;
      }));
      setActiveGearDetail(prev => prev ? { ...prev, status: "REPAIR" } : null);
      setShowSelfCheck(false);
      showToast("자가 점검 판정[REPAIR 권장]에 따라 공식 수선 센터에 접수되었습니다.");
    }
  };

  // 장비 반납(Return) 및 ESG 수치 업데이트
  const handleReturnConfirm = () => {
    if (!activeGearDetail) return;
    
    setGears(prev => prev.map(g => {
      if (g.id === activeGearDetail.id) {
        return { ...g, status: "RECYCLED" };
      }
      return g;
    }));

    // 마일리지 +10,000 M
    let currentM = mileage;
    const targetM = mileage + 10000;
    const mInterval = setInterval(() => {
      if (currentM < targetM) {
        currentM += 500;
        setMileage(currentM);
      } else {
        clearInterval(mInterval);
      }
    }, 25);

    // ESG 지표 점진적 갱신
    setEsgImpact(prev => ({
      co2: prev.co2 + 17,
      water: prev.water + 340,
      textile: prev.textile + 4,
      trees: prev.trees + 5,
      driving: prev.driving + 48
    }));

    setShowQRModal(false);
    setShowReturnModal(false);
    setActiveGearDetail(null);
    setActiveTab("my");
    
    confetti({
      particleCount: 150,
      spread: 90,
      colors: ["#39FF14", "#E2231A", "#FFFFFF"]
    });

    showToast("반납 프로세스 완료! 마일리지 +10,000 M 및 ESG 지표가 갱신되었습니다.");
  };

  // SNS 공유 스토리 카드 모달 노출 셋팅
  const triggerSnsExport = (courseName: string, distance: string, duration: string, plogging: number = 0) => {
    setExportCardData({
      courseName,
      distance,
      duration,
      plogging
    });
    setShowSnsExport(true);
  };

  // 시간 포맷팅 헬퍼
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-black min-h-screen text-white font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-t-[#E2231A] border-neutral-800 animate-spin"></span>
          <span>THE NORTH FACE SUMMIT CREW LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-neutral-950 font-sans min-h-screen text-white select-none relative">
      
      {/* 390px 모바일 뷰포트 프레임 */}
      <div className="w-full max-w-[390px] h-[844px] bg-black border-x border-neutral-900 shadow-2xl relative flex flex-col justify-between overflow-hidden rounded-[40px]">
        
        {/* 상단 노치 바 데코 */}
        <div className="w-full h-7 bg-black flex justify-between items-center px-6 text-[11px] font-mono text-neutral-500 z-50">
          <span>01:07</span>
          <div className="w-16 h-4 bg-neutral-900 rounded-full mx-auto"></div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-4 h-2 border border-neutral-600 rounded-sm"></div>
          </div>
        </div>

        {/* 상단 헤더 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 bg-black/85 backdrop-blur-md sticky top-0 z-40">
          <button 
            onClick={() => setShowDrawer(true)}
            className="text-white hover:text-neutral-400 p-1"
          >
            <Menu size={20} className="stroke-[1.5]" />
          </button>
          
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black tracking-[0.25em] text-white">THE NORTH FACE</span>
            <div className="w-[14px] h-[9px] flex flex-col justify-between">
              <span className="block h-[1.5px] bg-white w-full rounded-full"></span>
              <span className="block h-[1.5px] bg-white w-[80%] rounded-full"></span>
              <span className="block h-[1.5px] bg-[#E2231A] w-[60%] rounded-full"></span>
            </div>
          </div>

          <button 
            onClick={() => showToast("읽지 않은 수신 알림 메시지가 없습니다.")}
            className="text-white hover:text-neutral-400 p-1 relative"
          >
            <Bell size={20} className="stroke-[1.5]" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#E2231A] rounded-full"></span>
          </button>
        </header>

        {/* -----------------------------------------
            스크린 컴포넌트 라우팅
        ----------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-none pb-24 z-10">
          
          {/* 1. HOME TAB */}
          {activeTab === "home" && !showSummaryScreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold font-mono">Summit Crew Edition</span>
                <h1 className="text-2xl font-black tracking-tight text-white">Good Morning, Bora.</h1>
              </div>

              {/* 날씨 및 위치 */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl relative overflow-hidden">
                <div className="absolute right-4 top-4 text-neutral-800/40 pointer-events-none">
                  <Sun size={68} className="stroke-[0.5]" />
                </div>
                <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-mono mb-1.5">
                  <MapPin size={11} className="text-[#E2231A]" />
                  <span>BUKHANSAN, SEOUL</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black tracking-tighter text-white">23°C</span>
                  <span className="text-[10px] font-bold text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full">맑음 · 등산지수 우수</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-[210px]">
                  오늘 백운대 방향은 가시거리가 우수해 최적의 트레일 코스를 제공합니다.
                </p>
              </div>

              {/* 거대한 START EXPEDITION 핵심 버튼 */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => handleStartSetup("북한산 우이암 코스")}
                  className="w-full bg-[#E2231A] hover:bg-[#c11c14] text-white py-5 px-6 rounded-xl flex flex-col items-center justify-center gap-1.5 font-black transition-colors shadow-lg shadow-[#E2231A]/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1.5px] bg-white/25"></div>
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="animate-pulse text-white" />
                    <span className="text-[15px] uppercase tracking-[0.2em] font-black">START EXPEDITION</span>
                  </div>
                  <span className="text-[9px] text-white/70 font-mono tracking-wider">TAP TO CONFIGURE LIVE ROUTE & GEAR</span>
                </button>
              </motion.div>

              {/* 오늘의 챌린지 */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>TODAY'S MISSION // GOAL</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${challengeCompleted ? "text-[#39FF14] bg-[#39FF14]/10" : "text-neutral-400 bg-neutral-800"}`}>
                    {challengeCompleted ? "100% COMPLETED" : `${challengeProgress}% IN PROGRESS`}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Award size={15} className={challengeCompleted ? "text-[#39FF14]" : "text-neutral-400"} />
                    주말 챌린지: 고도 800m 정복하기
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">탐험 기록 완료 시 보상이 마일리지에 반영됩니다.</p>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${challengeCompleted ? "bg-[#39FF14]" : "bg-neutral-400"}`}
                      style={{ width: `${challengeProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                    <span>{challengeCompleted ? "800m" : "520m"} 등반 완료</span>
                    <span>목표: 800m</span>
                  </div>
                </div>
              </div>

              {/* 추천 코스 */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="h-28 bg-gradient-to-tr from-neutral-950 to-neutral-800 p-4 flex flex-col justify-end relative">
                  <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                  <span className="text-[9px] font-mono tracking-widest text-[#E2231A] bg-black/60 px-2 py-0.5 rounded w-max mb-1.5 relative z-10">RECOMMENDED TRAIL</span>
                  <h4 className="text-base font-black text-white relative z-10">북한산 우이암 코스</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-neutral-800 pb-3 font-mono">
                    <div>
                      <span className="block text-[9px] text-neutral-500 uppercase">LEVEL</span>
                      <span className="font-bold text-white">중급</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-neutral-500 uppercase">TIME</span>
                      <span className="font-bold text-white">2.5h</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-neutral-500 uppercase">DIST</span>
                      <span className="font-bold text-white">4.2 km</span>
                    </div>
                  </div>
                  <div className="bg-black border border-neutral-800 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-mono text-neutral-500 block">SPEC MATCHING GEAR</span>
                      <span className="text-xs font-bold text-white">Summit Futurelight Jacket</span>
                    </div>
                    <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded text-neutral-300">
                      FUTURELIGHT
                    </span>
                  </div>
                </div>
              </div>

              {/* 최근 등산 */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>RECENT ACTIVITY HISTORY</span>
                  <span>2026.07.28</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-white">도봉산 신선대 트레일러닝</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">5.2 km 완료 · 1시간 10분 소요</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#39FF14]">+120 M</span>
                </div>
              </div>

              {/* 마일리지 카드 */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 flex gap-0.5 h-10 pointer-events-none">
                  <span className="w-1 bg-white h-full"></span>
                  <span className="w-0.5 bg-white h-full"></span>
                  <span className="w-2 bg-white h-full"></span>
                  <span className="w-0.5 bg-white h-full"></span>
                  <span className="w-1.5 bg-white h-full"></span>
                  <span className="w-1 bg-white h-full"></span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">The Dream Membership Mileage</span>
                  <div className="flex items-center gap-1.5">
                    <Flame size={15} className="text-[#E2231A]" />
                    <span className="text-lg font-black text-white">{mileage.toLocaleString()} M</span>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-widest bg-neutral-800 border border-neutral-700 px-2 py-1 rounded text-neutral-300 font-mono">
                  CREW LEVEL 3
                </span>
              </div>
            </motion.div>
          )}

          {/* 2. EXPLORE TAB */}
          {activeTab === "explore" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-mono">Explore Trails</h2>
              
              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center gap-2 text-neutral-500 text-xs cursor-pointer">
                <span>🔍 코스, 피크, 또는 크루 검색...</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="bg-white text-black font-black px-3 py-1 rounded-full whitespace-nowrap">등산 🏔️</span>
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1 rounded-full whitespace-nowrap">트레일러닝 🏃</span>
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1 rounded-full whitespace-nowrap">백패킹 🎒</span>
              </div>

              <div className="h-64 bg-neutral-900 border border-neutral-800 rounded-xl relative flex items-center justify-center overflow-hidden">
                <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 100 100">
                  <path d="M10,80 Q30,40 50,70 T90,20" fill="none" stroke="#E2231A" strokeWidth="2" strokeDasharray="3,3" />
                  <circle cx="50" cy="70" r="3" fill="#39FF14" />
                  <circle cx="90" cy="20" r="3" fill="#E2231A" />
                </svg>
                <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 rounded text-[9px] font-mono border border-neutral-800">
                  GPS MAP SIMULATION VIEW
                </div>
                <span className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Map Interface</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-mono text-neutral-500 uppercase">Recommended Peak Courses</h3>
                
                {[
                  { name: "설악산 대청봉 최단코스", level: "전문가", dist: "12.4 km", time: "5.5h", gear: "Futurelight L5 Jacket" },
                  { name: "지리산 천왕봉 코스", level: "전문가", dist: "14.2 km", time: "6.0h", gear: "VECTIV Trail Shoes" },
                  { name: "북한산 우이암 코스", level: "중급", dist: "4.2 km", time: "2.5h", gear: "Futurelight L5 Jacket" }
                ].map((course, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleStartSetup(course.name)} 
                    className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-white">{course.name}</h4>
                      <span className="text-[9px] bg-red-950/40 text-[#E2231A] px-2 py-0.5 rounded border border-[#E2231A]/30 font-mono">
                        {course.level}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 font-mono">
                      <span>거리: {course.dist} | 소요시간: {course.time}</span>
                      <span className="text-white hover:underline flex items-center gap-0.5">선택 <ChevronRight size={10} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3. RECORD TAB */}
          {activeTab === "record" && !showSummaryScreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#E2231A] animate-pulse">
                    {isRecording ? "🔴 RECORDING ACTIVE" : "🟢 RECORDER STANDBY"}
                  </span>
                  {isLntMode && (
                    <span className="text-[9px] font-mono text-[#39FF14] bg-[#39FF14]/15 px-2 py-0.5 rounded border border-[#39FF14]/30 font-bold uppercase">
                      LNT Plogging On
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 font-mono">{selectedCourse}</span>
              </div>

              {/* 기록 화면 및 플로깅 수거액션 인터페이스 */}
              <div className="h-60 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                  <path d="M30,170 Q70,90 100,120 T170,40" fill="none" stroke="#262626" strokeWidth="3" />
                  {isRecording && (
                    <motion.path 
                      d="M30,170 Q70,90 100,120 T170,40" 
                      fill="none" 
                      stroke="#E2231A" 
                      strokeWidth="3" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: Math.min(gpsStats.distance / 4.2, 1) }}
                      transition={{ ease: "linear" }}
                    />
                  )}
                  <circle cx="30" cy="170" r="4" fill="#39FF14" />
                  <circle cx="170" cy="40" r="4" fill="#E2231A" />
                </svg>

                {/* 2. LNT 플로깅 챌린지 줍기 버튼 인터랙션 */}
                {isRecording && isLntMode && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePloggingPick}
                    className="absolute bottom-3 left-3 bg-[#39FF14] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-[#39FF14]/30 z-20"
                  >
                    <Trash2 size={20} className="stroke-[2.5]" />
                  </motion.button>
                )}
                
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[9px] font-mono border border-neutral-800">
                  {isLntMode ? "LNT PLOGGING SIMULATOR" : "GPS SIMULATOR"}
                </div>
              </div>

              {/* 실시간 계측 수치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">DISTANCE</span>
                  <span className="text-2xl font-black tracking-tight text-white">{gpsStats.distance.toFixed(2)} km</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">TIME</span>
                  <span className="text-2xl font-black tracking-tight text-white font-mono">{formatTime(gpsStats.time)}</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">ALTITUDE</span>
                  <span className="text-2xl font-black tracking-tight text-white">{gpsStats.elevation} m</span>
                </div>
                
                {/* LNT 모드일 때는 속도 대신 줍기 중량 표시 */}
                {isLntMode ? (
                  <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-1 border-[#39FF14]/30">
                    <span className="text-[10px] text-[#39FF14] uppercase font-mono font-bold block">PLOGGING BAG</span>
                    <span className="text-2xl font-black tracking-tight text-[#39FF14]">{gpsStats.ploggingWeight.toFixed(2)} kg</span>
                  </div>
                ) : (
                  <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">SPEED</span>
                    <span className="text-2xl font-black tracking-tight text-white">{gpsStats.speed.toFixed(1)} km/h</span>
                  </div>
                )}
              </div>

              {/* 기어 */}
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-neutral-400">착용 기어:</span>
                <span className="font-bold text-white font-mono">
                  {gears.find(g => g.id === selectedGearId)?.name || "장비 없음"}
                </span>
              </div>

              {/* 기록 제어 */}
              <div className="pt-2">
                {!isRecording ? (
                  <button 
                    onClick={() => handleStartSetup(selectedCourse)}
                    className="w-full bg-[#E2231A] py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Play size={16} fill="white" /> 탐험 기록 시작하기
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={togglePause}
                      className="bg-neutral-900 border border-neutral-800 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Pause size={16} /> {isPaused ? "재개" : "일시정지"}
                    </button>
                    
                    <button 
                      onClick={handleFinishRecording}
                      className="bg-[#E2231A] hover:bg-[#c11c14] py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-red-950/20"
                    >
                      <Square size={16} fill="white" /> 탐험 종료
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. COMMUNITY TAB */}
          {activeTab === "community" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-mono">Summit Feed</h2>

              {feedList.map((feed) => (
                <div key={feed.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden space-y-3 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 text-xs font-mono font-bold text-white">
                        {feed.author[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white">{feed.author}</span>
                        <span className="block text-[9px] font-mono text-neutral-500 uppercase">EXPLORER LEVEL {feed.level}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">{feed.date}</span>
                  </div>

                  <div className={`h-44 bg-gradient-to-br ${feed.photoColor} rounded-lg flex items-center justify-center border border-neutral-800/80 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-950/70 to-neutral-950"></div>
                    <div className="z-10 text-center space-y-1">
                      <h3 className="text-sm font-black text-white tracking-tight">{feed.title}</h3>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                        <MapPin size={9} className="text-[#E2231A]" />
                        <span>{feed.location}</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-3 left-3 bg-black/85 border border-neutral-800 px-2.5 py-1 rounded text-[10px] font-mono flex gap-3 text-neutral-300">
                      <span>{feed.distance}</span>
                      <span>{feed.duration}</span>
                      {feed.ploggingWeight ? feed.ploggingWeight > 0 && (
                        <span className="text-[#39FF14] font-bold">🗑️ {feed.ploggingWeight}kg</span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">{feed.content}</p>

                  <div className="bg-black/60 border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>🏷️ 착용 장비:</span>
                    <span className="text-white font-bold">{feed.gearUsed}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                    <button 
                      onClick={() => handleRespectClick(feed.id)}
                      className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#39FF14] transition-colors"
                    >
                      <Sparkles size={14} className="text-[#39FF14]" />
                      <span>Respect ({feed.respectCount})</span>
                    </button>

                    {/* 4. SNS 공유 템플릿 트리거 */}
                    <button 
                      onClick={() => triggerSnsExport(feed.title, feed.distance, feed.duration, feed.ploggingWeight || 0)}
                      className="flex items-center gap-1 text-xs text-neutral-500 font-mono hover:underline"
                    >
                      <InstagramIcon size={11} /> Share Story
                    </button>

                    <button 
                      onClick={() => showToast("댓글 기능은 다음 버전에서 구현됩니다.")}
                      className="text-xs text-neutral-500 font-mono hover:underline"
                    >
                      Comments
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 5. MY TAB */}
          {activeTab === "my" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-lg font-mono font-bold text-white">
                  B
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Bora Kim</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">SUMMIT CREW MEMBER // LEVEL 3</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase">My Technical Gear</h3>
                    <button 
                      onClick={() => showToast("노스페이스 제품 고유 시리얼 등록용 바코드 리더가 실행됩니다.")}
                      className="text-[10px] font-mono text-[#E2231A] hover:underline"
                    >
                      [+ Register Gear]
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {gears.map((gear) => (
                      <div 
                        key={gear.id}
                        onClick={() => setActiveGearDetail(gear)}
                        className={`p-3 border rounded-xl cursor-pointer text-left transition-colors relative overflow-hidden ${
                          gear.status === "RECYCLED" 
                          ? "bg-neutral-900/40 border-neutral-900 opacity-60 pointer-events-none" 
                          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <span className={`absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded font-black ${
                          gear.status === "ACTIVE" 
                          ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30" 
                          : gear.status === "REPAIR"
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                          : "bg-neutral-800 text-neutral-500"
                        }`}>
                          {gear.status}
                        </span>

                        <h4 className="font-bold text-xs text-white max-w-[100px] leading-tight mt-4 mb-2">{gear.name}</h4>
                        <div className="text-[10px] font-mono text-neutral-500 space-y-0.5">
                          <div>누적: {gear.distance} km</div>
                          <div>동반: {gear.expedition} Exp</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ESG 대시보드 */}
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                    <span>MY ECOLOGICAL IMPACT</span>
                    <span className="text-white hover:underline cursor-pointer" onClick={() => showToast("상세 리포트 PDF 다운로드가 개시됩니다.")}>
                      Report ▽
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/60 p-2.5 rounded-lg border border-neutral-800">
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">CO₂ SAVED</span>
                      <span className="text-sm font-black text-white mt-1 block">-{esgImpact.co2} kg</span>
                    </div>
                    <div className="bg-black/60 p-2.5 rounded-lg border border-neutral-800">
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">WATER SAVED</span>
                      <span className="text-sm font-black text-white mt-1 block">-{esgImpact.water} L</span>
                    </div>
                    <div className="bg-black/60 p-2.5 rounded-lg border border-neutral-800">
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">TEXTILE RED.</span>
                      <span className="text-sm font-black text-white mt-1 block">-{esgImpact.textile} kg</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">🌲 구해낸 나무:</span>
                      <span className="font-bold text-[#39FF14] font-mono">{esgImpact.trees} 그루</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">🚗 운행 감소 거리:</span>
                      <span className="font-bold text-white font-mono">{esgImpact.driving} km</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </div>

        {/* -----------------------------------------
            기능 고도화 4가지 추가 모달/바텀시트
        ----------------------------------------- */}
        {/* A. START SETUP MODAL (플로깅 체크 스위치 추가) */}
        <AnimatePresence>
          {showSetupModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
            >
              <motion.div 
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                className="w-full bg-neutral-950 border-t border-neutral-850 rounded-t-3xl p-5 space-y-5 pb-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Expedition Setup</h3>
                  <button onClick={() => setShowSetupModal(false)} className="text-neutral-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">1. Selected Route</span>
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{selectedCourse}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">가상 GPS 매핑 완료</span>
                  </div>
                </div>

                {/* LNT 플로깅 스위치 UI */}
                <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white block">LNT 플로깅 모드 활성화</span>
                    <span className="text-[9px] text-neutral-500 block mt-0.5">등산 중 수거한 쓰레기 무게만큼 ESG 지수 반영</span>
                  </div>
                  <button 
                    onClick={() => setIsLntMode(!isLntMode)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${isLntMode ? "bg-[#39FF14]" : "bg-neutral-800"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isLntMode ? "translate-x-5" : "translate-x-0"}`}></div>
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">2. Select Your Gear to Wear</span>
                  <div className="space-y-2">
                    {gears.filter(g => g.status !== "RECYCLED").map((gear) => (
                      <div 
                        key={gear.id}
                        onClick={() => setSelectedGearId(gear.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer flex justify-between items-center transition-colors ${
                          selectedGearId === gear.id 
                          ? "bg-neutral-900 border-[#E2231A]" 
                          : "bg-neutral-950 border-neutral-850"
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{gear.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400">누적 {gear.distance}km</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={triggerRecording}
                  className="w-full bg-[#E2231A] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                >
                  <Play size={12} fill="white" /> 탐험 기록 시작 (LAUNCH)
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* B. EXPEDITION SUMMARY OVERLAY (SNS 내보내기 버튼 탑재) */}
        <AnimatePresence>
          {showSummaryScreen && lastExpeditionSummary && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-50 flex flex-col justify-between p-5 py-8"
            >
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded-full uppercase font-bold">
                    Expedition Finished successfully
                  </span>
                  <h2 className="text-xl font-black text-white mt-2">GREAT EXPEDITION!</h2>
                  <p className="text-xs text-neutral-500">크루들이 당신의 저널을 기다립니다.</p>
                </div>

                <div className="h-44 bg-neutral-900 border border-neutral-800 rounded-xl relative flex flex-col items-center justify-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-[#E2231A] flex items-center justify-center shadow-lg shadow-red-950">
                    <Award size={28} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-white tracking-wide">탐험 완주 메달 스탬프 획득</span>
                  {lastExpeditionSummary.ploggingWeight > 0 && (
                    <span className="text-[10px] text-[#39FF14] font-mono font-bold">LNT PLOGGING: {lastExpeditionSummary.ploggingWeight}kg 완료</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                    <span className="block text-[8px] text-neutral-500 uppercase">DISTANCE</span>
                    <span className="text-sm font-black text-white block mt-0.5">{lastExpeditionSummary.distance} km</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                    <span className="block text-[8px] text-neutral-500 uppercase">TIME</span>
                    <span className="text-sm font-black text-white block mt-0.5">{formatTime(lastExpeditionSummary.time)}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                    <span className="block text-[8px] text-neutral-500 uppercase">ALTITUDE</span>
                    <span className="text-sm font-black text-white block mt-0.5">{lastExpeditionSummary.elevation} m</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* 4. SNS 내보내기 버튼 추가 */}
                <button 
                  onClick={() => triggerSnsExport(lastExpeditionSummary.course, `${lastExpeditionSummary.distance} km`, formatTime(lastExpeditionSummary.time), lastExpeditionSummary.ploggingWeight)}
                  className="w-full bg-neutral-900 border border-[#39FF14]/30 text-[#39FF14] py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <InstagramIcon size={13} /> Instagram Story로 내보내기
                </button>
                <button 
                  onClick={() => setShowJournalEditor(true)}
                  className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <FileText size={13} /> Expedition Journal 작성
                </button>
                <button 
                  onClick={handlePublishJournal}
                  className="w-full bg-[#E2231A] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Share2 size={13} /> 저널 없이 즉시 피드 공유
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* C. SNS EXPORT 9:16 TEMPLATE POPUP */}
        <AnimatePresence>
          {showSnsExport && exportCardData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 z-[80] p-4 flex flex-col justify-between items-center"
            >
              <div className="w-full flex justify-between items-center text-xs font-mono text-neutral-500">
                <span>SNS EXPORT GENERATOR</span>
                <button onClick={() => setShowSnsExport(false)} className="text-neutral-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* 9:16 비율의 인스타그램 스토리 카드 레이아웃 */}
              <div className="w-[280px] h-[480px] bg-neutral-900 border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                
                {/* 하프돔 오버레이 선 데코 */}
                <div className="absolute right-[-30px] top-[-30px] w-48 h-48 border border-neutral-800/40 rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest text-[#E2231A] block">THE NORTH FACE</span>
                    <span className="text-[12px] font-black text-white block mt-0.5">SUMMIT SERIES</span>
                  </div>
                  <div className="w-[12px] h-[9px] flex flex-col justify-between">
                    <span className="block h-[1.5px] bg-[#E2231A] w-full"></span>
                    <span className="block h-[1.5px] bg-white w-[80%]"></span>
                    <span className="block h-[1.5px] bg-white w-[60%]"></span>
                  </div>
                </div>

                {/* 고도 상승 선 데코 (SVG 패스) */}
                <div className="my-2 text-left space-y-1">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase block">Elevation Profile</span>
                  <div className="h-16 w-full bg-black/35 rounded-lg border border-neutral-850/60 overflow-hidden flex items-end">
                    <svg className="w-full h-12 stroke-[#E2231A]" fill="none">
                      <path d="M0,40 Q30,10 60,30 T120,5 T200,25 T240,40" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="text-left space-y-2">
                  <span className="text-[9px] font-mono text-neutral-500 block uppercase">Expedition Record</span>
                  <h4 className="text-base font-black text-white leading-tight">{exportCardData.courseName}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-left border-t border-neutral-850 pt-2 font-mono">
                    <div>
                      <span className="text-[8px] text-neutral-500 block">DISTANCE</span>
                      <span className="text-xs font-bold text-white">{exportCardData.distance}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-neutral-500 block">DURATION</span>
                      <span className="text-xs font-bold text-white">{exportCardData.duration}</span>
                    </div>
                  </div>

                  {exportCardData.plogging > 0 && (
                    <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 p-2 rounded flex justify-between items-center text-[9px] font-mono text-[#39FF14]">
                      <span>LNT PLOGGING ACTIVE:</span>
                      <span className="font-black">{exportCardData.plogging} kg 수집</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-850 pt-3 flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span>BORA'S EXPEDITION JOURNAL</span>
                  <span>JULY 31, 2026</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  showToast("갤러리에 스토리 포스터 카드가 저장되었습니다.");
                  setShowSnsExport(false);
                }}
                className="w-full bg-[#E2231A] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> 스마트폰 사진첩에 저장하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* D. SELF CARE DIAGNOSIS MODAL (수선 전 자가 점검표) */}
        <AnimatePresence>
          {showSelfCheck && activeGearDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 z-[60] p-5 py-8 flex flex-col justify-between text-left"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-mono text-[#E2231A] uppercase tracking-widest font-black block">GEAR CARE LAB</span>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white mt-0.5">장비 수명 자가 점검표</h3>
                  </div>
                  <button onClick={() => setShowSelfCheck(false)} className="text-neutral-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  수선 접수 전, 자켓 원단 부위의 손상 지표를 직접 자가 진단하여 공식 수선 판정 라벨을 도출해 보십시오.
                </p>

                {/* 3대 점검 문항 */}
                <div className="space-y-3">
                  <div 
                    onClick={() => setSelfCheckAnswers(prev => ({ ...prev, fabric: !prev.fabric }))}
                    className={`p-3.5 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${
                      selfCheckAnswers.fabric ? "bg-neutral-900 border-[#E2231A]" : "bg-neutral-950 border-neutral-800"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selfCheckAnswers.fabric ? "bg-[#E2231A] border-[#E2231A]" : "border-neutral-700"}`}>
                      {selfCheckAnswers.fabric && <Check size={10} className="text-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">겉감 발수력 유실 점검</span>
                      <span className="text-[9px] text-neutral-500 block mt-0.5">물을 뿌렸을 때 스며들지 않고 원단이 축 처짐</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelfCheckAnswers(prev => ({ ...prev, seamSealing: !prev.seamSealing }))}
                    className={`p-3.5 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${
                      selfCheckAnswers.seamSealing ? "bg-neutral-900 border-[#E2231A]" : "bg-neutral-950 border-neutral-800"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selfCheckAnswers.seamSealing ? "bg-[#E2231A] border-[#E2231A]" : "border-neutral-700"}`}>
                      {selfCheckAnswers.seamSealing && <Check size={10} className="text-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">내부 봉제선 테이프 마모 점검</span>
                      <span className="text-[9px] text-neutral-500 block mt-0.5">안쪽 심실링 테이프가 하얗게 일어나고 들뜸</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelfCheckAnswers(prev => ({ ...prev, zipper: !prev.zipper }))}
                    className={`p-3.5 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${
                      selfCheckAnswers.zipper ? "bg-neutral-900 border-[#E2231A]" : "bg-neutral-950 border-neutral-800"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selfCheckAnswers.zipper ? "bg-[#E2231A] border-[#E2231A]" : "border-neutral-700"}`}>
                      {selfCheckAnswers.zipper && <Check size={10} className="text-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">방수 지퍼 파손 점검</span>
                      <span className="text-[9px] text-neutral-500 block mt-0.5">슬라이더 및 지퍼 이빨 엇갈림 또는 결합 뻑뻑함</span>
                    </div>
                  </div>
                </div>

                {/* 공식 진단 라벨 도출 */}
                {(selfCheckAnswers.fabric || selfCheckAnswers.seamSealing || selfCheckAnswers.zipper) && (
                  <div className="bg-[#E2231A]/10 border border-[#E2231A]/30 p-3 rounded-lg text-center space-y-1">
                    <span className="text-[9px] font-mono text-[#E2231A] block">OFFICIAL DIAGNOSIS LABEL</span>
                    <span className="text-xs font-black text-white">자가 진단 결과: 공식 수선 권장 [🔴 REPAIR]</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleSelfCheckSubmit}
                className="w-full bg-white text-black py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                자가 점검 제출 및 공식 수선 센터 접수
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* E. ☰ MENU DRAWER (데모 데이터 리셋 버튼 추가) */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-start"
            >
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="w-[280px] h-full bg-neutral-950 border-r border-neutral-900 p-5 flex flex-col justify-between"
              >
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                    <span className="text-xs font-black tracking-widest text-[#E2231A]">SUMMIT CREW MENUS</span>
                    <button onClick={() => setShowDrawer(false)} className="text-neutral-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="hover:text-[#E2231A] cursor-pointer" onClick={() => { setActiveTab("home"); setShowDrawer(false); }}>🏠 Home Dashboard</div>
                    <div className="hover:text-[#E2231A] cursor-pointer" onClick={() => { setActiveTab("explore"); setShowDrawer(false); }}>🧭 Explore Course</div>
                    <div className="hover:text-[#E2231A] cursor-pointer" onClick={() => { setActiveTab("record"); setShowDrawer(false); }}>▶ Start Record</div>
                    <div className="hover:text-[#E2231A] cursor-pointer" onClick={() => { setActiveTab("community"); setShowDrawer(false); }}>🌍 Crew Feed</div>
                    <div className="hover:text-[#E2231A] cursor-pointer" onClick={() => { setActiveTab("my"); setShowDrawer(false); }}>👤 My Gear & Impact</div>
                  </div>
                </div>

                {/* 가상의 데모 초기화 버튼 */}
                <button 
                  onClick={handleResetDemoData}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400 py-3 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5 hover:border-red-900 hover:text-white transition-colors"
                >
                  <Trash2 size={13} /> 데모 데이터 리셋하기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* F. GEAR DETAIL / PASSPORT SHEET */}
        <AnimatePresence>
          {activeGearDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center"
            >
              <motion.div 
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="w-full bg-neutral-950 border-t border-neutral-850 rounded-t-3xl p-5 space-y-5 max-h-[85%] overflow-y-auto pb-10 scrollbar-none"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#E2231A] uppercase tracking-widest font-black">
                    THE NORTH FACE SUMMIT SERIES
                  </span>
                  <button onClick={() => setActiveGearDetail(null)} className="text-neutral-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4 text-left relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black text-white">{activeGearDetail.name}</h3>
                      <span className="text-[9px] font-mono text-neutral-500 block mt-0.5">Passport ID: {activeGearDetail.passportId}</span>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                      activeGearDetail.status === "ACTIVE" 
                      ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30" 
                      : activeGearDetail.status === "REPAIR"
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                      : "bg-neutral-800 text-neutral-500"
                    }`}>
                      {activeGearDetail.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono py-2 border-y border-neutral-800">
                    <div>
                      <span className="block text-[8px] text-neutral-500 uppercase">EXPEDITION</span>
                      <span className="text-xs font-black text-white mt-0.5">{activeGearDetail.expedition}회</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-neutral-500 uppercase">DISTANCE</span>
                      <span className="text-xs font-black text-white mt-0.5">{activeGearDetail.distance} km</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-neutral-500 uppercase">WEAR COUNT</span>
                      <span className="text-xs font-black text-white mt-0.5">{activeGearDetail.wearCount}회</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-neutral-500 uppercase block">Digital stamps</span>
                    <div className="flex gap-2">
                      <div className="bg-black/50 border border-neutral-800 rounded px-2.5 py-1 text-[10px] flex items-center gap-1 font-bold text-neutral-300">
                        🏔️ Hallasan
                      </div>
                      <div className="bg-black/50 border border-neutral-800 rounded px-2.5 py-1 text-[10px] flex items-center gap-1 font-bold text-neutral-300">
                        🏔️ Seoraksan
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">GEAR JOURNEY TIMELINE</span>
                  <div className="space-y-4 pl-3 border-l border-neutral-800 relative left-1 text-xs">
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#E2231A]"></span>
                      <div className="font-bold text-white">매장 구매 및 시리얼 등록</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">2024.11.15 · 노스페이스 공식 몰</div>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                      <div className="font-bold text-white">한라산 백록담 코스 동반 정복</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">2025.02.10 · 18.4km 완주</div>
                    </div>

                    {activeGearDetail.status === "REPAIR" && (
                      <div className="relative">
                        <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        <div className="font-bold text-yellow-500">수선 센터 입고 완료 (REPAIR)</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">소매 및 방수 지퍼 지지력 수선 진행 중</div>
                      </div>
                    )}

                    {activeGearDetail.status === "RECYCLED" && (
                      <div className="relative">
                        <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-500"></span>
                        <div className="font-bold text-neutral-400">장비 반납 및 섬유 자원 순환 완료 (RECYCLED)</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">My Impact 지표에 반영됨</div>
                      </div>
                    )}
                  </div>
                </div>

                {activeGearDetail.status === "ACTIVE" && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* 3. 자가상태점검 팝업 트리거 추가 */}
                    <button 
                      onClick={() => setShowSelfCheck(true)}
                      className="bg-neutral-900 border border-neutral-800 text-white py-3 rounded-xl text-xs font-bold"
                    >
                      🔧 Repair (수선 신청)
                    </button>
                    <button 
                      onClick={() => setShowReturnModal(true)}
                      className="bg-[#E2231A] text-white py-3 rounded-xl text-xs font-bold"
                    >
                      ♻️ Summit Cycle (반납)
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* G. SUMMIT CYCLE MODAL */}
        <AnimatePresence>
          {showReturnModal && activeGearDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 z-[60] p-5 py-8 flex flex-col justify-between text-left"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Summit Cycle 반납 신청</h3>
                  <button onClick={() => setShowReturnModal(false)} className="text-neutral-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-850">
                  <span className="text-[9px] font-mono text-neutral-500 block">반납 대상 장비</span>
                  <h4 className="text-sm font-bold text-white mt-1">{activeGearDetail.name}</h4>
                  <span className="text-[10px] font-mono text-neutral-400 mt-1 block">누적 사용 거리: {activeGearDetail.distance} km</span>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">반납 방식 선택</span>
                  
                  <div 
                    onClick={() => setReturnMethod("store")}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      returnMethod === "store" 
                      ? "bg-neutral-900 border-[#E2231A]" 
                      : "bg-neutral-950 border-neutral-800"
                    }`}
                  >
                    <h5 className="text-xs font-black text-white">오프라인 매장 방문 반납</h5>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                      가까운 노스페이스 매장(명동, 홍대 직영 등) 수거함에 즉시 스캔하여 반납합니다. (마일리지 즉시 적립)
                    </p>
                  </div>

                  <div 
                    onClick={() => setReturnMethod("pickup")}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      returnMethod === "pickup" 
                      ? "bg-neutral-900 border-[#E2231A]" 
                      : "bg-neutral-950 border-neutral-800"
                    }`}
                  >
                    <h5 className="text-xs font-black text-white">온라인 택배 수거 신청</h5>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                      등록된 집 주소로 수거 기사님이 방문합니다. (제품 센터 도착/검수 후 마일리지 적립)
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => returnMethod === "store" ? setShowQRModal(true) : handleReturnConfirm()}
                disabled={!returnMethod}
                className="w-full bg-[#E2231A] disabled:bg-neutral-900 text-white disabled:text-neutral-600 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
              >
                {returnMethod === "store" ? "QR 바코드 생성하기" : "온라인 반납 접수 완료"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* H. STORE RETURN QR MODAL */}
        <AnimatePresence>
          {showQRModal && activeGearDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-[70] p-5 py-8 flex flex-col justify-between items-center text-center"
            >
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">OFFLINE RETURN BARCODE</span>
                <button onClick={() => setShowQRModal(false)} className="text-neutral-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 flex-1 flex flex-col justify-center items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">매장 제출용 QR</h3>
                  <p className="text-xs text-neutral-400">명동/홍대 노스페이스 써밋 수거 포스기에 제시하세요.</p>
                </div>

                <div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <QrCode size={130} className="text-black stroke-[1.5]" />
                  <div className="absolute bottom-2 font-mono text-[9px] text-neutral-500">
                    {activeGearDetail.passportId}-CYCLE
                  </div>
                </div>

                <div className="text-neutral-500 text-xs font-mono">
                  유효시간: 03:00 분 (갱신대기)
                </div>
              </div>

              <button 
                onClick={handleReturnConfirm}
                className="w-full bg-[#39FF14] text-black py-3.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/20"
              >
                매장 반납 가상 승인 (시뮬레이션 완료)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* I. JOURNAL EDITOR MODAL */}
        <AnimatePresence>
          {showJournalEditor && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-[60] p-5 py-8 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Create Journal</h3>
                  <button onClick={() => setShowJournalEditor(false)} className="text-neutral-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Expedition Review (한줄 소감)</span>
                  <textarea 
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="정상에서의 짜릿한 기분이나, Summit 장비의 투습 및 접지 소감을 한 줄 작성해 보세요."
                    className="w-full h-28 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  />
                </div>

                <div className="border border-dashed border-neutral-800 rounded-lg h-32 flex flex-col items-center justify-center text-neutral-600 text-xs space-y-1.5 cursor-pointer hover:border-neutral-700 transition-colors">
                  <Sparkles size={20} />
                  <span>현장 사진 추가 (갤러리 더미 연동)</span>
                </div>
              </div>

              <button 
                onClick={handlePublishJournal}
                className="w-full bg-[#E2231A] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={13} /> Share to Community Feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 탭바 네비게이션 */}
        <nav className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-neutral-900 grid grid-cols-5 py-3 z-40">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-white" : "text-neutral-500"}`}
          >
            <HomeIcon size={18} className="stroke-[1.5]" />
            <span className="text-[9px] font-mono">HOME</span>
          </button>

          <button 
            onClick={() => setActiveTab("explore")}
            className={`flex flex-col items-center gap-1 ${activeTab === "explore" ? "text-white" : "text-neutral-500"}`}
          >
            <Compass size={18} className="stroke-[1.5]" />
            <span className="text-[9px] font-mono">EXPLORE</span>
          </button>

          {/* 중앙 FAB */}
          <div className="relative flex justify-center -top-5">
            <motion.button 
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveTab("record")}
              className="absolute w-12 h-12 bg-black border border-neutral-800 rounded-full flex items-center justify-center shadow-lg shadow-black/80 group"
            >
              <div className="w-7 h-7 bg-[#E2231A] rounded-full flex items-center justify-center group-hover:bg-[#c11c14] transition-colors shadow-inner">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </motion.button>
            <span className="absolute top-9 text-[9px] font-mono text-neutral-500">RECORD</span>
          </div>

          <button 
            onClick={() => setActiveTab("community")}
            className={`flex flex-col items-center gap-1 ${activeTab === "community" ? "text-white" : "text-neutral-500"}`}
          >
            <Users size={18} className="stroke-[1.5]" />
            <span className="text-[9px] font-mono">COMMUNITY</span>
          </button>

          <button 
            onClick={() => setActiveTab("my")}
            className={`flex flex-col items-center gap-1 ${activeTab === "my" ? "text-white" : "text-neutral-500"}`}
          >
            <User size={18} className="stroke-[1.5]" />
            <span className="text-[9px] font-mono">MY</span>
          </button>
        </nav>

        {/* 전역 토스트 팝업 */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 10, x: "-50%" }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl text-center whitespace-nowrap z-50 text-white flex items-center gap-1.5"
            >
              <span className="w-1 h-1 rounded-full bg-[#E2231A] animate-ping"></span>
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

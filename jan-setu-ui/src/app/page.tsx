"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Scale, FileText, Send, CheckCircle2, Clock, AlertCircle, Building2, UserCheck,
  Eye, Sparkles, Lock, ArrowRight, RefreshCw, Mic, Square, Printer, BadgeCheck,
  Languages, Code2, MapPin, Phone, Mail, Home, User, Award, Globe, Gavel, Flame,
  Volume2, VolumeX, BookOpen, ShieldAlert, SearchCheck, ExternalLink
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const WS_BASE = API_BASE.replace(/^http/, "ws");
const OFFICIAL_RTI_PORTAL_URL = "https://rtionline.gov.in/request/request.php";

type LangCode = "en" | "hi" | "bn" | "ta" | "te";

const LANGUAGES: { code: LangCode; native: string; ttsLang: string }[] = [
  { code: "en", native: "English", ttsLang: "en-IN" },
  { code: "hi", native: "हिंदी", ttsLang: "hi-IN" },
  { code: "bn", native: "বাংলা", ttsLang: "bn-IN" },
  { code: "ta", native: "தமிழ்", ttsLang: "ta-IN" },
  { code: "te", native: "తెలుగు", ttsLang: "te-IN" },
];

const UI_TEXT: Record<LangCode, any> = {
  en: {
    govBanner: "JAN-SETU • UNIFIED CIVIC AI SUITE (ALL 4 TRACK MODULES ACTIVE)",
    appTitle: "Jan-Setu Autonomous Civic Governance & RTI Command Desk",
    pipelineTitle: "Autonomous Execution Pipeline",
    steps: [
      { id: "node_1", step: "01", title: "Legal Synthesis", desc: "Sec 6(1) Petition" },
      { id: "node_2", step: "02", title: "Portal Handshake", desc: "rtionline.gov.in" },
      { id: "node_3", step: "03", title: "Ministry Routing", desc: "Nodal Authority" },
      { id: "node_4", step: "04", title: "DOM Form Fill", desc: "KYC & Legal Text" },
      { id: "node_5", step: "05", title: "Citizen Gate", desc: "CAPTCHA Approval" },
      { id: "node_6", step: "06", title: "Staged & Sealed", desc: "Saved to Phone ID" },
    ],
    col1Title: "Citizen Passbook (Phone Vault ID)",
    legalName: "Full Legal Name",
    mobile: "10-Digit Mobile (Isolates Your Logs)",
    pinCode: "PIN Code",
    email: "Email ID",
    address: "Postal Address",
    feeCat: "Section 7(5) Fee Category",
    stdFee: "Standard (₹10)",
    bplFree: "BPL (₹0 Free)",
    col2Title: "Multimodal Civic Input Desk",
    sampleLabel: "Quick Presets (RTI / Policy / Viral Claim):",
    statementLabel: "Grievance / Policy Text / Viral Claim to Audit",
    lifeLiberty: "Section 7(1) Life & Liberty (48-Hr Urgent Mandate)",
    publicPulseToggle: "Publish Anonymously on Public Accountability Dashboard",
    submitRtiBtn: "Generate RTI & Auto-Fill Govt Portal",
    explainPolicyBtn: "Explain Policy & Rights (Voice)",
    factCheckBtn: "Fact-Check & Deepfake Audit",
    photoTriageBtn: "Run Civic Severity & SLA Triage",
    tabDraft: "Legal RTI",
    tabExplainer: "Policy Explainer",
    tabFact: "Fact & Deepfake Audit",
    tabBrowser: "Portal View",
    tabVault: "My Phone Vault",
    tabPublic: "Public Triage Board",
    listenBtn: "Listen (Indian Voice)",
    stopVoiceBtn: "Stop Audio",
  },
  hi: {
    govBanner: "जन-सेतु • एकीकृत नागरिक लोक सेवा मंच (चारों मॉड्यूल सक्रिय)",
    appTitle: "जन-सेतु स्वायत्त आरटीआई (RTI), नीति, शिकायत एवं फैक्ट-चेक केंद्र",
    pipelineTitle: "स्वायत्त पोर्टल निष्पादन प्रगति",
    steps: [
      { id: "node_1", step: "01", title: "कानूनी प्रारूप", desc: "धारा 6(1) याचिका" },
      { id: "node_2", step: "02", title: "पोर्टल कनेक्शन", desc: "rtionline.gov.in" },
      { id: "node_3", step: "03", title: "मंत्रालय चयन", desc: "नोडल विभाग" },
      { id: "node_4", step: "04", title: "फॉर्म प्रविष्टि", desc: "विवरण एवं याचिका" },
      { id: "node_5", step: "05", title: "नागरिक पुष्टि", desc: "CAPTCHA सत्यापन" },
      { id: "node_6", step: "06", title: "सुरक्षित पावती", desc: "मोबाइल वॉल्ट में सेव" },
    ],
    col1Title: "नागरिक पासबुक (मोबाइल वॉल्ट)",
    legalName: "पूरा कानूनी नाम",
    mobile: "10-अंकीय मोबाइल (लॉग्स की पहचान)",
    pinCode: "पिन कोड",
    email: "ईमेल आईडी",
    address: "डाक पता",
    feeCat: "धारा 7(5) शुल्क श्रेणी",
    stdFee: "सामान्य (₹10)",
    bplFree: "BPL कार्ड (निःशुल्क)",
    col2Title: "मल्टीमॉडल शिकायत, नीति एवं फैक्ट-चेक डेस्क",
    sampleLabel: "उदाहरण चुनें (RTI / सरकारी योजना / वायरल दावा):",
    statementLabel: "अपनी समस्या, सरकारी नीति या वायरल खबर यहाँ लिखें",
    lifeLiberty: "धारा 7(1) जीवन एवं स्वतंत्रता (48-घंटे तत्काल)",
    publicPulseToggle: "पब्लिक डैशबोर्ड पर गुमनाम साझा करें",
    submitRtiBtn: "कानूनी RTI बनाएं और सरकारी फॉर्म भरें",
    explainPolicyBtn: "अधिकार और योजना समझें (आवाज़)",
    factCheckBtn: "फैक्ट-चेक एवं डीपफेक जांच करें",
    photoTriageBtn: "गंभीरता एवं विभाग ट्रायज (Triage) करें",
    tabDraft: "कानूनी RTI",
    tabExplainer: "नीति व्याख्या",
    tabFact: "फैक्ट एवं डीपफेक जांच",
    tabBrowser: "पोर्टल दृश्य",
    tabVault: "मेरा मोबाइल वॉल्ट",
    tabPublic: "पब्लिक डैशबोर्ड",
    listenBtn: "भारतीय आवाज़ में सुनें",
    stopVoiceBtn: "आवाज़ रोकें",
  },
  bn: {
    govBanner: "জন-সেতু • বহুমুখী ডিজিটাল জনসেবা ও অধিকার মঞ্চ",
    appTitle: "জন-সেতু স্বয়ংক্রিয় আরটিআই (RTI), নীতি ও ফ্যাক্ট-চেক কেন্দ্র",
    pipelineTitle: "স্বয়ংক্রিয় পোর্টাল কার্যপ্রণালী",
    steps: [
      { id: "node_1", step: "01", title: "আইনি খসড়া", desc: "ধারা ৬(১) আবেদন" },
      { id: "node_2", step: "02", title: "পোর্টাল সংযোগ", desc: "rtionline.gov.in" },
      { id: "node_3", step: "03", title: "মন্ত্রক নির্বাচন", desc: "নোডাল বিভাগ" },
      { id: "node_4", step: "04", title: "ফর্ম পূরণ", desc: "তথ্য ও আবেদন" },
      { id: "node_5", step: "05", title: "নাগরিক যাচাই", desc: "CAPTCHA অনুমোদন" },
      { id: "node_6", step: "06", title: "চূড়ান্ত রসিদ", desc: "ফোন ভল্টে সংরক্ষিত" },
    ],
    col1Title: "নাগরিক পাসবুক (ফোন ভল্ট)",
    legalName: "সম্পূর্ণ আইনি নাম",
    mobile: "১০-সংখ্যার মোবাইল নম্বর",
    pinCode: "পিন কোড",
    email: "ইমেল আইডি",
    address: "ডাক ঠিকানা",
    feeCat: "ধারা ৭(৫) ফি বিভাগ",
    stdFee: "সাধারণ (₹১০)",
    bplFree: "BPL (বিনামূল্যে)",
    col2Title: "জন-অভিযোগ, নীতি ও ফ্যাক্ট-চেক ডেস্ক",
    sampleLabel: "নমুনা নাগরিক সমস্যা ও প্রকল্প:",
    statementLabel: "আপনার সমস্যা, প্রকল্প বা ভাইরাল দাবি লিখুন",
    lifeLiberty: "ধারা ৭(১) জীবন ও স্বাধীনতা (৪৮ ঘণ্টা জরুরি)",
    publicPulseToggle: "নাম গোপন রেখে পাবলিক বোর্ডে শেয়ার করুন",
    submitRtiBtn: "আইনি RTI তৈরি করুন ও পোর্টাল পূরণ করুন",
    explainPolicyBtn: "নীতি ও অধিকার বুঝুন (ভয়েস)",
    factCheckBtn: "ফ্যাক্ট-চেক ও ডিপফেক যাচাই",
    photoTriageBtn: "সমস্যার গুরুত্ব ও বিভাগ যাচাই (Triage)",
    tabDraft: "আইনি RTI",
    tabExplainer: "নীতি ব্যাখ্যা",
    tabFact: "ফ্যাক্ট ও ডিপফেক যাচাই",
    tabBrowser: "পোর্টাল ভিউ",
    tabVault: "আমার ফোন ভল্ট",
    tabPublic: "পাবলিক বোর্ড",
    listenBtn: "কথাটি শুনুন",
    stopVoiceBtn: "থামুন",
  },
  ta: {
    govBanner: "ஜன்-சேது • பலமொழி டிஜிட்டல் பொது சேவை தளம்",
    appTitle: "ஜன்-சேது தன்னாட்சி RTI, கொள்கை & உண்மை சரிபார்ப்பு மையம்",
    pipelineTitle: "தன்னாட்சி போர்டல் செயல்பாட்டு நிலை",
    steps: [
      { id: "node_1", step: "01", title: "சட்ட வரைவு", desc: "பிரிவு 6(1) மனு" },
      { id: "node_2", step: "02", title: "போர்டல் இணைப்பு", desc: "rtionline.gov.in" },
      { id: "node_3", step: "03", title: "அமைச்சகம் தேர்வு", desc: "நோடல் துறை" },
      { id: "node_4", step: "04", title: "படிவம் நிரப்புதல்", desc: "விவரம் & மனு" },
      { id: "node_5", step: "05", title: "குடிமக்கள் ஒப்புதல்", desc: "CAPTCHA சரிபார்ப்பு" },
      { id: "node_6", step: "06", title: "ரசீது தயார்", desc: "பெட்டகத்தில் சேமிப்பு" },
    ],
    col1Title: "குடிமக்கள் பாஸ்புக்",
    legalName: "முழு சட்டப்பூர்வ பெயர்",
    mobile: "10 இலக்க மொபைல் எண்",
    pinCode: "பின் கோடு (PIN)",
    email: "மின்னஞ்சல்",
    address: "அஞ்சல் முகவரி",
    feeCat: "பிரிவு 7(5) கட்டண வகை",
    stdFee: "சாதாரண (₹10)",
    bplFree: "BPL (இலவசம்)",
    col2Title: "மக்கள் குறைதீர்ப்பு, கொள்கை & உண்மை சரிபார்ப்பு",
    sampleLabel: "மாதிரி மக்கள் பிரச்சினைகள்:",
    statementLabel: "உங்கள் புகார், அரசு திட்டம் அல்லது செய்தியை உள்ளிடவும்",
    lifeLiberty: "பிரிவு 7(1) உயிர் மற்றும் சுதந்திரம் (48 மணி நேரம்)",
    publicPulseToggle: "பெயர் வெளியிடாமல் பொது தளத்தில் பகிரவும்",
    submitRtiBtn: "RTI உருவாக்கி அரசு படிவத்தை நிரப்புக",
    explainPolicyBtn: "உரிமைகள் & திட்டத்தை விளக்குக (குரல்)",
    factCheckBtn: "உண்மை & டீப்ஃபேக் தணிக்கை",
    photoTriageBtn: "பாதிப்பு தீவிரம் & துறை பகுப்பாய்வு",
    tabDraft: "RTI வரைவு",
    tabExplainer: "கொள்கை விளக்கம்",
    tabFact: "உண்மை தணிக்கை",
    tabBrowser: "போர்டல் காட்சி",
    tabVault: "என் பெட்டகம்",
    tabPublic: "பொதுத் தளம்",
    listenBtn: "குரலில் கேட்க",
    stopVoiceBtn: "நிறுத்து",
  },
  te: {
    govBanner: "జన్-సేతు • బహుభాషా డిజిటల్ ప్రజా సేవా వేదిక",
    appTitle: "జన్-సేతు స్వయంచాలక RTI, విధాన & ఫ్యాక్ట్-చెక్ కేంద్రం",
    pipelineTitle: "స్వయంచాలక పోర్టల్ కార్యాచరణ పురోగతి",
    steps: [
      { id: "node_1", step: "01", title: "చట్టపరమైన ముసాయిదా", desc: "సెక్షన్ 6(1) దరఖాస్తు" },
      { id: "node_2", step: "02", title: "పోర్టల్ కనెక్షన్", desc: "rtionline.gov.in" },
      { id: "node_3", step: "03", title: "శాఖ ఎంపిక", desc: "నోడల్ మంత్రిత్వ శాఖ" },
      { id: "node_4", step: "04", title: "ఫారమ్ నింపడం", desc: "వివరాలు & దరఖాస్తు" },
      { id: "node_5", step: "05", title: "పౌర నిర్ధారణ", desc: "CAPTCHA ఆమోదం" },
      { id: "node_6", step: "06", title: "రసీదు సిద్ధం", desc: "వాల్ట్‌లో భద్రపరచబడింది" },
    ],
    col1Title: "పౌర పాస్‌బుక్",
    legalName: "పూర్తి చట్టపరమైన పేరు",
    mobile: "10-అంకెల మొబైల్ నంబర్",
    pinCode: "పిన్ కోడ్ (PIN)",
    email: "ఇమెయిల్ ఐడి",
    address: "పోస్టల్ చిరునామా",
    feeCat: "సెక్షన్ 7(5) రుసుము వర్గం",
    stdFee: "సాధారణ (₹10)",
    bplFree: "BPL (ఉచితం)",
    col2Title: "ప్రజా ఫిర్యాదు, విధాన & ఫ్యాక్ట్-చెక్ డెస్క్",
    sampleLabel: "నమూనా ప్రజా సమస్యలు & పథకాలు:",
    statementLabel: "మీ సమస్య, ప్రభుత్వ పథకం లేదా వైరల్ వార్తను వ్రాయండి",
    lifeLiberty: "సెక్షన్ 7(1) ప్రాణ & వ్యక్తిగత స్వేచ్ఛ (48 గంటలు)",
    publicPulseToggle: "పేరు లేకుండా పబ్లిక్ బోర్డులో షేర్ చేయండి",
    submitRtiBtn: "RTI రూపొందించి ప్రభుత్వ ఫారమ్ నింపండి",
    explainPolicyBtn: "హక్కులు & విధానాన్ని వివరించండి (వాయిస్)",
    factCheckBtn: "ఫ్యాక్ట్-చెక్ & డీప్‌ఫేక్ ఆడిట్",
    photoTriageBtn: "సమస్య తీవ్రత & శాఖ ట్రయాజ్ (Triage)",
    tabDraft: "RTI ముసాయిదా",
    tabExplainer: "విధాన వివరణ",
    tabFact: "ఫ్యాక్ట్ ఆడిట్",
    tabBrowser: "పోర్టల్ వీక్షణ",
    tabVault: "నా ఫోన్ వాల్ట్",
    tabPublic: "పబ్లిక్ బోర్డు",
    listenBtn: "వాయిస్‌లో వినండి",
    stopVoiceBtn: "ఆపండి",
  },
};

const SAMPLE_CASES = [
  {
    tag: "NH-2 Highway Audit (RTI)",
    text: "On National Highway 2 near Senapati, road repair work sanctioned last monsoon is already washed away with deep potholes. I want to know the total tender amount sanctioned, contractor company name, quality inspection reports, and penalty imposed.",
  },
  {
    tag: "PM-Ayushman Denial (Policy & Rights)",
    text: "Empanelled private hospital refused cashless treatment under Ayushman Bharat PM-JAY card citing server issue and demanded Rs 45,000 cash. Explain my exact legal rights, grievance redressal authority, and file an RTI audit.",
  },
  {
    tag: "Viral Circular Audit (Fact-Check)",
    text: "Viral WhatsApp message claims Central Government and RBI are charging a new tax on UPI transactions above Rs 2,000 starting next month and citizens must click a link to apply for exemption.",
  },
];

export default function JanSetuCivicPortal() {
  const [lang, setLang] = useState<LangCode>("en");
  const t = UI_TEXT[lang];

  const [query, setQuery] = useState(SAMPLE_CASES[0].text);
  const [stepStatuses, setStepStatuses] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<{ time: string; text: string; status: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [pinLookupStatus, setPinLookupStatus] = useState("Verified: East Delhi");
  const [sharePublicly, setSharePublicly] = useState(true);

  const [citizenProfile, setCitizenProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    state: "",
    bpl: "No",
    bplCardNo: "",
    bplYear: "",
    bplAuthority: "",
    life_liberty: false,
  });

  const cleanMobile = citizenProfile.mobile.replace(/\D/g, "").slice(-10);
  const hasValidMobile = cleanMobile.length === 10;

  // Voice & Neural Indian TTS State (with synchronous ref + abort controller so Stop Audio works 100% of the time)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef<boolean>(false);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Outputs
  const [rtiData, setRtiData] = useState<any>(null);
  const [policyExplainer, setPolicyExplainer] = useState<any>(null);
  const [explainingPolicy, setExplainingPolicy] = useState(false);

  // Module 2: Civic Triage State
  const [triageResult, setTriageResult] = useState<any>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  // Module 4: Fact-Check Audit State
  const [factAuditResult, setFactAuditResult] = useState<any>(null);
  const [auditingFact, setAuditingFact] = useState(false);
  const [factMediaFile, setFactMediaFile] = useState<File | null>(null);
  const factFileInputRef = useRef<HTMLInputElement | null>(null);

  const [docLang, setDocLang] = useState<"english" | "native">("english");
  const [browserSnapshot, setBrowserSnapshot] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState("");
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [copiedBanner, setCopiedBanner] = useState(false);
  const [myPrivateFilings, setMyPrivateFilings] = useState<any[]>([]);
  const [publicPulseFilings, setPublicPulseFilings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"document" | "explainer" | "fact_audit" | "browser" | "private_vault" | "public_pulse">("document");
  const [showJudgeLogs, setShowJudgeLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealDraft, setAppealDraft] = useState<string | null>(null);
  const [generatingAppeal, setGeneratingAppeal] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 18000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  // Reads cached filings for this mobile number so Render container restarts never wipe the user's vault
  const getLocalVaultRecords = (mobileNum: string): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`jansetu_vault_${mobileNum}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveToLocalVault = (mobileNum: string, record: any) => {
    if (typeof window === "undefined" || !record) return;
    try {
      const existing = getLocalVaultRecords(mobileNum);
      const filtered = existing.filter((r: any) => r.receipt_id !== record.receipt_id);
      const updated = [record, ...filtered].slice(0, 25);
      localStorage.setItem(`jansetu_vault_${mobileNum}`, JSON.stringify(updated));
    } catch {}
  };

  const fetchPrivateVault = async (mobileNum: string) => {
    const cleaned = mobileNum.replace(/\D/g, "").slice(-10);
    if (cleaned.length < 10) {
      setMyPrivateFilings([]);
      return;
    }
    const localRecs = getLocalVaultRecords(cleaned);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/ledger?mobile=${encodeURIComponent(cleaned)}`, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        const serverRecs: any[] = data.records || [];
        // Merge server SQLite records + local vault records by receipt_id so count is never 0 after filing
        const map = new Map<string, any>();
        [...serverRecs, ...localRecs].forEach((r) => {
          if (r && r.receipt_id) map.set(r.receipt_id, r);
        });
        setMyPrivateFilings(Array.from(map.values()));
        return;
      }
    } catch {}
    setMyPrivateFilings(localRecs);
  };

  const fetchPublicPulse = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/public-pulse`, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        setPublicPulseFilings(data.public_records || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPrivateVault(citizenProfile.mobile);
  }, [citizenProfile.mobile]);

  useEffect(() => {
    fetchPublicPulse();
  }, []);

  // GUARANTEED INSTANT AUDIO STOPPER
  const stopAudio = () => {
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current.src = "";
      } catch {}
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Natural Indian Neural Speech via Backend (/api/tts) with Instant Abort Support
  const speakText = async (textToSpeak: string, targetLangCode?: LangCode) => {
    if (isSpeakingRef.current || isSpeaking) {
      stopAudio();
      return;
    }

    stopAudio();
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const abortController = new AbortController();
    ttsAbortRef.current = abortController;
    const voiceLang = targetLangCode || lang;

    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, lang: voiceLang }),
        signal: abortController.signal,
      });
      if (!res.ok || !isSpeakingRef.current) {
        stopAudio();
        return;
      }
      const blob = await res.blob();
      if (!isSpeakingRef.current) {
        stopAudio();
        return;
      }
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        stopAudio();
      };
      await audio.play();
    } catch {
      stopAudio();
    }
  };

  const openLiveRtiPortalManually = () => {
    if (rtiData?.formal_draft && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rtiData.formal_draft);
      setCopiedBanner(true);
      setTimeout(() => setCopiedBanner(false), 4000);
    }
    window.open(OFFICIAL_RTI_PORTAL_URL, "_blank", "noopener,noreferrer");
  };

  const handleExplainPolicy = async () => {
    if (!query.trim()) return;
    setExplainingPolicy(true);
    setActiveTab("explainer");
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/explain-policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_text: query,
          lang: lang,
          citizen_state: citizenProfile.state,
          bpl_status: citizenProfile.bpl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicyExplainer(data);
      }
    } catch {
      addLog("Policy explainer timed out. Please try again.", "error");
    } finally {
      setExplainingPolicy(false);
    }
  };

  const handleRunTriage = async () => {
    if (!query.trim()) return;
    setIsTriaging(true);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance_text: query,
          location: citizenProfile.state,
          lang: lang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTriageResult(data);
      }
    } catch {
      addLog("Civic severity triage timed out. Please retry.", "error");
    } finally {
      setIsTriaging(false);
    }
  };

  const handleFactAudit = async () => {
    if (!query.trim() && !factMediaFile) return;
    setAuditingFact(true);
    setActiveTab("fact_audit");
    const formData = new FormData();
    formData.append("claim_text", query);
    formData.append("lang", lang);
    if (factMediaFile) {
      formData.append("file", factMediaFile);
    }

    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/fact-check`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFactAuditResult(data);
      }
    } catch {
      addLog("Fact-check audit timed out.", "error");
    } finally {
      setAuditingFact(false);
    }
  };

  const handlePincodeChange = async (pin: string) => {
    const cleaned = pin.replace(/\D/g, "").slice(0, 6);
    setCitizenProfile(prev => ({ ...prev, pincode: cleaned }));
    if (cleaned.length === 6) {
      setPinLookupStatus("Verifying PIN...");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setCitizenProfile(prev => ({ ...prev, pincode: cleaned, state: `${po.District}, ${po.State}` }));
          setPinLookupStatus(`Verified: ${po.District}`);
        } else {
          setPinLookupStatus("Invalid PIN");
        }
      } catch {
        setPinLookupStatus("PIN Service Offline");
      }
    }
  };

  const addLog = (text: string, status: string = "info") => {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLogs(prev => [...prev, { time: now, text, status }]);
  };

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "grievance.webm");
        try {
          const res = await fetchWithTimeout(`${API_BASE}/api/transcribe`, { method: "POST", body: formData });
          const data = await res.json();
          if (data.text) setQuery(data.text);
        } catch {
          addLog("Voice transcription error.", "error");
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(t => t.stop());
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { alert("Please allow microphone access."); }
  };

  const handleGenerateAppeal = async (rec: any) => {
    setAppealModalOpen(true);
    setGeneratingAppeal(true);
    setAppealDraft(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_id: rec.receipt_id,
          applicant_name: rec.applicant_name,
          ministry: rec.ministry,
          original_draft: rec.formal_draft,
          filed_date: rec.created_at,
        }),
      });
      const data = await res.json();
      setAppealDraft(data.appeal_draft);
    } catch {
      setAppealDraft("Error generating First Appeal.");
    } finally {
      setGeneratingAppeal(false);
    }
  };

  const startExecution = () => {
    if (!query.trim()) return;
    if (!hasValidMobile) {
      alert("Please enter a valid 10-digit Mobile Number in the Citizen Passbook.");
      return;
    }
    if (citizenProfile.bpl === "Yes" && (!citizenProfile.bplCardNo || !citizenProfile.bplYear)) {
      alert("Please provide your Ration/BPL Card Number and Year of Issue to claim the Section 7(5) Fee Waiver.");
      return;
    }

    setIsRunning(true);
    setRtiData(null);
    setBrowserSnapshot(null);
    setCaptchaImage(null);
    setReceiptId(null);
    setLogs([]);
    setStepStatuses({});

    const ws = new WebSocket(`${WS_BASE}/ws/agent`);
    wsRef.current = ws;

    const sessionLogsAccum: string[] = [];

    ws.onopen = () => {
      addLog(`Session bound to Mobile ID [+91-${cleanMobile}].`, "running");
      ws.send(JSON.stringify({
        query,
        lang,
        profile: { ...citizenProfile, mobile: cleanMobile },
        severity_score: triageResult?.severity_badge || "STANDARD",
        submit_to_gateway: true,
        share_publicly: sharePublicly,
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { step_id, status, log, payload } = msg;

      if (log) {
        addLog(log, status);
        sessionLogsAccum.push(`[${new Date().toLocaleTimeString("en-IN", { hour12: false })}] ${log}`);
      }
      if (step_id) setStepStatuses(prev => ({ ...prev, [step_id]: status }));

      if (payload?.rti_data) {
        setRtiData(payload.rti_data);
        setActiveTab("document");
      }
      if (payload?.browser_snapshot) setBrowserSnapshot(payload.browser_snapshot);
      if (payload?.captcha_image) setCaptchaImage(payload.captcha_image);

      if (payload?.receipt_id) {
        setReceiptId(payload.receipt_id);
        setIsRunning(false);

        // Immediately construct and persist the record in the Citizen's Phone Vault
        const fallbackRecord = payload.saved_record || {
          id: Date.now(),
          receipt_id: payload.receipt_id,
          applicant_name: citizenProfile.name,
          applicant_mobile: cleanMobile,
          applicant_email: citizenProfile.email,
          state: citizenProfile.state,
          ministry: payload?.rti_data?.department_predicted || "Public Authority",
          grievance_summary: query.slice(0, 180),
          formal_draft: payload?.rti_data?.formal_draft || query,
          execution_logs: sessionLogsAccum.join("\n"),
          severity_score: triageResult?.severity_badge || "STANDARD",
          status: citizenProfile.bpl === "Yes" ? "EXEMPT (BPL SEC 7-5)" : "STAGED FOR PORTAL SUBMISSION",
          is_public: sharePublicly ? 1 : 0,
          created_at: new Date().toLocaleString("en-IN"),
          sla_deadline: citizenProfile.life_liberty ? "48 Hours" : "30 Days",
        };

        saveToLocalVault(cleanMobile, fallbackRecord);
        setMyPrivateFilings(prev => [fallbackRecord, ...prev.filter(r => r.receipt_id !== fallbackRecord.receipt_id)]);
        setTimeout(() => {
          fetchPrivateVault(cleanMobile);
          fetchPublicPulse();
        }, 400);
      }
      if (status === "error") setIsRunning(false);
    };
    ws.onerror = () => { addLog("Backend connection failed.", "error"); setIsRunning(false); };
    ws.onclose = () => { setIsRunning(false); };
  };

  const submitCaptcha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsRef.current || !captchaInput.trim()) return;
    wsRef.current.send(JSON.stringify({ captcha_code: captchaInput.trim() }));
    setCaptchaImage(null);
    setCaptchaInput("");
  };

  return (
    <div className="min-h-screen bg-[#ECE8DF] text-[#182232] flex flex-col font-sans">
      <div className="h-1.5 w-full flex print:hidden">
        <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#138808]" />
      </div>

      <header className="bg-[#0B1D3A] text-white px-6 py-3.5 border-b border-[#1E3A6D] shadow-md print:hidden">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#FF9933]/50 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
                <rect width="64" height="64" fill="#0F2547" />
                <path d="M32 7L52 15V29C52 43 43.2 53.2 32 58C20.8 53.2 12 43 12 29V15L32 7Z" fill="#16325B" stroke="#FF9933" strokeWidth="2.5" />
                <circle cx="32" cy="27" r="9.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
                <circle cx="32" cy="27" r="2.8" fill="#FF9933" />
                <path d="M32 17.5V36.5M22.5 27H41.5M25.3 20.3L38.7 33.7M38.7 20.3L25.3 33.7" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M22 44H42" stroke="#138808" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#FF9933]">{t.govBanner}</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">{t.appTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#13294B] border border-[#234375] rounded-lg p-1 gap-1">
              <Languages className="w-3.5 h-3.5 text-[#FF9933] ml-1.5 mr-1" />
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { stopAudio(); setLang(l.code); }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    lang === l.code
                      ? "bg-[#FF9933] text-slate-950 shadow-xs"
                      : "text-slate-200 hover:text-white"
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>

            <div className="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              {hasValidMobile ? `Vault: +91-${cleanMobile}` : "Enter 10-Digit Mobile"}
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#E2DDD2] border-b border-[#CFC8B8] px-6 py-3 print:hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
              {t.pipelineTitle} ({hasValidMobile ? `+91-${cleanMobile}` : "Unbound"})
            </span>
            {logs.length > 0 && (
              <span className="text-xs font-semibold text-[#0F2547] flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-[#D97706] ${isRunning ? "animate-spin" : ""}`} /> {logs[logs.length - 1]?.text}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
            {t.steps.map((s: any) => {
              const st = stepStatuses[s.id] || "idle";
              return (
                <div key={s.id} className={`rounded-lg border px-3 py-2 transition-all ${
                  st === "completed" ? "bg-[#EAF5EE] border-[#2E7D32] text-[#1B5E20]" :
                  st === "running" ? "bg-[#FFF8E7] border-[#D97706] text-[#78350F] shadow-xs ring-2 ring-[#D97706]/20" :
                  st === "awaiting_human" ? "bg-[#FEF2F2] border-[#DC2626] text-[#7F1D1D] ring-2 ring-red-400/30 animate-pulse" :
                  "bg-[#F5F2EB] border-[#D5CFC2] text-[#64748B]"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider">STEP {s.step}</span>
                    {st === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />}
                    {st === "running" && <Clock className="w-3.5 h-3.5 text-[#D97706] animate-spin" />}
                    {st === "awaiting_human" && <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />}
                  </div>
                  <div className="font-bold text-xs mt-0.5 truncate">{s.title}</div>
                  <div className="text-[10px] opacity-80 truncate">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-5 grid grid-cols-12 gap-5 items-start">
        <section className="col-span-12 lg:col-span-3 bg-[#FAF8F5] rounded-xl border border-[#D5CFC2] shadow-xs overflow-hidden print:hidden">
          <div className="bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#FF9933]" /><h2 className="text-xs font-bold uppercase tracking-wider">{t.col1Title}</h2></div>
            {hasValidMobile && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <BadgeCheck className="w-3 h-3" /> Active
              </span>
            )}
          </div>
          <div className="p-4 space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5 text-[#0F2547]" /> {t.legalName}</label>
              <input value={citizenProfile.name} onChange={(e) => setCitizenProfile({ ...citizenProfile, name: e.target.value })} className="w-full h-9 rounded-lg border border-[#C8C1B2] bg-white px-3 font-semibold text-[#0F2547]" placeholder="e.g. Abhinav Kumar Jha" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F2547] flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5 text-[#D97706]" /> {t.mobile}
              </label>
              <input
                value={citizenProfile.mobile}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setCitizenProfile({ ...citizenProfile, mobile: val });
                  setLogs([]);
                  setRtiData(null);
                  setBrowserSnapshot(null);
                }}
                className="w-full h-9 rounded-lg border-2 border-[#0F2547] bg-[#FFFBEB] px-3 font-mono font-bold text-[#0F2547]"
                placeholder="10-digit mobile"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 text-[#D97706]" /> {t.pinCode}</label>
                <input value={citizenProfile.pincode} maxLength={6} onChange={(e) => handlePincodeChange(e.target.value)} className="w-full h-9 rounded-lg border border-[#C8C1B2] bg-white px-2.5 font-bold text-[#0F2547]" placeholder="e.g. 110092" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">India Post</label>
                <div className="h-9 rounded-lg bg-[#EFECE4] border border-[#D5CFC2] px-2 flex items-center text-[10px] font-bold text-emerald-800 truncate">
                  {pinLookupStatus}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5 text-[#0F2547]" /> {t.email}</label>
              <input value={citizenProfile.email} onChange={(e) => setCitizenProfile({ ...citizenProfile, email: e.target.value })} className="w-full h-9 rounded-lg border border-[#C8C1B2] bg-white px-3 font-medium text-[#0F2547]" placeholder="citizen@example.com" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5 mb-1"><Home className="w-3.5 h-3.5 text-[#0F2547]" /> {t.address}</label>
              <input value={citizenProfile.address} onChange={(e) => setCitizenProfile({ ...citizenProfile, address: e.target.value })} className="w-full h-9 rounded-lg border border-[#C8C1B2] bg-white px-3 font-medium text-[#0F2547]" placeholder="Full Address" />
            </div>
            <div className="pt-1 border-t border-[#E2DDD2]">
              <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5 mb-1.5"><Award className="w-3.5 h-3.5 text-[#D97706]" /> {t.feeCat}</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCitizenProfile({ ...citizenProfile, bpl: "No" })} className={`py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${citizenProfile.bpl === "No" ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white text-[#475569] border-[#C8C1B2]"}`}>{t.stdFee}</button>
                <button type="button" onClick={() => setCitizenProfile({ ...citizenProfile, bpl: "Yes" })} className={`py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${citizenProfile.bpl === "Yes" ? "bg-[#138808] text-white border-[#138808]" : "bg-white text-[#475569] border-[#C8C1B2]"}`}>{t.bplFree}</button>
              </div>
            </div>

            {citizenProfile.bpl === "Yes" && (
              <div className="pt-2 border-t border-[#E2DDD2] space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-[#475569]">BPL/Ration Card No. *</label>
                  <input value={citizenProfile.bplCardNo} onChange={(e) => setCitizenProfile({ ...citizenProfile, bplCardNo: e.target.value })} className="w-full h-8 rounded-lg border border-[#C8C1B2] bg-white px-2 text-[11px] font-bold" placeholder="e.g. AAY-12345" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#475569]">Year *</label>
                    <input value={citizenProfile.bplYear} maxLength={4} onChange={(e) => setCitizenProfile({ ...citizenProfile, bplYear: e.target.value })} className="w-full h-8 rounded-lg border border-[#C8C1B2] bg-white px-2 text-[11px]" placeholder="YYYY" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#475569]">Authority</label>
                    <input value={citizenProfile.bplAuthority} onChange={(e) => setCitizenProfile({ ...citizenProfile, bplAuthority: e.target.value })} className="w-full h-8 rounded-lg border border-[#C8C1B2] bg-white px-2 text-[11px]" placeholder="DSO" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-[#FAF8F5] rounded-xl border border-[#D5CFC2] shadow-xs flex flex-col print:hidden">
          <div className="bg-[#16325B] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#FF9933]" /><h2 className="text-xs font-bold uppercase tracking-wider">{t.col2Title}</h2></div>
            <button type="button" onClick={toggleVoiceRecording} disabled={isRunning || isTranscribing} className={`text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${isRecording ? "bg-red-600 text-white animate-pulse" : "bg-[#FF9933] hover:bg-amber-500 text-slate-950"}`}>
              {isRecording ? <><Square className="w-3 h-3 fill-current" /> Stop</> : <><Mic className="w-3 h-3" /> {isTranscribing ? "Transcribing..." : "Voice Mic"}</>}
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-[#475569] mb-1.5 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> {t.sampleLabel}</div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {SAMPLE_CASES.map((sc, i) => (
                  <button key={i} type="button" disabled={isRunning} onClick={() => setQuery(sc.text)} className="text-[11px] font-semibold bg-[#EFECE4] hover:bg-[#0F2547] hover:text-white text-[#0F2547] border border-[#C8C1B2] px-2.5 py-1 rounded-md transition cursor-pointer">{sc.tag}</button>
                ))}
              </div>

              <div className="mb-2.5">
                <button type="button" onClick={handleRunTriage} disabled={isTriaging} className="w-full py-2 px-3 rounded-lg border-2 border-[#0F2547] bg-[#EFECE4] hover:bg-[#0F2547] hover:text-white text-[#0F2547] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                  <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                  {isTriaging ? "Evaluating Severity & Routing Authority..." : t.photoTriageBtn}
                </button>
                {triageResult && (
                  <div className="mt-2 bg-rose-950/10 border border-rose-800/30 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-rose-950">
                      <span>{triageResult.issue_category}</span>
                      <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        {triageResult.severity_badge || `${triageResult.severity_score}/100`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white/80 p-2 rounded border border-rose-200">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Local Nodal Body</span>
                        <strong className="text-[#0F2547]">{triageResult.municipal_or_district_body}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Statutory SLA</span>
                        <strong className="text-rose-700">{triageResult.statutory_sla}</strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#1E293B] leading-snug">
                      {triageResult.impact_assessment}
                    </div>
                  </div>
                )}
              </div>

              <label className="text-[11px] font-bold text-[#475569] block mb-1">{t.statementLabel}</label>
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} disabled={isRunning} rows={5} className="w-full rounded-lg border border-[#C8C1B2] bg-white p-3 text-xs text-[#0F2547] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0F2547] resize-none" />

              <div className="mt-2 space-y-1.5 bg-[#EFECE4] p-2.5 rounded-lg border border-[#D5CFC2] text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-[#7F1D1D] flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-red-600" /> {t.lifeLiberty}</span>
                  <input type="checkbox" checked={citizenProfile.life_liberty} onChange={(e) => setCitizenProfile({ ...citizenProfile, life_liberty: e.target.checked })} className="w-4 h-4 accent-red-600" />
                </label>
                <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-[#D5CFC2]">
                  <span className="font-semibold text-[#0F2547] flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-emerald-700" /> {t.publicPulseToggle}</span>
                  <input type="checkbox" checked={sharePublicly} onChange={(e) => setSharePublicly(e.target.checked)} className="w-4 h-4 accent-[#0F2547]" />
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2DDD2] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleExplainPolicy} disabled={explainingPolicy} className="py-2.5 px-2 rounded-lg bg-[#D97706] hover:bg-amber-700 text-white font-bold text-[11px] uppercase shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{explainingPolicy ? "Analyzing..." : t.explainPolicyBtn}</span>
                </button>
                <button type="button" onClick={handleFactAudit} disabled={auditingFact} className="py-2.5 px-2 rounded-lg bg-[#138808] hover:bg-emerald-800 text-white font-bold text-[11px] uppercase shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <SearchCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{auditingFact ? "Auditing..." : t.factCheckBtn}</span>
                </button>
              </div>
              <button onClick={startExecution} disabled={isRunning} className="w-full py-3 rounded-lg bg-[#0F2547] hover:bg-[#16325B] disabled:bg-slate-400 text-white font-bold text-xs uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer">
                <Send className="w-4 h-4 text-[#FF9933]" />
                {isRunning ? "Auto-Filling Portal..." : t.submitRtiBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {captchaImage && (
            <div className="bg-[#FFF8E7] border-2 border-[#D97706] rounded-xl p-4 shadow-md print:hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#78350F] flex items-center gap-1.5 uppercase tracking-wide"><Lock className="w-4 h-4 text-[#D97706]" /> Security Confirmation</span>
                <button
                  type="button"
                  onClick={openLiveRtiPortalManually}
                  className="text-[11px] font-bold bg-[#0F2547] hover:bg-[#16325B] text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-[#FF9933]" /> Open rtionline.gov.in Manually
                </button>
              </div>
              <p className="text-xs text-[#92400E] mb-3">
                Your form is staged on <strong>rtionline.gov.in</strong>. Enter the CAPTCHA below or click the button above to open the portal directly:
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="bg-white border border-[#D97706] rounded-lg p-1.5 flex items-center justify-center min-w-[160px]"><img src={captchaImage} alt="CAPTCHA" className="h-14 object-contain" /></div>
                <form onSubmit={submitCaptcha} className="flex-1 flex gap-2 w-full">
                  <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} placeholder="Enter code..." className="flex-1 rounded-lg border border-[#D97706] px-3 py-2 text-sm font-bold focus:outline-none" autoFocus />
                  <button type="submit" className="bg-[#D97706] hover:bg-amber-700 text-white font-bold text-xs uppercase px-4 rounded-lg cursor-pointer">Submit</button>
                </form>
              </div>
            </div>
          )}

          {copiedBanner && (
            <div className="bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-between shadow">
              <span>✓ RTI Legal Draft copied to clipboard! Paste it directly on rtionline.gov.in.</span>
            </div>
          )}

          <div className="bg-[#FAF8F5] rounded-xl border border-[#D5CFC2] shadow-xs overflow-hidden flex flex-col min-h-[540px]">
            <div className="bg-[#E5E0D5] border-b border-[#CFC8B8] px-2.5 pt-2.5 flex items-center justify-between print:hidden">
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setActiveTab("document")} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "document" ? "bg-[#FAF8F5] border-[#CFC8B8] text-[#0F2547]" : "border-transparent text-[#475569]"}`}><Scale className="w-3 h-3 text-[#D97706]" /> {t.tabDraft}</button>
                <button onClick={() => setActiveTab("explainer")} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "explainer" ? "bg-[#FAF8F5] border-[#CFC8B8] text-amber-800" : "border-transparent text-[#475569]"}`}><BookOpen className="w-3 h-3 text-[#D97706]" /> {t.tabExplainer}</button>
                <button onClick={() => setActiveTab("fact_audit")} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "fact_audit" ? "bg-[#FAF8F5] border-[#CFC8B8] text-emerald-800" : "border-transparent text-[#475569]"}`}><SearchCheck className="w-3 h-3 text-emerald-700" /> {t.tabFact}</button>
                <button onClick={() => setActiveTab("browser")} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "browser" ? "bg-[#FAF8F5] border-[#CFC8B8] text-[#138808]" : "border-transparent text-[#475569]"}`}><Eye className="w-3 h-3" /> {t.tabBrowser}</button>
                <button onClick={() => { setActiveTab("private_vault"); fetchPrivateVault(cleanMobile); }} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "private_vault" ? "bg-[#FAF8F5] border-[#CFC8B8] text-[#0F2547]" : "border-transparent text-[#475569]"}`}><Lock className="w-3 h-3 text-amber-700" /> {t.tabVault} ({myPrivateFilings.length})</button>
                <button onClick={() => { setActiveTab("public_pulse"); fetchPublicPulse(); }} className={`px-2.5 py-2 text-[11px] font-bold rounded-t-lg border-t border-x flex items-center gap-1 cursor-pointer ${activeTab === "public_pulse" ? "bg-[#FAF8F5] border-[#CFC8B8] text-emerald-900" : "border-transparent text-[#475569]"}`}><Globe className="w-3 h-3 text-emerald-700" /> {t.tabPublic}</button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {activeTab === "document" && (
                <div>
                  {!rtiData ? (
                    <div className="h-[440px] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-[#D5CFC2] rounded-lg bg-[#F3EFE6]/60">
                      <Scale className="w-10 h-10 text-[#94A3B8] mb-2.5" />
                      <h3 className="text-sm font-bold text-[#0F2547]">{t.tabDraft}</h3>
                      <p className="text-xs text-[#475569] max-w-sm mt-1">
                        Bound to Mobile Vault <strong>+91-{cleanMobile || "..."}</strong>. Click <strong>{t.submitRtiBtn}</strong> to synthesize and execute.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-[#EFECE4] border border-[#D5CFC2] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-[#475569] flex items-center gap-1"><Building2 className="w-3 h-3 text-[#D97706]" /> Authority</div>
                          <div className="text-xs font-bold text-[#0F2547] mt-0.5">{rtiData.department_predicted}</div>
                        </div>
                        <button
                          type="button"
                          onClick={openLiveRtiPortalManually}
                          className="text-[11px] font-bold bg-[#138808] hover:bg-emerald-800 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Copy Draft & Open rtionline.gov.in
                        </button>
                      </div>

                      {rtiData.citizen_summary_hindi && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFF8E7] border border-[#F59E0B]/40 px-3 py-2 rounded-lg print:hidden">
                          <div className="flex gap-1.5">
                            <button onClick={() => { stopAudio(); setDocLang("english"); }} className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${docLang === "english" ? "bg-[#0F2547] text-white" : "bg-white text-[#0F2547] border border-[#C8C1B2]"}`}>Official English</button>
                            <button onClick={() => { stopAudio(); setDocLang("native"); }} className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${docLang === "native" ? "bg-[#0F2547] text-white" : "bg-white text-[#0F2547] border border-[#C8C1B2]"}`}>
                              {LANGUAGES.find(l => l.code === lang)?.native} Summary
                            </button>
                          </div>
                          {isSpeaking ? (
                            <button
                              type="button"
                              onClick={stopAudio}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer animate-pulse"
                            >
                              <VolumeX className="w-3.5 h-3.5" /> {t.stopVoiceBtn}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => speakText(docLang === "english" ? rtiData.formal_draft : rtiData.citizen_summary_hindi, docLang === "english" ? "en" : lang)}
                              className="bg-[#D97706] hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> {t.listenBtn}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="bg-[#FFFDF9] border-2 border-[#C8C1B2] rounded-lg p-5 shadow-inner">
                        <div className="border-b-2 border-[#0F2547] pb-2.5 mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#D97706]">SECTION 6(1) RIGHT TO INFORMATION ACT, 2005</div>
                            <div className="text-xs font-bold text-[#0F2547]">{citizenProfile.name} • +91-{cleanMobile}</div>
                          </div>
                          <button onClick={() => window.print()} className="text-[10px] font-bold bg-[#0F2547] text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"><Printer className="w-3 h-3" /> Print</button>
                        </div>
                        <div className="text-[13px] text-[#1E293B] whitespace-pre-wrap font-serif leading-relaxed max-h-[320px] overflow-y-auto pr-1">
                          {docLang === "english" ? rtiData.formal_draft : rtiData.citizen_summary_hindi}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "explainer" && (
                <div>
                  {explainingPolicy ? (
                    <div className="h-[440px] flex flex-col items-center justify-center text-center px-6">
                      <RefreshCw className="w-8 h-8 text-[#D97706] animate-spin mb-3" />
                      <div className="text-sm font-bold text-[#0F2547]">Synthesizing Policy & Citizen Rights in {LANGUAGES.find(l => l.code === lang)?.native}...</div>
                    </div>
                  ) : !policyExplainer ? (
                    <div className="h-[440px] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-[#D5CFC2] rounded-lg bg-[#F3EFE6]/60">
                      <BookOpen className="w-10 h-10 text-[#D97706] mb-2.5" />
                      <h3 className="text-sm font-bold text-[#0F2547]">{t.tabExplainer}</h3>
                      <p className="text-xs text-[#475569] max-w-sm mt-1">Click the orange <strong>{t.explainPolicyBtn}</strong> button to translate any scheme into {LANGUAGES.find(l => l.code === lang)?.native} voice & text.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="bg-[#0F2547] text-white p-3.5 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase text-[#FF9933] font-bold">Multilingual Rights & Scheme Explainer ({LANGUAGES.find(l => l.code === lang)?.native})</div>
                          <div className="text-sm font-bold mt-0.5">{policyExplainer.scheme_or_law_title}</div>
                        </div>
                        {isSpeaking ? (
                          <button type="button" onClick={stopAudio} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 animate-pulse">
                            <VolumeX className="w-4 h-4" /> {t.stopVoiceBtn}
                          </button>
                        ) : (
                          <button type="button" onClick={() => speakText(`${policyExplainer.plain_explainer}. ${(policyExplainer.exact_rights || []).join(". ")}`, lang)} className="bg-[#FF9933] hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                            <Volume2 className="w-4 h-4" /> {t.listenBtn}
                          </button>
                        )}
                      </div>
                      <div className="bg-[#FFF8E7] border border-[#D97706]/40 rounded-lg p-3.5 text-xs leading-relaxed text-[#1E293B]">
                        <div className="font-bold text-[#78350F] uppercase text-[10px] mb-1">Plain-Language Voice Summary</div>
                        {policyExplainer.plain_explainer}
                      </div>
                      <div className="bg-white border border-[#C8C1B2] rounded-lg p-3.5 text-xs space-y-1.5">
                        <div className="font-bold text-[#0F2547] uppercase text-[10px]">Guaranteed Citizen Rights & Entitlements</div>
                        <ul className="list-disc pl-4 space-y-1 text-[#1E293B]">{policyExplainer.exact_rights?.map((r: string, idx: number) => <li key={idx}>{r}</li>)}</ul>
                      </div>
                      <div className="bg-white border border-[#C8C1B2] rounded-lg p-3.5 text-xs space-y-1.5">
                        <div className="font-bold text-emerald-800 uppercase text-[10px]">Eligibility & Documents Required</div>
                        <ul className="list-disc pl-4 space-y-1 text-[#1E293B]">{policyExplainer.eligibility_and_docs?.map((d: string, idx: number) => <li key={idx}>{d}</li>)}</ul>
                      </div>
                      <div className="bg-[#EFECE4] border border-[#D5CFC2] rounded-lg p-3 text-xs text-[#0F2547]">
                        <span className="font-bold block text-[10px] uppercase text-[#475569] mb-0.5">Real-World Impact & Enforcement</span>
                        {policyExplainer.real_world_impact}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "fact_audit" && (
                <div className="space-y-3.5">
                  <div className="bg-[#EFECE4] border border-[#D5CFC2] rounded-lg p-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-[#0F2547] flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-emerald-700" />
                      Upload Suspect Media for EXIF Forensics (Optional)
                    </div>
                    <input ref={factFileInputRef} type="file" accept="image/*" onChange={(e) => setFactMediaFile(e.target.files?.[0] || null)} className="hidden" />
                    <button type="button" onClick={() => factFileInputRef.current?.click()} className="bg-[#0F2547] text-white text-[11px] font-bold px-3 py-1 rounded cursor-pointer">
                      {factMediaFile ? factMediaFile.name.slice(0, 16) : "Attach Media"}
                    </button>
                  </div>

                  {auditingFact ? (
                    <div className="h-[360px] flex flex-col items-center justify-center text-center px-6">
                      <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
                      <div className="text-sm font-bold text-[#0F2547]">Cross-referencing Official Portals & Running Media Forensics...</div>
                    </div>
                  ) : !factAuditResult ? (
                    <div className="h-[360px] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-[#D5CFC2] rounded-lg bg-[#F3EFE6]/60">
                      <SearchCheck className="w-10 h-10 text-emerald-700 mb-2.5" />
                      <h3 className="text-sm font-bold text-[#0F2547]">{t.factCheckBtn}</h3>
                      <p className="text-xs text-[#475569] max-w-sm mt-1">Paste any viral claim and click the green <strong>{t.factCheckBtn}</strong> button.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-[#0F2547] text-white p-3.5 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase text-[#FF9933] font-bold">Forensic Credibility Verdict</div>
                          <div className="text-sm font-bold mt-0.5">{factAuditResult.verdict}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase text-slate-300">Trust Score</div>
                          <div className="text-lg font-mono font-bold text-emerald-400">{factAuditResult.credibility_score}/100</div>
                        </div>
                      </div>
                      <div className="bg-white border border-[#C8C1B2] rounded-lg p-3.5 text-xs leading-relaxed text-[#1E293B]">
                        <div className="font-bold text-[#0F2547] uppercase text-[10px] mb-1">Verification & Fact Audit Summary</div>
                        {factAuditResult.fact_audit_summary}
                      </div>
                      {factAuditResult.forensic_telemetry?.media_analyzed && (
                        <div className="bg-[#FFF8E7] border border-[#D97706]/50 rounded-lg p-3 text-xs">
                          <div className="font-bold text-[#78350F] uppercase text-[10px] mb-1">Image EXIF & Synthetic Forensics</div>
                          <div><strong>Resolution:</strong> {factAuditResult.forensic_telemetry.resolution}</div>
                          <div><strong>Metadata Status:</strong> {factAuditResult.forensic_telemetry.exif_status}</div>
                        </div>
                      )}
                      <div className="bg-white border border-[#C8C1B2] rounded-lg p-3.5 text-xs space-y-1">
                        <div className="font-bold text-rose-800 uppercase text-[10px]">Provenance & Forensic Markers</div>
                        <ul className="list-disc pl-4 space-y-1 text-[#1E293B]">{factAuditResult.provenance_and_red_flags?.map((flag: string, i: number) => <li key={i}>{flag}</li>)}</ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "browser" && (
                <div className="space-y-3">
                  <div className="bg-[#0F2547] text-white p-3 rounded-lg flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase text-[#FF9933] font-bold">Direct Government Portal Hand-Off</div>
                      <div className="text-xs font-semibold">Click below to open rtionline.gov.in in a new tab (auto-copies your legal draft)</div>
                    </div>
                    <button
                      type="button"
                      onClick={openLiveRtiPortalManually}
                      className="bg-[#FF9933] hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open rtionline.gov.in & Copy Draft
                    </button>
                  </div>

                  {!browserSnapshot ? (
                    <div
                      onClick={openLiveRtiPortalManually}
                      className="h-[380px] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-[#D5CFC2] hover:border-[#0F2547] rounded-lg bg-[#F3EFE6]/60 cursor-pointer transition"
                    >
                      <Eye className="w-10 h-10 text-[#0F2547] mb-2.5" />
                      <h3 className="text-sm font-bold text-[#0F2547]">Live Portal Snapshot (Click to Open rtionline.gov.in)</h3>
                      <p className="text-xs text-[#475569] max-w-sm mt-1">
                        Run the autonomous agent to see live DOM captures here, or click anywhere on this box to open <strong>rtionline.gov.in</strong> directly.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-[#EFECE4] px-3 py-1.5 rounded text-xs font-bold text-[#0F2547]">
                        <span>rtionline.gov.in Live DOM Capture (Click Image to Open Portal)</span>
                        <span className="text-emerald-700 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Interactive</span>
                      </div>
                      <div
                        onClick={openLiveRtiPortalManually}
                        title="Click to open rtionline.gov.in in a new tab and copy your RTI draft"
                        className="border-2 border-[#0F2547] rounded-lg overflow-hidden shadow-sm cursor-pointer group relative"
                      >
                        <img src={browserSnapshot} alt="Snapshot" className="w-full h-auto group-hover:opacity-90 transition" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "private_vault" && (
                <div className="space-y-3">
                  <div className="bg-[#EFECE4] border border-[#D5CFC2] rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F2547] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#D97706]" /> Phone-Isolated Logs & Filings</div>
                      <div className="text-[11px] text-[#475569]">Filtered strictly by your 10-digit mobile number (+91-{cleanMobile || "None"}).</div>
                    </div>
                  </div>

                  {myPrivateFilings.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#475569] border border-dashed border-[#C8C1B2] rounded-lg">No RTI filings recorded for <strong>+91-{cleanMobile}</strong> yet.</div>
                  ) : (
                    myPrivateFilings.map((rec) => (
                      <div key={rec.id || rec.receipt_id} className="border border-[#C8C1B2] rounded-lg p-3.5 bg-white space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-[#0F2547]">{rec.receipt_id}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">{rec.status}</span>
                        </div>
                        <div className="text-xs font-bold text-[#1E293B]">{rec.ministry}</div>
                        <div className="text-[11px] text-[#475569] line-clamp-2">{rec.grievance_summary}</div>
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-amber-800 font-semibold">SLA: {rec.sla_deadline || "30 Days"}</span>
                          <div className="flex gap-1.5">
                            {rec.execution_logs && <button type="button" onClick={() => setExpandedLogId(expandedLogId === rec.id ? null : rec.id)} className="bg-slate-100 hover:bg-slate-200 text-[#0F2547] font-bold px-2.5 py-1 rounded cursor-pointer">{expandedLogId === rec.id ? "Hide My Logs" : "View My Execution Logs"}</button>}
                            <button type="button" onClick={() => handleGenerateAppeal(rec)} className="bg-[#0F2547] hover:bg-[#16325B] text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"><Gavel className="w-3 h-3 text-[#FF9933]" /> Sec 19(1) Appeal</button>
                          </div>
                        </div>
                        {expandedLogId === rec.id && rec.execution_logs && (
                          <pre className="mt-2 bg-[#0B1D3A] text-amber-200 p-2.5 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto">{rec.execution_logs}</pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "public_pulse" && (
                <div className="space-y-3">
                  {publicPulseFilings.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#475569] border border-dashed border-[#C8C1B2] rounded-lg">No public community filings yet.</div>
                  ) : (
                    publicPulseFilings.map((pub) => (
                      <div key={pub.id} className="border border-[#C8C1B2] rounded-lg p-3.5 bg-white space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold bg-[#EFECE4] text-[#0F2547] px-2 py-0.5 rounded">Jurisdiction: {pub.state}</span>
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded">Severity: {pub.severity_score || "STANDARD"}</span>
                        </div>
                        <div className="text-xs font-bold text-[#0F2547]">{pub.ministry}</div>
                        <div className="text-xs text-[#475569]">{pub.grievance_summary}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {appealModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-xl max-w-2xl w-full p-6 shadow-2xl border-2 border-[#0F2547]">
            <div className="flex justify-between border-b border-[#C8C1B2] pb-3 mb-4">
              <div className="flex items-center gap-2 text-[#0F2547] font-bold text-base"><Gavel className="w-5 h-5 text-[#D97706]" /> Section 19(1) First Appeal to FAA</div>
              <button onClick={() => setAppealModalOpen(false)} className="text-xs font-bold text-slate-500 cursor-pointer">Close</button>
            </div>
            {generatingAppeal ? (
              <div className="py-12 text-center text-xs font-bold text-[#0F2547]">Synthesizing Statutory Section 19(1) First Appeal...</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#FFFDF9] border border-[#C8C1B2] rounded-lg p-4 max-h-96 overflow-y-auto font-serif text-xs leading-relaxed whitespace-pre-wrap text-slate-800">{appealDraft}</div>
                <div className="flex justify-end gap-2"><button onClick={() => window.print()} className="px-4 py-2 bg-[#0F2547] text-white text-xs font-bold rounded-lg cursor-pointer"><Printer className="w-3.5 h-3.5 inline mr-1" /> Print Dossier</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-[#E2DDD2] border-t border-[#CFC8B8] px-6 py-2.5 text-xs text-[#475569] flex justify-between print:hidden">
        <div className="font-medium">{t.govBanner}</div>
        <button onClick={() => setShowJudgeLogs(!showJudgeLogs)} className="text-[#0F2547] hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold cursor-pointer"><Code2 className="w-3.5 h-3.5" /> {showJudgeLogs ? "Hide Live Session Logs" : "View Live Session Logs"}</button>
      </footer>
      {showJudgeLogs && (
        <div className="bg-[#0B1D3A] text-slate-200 px-6 py-3 font-mono text-xs border-t border-slate-800 max-h-40 overflow-y-auto print:hidden">
          {logs.map((L, i) => <div key={i} className="py-0.5"><span className="text-amber-400 mr-2">[{L.time}]</span><span>{L.text}</span></div>)}
        </div>
      )}
    </div>
  );
}

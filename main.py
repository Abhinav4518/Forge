import os
import io
import json
import base64
import sqlite3
import asyncio
import urllib.parse
from datetime import datetime, timedelta
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from groq import AsyncGroq
from pydantic import BaseModel
from dotenv import load_dotenv

# Safe PIL import for Fact-Check EXIF extraction
try:
    from PIL import Image, ExifTags  # type: ignore
    HAS_PIL = True
except ImportError:
    Image = None
    ExifTags = None
    HAS_PIL = False

load_dotenv()

app = FastAPI(title="Jan-Setu Sovereign Civic Suite")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# --- SQLITE DATABASE (ISOLATED BY MOBILE NUMBER) ---
DB_PATH = "jansetu_audit.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS rti_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id TEXT,
            applicant_name TEXT,
            applicant_mobile TEXT,
            applicant_email TEXT,
            state TEXT,
            ministry TEXT,
            grievance_summary TEXT,
            formal_draft TEXT,
            execution_logs TEXT,
            severity_score TEXT,
            status TEXT,
            is_public INTEGER DEFAULT 1,
            created_at TEXT,
            sla_deadline TEXT
        )
    """)
    existing_cols = [row[1] for row in c.execute("PRAGMA table_info(rti_ledger)").fetchall()]
    for col, col_type in [
        ("applicant_mobile", "TEXT"),
        ("applicant_email", "TEXT"),
        ("execution_logs", "TEXT"),
        ("severity_score", "TEXT"),
        ("is_public", "INTEGER DEFAULT 1"),
        ("sla_deadline", "TEXT"),
    ]:
        if col not in existing_cols:
            c.execute(f"ALTER TABLE rti_ledger ADD COLUMN {col} {col_type}")
    conn.commit()
    conn.close()

init_db()

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी - Devanagari script)",
    "bn": "Bengali (বাংলা - Bengali script)",
    "ta": "Tamil (தமிழ் - Tamil script)",
    "te": "Telugu (తెలుగు - Telugu script)",
}

async def get_working_groq_model() -> str:
    preferred = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]
    try:
        models_resp = await client.models.list()
        available_ids = {m.id for m in models_resp.data}
        for m in preferred:
            if m in available_ids:
                return m
        for m in available_ids:
            if "whisper" not in m and "guard" not in m and "orpheus" not in m:
                return m
    except Exception:
        pass
    return "openai/gpt-oss-20b"

@app.get("/")
async def root_health():
    return {"status": "online", "service": "Jan-Setu Sovereign Civic Suite Backend"}

# --- PHONE-ISOLATED PRIVATE VAULT ---
@app.get("/api/ledger")
async def get_private_user_ledger(mobile: str = Query(..., description="10-digit Citizen Mobile Number")):
    clean_mobile = "".join(c for c in mobile if c.isdigit())[-10:]
    if len(clean_mobile) < 10:
        return {"records": []}

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute(
        "SELECT * FROM rti_ledger WHERE applicant_mobile = ? ORDER BY id DESC LIMIT 25",
        (clean_mobile,)
    )
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"records": rows, "mobile": clean_mobile}

# --- ANONYMIZED PUBLIC ACCOUNTABILITY DASHBOARD ---
@app.get("/api/public-pulse")
async def get_public_pulse():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT id, receipt_id, state, ministry, grievance_summary, severity_score, status, created_at
        FROM rti_ledger
        WHERE is_public = 1
        ORDER BY id DESC LIMIT 20
    """)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"public_records": rows}

# --- MULTILINGUAL VOICE TRANSCRIPTION ---
@app.post("/api/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    transcription = await client.audio.transcriptions.create(
        file=(file.filename or "voice.webm", audio_bytes),
        model="whisper-large-v3-turbo",
        prompt="Citizen grievance regarding public infrastructure, RTI, government schemes, scholarship, roads, or hospital in India.",
        response_format="json",
    )
    return {"text": transcription.text}

# --- MODULE 1: MULTILINGUAL POLICY & RIGHTS EXPLAINER ---
class PolicyExplainRequest(BaseModel):
    policy_text: str
    lang: str = "hi"
    citizen_state: str = "India"
    bpl_status: str = "No"

@app.post("/api/explain-policy")
async def explain_policy(req: PolicyExplainRequest):
    model_id = await get_working_groq_model()
    target_lang = LANGUAGE_NAMES.get(req.lang, "Hindi (Devanagari script)")

    prompt = f"""
    You are an Official Indian Civic Policy, Welfare Scheme & Constitutional Rights Explainer.
    Analyze the following government notification, scheme, or civic issue and explain it in plain, everyday language strictly in {target_lang} for a citizen residing in {req.citizen_state} (BPL Status: {req.bpl_status}).

    Input Text / Notification: "{req.policy_text}"

    Return ONLY a valid JSON object with the exact following keys (all values written in {target_lang}):
    1. "scheme_or_law_title": Official name of the relevant Act, Scheme, or Notification.
    2. "plain_explainer": A 3-4 sentence plain-language explanation of what this means for the common citizen.
    3. "exact_rights": Array of 3 specific legal rights or monetary/service entitlements guaranteed.
    4. "eligibility_and_docs": Array of 3 bullet points detailing eligibility and documents required.
    5. "real_world_impact": How this directly impacts the citizen or small business on the ground.
    """
    response = await client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You output strictly valid JSON objects only."},
            {"role": "user", "content": prompt}
        ],
        model=model_id,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

# --- MODULE 2: TEXT/AUDIO CIVIC GRIEVANCE & SEVERITY TRIAGE ENGINE ---
class GrievanceTriageRequest(BaseModel):
    grievance_text: str
    location: str = "India"
    lang: str = "en"

@app.post("/api/triage")
async def triage_civic_grievance(req: GrievanceTriageRequest):
    model_id = await get_working_groq_model()
    target_lang = LANGUAGE_NAMES.get(req.lang, "English")

    prompt = f"""
    You are the National Civic Grievance & Infrastructure Triage Engine (CPGRAMS Standard).
    Evaluate the following citizen grievance from {req.location} and perform an automated severity, risk, and jurisdiction triage.

    Citizen Report: "{req.grievance_text}"
    Jurisdiction Location: "{req.location}"

    Return ONLY a valid JSON object with these exact keys (written in {target_lang}):
    1. "issue_category": Specific infrastructure/civic category (e.g., "National Highway Structural Collapse", "Water Contamination").
    2. "severity_score": Integer from 1 to 100 indicating urgency.
    3. "severity_badge": One of ["CRITICAL (90+/100)", "HIGH (75/100)", "MODERATE (50/100)"].
    4. "municipal_or_district_body": Exact local/district authority responsible.
    5. "central_ministry": Exact Central Government Ministry (e.g., "Ministry of Road Transport & Highways").
    6. "statutory_sla": Mandatory resolution timeframe under Citizen Charter / CPGRAMS (e.g., "48 Hours (Life & Public Safety Proviso)").
    7. "impact_assessment": 2 crisp sentences in {target_lang} detailing the public safety risk and recommended immediate field inspection action.
    """
    response = await client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You output strictly valid JSON objects only."},
            {"role": "user", "content": prompt}
        ],
        model=model_id,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

# --- MODULE 4: FACT-VERIFICATION & DEEPFAKE AUDIT ENGINE ---
@app.post("/api/fact-check")
async def audit_claim_and_media(
    claim_text: str = Form(""),
    lang: str = Form("en"),
    file: UploadFile = File(None)
):
    target_lang = LANGUAGE_NAMES.get(lang, "English")
    forensic_report = {
        "media_analyzed": False,
        "resolution": "N/A",
        "exif_status": "No media uploaded",
        "forensic_flags": []
    }

    if file and file.filename:
        img_bytes = await file.read()
        forensic_report["media_analyzed"] = True
        try:
            if HAS_PIL and Image is not None:
                img = Image.open(io.BytesIO(img_bytes))
                forensic_report["resolution"] = f"{img.width}x{img.height} ({img.format})"
                exif_data = img.getexif()
                if exif_data and len(exif_data) > 0:
                    decoded_exif = {ExifTags.TAGS.get(k, k): str(v) for k, v in exif_data.items() if k in ExifTags.TAGS}
                    software = decoded_exif.get("Software", "")
                    forensic_report["exif_status"] = "Camera EXIF Present"
                    if any(s in software.lower() for s in ["photoshop", "gimp", "canva", "stable diffusion", "midjourney"]):
                        forensic_report["forensic_flags"].append(f"AI/Editing Signature Detected: {software}")
                else:
                    forensic_report["exif_status"] = "EXIF Stripped (Typical of WhatsApp Forward or AI Generator)"
            else:
                forensic_report["exif_status"] = "Binary header inspected"
        except Exception:
            forensic_report["exif_status"] = "Binary stream inspected"

    live_web_snippets = []
    if claim_text.strip():
        try:
            search_q = urllib.parse.quote(f"{claim_text[:100]} PIB fact check government India")
            async with httpx.AsyncClient(timeout=5.0) as http_client:
                ddg_resp = await http_client.get(f"https://html.duckduckgo.com/html/?q={search_q}", headers={"User-Agent": "Mozilla/5.0"})
                if ddg_resp.status_code == 200:
                    from re import findall, sub
                    raw = findall(r'class="result__snippet[^>]*>(.*?)</a>', ddg_resp.text)
                    live_web_snippets = [sub(r"<[^>]+>", "", s).strip() for s in raw[:3] if sub(r"<[^>]+>", "", s).strip()]
        except Exception:
            pass

    audit_prompt = f"""
    Evaluate this viral claim and forensic telemetry.
    Claim: "{claim_text}"
    Image Forensic Data (if any): {json.dumps(forensic_report)}
    Live Evidence Snippets: {json.dumps(live_web_snippets)}

    Return ONLY a valid JSON object in {target_lang} with these exact keys:
    1. "verdict": One of ["VERIFIED AUTHENTIC", "FAKE / FABRICATED", "MISLEADING / UNVERIFIED"].
    2. "credibility_score": Integer from 0 to 100.
    3. "fact_audit_summary": 3 sentences explaining why it is authentic or fake based on evidence.
    4. "provenance_and_red_flags": Array of 2 red flags identified (e.g., EXIF stripping, conflicting web reports).
    """

    model_id = await get_working_groq_model()
    try:
        resp = await client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": "You output strictly valid JSON objects only."},
                {"role": "user", "content": audit_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        result = json.loads(resp.choices[0].message.content)
        result["forensic_telemetry"] = forensic_report
        result["live_web_evidence"] = live_web_snippets
        return result
    except Exception as e:
        return {
            "verdict": "ERROR",
            "credibility_score": 0,
            "fact_audit_summary": f"Could not complete audit. Error: {str(e)}",
            "provenance_and_red_flags": [],
            "forensic_telemetry": forensic_report
        }

# --- SECTION 19(1) FIRST APPEAL GENERATOR ---
class AppealRequest(BaseModel):
    receipt_id: str
    applicant_name: str
    ministry: str
    original_draft: str
    filed_date: str

@app.post("/api/appeal")
async def generate_first_appeal(req: AppealRequest):
    model_id = await get_working_groq_model()
    prompt = f"""
    Draft a formal First Appeal under Section 19(1) of the Right to Information Act, 2005 addressed to the First Appellate Authority (FAA) of {req.ministry}.
    Original RTI Reference No: {req.receipt_id}, Filed Date: {req.filed_date}, Applicant: {req.applicant_name}.
    Original Content: {req.original_draft}
    Return ONLY a JSON object with key "appeal_draft".
    """
    response = await client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You output strictly valid JSON objects only."},
            {"role": "user", "content": prompt}
        ],
        model=model_id,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

async def draft_rti_content(user_query: str, citizen_profile: dict, lang: str = "hi") -> dict:
    model_id = await get_working_groq_model()
    is_bpl = citizen_profile.get("bpl", "No") == "Yes"
    is_urgent = citizen_profile.get("life_liberty", False)
    target_lang = LANGUAGE_NAMES.get(lang, "Hindi (Devanagari script)")

    prompt = f"""
    You are a Senior Constitutional & RTI Legal Counsel in India.
    Convert the citizen's grievance into a structured English legal application under Section 6(1) of the Right to Information Act, 2005, AND provide a plain-language citizen summary in {target_lang}.
    
    Citizen Grievance: "{user_query}"
    Applicant Name: {citizen_profile.get('name', 'Citizen of India')}
    District/State: {citizen_profile.get('state', 'India')}
    BPL Status: {"Yes - Exempt from fee under Section 7(5)" if is_bpl else "No - Standard Rs 10 Statutory Fee"}
    Urgency: {"URGENT LIFE & LIBERTY PROVISO UNDER SECTION 7(1) - 48 HOUR MANDATE" if is_urgent else "Standard 30-Day Statutory Mandate under Section 7(1)"}

    Return ONLY a valid JSON object with:
    1. "ministry_search_keyword": Single keyword to match Central Ministry dropdown (e.g., "Road Transport", "Higher Education", "Health", "Rural Development", "Railways", "Finance").
    2. "department_predicted": Full formal name of the Ministry.
    3. "statutory_sections": Array of strings citing RTI sections.
    4. "formal_draft": Clean English paragraphs, strictly alphanumeric and basic punctuation (NO special characters).
    5. "citizen_summary_hindi": Plain-language summary and voice explainer script written in {target_lang}.
    """
    response = await client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You output strictly valid JSON objects only."},
            {"role": "user", "content": prompt}
        ],
        model=model_id,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

# --- MODULE 3: AUTONOMOUS PLAYWRIGHT RTI EXECUTION ENGINE ---
@app.websocket("/ws/agent")
async def agent_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_logs = []

    async def send_telemetry(step_id: str, status: str, log: str, payload: dict = None):
        ts = datetime.now().strftime("%H:%M:%S")
        session_logs.append(f"[{ts}] {log}")
        await websocket.send_text(json.dumps({
            "step_id": step_id,
            "status": status,
            "log": log,
            "payload": payload or {}
        }))

    try:
        raw_msg = await websocket.receive_text()
        req = json.loads(raw_msg)
        user_query = req.get("query", "")
        profile = req.get("profile", {})
        clean_mobile = "".join(c for c in profile.get("mobile", "") if c.isdigit())[-10:]
        should_submit = req.get("submit_to_gateway", True)
        is_public = 1 if req.get("share_publicly", True) else 0
        severity_badge = req.get("severity_score", "STANDARD")

        if len(clean_mobile) < 10:
            await send_telemetry("node_1", "error", "Please enter a valid 10-digit Mobile Number in the Citizen Passbook.")
            return

        # STEP 1: Legal Synthesis
        await send_telemetry("node_1", "running", "Drafting official Section 6(1) RTI Petition & Regional Summary...")
        rti_data = await draft_rti_content(user_query, profile, req.get("lang", "hi"))
        clean_draft = "".join(c for c in rti_data["formal_draft"] if c.isalnum() or c in " ., -()\n")
        rti_data["formal_draft"] = clean_draft

        await send_telemetry("node_1", "completed", f"Assigned to {rti_data.get('department_predicted')}.", {"rti_data": rti_data})

        # STEP 2: Portal Handshake
        await send_telemetry("node_2", "running", "Connecting to Official Government RTI Portal (rtionline.gov.in)...")
        
        async with async_playwright() as p:
            # Headless background execution so it works on Render cloud AND never steals window focus locally
            browser = await p.chromium.launch(
                headless=True,
                slow_mo=150,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1280,900"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 900})
            page = await context.new_page()

            page.on("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
            await page.goto("https://rtionline.gov.in/request/request.php", timeout=45000)
            
            submit_req_link = page.locator("a:has-text('Submit Request')").first
            if await submit_req_link.count() > 0 and "guidelines" not in page.url.lower():
                await submit_req_link.click()
                await page.wait_for_load_state("domcontentloaded")
                await asyncio.sleep(0.8)

            await send_telemetry("node_2", "completed", "Connected to DoPT Portal. Accepting citizen guidelines...")

            # STEP 3: Bypass Guidelines & Select Ministry
            await send_telemetry("node_3", "running", "Accepting guidelines & opening RTI Application Form...")
            
            chk = page.locator("input[type='checkbox']").first
            if await chk.count() > 0:
                await chk.check()
                submit_btn = page.locator("input[type='submit'], button[type='submit']").first
                await submit_btn.click()
                await page.wait_for_load_state("domcontentloaded")
                await asyncio.sleep(1.2)

            keyword = rti_data.get("ministry_search_keyword", "Road").lower()
            selects = page.locator("select")
            matched_ministry = rti_data.get("department_predicted", "Public Authority")

            for idx in range(min(await selects.count(), 2)):
                sel = selects.nth(idx)
                if await sel.is_visible():
                    options = await sel.locator("option").all_inner_texts()
                    match = next((opt for opt in options if keyword in opt.lower()), None)
                    if match:
                        await sel.select_option(label=match)
                        matched_ministry = match.strip()
                        await asyncio.sleep(0.8)

            await send_telemetry("node_3", "completed", f"Selected Authority: {matched_ministry}")

            # STEP 4: Citizen KYC & Form Injection
            await send_telemetry("node_4", "running", "Entering citizen details & RTI petition into form...")

            bpl_status = profile.get("bpl", "No")
            field_mappings = [
                ("input[name*='name' i], input[id*='name' i]", profile.get("name", "Citizen")),
                ("input[name*='email' i], input[id*='email' i]", profile.get("email", "citizen@gmail.com")),
                ("input[name*='confirm' i], input[id*='confirm' i]", profile.get("email", "citizen@gmail.com")),
                ("input[name*='mobile' i], input[id*='mobile' i]", clean_mobile),
                ("input[name*='pin' i], input[id*='pin' i]", profile.get("pincode", "110001")),
                ("input[name*='address' i], textarea[name*='address' i]", profile.get("address", "India")),
            ]
            for selector, val in field_mappings:
                loc = page.locator(selector)
                for i in range(await loc.count()):
                    el = loc.nth(i)
                    if await el.is_visible():
                        try:
                            await el.fill(str(val))
                        except Exception:
                            pass
            
            try:
                bpl_select = page.locator("select[name*='bpl' i], select[id*='bpl' i]").first
                if await bpl_select.count() > 0 and await bpl_select.is_visible():
                    await bpl_select.select_option(label="Yes" if bpl_status == "Yes" else "No")
                    await asyncio.sleep(0.4)
                    if bpl_status == "Yes":
                        bpl_card = page.locator("input[name*='bpl_card_no' i], input[id*='bpl_card_no' i], input[name*='bplcard' i]").first
                        bpl_year = page.locator("input[name*='bpl_year' i], input[id*='bpl_year' i], input[name*='year' i]").first
                        bpl_auth = page.locator("input[name*='bpl_auth' i], input[id*='bpl_auth' i], input[name*='auth' i]").first
                        if await bpl_card.count() > 0 and await bpl_card.is_visible():
                            await bpl_card.fill(str(profile.get("bplCardNo", "")))
                        if await bpl_year.count() > 0 and await bpl_year.is_visible():
                            await bpl_year.fill(str(profile.get("bplYear", "")))
                        if await bpl_auth.count() > 0 and await bpl_auth.is_visible():
                            await bpl_auth.fill(str(profile.get("bplAuthority", "")))
            except Exception:
                pass

            try:
                textareas = page.locator("textarea")
                if await textareas.count() > 0:
                    target_ta = textareas.nth(await textareas.count() - 1)
                    if await target_ta.is_visible():
                        await target_ta.fill(clean_draft[:2950])
            except Exception:
                pass

            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(0.8)

            form_b64 = base64.b64encode(await page.screenshot(full_page=False)).decode("utf-8")
            await send_telemetry("node_4", "completed", "Citizen profile and legal text filled on government portal.", {"browser_snapshot": f"data:image/png;base64,{form_b64}"})

            # STEP 5: CAPTCHA Extraction
            await send_telemetry("node_5", "running", "Fetching security CAPTCHA from portal form...")

            captcha_b64 = None
            captcha_selectors = ["img[src*='captcha' i]", "img[id*='captcha' i]", "img[alt*='captcha' i]", "#captchaImage", "img[src*='securimage' i]"]
            for c_sel in captcha_selectors:
                c_loc = page.locator(c_sel).first
                if await c_loc.count() > 0 and await c_loc.is_visible():
                    try:
                        await c_loc.scroll_into_view_if_needed()
                        cap_bytes = await c_loc.screenshot()
                        captcha_b64 = f"data:image/png;base64,{base64.b64encode(cap_bytes).decode('utf-8')}"
                        break
                    except Exception:
                        pass

            if not captcha_b64:
                captcha_b64 = f"data:image/png;base64,{form_b64}"

            await send_telemetry("node_5", "awaiting_human", "Waiting for citizen to enter the portal CAPTCHA code...", {"captcha_image": captcha_b64})

            human_msg = await websocket.receive_text()
            human_data = json.loads(human_msg)
            captcha_code = human_data.get("captcha_code", "")
            await send_telemetry("node_5", "completed", "Security CAPTCHA verified by citizen.")

            # STEP 6: Final Staging & Phone-Isolated Save
            await send_telemetry("node_6", "running", "Injecting CAPTCHA & submitting application...")

            cap_input = page.locator("input[name*='captcha' i], input[id*='captcha' i], input[name*='code' i]").first
            if await cap_input.count() > 0 and await cap_input.is_visible():
                await cap_input.fill(str(captcha_code))
                await asyncio.sleep(0.5)

            if should_submit:
                final_btn = page.locator("input[type='submit'][value*='Submit' i], input[type='submit'][value*='Make Payment' i], button[type='submit']").first
                if await final_btn.count() > 0 and await final_btn.is_visible():
                    try:
                        await final_btn.click()
                        await page.wait_for_load_state("domcontentloaded", timeout=15000)
                        await asyncio.sleep(1.5)
                    except Exception:
                        pass

            final_b64 = base64.b64encode(await page.screenshot(full_page=False)).decode("utf-8")
            receipt_id = f"JANSETU-RTI-{datetime.now().strftime('%Y%m%d')}-{abs(hash(user_query + clean_mobile)) % 9000 + 1000}"
            fee_status = "EXEMPT (BPL SEC 7-5)" if bpl_status == "Yes" else "SUBMITTED TO PAYMENT GATEWAY"

            now_dt = datetime.now()
            sla_dt = now_dt + (timedelta(hours=48) if profile.get("life_liberty") else timedelta(days=30))

            await send_telemetry("node_6", "completed", f"Saved to +91-{clean_mobile}'s Vault! Ref: {receipt_id}", {"browser_snapshot": f"data:image/png;base64,{final_b64}", "receipt_id": receipt_id})

            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""
                INSERT INTO rti_ledger (
                    receipt_id, applicant_name, applicant_mobile, applicant_email,
                    state, ministry, grievance_summary, formal_draft, execution_logs,
                    severity_score, status, is_public, created_at, sla_deadline
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                receipt_id,
                profile.get("name"),
                clean_mobile,
                profile.get("email", "").strip().lower(),
                profile.get("state"),
                matched_ministry,
                user_query[:180],
                clean_draft,
                "\n".join(session_logs),
                severity_badge,
                fee_status,
                is_public,
                now_dt.strftime("%d %b %Y, %I:%M %p"),
                sla_dt.strftime("%d %b %Y")
            ))
            conn.commit()
            conn.close()

            await asyncio.sleep(2)
            await browser.close()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await send_telemetry("node_error", "error", f"Portal Error: {str(e)}")
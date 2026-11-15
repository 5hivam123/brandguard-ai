import re
from typing import List, Dict, Any, Optional
from app.models import Brand, BrandGuideline, ApprovedFact, ProhibitedTerm
from app.services.ai_service import ai_service

class ReviewEngine:
    """
    Intelligent Hybrid Brand Governance Review Engine.
    Combines deterministic compliance pattern rules with optional LLM semantic analysis.
    Guarantees reliable, reproducible results without depending on external uptime.
    """

    CASUAL_SLANG_PATTERNS = [
        (r"\b(?:tbh|imo|imho|rn|ngl|fr|lol|lmao|rofl|omg|idk)\b", "Internet slang / informal abbreviation"),
        (r"\b(?:bro|dude|guys|fam|homie|bestie)\b", "Colloquial informal address"),
        (r"\b(?:insane deal|crazy discount|fire deal|sick offer)\b", "Overly casual hype phrasing"),
        (r"\b(?:gonna|wanna|gotta|kinda|sorta)\b", "Informal colloquial contraction"),
        (r"!{2,}", "Multiple exclamation marks (unprofessional punctuation)"),
    ]

    UNSUPPORTED_GUARANTEE_PATTERNS = [
        (r"\b(?:we guarantee|guaranteed|guarantee)\s+(?:\d+x|\d+%\s+growth|instant results|100%|risk[- ]free)", "Absolute guarantee or extreme performance claim"),
        (r"\b(?:10x\s+growth|10x\s+results|10x\s+roi)\b", "Aggressive growth multiplier claim"),
        (r"\b(?:100%\s+risk[- ]free|zero\s+risk|no\s+risk\s+whatsoever)\b", "Zero-risk regulatory compliance claim"),
        (r"\b(?:cheapest\s+in\s+[a-zA-Z]+|lowest\s+price\s+guaranteed|unbeatable\s+prices?)\b", "Comparative price superlative claim"),
        (r"\b(?:#1|number\s+one|world['']?s\s+best|undisputed\s+leader)\b", "Unsubstantiated market leadership claim"),
    ]

    OUTDATED_PATTERNS = [
        (r"\b(?:as\s+of\s+20(?:1[0-9]|2[0-3])|in\s+20(?:1[0-9]|2[0-3])\s+we\s+currently)\b", "Potentially outdated historical reference presented as current"),
    ]

    async def analyze(
        self,
        content_text: str,
        content_type: str,
        brand: Brand
    ) -> List[Dict[str, Any]]:
        """
        Runs comprehensive compliance review on content.
        Uses rule-based checks first, then merges with AI deep analysis if available.
        """
        issues: List[Dict[str, Any]] = []

        # 1. Check Prohibited Terminology
        prohibited_issues = self._check_prohibited_terms(content_text, brand.prohibited_terms)
        issues.extend(prohibited_issues)

        # 2. Check Unsupported Claims & Guarantees against Approved Facts
        unsupported_issues = self._check_claims_and_facts(content_text, brand.approved_facts)
        issues.extend(unsupported_issues)

        # 3. Check Tone Inconsistency based on Brand Preferred Tone
        tone_issues = self._check_brand_tone(content_text, brand.preferred_tone, brand.guidelines)
        issues.extend(tone_issues)

        # 4. Check Brand Guidelines
        guideline_issues = self._check_guidelines_rules(content_text, brand.guidelines)
        issues.extend(guideline_issues)

        # 5. Check Outdated / Misleading Information
        outdated_issues = self._check_outdated_misleading(content_text)
        issues.extend(outdated_issues)

        # 6. If AI Service is configured, augment with deep semantic analysis
        if ai_service.is_configured:
            try:
                ai_results = await ai_service.analyze_content(
                    content_text=content_text,
                    content_type=content_type,
                    brand_name=brand.name,
                    preferred_tone=brand.preferred_tone,
                    target_audience=brand.target_audience,
                    guidelines=[{"category": g.category, "text": g.guideline_text} for g in brand.guidelines],
                    approved_facts=[{"fact": f.fact_text, "source": f.source_name or ""} for f in brand.approved_facts],
                    prohibited_terms=[{"term": p.term, "replacement": p.replacement or ""} for p in brand.prohibited_terms],
                )
                if ai_results:
                    issues = self._merge_ai_and_rule_issues(issues, ai_results, content_text)
            except Exception as e:
                # Keep rule-based issues if AI call raises an unhandled error
                pass

        # Deduplicate issues based on problematic text overlap
        deduplicated = self._deduplicate_issues(issues)
        return deduplicated

    def _check_prohibited_terms(self, text: str, prohibited_terms: List[ProhibitedTerm]) -> List[Dict[str, Any]]:
        detected = []
        for p in prohibited_terms:
            if not p.term:
                continue
            escaped_term = re.escape(p.term.strip())
            # Match word boundary
            pattern = re.compile(rf"(?i)\b{escaped_term}\b")
            for match in pattern.finditer(text):
                actual_match = match.group(0)
                replacement = p.replacement or f"[Approved alternative for '{p.term}']"
                reason_detail = f" Reason: {p.reason}" if p.reason else ""
                detected.append({
                    "category": "Prohibited Terminology",
                    "severity": "High",
                    "problematic_text": actual_match,
                    "explanation": f"The term '{actual_match}' is strictly prohibited under the brand's banned words policy.{reason_detail}",
                    "supporting_evidence": f"Brand Terminology Policy: Disallowed phrase '{p.term}'.",
                    "suggested_correction": replacement,
                    "verification_status": "Confirmed Conflict"
                })
        return detected

    def _check_claims_and_facts(self, text: str, approved_facts: List[ApprovedFact]) -> List[Dict[str, Any]]:
        detected = []
        facts_text_corpus = " ".join([f.fact_text.lower() for f in approved_facts])

        # High-risk guarantee and extreme claims
        for pattern_str, label in self.UNSUPPORTED_GUARANTEE_PATTERNS:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            for match in pattern.finditer(text):
                matched_span = match.group(0)
                # Check if this exact claim is explicitly supported by approved facts
                claim_is_verified = False
                matched_lower = matched_span.lower()
                
                # If matched terms exist in approved facts with verification
                if "10x" in matched_lower and "10x" in facts_text_corpus:
                    claim_is_verified = True
                elif "guarantee" in matched_lower and "guarantee" in facts_text_corpus:
                    claim_is_verified = True
                elif "cheapest" in matched_lower and "cheapest" in facts_text_corpus:
                    claim_is_verified = True

                if not claim_is_verified:
                    # Expand match to full sentence if possible for better context
                    full_sentence = self._extract_sentence(text, match.start(), match.end())
                    problematic = full_sentence if len(full_sentence) <= 120 else matched_span

                    # Formulate appropriate suggestion
                    if "10x growth" in matched_lower or "guarantee" in matched_lower:
                        correction = "Empowering teams to achieve scalable, measurable growth."
                        explanation = (
                            f"The statement '{matched_span}' promises absolute results that are not substantiated "
                            "by company-approved metrics. Performance guarantees create legal liability without audit proof."
                        )
                        verification_status = "Unsupported Claim"
                        severity = "High"
                    elif "risk-free" in matched_lower or "zero risk" in matched_lower:
                        correction = "Transparent terms and dedicated customer onboarding support."
                        explanation = "Zero-risk or 100% risk-free declarations conflict with regulatory advertising standards."
                        verification_status = "Unsupported Claim"
                        severity = "High"
                    elif "cheapest" in matched_lower:
                        correction = "Affordably priced and high-value for Indian enterprises."
                        explanation = "Comparative lowest-price claims require continuous third-party market price validation."
                        verification_status = "Unsupported Claim"
                        severity = "High"
                    else:
                        correction = "Industry-leading solutions trusted by forward-thinking teams."
                        explanation = f"'{matched_span}' is an unverified superlative claim not documented in approved facts."
                        verification_status = "Unsupported Claim"
                        severity = "Medium"

                    evidence = (
                        f"Approved Facts repository contains {len(approved_facts)} records, "
                        f"none of which validate the claim '{matched_span}'."
                    )

                    detected.append({
                        "category": "Unsupported Claim",
                        "severity": severity,
                        "problematic_text": problematic,
                        "explanation": explanation,
                        "supporting_evidence": evidence,
                        "suggested_correction": correction,
                        "verification_status": verification_status
                    })

        # Check for unverified numerical statistics (e.g., "Over 99.9% uptime", "Over 50,000 customers")
        stat_patterns = re.compile(r"\b(?:over|more than|approximately)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?%|\d+\+?)\s+([a-zA-Z]{3,20})\b", re.IGNORECASE)
        for stat_match in stat_patterns.finditer(text):
            stat_phrase = stat_match.group(0).strip()
            # If the stat is not in approved facts, mark as unverified
            if stat_phrase.lower() not in facts_text_corpus and not any(stat_phrase.lower() in f.fact_text.lower() for f in approved_facts):
                # Don't duplicate if already flagged in unsupported claims
                if not any(stat_phrase.lower() in d["problematic_text"].lower() for d in detected):
                    detected.append({
                        "category": "Unverified Statement",
                        "severity": "Low",
                        "problematic_text": stat_phrase,
                        "explanation": (
                            f"The metric '{stat_phrase}' is cited without a corresponding entry in the Approved Facts database. "
                            "Marked as unverified pending source citation."
                        ),
                        "supporting_evidence": "No matching approved fact or audit source found in workspace.",
                        "suggested_correction": f"{stat_phrase} [Verify exact figure with Compliance Team]",
                        "verification_status": "Unverified Statement"
                    })

        return detected

    def _check_brand_tone(self, text: str, preferred_tone: str, guidelines: List[BrandGuideline]) -> List[Dict[str, Any]]:
        detected = []
        tone_lower = preferred_tone.lower()
        is_professional = any(term in tone_lower for term in ["professional", "formal", "corporate", "trustworthy", "authoritative"])

        if is_professional:
            for pattern_str, reason in self.CASUAL_SLANG_PATTERNS:
                pattern = re.compile(pattern_str, re.IGNORECASE)
                for match in pattern.finditer(text):
                    actual_match = match.group(0)
                    
                    # Contextual replacement
                    m_lower = actual_match.lower()
                    if m_lower in ["tbh", "rn", "ngl", "fr"]:
                        replacement = "presently" if m_lower == "rn" else "indeed"
                    elif m_lower in ["guys", "fam", "homie", "bestie", "bro", "dude"]:
                        replacement = "professionals" or "valued customers"
                    elif "insane deal" in m_lower or "crazy discount" in m_lower or "fire deal" in m_lower:
                        replacement = "exclusive offer"
                    elif m_lower in ["gonna", "wanna", "gotta"]:
                        replacement = "will" if m_lower == "gonna" else "wish to"
                    elif actual_match.startswith("!"):
                        replacement = "."
                    else:
                        replacement = "[Refine to professional tone]"

                    detected.append({
                        "category": "Tone Inconsistency",
                        "severity": "Medium",
                        "problematic_text": actual_match,
                        "explanation": (
                            f"The phrase '{actual_match}' ({reason}) conflicts with the brand's configured tone "
                            f"'{preferred_tone}'. Professional enterprise communications require polished language."
                        ),
                        "supporting_evidence": f"Brand Preferred Tone: '{preferred_tone}'",
                        "suggested_correction": replacement,
                        "verification_status": "Style Recommendation"
                    })

        return detected

    def _check_guidelines_rules(self, text: str, guidelines: List[BrandGuideline]) -> List[Dict[str, Any]]:
        detected = []
        for g in guidelines:
            g_text = g.guideline_text.lower()
            # If guideline specifies avoiding competitor mentions
            if "competitor" in g_text and ("avoid" in g_text or "do not" in g_text or "never" in g_text):
                common_competitor_words = [r"\bversus\b", r"\bvs\.?\b", r"\bbetter than\b", r"\bunlike\b"]
                for comp_pat in common_competitor_words:
                    m = re.search(comp_pat, text, re.IGNORECASE)
                    if m:
                        matched = m.group(0)
                        detected.append({
                            "category": "Brand Guideline Deviation",
                            "severity": "Medium",
                            "problematic_text": matched,
                            "explanation": f"Content appears to make direct comparative references, violating guideline: '{g.guideline_text}'.",
                            "supporting_evidence": f"Guideline ({g.category}): {g.guideline_text}",
                            "suggested_correction": "Focus on our platform's native capabilities rather than direct comparison.",
                            "verification_status": "Confirmed Conflict"
                        })
                        break
        return detected

    def _check_outdated_misleading(self, text: str) -> List[Dict[str, Any]]:
        detected = []
        for pattern_str, label in self.OUTDATED_PATTERNS:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            for match in pattern.finditer(text):
                matched = match.group(0)
                detected.append({
                    "category": "Outdated Information",
                    "severity": "Medium",
                    "problematic_text": matched,
                    "explanation": f"The phrase '{matched}' references an outdated year as current information ({label}).",
                    "supporting_evidence": "Information currency standards require current calendar year references.",
                    "suggested_correction": "Update to current fiscal year figures.",
                    "verification_status": "Needs Human Review"
                })
        return detected

    def _extract_sentence(self, text: str, start: int, end: int) -> str:
        # Expand boundaries to the containing sentence
        s_start = max(0, text.rfind(".", 0, start) + 1)
        s_start = max(s_start, text.rfind("\n", 0, start) + 1)
        s_end = text.find(".", end)
        if s_end == -1:
            s_end = len(text)
        else:
            s_end += 1
        sentence = text[s_start:s_end].strip()
        return sentence if sentence else text[start:end]

    def _deduplicate_issues(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen_texts = set()
        deduped = []
        for issue in issues:
            key = (issue["category"], issue["problematic_text"].strip().lower())
            if key not in seen_texts:
                seen_texts.add(key)
                deduped.append(issue)
        return deduped

    def _merge_ai_and_rule_issues(
        self,
        rule_issues: List[Dict[str, Any]],
        ai_issues: List[Dict[str, Any]],
        original_text: str
    ) -> List[Dict[str, Any]]:
        combined = list(rule_issues)
        existing_problematic = {iss["problematic_text"].lower(): iss for iss in rule_issues}

        for ai_issue in ai_issues:
            prob = ai_issue.get("problematic_text", "").strip()
            if not prob:
                continue

            # Verify that the problematic text actually exists in the original content
            if prob.lower() not in original_text.lower():
                continue

            # If not already flagged by rule engine, add AI discovery
            if prob.lower() not in existing_problematic:
                combined.append({
                    "category": ai_issue.get("category", "Unclear or Misleading Statement"),
                    "severity": ai_issue.get("severity", "Medium"),
                    "problematic_text": prob,
                    "explanation": ai_issue.get("explanation", "Detected semantic compliance deviation."),
                    "supporting_evidence": ai_issue.get("supporting_evidence", "AI Semantic Governance Model"),
                    "suggested_correction": ai_issue.get("suggested_correction", "[Revise wording]"),
                    "verification_status": ai_issue.get("verification_status", "Needs Human Review")
                })

        return combined

    def generate_revised_content(self, original_content: str, accepted_suggestions: List[Dict[str, str]]) -> str:
        """
        Generates a revised draft by applying accepted suggestions without modifying unaccepted text.
        """
        revised = original_content
        for item in accepted_suggestions:
            target = item.get("problematic_text", "")
            replacement = item.get("suggested_correction", "")
            if target and target in revised:
                revised = revised.replace(target, replacement, 1)
        return revised

review_engine = ReviewEngine()

# OpenHamPrep Readiness Scoring Model

## Design Document v1.0

---

## 1. Problem Statement

Students preparing for amateur radio license exams need to know two things:

1. **Am I ready to take the exam?**
2. **If not, what should I study?**

Without access to actual exam outcomes (the FCC doesn't share individual results), we need a model grounded in learning science principles and the known structure of the exams. The model must be transparent enough that students trust it and actionable enough that it guides their study time effectively.

---

## 2. Exam Structure

Each amateur radio exam draws questions from a fixed pool, with a defined number of questions per subelement (topic area).

| Exam | Pool Size | Exam Questions | Passing Score | Pass Rate |
|------|-----------|----------------|---------------|-----------|
| Technician | 412 | 35 | 26 (74.3%) | 74% |
| General | 454 | 35 | 26 (74.3%) | 74% |
| Amateur Extra | 693 | 50 | 37 (74.0%) | 74% |

The exam questions are **not drawn uniformly** from the pool. Each subelement contributes a fixed number of questions. For the Technician exam:

| Subelement | Topic | Exam Questions | Pool Questions | Exam Weight |
|------------|-------|----------------|----------------|-------------|
| T1 | FCC Rules | 6 | 72 | 17.1% |
| T2 | Operating Procedures | 3 | 36 | 8.6% |
| T3 | Radio Wave Characteristics | 3 | 36 | 8.6% |
| T4 | Amateur Radio Practices | 2 | 24 | 5.7% |
| T5 | Electrical Principles | 4 | 68 | 11.4% |
| T6 | Electronic Components | 4 | 44 | 11.4% |
| T7 | Station Equipment | 4 | 48 | 11.4% |
| T8 | Modulation & Signals | 4 | 44 | 11.4% |
| T9 | Antennas & Feedlines | 2 | 24 | 5.7% |
| T0 | Safety | 3 | 16 | 8.6% |

This structure is critical: a student who scores 90% on T9 (2 questions) but 50% on T1 (6 questions) will struggle, while the reverse situation is much more forgiving.

---

## 3. Input Variables

The model uses the following measurable inputs for each student:

### 3.1 Global Metrics

| Variable | Symbol | Description |
|----------|--------|-------------|
| Recent accuracy | $A_r$ | Accuracy on the most recent $n$ questions (default: 50) |
| Overall accuracy | $A_o$ | Lifetime accuracy across all questions |
| Coverage | $C$ | Fraction of unique questions seen at least once |
| Mastery | $M$ | Fraction of questions answered correctly 2+ times |
| Practice tests passed | $T_p$ | Count of practice exams scoring ≥74% |
| Practice tests taken | $T_t$ | Total practice exams attempted |
| Days since last study | $D$ | Recency of engagement |

### 3.2 Per-Subelement Metrics

For each subelement $s$:

| Variable | Symbol | Description |
|----------|--------|-------------|
| Subelement accuracy | $A_s$ | Accuracy on questions from subelement $s$ |
| Subelement recent accuracy | $A_{s,r}$ | Accuracy on last 20 questions from $s$ |
| Subelement coverage | $C_s$ | Fraction of $s$'s pool seen at least once |
| Subelement mastery | $M_s$ | Fraction of $s$'s pool correct 2+ times |
| Exam weight | $w_s$ | Number of exam questions drawn from $s$ |
| Pool size | $P_s$ | Total questions in $s$'s pool |

---

## 4. Overall Readiness Score

The readiness score $R$ is a weighted composite on a 0–100 scale.

### 4.1 Formula

$$R = 35 \cdot A_r + 20 \cdot A_o + 15 \cdot C + 15 \cdot M + 15 \cdot T_{rate} - \delta(D)$$

Where:

- $A_r, A_o, C, M \in [0, 1]$
- $T_{rate} = \frac{T_p}{\max(T_t, 1)}$ (practice test pass rate)
- $\delta(D) = \min(10, 0.5 \cdot D)$ is a recency decay penalty

### 4.2 Weight Rationale

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Recent accuracy ($A_r$) | 35 | Best proxy for current knowledge state; more predictive than historical performance |
| Overall accuracy ($A_o$) | 20 | Smooths variance; indicates baseline ability |
| Coverage ($C$) | 15 | Can't answer questions you've never seen; encourages breadth |
| Mastery ($M$) | 15 | Repeated success indicates durable retention |
| Practice test rate ($T_{rate}$) | 15 | Full-length tests simulate exam conditions and build stamina |
| Recency penalty ($\delta$) | -10 max | Knowledge decays; encourages consistent study habits |

The weights sum to 100 before the recency penalty, making the score intuitive.

### 4.3 Pass Probability Estimate

We map the readiness score to a probability using a logistic function:

$$P(\text{pass}) = \frac{1}{1 + e^{-k(R - R_0)}}$$

Where:
- $R_0 = 65$ is the inflection point (50% probability)
- $k = 0.15$ controls the steepness of the curve

This yields:

| Readiness Score | Pass Probability |
|-----------------|------------------|
| 50 | 9% |
| 55 | 18% |
| 60 | 32% |
| 65 | 50% |
| 70 | 68% |
| 75 | 82% |
| 80 | 91% |
| 85 | 95% |

The inflection at 65 is intentionally conservative—it requires solid recent performance plus meaningful coverage and practice test success.

---

## 5. Subelement Risk Analysis

The overall readiness score tells students *whether* they're ready. The subelement analysis tells them *what to study*.

### 5.1 Expected Score Model

For each subelement $s$, we estimate how many questions the student would answer correctly on the real exam:

$$E_s = w_s \cdot \hat{A}_s$$

Where:
- $w_s$ is the number of exam questions from subelement $s$
- $\hat{A}_s$ is the estimated accuracy for that subelement

The estimated accuracy $\hat{A}_s$ uses a weighted blend of recent and overall performance:

| Condition | Estimated Accuracy ($\hat{A}_s$) |
|-----------|--------------------------|
| $n_{s,r} \geq 20$ (sufficient recent data) | $A_{s,r}$ (use recent accuracy) |
| $5 \leq n_{s,r} < 20$ (some recent data) | $\alpha \cdot A_{s,r} + (1-\alpha) \cdot A_s$ (blend) |
| $n_{s,r} < 5$ (insufficient recent data) | $A_s$ (use overall accuracy) |

Where:
- $n_{s,r}$ is the number of recent attempts in subelement $s$
- $\alpha = \frac{n_{s,r}}{20}$ provides smooth interpolation

This approach favors recent performance when we have enough data, but falls back to overall accuracy for subelements with limited recent activity.

### 5.2 Total Expected Score

The expected exam score is the sum across all subelements:

$$E_{total} = \sum_{s} E_s = \sum_{s} w_s \cdot \hat{A}_s$$

For a passing score of 26/35, we need $E_{total} \geq 26$.

### 5.3 Risk Score

Not all subelements pose equal risk. A subelement is risky if:

1. The student performs poorly on it (low accuracy)
2. It carries high exam weight (many questions)
3. The student has low coverage (hasn't seen much of it)
4. Improvement is still possible (not already mastered)

The risk score for subelement $s$:

$$\text{Risk}_s = w_s \cdot (1 - \hat{A}_s) \cdot \beta_s$$

Where $\beta_s$ is a confidence/coverage modifier:

| Coverage ($C_s$) | $\beta_s$ | Rationale |
|----------------|-----|-----------|
| $C_s < 0.3$ | 1.2 | Low coverage, high uncertainty |
| $0.3 \leq C_s < 0.7$ | 1.0 | Moderate coverage |
| $C_s \geq 0.7$ | 0.9 | High coverage, more confident |

The intuition: if you've only seen 20% of a subelement's questions, your accuracy estimate is less reliable and the risk is higher.

### 5.4 Interpreting Risk Scores

Risk scores are relative, not absolute. We rank subelements by risk and focus attention on the top contributors.

**Example calculation for a struggling student:**

| Subelement | $w_s$ | $\hat{A}_s$ | $C_s$ | $\beta_s$ | $\text{Risk}_s$ |
|------------|-----|-----|-----|-----|--------|
| T1 | 6 | 0.55 | 0.40 | 1.0 | 6 × 0.45 × 1.0 = 2.70 |
| T5 | 4 | 0.60 | 0.25 | 1.2 | 4 × 0.40 × 1.2 = 1.92 |
| T6 | 4 | 0.70 | 0.50 | 1.0 | 4 × 0.30 × 1.0 = 1.20 |
| T9 | 2 | 0.50 | 0.35 | 1.0 | 2 × 0.50 × 1.0 = 1.00 |

This student should prioritize T1 (FCC Rules) first—it has the highest risk score due to the combination of low accuracy and high exam weight.

### 5.5 Expected Questions Lost

A more intuitive metric is "expected questions lost"—how many exam questions you'd likely miss in each subelement:

$$L_s = w_s \cdot (1 - \hat{A}_s)$$

For the example above:
- T1: 6 × 0.45 = 2.7 questions lost
- T5: 4 × 0.40 = 1.6 questions lost
- T6: 4 × 0.30 = 1.2 questions lost

Total expected wrong: `Σ L_s`. If this exceeds 9 (since 35 - 26 = 9 is the maximum you can miss), the student is unlikely to pass.

---

## 6. Confidence and Uncertainty

### 6.1 Sample Size Considerations

Accuracy estimates are unreliable with small sample sizes. We should communicate uncertainty:

| Questions Attempted | Confidence Level |
|--------------------|------------------|
| < 10 | Very low — "Not enough data" |
| 10–29 | Low — Show wide confidence interval |
| 30–49 | Moderate — Show narrow interval |
| ≥ 50 | High — Point estimate is reliable |

### 6.2 Confidence Interval Estimation

For a proportion (accuracy), the Wilson score interval is appropriate for small samples:

$$\hat{A} \pm \frac{z \sqrt{\frac{\hat{A}(1-\hat{A})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$

Where $z = 1.96$ for 95% confidence.

For user-facing display, we can simplify this to show ranges like "65–80% likely to pass" rather than false precision.

### 6.3 Minimum Activity Thresholds

Before showing a readiness score, require:

- At least 50 questions answered overall
- At least 2 questions answered in each subelement (to prevent divide-by-zero and absurd estimates)

Below these thresholds, show "Keep practicing" rather than a misleading score.

---

## 7. Trend Analysis

Point-in-time metrics miss an important signal: is the student improving, plateauing, or declining?

### 7.1 Accuracy Trend

Compare accuracy across time windows:

$$\Delta A = A_r - A_{prev}$$

Where $A_{prev}$ is accuracy on the 50 questions *before* the most recent 50.

| $\Delta A$ | Interpretation |
|----|----------------|
| > +0.10 | Strong improvement — "You're making great progress" |
| +0.03 to +0.10 | Improving — "You're trending upward" |
| -0.03 to +0.03 | Stable — "You're holding steady" |
| -0.10 to -0.03 | Declining — "Review recent mistakes" |
| < -0.10 | Significant decline — "Take a break, then review fundamentals" |

### 7.2 Per-Subelement Trends

The same analysis applies per subelement, helping identify:

- Subelements that have improved and may need less focus
- Subelements that are getting worse (possibly interference from new material)
- Subelements that have plateaued (may need a different study approach)

---

## 8. Study Recommendations

The model should generate specific, actionable recommendations.

### 8.1 Priority Ranking

Rank subelements by a priority score that balances risk and improvability:

$$\text{Priority}_s = \text{Risk}_s \cdot (1 - M_s)$$

The $(1 - M_s)$ term reduces priority for subelements that are already highly mastered—there's less room for improvement.

### 8.2 Recommendation Logic

Based on the analysis, generate recommendations:

**If expected score < passing score:**

> "Based on your current performance, you'd likely score around {E_total}/35. You need 26 to pass. Focus on these areas:
> 1. **{subelement_1}** — You're averaging {accuracy_1}% but this is worth {weight_1} questions. Aim for 80%+.
> 2. **{subelement_2}** — You've only seen {coverage_2}% of these questions. Increase your coverage first."

**If expected score ≥ passing score but marginal:**

> "You're on track to pass, but it's close. Shore up these weak spots:
> 1. **{subelement_1}** — Improving from {accuracy_1}% to 80% would give you a 2-question buffer."

**If expected score is comfortable:**

> "You're ready. Your expected score is {E_total}/35 with a {pass_probability}% chance of passing. Consider scheduling your exam."

### 8.3 Specific Study Actions

For each flagged subelement, suggest concrete actions:

| Situation | Recommendation |
|-----------|----------------|
| Low coverage (< 40%) | "Work through more {subelement} questions to see the full range of topics." |
| Low accuracy, good coverage | "Review the {subelement} lesson, then retry questions you've missed." |
| Declining accuracy | "You may be confusing {subelement} with related material. Take a focused review session." |
| Low mastery despite attempts | "Use spaced repetition—revisit {subelement} questions over several days." |

---

## 9. Practice Test Integration

Practice tests deserve special treatment because they simulate real exam conditions.

### 9.1 Practice Test Scoring

A practice test generates:

- Overall score (out of 35 or 50)
- Per-subelement breakdown
- Identification of questions missed

### 9.2 Using Practice Test Results

Practice test performance should:

1. **Heavily influence recent accuracy** — A practice test is the most realistic signal
2. **Update subelement estimates** — If a student misses 2/4 on T7 during a practice test, that's meaningful
3. **Trigger recommendations** — "On your last practice test, you missed 2 questions on T7 (Station Equipment). Review these topics: [specific subtopics]"

### 9.3 Practice Test Trajectory

Track practice test scores over time:

| Test # | Score | Status |
|--------|-------|--------|
| 1 | 22/35 | Fail |
| 2 | 25/35 | Fail (close) |
| 3 | 28/35 | Pass |
| 4 | 30/35 | Pass |

Show this progression to students—it's motivating to see improvement.

---

## 10. Calibration Without Outcome Data

Since we can't validate against real exam results, we use proxy calibration methods.

### 10.1 Self-Reported Outcomes

Prompt users who report passing or failing to share their experience:

> "Congratulations on passing! Would you mind sharing: (a) your exam score, (b) any topics that surprised you?"

Even a small number of responses helps validate the model.

### 10.2 Internal Consistency Checks

- Do students with higher readiness scores pass more practice tests? (They should.)
- Does readiness score correlate with practice test trajectory? (It should.)
- Do subelement risk predictions match practice test performance? (They should.)

### 10.3 Conservative Defaults

When uncertain, the model should:

- Underestimate readiness slightly (better to over-prepare)
- Recommend more study rather than less
- Require consistent performance before showing "Ready"

---

## 11. User Interface Considerations

### 11.1 Dashboard Elements

**Primary display:**
- Readiness score (0–100) with label ("Not Ready" → "Very Ready")
- Pass probability as a percentage
- Trend indicator (↑ improving, → stable, ↓ declining)

**Subelement breakdown:**
- Table or chart showing each subelement's accuracy vs. target (74%)
- Visual highlighting of at-risk subelements (red/yellow/green)
- Coverage bars showing how much of each subelement has been seen

**Recommendations:**
- Top 2–3 prioritized study actions
- Links to relevant lessons or question sets

### 11.2 Progress Over Time

Show historical charts:
- Readiness score over time
- Practice test scores over time
- Per-subelement accuracy trends

### 11.3 Avoiding Discouragement

Early in the study process, low scores are expected. Frame them constructively:

> "You're just getting started. Focus on completing the lessons before worrying about your readiness score."

Set expectations for typical progression:

> "Most students reach 'Ready' status after 2–4 weeks of consistent study."

---

## 12. Summary

This model provides:

1. **A single readiness score** that synthesizes multiple signals into an intuitive 0–100 metric
2. **A pass probability estimate** that communicates uncertainty appropriately  
3. **Subelement risk analysis** that identifies exactly where to focus study time
4. **Trend tracking** that shows improvement over time
5. **Actionable recommendations** that tell students what to do next

The model is designed to work without historical outcome data by:
- Using conservative thresholds
- Weighting inputs based on learning science principles
- Encouraging self-reported outcomes for future calibration

---

## Appendix A: Technician Exam Subelement Reference

| Code | Topic | Exam Qs | Pool Qs |
|------|-------|---------|---------|
| T1 | FCC Rules, descriptions and definitions for the amateur radio service, operator and station license responsibilities | 6 | 72 |
| T2 | Operating Procedures | 3 | 36 |
| T3 | Radio wave characteristics: properties of radio waves; propagation modes | 3 | 36 |
| T4 | Amateur radio practices and station set up | 2 | 24 |
| T5 | Electrical principles: math for electronics; electronic principles; Ohm's Law | 4 | 68 |
| T6 | Electronic and electrical components | 4 | 44 |
| T7 | Station equipment: radios; transmitting and receiving; transceivers | 4 | 48 |
| T8 | Modulation modes: amateur satellite operation; operating activities; non-voice and digital communications | 4 | 44 |
| T9 | Antennas and feed lines | 2 | 24 |
| T0 | Electrical safety; antenna installation and RF safety practices | 3 | 16 |

---

## Appendix B: Parameter Tuning

If self-reported data becomes available, the following parameters should be tuned first:

| Parameter | Default | Tuning Approach |
|-----------|---------|-----------------|
| $R_0$ (sigmoid midpoint) | 65 | Adjust so 50% of students at this score actually pass |
| $k$ (sigmoid steepness) | 0.15 | Adjust to match observed pass rate distribution |
| Component weights | 35/20/15/15/15 | Regression against outcomes if available |
| $\beta_s$ coverage modifiers | 1.2/1.0/0.9 | Validate against subelement performance |

---

## Appendix C: Future Enhancements

1. **Question difficulty estimation** — Some questions are harder than others. If we track per-question accuracy across all users, we can weight performance accordingly.

2. **Forgetting curve modeling** — Accuracy on questions decays over time since last seen. Incorporate time-since-seen into mastery calculations.

3. **Personalized question selection** — Use the risk model to prioritize which questions to show next (adaptive practice).

4. **Cohort comparison** — Show students how they compare to others at the same stage ("You're ahead of 70% of students with similar study time").

/**
 * One-off helper: scans category JSON and prints candidate first names (pattern-based).
 * Used to build substitution whitelist in src/constants/replacementNames.js
 */
const fs = require("fs");
const path = require("path");

const CAT_DIR = path.join(__dirname, "..", "public", "data", "categories");

const patterns = [
  /\b([A-Z][a-z]{2,20})\s+is\s+(a|an)\b/g,
  /\b([A-Z][a-z]{2,20})\s+has\s+/g,
  /\b([A-Z][a-z]{2,20})\s+was\s+/g,
  /\b([A-Z][a-z]{2,20})\s+works\s+/g,
  /\b([A-Z][a-z]{2,20})\s+joined\b/g,
  /\b([A-Z][a-z]{2,20})\s+manages\b/g,
  /\b([A-Z][a-z]{2,20})\s+needs\b/g,
  /\b([A-Z][a-z]{2,20})\s+asks\b/g,
  /\b([A-Z][a-z]{2,20})\s+told\b/g,
  /\b([A-Z][a-z]{2,20})\s+reports\b/g,
  /\b([A-Z][a-z]{2,20})\s+discovered\b/g,
  /\b([A-Z][a-z]{2,20})\s+received\b/g,
  /\b([A-Z][a-z]{2,20})\s+assigned\b/g,
  /\b([A-Z][a-z]{2,20})\s+appointed\b/g,
  /\b([A-Z][a-z]{2,20})\s+replaced\b/g,
  /\b([A-Z][a-z]{2,20})'s\s+/g,
];

const bad = new Set(
  `There This That What When Which Your They Team Project Company Customer Sponsor Manager Organization Senior Agile Scrum Kanban Lean Product Development Upper One New All Each Some Most First Next Since After Before While During Because Although However Therefore Another Other Both Such These Those Every Given Using Having Being Making Taking Getting Adding Building Creating Following According Depending Meeting Planning Closing Opening Starting Ending Working Writing Reading Sending Receiving Performing Developing Managing Leading Ensuring Providing Including Excluding Considering Identifying Analyzing Reviewing Updating Preparing Conducting Establishing Determining Selecting Negotiating Implementing Integrating Monitoring Controlling Initiating Executing Processing Documenting Communicating Collecting Defining Estimating Scheduling Budgeting Procuring Acquiring Assigning Reporting Escalating Validating Verifying Accepting Rejecting Approving Authorizing Informing Engaging Tracking Recording Ordering Requesting Recommending Advising Consulting Facilitating Coaching Testing Deploying Releasing Demonstrating Participating Attending Joining Leaving Hiring Replacing Transferring Submitting Signing Agreeing Disagreeing Refusing Denying Confirming Assuming Expecting Believing Thinking Knowing Understanding Learning Teaching Showing Indicating Stating Explaining Describing Listing Ranking Scoring Measuring Calculating Forecasting Predicting Allocating Distributing Delegating Supervising Directing Approaching Addressing Answering Questioning Researching Investigating Exploring Examining Studying Surveying Interviewing Rescheduling Canceling Postponing Delaying Accelerating Crashing Fast Rolling Bottom Top Best Worst Same Full Part Half Third Fourth Fifth Agile Waterfall Hybrid Matrix Program Portfolio Charter Resource Risk Cost Schedule Scope Quality Procurement Integration Communication Stakeholder Requirements Documentation Lessons Enterprise Environmental Organizational Historical Information Technology Government Industry Commercial Legal Social Ecological Persona`.split(
    /\s+/
  )
);

function main() {
  const names = new Map();
  const files = fs
    .readdirSync(CAT_DIR)
    .filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const arr = JSON.parse(
      fs.readFileSync(path.join(CAT_DIR, file), "utf8")
    );
    for (const row of arr) {
      for (const field of [
        "Question",
        "Choice 1",
        "Choice 2",
        "Choice 3",
        "Choice 4",
        "Explanation",
      ]) {
        const t = row[field];
        if (!t || typeof t !== "string") continue;
        for (const re of patterns) {
          let m;
          const rx = new RegExp(re.source, re.flags);
          while ((m = rx.exec(t))) {
            const n = m[1];
            if (!bad.has(n)) names.set(n, (names.get(n) || 0) + 1);
          }
        }
      }
    }
  }

  const sorted = [...names.entries()].sort((a, b) => b[1] - a[1]);
  console.log("count", sorted.length);
  console.log(sorted.map(([w]) => w).join(", "));
}

main();

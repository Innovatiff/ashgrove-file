// One voice for the scripts the GitHub workflows run.
//
// Each finding is a line in the log. A problem or a warning also becomes an
// annotation on the run, and the whole list is written to the run's summary
// page, so the answer is readable without opening the log.

import { appendFileSync } from 'node:fs';

const LABEL = { ok: 'OK', note: 'NOTE', warning: 'WARNING', problem: 'PROBLEM' };
const COMMAND = { warning: 'warning', problem: 'error' };

// Workflow commands take their text on one line.
const escape = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

/**
 * @param {string} heading Title of this list on the summary page.
 */
export function createReport(heading) {
  const onGitHub = process.env.GITHUB_ACTIONS === 'true';
  /** @type {{ level: keyof typeof LABEL, text: string, lines: string[] }[]} */
  const findings = [];

  /**
   * @param {keyof typeof LABEL} level
   * @param {string} text
   * @param {string[]} [lines] Detail, printed underneath.
   */
  function add(level, text, lines = []) {
    findings.push({ level, text, lines });
    const command = COMMAND[level];
    if (onGitHub && command) console.log(`::${command}::${escape(text)}`);
    else console.log(`${LABEL[level].padEnd(8)} ${text}`);
    for (const line of lines) console.log(`         ${line}`);
  }

  return {
    /** @param {string} text @param {string[]} [lines] */
    ok: (text, lines) => add('ok', text, lines),
    /** @param {string} text @param {string[]} [lines] */
    note: (text, lines) => add('note', text, lines),
    /** @param {string} text @param {string[]} [lines] */
    warning: (text, lines) => add('warning', text, lines),
    /** @param {string} text @param {string[]} [lines] */
    problem: (text, lines) => add('problem', text, lines),

    /** @param {keyof typeof LABEL} level */
    count: (level) => findings.filter((finding) => finding.level === level).length,

    /** Writes the list to the summary page of the run, when there is one. */
    finish() {
      const file = process.env.GITHUB_STEP_SUMMARY;
      if (!file) return;
      const rows = findings.map(
        ({ level, text, lines }) => `- **${LABEL[level]}** ${text}${lines.map((line) => `\n  - ${line.trim()}`).join('')}`,
      );
      appendFileSync(file, `### ${heading}\n\n${rows.join('\n')}\n\n`);
    },
  };
}
